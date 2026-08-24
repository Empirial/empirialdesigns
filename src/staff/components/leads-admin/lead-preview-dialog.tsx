import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail, MessageCircle, Phone, Pencil, UserPlus } from "lucide-react";
import { AvatarChip, UnassignedChip } from "@staff/components/shared/avatar-chip";
import { StatusBadge } from "@staff/components/shared/status-badge";
import { ActivityTimeline } from "@staff/components/shared/activity-timeline";
import { Button } from "@staff/components/ui/button";
import { Textarea } from "@staff/components/ui/textarea";
import { Separator } from "@staff/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@staff/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@staff/components/ui/dialog";
import { addLeadNote, invalidateLeadQueries, useLeadActivities, useLeadNotes } from "@staff/lib/leads";
import { firebaseAuth } from "@staff/lib/auth";
import { formatDate, formatDateTime, formatZAR } from "@staff/lib/format";
import { toWhatsAppLink } from "@staff/lib/phone";
import type { Agent, Lead, Service } from "@staff/lib/types";

/**
 * Read-only lead detail view — what "Open lead" / "View" actually opens now
 * (see admin.pipeline.tsx and admin.agents.$id.tsx), instead of dropping
 * straight into LeadFormDialog's edit form. Editing is one deliberate click
 * away via the "Edit details" button, not the default.
 */
export function LeadPreviewDialog({
  lead,
  open,
  onOpenChange,
  agent,
  service,
  onEdit,
  onAssign,
}: {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent | null;
  service: Service | null;
  onEdit: () => void;
  onAssign: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: notes = [] } = useLeadNotes(lead?.id);
  const { data: activities = [] } = useLeadActivities(lead?.id);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  if (!lead) return null;

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      const authorName = firebaseAuth.currentUser?.displayName || firebaseAuth.currentUser?.email || "You";
      await addLeadNote(lead.id, newNote.trim(), authorName);
      invalidateLeadQueries(queryClient, lead.id);
      setNewNote("");
      toast.success("Note added");
    } catch {
      toast.error("Couldn't add that note — try again.");
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle>{lead.business}</DialogTitle>
            <StatusBadge status={lead.status} />
          </div>
          <DialogDescription>
            {lead.contactPerson} · {lead.role}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-x-6 gap-y-3 rounded-lg border border-border bg-muted/30 p-4 text-sm sm:grid-cols-2">
          <DetailRow label="Phone">
            {lead.phone ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                  <Phone className="size-3.5" /> {lead.phone}
                </a>
                <a
                  href={toWhatsAppLink(lead.phone)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#25D366] hover:underline"
                >
                  <MessageCircle className="size-3.5" /> WhatsApp
                </a>
              </div>
            ) : (
              "—"
            )}
          </DetailRow>
          <DetailRow label="Email">
            {lead.email ? (
              <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                <Mail className="size-3.5" /> {lead.email}
              </a>
            ) : (
              "—"
            )}
          </DetailRow>
          <DetailRow label="Industry">{lead.industry}</DetailRow>
          <DetailRow label="Location">{lead.location}</DetailRow>
          <DetailRow label="Source">{lead.source}</DetailRow>
          <DetailRow label="Service">{service?.name ?? "Not selected"}</DetailRow>
          <DetailRow label="Assigned agent">
            {agent ? <AvatarChip name={agent.name} size="sm" /> : <UnassignedChip />}
          </DetailRow>
          <DetailRow label="Lead value">{lead.value ? formatZAR(lead.value) : "—"}</DetailRow>
          <DetailRow label="Last contact">{lead.lastContact ? formatDate(lead.lastContact) : "Never"}</DetailRow>
          <DetailRow label="Next follow-up">{lead.nextFollowUp ? formatDateTime(lead.nextFollowUp) : "—"}</DetailRow>
          <DetailRow label="Added">{formatDate(lead.createdAt)}</DetailRow>
        </div>

        <Tabs defaultValue="activity" className="mt-1">
          <TabsList>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="notes">Notes {notes.length > 0 ? `(${notes.length})` : ""}</TabsTrigger>
          </TabsList>
          <TabsContent value="activity" className="pt-4">
            <ActivityTimeline items={activities} />
          </TabsContent>
          <TabsContent value="notes" className="space-y-4 pt-4">
            <div className="flex gap-2">
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note about this lead…"
                rows={2}
                className="flex-1"
              />
            </div>
            <Button size="sm" disabled={!newNote.trim() || savingNote} onClick={handleAddNote}>
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
        </Tabs>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={onAssign}>
            <UserPlus className="mr-1.5 size-4" /> {agent ? "Reassign" : "Assign"}
          </Button>
          <Button onClick={onEdit}>
            <Pencil className="mr-1.5 size-4" /> Edit details
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
