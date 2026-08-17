import { useQuery } from "@tanstack/react-query";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";

import { db } from "./firebase";
import { firebaseAuth, getMockStaffProfile } from "./auth";
import { notifications as mockNotifications } from "./mock-data";

export interface AppNotification {
  id: string;
  title: string;
  detail: string;
  at: string;
  read: boolean;
  tone: "info" | "success" | "warning";
}

const NOTIFICATIONS_COLLECTION = "notifications";

function mapNotificationDoc(id: string, data: DocumentData): AppNotification {
  return {
    id,
    title: data.title,
    detail: data.detail,
    at: data.at instanceof Timestamp ? data.at.toDate().toISOString() : new Date().toISOString(),
    read: Boolean(data.read),
    tone: data.tone ?? "info",
  };
}

/** Real per-user notifications — written by Cloud Functions (bulkAssignLeads, setDealPayment, logCall, the overdue-follow-up schedule). */
export function useMyNotifications() {
  const uid = firebaseAuth.currentUser?.uid ?? (getMockStaffProfile() ? "mock-agent" : undefined);
  return useQuery({
    queryKey: ["notifications", "mine", uid],
    queryFn: async () => {
      if (getMockStaffProfile()) return mockNotifications;
      const snap = await getDocs(
        query(
          collection(db, NOTIFICATIONS_COLLECTION),
          where("recipientUid", "==", uid),
          orderBy("at", "desc"),
        ),
      );
      return snap.docs.map((d) => mapNotificationDoc(d.id, d.data()));
    },
    enabled: Boolean(uid),
  });
}

/** Direct write — firestore.rules lets a recipient update only the `read` field on their own notification. */
export async function markNotificationRead(id: string) {
  await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, id), { read: true });
}

export async function markAllNotificationsRead(unreadIds: string[]) {
  await Promise.all(unreadIds.map((id) => markNotificationRead(id)));
}
