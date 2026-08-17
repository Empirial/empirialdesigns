import { useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  createUserWithEmailAndPassword, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { startMockSession } from '@/lib/mockAuth';
import {
  ArrowLeft, Check, Eye, EyeOff, Lock, Mail, Rocket, Sparkles, User, Zap,
} from 'lucide-react';
import BrandIcon from '@/components/BrandIcon';

const IconArrowLeft = ArrowLeft as any;
const IconCheck = Check as any;
const IconEye = Eye as any;
const IconEyeOff = EyeOff as any;
const IconLock = Lock as any;
const IconMail = Mail as any;
const IconRocket = Rocket as any;
const IconSparkles = Sparkles as any;
const IconUser = User as any;
const IconZap = Zap as any;

const googleProvider = new GoogleAuthProvider();

/** Google's four-color "G" mark — lucide has no brand icon for it. */
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 18 18" aria-hidden="true">
    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.62Z" />
    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.81.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18Z" />
    <path fill="#FBBC05" d="M3.95 10.7a5.4 5.4 0 0 1 0-3.4V4.97H.98a9 9 0 0 0 0 8.06l2.97-2.33Z" />
    <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58Z" />
  </svg>
);

type SignUpStep = 1 | 2 | 3;

type Plan = { id: string; name: string; price: string; tagline: string; icon: any; highlight?: boolean };

const PLANS: Plan[] = [
  { id: 'starter', name: 'Starter', price: 'Free', tagline: '12 credits / month to explore the builder', icon: IconSparkles },
  { id: 'pro', name: 'Pro', price: 'R249/mo', tagline: 'Unlimited projects, priority AI, custom domains', icon: IconZap, highlight: true },
  { id: 'business', name: 'Business', price: 'R699/mo', tagline: 'Team seats, white-label, priority support', icon: IconRocket },
];

// App icon badge in the iOS/macOS "squircle" idiom — a rounded square with
// a soft shadow, standing in for the removed wordmark header.
const AppIconBadge = ({ size = 56 }: { size?: number }) => (
  <BrandIcon size={size} className="mx-auto shadow-[0_8px_24px_rgba(99,102,241,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]" />
);

const fieldWrapClass =
  'flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 backdrop-blur-xl transition-colors duration-200 focus-within:border-white/25';
const inputClass =
  'h-11 border-0 bg-transparent px-0 text-sm text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:ring-offset-0';
