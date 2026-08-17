import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Check,
  ChevronsUpDown,
  Compass,
  CircleUser,
  HelpCircle,
  LogOut,
  Moon,
  Search,
  Settings,
  Shield,
  Sun,
  UserRound,
} from "lucide-react";
import { Button } from "@staff/components/ui/button";
import { SidebarTrigger } from "@staff/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@staff/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@staff/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@staff/components/ui/dialog";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@staff/components/ui/command";
import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { Tooltip, TooltipContent, TooltipTrigger } from "@staff/components/ui/tooltip";
import { Separator } from "@staff/components/ui/separator";
import { Pill } from "@staff/components/shared/status-badge";
import { TOUR_EVENT } from "@staff/components/onboarding/onboarding-tour";
import { useLeads, useMyLeads } from "@staff/lib/leads";
import { useAgentDoc } from "@staff/lib/agents-data";
import {
  markAllNotificationsRead as markAllRead,
  markNotificationRead,
  useMyNotifications,
  type AppNotification,
} from "@staff/lib/notifications-data";
import { db } from "@staff/lib/firebase";
import { getMockStaffProfile, signOutUser, firebaseAuth } from "@staff/lib/auth";
import { cn } from "@staff/lib/utils";
import { relativeTime } from "@staff/lib/format";
import { toast } from "sonner";

/** Own `staffUsers/{uid}` doc — just for the admin greeting's display name (agents use useAgentDoc instead, which has richer profile data already). */
function useOwnUserProfile() {
  const uid = firebaseAuth.currentUser?.uid;
  return useQuery({
    queryKey: ["staffUsers", "own", uid],
    queryFn: async () => {
      const mockProfile = getMockStaffProfile();
      if (mockProfile) return { displayName: mockProfile.displayName, email: mockProfile.email ?? undefined };
      const snap = await getDoc(doc(db, "staffUsers", uid!));
      return snap.exists() ? (snap.data() as { displayName?: string; email?: string }) : null;
    },
    enabled: Boolean(uid),
  });
}

