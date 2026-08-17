import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  Phone,
  TrendingUp,
  Users,
  ThumbsUp,
  FileText,
  Trophy,
  Percent,
  Wallet,
  Award,
  Lock,
} from "lucide-react";
import { AppShell } from "@staff/components/layout/app-shell";
import { PageHeader } from "@staff/components/shared/page-header";
import { KpiCard, KpiGrid } from "@staff/components/shared/kpi-card";
import { SectionCard } from "@staff/components/shared/section-card";
import { Pill } from "@staff/components/shared/status-badge";
import { Progress } from "@staff/components/ui/progress";
import { collection, getDocs, query, Timestamp, where } from "firebase/firestore";
import { useAgentDoc } from "@staff/lib/agents-data";
import { useMyLeads } from "@staff/lib/leads";
import { useMyDeals } from "@staff/lib/deals-data";
import { callGetTeamLeaderboard } from "@staff/lib/functions";
import { firebaseAuth, getMockStaffProfile } from "@staff/lib/auth";
import { db } from "@staff/lib/firebase";
import { formatZAR, percent } from "@staff/lib/format";
import { cn } from "@staff/lib/utils";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CHART_COLORS = {
  primary: "hsl(var(--chart-1))",
  secondary: "hsl(var(--chart-2))",
  tertiary: "hsl(var(--chart-3))",
  quaternary: "hsl(var(--chart-4))",
  quinary: "hsl(var(--chart-5))",
  border: "hsl(var(--border))",
  muted: "hsl(var(--muted-foreground))",
  card: "hsl(var(--card))",
};

/** This agent's own callLogs from the last 7 days — written by logCall() (see functions/src/callable/logCall.ts). */
function useMyCallLogs(uid: string | undefined) {
  return useQuery({
    queryKey: ["callLogs", "mine", uid],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
      const snap = await getDocs(
        query(
          collection(db, "callLogs"),
          where("agentUid", "==", uid),
          where("at", ">=", Timestamp.fromDate(sevenDaysAgo)),
        ),
      );
      return snap.docs.map((d) => d.data() as { at: Timestamp; outcome: string });
    },
    enabled: Boolean(uid),
  });
}

export const Route = createFileRoute("/agent/performance")({
  head: () => ({
    meta: [
      { title: "My Performance — Meridian CRM" },
      {
        name: "description",
        content: "Track your calls, conversion, revenue and commission over time.",
      },
      { property: "og:title", content: "My Performance — Meridian CRM" },
      {
        property: "og:description",
        content: "Track your calls, conversion, revenue and commission over time.",
      },
    ],
  }),
  component: PageAgentPerformance,
});

type Period = "This week" | "This month" | "Last 3 months";
const PERIODS: Period[] = ["This week", "This month", "Last 3 months"];
const PERIOD_FACTOR: Record<Period, number> = {
  "This week": 0.25,
  "This month": 1,
  "Last 3 months": 3,
};

