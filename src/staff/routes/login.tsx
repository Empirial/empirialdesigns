import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FirebaseError } from "firebase/app";
import { AlertCircle, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";

import { Button } from "@staff/components/ui/button";
import { Input } from "@staff/components/ui/input";
import { Label } from "@staff/components/ui/label";
import { Alert, AlertDescription } from "@staff/components/ui/alert";
import {
  isAdminAlreadyBootstrapped,
  establishStaffSession,
  signInWithGoogle,
  signInWithPassword,
  signOutUser,
  signUpBootstrapAdmin,
  startMockStaffSession,
  waitForOwnProfile,
  type AppRole,
} from "@staff/lib/auth";
import EmpirialIcon from "@/assets/Brand ID/empirial-icon.png";

interface LoginSearch {
  // Explicit `| undefined`: exactOptionalPropertyTypes means `redirect?: string`
  // alone would reject the ternary below, which can produce `undefined`.
  redirect?: string | undefined;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [{ title: "Sign in — Empirial CRM" }],
  }),
  component: LoginPage,
});

const DASHBOARD_BY_ROLE: Record<AppRole, string> = {
  admin: "/admin/dashboard",
  agent: "/agent/dashboard",
};

const authFieldClass =
  "flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-5 shadow-sm transition-colors focus-within:border-teal-500 focus-within:bg-white";
const authInputClass =
  "h-12 border-0 bg-transparent px-0 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0";

/** Friendlier text for the Firebase Auth error codes people will actually hit here. */
function describeAuthError(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "That email or password isn't right.";
      case "auth/user-disabled":
        return "This account has been disabled. Contact your administrator for access.";
      case "auth/email-already-in-use":
        return "An account with that email already exists — try signing in instead.";
      case "auth/weak-password":
        return "Choose a password with at least 6 characters.";
      case "auth/invalid-email":
        return "Enter a valid email address.";
      case "auth/too-many-requests":
        return "Too many attempts — wait a moment and try again.";
      default:
        return error.message;
    }
  }
  return "Something went wrong. Please try again.";
}

