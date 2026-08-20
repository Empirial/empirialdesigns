import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Phone, PhoneCall, Target, Users } from "lucide-react";

import { AppShell } from "@staff/components/layout/app-shell";
import { Avatar, AvatarFallback } from "@staff/components/ui/avatar";
import { Badge } from "@staff/components/ui/badge";
import { PageHeader } from "@staff/components/shared/page-header";
import { EmptyState } from "@staff/components/shared/empty-state";
import { SectionCard } from "@staff/components/shared/section-card";
import { KpiCard, KpiGrid } from "@staff/components/shared/kpi-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@staff/components/ui/table";
import { callGetMyTeam } from "@staff/lib/functions";
import { formatDate } from "@staff/lib/format";

export const Route = createFileRoute("/agent/team")({
  head: () => ({ meta: [{ title: "My Team — Empirial CRM" }] }),
  component: PageAgentTeam,
});

function PageAgentTeam() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["team", "mine"],
    queryFn: async () => (await callGetMyTeam()).data,
  });
  const team = data?.team ?? [];
  const interestedLeads = data?.interestedLeads ?? [];
  const followUpLeads = data?.followUpLeads ?? [];
  const callsThisWeek = team.reduce((total, agent) => total + agent.callsThisWeek, 0);
  const callsLeft = team.reduce((total, agent) => total + agent.callsLeft, 0);

  return (
    <AppShell>
      <PageHeader
        title="My Team"
        subtitle="Agents assigned to you by an administrator."
        crumbs={[{ label: "Agent", to: "/agent/dashboard" }, { label: "My Team" }]}
      />
      <div className="mt-6">
        {isLoading ? <p className="text-sm text-muted-foreground">Loading your team…</p> : null}
        {error ? <EmptyState icon={Users} title="Your team couldn't be loaded" description="Please refresh the page or contact an administrator." /> : null}
        {!isLoading && !error && team.length === 0 ? (
          <EmptyState icon={Users} title="No agents assigned yet" description="Ask an administrator to assign agents to your team." />
        ) : null}
        {!isLoading && !error && team.length > 0 ? (
          <div className="space-y-6">
          <KpiGrid>
            <KpiCard label="Team agents" value={team.length} icon={Users} tone="primary" />
            <KpiCard label="Calls this week" value={callsThisWeek} icon={PhoneCall} tone="success" />
            <KpiCard label="Calls left" value={callsLeft} icon={Phone} tone="warning" />
            <KpiCard label="Interested leads" value={interestedLeads.length} icon={Target} tone="primary" />
            <KpiCard label="Follow-ups" value={followUpLeads.length} icon={CalendarDays} tone="warning" />
          </KpiGrid>
          <SectionCard title={`${team.length} assigned ${team.length === 1 ? "agent" : "agents"}`} description="Only agents assigned to your team are shown here.">
            <div className="divide-y divide-border">
              {team.map((member) => (
                <div key={member.id} className="flex flex-col gap-4 py-4 first:pt-0 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar><AvatarFallback className="bg-primary/10 text-primary">{member.initials || member.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.role} · {member.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground lg:justify-end">
                    <Badge variant={member.status === "Active" ? "default" : "secondary"}>{member.status}</Badge>
                    <span className="flex items-center gap-1"><span className={`size-2 rounded-full ${member.online ? "bg-success" : "bg-muted-foreground"}`} />{member.online ? "Online" : "Offline"}</span>
                    {member.phone ? <span className="flex items-center gap-1"><Phone className="size-3.5" />{member.phone}</span> : null}
                    <span className="flex items-center gap-1"><PhoneCall className="size-3.5" />{member.callsToday} calls today</span>
                    <span className="flex items-center gap-1"><CalendarDays className="size-3.5" />{member.callsThisWeek} this week</span>
                    <span>{member.totalLeads} assigned</span>
                    <span>{member.callsLeft} calls left</span>
                    <span>{member.interested} interested</span>
                    <span>{member.followUps} follow-ups</span>
                    <span>{member.closedDeals} closed deals</span>
                    <span className="flex items-center gap-1"><Target className="size-3.5" />R{member.monthlyTarget.toLocaleString("en-ZA")} target · {member.targetDeals} deals</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
          <div className="grid gap-6 xl:grid-cols-2">
            <TeamContactTable title="Interested leads" description="Contacts currently interested in your team's services." leads={interestedLeads} dateLabel="Last contact" />
            <TeamContactTable title="Follow-up contacts" description="Contacts your team needs to follow up with." leads={followUpLeads} dateLabel="Follow-up due" followUpDates />
          </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

function TeamContactTable({
  title,
  description,
  leads,
  dateLabel,
  followUpDates = false,
}: {
  title: string;
  description: string;
  leads: { id: string; business: string; contactPerson: string; phone: string; email: string; agentName: string; nextFollowUp: string | null; lastContact: string | null }[];
  dateLabel: string;
  followUpDates?: boolean;
}) {
  return (
    <SectionCard title={title} description={`${description} ${leads.length} total.`} noPadding>
      <div className="max-h-[420px] overflow-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Contact</TableHead><TableHead>Agent</TableHead><TableHead>{dateLabel}</TableHead></TableRow></TableHeader>
          <TableBody>
            {leads.length === 0 ? <TableRow><TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">No contacts in this list.</TableCell></TableRow> : leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell><p className="font-medium">{lead.business}</p><p className="text-xs text-muted-foreground">{lead.contactPerson || lead.phone || lead.email || "No contact details"}</p></TableCell>
                <TableCell className="text-sm">{lead.agentName}</TableCell>
                <TableCell className="text-sm">{formatDate((followUpDates ? lead.nextFollowUp : lead.lastContact) ?? "")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </SectionCard>
  );
}