function PageAgentPerformance() {
  const myUid = firebaseAuth.currentUser?.uid;
  const mockProfile = getMockStaffProfile();
  const { data: agent, isLoading: agentLoading } = useAgentDoc(myUid);
  const { data: myLeads = [], isLoading: leadsLoading } = useMyLeads();
  const { data: myDeals = [], isLoading: dealsLoading } = useMyDeals();
  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => (mockProfile ? [] : (await callGetTeamLeaderboard()).data.leaderboard),
  });
  const { data: myCallLogs = [] } = useMyCallLogs(myUid);
  const [period, setPeriod] = useState<Period>("This month");

  // Real last-7-days call volume from callLogs, replacing the old static
  // mock chart. "Connected" approximates any outcome other than the neutral
  // "Called" placeholder status, same heuristic used on admin.reports.tsx.
  const myCallsPerDay = useMemo(() => {
    const buckets = DAY_LABELS.map((day) => ({ day, calls: 0, connected: 0 }));
    for (const log of myCallLogs) {
      const dayIndex = log.at.toDate().getDay();
      const bucket = buckets[dayIndex];
      if (!bucket) continue;
      bucket.calls += 1;
      if (log.outcome !== "Called") bucket.connected += 1;
    }
    // Reorder to start on Monday, matching the rest of the app's week display.
    return [...buckets.slice(1), buckets[0]!];
  }, [myCallLogs]);

  // Real month-bucketed revenue/commission from this agent's own deals.
  const myRevenueOverTime = useMemo(() => {
    const map = new Map<string, { month: string; revenue: number; commission: number }>();
    const months: string[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-US", { month: "short" });
      months.push(label);
      map.set(label, { month: label, revenue: 0, commission: 0 });
    }
    for (const deal of myDeals) {
      const label = new Date(deal.closedAt).toLocaleDateString("en-US", { month: "short" });
      const row = map.get(label);
      if (!row) continue;
      row.revenue += deal.value;
      row.commission += deal.commission;
    }
    return months.map((m) => map.get(m)!);
  }, [myDeals]);

  // Real (if free-text/imperfect) grouping of this agent's own lost reasons.
  const myLostReasons = useMemo(() => {
    const map = new Map<string, number>();
    for (const lead of myLeads) {
      if (!lead.lostReason) continue;
      map.set(lead.lostReason, (map.get(lead.lostReason) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);
  }, [myLeads]);

  // Real per-industry breakdown from deals.industry, denormalized from the
  // lead at close time by logCall() — replaces the old behaviour of scaling
  // a shared mock constant. Deals closed before this field existed fall
  // under "Uncategorized" rather than being dropped.
  const myIndustryPerf = useMemo(() => {
    const map = new Map<string, { industry: string; deals: number; revenue: number }>();
    for (const d of myDeals) {
      const industry = d.industry ?? "Uncategorized";
      const row = map.get(industry) ?? { industry, deals: 0, revenue: 0 };
      row.deals += 1;
      row.revenue += d.value;
      map.set(industry, row);
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [myDeals]);

  const isLoading = agentLoading || leadsLoading || dealsLoading || leaderboardLoading;

  if (isLoading || !agent) {
    return (
      <AppShell>
        <PageHeader
          title="My Performance"
          subtitle="Personal stats, trends and how you stack up against the team."
          crumbs={[{ label: "Agent", to: "/agent/dashboard" }, { label: "Performance" }]}
        />
        <div className="mt-6 text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }

  const factor = PERIOD_FACTOR[period];

  const callsMade = Math.round(agent.callsThisWeek.reduce((a, b) => a + b, 0) * factor);
  // Real connect rate from the last 7 days of callLogs (see useMyCallLogs
  // above) — same "connected" approximation as myCallsPerDay. Falls back to
  // 0 rather than a hardcoded placeholder when there's no call history yet.
  const totalCallsLogged = myCallsPerDay.reduce((sum, d) => sum + d.calls, 0);
  const totalConnected = myCallsPerDay.reduce((sum, d) => sum + d.connected, 0);
  const connectRate = totalCallsLogged > 0 ? Math.round((totalConnected / totalCallsLogged) * 100) : 0;
  const contacted = myLeads.filter((l) => l.lastContact).length;
  const interested = myLeads.filter((l) => l.status === "Interested").length;
  const proposals = myLeads.filter((l) => l.status === "Proposal Sent").length;
  const closedWon = myLeads.filter((l) => l.status === "Closed Won").length;
  const conversionRate = percent(closedWon, myLeads.length);
  const revenue = myDeals.reduce((s, d) => s + d.value, 0);
  const commissionEarned = myDeals.reduce((s, d) => s + d.commission, 0);
  const commissionPending = myDeals
    .filter((d) => d.paymentStatus === "Pending")
    .reduce((s, d) => s + d.commission, 0);
  const commissionPaid = myDeals
    .filter((d) => d.paymentStatus === "Paid")
    .reduce((s, d) => s + d.commission, 0);

  const funnel = [
    { label: "Leads", count: myLeads.length },
    { label: "Contacted", count: contacted },
    { label: "Interested", count: interested },
    { label: "Proposal Sent", count: proposals },
    { label: "Closed Won", count: closedWon },
  ];

  const revenueTarget = agent.monthlyTarget;
  const dealsTarget = agent.targetDeals;
  const callsTarget = 400;
  const dayOfMonth = new Date().getDate();
  const monthLength = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const expectedPace = dayOfMonth / monthLength;
  const revenuePace = revenue / revenueTarget;
  const onTrack = revenuePace >= expectedPace - 0.1;

  const myLeaderboardRow = leaderboard.find((r) => r.agentId === myUid);

  const achievements = [
    { title: "First 100 calls", earned: callsMade >= 20, icon: Phone },
    { title: "10 deals closed", earned: myDeals.length >= 10, icon: Trophy },
    { title: "R50k revenue club", earned: revenue >= 50000, icon: Wallet },
    { title: "Interested streak", earned: interested >= 3, icon: ThumbsUp },
    { title: "Top 3 this month", earned: (myLeaderboardRow?.rank ?? Infinity) <= 3, icon: Award },
  ];

  return (
    <AppShell>
      <PageHeader
        title="My Performance"
        subtitle="Personal stats, trends and how you stack up against the team."
        crumbs={[{ label: "Agent", to: "/agent/dashboard" }, { label: "Performance" }]}
        actions={
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  period === p
                    ? "bg-card shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        }
      />

      <div className="mt-6 space-y-6">
        <KpiGrid className="xl:grid-cols-4">
          <KpiCard label="Calls Made" value={callsMade} icon={Phone} tone="primary" />
          <KpiCard label="Connect Rate" value={`${connectRate}%`} icon={Percent} tone="default" />
          <KpiCard label="Leads Contacted" value={contacted} icon={Users} tone="default" />
          <KpiCard label="Interested" value={interested} icon={ThumbsUp} tone="success" />
          <KpiCard label="Proposals" value={proposals} icon={FileText} tone="default" />
          <KpiCard label="Deals Closed" value={closedWon} icon={Trophy} tone="success" />
          <KpiCard
            label="Conversion Rate"
            value={`${conversionRate}%`}
            icon={TrendingUp}
            tone="primary"
          />
          <KpiCard
            label="Revenue"
            value={formatZAR(revenue, { compact: true })}
            icon={Wallet}
            tone="primary"
          />
        </KpiGrid>

        <KpiGrid className="xl:grid-cols-3">
          <KpiCard
            label="Commission Earned"
            value={formatZAR(commissionEarned, { compact: true })}
            icon={Wallet}
            tone="success"
          />
          <KpiCard
            label="Commission Pending"
            value={formatZAR(commissionPending, { compact: true })}
            icon={Wallet}
            tone="warning"
          />
          <KpiCard
            label="Commission Paid"
            value={formatZAR(commissionPaid, { compact: true })}
            icon={Wallet}
            tone="default"
          />
        </KpiGrid>

        <div className="grid gap-6 xl:grid-cols-2">
          <SectionCard title="My calls per day">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={myCallsPerDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.border} />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: CHART_COLORS.muted, fontSize: 12 }}
                    stroke={CHART_COLORS.border}
                  />
                  <YAxis
                    tick={{ fill: CHART_COLORS.muted, fontSize: 12 }}
                    stroke={CHART_COLORS.border}
                  />
                  <Tooltip
                    contentStyle={{
                      background: CHART_COLORS.card,
                      border: `1px solid ${CHART_COLORS.border}`,
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="calls" fill={CHART_COLORS.primary} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="connected" fill={CHART_COLORS.secondary} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="My conversion funnel">
            <div className="space-y-3">
              {funnel.map((s) => (
                <div key={s.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="font-medium tabular-nums">
                      {s.count} · {percent(s.count, funnel[0]!.count)}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${percent(s.count, funnel[0]!.count)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Revenue over time">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={myRevenueOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.border} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: CHART_COLORS.muted, fontSize: 12 }}
                    stroke={CHART_COLORS.border}
                  />
                  <YAxis
                    tick={{ fill: CHART_COLORS.muted, fontSize: 12 }}
                    stroke={CHART_COLORS.border}
                  />
                  <Tooltip
                    contentStyle={{
                      background: CHART_COLORS.card,
                      border: `1px solid ${CHART_COLORS.border}`,
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={CHART_COLORS.tertiary}
                    fill={CHART_COLORS.tertiary}
                    fillOpacity={0.18}
                  />
                  <Area
                    type="monotone"
                    dataKey="commission"
                    stroke={CHART_COLORS.quaternary}
                    fill={CHART_COLORS.quaternary}
                    fillOpacity={0.18}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Performance by service">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={myIndustryPerf}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.border} />
                  <XAxis
                    dataKey="industry"
                    tick={{ fill: CHART_COLORS.muted, fontSize: 11 }}
                    stroke={CHART_COLORS.border}
                  />
                  <YAxis
                    tick={{ fill: CHART_COLORS.muted, fontSize: 12 }}
                    stroke={CHART_COLORS.border}
                  />
                  <Tooltip
                    contentStyle={{
                      background: CHART_COLORS.card,
                      border: `1px solid ${CHART_COLORS.border}`,
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="deals" fill={CHART_COLORS.quinary} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <SectionCard title="Performance by industry" noPadding>
            <table className="w-full text-sm">
              <thead className="border-b border-border text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5 text-left font-medium">Industry</th>
                  <th className="px-5 py-2.5 text-right font-medium">Deals</th>
                  <th className="px-5 py-2.5 text-right font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {myIndustryPerf.map((row) => (
                  <tr key={row.industry}>
                    <td className="px-5 py-2.5">{row.industry}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">{row.deals}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">
                      {formatZAR(row.revenue, { compact: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionCard>

          <SectionCard title="Lost-reason breakdown">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={myLostReasons} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.border} />
                  <XAxis
                    type="number"
                    tick={{ fill: CHART_COLORS.muted, fontSize: 12 }}
                    stroke={CHART_COLORS.border}
                  />
                  <YAxis
                    type="category"
                    dataKey="reason"
                    width={130}
                    tick={{ fill: CHART_COLORS.muted, fontSize: 11 }}
                    stroke={CHART_COLORS.border}
                  />
                  <Tooltip
                    contentStyle={{
                      background: CHART_COLORS.card,
                      border: `1px solid ${CHART_COLORS.border}`,
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" fill={CHART_COLORS.secondary} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="Target tracking"
          action={
            <Pill tone={onTrack ? "success" : "danger"}>{onTrack ? "On track" : "Behind"}</Pill>
          }
        >
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Revenue target</span>
                <span className="font-medium tabular-nums">
                  {formatZAR(revenue, { compact: true })} /{" "}
                  {formatZAR(revenueTarget, { compact: true })}
                </span>
              </div>
              <Progress value={Math.min(100, Math.round((revenue / revenueTarget) * 100))} />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Deals target</span>
                <span className="font-medium tabular-nums">
                  {closedWon} / {dealsTarget}
                </span>
              </div>
              <Progress value={Math.min(100, Math.round((closedWon / dealsTarget) * 100))} />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Calls target</span>
                <span className="font-medium tabular-nums">
                  {callsMade} / {callsTarget}
                </span>
              </div>
              <Progress value={Math.min(100, Math.round((callsMade / callsTarget) * 100))} />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Team comparison" description="Ranked by revenue this month" noPadding>
          <table className="w-full text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">#</th>
                <th className="px-5 py-2.5 text-left font-medium">Agent</th>
                <th className="px-5 py-2.5 text-right font-medium">Revenue</th>
                <th className="px-5 py-2.5 text-right font-medium">Deals</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leaderboard.map((row) => (
                <tr key={row.agentId} className={cn(row.agentId === myUid && "bg-primary/5")}>
                  <td className="px-5 py-2.5 tabular-nums text-muted-foreground">{row.rank}</td>
                  <td className="px-5 py-2.5 font-medium">
                    {row.name}{" "}
                    {row.agentId === myUid ? (
                      <span className="ml-1 text-xs text-primary">(you)</span>
                    ) : null}
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums">
                    {formatZAR(row.revenue, { compact: true })}
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums">{row.deals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        <SectionCard title="Achievements">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {achievements.map((a) => (
              <div
                key={a.title}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors",
                  a.earned ? "border-success/25 bg-success/5" : "border-border bg-muted/30",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl",
                    a.earned ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
                  )}
                >
                  {a.earned ? <a.icon className="size-5" /> : <Lock className="size-5" />}
                </span>
                <p className="text-xs font-medium">{a.title}</p>
                <Pill tone={a.earned ? "success" : "neutral"} size="sm">
                  {a.earned ? "Earned" : "Locked"}
                </Pill>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
