import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Phone, CalendarDays, CheckCircle2, ExternalLink, Clock } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@staff/components/layout/app-shell";
import { PageHeader } from "@staff/components/shared/page-header";
import { SectionCard } from "@staff/components/shared/section-card";
import { EmptyState } from "@staff/components/shared/empty-state";
import { StatusBadge } from "@staff/components/shared/status-badge";
import { Button } from "@staff/components/ui/button";
import { Calendar } from "@staff/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@staff/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@staff/components/ui/select";
import {
  completeFollowUp as completeFollowUpMutation,
  invalidateFollowUpQueries,
  rescheduleFollowUp as rescheduleFollowUpMutation,
  useMyFollowUps,
} from "@staff/lib/followups-data";
import { useLead } from "@staff/lib/leads";
import { formatDate, formatTime, isOverdue, isToday, relativeTime } from "@staff/lib/format";
import type { FollowUp } from "@staff/lib/types";
import { cn } from "@staff/lib/utils";

export const Route = createFileRoute("/agent/follow-ups")({
  head: () => ({
    meta: [
      { title: "Follow-ups — Meridian CRM" },
      { name: "description", content: "Manage every reminder and follow-up with your leads." },
      { property: "og:title", content: "Follow-ups — Meridian CRM" },
      { property: "og:description", content: "Manage every reminder and follow-up with your leads." },
    ],
  }),
  component: PageAgentFollowUps,
});

type Tab = "Overdue" | "Today" | "This Week" | "Upcoming" | "Completed";
const TABS: Tab[] = ["Overdue", "Today", "This Week", "Upcoming", "Completed"];
const TIME_OPTIONS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

function inThisWeek(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return d >= start && d < end;
}

