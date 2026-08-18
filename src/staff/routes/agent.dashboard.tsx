import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Phone,
  Users,
  PhoneOff,
  PhoneCall,
  ThumbsUp,
  CalendarClock,
  Trophy,
  Wallet,
  ArrowRight,
  Target,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { AppShell } from "@staff/components/layout/app-shell";
import { PageHeader } from "@staff/components/shared/page-header";
import { KpiCard, KpiGrid } from "@staff/components/shared/kpi-card";
import { SectionCard } from "@staff/components/shared/section-card";
import { EmptyState } from "@staff/components/shared/empty-state";
import { StatusBadge } from "@staff/components/shared/status-badge";
import { Button } from "@staff/components/ui/button";
import { Switch } from "@staff/components/ui/switch";
import { Progress } from "@staff/components/ui/progress";
import { useAgentDoc } from "@staff/lib/agents-data";
import { useMyLeads } from "@staff/lib/leads";
import { useMyDeals } from "@staff/lib/deals-data";
import { useMyCallLogs, countCallsToday, callsByWeekday } from "@staff/lib/call-logs-data";
import { useMyFollowUps } from "@staff/lib/followups-data";
import { callGetTeamLeaderboard } from "@staff/lib/functions";
import { firebaseAuth, getMockStaffProfile } from "@staff/lib/auth";
import { db } from "@staff/lib/firebase";
import { formatZAR, formatTime, isOverdue, isToday, relativeTime } from "@staff/lib/format";
import { useState } from "react";

const AGENT_CHART_COLORS = {
  primary: "hsl(var(--chart-1))",
  border: "hsl(var(--border))",
  muted: "hsl(var(--muted-foreground))",
  card: "hsl(var(--card))",
};

export const Route = createFileRoute("/agent/dashboard")({
  head: () => ({
    meta: [
      { title: "My Dashboard — Meridian CRM" },
      {
        name: "description",
        content: "Your daily cockpit: today's calls, follow-ups, KPIs and commission progress.",
      },
      { property: "og:title", content: "My Dashboard — Meridian CRM" },
      {
        property: "og:description",
        content: "Your daily cockpit: today's calls, follow-ups, KPIs and commission progress.",
      },
    ],
  }),
  component: PageAgentDashboard,
});

