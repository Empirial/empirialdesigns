import { useMemo, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { collection, getDocs, orderBy, query, Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { AppShell } from "@staff/components/layout/app-shell";
import { PageHeader } from "@staff/components/shared/page-header";
import { EmptyState } from "@staff/components/shared/empty-state";
import { SectionCard, StatRow } from "@staff/components/shared/section-card";
import { KpiCard, KpiGrid } from "@staff/components/shared/kpi-card";
import { StatusBadge, PaymentBadge, Pill } from "@staff/components/shared/status-badge";
import { ActivityTimeline } from "@staff/components/shared/activity-timeline";
import { Avatar, AvatarFallback } from "@staff/components/ui/avatar";
import { Button } from "@staff/components/ui/button";
import { Switch } from "@staff/components/ui/switch";
import { Progress } from "@staff/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@staff/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@staff/components/ui/table";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  Users,
  PhoneCall,
  Handshake,
  TrendingUp,
  Wallet,
  ArrowLeft,
  MessageSquare,
  Repeat,
} from "lucide-react";
import { db } from "@staff/lib/firebase";
import { useAgentDoc } from "@staff/lib/agents-data";
import { useLeads } from "@staff/lib/leads";
import { useDeals } from "@staff/lib/deals-data";
import { useCallLogs, callsByWeekday } from "@staff/lib/call-logs-data";
import { useServices } from "@staff/lib/services-data";
import { callToggleAgentStatus } from "@staff/lib/functions";
import { formatZAR, formatDate, formatDateTime, initialsOf } from "@staff/lib/format";
import { computeAgentStats } from "@staff/components/agents-admin/agent-stats";
import type { Agent, ActivityItem } from "@staff/lib/types";

export const Route = createFileRoute("/admin/agents/$id")({
  head: () => ({
    meta: [
      { title: "Agent Profile — Meridian CRM" },
      { name: "description", content: "Detailed performance profile for a Meridian sales agent." },
      { property: "og:title", content: "Agent Profile — Meridian CRM" },
      { property: "og:description", content: "Detailed performance profile for a Meridian sales agent." },
    ],
  }),
  component: PageAdminAgentsId,
});

function PageAdminAgentsId() {
  const { id } = useParams({ from: "/admin/agents/$id" });
  const { data: agent, isLoading, error } = useAgentDoc(id);

  if (isLoading) {
    return (
      <AppShell>
        <PageHeader
          title="Agent Profile"
          crumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Agents", to: "/admin/agents" }]}
        />
        <div className="mt-6 text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }

  if (error || !agent) {
    return (
      <AppShell>
        <PageHeader
          title="Agent not found"
          crumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Agents", to: "/admin/agents" }, { label: "Not found" }]}
        />
        <div className="mt-6">
          <EmptyState
            icon={Users}
            title="We couldn't find this agent"
            description="They may have been removed, or the link is incorrect."
            action={
              <Button asChild>
                <Link to="/admin/agents">
                  <ArrowLeft className="size-4" />
                  Back to agents
                </Link>
              </Button>
            }
          />
        </div>
      </AppShell>
    );
  }

  return <AgentProfile agent={agent} />;
}

// Fetches one lead's activities subcollection — mirrors useLeadActivities()
// in src/lib/leads.ts, duplicated locally so it can be driven by useQueries()
// over a dynamic, per-agent list of lead ids (hooks can't be called in a loop).
async function fetchLeadActivities(leadId: string): Promise<ActivityItem[]> {
  const snap = await getDocs(
    query(collection(db, "leads", leadId, "activities"), orderBy("at", "desc")),
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      type: data.type,
      title: data.title,
      ...(data.detail ? { detail: data.detail as string } : {}),
      actor: data.actor,
      at: data.at instanceof Timestamp ? data.at.toDate().toISOString() : new Date().toISOString(),
    } satisfies ActivityItem;
  });
}

function AgentProfile({ agent }: { agent: Agent }) {
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: deals = [], isLoading: dealsLoading } = useDeals();
  const { data: services = [] } = useServices();
  const { data: callLogs = [] } = useCallLogs();
  const queryClient = useQueryClient();
  const [toggling, setToggling] = useState(false);

  const stats = useMemo(() => computeAgentStats(agent, leads, deals, callLogs), [agent, leads, deals, callLogs]);
  const serviceOf = (id: string) => services.find((s) => s.id === id) ?? null;

  async function handleToggleStatus() {
    setToggling(true);
    try {
      await callToggleAgentStatus({ agentId: agent.id });
      await queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success(`${agent.name} is now ${agent.status === "Active" ? "inactive" : "active"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update that agent — try again.");
    } finally {
      setToggling(false);
    }
  }

  const callsPerDay = useMemo(() => {
    const weekly = callsByWeekday(callLogs, agent.id);
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => ({ day, calls: weekly[i] ?? 0 }));
  }, [agent, callLogs]);

  const revenueByMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of stats.deals) {
      const m = new Date(d.closedAt).toLocaleDateString("en-ZA", { month: "short" });
      map.set(m, (map.get(m) ?? 0) + d.value);
    }
    return Array.from(map.entries()).map(([month, revenue]) => ({ month, revenue }));
  }, [stats.deals]);

  // Activities live in a per-lead subcollection, so "recent activity across
  // this agent's whole book" isn't a single query. Simplification: fetch full
  // activity history for only the 5 most-recently-touched leads, merge and
  // re-sort, cap at 10 — bounded and simple rather than N reads for every lead.
  const recentTouchedLeads = useMemo(
    () =>
      [...stats.leads]
        .sort((a, b) => {
          const at = new Date(a.lastContact ?? a.createdAt).getTime();
          const bt = new Date(b.lastContact ?? b.createdAt).getTime();
          return bt - at;
        })
        .slice(0, 5),
    [stats.leads],
  );

  const activityQueries = useQueries({
    queries: recentTouchedLeads.map((l) => ({
      queryKey: ["leads", "activities", l.id],
      queryFn: () => fetchLeadActivities(l.id),
      enabled: Boolean(l.id),
    })),
  });

  const activityItems = useMemo(() => {
    const businessById = new Map(recentTouchedLeads.map((l) => [l.id, l.business]));
    return activityQueries
      .flatMap((q, i) => {
        const leadId = recentTouchedLeads[i]?.id;
        const business = (leadId && businessById.get(leadId)) || "";
        return (q.data ?? []).map((a) => ({
          ...a,
          title: business ? `${a.title} — ${business}` : a.title,
        }));
      })
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 10);
  }, [activityQueries, recentTouchedLeads]);

  // Real (if rough) aggregation of this agent's lost leads by exact
  // free-text reason match — replaces the previous bug where this chart
  // showed the global mock lostReasons array instead of this agent's data.
  const lostReasons = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of stats.leads) {
      if (!l.lostReason) continue;
      counts.set(l.lostReason, (counts.get(l.lostReason) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);
  }, [stats.leads]);

  const targetPct = Math.min(100, Math.round((stats.revenue / Math.max(1, agent.monthlyTarget)) * 100));

  const connectRate = stats.leadsCount > 0 ? Math.round((stats.interested / stats.leadsCount) * 100) : 0;

  if (leadsLoading || dealsLoading) {
    return (
      <AppShell>
        <PageHeader
          title={agent.name}
          subtitle={agent.role}
          crumbs={[
            { label: "Admin", to: "/admin/dashboard" },
            { label: "Agents", to: "/admin/agents" },
            { label: agent.name },
          ]}
        />
        <div className="mt-6 text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title={agent.name}
        subtitle={agent.role}
        crumbs={[
          { label: "Admin", to: "/admin/dashboard" },
          { label: "Agents", to: "/admin/agents" },
          { label: agent.name },
        ]}
      />

      <div className="mt-6 space-y-6">
        <div className="surface-card flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarFallback className="bg-primary/12 text-lg font-semibold text-primary">
                {initialsOf(agent.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-display text-lg font-semibold">{agent.name}</h2>
              <p className="text-sm text-muted-foreground">
                {agent.role} · {agent.email} · {agent.phone}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Joined {formatDate(agent.joinedAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
              <span
                className={`size-2 rounded-full ${agent.status === "Active" ? "bg-success" : "bg-muted-foreground"}`}
              />
              {agent.status}
              <Switch
                checked={agent.status === "Active"}
                disabled={toggling}
                onCheckedChange={handleToggleStatus}
              />
            </div>
            <Button variant="outline" onClick={() => toast.info(`Reassign leads for ${agent.name} — coming soon`)}>
              <Repeat className="size-4" />
              Reassign leads
            </Button>
            <Button asChild>
              <Link to="/admin/messages" search={{ agent: agent.id }}>
                <MessageSquare className="size-4" />
                Message
              </Link>
            </Button>
          </div>
        </div>

        <KpiGrid>
          <KpiCard label="Leads assigned" value={stats.leadsCount} icon={Users} tone="primary" />
          <KpiCard label="Calls today" value={stats.callsToday} icon={PhoneCall} />
          <KpiCard label="Connect rate" value={`${connectRate}%`} icon={TrendingUp} />
          <KpiCard label="Conversion" value={`${stats.conversion}%`} icon={TrendingUp} tone="success" />
        </KpiGrid>
        <KpiGrid>
          <KpiCard label="Interested" value={stats.interested} icon={Handshake} />
          <KpiCard label="Deals closed" value={stats.closedWon} icon={Handshake} tone="success" />
          <KpiCard label="Revenue" value={formatZAR(stats.revenue, { compact: true })} icon={Wallet} />
          <KpiCard
            label="Commission earned"
            value={formatZAR(stats.commission, { compact: true })}
            icon={Wallet}
            tone="warning"
          />
        </KpiGrid>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="deals">Deals</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-5 space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <SectionCard title="Calls per day" description="This week">
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={callsPerDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="day" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" />
                      <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" />
                      <Tooltip
                        contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "12px" }}
                      />
                      <Bar dataKey="calls" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
              <SectionCard title="Monthly target">
                <div className="space-y-3">
                  <StatRow label="Target" value={formatZAR(agent.monthlyTarget)} />
                  <StatRow label="Achieved" value={formatZAR(stats.revenue)} />
                  <Progress value={targetPct} />
                  <p className="text-xs text-muted-foreground">{targetPct}% of monthly target reached</p>
                </div>
              </SectionCard>
            </div>
            <SectionCard title="Payout banking details" description="Set by the agent from their own profile page">
              {agent.bankName || agent.accountNumber || agent.branchCode ? (
                <div className="space-y-3">
                  <StatRow label="Bank" value={agent.bankName || "—"} />
                  <StatRow label="Account number" value={agent.accountNumber || "—"} />
                  <StatRow label="Branch code" value={agent.branchCode || "—"} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">This agent hasn't added their banking details yet.</p>
              )}
            </SectionCard>
            <SectionCard title="Recent activity" noPadding>
              <div className="p-5">
                {activityItems.length > 0 ? (
                  <ActivityTimeline items={activityItems} />
                ) : (
                  <EmptyState compact icon={Users} title="No activity yet" />
                )}
              </div>
            </SectionCard>
          </TabsContent>

          <TabsContent value="leads" className="mt-5">
            <SectionCard title="Assigned leads" noPadding>
              {stats.leads.length === 0 ? (
                <div className="p-5">
                  <EmptyState compact icon={Users} title="No leads assigned" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead>Next follow-up</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.leads.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.business}</TableCell>
                        <TableCell>
                          <StatusBadge status={l.status} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatZAR(l.value)}</TableCell>
                        <TableCell>{l.nextFollowUp ? formatDateTime(l.nextFollowUp) : "—"}</TableCell>
                        <TableCell>
                          <Button asChild variant="ghost" size="sm">
                            <Link to="/admin/leads" search={{ leadId: l.id } as never}>
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </SectionCard>
          </TabsContent>

          <TabsContent value="deals" className="mt-5">
            <SectionCard title="Closed deals" noPadding>
              {stats.deals.length === 0 ? (
                <div className="p-5">
                  <EmptyState compact icon={Handshake} title="No deals closed yet" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Closed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.deals.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.business}</TableCell>
                        <TableCell>{serviceOf(d.serviceId)?.name ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatZAR(d.value)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatZAR(d.commission)}</TableCell>
                        <TableCell>
                          <PaymentBadge status={d.paymentStatus} />
                        </TableCell>
                        <TableCell>{formatDate(d.closedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </SectionCard>
          </TabsContent>

          <TabsContent value="commissions" className="mt-5 space-y-5">
            <KpiGrid>
              <KpiCard label="Total earned" value={formatZAR(stats.commission)} icon={Wallet} tone="primary" />
              <KpiCard label="Paid out" value={formatZAR(stats.commissionPaid)} icon={Wallet} tone="success" />
              <KpiCard
                label="Outstanding"
                value={formatZAR(stats.commissionOutstanding)}
                icon={Wallet}
                tone="warning"
              />
            </KpiGrid>
            <SectionCard title="Monthly breakdown" noPadding>
              {revenueByMonth.length === 0 ? (
                <div className="p-5">
                  <EmptyState compact icon={Wallet} title="No commission history" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Est. commission</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenueByMonth.map((r) => (
                      <TableRow key={r.month}>
                        <TableCell>{r.month}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatZAR(r.revenue)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatZAR(Math.round(r.revenue * 0.1))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </SectionCard>
          </TabsContent>

          <TabsContent value="performance" className="mt-5 space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <SectionCard title="Conversion funnel">
                <div className="space-y-3">
                  <FunnelRow label="Assigned" value={stats.leadsCount} max={stats.leadsCount} />
                  <FunnelRow label="Interested" value={stats.interested} max={stats.leadsCount} />
                  <FunnelRow label="Closed won" value={stats.closedWon} max={stats.leadsCount} />
                  <FunnelRow label="Closed lost" value={stats.closedLost} max={stats.leadsCount} tone="danger" />
                </div>
              </SectionCard>
              <SectionCard title="Revenue trend">
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueByMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="month" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" />
                      <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" />
                      <Tooltip
                        contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "12px" }}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
            </div>
            <SectionCard title="Lost reasons" description="Across this agent's book">
              {lostReasons.length === 0 ? (
                <EmptyState compact icon={Handshake} title="Not enough data yet" />
              ) : (
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={lostReasons} layout="vertical" margin={{ left: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" />
                      <YAxis
                        type="category"
                        dataKey="reason"
                        width={140}
                        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                        stroke="var(--border)"
                      />
                      <Tooltip
                        contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "12px" }}
                      />
                      <Bar dataKey="count" fill="var(--chart-3)" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </SectionCard>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function FunnelRow({
  label,
  value,
  max,
  tone = "primary",
}: {
  label: string;
  value: number;
  max: number;
  tone?: "primary" | "danger";
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${tone === "danger" ? "bg-destructive" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
