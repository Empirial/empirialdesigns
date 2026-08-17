import { onCall } from "firebase-functions/v2/https";

import { db } from "../lib/admin";
import { requireAuth } from "../lib/authz";

interface LeaderboardRow {
  agentId: string;
  name: string;
  initials: string;
  revenue: number;
  deals: number;
  rank: number;
}

/**
 * Any authenticated user (not admin-only) can call this — it exists because
 * firestore.rules correctly forbids an ordinary agent from reading every
 * other agent's `agents`/`deals` documents directly (that's the row-level
 * security the whole backend is built around), but a team leaderboard is a
 * legitimate, low-sensitivity feature. This function does the cross-agent
 * aggregation server-side with the Admin SDK and returns only a sanitized
 * ranking — no raw lead/deal documents ever reach the client this way.
 * Scoped to the current calendar month, matching the mock UI it replaces.
 */
export const getTeamLeaderboard = onCall(async (request) => {
  requireAuth(request);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [agentsSnap, dealsSnap] = await Promise.all([
    db.collection("agents").get(),
    db.collection("deals").where("closedAt", ">=", startOfMonth).get(),
  ]);

  const totals = new Map<string, { revenue: number; deals: number }>();
  for (const dealDoc of dealsSnap.docs) {
    const deal = dealDoc.data();
    const agentUid = deal.agentUid as string | undefined;
    if (!agentUid) continue;
    const entry = totals.get(agentUid) ?? { revenue: 0, deals: 0 };
    entry.revenue += (deal.value as number) ?? 0;
    entry.deals += 1;
    totals.set(agentUid, entry);
  }

  const rows: Omit<LeaderboardRow, "rank">[] = agentsSnap.docs.map((agentDoc) => {
    const agent = agentDoc.data();
    const t = totals.get(agentDoc.id) ?? { revenue: 0, deals: 0 };
    return {
      agentId: agentDoc.id,
      name: agent.name ?? "Unknown",
      initials: agent.initials ?? "??",
      revenue: t.revenue,
      deals: t.deals,
    };
  });

  rows.sort((a, b) => b.revenue - a.revenue);

  const leaderboard: LeaderboardRow[] = rows.map((row, i) => ({ ...row, rank: i + 1 }));
  return { leaderboard };
});
