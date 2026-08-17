import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";

import { db } from "../lib/admin";
import { writeNotification } from "../lib/notify";

const MAX_PER_RUN = 200;

/**
 * The one notification type with no single write to hook into — "this
 * follow-up is now overdue" only becomes true as time passes, not because
 * of any event. Runs daily, checks every open follow-up, and notifies once
 * per follow-up (via `overdueNotifiedAt`, so it doesn't re-notify every day
 * a follow-up stays open and overdue).
 */
export const notifyOverdueFollowUps = onSchedule("every day 07:00", async () => {
  const now = new Date();
  const snap = await db.collection("followUps").where("status", "==", "Open").get();

  const batch = db.batch();
  let notified = 0;

  for (const doc of snap.docs) {
    if (notified >= MAX_PER_RUN) break;
    const data = doc.data();
    if (data.overdueNotifiedAt) continue;
    const dueAt: Timestamp | undefined = data.dueAt;
    if (!dueAt || dueAt.toDate() >= now) continue;

    batch.update(doc.ref, { overdueNotifiedAt: FieldValue.serverTimestamp() });
    writeNotification(batch, {
      recipientUid: data.agentUid,
      title: "Follow-up overdue",
      detail: `A follow-up due ${dueAt.toDate().toLocaleDateString("en-ZA")} is still open.`,
      tone: "warning",
    });
    notified++;
  }

  if (notified > 0) {
    await batch.commit();
  }
});
