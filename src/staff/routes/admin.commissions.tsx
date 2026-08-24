import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@staff/components/layout/app-shell";
import { PageHeader } from "@staff/components/shared/page-header";
import { KpiCard, KpiGrid } from "@staff/components/shared/kpi-card";
import { EmptyState } from "@staff/components/shared/empty-state";
import { AvatarChip } from "@staff/components/shared/avatar-chip";
import { PaymentBadge } from "@staff/components/shared/status-badge";
import { Button } from "@staff/components/ui/button";
import { Card } from "@staff/components/ui/card";
import { Checkbox } from "@staff/components/ui/checkbox";
import { Progress } from "@staff/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@staff/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@staff/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@staff/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@staff/components/ui/dropdown-menu";
import { useDeals } from "@staff/lib/deals-data";
import { useAgents } from "@staff/lib/agents-data";
import { useServices } from "@staff/lib/services-data";
import { callSetDealPayment } from "@staff/lib/functions";
import { formatZAR, formatDate } from "@staff/lib/format";
import type { Deal } from "@staff/lib/types";
import { Award, Banknote, Download, MoreHorizontal, Wallet } from "lucide-react";

export const Route = createFileRoute("/admin/commissions")({
  head: () => ({
    meta: [
      { title: "Commission Tracking — Meridian CRM" },
      { name: "description", content: "Track agent commissions, approve payouts and review earnings over time." },
      { property: "og:title", content: "Commission Tracking — Meridian CRM" },
      { property: "og:description", content: "Track agent commissions, approve payouts and review earnings over time." },
    ],
  }),
  component: PageAdminCommissions,
});

