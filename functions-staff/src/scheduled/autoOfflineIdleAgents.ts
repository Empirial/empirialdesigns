import { Timestamp } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";

import { db } from "../lib/admin";

const IDLE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_RUN = 500;

/**
 * online:true is now set automatically at sign-in (establishStaffSession,
 * src/staff/lib/auth.ts) and cleared at sign-out — but a browser tab closed
 * without signing out (crash, killed app, dead battery) leaves online stuck
 * at true forever with nothing to flip it back. This is the "pull" side:
 * runs every 15 minutes, and offlines anyone whose heartbeat
 * (lastActiveAt, touched every 5 min by useAgentHeartbeat while the app is
 * open) has gone stale for over an hour.
 *
 * Agents who've never had a heartbeat write (pre-dating this feature, or
 * manually toggled online by an admin) are skipped by the range filter —
 * they self-heal the next time they actually sign in.
 */
export const autoOfflineIdleAgents = onSchedule("every 15 minutes", async () => {
  const cutoff = Timestamp.fromMillis(Date.now() - IDLE_THRESHOLD_MS);
  const snap = await db
    .collection("agents")
    .where("online", "==", true)
    .where("lastActiveAt", "<", cutoff)
    .limit(MAX_PER_RUN)
    .get();

  if (snap.empty) return;

  const batch = db.batch();
  for (const doc of snap.docs) {
    batch.update(doc.ref, { online: false });
  }
  await batch.commit();
});
