import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@staff/components/layout/app-shell";
import { PageHeader } from "@staff/components/shared/page-header";
import { KpiCard, KpiGrid } from "@staff/components/shared/kpi-card";
import { EmptyState } from "@staff/components/shared/empty-state";
import { AvatarChip } from "@staff/components/shared/avatar-chip";
import { Pill } from "@staff/components/shared/status-badge";
import { Button } from "@staff/components/ui/button";
import { Input } from "@staff/components/ui/input";
import { Label } from "@staff/components/ui/label";
import { Switch } from "@staff/components/ui/switch";
import { Progress } from "@staff/components/ui/progress";
import { Slider } from "@staff/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@staff/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@staff/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@staff/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@staff/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@staff/components/ui/table";
import {
  LayoutGrid,
  List,
  Search,
  Users,
  Activity,
  TrendingUp,
  Wallet,
  PhoneCall,
  MoreHorizontal,
  Copy,
  Radio,
} from "lucide-react";
import { useAgents } from "@staff/lib/agents-data";
import { useLeads } from "@staff/lib/leads";
import { useDeals } from "@staff/lib/deals-data";
import { useCallLogs } from "@staff/lib/call-logs-data";
import { formatZAR } from "@staff/lib/format";
import { computeAgentStats } from "@staff/components/agents-admin/agent-stats";
import type { Agent } from "@staff/lib/types";
import { cn } from "@staff/lib/utils";
import { callInviteUser, callRemoveUser, callResetUserPassword, callToggleAgentStatus } from "@staff/lib/functions";

export const Route = createFileRoute("/admin/agents/")({
  head: () => ({
    meta: [
      { title: "Agent Management — Meridian CRM" },
      { name: "description", content: "Manage sales agents, track performance and assign leads." },
      { property: "og:title", content: "Agent Management — Meridian CRM" },
      { property: "og:description", content: "Manage sales agents, track performance and assign leads." },
    ],
  }),
  component: PageAdminAgentsIndex,
});

type SortKey = "revenue" | "conversion" | "calls";

