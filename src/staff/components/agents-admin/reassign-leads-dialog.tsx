import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@staff/components/ui/button";
import { Checkbox } from "@staff/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@staff/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@staff/components/ui/select";
import { callBulkAssignLeads } from "@staff/lib/functions";
import { invalidateLeadQueries } from "@staff/lib/leads";
import type { Agent, Lead } from "@staff/lib/types";

const CLOSED_STATUSES = new Set(["Closed Won", "Closed Lost", "Not Interested"]);

/**
 * Moves one agent's whole book (or just their still-open leads) to another
 * agent in one batch, via bulkAssignLeads — used from the agents grid/table
 * dropdown and the agent profile page. Replaces the old "coming soon" toast.
 */
export function ReassignLeadsDialog({
  open,
  onOpenChange,
  sourceAgent,
  agents,
  leads,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceAgent: Agent | null;
  agents: Agent[];
  leads: Lead[];
}) {
  const queryClient = useQueryClient();
  const [targetAgentId, setTargetAgentId] = useState("");
  const [includeClosed, setIncludeClosed] = useState(false);
  const [pending, setPending] = useState(false);

  const sourceLeads = useMemo(
    () => (sourceAgent ? leads.filter((l) => l.assignedAgentId === sourceAgent.id) : []),
    [leads, sourceAgent],
  );
  const openLeads = useMemo(() => sourceLeads.filter((l) => !CLOSED_STATUSES.has(l.status)), [sourceLeads]);
  const closedCount = sourceLeads.length - openLeads.length;
  const eligibleLeads = includeClosed ? sourceLeads : openLeads;

  const otherAgents = agents.filter((a) => a.id !== sourceAgent?.id);

  const reset = () => {
    setTargetAgentId("");
    setIncludeClosed(false);
  };

  const handleClose = (o: boolean) => {
    if (!o && pending) return;
    if (!o) reset();
    onOpenChange(o);
  };

  const handleConfirm = async () => {
    if (!sourceAgent || !targetAgentId || eligibleLeads.length === 0) return;
    setPending(true);
    try {
      await callBulkAssignLeads({
        leadIds: eligibleLeads.map((l) => l.id),
        agentUid: targetAgentId,
      });
      invalidateLeadQueries(queryClient);
      await queryClient.invalidateQueries({ queryKey: ["agents"] });
      const targetName = agents.find((a) => a.id === targetAgentId)?.name ?? "the new agent";
      toast.success(`Reassigned ${eligibleLeads.length} lead(s) from ${sourceAgent.name} to ${targetName}`);
      handleClose(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't reassign those leads — try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Reassign {sourceAgent?.name}'s leads</DialogTitle>
          <DialogDescription>
            Move their leads to another agent. {sourceAgent ? `${sourceAgent.name} has ${sourceLeads.length} lead(s), ${openLeads.length} still open.` : null}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Reassign to</label>
            <Select value={targetAgentId} onValueChange={setTargetAgentId} disabled={pending}>
              <SelectTrigger><SelectValue placeholder="Choose agent" /></SelectTrigger>
              <SelectContent>
                {otherAgents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {closedCount > 0 ? (
            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={includeClosed}
                onCheckedChange={(c) => setIncludeClosed(!!c)}
                disabled={pending}
                className="mt-0.5"
              />
              <span>
                Also move {closedCount} closed lead(s). Leave this off to only reassign the {openLeads.length}{" "}
                still-open leads.
              </span>
            </label>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={pending}>
            Cancel
          </Button>
          <Button disabled={!targetAgentId || eligibleLeads.length === 0 || pending} onClick={handleConfirm}>
            {pending ? "Reassigning…" : `Reassign ${eligibleLeads.length} lead(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