const pillButtonBase =
  'inline-flex items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [step, setStep] = useState<SignUpStep>(1);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // True once a brand-new account has authenticated via Google and is
  // parked on the plan-selection step — completeSignUp branches on this to
  // skip createUserWithEmailAndPassword since Auth already has a user.
  const [isGoogleFlow, setIsGoogleFlow] = useState(false);

  const [loading, setLoading] = useState(false);
  const [stepError, setStepError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const pendingPrompt = new URLSearchParams(location.search).get('prompt') || '';
  const destinationAfterAuth = pendingPrompt ? `/dashboard/chat?prompt=${encodeURIComponent(pendingPrompt)}` : '/dashboard';

  const switchMode = (signUp: boolean) => {
    setIsSignUp(signUp);
    setStep(1);
    setStepError('');
    setIsGoogleFlow(false);
  };

  const runMockLogin = (message: string) => {
    setLoading(true);
    setTimeout(() => {
      startMockSession();
      toast({ title: 'Mock login successful', description: message });
      setLoading(false);
      navigate(destinationAfterAuth);
    }, 600);
  };

  const validateStep = (targetStep: SignUpStep) => {
    if (targetStep === 1) {
      if (!firstName.trim() || !lastName.trim()) return 'Enter your first and last name.';
      if (!email.trim() || !email.includes('@')) return 'Enter a valid email address.';
    }
    if (targetStep === 2) {
      if (password.length < 6) return 'Password must be at least 6 characters.';
      if (password !== confirmPassword) return 'Passwords do not match.';
    }
    return '';
  };

  const goNext = () => {
    const error = validateStep(step);
    if (error) { setStepError(error); return; }
    setStepError('');
    setStep((s) => (s + 1) as SignUpStep);
  };

  const goBack = () => { setStepError(''); setStep((s) => (s - 1) as SignUpStep); };

  const completeSignUp = async () => {
    // Google flow: signInWithPopup already created + authenticated the Auth
    // user back in handleGoogleAuth. All that's left is the EMPIRIAL profile
    // doc, gated behind the plan choice they just made.
    let user = auth.currentUser;
    if (!isGoogleFlow || !user) {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      user = userCredential.user;
      const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
      await updateProfile(user, { displayName });
    }
    await setDoc(doc(db, 'users', user.uid), {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: user.email ?? email,
      plan: selectedPlan,
      created_at: new Date().toISOString(),
    });
    toast({ title: 'Welcome to EMPIRIAL', description: `Your ${PLANS.find((p) => p.id === selectedPlan)?.name} account is ready.` });
    navigate(destinationAfterAuth);
  };

  /**
   * One button for both tabs: Firebase Auth itself tells us whether this
   * Google identity is new or returning, so intent doesn't need to be
   * threaded through separately. Returning users (a `users/{uid}` doc
   * already exists) go straight to the dashboard. Brand-new users are
   * signed into Auth already but parked on the plan step — completeSignUp
   * (via isGoogleFlow) writes their profile doc only once a plan is chosen,
   * so nobody gets an EMPIRIAL account without picking a plan.
   */
  const handleGoogleAuth = async () => {
    setLoading(true);
    setStepError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const profileSnap = await getDoc(doc(db, 'users', user.uid));

      if (profileSnap.exists()) {
        toast({ title: 'Welcome back!', description: "You've successfully signed in." });
        navigate(destinationAfterAuth);
        return;
      }

      const [first, ...rest] = (user.displayName ?? '').trim().split(/\s+/);
      setFirstName(first ?? '');
      setLastName(rest.join(' '));
      setEmail(user.email ?? '');
      setIsGoogleFlow(true);
      setIsSignUp(true);
      setStep(3);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') return;
      const message = error.message ?? 'Something went wrong with Google sign-in.';
      setStepError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Demo shortcut: this email always resolves to a local mock session,
    // in sign-in and sign-up alike, so it works as a quick escape hatch.
    if (email === 'demo@empirial.com') { runMockLogin('Demo credentials recognized. Using a local session.'); return; }

    if (isSignUp && step < 3) { goNext(); return; }

    const error = isSignUp ? validateStep(3) || '' : '';
    if (error) { setStepError(error); return; }

    setLoading(true);
    setStepError('');
    try {
      if (isSignUp) {
        await completeSignUp();
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: 'Welcome back!', description: "You've successfully signed in." });
        navigate(destinationAfterAuth);
      }
    } catch (error: any) {
      let message = error.message;
      if (error.code === 'auth/email-already-in-use') message = 'Email already in use';
      if (error.code === 'auth/invalid-email') message = 'Invalid email address';
      if (error.code === 'auth/weak-password') message = 'Password should be at least 6 characters';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') message = 'Invalid email or password';
      setStepError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleMockIdentify = () => {
    setEmail('demo@empirial.com');
    setPassword('demo1234');
    toast({ title: 'Mock credentials loaded', description: 'Ready to test the login flow.' });
  };

  const title = isSignUp ? ['Create your details', 'Set a password', 'Choose your plan'][step - 1] : 'Welcome back';
  const subtitle = isSignUp
    ? ['Tell us a little about you', 'Keep your account secure', 'You can change this anytime'][step - 1]
    : pendingPrompt ? 'Sign in to start building' : 'Sign in to access your workspace';

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[#030303] font-sans text-white selection:bg-indigo-500/30">
      <div className="pointer-events-none absolute top-[8%] left-[18%] h-[38%] w-[38%] rounded-full bg-indigo-500/15 blur-[160px]" />
      <div className="pointer-events-none absolute bottom-[12%] right-[-8%] h-[46%] w-[46%] rounded-full bg-purple-500/15 blur-[160px]" />

      <div className="relative z-10 flex flex-1 items-center justify-center overflow-hidden p-4">
        <div className="flex w-full max-w-[400px] flex-col rounded-[32px] border border-white/10 bg-[#050505]/60 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-3xl">
          <AppIconBadge />

          {pendingPrompt && (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-indigo-400/20 bg-indigo-500/[0.07] px-3 py-2.5">
              <IconSparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-300" />
              <p className="text-xs leading-relaxed text-white/60">
                Continuing: <span className="text-white/85">&ldquo;{pendingPrompt}&rdquo;</span>
              </p>
            </div>
          )}

          <div className="mt-4 text-center">
            <h1 className="mb-1 text-xl font-semibold tracking-tight text-white">{title}</h1>
            <p className="text-xs text-white/40">{subtitle}</p>
          </div>

          {/* Pill segmented control */}
          <div className="mt-5 flex rounded-full border border-white/5 bg-black/40 p-1">
            <button
              type="button"
              onClick={() => switchMode(false)}
              className={`h-8 flex-1 rounded-full text-xs font-medium transition-colors duration-200 ${!isSignUp ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode(true)}
              className={`h-8 flex-1 rounded-full text-xs font-medium transition-colors duration-200 ${isSignUp ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}
            >
              Sign Up
            </button>
          </div>

          {/* Step progress — three pill segments */}
          {isSignUp && (
            <div className="mt-4 flex items-center gap-1.5">
              {[1, 2, 3].map((n) => (
                <span key={n} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${n <= step ? 'bg-indigo-400' : 'bg-white/10'}`} />
              ))}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="mt-5 space-y-3">
            {/* Sign in */}
            {!isSignUp && (
              <>
                <Field label="Email">
                  <IconMail className="h-3.5 w-3.5 shrink-0 text-white/30" />
                  <Input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
                </Field>
                <div>
                  <div className="mb-1.5 ml-1 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Password</span>
                    <a href="#" className="text-[10px] font-medium text-indigo-400/70 transition-colors duration-200 hover:text-indigo-300">Forgot?</a>
                  </div>
                  <div className={fieldWrapClass}>
                    <IconLock className="h-3.5 w-3.5 shrink-0 text-white/30" />
                    <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className={inputClass} />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="shrink-0 text-white/25 hover:text-white/50" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? <IconEyeOff className="h-3.5 w-3.5" /> : <IconEye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Sign up — step 1: details */}
            {isSignUp && step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-2.5">
                  <Field label="First name">
                    <IconUser className="h-3.5 w-3.5 shrink-0 text-white/30" />
                    <Input type="text" placeholder="Thabo" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Last name">
                    <Input type="text" placeholder="Mphela" value={lastName} onChange={(e) => setLastName(e.target.value)} className={`${inputClass} pl-0`} />
                  </Field>
                </div>
                <Field label="Email">
                  <IconMail className="h-3.5 w-3.5 shrink-0 text-white/30" />
                  <Input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                </Field>
              </>
            )}

            {/* Sign up — step 2: password */}
            {isSignUp && step === 2 && (
              <>
                <Field label="Password">
                  <IconLock className="h-3.5 w-3.5 shrink-0 text-white/30" />
                  <Input type={showPassword ? 'text' : 'password'} placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="shrink-0 text-white/25 hover:text-white/50" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <IconEyeOff className="h-3.5 w-3.5" /> : <IconEye className="h-3.5 w-3.5" />}
                  </button>
                </Field>
                <Field label="Confirm password">
                  <IconLock className="h-3.5 w-3.5 shrink-0 text-white/30" />
                  <Input type={showConfirm ? 'text' : 'password'} placeholder="Repeat your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)} className="shrink-0 text-white/25 hover:text-white/50" aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                    {showConfirm ? <IconEyeOff className="h-3.5 w-3.5" /> : <IconEye className="h-3.5 w-3.5" />}
                  </button>
                </Field>
              </>
            )}

            {/* Sign up — step 3: plan */}
            {isSignUp && step === 3 && (
              <div className="space-y-2">
                {PLANS.map((plan) => {
                  const PlanIcon = plan.icon;
                  const active = selectedPlan === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition-colors duration-200 ${active ? 'border-indigo-400/50 bg-indigo-500/10' : 'border-white/10 bg-white/[0.03] hover:border-white/20'}`}
                    >
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${active ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-white/40'}`}>
                        <PlanIcon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-white">{plan.name}</span>
                          {plan.highlight && <span className="rounded-full bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-indigo-300">Popular</span>}
                        </span>
                        <span className="block truncate text-[11px] text-white/40">{plan.tagline}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="text-xs font-semibold text-white/70">{plan.price}</span>
                        <span className={`grid h-[18px] w-[18px] place-items-center rounded-full border ${active ? 'border-indigo-400 bg-indigo-400' : 'border-white/20'}`}>
                          {active && <IconCheck className="h-3 w-3 text-black" />}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {stepError && <p className="rounded-full bg-red-500/10 px-3 py-1.5 text-center text-[11px] text-red-300">{stepError}</p>}

            <div className="flex items-center gap-2 pt-1">
              {/* Google flow lands straight on step 3 with no password step
                  behind it, so "back" has nothing to go back to. */}
              {isSignUp && step > 1 && !isGoogleFlow && (
                <button
                  type="button"
                  onClick={goBack}
                  aria-label="Back"
                  className={`${pillButtonBase} h-10 w-10 shrink-0 border border-white/10 bg-white/5 text-white/60 hover:bg-white/10`}
                >
                  <IconArrowLeft className="h-4 w-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className={`${pillButtonBase} h-10 flex-1 bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-gray-200`}
              >
                {loading ? 'Please wait…' : isSignUp ? (step < 3 ? 'Continue' : 'Create account') : 'Sign In'}
              </button>
            </div>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5" /></div>
            <div className="relative flex justify-center text-[9px] font-bold uppercase tracking-widest text-white/20">
              <span className="bg-[#050505] px-3">or</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {/* Only offered at the start of a flow — once Google has parked
                someone on the plan step, or they're mid-password-entry, a
                second identity choice would just be confusing. */}
            {(!isSignUp || step === 1) && (
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className={`${pillButtonBase} h-10 w-full gap-2.5 border border-white/10 bg-white/5 text-white hover:bg-white/10`}
              >
                <GoogleIcon className="h-4 w-4" />
                {isSignUp ? 'Sign up with Google' : 'Sign in with Google'}
              </button>
            )}
            <button
              type="button"
              onClick={() => runMockLogin('Welcome! You are using a temporary session.')}
              disabled={loading}
              className={`${pillButtonBase} h-10 w-full border border-white/10 bg-white/5 text-white hover:bg-white/10`}
            >
              🚀 Instant Mock Login
            </button>
            <button
              type="button"
              onClick={handleMockIdentify}
              className={`${pillButtonBase} h-9 w-full text-xs font-medium text-white/30 hover:bg-white/5 hover:text-white/50`}
            >
              Auto-fill Demo Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <span className="ml-1 block text-[10px] font-semibold uppercase tracking-widest text-white/30">{label}</span>
    <div className={fieldWrapClass}>{children}</div>
  </div>
);

export default Auth;