function PageAgentDashboard() {
  const myUid = firebaseAuth.currentUser?.uid;
  const mockProfile = getMockStaffProfile();
  const queryClient = useQueryClient();
  const { data: agent, isLoading: agentLoading } = useAgentDoc(myUid);
  const { data: myLeads = [], isLoading: leadsLoading } = useMyLeads();
  const { data: deals = [], isLoading: dealsLoading } = useMyDeals();
  const { data: followUps = [], isLoading: followUpsLoading } = useMyFollowUps();
  const { data: myCallLogs = [] } = useMyCallLogs(myUid);
  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => (mockProfile ? [] : (await callGetTeamLeaderboard()).data.leaderboard),
  });
  const [onlinePending, setOnlinePending] = useState(false);

  const isLoading =
    agentLoading || leadsLoading || dealsLoading || followUpsLoading || leaderboardLoading;

  if (isLoading || !agent) {
    return (
      <AppShell>
        <PageHeader
          title="My Dashboard"
          subtitle="Your cockpit for the day — leads to call, follow-ups due and progress toward target."
          crumbs={[{ label: "Agent", to: "/agent/dashboard" }, { label: "Dashboard" }]}
        />
        <div className="mt-6 text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }

  const online = agent.online ?? false;

  async function handleOnlineToggle(checked: boolean) {
    if (!myUid || mockProfile) return;
    setOnlinePending(true);
    try {
      await updateDoc(doc(db, "agents", myUid), { online: checked });
      await queryClient.invalidateQueries({ queryKey: ["agents"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update your status — try again.");
    } finally {
      setOnlinePending(false);
    }
  }

  const notCalled = myLeads.filter(
    (l) => l.status === "Not Called" || l.status === "Assigned" || l.status === "New",
  );
  const interested = myLeads.filter((l) => l.status === "Interested");
  const myFollowUps = followUps.filter((f) => f.status === "Open");
  const followUpsToday = myFollowUps.filter((f) => isToday(f.dueAt) || isOverdue(f.dueAt));

  const now = new Date();
  const myDeals = deals.filter(
    (d) =>
      new Date(d.closedAt).getMonth() === now.getMonth() &&
      new Date(d.closedAt).getFullYear() === now.getFullYear(),
  );
  const revenue = myDeals.reduce((s, d) => s + d.value, 0);
  const commission = myDeals.reduce((s, d) => s + d.commission, 0);

  const dailyTarget = Math.max(1, Math.round(agent.targetDeals / 20));
  // Real, from callLogs (written by logCall()) — agent.callsToday is never
  // incremented by anything and is always 0 in production.
  const callsToday = countCallsToday(myCallLogs);
  const callProgress = Math.min(100, Math.round((callsToday / (dailyTarget * 5)) * 100));

  const overdueFollowUps = myFollowUps.filter((f) => isOverdue(f.dueAt));
  const queue = [
    ...overdueFollowUps.map((f) => ({ lead: myLeads.find((l) => l.id === f.leadId), followUp: f })),
    ...notCalled.map((l) => ({ lead: l, followUp: undefined })),
  ]
    .filter((q) => q.lead)
    .slice(0, 6) as { lead: (typeof myLeads)[number]; followUp?: (typeof followUps)[number] }[];

  const firstUncalled = notCalled[0];

  const recentlyContacted = [...myLeads]
    .filter((l) => l.lastContact)
    .sort((a, b) => +new Date(b.lastContact!) - +new Date(a.lastContact!))
    .slice(0, 5);

  const myLeaderboardRow = leaderboard.find((r) => r.agentId === myUid);
  const myRank = myLeaderboardRow?.rank;

  const funnelStages: { label: string; count: number }[] = [
    { label: "Total", count: myLeads.length },
    {
      label: "Called",
      count: myLeads.filter(
        (l) => l.status !== "Not Called" && l.status !== "New" && l.status !== "Assigned",
      ).length,
    },
    { label: "Interested", count: interested.length },
    { label: "Proposal", count: myLeads.filter((l) => l.status === "Proposal Sent").length },
    { label: "Closed Won", count: myLeads.filter((l) => l.status === "Closed Won").length },
  ];

  const weeklyCalls = callsByWeekday(myCallLogs);
  const callChart = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => ({
    day,
    calls: weeklyCalls[i] ?? 0,
  }));

  const monthlyCommissionTarget = Math.round(agent.monthlyTarget * 0.1);

  return (
    <AppShell>
      <PageHeader
        title="My Dashboard"
        subtitle="Your cockpit for the day — leads to call, follow-ups due and progress toward target."
        crumbs={[{ label: "Agent", to: "/agent/dashboard" }, { label: "Dashboard" }]}
      />

      <div className="mt-6 space-y-6">
        {/* Hero */}
        <div className="surface-card relative overflow-hidden p-6">
          <div className="pointer-events-none absolute inset-0 gradient-brand opacity-[0.06]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-lg font-semibold text-primary">
                {agent.initials}
              </div>
              <div>
                <p className="text-display text-xl font-semibold">
                  Hey {agent.name.split(" ")[0]}, ready to sell? 👋
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {new Date().toLocaleDateString("en-ZA", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                  })}{" "}
                  · {agent.role}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Switch checked={online} disabled={onlinePending} onCheckedChange={handleOnlineToggle} />
                  <span className="text-xs text-muted-foreground">
                    {online ? "Online — available for calls" : "Offline — not visible to admin"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <div className="relative flex size-20 items-center justify-center">
                  <svg className="size-20 -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      strokeWidth="7"
                      className="fill-none stroke-muted"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      strokeWidth="7"
                      strokeLinecap="round"
                      className="fill-none stroke-primary transition-all duration-500"
                      strokeDasharray={2 * Math.PI * 34}
                      strokeDashoffset={2 * Math.PI * 34 * (1 - callProgress / 100)}
                    />
                  </svg>
                  <span className="absolute text-sm font-semibold tabular-nums">
                    {callProgress}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Daily call target</p>
              </div>

              {firstUncalled ? (
                <Button asChild size="lg" className="gap-2">
                  <Link to="/agent/leads/$id" params={{ id: firstUncalled.id }}>
                    <Phone className="size-4" /> Start calling <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <Button size="lg" disabled className="gap-2">
                  <Phone className="size-4" /> All leads called
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* KPIs */}
        <KpiGrid className="xl:grid-cols-4">
          <KpiCard label="My Leads" value={myLeads.length} icon={Users} tone="primary" />
          <KpiCard label="Not Called Yet" value={notCalled.length} icon={PhoneOff} tone="warning" />
          <KpiCard label="Calls Today" value={callsToday} icon={PhoneCall} tone="default" />
          <KpiCard label="Interested" value={interested.length} icon={ThumbsUp} tone="success" />
          <KpiCard
            label="Follow-ups Due Today"
            value={followUpsToday.length}
            icon={CalendarClock}
            tone="warning"
          />
          <KpiCard
            label="Deals Closed This Month"
            value={myDeals.length}
            icon={Trophy}
            tone="success"
          />
          <KpiCard
            label="Revenue Generated"
            value={formatZAR(revenue, { compact: true })}
            icon={Wallet}
            tone="primary"
          />
          <KpiCard
            label="My Commission Earned"
            value={formatZAR(commission, { compact: true })}
            icon={Wallet}
            tone="success"
          />
        </KpiGrid>

        <div className="grid min-w-0 gap-6 xl:grid-cols-3">
          <div className="min-w-0 space-y-6 xl:col-span-2">
            <SectionCard
              title="Today's call list"
              description="Overdue follow-ups first, then not-called leads."
              noPadding
            >
              {queue.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    title="Nothing to call right now"
                    description="You're all caught up — nice work."
                    compact
                  />
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {queue.map(({ lead, followUp }) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between gap-3 px-5 py-3.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{lead.business}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {lead.phone} · {lead.contactPerson}
                        </p>
                      </div>
                      <div className="hidden shrink-0 items-center gap-2 sm:flex">
                        <StatusBadge status={lead.status} size="sm" />
                        {followUp ? (
                          <span className="text-xs font-medium text-destructive">
                            {relativeTime(followUp.dueAt)}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link to="/agent/leads/$id" params={{ id: lead.id }}>
                            Open
                          </Link>
                        </Button>
                        <Button asChild size="sm">
                          <Link to="/agent/leads/$id" params={{ id: lead.id }}>
                            <Phone className="size-3.5" /> Call
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="My calls per day" description="Personal call volume this week">
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={callChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke={AGENT_CHART_COLORS.border} />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: AGENT_CHART_COLORS.muted, fontSize: 12 }}
                      stroke={AGENT_CHART_COLORS.border}
                    />
                    <YAxis
                      tick={{ fill: AGENT_CHART_COLORS.muted, fontSize: 12 }}
                      stroke={AGENT_CHART_COLORS.border}
                    />
                    <Tooltip
                      contentStyle={{
                        background: AGENT_CHART_COLORS.card,
                        border: `1px solid ${AGENT_CHART_COLORS.border}`,
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="calls" fill={AGENT_CHART_COLORS.primary} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard title="Recently contacted" noPadding>
              {recentlyContacted.length === 0 ? (
                <div className="p-5">
                  <EmptyState title="No calls logged yet" compact />
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentlyContacted.map((l) => (
                    <div key={l.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{l.business}</p>
                        <p className="text-xs text-muted-foreground">
                          {relativeTime(l.lastContact)}
                        </p>
                      </div>
                      <StatusBadge status={l.status} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          <div className="min-w-0 space-y-6">
            <SectionCard title="Follow-ups due today">
              {followUpsToday.length === 0 ? (
                <EmptyState title="All clear" description="No follow-ups due today." compact />
              ) : (
                <div className="space-y-3">
                  {followUpsToday.slice(0, 5).map((f) => {
                    const lead = myLeads.find((l) => l.id === f.leadId);
                    if (!lead) return null;
                    return (
                      <div
                        key={f.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{lead.business}</p>
                          <p
                            className={`text-xs ${isOverdue(f.dueAt) ? "text-destructive" : "text-muted-foreground"}`}
                          >
                            {formatTime(f.dueAt)} · {relativeTime(f.dueAt)}
                          </p>
                        </div>
                        <Button asChild size="sm" variant="outline">
                          <Link to="/agent/leads/$id" params={{ id: lead.id }}>
                            Open
                          </Link>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>

            <SectionCard title="My conversion funnel">
              <div className="space-y-2.5">
                {funnelStages.map((s) => (
                  <div key={s.label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{s.label}</span>
                      <span className="font-medium tabular-nums">{s.count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${funnelStages[0]!.count ? Math.round((s.count / funnelStages[0]!.count) * 100) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Commission progress" description="Toward this month's target">
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-semibold tabular-nums">
                    {formatZAR(commission)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    of {formatZAR(monthlyCommissionTarget)}
                  </span>
                </div>
                <Progress
                  value={Math.min(100, Math.round((commission / monthlyCommissionTarget) * 100))}
                />
              </div>
            </SectionCard>

            <SectionCard>
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning-foreground">
                  <Target className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">
                    You're #{myRank ?? "—"} of {leaderboard.length} agents this month
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Keep closing to climb the leaderboard.
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