export function AppHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const portal: "admin" | "agent" = pathname.startsWith("/agent") ? "agent" : "admin";
  const navigate = useNavigate();
  const myUid = firebaseAuth.currentUser?.uid;
  const { data: agentProfile } = useAgentDoc(portal === "agent" ? myUid : undefined);
  const { data: ownProfile } = useOwnUserProfile();
  const { data: adminLeads = [] } = useLeads({ enabled: portal === "admin" });
  const { data: myLeadsData = [] } = useMyLeads();
  const leads = portal === "admin" ? adminLeads : myLeadsData;
  const { data: notifications = [], refetch: refetchNotifications } = useMyNotifications();
  const markAllNotificationsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    try {
      await markAllRead(unreadIds);
      await refetchNotifications();
    } catch {
      toast.error("Couldn't mark notifications read — try again.");
    }
  };
  const [open, setOpen] = useState(false);
  const [openNotification, setOpenNotification] = useState<AppNotification | null>(null);
  const [dark, setDark] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );

  const displayName =
    portal === "agent" ? (agentProfile?.name ?? "Agent") : (ownProfile?.displayName ?? ownProfile?.email ?? "Admin");
  const displaySubtext = portal === "agent" ? (agentProfile?.email ?? "") : (ownProfile?.email ?? "");
  const initials =
    portal === "agent"
      ? (agentProfile?.initials ?? "??")
      : displayName
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((n) => n[0]!.toUpperCase())
          .join("") || "AD";

  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    let savedTheme: string | null = null;

    try {
      savedTheme = window.localStorage.getItem("empirial-staff-theme");
    } catch {
      // Theme switching should still work when storage is unavailable.
    }

    const shouldUseDarkMode =
      savedTheme === "dark" ||
      (savedTheme === null && window.matchMedia("(prefers-color-scheme: dark)").matches);

    root.classList.toggle("dark", shouldUseDarkMode);
    setDark(shouldUseDarkMode);
  }, []);

  const toggleTheme = () => {
    setDark((current) => {
      const next = !current;
      document.documentElement.classList.toggle("dark", next);
      try {
        window.localStorage.setItem("empirial-staff-theme", next ? "dark" : "light");
      } catch {
        // Storage is optional; the active session still receives the change.
      }
      return next;
    });
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 bg-background/85 px-3 backdrop-blur-xl sm:px-5">
      <SidebarTrigger className="text-muted-foreground" />

      <button
        onClick={() => setOpen(true)}
        aria-label="Search leads, agents and scripts"
        className="group hidden h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-input bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted sm:flex sm:max-w-md"
      >
        <Search className="size-4 shrink-0" />
        <span className="truncate">Search leads, agents, scripts…</span>
        <kbd className="ml-auto hidden rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium sm:inline">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex min-w-0 items-center gap-1 sm:gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          aria-label="Search"
          onClick={() => setOpen(true)}
        >
          <Search className="size-4.5" />
        </Button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex"
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              onClick={toggleTheme}
            >
              {dark ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{dark ? "Light mode" : "Dark mode"}</TooltipContent>
        </Tooltip>


        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}>
              <Bell className="size-4.5" />
              {unread ? (
                <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-semibold text-destructive-foreground">
                  {unread}
                </span>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between px-3 py-2.5">
              <p className="text-sm font-semibold">Notifications</p>
              {unread > 0 ? (
                <button onClick={markAllNotificationsRead} className="text-xs text-primary hover:underline">
                  Mark all read
                </button>
              ) : null}
            </div>
            <Separator />
            <div className="max-h-80 overflow-y-auto scrollbar-slim">
              {notifications.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                  No notifications yet.
                </p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={async () => {
                      setOpenNotification(n);
                      if (n.read) return;
                      try {
                        await markNotificationRead(n.id);
                        await refetchNotifications();
                      } catch {
                        toast.error("Couldn't mark that notification read.");
                      }
                    }}
                    className={cn(
                      "flex w-full gap-3 border-b border-border/70 px-3 py-3 text-left last:border-0 hover:bg-muted/40",
                      !n.read && "bg-primary/[0.04]",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1 size-2 shrink-0 rounded-full",
                        n.tone === "success"
                          ? "bg-success"
                          : n.tone === "warning"
                            ? "bg-warning"
                            : "bg-info",
                      )}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{n.title}</p>
                      <p className="truncate text-xs leading-relaxed text-muted-foreground">{n.detail}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground/70">{relativeTime(n.at)}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full p-0.5 pr-1 transition-colors hover:bg-muted">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/12 text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <ChevronsUpDown className="hidden size-3.5 text-muted-foreground sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">{displayName}</span>
              <span className="text-xs font-normal text-muted-foreground">{displaySubtext}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => toast.info("Profile settings are mocked in this demo.")}>
              <UserRound className="size-4" /> My profile
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={portal === "admin" ? "/admin/settings" : "/agent/performance"}>
                <Settings className="size-4" /> {portal === "admin" ? "Settings" : "My performance"}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => window.dispatchEvent(new Event(TOUR_EVENT))}
            >
              <Compass className="size-4" /> Take the tour
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info("Docs coming soon.")}>
              <HelpCircle className="size-4" /> Help & docs
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                navigate({ to: portal === "admin" ? "/agent/dashboard" : "/admin/dashboard" })
              }
            >
              <Shield className="size-4" /> Switch to {portal === "admin" ? "Agent" : "Admin"} portal
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={async () => {
                await signOutUser();
                navigate({ to: "/login" });
              }}
            >
              <LogOut className="size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search leads, pages and agents…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Leads">
            {leads.slice(0, 6).map((l) => (
              <CommandItem
                key={l.id}
                value={`${l.business} ${l.contactPerson}`}
                onSelect={() => {
                  setOpen(false);
                  navigate({ to: "/agent/leads/$id", params: { id: l.id } });
                }}
              >
                <CircleUser className="size-4" />
                <span>{l.business}</span>
                <span className="ml-auto text-xs text-muted-foreground">{l.location}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Go to">
            {[
              { label: "Admin dashboard", to: "/admin/dashboard" },
              { label: "Lead management", to: "/admin/leads" },
              { label: "CRM pipeline", to: "/admin/pipeline" },
              { label: "Commissions", to: "/admin/commissions" },
              { label: "Agent dashboard", to: "/agent/dashboard" },
              { label: "AI assistant", to: "/agent/assistant" },
            ].map((p) => (
              <CommandItem
                key={p.to}
                value={p.label}
                onSelect={() => {
                  setOpen(false);
                  navigate({ to: p.to });
                }}
              >
                <Check className="size-4 opacity-0" />
                {p.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <Dialog open={!!openNotification} onOpenChange={(o) => !o && setOpenNotification(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  openNotification?.tone === "success"
                    ? "bg-success"
                    : openNotification?.tone === "warning"
                      ? "bg-warning"
                      : "bg-info",
                )}
              />
              <DialogTitle>{openNotification?.title}</DialogTitle>
            </div>
            <DialogDescription className="pt-1 text-sm leading-relaxed text-foreground/80">
              {openNotification?.detail}
            </DialogDescription>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            {openNotification ? relativeTime(openNotification.at) : null}
          </p>
        </DialogContent>
      </Dialog>
    </header>
  );
}
