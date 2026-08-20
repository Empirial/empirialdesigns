import { HttpsError, onCall } from "firebase-functions/v2/https";

import { db } from "../lib/admin";
import { requireAuth } from "../lib/authz";
import { requireAdmin } from "../lib/authz";
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

interface SetAgentTeamLeadInput {
  agentId: string;
  teamLeadId: string | null;
}

/** Admin-only team assignment. Team membership is server-managed so agents
 * cannot add themselves to a lead's roster. */
export const setAgentTeamLead = onCall<SetAgentTeamLeadInput>(async (request) => {
  const { uid: adminUid } = requireAdmin(request);
  const { agentId, teamLeadId } = request.data ?? ({} as SetAgentTeamLeadInput);
  if (!agentId || typeof agentId !== "string" || (teamLeadId !== null && typeof teamLeadId !== "string")) {
    throw new HttpsError("invalid-argument", "agentId and teamLeadId are required.");
  }
  if (agentId === teamLeadId) {
    throw new HttpsError("invalid-argument", "An agent cannot lead their own team.");
  }

  const agentRef = db.doc(`agents/${agentId}`);
  const agentSnap = await agentRef.get();
  if (!agentSnap.exists) throw new HttpsError("not-found", "Agent not found.");

  if (teamLeadId) {
    const teamLead = await db.doc(`agents/${teamLeadId}`).get();
    if (!teamLead.exists || teamLead.data()?.role !== "Team Lead" || teamLead.data()?.status !== "Active") {
      throw new HttpsError("failed-precondition", "Select an active Team Lead.");
    }
  }

  const batch = db.batch();
  batch.update(agentRef, { teamLeadId });
  writeAuditLog(batch, {
    actorUid: adminUid,
    action: "agents.setTeamLead",
    targetCollection: "agents",
    targetId: agentId,
    before: { teamLeadId: agentSnap.data()?.teamLeadId ?? null },
    after: { teamLeadId },
  });
  await batch.commit();
  return { agentId, teamLeadId };
});

/** Returns a Team Lead's roster through the server, rather than granting an
 * agent broad Firestore list access to everyone's profile. */
export const getMyTeam = onCall(async (request) => {
  const { uid } = requireAuth(request);
  const lead = await db.doc(`agents/${uid}`).get();
  if (!lead.exists || lead.data()?.role !== "Team Lead") {
    throw new HttpsError("permission-denied", "Team Lead access required.");
  }
  const members = await db.collection("agents").where("teamLeadId", "==", uid).get();
  return {
    team: members.docs.map((member) => {
      const data = member.data();
      return {
        id: member.id,
        name: data.name ?? "",
        initials: data.initials ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        role: data.role ?? "Sales Agent",
        status: data.status ?? "Inactive",
        online: data.online ?? false,
        monthlyTarget: data.monthlyTarget ?? 0,
        targetDeals: data.targetDeals ?? 0,
      };
    }),
  };
});