/** Google's four-color "G" mark — lucide has no brand icon for it. */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.81.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.95 10.7a5.4 5.4 0 0 1 0-3.4V4.97H.98a9 9 0 0 0 0 8.06l2.97-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58Z" />
    </svg>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();

  const [checkingBootstrap, setCheckingBootstrap] = useState(true);
  const [bootstrapped, setBootstrapped] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginRole, setLoginRole] = useState<AppRole>("admin");
  const [submitting, setSubmitting] = useState(false);
  const [settlingIn, setSettlingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    isAdminAlreadyBootstrapped().then((value) => {
      if (!cancelled) {
        setBootstrapped(value);
        setCheckingBootstrap(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const isSetupMode = !checkingBootstrap && !bootstrapped;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (isSetupMode && password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      const user = isSetupMode
        ? await signUpBootstrapAdmin(email, password)
        : await signInWithPassword(email, password);

      // The account exists in Firebase Auth at this point, but onUserCreate
      // (Cloud Function) provisions the users/{uid} doc + role asynchronously
      // right after — waitForOwnProfile retries briefly to bridge that gap.
      setSubmitting(false);
      setSettlingIn(true);
      const profile = await waitForOwnProfile(user.uid);

      if (!profile) {
        setSettlingIn(false);
        setError(
          isSetupMode
            ? "Your account was created, but we couldn't finish setting it up. Try signing in again in a moment."
            : "We couldn't load your account yet. Try again in a moment.",
        );
        return;
      }

      if (!isSetupMode && profile.role !== loginRole) {
        await signOutUser();
        setSettlingIn(false);
        setError(`This account is an ${profile.role} account. Choose the ${profile.role} tab to sign in.`);
        return;
      }

      establishStaffSession(profile);
      navigate({ to: redirect || DASHBOARD_BY_ROLE[profile.role] });
    } catch (err) {
      setSubmitting(false);
      setSettlingIn(false);
      setError(describeAuthError(err));
    }
  }

  /**
   * Shares the post-auth settle logic with handleSubmit (waitForOwnProfile,
   * role check, session establish) since Google sign-in and password sign-in
   * land in the exact same place once Firebase Auth has a user — only how
   * that user was authenticated differs.
   */
  async function handleGoogleAuth() {
    setError(null);
    setSubmitting(true);
    try {
      const user = await signInWithGoogle();
      setSubmitting(false);
      setSettlingIn(true);
      const profile = await waitForOwnProfile(user.uid);

      if (!profile) {
        setSettlingIn(false);
        setError(
          "This Google account has no staff profile yet. Ask an admin to invite you, or sign in with email instead.",
        );
        return;
      }

      if (!isSetupMode && profile.role !== loginRole) {
        await signOutUser();
        setSettlingIn(false);
        setError(`This account is an ${profile.role} account. Choose the ${profile.role} tab to sign in.`);
        return;
      }

      establishStaffSession(profile);
      navigate({ to: redirect || DASHBOARD_BY_ROLE[profile.role] });
    } catch (err) {
      setSubmitting(false);
      setSettlingIn(false);
      setError(describeAuthError(err));
    }
  }

  function handleMockLogin(role: AppRole) {
    const profile = startMockStaffSession(role);
    navigate({ to: redirect || DASHBOARD_BY_ROLE[profile.role] });
  }

  const busy = submitting || settlingIn;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f8fc] px-4 py-6 font-sans text-slate-950 selection:bg-teal-200">
      <div className="pointer-events-none absolute left-[18%] top-[8%] h-[38%] w-[38%] rounded-full bg-teal-300/25 blur-[160px]" aria-hidden />
      <div className="pointer-events-none absolute bottom-[12%] right-[-8%] h-[46%] w-[46%] rounded-full bg-indigo-300/25 blur-[160px]" aria-hidden />

      <div className="relative w-full max-w-[400px] rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur-3xl sm:p-9">
        <div className="mx-auto flex size-14 items-center justify-center overflow-hidden rounded-[16px] bg-slate-950 shadow-[0_8px_24px_rgba(79,70,229,0.25)] ring-1 ring-slate-200">
          <img src={EmpirialIcon} alt="Empirial" className="h-full w-full object-contain p-2" />
        </div>
        <div className="mt-5 text-center">
          <h1 className="text-display text-2xl font-semibold tracking-tight text-slate-950">{isSetupMode ? "Create your admin account" : `Welcome back, ${loginRole}`}</h1>
          <p className="mt-1 text-sm text-slate-500">{isSetupMode ? "The first account created becomes the owner/admin." : `Sign in to access the ${loginRole} workspace`}</p>
        </div>
        <div className="mt-6 flex rounded-full border border-slate-200 bg-slate-100 p-1 text-center text-xs font-semibold">
          {isSetupMode ? (
            <span className="block flex-1 rounded-full bg-white py-2 text-slate-900 shadow-sm">Admin setup</span>
          ) : (
            <>
              <button type="button" onClick={() => setLoginRole("admin")} className={`flex-1 rounded-full py-2 transition-colors ${loginRole === "admin" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>Admin</button>
              <button type="button" onClick={() => setLoginRole("agent")} className={`flex-1 rounded-full py-2 transition-colors ${loginRole === "agent" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>Agent</button>
            </>
          )}
        </div>
        <div className="mt-5">
          {checkingBootstrap ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : (
            <>
              <div className="hidden">
                <h1 className="text-display flex items-center gap-2 text-lg font-semibold">
                  {isSetupMode && <ShieldCheck className="size-5 text-primary" />}
                  {isSetupMode ? "Set up your admin account" : "Sign in"}
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {isSetupMode
                    ? "No admin account exists yet — the first account created here becomes the owner/admin."
                    : "Enter your email and password to continue."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="ml-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Email</Label>
                  <div className={authFieldClass}>
                    <Mail className="size-4 shrink-0 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={busy}
                    className={authInputClass}
                  />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="ml-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Password {!isSetupMode && <span className="normal-case tracking-normal text-indigo-600">{loginRole} access</span>}</Label>
                  <div className={authFieldClass}>
                    <Lock className="size-4 shrink-0 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isSetupMode ? "new-password" : "current-password"}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={busy}
                    className={authInputClass}
                  />
                    <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="text-slate-400 transition-colors hover:text-slate-700" aria-label={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                {isSetupMode && (
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword" className="ml-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Confirm password</Label>
                    <div className={authFieldClass}>
                      <Lock className="size-4 shrink-0 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={busy}
                      className={authInputClass}
                    />
                      <button type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} className="text-slate-400 transition-colors hover:text-slate-700" aria-label={showConfirmPassword ? "Hide password" : "Show password"}>
                        {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="mt-3 h-12 w-full rounded-full bg-slate-950 font-semibold text-white shadow-[0_8px_20px_rgba(15,23,42,0.18)] hover:bg-slate-800" disabled={busy}>
                  {settlingIn
                    ? "Setting up your account…"
                    : submitting
                      ? "Please wait…"
                      : isSetupMode
                        ? "Create admin account"
                        : "Sign in"}
                </Button>

                <div className="relative my-1">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
                  <div className="relative flex justify-center text-[9px] font-bold uppercase tracking-widest text-slate-400">
                    <span className="bg-white px-3">or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleAuth}
                  disabled={busy}
                  className="h-12 w-full gap-2.5 rounded-full border-slate-200 bg-white font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                >
                  <GoogleIcon className="size-4" />
                  {isSetupMode ? "Create admin account with Google" : "Continue with Google"}
                </Button>

                {import.meta.env.DEV && (
                  <div className="mt-4 border-t border-slate-200 pt-5">
                    <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Local development access
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleMockLogin("admin")}
                        disabled={busy}
                        className="h-11 rounded-full border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100 hover:text-slate-950"
                      >
                        Demo admin
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleMockLogin("agent")}
                        disabled={busy}
                        className="h-11 rounded-full border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100 hover:text-slate-950"
                      >
                        Demo agent
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
