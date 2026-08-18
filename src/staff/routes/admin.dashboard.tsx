import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@staff/components/layout/app-shell";
import { PageHeader } from "@staff/components/shared/page-header";
import { KpiCard, KpiGrid } from "@staff/components/shared/kpi-card";
import { Button } from "@staff/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@staff/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@staff/components/ui/select";
import { useLeads } from "@staff/lib/leads";
import { useDeals } from "@staff/lib/deals-data";
import { useCallLogs } from "@staff/lib/call-logs-data";
import { useAgents } from "@staff/lib/agents-data";
import { useServices } from "@staff/lib/services-data";
import { formatZAR } from "@staff/lib/format";
import {
  ChevronRight,
  ClipboardList,
  Handshake,
  ListPlus,
  PhoneCall,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import {
  AddAgentDialog,
  AddLeadDialog,
  AssignLeadsDialog,
  TempPasswordDialog,
} from "./-admin-dashboard/dialogs";
import {
  LeadStatusBreakdownChart,
  RevenueCommissionChart,
  SalesPipelineChart,
} from "./-admin-dashboard/charts";
import {
  AgentLeaderboardPanel,
  RecentActivityPanel,
  RecentDealsPanel,
  TopServicesPanel,
  UpcomingFollowUpsPanel,
} from "./-admin-dashboard/panels";
import {
  greeting,
  useAllFollowUps,
  useDashboardMetrics,
  useOwnProfile,
  useRecentAuditLog,
} from "./-admin-dashboard/use-dashboard-data";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Meridian CRM" },
      {
        name: "description",
        content: "Executive overview of leads, agents, revenue and pipeline health.",
      },
      { property: "og:title", content: "Dashboard — Meridian CRM" },
      {
        property: "og:description",
        content: "Executive overview of leads, agents, revenue and pipeline health.",
      },
    ],
  }),
  component: PageAdminDashboard,
});

const RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "3m", label: "Last 3 months" },
];

function PageAdminDashboard() {
  const leadsQuery = useLeads();
  const agentsQuery = useAgents();
  const dealsQuery = useDeals();
  const servicesQuery = useServices();
  const followUpsQuery = useAllFollowUps();
  const profileQuery = useOwnProfile();
  const auditLogQuery = useRecentAuditLog();
  const callLogsQuery = useCallLogs();

  const leads = leadsQuery.data ?? [];
  const agents = agentsQuery.data ?? [];
  const deals = dealsQuery.data ?? [];
  const services = servicesQuery.data ?? [];
  const followUps = followUpsQuery.data ?? [];
  const auditLogEntries = auditLogQuery.data ?? [];
  const callLogs = callLogsQuery.data ?? [];

  const agentOf = (id: string) => agents.find((a) => a.id === id);
  const serviceOf = (id: string) => services.find((s) => s.id === id);

  const [range, setRange] = useState("30d");
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [addAgentOpen, setAddAgentOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [tempPasswordResult, setTempPasswordResult] = useState<{ email: string; tempPassword: string } | null>(null);

  const metrics = useDashboardMetrics(leads, agents, deals, services, followUps, callLogs);

  const pageLoading = leadsQuery.isLoading || agentsQuery.isLoading || dealsQuery.isLoading || servicesQuery.isLoading;

  if (pageLoading) {
    return (
      <AppShell>
        <PageHeader title="Dashboard" subtitle="Executive overview of leads, agents, revenue and pipeline health." />
        <div className="mt-6 text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        subtitle={`${greeting()}, ${(profileQuery.data?.displayName ?? "Admin").split(" ")[0]} — here's how Meridian is performing.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={() => setAddLeadOpen(true)}>
              <Plus className="size-4" />
              Add Lead
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Quick actions
                  <ChevronRight className="size-4 rotate-90" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem asChild>
                  <Link to="/admin/import">
                    <ListPlus className="size-4" />
                    Import Leads
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setAddAgentOpen(true)}>
                  <UserPlus className="size-4" />
                  Add Agent
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin/services">
                    <Sparkles className="size-4" />
                    Create Service
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setAssignOpen(true)}>
                  <Target className="size-4" />
                  Assign Leads
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <AddLeadDialog open={addLeadOpen} onOpenChange={setAddLeadOpen} />
      <AddAgentDialog open={addAgentOpen} onOpenChange={setAddAgentOpen} onCreated={setTempPasswordResult} />
      <TempPasswordDialog result={tempPasswordResult} onClose={() => setTempPasswordResult(null)} />
      <AssignLeadsDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        leads={metrics.unassignedLeads}
        agents={agents}
      />

      <div className="mt-6 space-y-6">
        <KpiGrid className="xl:grid-cols-4">
          <KpiCard label="Total Leads" value={metrics.totalLeads} icon={Users} tone="primary" />
          <KpiCard label="Assigned Leads" value={metrics.assignedLeads} icon={UserPlus} />
          <KpiCard label="Calls Today" value={metrics.callsToday} icon={PhoneCall} tone="success" />
          <KpiCard label="Interested Leads" value={metrics.interestedLeads} icon={Sparkles} />
          <KpiCard label="Follow-ups Due" value={metrics.followUpsDue} icon={ClipboardList} tone="warning" />
          <KpiCard label="Closed Deals" value={metrics.closedDeals} icon={Handshake} tone="success" />
          <KpiCard label="Revenue Generated" value={formatZAR(metrics.revenueGenerated, { compact: true })} icon={TrendingUp} tone="primary" />
          <KpiCard label="Outstanding Commissions" value={formatZAR(metrics.outstandingCommissions, { compact: true })} icon={Wallet} tone="danger" />
        </KpiGrid>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <SalesPipelineChart data={metrics.pipelineData} />
          <LeadStatusBreakdownChart data={metrics.statusBreakdown} />
          <RevenueCommissionChart data={metrics.revenueOverTime} />
          <TopServicesPanel items={metrics.topServices} />
          <AgentLeaderboardPanel rows={metrics.leaderboard} />
          <UpcomingFollowUpsPanel items={metrics.upcomingFollowUps} leads={leads} />
          <RecentDealsPanel deals={metrics.recentDeals} agentOf={agentOf} serviceOf={serviceOf} />
          <RecentActivityPanel entries={auditLogEntries} agentOf={agentOf} />
        </div>
      </div>
    </AppShell>
  );
}
