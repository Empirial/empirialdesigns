import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CheckCircle2,
  CircleDot,
  Clock3,
  Eye,
  Filter,
  MoreHorizontal,
  PhoneCall,
  Search,
  X,
} from "lucide-react";
import { AppShell } from "@staff/components/layout/app-shell";
import { PageHeader } from "@staff/components/shared/page-header";
import { AvatarChip, UnassignedChip } from "@staff/components/shared/avatar-chip";
import { Pill, StatusBadge } from "@staff/components/shared/status-badge";
import { Button } from "@staff/components/ui/button";
import { Checkbox } from "@staff/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@staff/components/ui/dropdown-menu";
import { Input } from "@staff/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@staff/components/ui/select";
import { useAgents } from "@staff/lib/agents-data";
import { formatDate, formatZAR, isOverdue, relativeTime } from "@staff/lib/format";
import { useLeads } from "@staff/lib/leads";
import type { Agent, Lead, LeadStatus } from "@staff/lib/types";
import { cn } from "@staff/lib/utils";

export const Route = createFileRoute("/admin/pipeline")({
  head: () => ({
    meta: [
      { title: "Sales Pipeline — Meridian CRM" },
      { name: "description", content: "A live view of every sales opportunity by stage." },
      { property: "og:title", content: "Sales Pipeline — Meridian CRM" },
      { property: "og:description", content: "See leads move through the sales pipeline as agents log calls." },
    ],
  }),
  component: PageAdminPipeline,
});

type PipelineColumn = {
  key: string;
  label: string;
  description: string;
  statuses: LeadStatus[];
  accent: string;
  icon: typeof CircleDot;
};

const COLUMNS: PipelineColumn[] = [
  { key: "inbox", label: "Inbox", description: "New and unworked", statuses: ["New", "Assigned", "Not Called"], accent: "bg-sky-500", icon: CircleDot },
  { key: "contacted", label: "Contacted", description: "Conversation started", statuses: ["Called"], accent: "bg-indigo-500", icon: PhoneCall },
  { key: "interested", label: "Interested", description: "Qualified opportunity", statuses: ["Interested"], accent: "bg-violet-500", icon: ArrowUpRight },
  { key: "followup", label: "Follow-up", description: "Needs attention", statuses: ["Follow-up"], accent: "bg-amber-500", icon: Clock3 },
  { key: "proposal", label: "Proposal sent", description: "Awaiting decision", statuses: ["Proposal Sent"], accent: "bg-fuchsia-500", icon: ArrowUpRight },
  { key: "won", label: "Won", description: "Closed successfully", statuses: ["Closed Won"], accent: "bg-emerald-500", icon: CheckCircle2 },
  { key: "lost", label: "Lost", description: "Not progressing", statuses: ["Closed Lost", "Not Interested"], accent: "bg-rose-500", icon: X },
];

const ALL = "all";

