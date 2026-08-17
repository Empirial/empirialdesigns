import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, type DocumentData } from "firebase/firestore";

import { db } from "./firebase";
import { getMockStaffProfile } from "./auth";
import { services as mockServices } from "./mock-data";
import type { Service } from "./types";

// Named services-data.ts to mirror agents-data.ts's naming (avoids clashing
// with admin.services.tsx / agent.services.tsx route files).
function mapServiceDoc(id: string, data: DocumentData): Service {
  return {
    id,
    name: data.name,
    short: data.short ?? "",
    description: data.description ?? "",
    price: data.price ?? 0,
    promoPrice: data.promoPrice ?? data.price ?? 0,
    commissionType: data.commissionType ?? "percentage",
    commissionValue: data.commissionValue ?? 0,
    status: data.status ?? "Active",
    benefits: data.benefits ?? [],
    pitch: data.pitch ?? "",
    objections: data.objections ?? [],
    icon: data.icon ?? "Sparkles",
  };
}

export function useServices() {
  return useQuery({
    queryKey: ["services", "all"],
    queryFn: async () => {
      if (getMockStaffProfile()) return mockServices;
      const snap = await getDocs(collection(db, "services"));
      return snap.docs.map((d) => mapServiceDoc(d.id, d.data()));
    },
  });
}
