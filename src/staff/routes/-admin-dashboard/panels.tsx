import { Link } from "@tanstack/react-router";
import { SectionCard } from "@staff/components/shared/section-card";
import { EmptyState } from "@staff/components/shared/empty-state";
import { AvatarChip } from "@staff/components/shared/avatar-chip";
import { Progress } from "@staff/components/ui/progress";
import { Button } from "@staff/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@staff/components/ui/table";
import { formatDateTime, formatZAR, relativeTime } from "@staff/lib/format";
import type { Agent, Deal, FollowUp, Lead, Service } from "@staff/lib/types";
import { PhoneCall } from "lucide-react";
import { cn } from "@staff/lib/utils";

const AUDIT_ACTION_LABELS: Record<string, string> = {
  "leads.logCall": "Call logged",
  "leads.bulkAssign": "Leads assigned",
  "leads.bulkSetStatus": "Lead status updated",
  "leads.bulkDelete": "Leads deleted",
  "deals.setPayment": "Commission payment updated",
  "agents.toggleStatus": "Agent status changed",
  "users.invite": "Agent invited",
  "users.changeRole": "User role changed",
  "users.remove": "User removed",
};

export function TopServicesPanel({ items }: { items: { service: Service; revenue: number }[] }) {
  return (
    <SectionCard title="Top Services" description="Revenue by service" className="xl:col-span-4" noPadding>
      <div className="space-y-1 p-4">
        {items.length === 0 ? (
          <EmptyState compact title="No closed revenue yet" />
        ) : (
          items.map((s) => {
            const max = items[0]!.revenue || 1;
            return (
              <div key={s.service.id} className="py-2">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{s.service.name}</span>
                  <span className="text-muted-foreground tabular-nums">{formatZAR(s.revenue, { compact: true })}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(6, Math.round((s.revenue / max) * 100))}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </SectionCard>
  );
}

export function AgentLeaderboardPanel({
  rows,
}: {
  rows: { agent: Agent; deals: number; revenue: number; conversion: number; progress: number }[];
}) {
  return (
    <SectionCard title="Agent Leaderboard" description="Ranked by revenue this period" className="xl:col-span-6" noPadding>
      <div className="divide-y divide-border">
        {rows.map((row, i) => (
          <Link
            key={row.agent.id}
            to="/admin/agents/$id"
            params={{ id: row.agent.id }}
            className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/50"
          >
            <span className="w-5 text-xs font-semibold text-muted-foreground">#{i + 1}</span>
            <AvatarChip name={row.agent.name} subtitle={row.agent.role} />
            <div className="ml-auto flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums">{row.deals}</p>
                <p className="text-[11px] text-muted-foreground">deals</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums">{formatZAR(row.revenue, { compact: true })}</p>
                <p className="text-[11px] text-muted-foreground">revenue</p>
              </div>
              <div className="w-28">
                <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                  <span>{row.conversion}% conv.</span>
                  <span>{row.progress}%</span>
                </div>
                <Progress value={row.progress} className="h-1.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}

export function UpcomingFollowUpsPanel({ items, leads }: { items: FollowUp[]; leads: Lead[] }) {
  return (
    <SectionCard title="Upcoming Follow-ups" description="Next 5 open" className="xl:col-span-6" noPadding>
      <div className="divide-y divide-border">
        {items.length === 0 ? (
          <EmptyState compact title="No follow-ups scheduled" className="m-4" />
        ) : (
          items.map((fu) => {
            const lead = leads.find((l) => l.id === fu.leadId);
            return (
              <div key={fu.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{lead?.business ?? "Unknown business"}</p>
                  <p className="text-xs text-muted-foreground">{fu.reason} · {formatDateTime(fu.dueAt)}</p>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/admin/leads">
                    <PhoneCall className="size-3.5" />
                    Call
                  </Link>
                </Button>
              </div>
            );
          })
        )}
      </div>
    </SectionCard>
  );
}

export function RecentDealsPanel({
  deals,
  agentOf,
  serviceOf,
}: {
  deals: Deal[];
  agentOf: (id: string) => Agent | undefined;
  serviceOf: (id: string) => Service | undefined;
}) {
  return (
    <SectionCard title="Recent Closed Deals" className="xl:col-span-7" noPadding>
      {deals.length === 0 ? (
        <EmptyState compact title="No deals closed yet" className="m-4" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Service</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead>Closed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deals.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.business}</TableCell>
                <TableCell>{agentOf(d.agentId)?.name ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{serviceOf(d.serviceId)?.name ?? "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{formatZAR(d.value)}</TableCell>
                <TableCell className="text-muted-foreground">{relativeTime(d.closedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </SectionCard>
  );
}

export function RecentActivityPanel({
  entries,
  agentOf,
}: {
  entries: { id: string; action: string; actorUid: string; at: string }[];
  agentOf: (id: string) => Agent | undefined;
}) {
  return (
    <SectionCard
      title="Recent Activity"
      description="Latest audit trail — Cloud Function actions, not a per-lead feed"
      className="xl:col-span-5"
    >
      {entries.length === 0 ? (
        <EmptyState compact title="No recent activity" />
      ) : (
        <ol className="space-y-3">
          {entries.map((entry) => {
            const actorName = agentOf(entry.actorUid)?.name ?? "Admin";
            return (
              <li
                key={entry.id}
                className={cn(
                  "flex items-start justify-between gap-3 border-b border-border/60 pb-3",
                  "last:border-0 last:pb-0",
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{AUDIT_ACTION_LABELS[entry.action] ?? entry.action}</p>
                  <p className="text-xs text-muted-foreground">by {actorName}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(entry.at)}</span>
              </li>
            );
          })}
        </ol>
      )}
    </SectionCard>
  );
}
