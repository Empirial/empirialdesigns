import { useQuery, type QueryClient } from "@tanstack/react-query";
import { collection, getDocs, query, Timestamp, where, type DocumentData } from "firebase/firestore";

import { db } from "./firebase";
import { getMockStaffProfile } from "./auth";
import type { Quote } from "./types";

const QUOTES_COLLECTION = "quotes";

function mapQuoteDoc(id: string, data: DocumentData): Quote {
  return {
    id,
    leadId: data.leadId,
    business: data.business,
    agentUid: data.agentUid,
    items: data.items ?? [],
    total: data.total ?? 0,
    status: "Sent",
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
  };
}

/** Quotes previously sent for this lead — created only by createQuote(), never directly by clients. */
export function useLeadQuotes(leadId: string) {
  return useQuery({
    queryKey: ["quotes", "byLead", leadId],
    queryFn: async () => {
      if (getMockStaffProfile()) return [] as Quote[];
      const snap = await getDocs(query(collection(db, QUOTES_COLLECTION), where("leadId", "==", leadId)));
      return snap.docs
        .map((d) => mapQuoteDoc(d.id, d.data()))
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    },
    enabled: Boolean(leadId),
  });
}

export function invalidateQuoteQueries(queryClient: QueryClient, leadId: string) {
  queryClient.invalidateQueries({ queryKey: ["quotes", "byLead", leadId] });
}

/** Plain-text summary an agent can paste into an email/WhatsApp — no send infrastructure exists yet, see docs/CRM_STAFF_PORTAL.md. */
export function formatQuoteSummary(business: string, items: Quote["items"], total: number): string {
  const lines = items.map((item) => `• ${item.name} — R${item.price.toLocaleString("en-ZA")}`);
  return `Quote for ${business}\n\n${lines.join("\n")}\n\nTotal: R${total.toLocaleString("en-ZA")}`;
}