function PageAdminAgentsIndex() {
  const { data: agents = [], isLoading: agentsLoading } = useAgents();
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: deals = [], isLoading: dealsLoading } = useDeals();
  const { data: callLogs = [] } = useCallLogs();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Inactive">("all");
  const [sort, setSort] = useState<SortKey>("revenue");
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<Agent | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Agent | null>(null);
  const [tempPasswordResult, setTempPasswordResult] = useState<
    { email: string; tempPassword: string; mode: "created" | "reset" } | null
  >(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Sales Agent" as Agent["role"],
    monthlyTarget: 30000,
    commissionRate: 10,
  });

  const stats = useMemo(
    () => agents.map((a) => computeAgentStats(a, leads, deals, callLogs)),
    [agents, leads, deals, callLogs],
  );

  const filtered = useMemo(() => {
    let list = stats;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) => s.agent.name.toLowerCase().includes(q) || s.agent.email.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((s) => s.agent.status === statusFilter);
    }
    const sorted = [...list].sort((a, b) => {
      if (sort === "revenue") return b.revenue - a.revenue;
      if (sort === "conversion") return b.conversion - a.conversion;
      return b.callsToday - a.callsToday;
    });
    return sorted;
  }, [stats, search, statusFilter, sort]);

  const totalAgents = agents.length;
  const activeNow = agents.filter((a) => a.status === "Active").length;
  const onlineNow = agents.filter((a) => a.online).length;
  const avgConversion =
    stats.length > 0 ? Math.round(stats.reduce((s, x) => s + x.conversion, 0) / stats.length) : 0;
  const totalCommission = stats.reduce((s, x) => s + x.commission, 0);

  async function handleAddAgent() {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setAdding(true);
    try {
      const result = await callInviteUser({
        email: form.email.trim(),
        displayName: form.name.trim(),
        role: "agent",
        phone: form.phone || undefined,
        jobTitle: form.role,
        monthlyTarget: form.monthlyTarget,
        commissionRateOverride: form.commissionRate,
      });
      setAddOpen(false);
      setForm({ name: "", email: "", phone: "", role: "Sales Agent", monthlyTarget: 30000, commissionRate: 10 });
      setTempPasswordResult({ email: result.data.email, tempPassword: result.data.tempPassword, mode: "created" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add that agent — try again.");
    } finally {
      setAdding(false);
    }
  }

  async function handleResetPassword(agent: Agent) {
    setResettingId(agent.id);
    try {
      const result = await callResetUserPassword({ uid: agent.id });
      setTempPasswordResult({ email: result.data.email, tempPassword: result.data.tempPassword, mode: "reset" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't reset that agent's password — try again.");
    } finally {
      setResettingId(null);
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    const agent = removeTarget;
    setRemovingId(agent.id);
    try {
      await callRemoveUser({ uid: agent.id });
      await queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success(`${agent.name} was removed`);
      setRemoveTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't remove that agent — try again.");
    } finally {
      setRemovingId(null);
    }
  }

  async function toggleStatus(agent: Agent) {
    setTogglingId(agent.id);
    try {
      await callToggleAgentStatus({ agentId: agent.id });
      await queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success(`${agent.name} is now ${agent.status === "Active" ? "offline" : "online"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update that agent — try again.");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDeactivate() {
    if (!deactivateTarget) return;
    const agent = deactivateTarget;
    setTogglingId(agent.id);
    try {
      await callToggleAgentStatus({ agentId: agent.id });
      await queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success(`${agent.name} ${agent.status === "Active" ? "deactivated" : "reactivated"}`);
      setDeactivateTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update that agent — try again.");
    } finally {
      setTogglingId(null);
    }
  }

  if (agentsLoading || leadsLoading || dealsLoading) {
    return (
      <AppShell>
        <PageHeader
          title="Agents"
          subtitle="Manage your sales team, track performance and reassign leads."
          crumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Agents" }]}
        />
        <div className="mt-6 text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Agents"
        subtitle="Manage your sales team, track performance and reassign leads."
        crumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Agents" }]}
        actions={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button>+ Add Agent</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add agent</DialogTitle>
                <DialogDescription>Create a new sales agent profile.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="agent-name">Full name</Label>
                  <Input
                    id="agent-name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Mpho Rasila"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="agent-email">Email</Label>
                    <Input
                      id="agent-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="agent@meridian.co.za"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="agent-phone">Phone</Label>
                    <Input
                      id="agent-phone"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="+27 8x xxx xxxx"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Role</Label>
                    <Select
                      value={form.role}
                      onValueChange={(v) => setForm((f) => ({ ...f, role: v as Agent["role"] }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sales Agent">Sales Agent</SelectItem>
                        <SelectItem value="Senior Agent">Senior Agent</SelectItem>
                        <SelectItem value="Team Lead">Team Lead</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="agent-target">Monthly target (R)</Label>
                    <Input
                      id="agent-target"
                      type="number"
                      value={form.monthlyTarget}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, monthlyTarget: Number(e.target.value) || 0 }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Commission rate</Label>
                    <span className="text-sm font-medium tabular-nums">{form.commissionRate}%</span>
                  </div>
                  <Slider
                    value={[form.commissionRate]}
                    onValueChange={([v]) => setForm((f) => ({ ...f, commissionRate: v ?? 10 }))}
                    min={0}
                    max={25}
                    step={1}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)} disabled={adding}>
                  Cancel
                </Button>
                <Button onClick={handleAddAgent} disabled={adding}>
                  {adding ? "Adding…" : "Add agent"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Dialog open={!!tempPasswordResult} onOpenChange={(o) => !o && setTempPasswordResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tempPasswordResult?.mode === "reset" ? "Password reset" : "Agent account created"}</DialogTitle>
            <DialogDescription>
              Share this temporary password with {tempPasswordResult?.email} — it won't be shown again. They should
              change it after signing in.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
            <code className="text-sm font-medium">{tempPasswordResult?.tempPassword}</code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (tempPasswordResult) {
                  navigator.clipboard?.writeText(tempPasswordResult.tempPassword);
                  toast.success("Copied to clipboard");
                }
              }}
            >
              <Copy className="mr-1.5 size-3.5" /> Copy
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setTempPasswordResult(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-6 space-y-6">
        <KpiGrid>
          <KpiCard label="Total agents" value={totalAgents} icon={Users} tone="primary" />
          <KpiCard label="Active now" value={activeNow} icon={Activity} tone="success" />
          <KpiCard label="Online now" value={onlineNow} icon={Radio} tone="success" />
          <KpiCard label="Avg conversion" value={`${avgConversion}%`} icon={TrendingUp} />
          <KpiCard
            label="Total commission (month)"
            value={formatZAR(totalCommission, { compact: true })}
            icon={Wallet}
            tone="warning"
          />
        </KpiGrid>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search agents…"
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Sort: Revenue</SelectItem>
                <SelectItem value="conversion">Sort: Conversion</SelectItem>
                <SelectItem value="calls">Sort: Calls today</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "flex size-8 items-center justify-center rounded-md transition-colors",
                view === "grid" ? "bg-card shadow-[var(--shadow-card)] text-foreground" : "text-muted-foreground",
              )}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              onClick={() => setView("table")}
              className={cn(
                "flex size-8 items-center justify-center rounded-md transition-colors",
                view === "table" ? "bg-card shadow-[var(--shadow-card)] text-foreground" : "text-muted-foreground",
              )}
            >
              <List className="size-4" />
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No agents found"
            description="Try adjusting your search or filters."
          />
        ) : view === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((s) => (
              <AgentCard
                key={s.agent.id}
                stats={s}
                pending={togglingId === s.agent.id}
                resetting={resettingId === s.agent.id}
                onToggleStatus={() => toggleStatus(s.agent)}
                onReassign={() => toast.info(`Reassign leads for ${s.agent.name} — coming soon`)}
                onResetPassword={() => handleResetPassword(s.agent)}
                onDeactivate={() => setDeactivateTarget(s.agent)}
                onRemove={() => setRemoveTarget(s.agent)}
              />
            ))}
          </div>
        ) : (
          <div className="surface-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Live</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Calls today</TableHead>
                  <TableHead className="text-right">Interested</TableHead>
                  <TableHead className="text-right">Closed</TableHead>
                  <TableHead className="text-right">Conversion</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.agent.id}>
                    <TableCell>
                      <Link to="/admin/agents/$id" params={{ id: s.agent.id }} className="hover:underline">
                        <AvatarChip name={s.agent.name} subtitle={s.agent.email} />
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Pill tone={s.agent.status === "Active" ? "success" : "neutral"}>
                        {s.agent.status}
                      </Pill>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        <span
                          className={cn(
                            "size-2 rounded-full",
                            s.agent.online ? "bg-success" : "bg-muted-foreground",
                          )}
                        />
                        {s.agent.online ? "Online" : "Offline"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{s.leadsCount}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.callsToday}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.interested}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.closedWon}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.conversion}%</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatZAR(s.revenue, { compact: true })}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatZAR(s.commission, { compact: true })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8" aria-label="Agent actions">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to="/admin/agents/$id" params={{ id: s.agent.id }}>
                              View profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toast.info(`Reassign leads for ${s.agent.name} — coming soon`)}
                          >
                            Reassign leads
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={resettingId === s.agent.id}
                            onClick={() => handleResetPassword(s.agent)}
                          >
                            {resettingId === s.agent.id ? "Resetting…" : "Reset password"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeactivateTarget(s.agent)}>
                            {s.agent.status === "Active" ? "Deactivate" : "Reactivate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setRemoveTarget(s.agent)}
                          >
                            Delete agent
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog open={!!deactivateTarget} onOpenChange={(o) => !o && setDeactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deactivateTarget?.status === "Active" ? "Deactivate" : "Reactivate"} {deactivateTarget?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deactivateTarget?.status === "Active"
                ? "They will no longer receive new lead assignments until reactivated."
                : "They will become eligible for new lead assignments again."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deactivateTarget && togglingId === deactivateTarget.id}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={!!deactivateTarget && togglingId === deactivateTarget.id}
            >
              {deactivateTarget && togglingId === deactivateTarget.id ? "Saving…" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removeTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Their sign-in is disabled immediately and they're removed from the active roster. This doesn't delete
              their historical leads, deals, or audit entries — it's reversible via "Change role" if they need access
              again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!removeTarget && removingId === removeTarget.id}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRemove}
              disabled={!!removeTarget && removingId === removeTarget.id}
            >
              {removeTarget && removingId === removeTarget.id ? "Removing…" : "Remove agent"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function AgentCard({
  stats,
  pending,
  resetting,
  onToggleStatus,
  onReassign,
  onResetPassword,
  onDeactivate,
  onRemove,
}: {
  stats: ReturnType<typeof computeAgentStats>;
  pending?: boolean;
  resetting?: boolean;
  onToggleStatus: () => void;
  onReassign: () => void;
  onResetPassword: () => void;
  onDeactivate: () => void;
  onRemove: () => void;
}) {
  const { agent } = stats;
  const targetPct = Math.min(100, Math.round((stats.revenue / Math.max(1, agent.monthlyTarget)) * 100));

  return (
    <div className="surface-card flex flex-col gap-4 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]">
      <div className="flex items-start justify-between gap-2">
        <AvatarChip name={agent.name} subtitle={agent.email} size="lg" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label="Agent actions">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onReassign}>Reassign leads</DropdownMenuItem>
            <DropdownMenuItem disabled={resetting} onClick={onResetPassword}>
              {resetting ? "Resetting…" : "Reset password"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDeactivate}>
              {agent.status === "Active" ? "Deactivate" : "Reactivate"}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={onRemove}>
              Delete agent
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-2 text-xs font-medium">
          <span
            className={cn(
              "size-2 rounded-full",
              agent.status === "Active" ? "bg-success" : "bg-muted-foreground",
            )}
          />
          {agent.status === "Active" ? "Active" : "Inactive"}
        </div>
        <Switch checked={agent.status === "Active"} disabled={pending} onCheckedChange={onToggleStatus} />
      </div>

      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span
          className={cn("size-2 rounded-full", agent.online ? "bg-success" : "bg-muted-foreground")}
        />
        {agent.online ? "Online now" : "Offline"}
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <div>
          <p className="text-sm font-semibold tabular-nums">{stats.leadsCount}</p>
          <p className="text-[11px] text-muted-foreground">Leads</p>
        </div>
        <div>
          <p className="text-sm font-semibold tabular-nums">{stats.callsToday}</p>
          <p className="text-[11px] text-muted-foreground">Calls today</p>
        </div>
        <div>
          <p className="text-sm font-semibold tabular-nums">{stats.closedWon}</p>
          <p className="text-[11px] text-muted-foreground">Closed</p>
        </div>
        <div>
          <p className="text-sm font-semibold tabular-nums">{stats.conversion}%</p>
          <p className="text-[11px] text-muted-foreground">Conversion</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Revenue</span>
        <span className="font-semibold tabular-nums">{formatZAR(stats.revenue, { compact: true })}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Commission earned</span>
        <span className="font-semibold tabular-nums text-success">
          {formatZAR(stats.commission, { compact: true })}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Monthly target</span>
          <span>{targetPct}%</span>
        </div>
        <Progress value={targetPct} />
      </div>

      <Button asChild variant="outline" className="w-full">
        <Link to="/admin/agents/$id" params={{ id: agent.id }}>
          View profile
        </Link>
      </Button>
    </div>
  );
}