function PageAdminPipeline() {
  const { data: leads = [] } = useLeads();
  const { data: agents = [] } = useAgents();
  const [search, setSearch] = useState("");
  const [agentFilter, setAgentFilter] = useState(ALL);
  const [onlyUnassigned, setOnlyUnassigned] = useState(false);
  const [attentionOnly, setAttentionOnly] = useState(false);

  const agentMap = useMemo(() => new Map(agents.map((agent) => [agent.id, agent])), [agents]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (query && !`${lead.business} ${lead.contactPerson} ${lead.industry}`.toLowerCase().includes(query)) return false;
      if (agentFilter !== ALL && lead.assignedAgentId !== agentFilter) return false;
      if (onlyUnassigned && lead.assignedAgentId !== null) return false;
      if (attentionOnly && !(lead.nextFollowUp && isOverdue(lead.nextFollowUp))) return false;
      return true;
    });
  }, [leads, search, agentFilter, onlyUnassigned, attentionOnly]);

  const summary = useMemo(() => {
    let totalValue = 0;
    let wonValue = 0;
    let overdue = 0;
    let openValue = 0;
    for (const lead of filtered) {
      totalValue += lead.value;
      if (lead.status === "Closed Won") wonValue += lead.value;
      if (lead.nextFollowUp && isOverdue(lead.nextFollowUp)) overdue += 1;
      if (!CLOSED_STATUSES.has(lead.status)) openValue += lead.value;
    }
    return { totalValue, wonValue, overdue, openValue };
  }, [filtered]);

  const hasFilters = Boolean(search) || agentFilter !== ALL || onlyUnassigned || attentionOnly;
  const clearFilters = () => {
    setSearch("");
    setAgentFilter(ALL);
    setOnlyUnassigned(false);
    setAttentionOnly(false);
  };

  return (
    <AppShell>
      <PageHeader
        title="Sales pipeline"
        subtitle="A live view of your opportunities. Lead stages update as your team logs calls."
        crumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Pipeline" }]}
      />

      <div className="mt-6 space-y-5">
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
            <PipelineMetric label="Open opportunity value" value={formatZAR(summary.openValue, { compact: true })} detail={`${filtered.length} leads in view`} tone="text-primary" />
            <PipelineMetric label="Awaiting follow-up" value={summary.overdue} detail={summary.overdue === 1 ? "lead needs attention" : "leads need attention"} tone="text-amber-600" />
            <PipelineMetric label="Won value" value={formatZAR(summary.wonValue, { compact: true })} detail="from current view" tone="text-emerald-600" />
            <PipelineMetric label="Pipeline value" value={formatZAR(summary.totalValue, { compact: true })} detail="including closed outcomes" tone="text-foreground" />
          </div>
        </section>

        <section className="surface-card space-y-3 p-3 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search company, contact or industry…" className="h-10 pl-9" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger className="h-10 w-[180px]"><SelectValue placeholder="All agents" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All agents</SelectItem>
                  {agents.map((agent) => <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant={attentionOnly ? "default" : "outline"} size="sm" className="h-10" onClick={() => setAttentionOnly((value) => !value)}>
                <Clock3 className="mr-2 size-4" /> Needs attention {summary.overdue > 0 ? `(${summary.overdue})` : ""}
              </Button>
              {hasFilters ? <Button variant="ghost" size="sm" className="h-10" onClick={clearFilters}><X className="mr-1.5 size-4" /> Clear</Button> : null}
            </div>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={onlyUnassigned} onCheckedChange={(checked) => setOnlyUnassigned(Boolean(checked))} />
            Show only unassigned leads
          </label>
        </section>

        <div className="flex items-center justify-between gap-3 px-1">
          <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{filtered.length}</span> leads shown across {COLUMNS.length} stages</p>
          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex"><Filter className="size-3.5" /> Scroll to explore stages</span>
        </div>

        <div className="scrollbar-slim flex snap-x gap-4 overflow-x-auto pb-5">
          {COLUMNS.map((column) => {
            const columnLeads = filtered.filter((lead) => column.statuses.includes(lead.status));
            const columnValue = columnLeads.reduce((sum, lead) => sum + lead.value, 0);
            return <PipelineColumn key={column.key} column={column} leads={columnLeads} agentMap={agentMap} value={columnValue} />;
          })}
        </div>
      </div>
    </AppShell>
  );
}

const CLOSED_STATUSES = new Set<LeadStatus>(["Closed Won", "Closed Lost", "Not Interested"]);

function PipelineMetric({ label, value, detail, tone }: { label: string; value: React.ReactNode; detail: string; tone: string }) {
  return <div className="min-w-0 px-4 py-4 sm:px-5"><p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className={cn("mt-2 truncate text-2xl font-semibold tracking-tight tabular-nums", tone)}>{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>;
}

function PipelineColumn({ column, leads, agentMap, value }: { column: PipelineColumn; leads: Lead[]; agentMap: Map<string, Agent>; value: number }) {
  const Icon = column.icon;
  return (
    <section className="flex w-[310px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border bg-muted/25">
      <header className="border-b border-border bg-card px-4 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5"><span className={cn("grid size-8 shrink-0 place-items-center rounded-lg text-white", column.accent)}><Icon className="size-4" /></span><div className="min-w-0"><h2 className="text-sm font-semibold">{column.label}</h2><p className="truncate text-xs text-muted-foreground">{column.description}</p></div></div>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">{leads.length}</span>
        </div>
        <p className="mt-3 text-xs font-medium text-muted-foreground">{formatZAR(value, { compact: true })} <span className="font-normal">in value</span></p>
      </header>
      <div className="flex min-h-[180px] flex-1 flex-col gap-3 p-3">
        {leads.length ? leads.map((lead) => <PipelineCard key={lead.id} lead={lead} agent={lead.assignedAgentId ? agentMap.get(lead.assignedAgentId) ?? null : null} />) : <EmptyColumn label={column.label} />}
      </div>
    </section>
  );
}

function EmptyColumn({ label }: { label: string }) {
  return <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/60 px-5 text-center"><CheckCircle2 className="mb-2 size-5 text-muted-foreground/60" /><p className="text-sm font-medium">No {label.toLowerCase()} leads</p><p className="mt-1 text-xs text-muted-foreground">This stage is clear for now.</p></div>;
}

function PipelineCard({ lead, agent }: { lead: Lead; agent: Agent | null }) {
  const overdue = Boolean(lead.nextFollowUp && isOverdue(lead.nextFollowUp));
  return (
    <article className={cn("group rounded-xl border bg-card p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]", overdue ? "border-amber-300 ring-1 ring-amber-200/70" : "border-border")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0"><Link to="/admin/leads" search={{ leadId: lead.id }} className="block truncate text-sm font-semibold leading-5 hover:text-primary hover:underline">{lead.business}</Link><p className="mt-0.5 truncate text-xs text-muted-foreground">{lead.contactPerson} · {lead.industry}</p></div>
        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-7 shrink-0 opacity-70 group-hover:opacity-100" aria-label={`Actions for ${lead.business}`}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem asChild><Link to="/admin/leads" search={{ leadId: lead.id }}><Eye className="mr-2 size-4" /> Open lead</Link></DropdownMenuItem><DropdownMenuItem asChild><a href={`tel:${lead.phone}`}><PhoneCall className="mr-2 size-4" /> Call contact</a></DropdownMenuItem></DropdownMenuContent></DropdownMenu>
      </div>
      <div className="mt-4 flex items-end justify-between gap-2"><p className="text-lg font-semibold tracking-tight tabular-nums text-primary">{formatZAR(lead.value)}</p><StatusBadge status={lead.status} size="sm" /></div>
      <div className="mt-3 border-t border-border/70 pt-3">{agent ? <AvatarChip name={agent.name} size="sm" /> : <UnassignedChip />}</div>
      <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-muted-foreground"><span>{lead.lastContact ? `Contacted ${relativeTime(lead.lastContact)}` : "No contact yet"}</span>{lead.nextFollowUp ? <Pill tone={overdue ? "warning" : "neutral"} size="sm" className={cn(overdue && "font-semibold")}><Clock3 className="mr-1 inline size-3" /> {overdue ? "Overdue" : formatDate(lead.nextFollowUp)}</Pill> : null}</div>
    </article>
  );
}
