import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAgents } from "@staff/lib/agents-data";
import { useServices } from "@staff/lib/services-data";
import { INDUSTRIES, LOCATIONS, SOURCES } from "./constants";
import type { Lead } from "@staff/lib/types";
import { Button } from "@staff/components/ui/button";
import { Input } from "@staff/components/ui/input";
import { Label } from "@staff/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@staff/components/ui/select";

/** Payload handed to `onSubmit` — the caller decides how (and whether) to
 * write each field, e.g. a create ignores `assignedAgentId` and forces the
 * lead unassigned/New, while an edit writes it through as-is. */
export interface LeadFormPatch {
  business: string;
  contactPerson: string;
  role: string;
  phone: string;
  email: string;
  industry: Lead["industry"];
  location: Lead["location"];
  serviceId: string | null;
  source: Lead["source"];
  assignedAgentId: string | null;
}

interface LeadFormDialogProps {
  trigger: React.ReactNode;
  lead?: Lead;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (patch: LeadFormPatch) => Promise<void>;
}

const emptyForm = {
  business: "",
  contactPerson: "",
  role: "",
  phone: "",
  email: "",
  industry: "Retail" as Lead["industry"],
  location: "Thohoyandou" as Lead["location"],
  serviceId: "none",
  source: "Cold List" as Lead["source"],
  assignedAgentId: "unassigned",
};

export function LeadFormDialog({ trigger, lead, open, onOpenChange, onSubmit }: LeadFormDialogProps) {
  const { data: services = [] } = useServices();
  const { data: agents = [] } = useAgents();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const dialogOpen = isControlled ? open : internalOpen;
  const setDialogOpen = isControlled ? onOpenChange! : setInternalOpen;

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (dialogOpen) {
      setForm(
        lead
          ? {
              business: lead.business,
              contactPerson: lead.contactPerson,
              role: lead.role,
              phone: lead.phone,
              email: lead.email,
              industry: lead.industry,
              location: lead.location,
              serviceId: lead.serviceId ?? "none",
              source: lead.source,
              assignedAgentId: lead.assignedAgentId ?? "unassigned",
            }
          : emptyForm,
      );
    }
  }, [dialogOpen, lead]);

  const handleSubmit = async () => {
    if (!form.business.trim()) {
      toast.error("Business name is required");
      return;
    }
    const patch: LeadFormPatch = {
      business: form.business.trim(),
      contactPerson: form.contactPerson.trim() || "Reception",
      role: form.role.trim() || "Owner",
      phone: form.phone.trim(),
      email: form.email.trim(),
      industry: form.industry,
      location: form.location,
      serviceId: form.serviceId === "none" ? null : form.serviceId,
      source: form.source,
      assignedAgentId: form.assignedAgentId === "unassigned" ? null : form.assignedAgentId,
    };
    setSaving(true);
    try {
      await onSubmit(patch);
      toast.success(lead ? `${patch.business} updated` : `${patch.business} added to the database`);
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save this lead — try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={(o) => !saving && setDialogOpen(o)}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{lead ? "Edit lead" : "Add a new lead"}</DialogTitle>
          <DialogDescription>
            {lead ? "Update the lead's details below." : "Capture the essentials — you can enrich this record later."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Business name</Label>
            <Input
              value={form.business}
              onChange={(e) => setForm((f) => ({ ...f, business: e.target.value }))}
              placeholder="e.g. Vhembe Fresh Produce"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Contact person</Label>
            <Input
              value={form.contactPerson}
              onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
              placeholder="Full name"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Input
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              placeholder="Owner / Manager"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="0XX XXX XXXX"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="name@business.co.za"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Industry</Label>
            <Select value={form.industry} onValueChange={(v) => setForm((f) => ({ ...f, industry: v as Lead["industry"] }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((i) => (
                  <SelectItem key={i} value={i}>{i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Select value={form.location} onValueChange={(v) => setForm((f) => ({ ...f, location: v as Lead["location"] }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Service</Label>
            <Select value={form.serviceId} onValueChange={(v) => setForm((f) => ({ ...f, serviceId: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No service yet</SelectItem>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Source</Label>
            <Select value={form.source} onValueChange={(v) => setForm((f) => ({ ...f, source: v as Lead["source"] }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Assign to agent</Label>
            <Select value={form.assignedAgentId} onValueChange={(v) => setForm((f) => ({ ...f, assignedAgentId: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!lead ? (
              <p className="text-xs text-muted-foreground">
                New leads are created unassigned — use "Assign" from the leads table afterward.
              </p>
            ) : null}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving…" : lead ? "Save changes" : "Add lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
