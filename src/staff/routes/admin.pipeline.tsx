import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { MoreHorizontal, Search, Phone, Eye, UserPlus } from "lucide-react";
import { AppShell } from "@staff/components/layout/app-shell";
import { PageHeader } from "@staff/components/shared/page-header";
import { KpiCard, KpiGrid } from "@staff/components/shared/kpi-card";
import { AvatarChip, UnassignedChip } from "@staff/components/shared/avatar-chip";
import { Pill } from "@staff/components/shared/status-badge";
import { Button } from "@staff/components/ui/button";
import { Input } from "@staff/components/ui/input";
import { Checkbox } from "@staff/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@staff/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@staff/components/ui/dropdown-menu";
import { useAgents } from "@staff/lib/agents-data";
import { useLeads } from "@staff/lib/leads";
import type { Agent, Lead, LeadStatus } from "@staff/lib/types";
import { formatZAR, relativeTime, formatDate, isOverdue } from "@staff/lib/format";

export const Route = createFileRoute("/admin/pipeline")({
  head: () => ({
    meta: [
      { title: "Sales Pipeline — Meridian CRM" },
      { name: "description", content: "Kanban view of the Meridian CRM sales pipeline by status." },
      { property: "og:title", content: "Sales Pipeline — Meridian CRM" },
      { property: "og:description", content: "See leads move through the sales pipeline as agents log calls." },
    ],
  }),
  component: PageAdminPipeline,
});

const COLUMNS: { key: string; label: string; statuses: LeadStatus[] }[] = [
  { key: "new", label: "New", statuses: ["New"] },
  { key: "assigned", label: "Assigned", statuses: ["Assigned"] },
  { key: "contacted", label: "Contacted", statuses: ["Called"] },
  { key: "interested", label: "Interested", statuses: ["Interested"] },
  { key: "followup", label: "Follow-up", statuses: ["Follow-up"] },
  { key: "proposal", label: "Proposal Sent", statuses: ["Proposal Sent"] },
  { key: "won", label: "Closed Won", statuses: ["Closed Won"] },
  { key: "lost", label: "Closed Lost", statuses: ["Closed Lost", "Not Interested"] },
];

const ALL = "all";

function PageAdminPipeline() {
  const { data: leads = [] } = useLeads();
  const { data: agents = [] } = useAgents();
  const [search, setSearch] = useState("");
  const [agentFilter, setAgentFilter] = useState(ALL);
  const [onlyUnassigned, setOnlyUnassigned] = useState(false);

  const agentOf = (id: string | null) => agents.find((a) => a.id === id) ?? null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (q && !`${l.business} ${l.contactPerson}`.toLowerCase().includes(q)) return false;
      if (agentFilter !== ALL && l.assignedAgentId !== agentFilter) return false;
      if (onlyUnassigned && l.assignedAgentId !== null) return false;
      return true;
    });
  }, [leads, search, agentFilter, onlyUnassigned]);

  const totalValue = filtered.reduce((sum, l) => sum + l.value, 0);
  const openValue = filtered
    .filter((l) => l.status !== "Closed Won" && l.status !== "Closed Lost" && l.status !== "Not Interested")
    .reduce((sum, l) => sum + l.value, 0);
  const wonValue = filtered.filter((l) => l.status === "Closed Won").reduce((sum, l) => sum + l.value, 0);

  const leadsFor = (col: (typeof COLUMNS)[number]) => filtered.filter((l) => col.statuses.includes(l.status));

  return (
    <AppShell>
      <PageHeader
        title="Sales pipeline"
        subtitle="Updates automatically as agents log calls — no manual changes needed here."
        crumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Pipeline" }]}
      />

      <div className="mt-6 space-y-6">
        <KpiGrid>
          <KpiCard label="Pipeline leads" value={filtered.length} tone="default" />
          <KpiCard label="Total pipeline value" value={formatZAR(totalValue, { compact: true })} tone="primary" />
          <KpiCard label="Open opportunity value" value={formatZAR(openValue, { compact: true })} tone="warning" />
          <KpiCard label="Closed won value" value={formatZAR(wonValue, { compact: true })} tone="success" />
        </KpiGrid>

        <div className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search business or contact…" className="pl-9" />
          </div>
          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by agent" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All agents</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={onlyUnassigned} onCheckedChange={(c) => setOnlyUnassigned(!!c)} />
            Only unassigned
          </label>
        </div>

        <div className="scrollbar-slim flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colLeads = leadsFor(col);
            const colValue = colLeads.reduce((sum, l) => sum + l.value, 0);
            return (
              <div
                key={col.key}
                className="flex w-[300px] shrink-0 flex-col rounded-xl border border-border bg-muted/30"
              >
                <div className="flex items-center justify-between border-b border-border/70 px-3.5 py-3">
                  <div>
                    <p className="text-sm font-semibold">{col.label}</p>
                    <p className="text-xs text-muted-foreground">{colLeads.length} leads · {formatZAR(colValue, { compact: true })}</p>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2.5 p-2.5">
                  {colLeads.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border/70 px-3 py-6 text-center text-xs text-muted-foreground">
                      No leads
                    </p>
                  ) : (
                    colLeads.map((lead) => (
                      <PipelineCard
                        key={lead.id}
                        lead={lead}
                        agent={agentOf(lead.assignedAgentId)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

function PipelineCard({
  lead,
  agent,
}: {
  lead: Lead;
  agent: Agent | null;
}) {
  const overdue = isOverdue(lead.nextFollowUp);

  return (
    <div className="space-y-2.5 rounded-lg border border-border bg-card p-3 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{lead.business}</p>
          <p className="truncate text-xs text-muted-foreground">{lead.industry}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-6 shrink-0" aria-label="Lead actions">
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/agent/leads/$id" params={{ id: lead.id }}>
                <Eye className="mr-2 size-4" /> Open lead
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info("Open the Assign dialog from the Leads table")}>
              <UserPlus className="mr-2 size-4" /> Assign
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.success(`Calling ${lead.contactPerson}…`)}>
              <Phone className="mr-2 size-4" /> Call
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="text-sm font-semibold tabular-nums text-primary">{formatZAR(lead.value)}</p>
      <div className="flex items-center justify-between gap-2">
        {agent ? <AvatarChip name={agent.name} size="sm" /> : <UnassignedChip />}
        <span className="shrink-0 text-[11px] text-muted-foreground">{relativeTime(lead.lastContact)}</span>
      </div>
      {lead.nextFollowUp ? (
        <Pill tone={overdue ? "danger" : "neutral"} size="sm">
          Follow-up {formatDate(lead.nextFollowUp)}
        </Pill>
      ) : null}
    </div>
  );
}
