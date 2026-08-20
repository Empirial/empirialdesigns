import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Phone, PhoneCall, Target, Users } from "lucide-react";

import { AppShell } from "@staff/components/layout/app-shell";
import { Avatar, AvatarFallback } from "@staff/components/ui/avatar";
import { Badge } from "@staff/components/ui/badge";
import { PageHeader } from "@staff/components/shared/page-header";
import { EmptyState } from "@staff/components/shared/empty-state";
import { SectionCard } from "@staff/components/shared/section-card";
import { callGetMyTeam } from "@staff/lib/functions";

export const Route = createFileRoute("/agent/team")({
  head: () => ({ meta: [{ title: "My Team — Empirial CRM" }] }),
  component: PageAgentTeam,
});

function PageAgentTeam() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["team", "mine"],
    queryFn: async () => (await callGetMyTeam()).data.team,
  });
  const team = data ?? [];

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
          <SectionCard title={`${team.length} assigned ${team.length === 1 ? "agent" : "agents"}`}>
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
                    <span className="flex items-center gap-1"><Target className="size-3.5" />R{member.monthlyTarget.toLocaleString("en-ZA")} target · {member.targetDeals} deals</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        ) : null}
      </div>
    </AppShell>
  );
}
