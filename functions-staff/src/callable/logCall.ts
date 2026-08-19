import type { DocumentData } from "firebase-admin/firestore";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

import { db } from "../lib/admin";
import { requireAuth } from "../lib/authz";
import { writeAuditLog } from "../lib/audit";
import { getAdminUids, writeNotification } from "../lib/notify";
import { computeCommission } from "../lib/commission";

const LEAD_STATUSES = [
  "New",
  "Assigned",
  "Not Called",
  "Called",
  "Interested",
  "Follow-up",
  "Proposal Sent",
  "Project in Progress",
  "Closed Won",
  "Closed Lost",
  "Not Interested",
] as const;
type LeadStatus = (typeof LEAD_STATUSES)[number];

interface LogCallInput {
  leadId: string;
  status: LeadStatus;
  note?: string;
  followUpAt?: string; // ISO timestamp
  /** Service discussed with the prospect, including for non-closing outcomes. */
  serviceId?: string;
  dealServiceId?: string;
  dealValue?: number;
}

interface LogCallResult {
  leadId: string;
  noteId: string | null;
  activityId: string;
  followUpId: string | null;
  dealId: string | null;
}

/**
 * The centerpiece of the whole backend — replaces crm-store.tsx's logCall().
 * One call from the agent workspace's "Save call log" button becomes one
 * atomic transaction that: updates the lead, optionally appends a note,
 * always appends an activity entry, optionally opens a follow-up, and
 * optionally closes a deal with a server-computed commission (never trust a
 * client-sent commission figure).
 */
