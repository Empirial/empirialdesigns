import { doc, serverTimestamp, writeBatch } from "firebase/firestore";

import { db } from "./firebase";
import { firebaseAuth } from "./auth";
import { services, scripts } from "./mock-data";
import { DEFAULT_SALES_LESSONS } from "./sales-training-data";

/**
 * One-click, admin-only import of the real EmpirialDesigns Sales Playbook
 * content — the 7 services, 31 scripts, and 6 course lessons authored from
 * the Sales Playbook / Service Packages / Sales Course source documents —
 * into the *real* Firestore collections (`services`, `scripts`,
 * `salesTrainingLessons`), not the local `mock-data.ts` arrays these are
 * read from (those only feed the app's local demo/mock login).
 *
 * Writes are `merge: true` and keyed by the same stable ids used throughout
 * the codebase (svc-web, sc-web-script, module-0-welcome, …), so running
 * this more than once is safe — it re-syncs those exact documents rather
 * than duplicating them. It does not touch any document with a different
 * id, so a service an admin created by hand through "+ Add Service" (which
 * gets an auto-generated Firestore id) is left completely alone.
 *
 * Requires firestore.rules' `isStaffAdmin()` write grant on all three
 * collections — see firestore.rules — so this only succeeds when called by
 * a signed-in admin, exactly like every other admin write path in the app.
 */
export async function importEmpirialCatalog(): Promise<{ services: number; scripts: number; lessons: number }> {
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in as an admin to import the catalog.");

  const batch = writeBatch(db);
  const now = serverTimestamp();

  for (const service of services) {
    const { id, ...rest } = service;
    batch.set(doc(db, "services", id), { ...rest, updatedBy: uid, updatedAt: now }, { merge: true });
  }

  for (const script of scripts) {
    // `favourite` is a client-derived field (from `favouriteBy` + the
    // signed-in uid) — never a stored one. `updatedAt` gets a fresh
    // server timestamp instead of the mock's local iso() value.
    const { id, favourite: _favourite, updatedAt: _updatedAt, ...rest } = script;
    batch.set(doc(db, "scripts", id), { ...rest, favouriteBy: [], updatedAt: now }, { merge: true });
  }

  for (const lesson of DEFAULT_SALES_LESSONS) {
    const { id, ...rest } = lesson;
    batch.set(doc(db, "salesTrainingLessons", id), { ...rest, updatedAt: now }, { merge: true });
  }

  await batch.commit();

  return { services: services.length, scripts: scripts.length, lessons: DEFAULT_SALES_LESSONS.length };
}
