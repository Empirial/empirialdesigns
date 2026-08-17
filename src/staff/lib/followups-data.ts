import { useQuery, type QueryClient } from "@tanstack/react-query";
import { collection, doc, getDocs, query, Timestamp, updateDoc, where, type DocumentData } from "firebase/firestore";

import { db } from "./firebase";
import { firebaseAuth, getMockStaffProfile } from "./auth";
import { followUps as mockFollowUps } from "./mock-data";
import type { FollowUp } from "./types";

const FOLLOWUPS_COLLECTION = "followUps";

// Same adapter pattern as leads.ts/deals-data.ts.
function mapFollowUpDoc(id: string, data: DocumentData): FollowUp {
  return {
    id,
    leadId: data.leadId,
    agentId: data.agentUid,
    reason: data.reason,
    previousNote: data.previousNote,
    dueAt: data.dueAt instanceof Timestamp ? data.dueAt.toDate().toISOString() : new Date().toISOString(),
    status: data.status,
  };
}

/** The signed-in agent's own follow-ups — created only by logCall(), never directly by clients. */
export function useMyFollowUps(options?: { enabled?: boolean }) {
  const uid = firebaseAuth.currentUser?.uid ?? (getMockStaffProfile() ? "mock-agent" : undefined);
  return useQuery({
    queryKey: ["followUps", "mine", uid],
    queryFn: async () => {
      if (getMockStaffProfile()) return mockFollowUps.filter((followUp) => followUp.agentId === "ag-1");
      const snap = await getDocs(query(collection(db, FOLLOWUPS_COLLECTION), where("agentUid", "==", uid)));
      return snap.docs.map((d) => mapFollowUpDoc(d.id, d.data()));
    },
    enabled: Boolean(uid) && (options?.enabled ?? true),
  });
}

/**
 * Direct client writes — firestore.rules allows the owning agent (or admin)
 * to update only the `status`/`dueAt` fields on their own follow-up, so no
 * Cloud Function is needed for either action.
 */
export async function completeFollowUp(id: string) {
  await updateDoc(doc(db, FOLLOWUPS_COLLECTION, id), { status: "Completed" });
}

export async function rescheduleFollowUp(id: string, dueAtIso: string) {
  await updateDoc(doc(db, FOLLOWUPS_COLLECTION, id), { dueAt: Timestamp.fromDate(new Date(dueAtIso)) });
}

export function invalidateFollowUpQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["followUps"] });
}
