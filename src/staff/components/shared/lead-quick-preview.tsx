import type { ReactNode } from "react";
import { Briefcase, Calendar, DollarSign, Mail, MessageCircle, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@staff/components/ui/dialog";
import { Button } from "@staff/components/ui/button";
import { StatusBadge } from "@staff/components/shared/status-badge";
import { formatDate, formatZAR } from "@staff/lib/format";
import { toWhatsAppLink } from "@staff/lib/phone";
import type { LeadStatus } from "@staff/lib/types";

/** Normalised shape both admin Reports (full `Lead` records) and My Team
 * (the lightweight contact rows `callGetMyTeam` returns) can map into —
 * this dialog only ever needs to display, never edit. */
export interface QuickPreviewLead {
  id: string;
  business: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  agentName?: string | null;
  industry?: string | null;
  status?: LeadStatus | null;
  value?: number | null;
  lastContact?: string | null;
  nextFollowUp?: string | null;
}

/** Read-only "who is this lead" popup for list views that only have a lead
 * summary on hand (Reports > Lead Lists, My Team's contact tables) — not the
 * full editable flow admin.leads.tsx's LeadPreviewDialog opens. Gives the
 * same Call/WhatsApp actions agents get on their own lead detail page
 * (see agent.leads.$id.tsx) so a lead surfaced here doesn't dead-end. */
export function LeadQuickPreviewDialog({
  lead,
  open,
  onOpenChange,
}: {
  lead: QuickPreviewLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {lead ? (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle>{lead.business}</DialogTitle>
                {lead.status ? <StatusBadge status={lead.status} /> : null}
              </div>
              <DialogDescription>{lead.contactPerson || "No contact person listed"}</DialogDescription>
            </DialogHeader>

            {lead.phone ? (
              <div className="flex flex-col gap-1.5">
                <a href={`tel:${lead.phone}`} className="block">
                  <Button className="w-full" size="lg">
                    <Phone className="mr-2 size-4" /> {lead.phone}
                  </Button>
                </a>
                <a href={toWhatsAppLink(lead.phone)} target="_blank" rel="noreferrer" className="block">
                  <Button
                    variant="outline"
                    className="w-full border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366]"
                    size="lg"
                  >
                    <MessageCircle className="mr-2 size-4" /> WhatsApp
                  </Button>
                </a>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No phone number on file.</p>
            )}

            <div className="grid grid-cols-1 gap-x-6 gap-y-3 rounded-lg border border-border bg-muted/30 p-4 text-sm sm:grid-cols-2">
              {lead.email ? (
                <DetailRow label="Email" icon={<Mail className="size-3.5" />}>
                  {lead.email}
                </DetailRow>
              ) : null}
              {lead.agentName ? <DetailRow label="Assigned agent">{lead.agentName}</DetailRow> : null}
              {lead.industry ? (
                <DetailRow label="Industry" icon={<Briefcase className="size-3.5" />}>
                  {lead.industry}
                </DetailRow>
              ) : null}
              {typeof lead.value === "number" ? (
                <DetailRow label="Lead value" icon={<DollarSign className="size-3.5" />}>
                  {formatZAR(lead.value)}
                </DetailRow>
              ) : null}
              {lead.lastContact ? (
                <DetailRow label="Last contact" icon={<Calendar className="size-3.5" />}>
                  {formatDate(lead.lastContact)}
                </DetailRow>
              ) : null}
              {lead.nextFollowUp ? (
                <DetailRow label="Next follow-up" icon={<Calendar className="size-3.5" />}>
                  {formatDate(lead.nextFollowUp)}
                </DetailRow>
              ) : null}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, icon, children }: { label: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
