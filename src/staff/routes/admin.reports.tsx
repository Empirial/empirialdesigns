import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@staff/components/layout/app-shell";
import { PageHeader } from "@staff/components/shared/page-header";
import { KpiCard, KpiGrid } from "@staff/components/shared/kpi-card";
import { SectionCard } from "@staff/components/shared/section-card";
import { Button } from "@staff/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@staff/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@staff/components/ui/popover";
import { Calendar } from "@staff/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@staff/components/ui/table";
import { db } from "@staff/lib/firebase";
import { useLeads } from "@staff/lib/leads";
import { useAgents } from "@staff/lib/agents-data";
import { useDeals } from "@staff/lib/deals-data";
import { useServices } from "@staff/lib/services-data";
import { formatDate, formatZAR, percent } from "@staff/lib/format";
import { LEAD_STATUSES } from "@staff/lib/types";
import {
  CalendarDays,
  Download,
  Handshake,
  PhoneCall,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Analytics — Meridian CRM" },
      {
        name: "description",
        content: "Deep-dive analytics on calls, conversion, revenue and team performance.",
      },
      { property: "og:title", content: "Reports & Analytics — Meridian CRM" },
      {
        property: "og:description",
        content: "Deep-dive analytics on calls, conversion, revenue and team performance.",
      },
    ],
  }),
  component: PageAdminReports,
});

const RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "3m", label: "3 Months" },
  { value: "custom", label: "Custom" },
];

const PIE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

// A callLog is only written once an agent submits a call outcome (see
// functions/src/callable/logCall.ts), so every row already represents an
// attempted call. "Connected" isn't tracked as its own boolean — as a rough
// proxy we treat any outcome beyond the neutral "Called" (attempted, no
// substantive result yet) as a connected conversation.
const CONNECTED_OUTCOMES = new Set([
  "Interested",
  "Not Interested",
  "Follow-up",
  "Proposal Sent",
  "Closed Won",
  "Closed Lost",
]);

interface CallLogRow {
  id: string;
  agentUid: string;
  leadId: string;
  outcome: string;
  at: string;
}

function useCallLogs() {
  return useQuery({
    queryKey: ["callLogs", "all"],
    queryFn: async (): Promise<CallLogRow[]> => {
      const snap = await getDocs(collection(db, "callLogs"));
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          agentUid: data.agentUid ?? "",
          leadId: data.leadId ?? "",
          outcome: data.outcome ?? "",
          at: data.at instanceof Timestamp ? data.at.toDate().toISOString() : new Date().toISOString(),
        };
      });
    },
  });
}

