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

interface SetAgentJobTitleInput {
  agentId: string;
  jobTitle: "Sales Agent" | "Senior Agent" | "Team Lead";
}

/** Promotes or demotes an existing agent without changing their staff access
 * role. A Team Lead must have their team reassigned before being demoted. */
export const setAgentJobTitle = onCall<SetAgentJobTitleInput>(async (request) => {
  const { uid: adminUid } = requireAdmin(request);
  const { agentId, jobTitle } = request.data ?? ({} as SetAgentJobTitleInput);
  if (!agentId || typeof agentId !== "string" || !["Sales Agent", "Senior Agent", "Team Lead"].includes(jobTitle)) {
    throw new HttpsError("invalid-argument", "A valid agentId and jobTitle are required.");
  }
  const agentRef = db.doc(`agents/${agentId}`);
  const agentSnap = await agentRef.get();
  if (!agentSnap.exists) throw new HttpsError("not-found", "Agent not found.");
  const previousJobTitle = agentSnap.data()?.role ?? "Sales Agent";

  if (previousJobTitle === "Team Lead" && jobTitle !== "Team Lead") {
    const teamMembers = await db.collection("agents").where("teamLeadId", "==", agentId).limit(1).get();
    if (!teamMembers.empty) {
      throw new HttpsError("failed-precondition", "Reassign this Team Lead's agents before demoting them.");
    }
  }

  const batch = db.batch();
  batch.update(agentRef, { role: jobTitle });
  writeAuditLog(batch, {
    actorUid: adminUid,
    action: "agents.setJobTitle",
    targetCollection: "agents",
    targetId: agentId,
    before: { role: previousJobTitle },
    after: { role: jobTitle },
  });
  await batch.commit();
  return { agentId, jobTitle };
});

interface SetAgentMonthlyTargetInput { agentId: string; monthlyTarget: number; }
/** Admin-only target setting; targets remain server-managed operational data. */
export const setAgentMonthlyTarget = onCall<SetAgentMonthlyTargetInput>(async (request) => {
  const { uid: adminUid } = requireAdmin(request);
  const { agentId, monthlyTarget } = request.data ?? ({} as SetAgentMonthlyTargetInput);
  if (!agentId || typeof agentId !== "string" || !Number.isFinite(monthlyTarget) || monthlyTarget < 0) {
    throw new HttpsError("invalid-argument", "A valid non-negative monthly target is required.");
  }
  const ref = db.doc(`agents/${agentId}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Agent not found.");
  const batch = db.batch();
  batch.update(ref, { monthlyTarget: Math.round(monthlyTarget) });
  writeAuditLog(batch, { actorUid: adminUid, action: "agents.setMonthlyTarget", targetCollection: "agents", targetId: agentId, before: { monthlyTarget: snap.data()?.monthlyTarget ?? 0 }, after: { monthlyTarget: Math.round(monthlyTarget) } });
  await batch.commit();
  return { agentId, monthlyTarget: Math.round(monthlyTarget) };
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
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - ((startOfToday.getDay() + 6) % 7));
  // Fetch each member's lightweight call records in parallel. This preserves
  // per-team access boundaries and avoids exposing the callLogs collection to
  // the client, while keeping the page's call counts based on real call logs.
  const memberActivity = await Promise.all(
    members.docs.map(async (member) => ({
      id: member.id,
      ...await (async () => {
        const [calls, leads, deals] = await Promise.all([
          db.collection("callLogs").where("agentUid", "==", member.id).get(),
          db.collection("leads").where("assignedAgentUid", "==", member.id).get(),
          db.collection("deals").where("agentUid", "==", member.id).get(),
        ]);
        return { calls, leads, deals };
      })(),
    })),
  );
  const callCounts = new Map(memberActivity.map(({ id, calls }) => {
    let today = 0;
    let week = 0;
    for (const call of calls.docs) {
      const at = call.data().at?.toDate?.() as Date | undefined;
      if (!at) continue;
      if (at >= startOfWeek) week += 1;
      if (at >= startOfToday) today += 1;
    }
    return [id, { today, week }];
  }));
  const leadStats = new Map(memberActivity.map(({ id, leads, deals }) => {
    const rows = leads.docs.map((lead) => ({ id: lead.id, ...(lead.data() as { status?: string }) }));
    return [id, {
      total: rows.length,
      callsLeft: rows.filter((lead) => ["New", "Assigned", "Not Called"].includes(lead.status ?? "")).length,
      interested: rows.filter((lead) => lead.status === "Interested").length,
      followUps: rows.filter((lead) => lead.status === "Follow-up").length,
      closedDeals: deals.size,
    }];
  }));
  const memberNameById = new Map(members.docs.map((member) => [member.id, member.data().name ?? "Agent"]));
  const teamLeads = memberActivity.flatMap(({ id, leads }) => leads.docs.map((lead) => ({
    id: lead.id,
    agentId: id,
    agentName: memberNameById.get(id) ?? "Agent",
    business: lead.data().business ?? "",
    contactPerson: lead.data().contactPerson ?? "",
    phone: lead.data().phone ?? "",
    email: lead.data().email ?? "",
    status: lead.data().status ?? "New",
    nextFollowUp: lead.data().nextFollowUp?.toDate?.().toISOString?.() ?? null,
    lastContact: lead.data().lastContact?.toDate?.().toISOString?.() ?? null,
  })));
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
        callsToday: callCounts.get(member.id)?.today ?? 0,
        callsThisWeek: callCounts.get(member.id)?.week ?? 0,
        totalLeads: leadStats.get(member.id)?.total ?? 0,
        callsLeft: leadStats.get(member.id)?.callsLeft ?? 0,
        interested: leadStats.get(member.id)?.interested ?? 0,
        followUps: leadStats.get(member.id)?.followUps ?? 0,
        closedDeals: leadStats.get(member.id)?.closedDeals ?? 0,
      };
    }),
    interestedLeads: [...teamLeads]
      .filter((lead) => lead.status === "Interested")
      .sort((a, b) => String(b.lastContact ?? "").localeCompare(String(a.lastContact ?? ""))),
    followUpLeads: [...teamLeads]
      .filter((lead) => lead.status === "Follow-up")
      .sort((a, b) => String(a.nextFollowUp ?? "").localeCompare(String(b.nextFollowUp ?? ""))),
  };
});
