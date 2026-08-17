import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Button } from "@staff/components/ui/button";
import { Input } from "@staff/components/ui/input";
import { Label } from "@staff/components/ui/label";
import { Checkbox } from "@staff/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@staff/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@staff/components/ui/dialog";
import { db } from "@staff/lib/firebase";
import { firebaseAuth } from "@staff/lib/auth";
import { callBulkAssignLeads, callInviteUser } from "@staff/lib/functions";
import type { Agent, Lead } from "@staff/lib/types";
import { Copy } from "lucide-react";
import { LeadFormDialog, type LeadFormPatch } from "@staff/components/leads-admin/lead-form-dialog";
import { createLead, invalidateLeadQueries } from "@staff/lib/leads";

/** The dashboard opens the exact same lead form as the Leads and Import pages. */
export function AddLeadDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  return (
    <LeadFormDialog
      open={open}
      onOpenChange={onOpenChange}
      trigger={<span className="hidden" aria-hidden="true" />}
      onSubmit={async (patch: LeadFormPatch) => {
        await createLead(patch);
        invalidateLeadQueries(queryClient);
      }}
    />
  );
}

function LegacyAddLeadDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [leadForm, setLeadForm] = useState({ business: "", contactPerson: "", phone: "" });
  const [addingLead, setAddingLead] = useState(false);

  async function submitLead() {
    if (!leadForm.business.trim()) {
      toast.error("Business name is required");
      return;
    }
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) {
      toast.error("You must be signed in to add a lead");
      return;
    }
    setAddingLead(true);
    try {
      await addDoc(collection(db, "leads"), {
        business: leadForm.business.trim(),
        ...(leadForm.contactPerson.trim() ? { contactPerson: leadForm.contactPerson.trim() } : {}),
        ...(leadForm.phone.trim() ? { phone: leadForm.phone.trim() } : {}),
        assignedAgentUid: null,
        status: "New",
        createdAt: serverTimestamp(),
        createdBy: uid,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
        deletedAt: null,
      });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success(`${leadForm.business} added to leads`);
      setLeadForm({ business: "", contactPerson: "", phone: "" });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add that lead — try again.");
    } finally {
      setAddingLead(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a new lead</DialogTitle>
          <DialogDescription>Create a lead record manually.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="business">Business name</Label>
            <Input
              id="business"
              value={leadForm.business}
              onChange={(e) => setLeadForm((f) => ({ ...f, business: e.target.value }))}
              placeholder="e.g. Venda Guest Lodge"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="contact">Contact person</Label>
              <Input
                id="contact"
                value={leadForm.contactPerson}
                onChange={(e) => setLeadForm((f) => ({ ...f, contactPerson: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={leadForm.phone}
                onChange={(e) => setLeadForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={addingLead}>
            Cancel
          </Button>
          <Button onClick={submitLead} disabled={addingLead}>
            {addingLead ? "Adding…" : "Add lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AddAgentDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (result: { email: string; tempPassword: string }) => void;
}) {
  const queryClient = useQueryClient();
  const [agentForm, setAgentForm] = useState({ name: "", email: "", phone: "" });
  const [addingAgent, setAddingAgent] = useState(false);

  async function submitAgent() {
    if (!agentForm.name.trim() || !agentForm.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setAddingAgent(true);
    try {
      const result = await callInviteUser({
        email: agentForm.email.trim(),
        displayName: agentForm.name.trim(),
        role: "agent",
        phone: agentForm.phone.trim() || undefined,
        jobTitle: "Sales Agent",
        monthlyTarget: 30000,
      });
      setAgentForm({ name: "", email: "", phone: "" });
      onOpenChange(false);
      onCreated({ email: result.data.email, tempPassword: result.data.tempPassword });
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add that agent — try again.");
    } finally {
      setAddingAgent(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add an agent</DialogTitle>
          <DialogDescription>Onboard a new sales agent to Meridian.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="agent-name">Full name</Label>
            <Input
              id="agent-name"
              value={agentForm.name}
              onChange={(e) => setAgentForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="agent-email">Email</Label>
              <Input
                id="agent-email"
                type="email"
                value={agentForm.email}
                onChange={(e) => setAgentForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="agent-phone">Phone</Label>
              <Input
                id="agent-phone"
                value={agentForm.phone}
                onChange={(e) => setAgentForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={addingAgent}>
            Cancel
          </Button>
          <Button onClick={submitAgent} disabled={addingAgent}>
            {addingAgent ? "Adding…" : "Add agent"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TempPasswordDialog({
  result,
  onClose,
}: {
  result: { email: string; tempPassword: string } | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!result} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agent account created</DialogTitle>
          <DialogDescription>
            Share this temporary password with {result?.email} — it won't be shown again. They should
            change it after signing in.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
          <code className="text-sm font-medium">{result?.tempPassword}</code>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (result) {
                navigator.clipboard?.writeText(result.tempPassword);
                toast.success("Copied to clipboard");
              }
            }}
          >
            <Copy className="mr-1.5 size-3.5" /> Copy
          </Button>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AssignLeadsDialog({
  open,
  onOpenChange,
  leads,
  agents,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: Lead[];
  agents: Agent[];
}) {
  const queryClient = useQueryClient();
  const [assignAgentId, setAssignAgentId] = useState<string>("");
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);

  async function submitAssign() {
    if (!assignAgentId || selectedLeadIds.length === 0) {
      toast.error("Pick at least one lead and an agent");
      return;
    }
    setAssigning(true);
    try {
      await callBulkAssignLeads({ leadIds: selectedLeadIds, agentUid: assignAgentId });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success(`${selectedLeadIds.length} lead(s) assigned`);
      setSelectedLeadIds([]);
      setAssignAgentId("");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't assign those leads — try again.");
    } finally {
      setAssigning(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign leads</DialogTitle>
          <DialogDescription>Pick unassigned leads and an agent.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="max-h-56 space-y-1 overflow-y-auto scrollbar-slim rounded-lg border border-border p-2">
            {leads.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">No unassigned leads right now.</p>
            ) : (
              leads.map((lead) => (
                <label
                  key={lead.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted/60"
                >
                  <Checkbox
                    checked={selectedLeadIds.includes(lead.id)}
                    onCheckedChange={(checked) =>
                      setSelectedLeadIds((prev) =>
                        checked ? [...prev, lead.id] : prev.filter((id) => id !== lead.id),
                      )
                    }
                  />
                  <span className="text-sm">{lead.business}</span>
                </label>
              ))
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Assign to agent</Label>
            <Select value={assignAgentId} onValueChange={setAssignAgentId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={assigning}>
            Cancel
          </Button>
          <Button onClick={submitAssign} disabled={assigning}>
            {assigning ? "Assigning…" : `Assign ${selectedLeadIds.length || ""} lead(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
