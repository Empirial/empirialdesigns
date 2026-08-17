import { HttpsError, onCall } from "firebase-functions/v2/https";

import { db } from "../lib/admin";
import { requireAuth } from "../lib/authz";
import { writeAuditLog } from "../lib/audit";

interface ToggleAgentStatusInput {
  agentId: string;
}

/**
 * Replaces crm-store.tsx's toggleAgentStatus(). Callable by an admin for any
 * agent, or by an agent for their own record only (the online/offline
 * switch on agent.dashboard.tsx) — kept as a thin function rather than a
 * direct client write purely so both paths land in auditLog consistently.
 */
export const toggleAgentStatus = onCall<ToggleAgentStatusInput>(async (request) => {
  const { uid, role } = requireAuth(request);
  const agentId = request.data?.agentId;
  if (!agentId || typeof agentId !== "string") {
    throw new HttpsError("invalid-argument", "agentId is required.");
  }
  if (role !== "admin" && uid !== agentId) {
    throw new HttpsError("permission-denied", "You can only toggle your own status.");
  }

  const agentRef = db.doc(`agents/${agentId}`);
  const newStatus = await db.runTransaction(async (tx) => {
    const snap = await tx.get(agentRef);
    if (!snap.exists) {
      throw new HttpsError("not-found", "Agent not found.");
    }
    const current = snap.data()?.status as "Active" | "Inactive";
    const next = current === "Active" ? "Inactive" : "Active";

    tx.update(agentRef, { status: next });
    writeAuditLog(tx, {
      actorUid: uid,
      action: "agents.toggleStatus",
      targetCollection: "agents",
      targetId: agentId,
      before: { status: current },
      after: { status: next },
    });

    return next;
  });

  return { agentId, status: newStatus };
});
