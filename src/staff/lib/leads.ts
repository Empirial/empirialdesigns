import { useQuery, type QueryClient } from "@tanstack/react-query";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import { db } from "./firebase";
import { firebaseAuth, getMockStaffProfile } from "./auth";
import { leads as mockLeads } from "./mock-data";
import type { ActivityItem, Lead, LeadFormPatch, LeadNote, LeadStatus } from "./types";

// The Firestore document shape differs from the mock Lead type in two ways:
// the field is `assignedAgentUid` (not `assignedAgentId`, see
// docs/firebase-architecture.html §5 for why), and date fields are
// Timestamps, not ISO strings. mapLeadDoc() adapts at the read boundary so
// the rest of the already-built UI (which expects Lead-shaped objects with
// `assignedAgentId` and ISO date strings) doesn't need to change.
// notes/activities are real subcollections now — always empty here, fetch
// them separately with useLeadNotes()/useLeadActivities().
function mapLeadDoc(snap: QueryDocumentSnapshot<DocumentData>): Lead {
  const data = snap.data();
  const toIso = (v: unknown) => (v instanceof Timestamp ? (v as Timestamp).toDate().toISOString() : null);
  return {
    id: snap.id,
    business: data.business ?? "",
    // Quick-add (Add Lead dialog/dashboard) only ever sets business/contactPerson/
    // phone — every other field genuinely is undefined in Firestore for those
    // docs, despite the Lead type claiming they're required strings. Default
    // here so every consumer (search, import dedup, etc.) can safely call
    // string methods without re-deriving this guard everywhere.
    contactPerson: data.contactPerson ?? "",
    role: data.role ?? "",
    phone: data.phone ?? "",
    email: data.email ?? "",
    website: data.website ?? undefined,
    industry: data.industry ?? "",
    location: data.location ?? "",
    address: data.address ?? "",
    serviceId: data.serviceId ?? null,
    assignedAgentId: data.assignedAgentUid ?? null,
    status: data.status ?? "New",
    value: data.value ?? 0,
    source: data.source ?? "Cold List",
    lastContact: toIso(data.lastContact),
    nextFollowUp: toIso(data.nextFollowUp),
    createdAt: toIso(data.createdAt) ?? new Date().toISOString(),
    notes: [],
    activities: [],
    lostReason: data.lostReason ?? undefined,
  };
}

const LEADS_COLLECTION = "leads";

/** Leads visible to the signed-in agent — the real row-level scoping, enforced again server-side by firestore.rules. */
export function useMyLeads() {
  const uid = firebaseAuth.currentUser?.uid ?? (getMockStaffProfile() ? "mock-agent" : undefined);
  return useQuery({
    queryKey: ["leads", "mine", uid],
    queryFn: async () => {
      if (getMockStaffProfile()) return mockLeads.filter((lead) => lead.assignedAgentId === "ag-1");
      const snap = await getDocs(
        query(collection(db, LEADS_COLLECTION), where("assignedAgentUid", "==", uid)),
      );
      // Soft-deleted leads are filtered client-side rather than via a second
      // `where()` clause, to avoid depending on a composite index existing.
      return snap.docs.map(mapLeadDoc).filter((l) => !(l as unknown as { deletedAt?: unknown }).deletedAt);
    },
    enabled: Boolean(uid),
  });
}

/** Admin-only: every lead. Pass `enabled: false` when rendering in a context that might not be admin (e.g. a shared sidebar) so the query never fires and hits a permission error for the wrong role. */
export function useLeads(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["leads", "all"],
    queryFn: async () => {
      if (getMockStaffProfile()) return mockLeads;
      const snap = await getDocs(query(collection(db, LEADS_COLLECTION), orderBy("createdAt", "desc")));
      return snap.docs.map(mapLeadDoc);
    },
    enabled: options?.enabled ?? true,
  });
}

export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: ["leads", "one", id],
    queryFn: async () => {
      const snap = await getDoc(doc(db, LEADS_COLLECTION, id!));
      if (!snap.exists()) return null;
      return mapLeadDoc(snap as QueryDocumentSnapshot<DocumentData>);
    },
    enabled: Boolean(id),
  });
}

