import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

import { db } from "../lib/admin";
import { requireAdmin } from "../lib/authz";
import { LEAD_SEEDS, SCRIPT_SEEDS, SERVICE_SEEDS } from "../data/mock-seed";

interface SeedDemoDataInput {
  force?: boolean;
}

/**
 * Admin-only, one-shot demo data loader. Solves the "Firestore is completely
 * empty" problem without needing a standalone script (which would need its
 * own npm install) — deploy this function, call it once, and there's real
 * services/scripts/leads to actually test the app against.
 *
 * A portion of leads are pre-assigned round-robin across whichever real
 * agent accounts already exist (created via inviteUser()), so /agent/leads
 * shows something immediately for a freshly-invited agent to work with —
 * standing in for the admin.leads.tsx bulk-assign UI, which isn't migrated
 * yet in this pass.
 */
export const seedDemoData = onCall<SeedDemoDataInput>(async (request) => {
  const { uid } = requireAdmin(request);

  const existingLeads = await db.collection("leads").limit(1).get();
  if (!existingLeads.empty && !request.data?.force) {
    throw new HttpsError(
      "failed-precondition",
      "leads already has documents — pass { force: true } to seed more anyway (this adds documents, it does not clear existing ones).",
    );
  }

  const agentsSnap = await db.collection("agents").get();
  const agentUids = agentsSnap.docs.map((d) => d.id);

  const batch = db.batch();
  const now = FieldValue.serverTimestamp();

  for (const service of SERVICE_SEEDS) {
    const { id, ...rest } = service;
    batch.set(db.doc(`services/${id}`), {
      ...rest,
      status: "Active",
      updatedBy: uid,
      updatedAt: now,
    });
  }

  for (const script of SCRIPT_SEEDS) {
    const { id, ...rest } = script;
    batch.set(db.doc(`scripts/${id}`), {
      ...rest,
      favouriteBy: [],
      updatedAt: now,
    });
  }

  let agentCursor = 0;
  for (const seed of LEAD_SEEDS) {
    const leadRef = db.collection("leads").doc();
    const assignedAgentUid =
      seed.preAssign && agentUids.length > 0 ? agentUids[agentCursor++ % agentUids.length] : null;
    const nextFollowUp =
      seed.followUpInDays !== undefined
        ? new Date(Date.now() + seed.followUpInDays * 86400000)
        : null;

    batch.set(leadRef, {
      business: seed.business,
      contactPerson: seed.contactPerson,
      role: seed.role,
      phone: seed.phone,
      email: seed.email,
      website: null,
      industry: seed.industry,
      location: seed.location,
      address: `${seed.location} Business District`,
      serviceId: seed.serviceId,
      assignedAgentUid,
      status: seed.status,
      value: seed.value,
      source: seed.source,
      lastContact: null,
      nextFollowUp,
      createdAt: now,
      createdBy: uid,
      updatedAt: now,
      updatedBy: uid,
      lostReason: seed.lostReason ?? null,
      deletedAt: null,
    });

    batch.set(leadRef.collection("activities").doc(), {
      type: "note",
      title: "Lead imported",
      detail: `Source: ${seed.source} (demo seed)`,
      actor: "System",
      actorUid: uid,
      at: now,
    });
  }

  await batch.commit();

  return {
    servicesSeeded: SERVICE_SEEDS.length,
    scriptsSeeded: SCRIPT_SEEDS.length,
    leadsSeeded: LEAD_SEEDS.length,
    agentsFoundForAssignment: agentUids.length,
  };
});
