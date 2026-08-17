import { useQuery } from "@tanstack/react-query";
import { collection, doc, getDoc, getDocs, Timestamp, updateDoc, type DocumentData } from "firebase/firestore";

import { db } from "./firebase";
import { firebaseAuth, getMockStaffProfile } from "./auth";
import { agents as mockAgents } from "./mock-data";
import type { Agent } from "./types";

// Named agents-data.ts (not agents.ts) to avoid clashing with the
// admin.agents.*.tsx route files and the Agent type import elsewhere.
function mapAgentDoc(id: string, data: DocumentData): Agent {
  return {
    id,
    name: data.name,
    initials: data.initials,
    email: data.email,
    phone: data.phone ?? "",
    role: data.role ?? "Sales Agent",
    status: data.status ?? "Active",
    joinedAt: data.joinedAt instanceof Timestamp ? data.joinedAt.toDate().toISOString() : new Date().toISOString(),
    monthlyTarget: data.monthlyTarget ?? 0,
    targetDeals: data.targetDeals ?? 0,
    callsToday: data.callsToday ?? 0,
    callsThisWeek: data.callsThisWeek ?? [0, 0, 0, 0, 0, 0, 0],
    online: data.online ?? false,
    bankName: data.bankName ?? undefined,
    accountNumber: data.accountNumber ?? undefined,
    branchCode: data.branchCode ?? undefined,
  };
}

export function useAgents() {
  return useQuery({
    queryKey: ["agents", "all"],
    queryFn: async () => {
      if (getMockStaffProfile()) return mockAgents;
      const snap = await getDocs(collection(db, "agents"));
      return snap.docs.map((d) => mapAgentDoc(d.id, d.data()));
    },
  });
}

export function useAgentDoc(id: string | undefined) {
  const mockProfile = getMockStaffProfile();
  const effectiveId = id ?? (mockProfile?.role === "agent" ? "ag-1" : undefined);
  return useQuery({
    queryKey: ["agents", "one", effectiveId],
    queryFn: async () => {
      if (mockProfile) return mockAgents.find((agent) => agent.id === effectiveId) ?? null;
      const snap = await getDoc(doc(db, "agents", effectiveId!));
      if (!snap.exists()) return null;
      return mapAgentDoc(snap.id, snap.data());
    },
    enabled: Boolean(effectiveId),
  });
}

/**
 * Direct client write, allowed by firestore.rules for the signed-in agent
 * on their own agents/{uid} doc only — see the onlyChangedFields(['online',
 * 'bankName', 'accountNumber', 'branchCode']) grant. Used by the agent's
 * own Profile page (agent.profile.tsx) to set payout banking details.
 */
export async function updateOwnBankingDetails(details: {
  bankName: string;
  accountNumber: string;
  branchCode: string;
}) {
  if (getMockStaffProfile()) return;
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in to update your banking details.");
  await updateDoc(doc(db, "agents", uid), details);
}
