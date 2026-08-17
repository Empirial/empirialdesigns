import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

import { db } from "../lib/admin";
import { requireAuth } from "../lib/authz";
import { writeAuditLog } from "../lib/audit";

interface CreateQuoteInput {
  leadId: string;
  serviceIds: string[];
}

interface QuoteLineItem {
  serviceId: string;
  name: string;
  price: number;
}

interface CreateQuoteResult {
  quoteId: string;
  total: number;
  items: QuoteLineItem[];
}

const MAX_SERVICES_PER_QUOTE = 20;

/**
 * The agent picks which services a lead wants; this function does the part
 * that must not be client-trusted — reading each service's real price
 * server-side (never a client-sent figure, same principle as logCall()'s
 * commission math) and writing one quote doc + a lead activity so the quote
 * shows up in the lead's timeline. "Sending" the quote is scoped to marking
 * it Sent and logging the event — there's no email/WhatsApp-sending
 * infrastructure in this app (see docs/CRM_STAFF_PORTAL.md), so the agent
 * copies the generated summary out to send manually, the same pattern the
 * Services page already uses for "copy pitch."
 */
export const createQuote = onCall<CreateQuoteInput>(async (request) => {
  const { uid, role } = requireAuth(request);
  const leadId = request.data?.leadId;
  const serviceIds = request.data?.serviceIds;

  if (!leadId || typeof leadId !== "string") {
    throw new HttpsError("invalid-argument", "leadId is required.");
  }
  if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
    throw new HttpsError("invalid-argument", "Pick at least one service.");
  }
  if (serviceIds.length > MAX_SERVICES_PER_QUOTE) {
    throw new HttpsError("invalid-argument", `A quote can include at most ${MAX_SERVICES_PER_QUOTE} services.`);
  }

  const leadRef = db.doc(`leads/${leadId}`);
  const quoteRef = db.collection("quotes").doc();

  const result = await db.runTransaction(async (tx) => {
    const leadSnap = await tx.get(leadRef);
    if (!leadSnap.exists) {
      throw new HttpsError("not-found", "Lead not found.");
    }
    const lead = leadSnap.data()!;

    const isOwner = lead.assignedAgentUid === uid;
    if (!isOwner && role !== "admin") {
      throw new HttpsError("permission-denied", "You can only quote your own leads.");
    }

    const uniqueIds = [...new Set(serviceIds)];
    const serviceSnaps = await Promise.all(uniqueIds.map((id) => tx.get(db.doc(`services/${id}`))));

    const items: QuoteLineItem[] = [];
    for (let i = 0; i < serviceSnaps.length; i++) {
      const snap = serviceSnaps[i]!;
      if (!snap.exists) {
        throw new HttpsError("not-found", `Service ${uniqueIds[i]} not found.`);
      }
      const service = snap.data()!;
      const price = typeof service.promoPrice === "number" && service.promoPrice > 0
        ? service.promoPrice
        : (service.price as number);
      items.push({ serviceId: snap.id, name: service.name as string, price });
    }

    const total = items.reduce((sum, item) => sum + item.price, 0);

    tx.set(quoteRef, {
      leadId,
      business: lead.business,
      agentUid: uid,
      items,
      total,
      status: "Sent",
      createdAt: FieldValue.serverTimestamp(),
      sentAt: FieldValue.serverTimestamp(),
    });

    tx.set(leadRef.collection("activities").doc(), {
      type: "quote",
      title: "Quote sent",
      detail: `${items.length} service(s), ${total.toLocaleString("en-ZA")} total`,
      actor: uid,
      actorUid: uid,
      at: FieldValue.serverTimestamp(),
    });

    writeAuditLog(tx, {
      actorUid: uid,
      action: "quotes.create",
      targetCollection: "quotes",
      targetId: quoteRef.id,
      after: { leadId, total, itemCount: items.length },
    });

    return { items, total };
  });

  return { quoteId: quoteRef.id, total: result.total, items: result.items } satisfies CreateQuoteResult;
});