type TabValue = "All" | "Pending" | "Approved" | "Paid";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Real replacement for the old static `revenueOverTime` mock import — same
// month-bucketing treatment as admin.dashboard.tsx (written separately here;
// this bit of duplication across the two pages is acceptable).
function computeRevenueOverTime(deals: Deal[], span = 7) {
  const now = new Date();
  const order: string[] = [];
  const buckets = new Map<string, { month: string; revenue: number; commission: number }>();
  for (let i = span - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    order.push(key);
    buckets.set(key, { month: MONTH_LABELS[d.getMonth()]!, revenue: 0, commission: 0 });
  }
  for (const deal of deals) {
    const closed = new Date(deal.closedAt);
    const key = `${closed.getFullYear()}-${closed.getMonth()}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.revenue += deal.value;
      bucket.commission += deal.commission;
    }
  }
  return order.map((key) => buckets.get(key)!);
}

function PageAdminCommissions() {
  const queryClient = useQueryClient();
  const dealsQuery = useDeals();
  const agentsQuery = useAgents();
  const servicesQuery = useServices();

  const deals = dealsQuery.data ?? [];
  const agents = agentsQuery.data ?? [];
  const services = servicesQuery.data ?? [];

  const agentOf = (id: string) => agents.find((a) => a.id === id);
  const serviceOf = (id: string) => services.find((s) => s.id === id);

  const [tab, setTab] = useState<TabValue>("All");
  const [selected, setSelected] = useState<string[]>([]);
  const [month, setMonth] = useState<string>("All months");
  const [bulkApproving, setBulkApproving] = useState(false);
  const [bulkMarkingPaid, setBulkMarkingPaid] = useState(false);
  const [actingDealId, setActingDealId] = useState<string | null>(null);

  const revenueOverTime = useMemo(() => computeRevenueOverTime(deals), [deals]);

  const monthOptions = useMemo(() => {
    const set = new Set<string>(deals.map((d) => new Date(d.closedAt).toLocaleString("en-ZA", { month: "short", year: "numeric" })));
    return ["All months", ...Array.from(set)];
  }, [deals]);

  const monthFiltered = useMemo(() => {
    if (month === "All months") return deals;
    return deals.filter(
      (d) => new Date(d.closedAt).toLocaleString("en-ZA", { month: "short", year: "numeric" }) === month,
    );
  }, [deals, month]);

  const filtered = useMemo(() => {
    if (tab === "All") return monthFiltered;
    return monthFiltered.filter((d) => d.paymentStatus === tab);
  }, [monthFiltered, tab]);

  const thisMonthDeals = useMemo(() => {
    const now = new Date();
    return deals.filter((d) => {
      const dt = new Date(d.closedAt);
      return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
    });
  }, [deals]);

  const totalThisMonth = thisMonthDeals.reduce((s, d) => s + d.commission, 0);
  const pending = deals.filter((d) => d.paymentStatus === "Pending").reduce((s, d) => s + d.commission, 0);
  const approved = deals.filter((d) => d.paymentStatus === "Approved").reduce((s, d) => s + d.commission, 0);
  const paid = deals.filter((d) => d.paymentStatus === "Paid").reduce((s, d) => s + d.commission, 0);

  const agentTotals = useMemo(() => {
    const map = new Map<string, { earned: number; pending: number; paid: number }>();
    for (const d of deals) {
      const cur = map.get(d.agentId) ?? { earned: 0, pending: 0, paid: 0 };
      cur.earned += d.commission;
      if (d.paymentStatus === "Pending") cur.pending += d.commission;
      if (d.paymentStatus === "Paid") cur.paid += d.commission;
      map.set(d.agentId, cur);
    }
    return map;
  }, [deals]);

  const topEarner = useMemo(() => {
    let best: { name: string; amount: number } | null = null;
    for (const [agentId, totals] of agentTotals.entries()) {
      const agent = agentOf(agentId);
      if (!agent) continue;
      if (!best || totals.earned > best.amount) best = { name: agent.name, amount: totals.earned };
    }
    return best;
  }, [agentTotals, agents]);

  const barData = useMemo(() => {
    return agents
      .map((a) => ({ name: a.name.split(" ")[0], commission: agentTotals.get(a.id)?.earned ?? 0 }))
      .filter((d) => d.commission > 0)
      .sort((a, b) => b.commission - a.commission);
  }, [agents, agentTotals]);

  const allSelectedIds = filtered.map((d) => d.id);
  const allChecked = allSelectedIds.length > 0 && allSelectedIds.every((id) => selected.includes(id));

  function toggleAll() {
    setSelected(allChecked ? [] : allSelectedIds);
  }

  function toggleOne(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function invalidateDeals() {
    queryClient.invalidateQueries({ queryKey: ["deals"] });
  }

  // No bulk setDealPayment Cloud Function exists — only the singular one, so
  // bulk actions fan out with Promise.allSettled and report partial failure
  // honestly instead of pretending the whole batch is atomic.
  async function bulkApprove() {
    if (selected.length === 0) return;
    setBulkApproving(true);
    try {
      const results = await Promise.allSettled(
        selected.map((id) => callSetDealPayment({ dealId: id, status: "Approved" })),
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      const succeeded = results.length - failed;
      invalidateDeals();
      if (failed > 0) {
        toast.error(`${succeeded} of ${results.length} deals approved — ${failed} failed`);
      } else {
        toast.success(`Approved ${succeeded} commission${succeeded > 1 ? "s" : ""}`);
      }
      setSelected([]);
    } finally {
      setBulkApproving(false);
    }
  }

  async function bulkPaid() {
    if (selected.length === 0) return;
    setBulkMarkingPaid(true);
    try {
      const results = await Promise.allSettled(
        selected.map((id) => callSetDealPayment({ dealId: id, status: "Paid" })),
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      const succeeded = results.length - failed;
      invalidateDeals();
      if (failed > 0) {
        toast.error(`${succeeded} of ${results.length} deals marked as paid — ${failed} failed`);
      } else {
        toast.success(`Marked ${succeeded} commission${succeeded > 1 ? "s" : ""} as paid`);
      }
      setSelected([]);
    } finally {
      setBulkMarkingPaid(false);
    }
  }

  async function actOn(deal: Deal, status: Deal["paymentStatus"]) {
    setActingDealId(deal.id);
    try {
      await callSetDealPayment({ dealId: deal.id, status });
      invalidateDeals();
      toast.success(`${deal.business} marked as ${status}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update that commission — try again.");
    } finally {
      setActingDealId(null);
    }
  }

  const pageLoading = dealsQuery.isLoading || agentsQuery.isLoading || servicesQuery.isLoading;

  if (pageLoading) {
    return (
      <AppShell>
        <PageHeader
          title="Commission Tracking"
          subtitle="Review agent commissions, approve payouts and monitor targets."
          crumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Commissions" }]}
        />
        <div className="mt-6 text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Commission Tracking"
        subtitle="Review agent commissions, approve payouts and monitor targets."
        crumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Commissions" }]}
        actions={
          <div className="flex items-center gap-2">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => toast.success("Payout file exported")}>
              <Download className="size-4" /> Export payout file
            </Button>
          </div>
        }
      />

      <div className="mt-6 space-y-6">
        <KpiGrid>
          <KpiCard label="This month" value={formatZAR(totalThisMonth, { compact: true })} icon={Wallet} tone="primary" />
          <KpiCard label="Pending approval" value={formatZAR(pending, { compact: true })} icon={Banknote} tone="warning" />
          <KpiCard label="Approved (unpaid)" value={formatZAR(approved, { compact: true })} icon={Banknote} />
          <KpiCard
            label="Top earner"
            value={topEarner ? topEarner.name : "—"}
            icon={Award}
            {...(topEarner ? { hint: formatZAR(topEarner.amount, { compact: true }) } : {})}
            tone="success"
          />
        </KpiGrid>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <p className="text-display mb-4 text-sm font-semibold">Commission by agent</p>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} stroke="hsl(var(--border))" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={80}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    stroke="hsl(var(--border))"
                  />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
                    formatter={(v: number) => formatZAR(v)}
                  />
                  <Bar dataKey="commission" fill="hsl(var(--chart-1))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-5">
            <p className="text-display mb-4 text-sm font-semibold">Commission over time</p>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueOverTime}>
                  <defs>
                    <linearGradient id="commissionFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} stroke="hsl(var(--border))" />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} stroke="hsl(var(--border))" />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
                    formatter={(v: number) => formatZAR(v)}
                  />
                  <Area type="monotone" dataKey="commission" stroke="hsl(var(--chart-2))" fill="url(#commissionFill)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {agents.map((a) => {
            const totals = agentTotals.get(a.id) ?? { earned: 0, pending: 0, paid: 0 };
            const progress = a.monthlyTarget ? Math.min(100, Math.round((totals.paid / a.monthlyTarget) * 100)) : 0;
            return (
              <Card key={a.id} className="space-y-3 p-4">
                <AvatarChip name={a.name} subtitle={a.role} />
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="font-semibold tabular-nums">{formatZAR(totals.earned, { compact: true })}</p>
                    <p className="text-muted-foreground">Earned</p>
                  </div>
                  <div>
                    <p className="font-semibold tabular-nums text-warning">{formatZAR(totals.pending, { compact: true })}</p>
                    <p className="text-muted-foreground">Pending</p>
                  </div>
                  <div>
                    <p className="font-semibold tabular-nums text-success">{formatZAR(totals.paid, { compact: true })}</p>
                    <p className="text-muted-foreground">Paid</p>
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Target progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              </Card>
            );
          })}
        </div>

        <div className="surface-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
              <TabsList>
                <TabsTrigger value="All">All</TabsTrigger>
                <TabsTrigger value="Pending">Pending</TabsTrigger>
                <TabsTrigger value="Approved">Approved</TabsTrigger>
                <TabsTrigger value="Paid">Paid</TabsTrigger>
              </TabsList>
            </Tabs>
            {selected.length > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{selected.length} selected</span>
                <Button size="sm" variant="outline" onClick={bulkApprove} disabled={bulkApproving || bulkMarkingPaid}>
                  {bulkApproving ? "Approving…" : "Approve selected"}
                </Button>
                <Button size="sm" onClick={bulkPaid} disabled={bulkApproving || bulkMarkingPaid}>
                  {bulkMarkingPaid ? "Marking…" : "Mark selected as paid"}
                </Button>
              </div>
            ) : null}
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="No commissions here" description="Try a different tab or month filter." compact />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={allChecked} onCheckedChange={toggleAll} />
                  </TableHead>
                  <TableHead>Deal</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Closed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => {
                  const agent = agentOf(d.agentId);
                  const service = serviceOf(d.serviceId);
                  const rate =
                    service?.commissionType === "percentage" ? `${service.commissionValue}%` : `${formatZAR(service?.commissionValue ?? 0)} flat`;
                  const rowBusy = actingDealId === d.id;
                  return (
                    <TableRow key={d.id}>
                      <TableCell>
                        <Checkbox checked={selected.includes(d.id)} onCheckedChange={() => toggleOne(d.id)} />
                      </TableCell>
                      <TableCell className="font-medium">{d.business}</TableCell>
                      <TableCell>
                        <AvatarChip name={agent?.name ?? "Unknown"} size="sm" />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{service?.name ?? "—"}</TableCell>
                      <TableCell className="tabular-nums">{formatZAR(d.value)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{rate}</TableCell>
                      <TableCell className="font-semibold tabular-nums">{formatZAR(d.commission)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(d.closedAt)}</TableCell>
                      <TableCell>
                        <PaymentBadge status={d.paymentStatus} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="size-8" aria-label="Commission actions" disabled={rowBusy}>
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {d.paymentStatus !== "Approved" && (
                              <DropdownMenuItem onClick={() => actOn(d, "Approved")}>Approve</DropdownMenuItem>
                            )}
                            {d.paymentStatus !== "Paid" && (
                              <DropdownMenuItem onClick={() => actOn(d, "Paid")}>Mark as paid</DropdownMenuItem>
                            )}
                            {d.paymentStatus !== "Pending" && (
                              <DropdownMenuItem onClick={() => actOn(d, "Pending")}>Revert to pending</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </AppShell>
  );
}
