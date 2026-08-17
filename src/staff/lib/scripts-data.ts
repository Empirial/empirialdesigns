import { useQuery } from "@tanstack/react-query";
import { arrayRemove, arrayUnion, collection, doc, getDocs, Timestamp, updateDoc, type DocumentData } from "firebase/firestore";

import { db } from "./firebase";
import { firebaseAuth, getMockStaffProfile } from "./auth";
import { scripts as mockScripts } from "./mock-data";
import type { ScriptDoc } from "./types";

// Firestore's scripts.favouriteBy is a uid[] (per-user favourites — the fix
// for the mock data's single shared boolean). Mapped down to the existing
// per-user `favourite` boolean shape the UI expects (true only if the
// signed-in user's uid is in the array).
function mapScriptDoc(id: string, data: DocumentData): ScriptDoc {
  const favouriteBy: string[] = data.favouriteBy ?? [];
  const uid = firebaseAuth.currentUser?.uid;
  return {
    id,
    title: data.title,
    category: data.category,
    type: data.type,
    body: data.body,
    updatedAt:
      data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
    favourite: uid ? favouriteBy.includes(uid) : false,
  };
}

export function useScripts() {
  return useQuery({
    queryKey: ["scripts", "all"],
    queryFn: async () => {
      if (getMockStaffProfile()) return mockScripts;
      const snap = await getDocs(collection(db, "scripts"));
      return snap.docs.map((d) => mapScriptDoc(d.id, d.data()));
    },
  });
}

/**
 * Direct client write, allowed by firestore.rules for any signed-in user as
 * long as `favouriteBy` is the only field changed — no Cloud Function
 * needed. `arrayUnion`/`arrayRemove` only ever touch the caller's own uid.
 */
export async function toggleMyScriptFavourite(scriptId: string, currentlyFavourited: boolean) {
  if (getMockStaffProfile()) return;
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) return;
  await updateDoc(doc(db, "scripts", scriptId), {
    favouriteBy: currentlyFavourited ? arrayRemove(uid) : arrayUnion(uid),
  });
}
