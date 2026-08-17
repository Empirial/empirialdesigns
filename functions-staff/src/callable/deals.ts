import { HttpsError, onCall } from "firebase-functions/v2/https";

import { db } from "../lib/admin";
import { requireAdmin } from "../lib/authz";
import { writeAuditLog } from "../lib/audit";
import { writeNotification } from "../lib/notify";

const PAYMENT_STATUSES = ["Pending", "Approved", "Paid"] as const;
type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

interface SetDealPaymentInput {
  dealId: string;
  status: PaymentStatus;
}

/**
 * Replaces crm-store.tsx's setDealPayment(). Deals are Cloud-Functions-only
 * for every write (firestore.rules denies client writes outright) so
 * commission figures and payout status stay trustworthy — this is the one
 * function allowed to change paymentStatus, admin-only, with every
 * transition recorded to auditLog (including admin overrides like reverting
 * Approved back to Pending).
 */
export const setDealPayment = onCall<SetDealPaymentInput>(async (request) => {
  const { uid } = requireAdmin(request);
  const dealId = request.data?.dealId;
  const status = request.data?.status;

  if (!dealId || typeof dealId !== "string") {
    throw new HttpsError("invalid-argument", "dealId is required.");
  }
  if (!PAYMENT_STATUSES.includes(status)) {
    throw new HttpsError("invalid-argument", "status must be Pending, Approved, or Paid.");
  }

  const dealRef = db.doc(`deals/${dealId}`);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(dealRef);
    if (!snap.exists) {
      throw new HttpsError("not-found", "Deal not found.");
    }
    const deal = snap.data()!;
    const previousStatus = deal.paymentStatus as PaymentStatus;

    tx.update(dealRef, { paymentStatus: status });
    writeAuditLog(tx, {
      actorUid: uid,
      action: "deals.setPayment",
      targetCollection: "deals",
      targetId: dealId,
      before: { paymentStatus: previousStatus },
      after: { paymentStatus: status },
    });

    if ((status === "Approved" || status === "Paid") && deal.agentUid) {
      writeNotification(tx, {
        recipientUid: deal.agentUid,
        title: status === "Approved" ? "Commission approved" : "Commission paid",
        detail:
          status === "Approved"
            ? `R${Number(deal.commission ?? 0).toLocaleString("en-ZA")} for ${deal.business} is approved for payout.`
            : `R${Number(deal.commission ?? 0).toLocaleString("en-ZA")} for ${deal.business} has been paid out.`,
        tone: "success",
      });
    }
  });

  return { dealId, status };
});
