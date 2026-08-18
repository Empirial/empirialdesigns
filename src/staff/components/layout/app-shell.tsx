import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@staff/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { OnboardingTour } from "@staff/components/onboarding/onboarding-tour";
import { firebaseAuth, touchAgentActivity } from "@staff/lib/auth";
import { cn } from "@staff/lib/utils";

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Keeps an agent's lastActiveAt fresh while they actually have the app
 * open, so the autoOfflineIdleAgents scheduled function (functions-staff)
 * only flips genuinely-idle sessions to offline, not someone mid-shift.
 * online:true itself is set once at sign-in (establishStaffSession) — this
 * only ever touches lastActiveAt.
 */
function useAgentHeartbeat() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAgentPortal = pathname.startsWith("/agent");

  useEffect(() => {
    if (!isAgentPortal) return;
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) return;

    touchAgentActivity(uid);
    const interval = window.setInterval(() => touchAgentActivity(uid), HEARTBEAT_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [isAgentPortal]);
}

export function AppShell({
  children,
  className,
  fullBleed,
}: {
  children: React.ReactNode;
  className?: string;
  fullBleed?: boolean;
}) {
  useAgentHeartbeat();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="min-w-0 flex-1 bg-background">
          <AppHeader />
          <main
            className={cn(
              fullBleed ? "p-0" : "mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8",
              className,
            )}
          >
            {children}
          </main>
          <OnboardingTour />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