export const logCall = onCall<LogCallInput>(async (request) => {
  const { uid } = requireAuth(request);
  const data = request.data;

  if (!data?.leadId || typeof data.leadId !== "string") {
    throw new HttpsError("invalid-argument", "leadId is required.");
  }
  if (!LEAD_STATUSES.includes(data.status)) {
    throw new HttpsError("invalid-argument", "status is not a valid lead status.");
  }
  if (
    data.status === "Closed Won" &&
    (!data.dealServiceId || typeof data.dealValue !== "number" || data.dealValue <= 0)
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Closed Won requires dealServiceId and a positive dealValue.",
    );
  }
  if (data.serviceId && data.dealServiceId && data.serviceId !== data.dealServiceId) {
    throw new HttpsError("invalid-argument", "The discussed service must match the deal service.");
  }

  const leadRef = db.doc(`leads/${data.leadId}`);
  const noteRef = data.note?.trim() ? leadRef.collection("notes").doc() : null;
  const activityRef = leadRef.collection("activities").doc();
  const followUpRef = data.followUpAt ? db.collection("followUps").doc() : null;
  const dealRef = data.status === "Closed Won" ? db.collection("deals").doc() : null;
  const discussedServiceId = data.serviceId ?? data.dealServiceId;
  const serviceRef = discussedServiceId ? db.doc(`services/${discussedServiceId}`) : null;
  const callerRef = db.doc(`staffUsers/${uid}`);
  // Lightweight record purely for aggregation (calls-per-day / calls-per-agent
  // charts) — cheaper and more robust than a collection-group query across
  // every lead's activities subcollection.
  const callLogRef = db.collection("callLogs").doc();
  // Only needed if this call closes a deal — fetched outside the transaction
  // since it doesn't need to be transactionally consistent with the write.
  const adminUids = data.status === "Closed Won" ? await getAdminUids() : [];

  const result = await db.runTransaction<LogCallResult>(async (tx) => {
    // --- reads first: Firestore transactions require every read before any write ---
    const leadSnap = await tx.get(leadRef);
    if (!leadSnap.exists) {
      throw new HttpsError("not-found", "Lead not found.");
    }
    const lead = leadSnap.data() as DocumentData;

    const role = request.auth?.token.role as string | undefined;
    const isAdmin = role === "admin";
    if (!isAdmin && lead.assignedAgentUid !== uid) {
      throw new HttpsError("permission-denied", "You can only log calls on your own leads.");
    }

    let service: DocumentData | undefined;
    if (serviceRef) {
      const serviceSnap = await tx.get(serviceRef);
      if (!serviceSnap.exists) {
        throw new HttpsError("not-found", "Service not found.");
      }
      service = serviceSnap.data();
    }

    const callerSnap = await tx.get(callerRef);
    const actorName = (callerSnap.exists && (callerSnap.data()?.displayName as string)) || "Unknown";

    const agentUid = (lead.assignedAgentUid as string | null) ?? uid;

    // Team Lead commission override — only relevant when this call is
    // actually closing a deal. Reads must happen before any writes below
    // (Firestore transaction rule), so this is resolved here even though
    // it's only used further down where dealRef is built.
    let teamOverride: { teamId: string; teamLeadUid: string; overrideRatePercent: number } | null = null;
    if (dealRef) {
      const agentDocSnap = await tx.get(db.doc(`agents/${agentUid}`));
      const teamId = agentDocSnap.exists ? (agentDocSnap.data()?.teamId as string | null | undefined) : null;
      if (teamId) {
        const teamSnap = await tx.get(db.doc(`teams/${teamId}`));
        if (teamSnap.exists) {
          const team = teamSnap.data()!;
          // No override on your own deals if the closing agent IS the Team Lead.
          if (team.teamLeadUid && team.teamLeadUid !== agentUid && team.status !== "archived") {
            teamOverride = {
              teamId,
              teamLeadUid: team.teamLeadUid as string,
              overrideRatePercent: (team.overrideRatePercent as number) ?? 0,
            };
          }
        }
      }
    }

    // --- writes ---
    const now = FieldValue.serverTimestamp();

    tx.update(leadRef, {
      status: data.status,
      ...(discussedServiceId ? { serviceId: discussedServiceId } : {}),
      lastContact: now,
      nextFollowUp: data.followUpAt ? Timestamp.fromDate(new Date(data.followUpAt)) : null,
      updatedAt: now,
      updatedBy: uid,
    });

    if (noteRef && data.note?.trim()) {
      tx.set(noteRef, {
        author: actorName,
        authorUid: uid,
        createdAt: now,
        body: data.note.trim(),
      });
    }

    tx.set(activityRef, {
      type: "call",
      title: `Call logged — ${data.status}`,
      detail: data.note?.trim() || null,
      actor: actorName,
      actorUid: uid,
      at: now,
    });

    tx.set(callLogRef, {
      agentUid,
      leadId: data.leadId,
      at: now,
      outcome: data.status,
    });

    if (followUpRef && data.followUpAt) {
      tx.set(followUpRef, {
        leadId: data.leadId,
        agentUid,
        reason: `Follow-up from call outcome: ${data.status}`,
        previousNote: data.note?.trim() ?? "",
        dueAt: Timestamp.fromDate(new Date(data.followUpAt)),
        status: "Open",
      });
    }

    if (dealRef && service && typeof data.dealValue === "number") {
      const commissionType = service.commissionType as "percentage" | "fixed";
      const commissionValue = service.commissionValue as number;
      const commission = computeCommission(data.dealValue, commissionType, commissionValue);

      tx.set(dealRef, {
        leadId: data.leadId,
        business: lead.business,
        agentUid,
        serviceId: data.dealServiceId,
        // Denormalized from the lead so admin.reports.tsx can aggregate
        // revenue-by-industry without joining back to leads per deal.
        industry: lead.industry ?? null,
        value: data.dealValue,
        commission,
        closedAt: now,
        paymentStatus: "Pending",
      });

      for (const adminUid of adminUids) {
        writeNotification(tx, {
          recipientUid: adminUid,
          title: "Deal closed",
          detail: `${actorName} closed ${lead.business} — R${data.dealValue.toLocaleString("en-ZA")}.`,
          tone: "success",
        });
      }

      if (lead.assignedAgentUid) {
        writeNotification(tx, {
          recipientUid: lead.assignedAgentUid as string,
          title: "Commission earned",
          detail: `${lead.business} has been closed. You earned R${commission.toLocaleString("en-ZA")} commission.`,
          tone: "success",
        });
      }

      // Team Lead override — a % of the closing agent's own commission
      // (their commission is unaffected), not a % of the deal value. See
      // teamOverride resolution above and teams.ts for the rate's source.
      if (teamOverride) {
        const overrideAmount = Math.round((commission * teamOverride.overrideRatePercent) / 100);
        const teamOverrideRef = db.collection("teamOverrides").doc();
        tx.set(teamOverrideRef, {
          teamId: teamOverride.teamId,
          teamLeadUid: teamOverride.teamLeadUid,
          agentUid,
          dealId: dealRef.id,
          leadId: data.leadId,
          business: lead.business,
          agentCommission: commission,
          overrideRatePercent: teamOverride.overrideRatePercent,
          overrideAmount,
          closedAt: now,
        });
        writeNotification(tx, {
          recipientUid: teamOverride.teamLeadUid,
          title: "Team override earned",
          detail: `${actorName} closed ${lead.business} — you earned R${overrideAmount.toLocaleString("en-ZA")} in override commission.`,
          tone: "success",
        });
      }
    }

    writeAuditLog(tx, {
      actorUid: uid,
      action: "leads.logCall",
      targetCollection: "leads",
      targetId: data.leadId,
      after: { status: data.status, dealId: dealRef?.id ?? null, followUpId: followUpRef?.id ?? null },
    });

    return {
      leadId: data.leadId,
      noteId: noteRef?.id ?? null,
      activityId: activityRef.id,
      followUpId: followUpRef?.id ?? null,
      dealId: dealRef?.id ?? null,
    };
  });

  return result;
});
