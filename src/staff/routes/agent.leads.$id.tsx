import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Copy,
  Globe,
  Lock,
  Mail,
  MapPin,
  Phone,
  PhoneCall,
  PhoneOff,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@staff/components/layout/app-shell";
import { PageHeader } from "@staff/components/shared/page-header";
import { EmptyState } from "@staff/components/shared/empty-state";
import { SectionCard, FieldRow } from "@staff/components/shared/section-card";
import { ActivityTimeline } from "@staff/components/shared/activity-timeline";
import { StatusBadge, Pill } from "@staff/components/shared/status-badge";
import { Button } from "@staff/components/ui/button";
import { Input } from "@staff/components/ui/input";
import { Textarea } from "@staff/components/ui/textarea";
import { Card } from "@staff/components/ui/card";
import { Separator } from "@staff/components/ui/separator";
import { ScrollArea } from "@staff/components/ui/scroll-area";
import { Calendar } from "@staff/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@staff/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@staff/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@staff/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@staff/components/ui/tabs";
import {
  addLeadNote,
  invalidateLeadQueries,
  updateOwnLeadStatus,
  useLead,
  useLeadActivities,
  useLeadNotes,
  useMyLeads,
} from "@staff/lib/leads";
import { useServices } from "@staff/lib/services-data";
import { LeadQuoteBuilder } from "@staff/components/lead-quote-builder";
import { useScripts } from "@staff/lib/scripts-data";
import { callLogCall } from "@staff/lib/functions";
import { firebaseAuth } from "@staff/lib/auth";
import type { LeadStatus } from "@staff/lib/types";
import { formatDate, formatDateTime, formatTime, formatZAR, isOverdue } from "@staff/lib/format";
import { cn } from "@staff/lib/utils";

export const Route = createFileRoute("/agent/leads/$id")({
  head: () => ({
    meta: [
      { title: "Call Workspace — Meridian CRM" },
      { name: "description", content: "Everything you need to run a great sales call." },
      { property: "og:title", content: "Call Workspace — Meridian CRM" },
      { property: "og:description", content: "Lead call console, scripts and history." },
    ],
  }),
  component: PageAgentLeadsId,
});

const CALL_OUTCOMES: LeadStatus[] = [
  "Interested",
  "Not Interested",
  "Follow-up",
  "Called",
  "Proposal Sent",
  "Closed Won",
  "Closed Lost",
];

// The standalone quick-status dropdown (separate from the Call Outcome
// flow below, which is what actually creates deals/commissions via
// logCall()) is deliberately limited to these three, non-terminal states.
// Closing a lead ("Closed Client" / Closed Won) is an admin-only action —
// see admin.leads.tsx / admin.pipeline.tsx — not something an agent can
// set for themselves here.
const QUICK_STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "Follow-up", label: "Follow-up" },
  { value: "Interested", label: "Interested" },
  { value: "Not Interested", label: "Not Interested" },
];

const TIME_SLOTS = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];

function useCallTimer() {
  const [active, setActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [active]);
  const reset = () => setSeconds(0);
  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return { active, setActive, seconds, mmss, reset };
}