export function useLeadNotes(leadId: string | undefined) {
  return useQuery({
    queryKey: ["leads", "notes", leadId],
    queryFn: async () => {
      const snap = await getDocs(
        query(collection(db, LEADS_COLLECTION, leadId!, "notes"), orderBy("createdAt", "desc")),
      );
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          author: data.author,
          createdAt:
            data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          body: data.body,
        } satisfies LeadNote;
      });
    },
    enabled: Boolean(leadId),
  });
}

export function useLeadActivities(leadId: string | undefined) {
  return useQuery({
    queryKey: ["leads", "activities", leadId],
    queryFn: async () => {
      const snap = await getDocs(
        query(collection(db, LEADS_COLLECTION, leadId!, "activities"), orderBy("at", "desc")),
      );
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          type: data.type,
          title: data.title,
          // ActivityItem.detail is `string` when present (not `string | undefined`) —
          // exactOptionalPropertyTypes means the key must be omitted, not set to undefined.
          ...(data.detail ? { detail: data.detail as string } : {}),
          actor: data.actor,
          at: data.at instanceof Timestamp ? data.at.toDate().toISOString() : new Date().toISOString(),
        } satisfies ActivityItem;
      });
    },
    enabled: Boolean(leadId),
  });
}

/** Invalidate every leads-related query — call after any mutation (logCall, status change, note add). */
export function invalidateLeadQueries(queryClient: QueryClient, leadId?: string) {
  queryClient.invalidateQueries({ queryKey: ["leads"] });
  if (leadId) {
    queryClient.invalidateQueries({ queryKey: ["leads", "notes", leadId] });
    queryClient.invalidateQueries({ queryKey: ["leads", "activities", leadId] });
  }
}

/**
 * Direct client write — allowed by firestore.rules for an agent updating
 * their own lead's status (a narrow allow-listed set of fields), no Cloud
 * Function needed. Used by "Mark not interested" and the workspace's
 * direct status Select (as opposed to the full "Save call log" flow, which
 * goes through callLogCall() instead).
 */
/**
 * The one lead-creation write path — used by the shared LeadFormDialog from
 * both the Leads page and the dashboard's quick-add, so there's exactly one
 * "add a lead" behavior in the app instead of two subtly different ones.
 * New leads are always created unassigned/New regardless of what the form's
 * "Assign to agent" field holds — assignment happens via the leads table's
 * own Assign flow afterward so it goes through the same audited path bulk
 * assignment uses (bulkAssignLeads()), not a quiet default-assign from a
 * form no one usually associates with a real assignment action. `value` is
 * intentionally not written at all when creating — leads don't carry an
 * upfront deal-size estimate; real value only exists once a deal closes
 * (logCall()'s dealValue), which is what dashboard/report revenue figures
 * actually read from.
 */
export async function createLead(patch: LeadFormPatch) {
  const uid = firebaseAuth.currentUser?.uid ?? null;
  await addDoc(collection(db, LEADS_COLLECTION), {
    business: patch.business,
    contactPerson: patch.contactPerson,
    role: patch.role,
    phone: patch.phone,
    email: patch.email,
    industry: patch.industry,
    location: patch.location,
    serviceId: patch.serviceId,
    source: patch.source,
    assignedAgentUid: null,
    status: "New",
    createdAt: serverTimestamp(),
    createdBy: uid,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
    deletedAt: null,
  });
}

export async function updateOwnLeadStatus(leadId: string, status: LeadStatus) {
  await updateDoc(doc(db, LEADS_COLLECTION, leadId), {
    status,
    updatedAt: serverTimestamp(),
    updatedBy: firebaseAuth.currentUser?.uid ?? null,
  });
}

/** Direct client write — allowed by firestore.rules for admin or the owning agent. */
export async function addLeadNote(leadId: string, body: string, authorName: string) {
  await addDoc(collection(db, LEADS_COLLECTION, leadId, "notes"), {
    author: authorName,
    authorUid: firebaseAuth.currentUser?.uid ?? null,
    createdAt: serverTimestamp(),
    body,
  });
}