function PageAgentFollowUps() {
  const { data: mine = [], isLoading, error } = useMyFollowUps();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("Overdue");
  const [dayFilter, setDayFilter] = useState<Date | undefined>(undefined);
  const [rescheduleTarget, setRescheduleTarget] = useState<FollowUp | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(undefined);
  const [rescheduleTime, setRescheduleTime] = useState<string>("10:00");
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState(false);

  const overdue = mine.filter((f) => f.status === "Open" && isOverdue(f.dueAt));
  const today = mine.filter((f) => f.status === "Open" && isToday(f.dueAt));
  const thisWeek = mine.filter((f) => f.status === "Open" && !isToday(f.dueAt) && !isOverdue(f.dueAt) && inThisWeek(f.dueAt));
  const upcoming = mine.filter((f) => f.status === "Open" && !isToday(f.dueAt) && !isOverdue(f.dueAt) && !inThisWeek(f.dueAt));
  const completed = mine.filter((f) => f.status === "Completed");

  const byTab: Record<Tab, FollowUp[]> = {
    Overdue: overdue,
    Today: today,
    "This Week": thisWeek,
    Upcoming: upcoming,
    Completed: completed,
  };

  let list = byTab[tab];
  if (dayFilter) {
    list = list.filter((f) => new Date(f.dueAt).toDateString() === dayFilter.toDateString());
  }

  const daysWithFollowUps = mine.filter((f) => f.status === "Open").map((f) => new Date(f.dueAt));

  async function handleComplete(f: FollowUp) {
    setCompletingId(f.id);
    try {
      await completeFollowUpMutation(f.id);
      invalidateFollowUpQueries(queryClient);
      toast.success("Follow-up marked complete");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't complete that follow-up — try again.");
    } finally {
      setCompletingId(null);
    }
  }

  function openReschedule(f: FollowUp) {
    setRescheduleTarget(f);
    setRescheduleDate(new Date(f.dueAt));
    setRescheduleTime(formatTime(f.dueAt) === "—" ? "10:00" : formatTime(f.dueAt));
  }

  async function confirmReschedule() {
    if (!rescheduleTarget || !rescheduleDate) return;
    const [h, m] = rescheduleTime.split(":").map(Number);
    const d = new Date(rescheduleDate);
    d.setHours(h ?? 10, m ?? 0, 0, 0);
    setRescheduling(true);
    try {
      await rescheduleFollowUpMutation(rescheduleTarget.id, d.toISOString());
      invalidateFollowUpQueries(queryClient);
      toast.success("Follow-up rescheduled");
      setRescheduleTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't reschedule — try again.");
    } finally {
      setRescheduling(false);
    }
  }

  if (isLoading) {
    return (
      <AppShell>
        <PageHeader
          title="Follow-ups"
          subtitle="Every reminder tied to your leads, organised so nothing slips through."
          crumbs={[{ label: "Agent", to: "/agent/dashboard" }, { label: "Follow-ups" }]}
        />
        <div className="mt-6 text-sm text-muted-foreground">Loading follow-ups…</div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <PageHeader
          title="Follow-ups"
          subtitle="Every reminder tied to your leads, organised so nothing slips through."
          crumbs={[{ label: "Agent", to: "/agent/dashboard" }, { label: "Follow-ups" }]}
        />
        <div className="mt-6 text-sm text-destructive">Couldn't load your follow-ups — try refreshing.</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Follow-ups"
        subtitle="Every reminder tied to your leads, organised so nothing slips through."
        crumbs={[{ label: "Agent", to: "/agent/dashboard" }, { label: "Follow-ups" }]}
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-[280px_1fr]">
        <div className="space-y-6">
          <SectionCard title="Summary">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Overdue</span>
                <span className="font-semibold text-destructive">{overdue.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Today</span>
                <span className="font-semibold">{today.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">This week</span>
                <span className="font-semibold">{thisWeek.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Upcoming</span>
                <span className="font-semibold">{upcoming.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-semibold text-success">{completed.length}</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Calendar" description="Click a day to filter">
            <Calendar
              mode="single"
              selected={dayFilter}
              onSelect={(d) => setDayFilter(d && dayFilter && d.toDateString() === dayFilter.toDateString() ? undefined : d)}
              modifiers={{ hasFollowUp: daysWithFollowUps }}
              modifiersClassNames={{ hasFollowUp: "text-primary font-bold underline decoration-primary/45 decoration-2 underline-offset-4" }}
              className="p-2"
            />
            {dayFilter ? (
              <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => setDayFilter(undefined)}>
                Clear day filter
              </Button>
            ) : null}
          </SectionCard>
        </div>

        <SectionCard noPadding>
          <div className="flex flex-wrap items-center gap-1.5 border-b border-border p-3">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {t}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    tab === t ? "bg-primary-foreground/20" : t === "Overdue" && byTab[t].length > 0 ? "bg-destructive/15 text-destructive" : "bg-muted",
                  )}
                >
                  {byTab[t].length}
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-3 p-5">
            {list.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title={tab === "Overdue" ? "All clear — nothing overdue" : `No follow-ups in "${tab}"`}
                description="You're on top of things."
              />
            ) : (
              list.map((f) => (
                <FollowUpRow
                  key={f.id}
                  f={f}
                  completingId={completingId}
                  rescheduleTarget={rescheduleTarget}
                  rescheduleDate={rescheduleDate}
                  rescheduleTime={rescheduleTime}
                  rescheduling={rescheduling}
                  onComplete={handleComplete}
                  onOpenReschedule={openReschedule}
                  onCloseReschedule={() => setRescheduleTarget(null)}
                  onRescheduleDateChange={setRescheduleDate}
                  onRescheduleTimeChange={setRescheduleTime}
                  onConfirmReschedule={confirmReschedule}
                />
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}

function FollowUpLeadInfo({ leadId }: { leadId: string }) {
  const { data: lead, isLoading } = useLead(leadId);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading lead…</p>;
  }
  if (!lead) {
    return <p className="text-sm text-muted-foreground">Lead not found</p>;
  }
  return (
    <>
      <div className="flex items-center gap-2">
        <p className="font-medium">{lead.business}</p>
        <StatusBadge status={lead.status} size="sm" />
      </div>
      <p className="mt-0.5 text-sm text-muted-foreground">
        {lead.contactPerson} · {lead.phone}
      </p>
    </>
  );
}

function FollowUpRow({
  f,
  completingId,
  rescheduleTarget,
  rescheduleDate,
  rescheduleTime,
  rescheduling,
  onComplete,
  onOpenReschedule,
  onCloseReschedule,
  onRescheduleDateChange,
  onRescheduleTimeChange,
  onConfirmReschedule,
}: {
  f: FollowUp;
  completingId: string | null;
  rescheduleTarget: FollowUp | null;
  rescheduleDate: Date | undefined;
  rescheduleTime: string;
  rescheduling: boolean;
  onComplete: (f: FollowUp) => void;
  onOpenReschedule: (f: FollowUp) => void;
  onCloseReschedule: () => void;
  onRescheduleDateChange: (d: Date | undefined) => void;
  onRescheduleTimeChange: (t: string) => void;
  onConfirmReschedule: () => void;
}) {
  const overdueFlag = f.status === "Open" && isOverdue(f.dueAt);
  const completing = completingId === f.id;

  return (
    <div className="rounded-xl border border-border p-4 transition-colors hover:bg-muted/30">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <FollowUpLeadInfo leadId={f.leadId} />
          <p className="mt-1.5 text-sm">{f.reason}</p>
          {f.previousNote ? (
            <p className="mt-1 text-xs text-muted-foreground">“{f.previousNote}”</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 text-right">
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium",
              overdueFlag ? "text-destructive" : "text-muted-foreground",
            )}
          >
            <Clock className="size-3.5" />
            {formatDate(f.dueAt)} · {formatTime(f.dueAt)}
          </span>
          <span className="text-xs text-muted-foreground">{relativeTime(f.dueAt)}</span>
        </div>
      </div>

      {f.status === "Open" ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button asChild size="sm">
            <Link to="/agent/leads/$id" params={{ id: f.leadId }}>
              <Phone className="size-3.5" /> Call now
            </Link>
          </Button>
          <Button size="sm" variant="outline" disabled={completing} onClick={() => onComplete(f)}>
            <CheckCircle2 className="size-3.5" /> {completing ? "Completing…" : "Complete"}
          </Button>
          <Popover
            open={rescheduleTarget?.id === f.id}
            onOpenChange={(open) => !open && onCloseReschedule()}
          >
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline" onClick={() => onOpenReschedule(f)}>
                <CalendarDays className="size-3.5" /> Reschedule
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto space-y-3 p-3">
              <Calendar mode="single" selected={rescheduleDate} onSelect={onRescheduleDateChange} className="p-0" />
              <Select value={rescheduleTime} onValueChange={onRescheduleTimeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" className="w-full" disabled={rescheduling} onClick={onConfirmReschedule}>
                {rescheduling ? "Saving…" : "Confirm"}
              </Button>
            </PopoverContent>
          </Popover>
          <Button asChild size="sm" variant="ghost">
            <Link to="/agent/leads/$id" params={{ id: f.leadId }}>
              <ExternalLink className="size-3.5" /> Open lead
            </Link>
          </Button>
        </div>
      ) : (
        <div className="mt-3">
          <Button asChild size="sm" variant="ghost">
            <Link to="/agent/leads/$id" params={{ id: f.leadId }}>
              <ExternalLink className="size-3.5" /> Open lead
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