function PageAdminReports() {
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: agents = [], isLoading: agentsLoading } = useAgents();
  const { data: deals = [], isLoading: dealsLoading } = useDeals();
  const { data: services = [], isLoading: servicesLoading } = useServices();
  const { data: callLogs = [], isLoading: callLogsLoading } = useCallLogs();
  const [range, setRange] = useState("30d");
  const [customDate, setCustomDate] = useState<Date | undefined>(new Date());

  const totalLeads = leads.length;
  const totalDeals = deals.length;
  const totalRevenue = deals.reduce((sum, d) => sum + d.value, 0);
  const totalCalls = callLogs.length;
  const connectRate = percent(
    callLogs.filter((c) => CONNECTED_OUTCOMES.has(c.outcome)).length,
    totalCalls,
  );

  /* --------------------- Calls per day (real, from callLogs) --------------------- */
  const callsPerDay = useMemo(() => {
    const map = new Map<string, { calls: number; connected: number }>();
    for (const c of callLogs) {
      const key = c.at.slice(0, 10); // yyyy-mm-dd, sorts chronologically as a string
      const entry = map.get(key) ?? { calls: 0, connected: 0 };
      entry.calls += 1;
      if (CONNECTED_OUTCOMES.has(c.outcome)) entry.connected += 1;
      map.set(key, entry);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => ({
        day: new Date(key).toLocaleDateString("en-ZA", { month: "short", day: "numeric" }),
        calls: v.calls,
        connected: v.connected,
      }));
  }, [callLogs]);

  /* --------------------------- Calls per agent --------------------------- */
  const callsPerAgent = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of callLogs) counts.set(c.agentUid, (counts.get(c.agentUid) ?? 0) + 1);
    return agents
      .map((a) => ({ name: a.name.split(" ")[0] ?? a.name, calls: counts.get(a.id) ?? 0 }))
      .sort((a, b) => b.calls - a.calls);
  }, [agents, callLogs]);

  /* --------------------------- Leads contacted over time --------------------------- */
  const contactedOverTime = useMemo(
    () => callsPerDay.map((d) => ({ day: d.day, contacted: d.connected })),
    [callsPerDay],
  );

  /* ------------------------ Revenue over time (real, from deals) ------------------------ */
  const revenueOverTime = useMemo(() => {
    const map = new Map<string, { month: string; revenue: number; commission: number }>();
    for (const d of deals) {
      const dt = new Date(d.closedAt);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      const entry = map.get(key) ?? {
        month: dt.toLocaleDateString("en-ZA", { month: "short" }),
        revenue: 0,
        commission: 0,
      };
      entry.revenue += d.value;
      entry.commission += d.commission;
      map.set(key, entry);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [deals]);

  /* --------------------- Industry performance (real, from deals) --------------------- */
  const industryPerformance = useMemo(() => {
    const map = new Map<string, { industry: string; deals: number; revenue: number }>();
    for (const d of deals) {
      const key = d.industry ?? "Unknown";
      const entry = map.get(key) ?? { industry: key, deals: 0, revenue: 0 };
      entry.deals += 1;
      entry.revenue += d.value;
      map.set(key, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [deals]);

  /* --------------------- Lost reasons (real, free-text grouped) --------------------- */
  const lostReasons = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of leads) {
      if (!l.lostReason) continue;
      counts.set(l.lostReason, (counts.get(l.lostReason) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);
  }, [leads]);

  /* --------------------------- Funnel --------------------------- */
  const funnelStages = ["New", "Called", "Interested", "Proposal Sent", "Closed Won"] as const;
  const funnel = useMemo(() => {
    const base = totalLeads || 1;
    return funnelStages.map((stage) => {
      const count = leads.filter((l) =>
        stage === "Closed Won" ? l.status === "Closed Won" : l.status === stage || LEAD_STATUSES.indexOf(l.status) >= LEAD_STATUSES.indexOf(stage as any),
      ).length;
      return { stage, count, pct: percent(count, base) };
    });
  }, [leads, totalLeads]);

  const interestedCount = leads.filter((l) => l.status === "Interested" || l.status === "Proposal Sent" || l.status === "Closed Won").length;
  const leadToInterest = percent(interestedCount, totalLeads);
  const interestToSale = percent(deals.length, interestedCount || 1);

  /* --------------------------- Revenue per agent --------------------------- */
  const revenuePerAgent = useMemo(
    () =>
      agents
        .map((a) => ({
          name: a.name.split(" ")[0] ?? a.name,
          revenue: deals.filter((d) => d.agentId === a.id).reduce((sum, d) => sum + d.value, 0),
        }))
        .filter((a) => a.revenue > 0)
        .sort((a, b) => b.revenue - a.revenue),
    [agents, deals],
  );

  /* --------------------------- Revenue per service --------------------------- */
  const revenuePerService = useMemo(
    () =>
      services
        .map((s) => ({
          name: s.name,
          value: deals.filter((d) => d.serviceId === s.id).reduce((sum, d) => sum + d.value, 0),
        }))
        .filter((s) => s.value > 0),
    [services, deals],
  );

  /* --------------------------- Top employees --------------------------- */
  const topEmployees = useMemo(() => {
    const callCounts = new Map<string, number>();
    for (const c of callLogs) callCounts.set(c.agentUid, (callCounts.get(c.agentUid) ?? 0) + 1);
    return agents
      .map((a) => {
        const agentDeals = deals.filter((d) => d.agentId === a.id);
        return {
          agent: a,
          calls: callCounts.get(a.id) ?? 0,
          deals: agentDeals.length,
          revenue: agentDeals.reduce((sum, d) => sum + d.value, 0),
          commission: agentDeals.reduce((sum, d) => sum + d.commission, 0),
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [agents, deals, callLogs]);

  const exportReport = () => toast.success("Report exported (mock) — check your downloads.");

  if (leadsLoading || agentsLoading || dealsLoading || servicesLoading || callLogsLoading) {
    return (
      <AppShell>
        <PageHeader
          title="Reports & Analytics"
          subtitle="Track calls, conversion and revenue performance across the team."
        />
        <div className="mt-6 text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Track calls, conversion and revenue performance across the team."
        actions={
          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
            <div className="flex w-full min-w-0 max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-border bg-muted/40 p-1 scrollbar-slim lg:w-auto">
              {RANGE_OPTIONS.map((o) =>
                o.value === "custom" ? (
                  <Popover key={o.value}>
                    <PopoverTrigger asChild>
                      <Button
                        size="sm"
                        variant={range === "custom" ? "default" : "ghost"}
                        className="h-7 px-3 text-xs"
                        onClick={() => setRange("custom")}
                      >
                        <CalendarDays className="size-3.5" />
                        Custom
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-auto p-0">
                      <Calendar mode="single" selected={customDate} onSelect={setCustomDate} />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <Button
                    key={o.value}
                    size="sm"
                    variant={range === o.value ? "default" : "ghost"}
                    className="h-7 px-3 text-xs"
                    onClick={() => setRange(o.value)}
                  >
                    {o.label}
                  </Button>
                ),
              )}
            </div>
            <Button variant="outline" onClick={exportReport}>
              <Download className="size-4" />
              Export report
            </Button>
          </div>
        }
      />

      <div className="mt-6 space-y-6">
        {range === "custom" && customDate ? (
          <p className="text-xs text-muted-foreground">Showing data around {formatDate(customDate.toISOString())}</p>
        ) : null}

        <KpiGrid>
          <KpiCard label="Total Leads" value={totalLeads} icon={Users} tone="primary" />
          <KpiCard label="Total Calls" value={totalCalls} icon={PhoneCall} />
          <KpiCard label="Connect Rate" value={`${connectRate}%`} icon={Target} tone="success" />
          <KpiCard label="Deals Closed" value={totalDeals} icon={Handshake} tone="success" />
        </KpiGrid>

        <Tabs defaultValue="overview">
          <div className="w-full min-w-0 max-w-full overflow-x-auto scrollbar-slim">
          <TabsList className="w-max">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="calls">Calls</TabsTrigger>
            <TabsTrigger value="conversion">Conversion</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
          </TabsList>
          </div>

          {/* ------------------------------ Overview ------------------------------ */}
          <TabsContent value="overview" className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <SectionCard title="Revenue Over Time" description="Revenue vs commission">
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" />
                    <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" tickFormatter={(v) => formatZAR(v, { compact: true })} />
                    <Tooltip formatter={(v: number) => formatZAR(v)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "12px" }} />
                    <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.18} strokeWidth={2} />
                    <Area type="monotone" dataKey="commission" stroke="var(--chart-3)" fill="var(--chart-3)" fillOpacity={0.18} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
            <SectionCard title="Calls Per Day" description="Total vs connected">
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={callsPerDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="day" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" />
                    <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "12px" }} />
                    <Bar dataKey="calls" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="connected" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
            <SectionCard title="Best-performing Industries" className="xl:col-span-2" noPadding>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Industry</TableHead>
                    <TableHead className="text-right">Deals</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {industryPerformance.map((row) => (
                    <TableRow key={row.industry}>
                      <TableCell className="font-medium">{row.industry}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.deals}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatZAR(row.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>
          </TabsContent>

          {/* ------------------------------ Calls ------------------------------ */}
          <TabsContent value="calls" className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <SectionCard title="Calls Per Day">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={callsPerDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="day" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" />
                    <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "12px" }} />
                    <Bar dataKey="calls" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="connected" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
            <SectionCard title="Calls Per Agent">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={callsPerAgent} layout="vertical" margin={{ left: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" />
                    <YAxis type="category" dataKey="name" width={90} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "12px" }} />
                    <Bar dataKey="calls" fill="var(--chart-3)" radius={[0, 6, 6, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
            <SectionCard title="Leads Contacted Over Time" className="xl:col-span-2">
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={contactedOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="day" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" />
                    <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "12px" }} />
                    <Line type="monotone" dataKey="contacted" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </TabsContent>

          {/* ------------------------------ Conversion ------------------------------ */}
          <TabsContent value="conversion" className="mt-5 space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <KpiCard label="Lead → Interest" value={`${leadToInterest}%`} icon={TrendingUp} tone="primary" />
              <KpiCard label="Interest → Sale" value={`${interestToSale}%`} icon={Handshake} tone="success" />
            </div>
            <SectionCard title="Conversion Funnel" description="Lead → Contacted → Interested → Proposal → Won" noPadding>
              <div className="space-y-2 p-5">
                {funnel.map((stage, i) => (
                  <div key={stage.stage}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">{stage.stage}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {stage.count} · {stage.pct}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(4, stage.pct)}%`,
                          background: PIE_COLORS[i % PIE_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
            <SectionCard title="Lost Lead Reasons" description="Why deals fall through">
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lostReasons} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" />
                    <YAxis type="category" dataKey="reason" width={150} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "12px" }} />
                    <Bar dataKey="count" fill="var(--chart-5)" radius={[0, 6, 6, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </TabsContent>

          {/* ------------------------------ Revenue ------------------------------ */}
          <TabsContent value="revenue" className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <SectionCard title="Revenue Over Time">
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" />
                    <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" tickFormatter={(v) => formatZAR(v, { compact: true })} />
                    <Tooltip formatter={(v: number) => formatZAR(v)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "12px" }} />
                    <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.18} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
            <SectionCard title="Revenue Per Agent">
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenuePerAgent}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" />
                    <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" tickFormatter={(v) => formatZAR(v, { compact: true })} />
                    <Tooltip formatter={(v: number) => formatZAR(v)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "12px" }} />
                    <Bar dataKey="revenue" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
            <SectionCard title="Revenue Per Service" className="xl:col-span-2">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={revenuePerService} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                      {revenuePerService.map((entry, i) => (
                        <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatZAR(v)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </TabsContent>

          {/* ------------------------------ Teams ------------------------------ */}
          <TabsContent value="teams" className="mt-5 space-y-6">
            <SectionCard title="Top-performing Employees" noPadding>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead className="text-right">Calls</TableHead>
                    <TableHead className="text-right">Deals</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topEmployees.map((row, i) => (
                    <TableRow key={row.agent.id}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{row.agent.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.calls}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.deals}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatZAR(row.revenue)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatZAR(row.commission)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
