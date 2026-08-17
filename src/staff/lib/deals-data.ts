import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, orderBy, query, Timestamp, where, type DocumentData } from "firebase/firestore";

import { db } from "./firebase";
import { firebaseAuth, getMockStaffProfile } from "./auth";
import { deals as mockDeals } from "./mock-data";
import type { Deal } from "./types";

const DEALS_COLLECTION = "deals";

// Same adapter pattern as leads.ts: Firestore's `agentUid` maps down to the
// existing mock Deal type's `agentId` field so components don't need to
// change, and Timestamp becomes an ISO string.
function mapDealDoc(id: string, data: DocumentData): Deal {
  return {
    id,
    leadId: data.leadId,
    business: data.business,
    agentId: data.agentUid,
    serviceId: data.serviceId,
    industry: data.industry ?? null,
    value: data.value,
    commission: data.commission,
    closedAt:
      data.closedAt instanceof Timestamp ? data.closedAt.toDate().toISOString() : new Date().toISOString(),
    paymentStatus: data.paymentStatus,
  };
}

/** Admin-only: every deal. */
export function useDeals() {
  return useQuery({
    queryKey: ["deals", "all"],
    queryFn: async () => {
      if (getMockStaffProfile()) return mockDeals;
      const snap = await getDocs(query(collection(db, DEALS_COLLECTION), orderBy("closedAt", "desc")));
      return snap.docs.map((d) => mapDealDoc(d.id, d.data()));
    },
  });
}

/** The signed-in agent's own deals — enforced again server-side by firestore.rules. */
export function useMyDeals() {
  const uid = firebaseAuth.currentUser?.uid ?? (getMockStaffProfile() ? "mock-agent" : undefined);
  return useQuery({
    queryKey: ["deals", "mine", uid],
    queryFn: async () => {
      if (getMockStaffProfile()) return mockDeals.filter((deal) => deal.agentId === "ag-1");
      const snap = await getDocs(query(collection(db, DEALS_COLLECTION), where("agentUid", "==", uid)));
      return snap.docs.map((d) => mapDealDoc(d.id, d.data()));
    },
    enabled: Boolean(uid),
  });
}
