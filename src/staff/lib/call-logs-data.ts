import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, Timestamp, where } from "firebase/firestore";

import { db } from "./firebase";
import { getMockStaffProfile } from "./auth";
import { agents as mockAgents } from "./mock-data";

// Demo/mock mode has no real callLogs collection to query — synthesize
// plausible entries from mock-data.ts's agents' callsToday/callsThisWeek
// numbers (kept there for exactly this) so the derived-from-callLogs
// KPIs/charts stay populated in a demo login instead of showing an
// unrealistic 0. Computed once per module load, not per render.
function synthesizeMockCallLogs(): CallLogRow[] {
  const rows: CallLogRow[] = [];
  const now = Date.now();
  let n = 0;
  for (const agent of mockAgents) {
    for (let i = 0; i < agent.callsToday; i++) {
      const at = new Date(now - i * 9 * 60 * 1000); // spread through today, ~9 min apart
      rows.push({ id: `mock-${n++}`, agentUid: agent.id, leadId: "", outcome: "Called", at: at.toISOString() });
    }
    agent.callsThisWeek.forEach((count, dayIndex) => {
      const daysAgo = 6 - dayIndex; // index 0=Mon..6=Sun, treated as the last 7 days ending today
      for (let i = 0; i < count; i++) {
        const at = new Date(now - daysAgo * 86400000 - i * 7 * 60 * 1000);
        rows.push({ id: `mock-${n++}`, agentUid: agent.id, leadId: "", outcome: "Called", at: at.toISOString() });
      }
    });
  }
  return rows;
}

let mockCallLogsCache: CallLogRow[] | null = null;
function getMockCallLogs(): CallLogRow[] {
  if (!mockCallLogsCache) mockCallLogsCache = synthesizeMockCallLogs();
  return mockCallLogsCache;
}

export interface CallLogRow {
  id: string;
  agentUid: string;
  leadId: string;
  outcome: string;
  at: string;
}

/**
 * The real record of every call logged — written by logCall()
 * (functions-staff/src/callable/logCall.ts) purely for aggregation, so
 * "calls today" / "calls this week" / "calls per agent" can be computed
 * live instead of relying on a counter someone has to remember to
 * increment. Nothing writes to agents/{uid}.callsToday or .callsThisWeek —
 * those fields are seed-only, always 0 in production; every real "calls"
 * figure in the UI should derive from this collection instead (see
 * countCallsOnDay/countCallsInLastNDays below).
 */
export function useCallLogs() {
  return useQuery({
    queryKey: ["callLogs", "all"],
    queryFn: async (): Promise<CallLogRow[]> => {
      if (getMockStaffProfile()) return getMockCallLogs();
      const snap = await getDocs(collection(db, "callLogs"));
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          agentUid: data.agentUid ?? "",
          leadId: data.leadId ?? "",
          outcome: data.outcome ?? "",
          at: data.at instanceof Timestamp ? data.at.toDate().toISOString() : new Date().toISOString(),
        };
      });
    },
  });
}

/**
 * The signed-in agent's own call logs from the last N days. Same
 * mock-fallback convention as useAgentDoc/useMyDeals: an explicit uid wins,
 * otherwise falls back to the fixed "ag-1" demo agent in mock mode, since
 * firebaseAuth.currentUser is never actually signed in there.
 */
export function useMyCallLogs(uid: string | undefined, days = 7) {
  const mockProfile = getMockStaffProfile();
  const effectiveUid = uid ?? (mockProfile ? "ag-1" : undefined);
  return useQuery({
    queryKey: ["callLogs", "mine", effectiveUid, days],
    queryFn: async (): Promise<CallLogRow[]> => {
      if (mockProfile) return getMockCallLogs().filter((l) => l.agentUid === effectiveUid);
      const since = new Date(Date.now() - days * 86400000);
      const snap = await getDocs(
        query(
          collection(db, "callLogs"),
          where("agentUid", "==", effectiveUid),
          where("at", ">=", Timestamp.fromDate(since)),
        ),
      );
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          agentUid: data.agentUid ?? "",
          leadId: data.leadId ?? "",
          outcome: data.outcome ?? "",
          at: data.at instanceof Timestamp ? data.at.toDate().toISOString() : new Date().toISOString(),
        };
      });
    },
    enabled: Boolean(effectiveUid),
  });
}

function isSameLocalDay(isoA: string, date: Date): boolean {
  const a = new Date(isoA);
  return (
    a.getFullYear() === date.getFullYear() &&
    a.getMonth() === date.getMonth() &&
    a.getDate() === date.getDate()
  );
}

export function countCallsToday(logs: CallLogRow[], agentUid?: string): number {
  const today = new Date();
  return logs.filter((l) => (agentUid ? l.agentUid === agentUid : true) && isSameLocalDay(l.at, today)).length;
}

/** Calls per weekday for the last 7 days, indexed Mon=0..Sun=6 (matching agent.dashboard.tsx's chart). */
export function callsByWeekday(logs: CallLogRow[], agentUid?: string): number[] {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const l of logs) {
    if (agentUid && l.agentUid !== agentUid) continue;
    const jsDay = new Date(l.at).getDay(); // 0=Sun..6=Sat
    const mondayFirst = (jsDay + 6) % 7; // 0=Mon..6=Sun
    counts[mondayFirst] += 1;
  }
  return counts;
}
