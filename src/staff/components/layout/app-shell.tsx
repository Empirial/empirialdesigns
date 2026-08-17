import { SidebarInset, SidebarProvider } from "@staff/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { OnboardingTour } from "@staff/components/onboarding/onboarding-tour";
import { cn } from "@staff/lib/utils";

export function AppShell({
  children,
  className,
  fullBleed,
}: {
  children: React.ReactNode;
  className?: string;
  fullBleed?: boolean;
}) {
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
