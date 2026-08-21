import { useQuery } from "@tanstack/react-query";
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, type DocumentData } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { db, storage } from "@staff/lib/firebase";
import { firebaseAuth, getMockStaffProfile } from "@staff/lib/auth";

// Admin-uploaded marketing materials, layered on top of the bundled
// defaults in agent.marketing.tsx (POSTERS / BRAND_ASSETS /
// PORTFOLIO_SCREENSHOTS). Those bundled arrays ship with the app and never
// change without a deploy; this collection is how an admin adds new ones
// without one. See admin.marketing.tsx for the upload UI and
// firestore.rules / storage.rules ("marketingMaterials") for the write rule.
export type MaterialType = "poster" | "brand" | "portfolio";

export interface MarketingMaterial {
  id: string;
  type: MaterialType;
  name: string;
  description: string;
  /** Copy-ready social caption — posters only. */
  caption: string;
  /** Live client site — portfolio screenshots only. */
  url: string;
  imageUrl: string;
  /** Storage object path, kept alongside imageUrl so deleteMarketingMaterial
   * doesn't need to parse it back out of a Firebase download URL. */
  storagePath: string;
  createdAt: string | null;
}

function mapDoc(id: string, data: DocumentData): MarketingMaterial {
  return {
    id,
    type: data.type ?? "poster",
    name: data.name ?? "",
    description: data.description ?? "",
    caption: data.caption ?? "",
    url: data.url ?? "",
    imageUrl: data.imageUrl ?? "",
    storagePath: data.storagePath ?? "",
    createdAt: data.createdAt?.toDate?.().toISOString() ?? null,
  };
}

export function useMarketingMaterials() {
  return useQuery({
    queryKey: ["marketingMaterials"],
    queryFn: async (): Promise<MarketingMaterial[]> => {
      // No mock/demo data for admin uploads — mock mode still shows the
      // bundled defaults in agent.marketing.tsx, just nothing uploaded.
      if (getMockStaffProfile()) return [];
      const snap = await getDocs(query(collection(db, "marketingMaterials"), orderBy("createdAt", "desc")));
      return snap.docs.map((d) => mapDoc(d.id, d.data()));
    },
  });
}

export interface UploadMarketingMaterialInput {
  type: MaterialType;
  name: string;
  description: string;
  caption: string;
  url: string;
  file: File;
}

export async function uploadMarketingMaterial(input: UploadMarketingMaterialInput): Promise<void> {
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in to upload marketing materials");

  const storagePath = `marketingMaterials/${crypto.randomUUID()}-${input.file.name}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, input.file);
  const imageUrl = await getDownloadURL(storageRef);

  await addDoc(collection(db, "marketingMaterials"), {
    type: input.type,
    name: input.name,
    description: input.description,
    caption: input.caption,
    url: input.url,
    imageUrl,
    storagePath,
    createdAt: serverTimestamp(),
    uploadedBy: uid,
  });
}

export async function deleteMarketingMaterial(material: MarketingMaterial): Promise<void> {
  await deleteDoc(doc(db, "marketingMaterials", material.id));
  if (material.storagePath) {
    // Best-effort — an already-missing Storage object shouldn't block
    // removing the Firestore doc the UI actually reads.
    try {
      await deleteObject(ref(storage, material.storagePath));
    } catch {
      // ignore
    }
  }
}