function PageAgentLeadsId() {
  const { id } = Route.useParams();
  const { data: myLeads = [] } = useMyLeads();
  const { data: lead, isLoading: leadLoading, error: leadError } = useLead(id);
  const { data: services = [] } = useServices();
  const { data: scripts = [] } = useScripts();
  const { data: notes = [] } = useLeadNotes(id);
  const { data: activities = [] } = useLeadActivities(id);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const timer = useCallTimer();
  const [showOutcomeForm, setShowOutcomeForm] = useState(false);
  const [outcome, setOutcome] = useState<LeadStatus>("Interested");
  const [note, setNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(undefined);
  const [followUpTime, setFollowUpTime] = useState<string>("");
  const [dealServiceId, setDealServiceId] = useState<string>(lead?.serviceId ?? "");
  const [dealValue, setDealValue] = useState<string>(String(lead?.value ?? ""));
  const [newNote, setNewNote] = useState("");
  const [scriptCategory, setScriptCategory] = useState<string>("all");
  const [openScriptId, setOpenScriptId] = useState<string | null>(null);
  const [savingCall, setSavingCall] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  if (leadLoading) {
    return (
      <AppShell>
        <PageHeader
          title="Call Workspace"
          crumbs={[{ label: "Agent", to: "/agent/dashboard" }, { label: "My Leads", to: "/agent/leads" }]}
        />
        <div className="mt-6 text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }

  if (leadError || !lead) {
    return (
      <AppShell>
        <PageHeader
          title="Call Workspace"
          crumbs={[{ label: "Agent", to: "/agent/dashboard" }, { label: "My Leads", to: "/agent/leads" }, { label: "Not found" }]}
        />
        <div className="mt-6">
          <EmptyState
            icon={Lock}
            title="Not found"
            description="This lead doesn't exist, has been removed, or isn't assigned to you."
            action={
              <Button asChild variant="outline">
                <Link to="/agent/leads">Back to my leads</Link>
              </Button>
            }
          />
        </div>
      </AppShell>
    );
  }

  const idx = myLeads.findIndex((l) => l.id === id);
  const prevLead = idx > 0 ? myLeads[idx - 1] : undefined;
  const nextLead = idx >= 0 && idx < myLeads.length - 1 ? myLeads[idx + 1] : undefined;

  const svc = services.find((s) => s.id === lead.serviceId) ?? null;

  const startCall = () => {
    timer.reset();
    timer.setActive(true);
    setShowOutcomeForm(false);
  };
  const endCall = () => {
    timer.setActive(false);
    setShowOutcomeForm(true);
  };

  const saveCallLog = async () => {
    let followUpAt: string | undefined;
    if (followUpDate) {
      const d = new Date(followUpDate);
      if (followUpTime) {
        const [h, m] = followUpTime.split(":").map(Number);
        d.setHours(h ?? 9, m ?? 0, 0, 0);
      }
      followUpAt = d.toISOString();
    }

    setSavingCall(true);
    try {
      await callLogCall({
        leadId: lead.id,
        status: outcome,
        note: note.trim() || undefined,
        followUpAt,
        dealServiceId: outcome === "Closed Won" ? dealServiceId || undefined : undefined,
        dealValue: outcome === "Closed Won" ? Number(dealValue) || undefined : undefined,
      });
      invalidateLeadQueries(queryClient, lead.id);
      toast.success("Call logged successfully");
      setShowOutcomeForm(false);
      setNote("");
      setFollowUpDate(undefined);
      setFollowUpTime("");
      timer.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't log the call — try again.");
    } finally {
      setSavingCall(false);
    }
  };

  const callHistory = activities.filter((a) => a.type === "call");

  const filteredScripts = scripts.filter((s) => scriptCategory === "all" || s.category === scriptCategory);
  const scriptCategories = Array.from(new Set<string>(scripts.map((s) => s.category)));

  const overdue = isOverdue(lead.nextFollowUp);

  return (
    <AppShell>
      <PageHeader
        title={lead.business}
        subtitle={`${lead.industry} · ${lead.location}`}
        crumbs={[
          { label: "Agent", to: "/agent/dashboard" },
          { label: "My Leads", to: "/agent/leads" },
          { label: lead.business },
        ]}
        actions={
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5 text-sm">
            <Button
              size="icon"
              variant="ghost"
              className="size-7"
              disabled={!prevLead}
              aria-label="Previous lead"
              onClick={() => prevLead && navigate({ to: "/agent/leads/$id", params: { id: prevLead.id } })}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
              Lead {idx + 1} of {myLeads.length}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="size-7"
              disabled={!nextLead}
              aria-label="Next lead"
              onClick={() => nextLead && navigate({ to: "/agent/leads/$id", params: { id: nextLead.id } })}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr_300px]">
        {/* LEFT: lead info */}
        <div className="space-y-5">
          <SectionCard title="Business">
            <div className="space-y-1">
              <p className="text-lg font-semibold">{lead.business}</p>
              <div className="flex flex-wrap gap-1.5">
                <Pill tone="neutral" size="sm">{lead.industry}</Pill>
                <Pill tone="neutral" size="sm">{lead.location}</Pill>
              </div>
            </div>
            <Separator className="my-3" />
            <FieldRow label="Contact person" value={`${lead.contactPerson} — ${lead.role}`} />
            <a href={`tel:${lead.phone}`} className="block">
              <Button className="mt-1 w-full" size="lg">
                <Phone className="mr-2 size-4" /> {lead.phone}
              </Button>
            </a>
            <div className="mt-3 space-y-1 text-sm">
              <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-primary hover:underline">
                <Mail className="size-3.5" /> {lead.email}
              </a>
              {lead.website ? (
                <a
                  href={`https://${lead.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Globe className="size-3.5" /> {lead.website}
                </a>
              ) : null}
              {lead.address ? (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-3.5" /> {lead.address}
                </p>
              ) : null}
            </div>
            <Separator className="my-3" />
            <FieldRow label="Source" value={lead.source} />
            <FieldRow label="Lead value" value={formatZAR(lead.value)} />
            <FieldRow label="Assigned" value={formatDate(lead.createdAt)} />
            <div className="mt-2 flex items-center justify-between gap-2">
              <StatusBadge status={lead.status} />
            </div>
            <Select
              value={lead.status}
              onValueChange={async (v) => {
                try {
                  await updateOwnLeadStatus(lead.id, v as LeadStatus);
                  invalidateLeadQueries(queryClient, lead.id);
                } catch {
                  toast.error("Couldn't update status — try again.");
                }
              }}
            >
              <SelectTrigger className="mt-2 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {QUICK_STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {lead.nextFollowUp ? (
              <p className={cn("mt-2 text-xs", overdue ? "font-medium text-destructive" : "text-muted-foreground")}>
                Next follow-up: {formatDateTime(lead.nextFollowUp)}
              </p>
            ) : null}
          </SectionCard>
        </div>

        {/* CENTRE: call console + tabs */}
        <div className="space-y-5">
          <SectionCard title="Call console">
            <div className="flex flex-col items-center gap-4 py-4">
              <p className="text-4xl font-semibold tabular-nums">{timer.mmss}</p>
              {!timer.active ? (
                <Button size="lg" onClick={startCall} className="w-full max-w-xs">
                  <PhoneCall className="mr-2 size-4" /> Start Call
                </Button>
              ) : (
                <Button size="lg" variant="destructive" onClick={endCall} className="w-full max-w-xs">
                  <PhoneOff className="mr-2 size-4" /> End Call
                </Button>
              )}
              {timer.active ? (
                <p className="text-xs text-muted-foreground">Call in progress with {lead.contactPerson}…</p>
              ) : null}
            </div>

            {showOutcomeForm ? (
              <div className="space-y-4 border-t border-border pt-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Outcome</label>
                  <Select value={outcome} onValueChange={(v) => setOutcome(v as LeadStatus)}>
                    <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CALL_OUTCOMES.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Call notes</label>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="What happened on the call?"
                    className="mt-1"
                    rows={3}
                  />
                </div>
                {(outcome === "Follow-up" || outcome === "Interested") ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Follow-up date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="mt-1 w-full justify-start font-normal">
                            <CalendarIcon className="mr-2 size-4" />
                            {followUpDate ? formatDate(followUpDate.toISOString()) : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={followUpDate} onSelect={setFollowUpDate} />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Time</label>
                      <Select value={followUpTime} onValueChange={setFollowUpTime}>
                        <SelectTrigger className="mt-1 w-full"><SelectValue placeholder="Select time" /></SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : null}
                {outcome === "Closed Won" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Service</label>
                      <Select value={dealServiceId} onValueChange={setDealServiceId}>
                        <SelectTrigger className="mt-1 w-full"><SelectValue placeholder="Select service" /></SelectTrigger>
                        <SelectContent>
                          {services.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Deal value (R)</label>
                      <Input
                        type="number"
                        value={dealValue}
                        onChange={(e) => setDealValue(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                ) : null}
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setShowOutcomeForm(false)} disabled={savingCall}>
                    Cancel
                  </Button>
                  <Button onClick={saveCallLog} disabled={savingCall}>
                    {savingCall ? "Saving…" : "Save call log"}
                  </Button>
                </div>
              </div>
            ) : null}
          </SectionCard>

          <SectionCard noPadding>
            <Tabs defaultValue="activity" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-4">
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="calls">Call History</TabsTrigger>
                <TabsTrigger value="quote">Quote</TabsTrigger>
              </TabsList>
              <TabsContent value="activity" className="p-5">
                <ActivityTimeline items={activities} />
              </TabsContent>
              <TabsContent value="notes" className="space-y-4 p-5">
                <div className="flex gap-2">
                  <Textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note about this lead…"
                    rows={2}
                    className="flex-1"
                  />
                </div>
                <Button
                  size="sm"
                  disabled={!newNote.trim() || savingNote}
                  onClick={async () => {
                    setSavingNote(true);
                    try {
                      const authorName =
                        firebaseAuth.currentUser?.displayName || firebaseAuth.currentUser?.email || "You";
                      await addLeadNote(lead.id, newNote.trim(), authorName);
                      invalidateLeadQueries(queryClient, lead.id);
                      setNewNote("");
                      toast.success("Note added");
                    } catch {
                      toast.error("Couldn't add that note — try again.");
                    } finally {
                      setSavingNote(false);
                    }
                  }}
                >
                  {savingNote ? "Adding…" : "Add note"}
                </Button>
                <Separator />
                {notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No notes yet.</p>
                ) : (
                  <div className="space-y-3">
                    {notes.map((n) => (
                      <div key={n.id} className="rounded-lg border border-border p-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{n.author}</span>
                          <span>{formatDateTime(n.createdAt)}</span>
                        </div>
                        <p className="mt-1.5 text-sm">{n.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="calls" className="p-5">
                {callHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No calls logged yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Outcome</TableHead>
                        <TableHead>Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {callHistory.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="tabular-nums">{formatDateTime(c.at)}</TableCell>
                          <TableCell className="font-medium">{c.title}</TableCell>
                          <TableCell className="max-w-[280px] truncate text-muted-foreground">{c.detail ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
              <TabsContent value="quote" className="p-5">
                <LeadQuoteBuilder leadId={lead.id} business={lead.business} services={services} />
              </TabsContent>
            </Tabs>
          </SectionCard>
        </div>

        {/* RIGHT: scripts + services */}
        <div className="space-y-5">
          <SectionCard title="Scripts">
            <Select value={scriptCategory} onValueChange={setScriptCategory}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {scriptCategories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-3 space-y-2">
              {filteredScripts.map((s) => {
                const open = openScriptId === s.id;
                return (
                  <div key={s.id} className="rounded-lg border border-border">
                    <button
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium"
                      onClick={() => setOpenScriptId(open ? null : s.id)}
                    >
                      {s.title}
                      <ChevronRight className={cn("size-4 shrink-0 transition-transform", open && "rotate-90")} />
                    </button>
                    {open ? (
                      <div className="border-t border-border p-3">
                        <ScrollArea className="h-32 pr-2">
                          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{s.body}</p>
                        </ScrollArea>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 w-full"
                          onClick={() => {
                            navigator.clipboard?.writeText(s.body);
                            toast.success("Script copied to clipboard");
                          }}
                        >
                          <Copy className="mr-1.5 size-3.5" /> Copy
                        </Button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {filteredScripts.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No scripts in this category.</p>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard title="Services quick reference">
            <div className="space-y-2">
              {services.filter((s) => s.status === "Active").map((s) => (
                <div key={s.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{s.name}</p>
                    <Sparkles className="size-3.5 text-primary" />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatZAR(s.promoPrice)}</span>
                    <span>
                      Comm: {s.commissionType === "fixed" ? formatZAR(s.commissionValue) : `${s.commissionValue}%`}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 w-full"
                    onClick={() => {
                      setDealServiceId(s.id);
                      setDealValue(String(s.promoPrice));
                      setOutcome("Closed Won");
                      setShowOutcomeForm(true);
                      toast.info(`Quoted ${s.name} at ${formatZAR(s.promoPrice)}`);
                    }}
                  >
                    Quote this service
                  </Button>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}
