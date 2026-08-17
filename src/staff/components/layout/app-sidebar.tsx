import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bot,
  BriefcaseBusiness,
  CalendarClock,
  FileText,
  Gauge,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  Settings,
  Upload,
  Users,
  MessageSquare,
  UserCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@staff/components/ui/sidebar";
import { Pill } from "@staff/components/shared/status-badge";
import { useLeads } from "@staff/lib/leads";
import { useMyFollowUps } from "@staff/lib/followups-data";
import { cn } from "@staff/lib/utils";
import { signOutUser } from "@staff/lib/auth";
import { Button } from "@staff/components/ui/button";
import empirialIcon from "@/assets/Brand ID/empirial-icon.png";

interface NavItem {
  title: string;
  to: string;
  icon: LucideIcon;
  badge?: "unassigned" | "followups";
}

const ADMIN_NAV: NavItem[] = [
  { title: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Leads", to: "/admin/leads", icon: BriefcaseBusiness, badge: "unassigned" },
  { title: "Import Leads", to: "/admin/import", icon: Upload },
  { title: "Agents", to: "/admin/agents", icon: Users },
  { title: "Messages", to: "/admin/messages", icon: MessageSquare },
  { title: "Pipeline", to: "/admin/pipeline", icon: KanbanSquare },
  { title: "Services", to: "/admin/services", icon: Package },
  { title: "Scripts", to: "/admin/scripts", icon: FileText },
  { title: "Commissions", to: "/admin/commissions", icon: Receipt },
  { title: "Reports", to: "/admin/reports", icon: BarChart3 },
];

const AGENT_NAV: NavItem[] = [
  { title: "Dashboard", to: "/agent/dashboard", icon: LayoutDashboard },
  { title: "My Leads", to: "/agent/leads", icon: BriefcaseBusiness },
  { title: "Follow-ups", to: "/agent/follow-ups", icon: CalendarClock, badge: "followups" },
  { title: "Messages", to: "/agent/messages", icon: MessageSquare },
  { title: "Scripts & Lessons", to: "/agent/scripts", icon: FileText },
  { title: "AI Assistant", to: "/agent/assistant", icon: Bot },
  { title: "Services", to: "/agent/services", icon: Package },
  { title: "Performance", to: "/agent/performance", icon: Gauge },
  { title: "My Profile", to: "/agent/profile", icon: UserCircle },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const portal = pathname.startsWith("/agent") ? "agent" : "admin";
  const items = portal === "agent" ? AGENT_NAV : ADMIN_NAV;
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { data: leads = [] } = useLeads({ enabled: portal === "admin" });
  const { data: followUps = [] } = useMyFollowUps({ enabled: portal === "agent" });

  const unassigned = leads.filter((l) => !l.assignedAgentId).length;
  const dueFollowUps = followUps.filter((f) => f.status === "Open" && new Date(f.dueAt) <= new Date()).length;

  const badgeValue = (badge?: NavItem["badge"]) => {
    if (badge === "unassigned") return unassigned || null;
    if (badge === "followups") return dueFollowUps || null;
    return null;
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-1">
        <Link
          to={portal === "agent" ? "/agent/dashboard" : "/admin/dashboard"}
          className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center"
        >
          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black shadow-[var(--shadow-card)] ring-1 ring-black/15 group-data-[collapsible=icon]:size-9">
            <img src={empirialIcon} alt="Empirial CRM" className="size-7 object-contain scale-[1.65]" />
          </span>
          {!collapsed ? (
            <span className="min-w-0">
              <span className="text-display block truncate text-sm font-semibold text-sidebar-foreground">
                Empirial CRM
              </span>
              <span className="block truncate text-[11px] text-sidebar-foreground/60">
                {portal === "agent" ? "Sales Agent Portal" : "Admin & Owner Portal"}
              </span>
            </span>
          ) : null}
        </Link>
      </SidebarHeader>

      <SidebarContent className="scrollbar-slim">
        <SidebarGroup>
          {!collapsed ? (
            <SidebarGroupLabel className="text-sidebar-foreground/50">
              {portal === "agent" ? "Workspace" : "Management"}
            </SidebarGroupLabel>
          ) : null}
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => {
                const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
                const badge = badgeValue(item.badge);
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title} className="h-9 rounded-lg">
                      <Link to={item.to} className="group/nav">
                        <item.icon
                          className={cn(
                            "size-4 shrink-0 transition-colors",
                            active ? "text-sidebar-primary" : "text-sidebar-foreground/60",
                          )}
                        />
                        <span className="truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
                        {badge && !collapsed ? (
                          <Pill tone="primary" size="sm" className="ml-auto">
                            {badge}
                          </Pill>
                        ) : null}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 pb-3 pt-2">
        <div className={cn("flex gap-1.5", collapsed && "flex-col")}>
          {portal === "admin" ? (
            <Button
              asChild
              type="button"
              variant="ghost"
              className="h-9 flex-1 justify-start gap-2 rounded-lg px-2 text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
              title="Settings"
            >
              <Link to="/admin/settings">
                <Settings className="size-4 shrink-0" />
                {!collapsed ? <span>Settings</span> : null}
              </Link>
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            className="h-9 flex-1 justify-start gap-2 rounded-lg px-2 text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
            title="Sign out"
            onClick={async () => {
              await signOutUser();
              navigate({ to: "/login" });
            }}
          >
            <LogOut className="size-4 shrink-0" />
            {!collapsed ? <span>Sign out</span> : null}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
