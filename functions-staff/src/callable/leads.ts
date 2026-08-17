import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

import { db } from "../lib/admin";
import { requireAdmin } from "../lib/authz";
import { writeAuditLog } from "../lib/audit";
import { writeNotification } from "../lib/notify";

const LEAD_STATUSES = [
  "New",
  "Assigned",
  "Not Called",
  "Called",
  "Interested",
  "Follow-up",
  "Proposal Sent",
  "Closed Won",
  "Closed Lost",
  "Not Interested",
] as const;
type LeadStatus = (typeof LEAD_STATUSES)[number];

// Keeps every bulk op to a single Firestore batch (500-write ceiling) without
// needing multi-batch chunking logic — comfortably above anything a CRM this
// size needs in one selection.
const MAX_BULK_SIZE = 200;

function validateLeadIds(leadIds: unknown): string[] {
  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    throw new HttpsError("invalid-argument", "leadIds must be a non-empty array.");
  }
  if (leadIds.length > MAX_BULK_SIZE) {
    throw new HttpsError("invalid-argument", `Select at most ${MAX_BULK_SIZE} leads at once.`);
  }
  if (!leadIds.every((id) => typeof id === "string" && id.length > 0)) {
    throw new HttpsError("invalid-argument", "leadIds must all be non-empty strings.");
  }
  return leadIds as string[];
}

interface BulkAssignInput {
  leadIds: string[];
  agentUid: string;
}

/**
 * Replaces crm-store.tsx's assignLeads(). Admin-only, and routed through a
 * function rather than N direct client writes so the whole selection either
 * fully succeeds or fully fails, with one audit-log entry either way — see
 * docs/firebase-architecture.html §5 "Why bulk operations go through Cloud
 * Functions".
 */
export const bulkAssignLeads = onCall<BulkAssignInput>(async (request) => {
  const { uid } = requireAdmin(request);
  const leadIds = validateLeadIds(request.data?.leadIds);
  const agentUid = request.data?.agentUid;
  if (!agentUid || typeof agentUid !== "string") {
    throw new HttpsError("invalid-argument", "agentUid is required.");
  }

  const agentSnap = await db.doc(`agents/${agentUid}`).get();
  if (!agentSnap.exists) {
    throw new HttpsError("not-found", "That agent does not exist.");
  }

  const leadRefs = leadIds.map((id) => db.doc(`leads/${id}`));
  const leadSnaps = await db.getAll(...leadRefs);

  const batch = db.batch();
  const now = FieldValue.serverTimestamp();

  leadSnaps.forEach((snap, i) => {
    if (!snap.exists) {
      throw new HttpsError("not-found", `Lead ${leadIds[i]} does not exist.`);
    }
    const currentStatus = snap.data()?.status as LeadStatus | undefined;
    batch.update(leadRefs[i], {
      assignedAgentUid: agentUid,
      status: currentStatus === "New" ? "Assigned" : currentStatus,
      updatedAt: now,
      updatedBy: uid,
    });
    batch.set(leadRefs[i].collection("activities").doc(), {
      type: "assignment",
      title: "Lead assigned",
      detail: `Assigned to agent ${agentUid}`,
      actor: uid,
      actorUid: uid,
      at: now,
    });
  });

  writeAuditLog(batch, {
    actorUid: uid,
    action: "leads.bulkAssign",
    targetCollection: "leads",
    targetId: leadIds.join(","),
    after: { agentUid },
  });

  writeNotification(batch, {
    recipientUid: agentUid,
    title: leadIds.length === 1 ? "New lead assigned" : "New leads assigned",
    detail:
      leadIds.length === 1
        ? "1 lead was assigned to you."
        : `${leadIds.length} leads were assigned to you.`,
    tone: "info",
  });

  await batch.commit();
  return { assigned: leadIds.length };
});

interface BulkStatusInput {
  leadIds: string[];
  status: LeadStatus;
}

/**
 * Replaces crm-store.tsx's setLeadsStatus(). Backs both the admin bulk
 * status-change action and single-card Kanban drag-drop on admin.pipeline.
 */
export const bulkSetLeadStatus = onCall<BulkStatusInput>(async (request) => {
  const { uid } = requireAdmin(request);
  const leadIds = validateLeadIds(request.data?.leadIds);
  const status = request.data?.status;
  if (!LEAD_STATUSES.includes(status)) {
    throw new HttpsError("invalid-argument", "status is not a valid lead status.");
  }

  const batch = db.batch();
  const now = FieldValue.serverTimestamp();

  for (const leadId of leadIds) {
    const leadRef = db.doc(`leads/${leadId}`);
    batch.update(leadRef, { status, updatedAt: now, updatedBy: uid });
    batch.set(leadRef.collection("activities").doc(), {
      type: "status",
      title: `Status changed to ${status}`,
      detail: null,
      actor: uid,
      actorUid: uid,
      at: now,
    });
  }

  writeAuditLog(batch, {
    actorUid: uid,
    action: "leads.bulkSetStatus",
    targetCollection: "leads",
    targetId: leadIds.join(","),
    after: { status },
  });

  await batch.commit();
  return { updated: leadIds.length };
});

interface BulkDeleteInput {
  leadIds: string[];
}

/**
 * Replaces crm-store.tsx's deleteLeads(). Soft-delete only (sets deletedAt) —
 * a hard Firestore delete is never allowed by firestore.rules, so any deal
 * or commission history tied to a lead stays traceable. Callers (e.g. the
 * admin.leads.tsx list) are expected to filter out deletedAt != null.
 */
export const bulkDeleteLeads = onCall<BulkDeleteInput>(async (request) => {
  const { uid } = requireAdmin(request);
  const leadIds = validateLeadIds(request.data?.leadIds);

  const batch = db.batch();
  const now = FieldValue.serverTimestamp();

  for (const leadId of leadIds) {
    batch.update(db.doc(`leads/${leadId}`), {
      deletedAt: now,
      updatedAt: now,
      updatedBy: uid,
    });
  }

  writeAuditLog(batch, {
    actorUid: uid,
    action: "leads.bulkDelete",
    targetCollection: "leads",
    targetId: leadIds.join(","),
  });

  await batch.commit();
  return { deleted: leadIds.length };
});
