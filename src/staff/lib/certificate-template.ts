import { useQuery } from "@tanstack/react-query";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@staff/lib/firebase";
import { firebaseAuth, getMockStaffProfile } from "@staff/lib/auth";
import defaultCertificateImage from "@/assets/certificate-template.webp";

// Single shared, admin-uploaded background image for the Sales Agent
// Academy completion certificate (agent.scripts.tsx). Mirrors the
// settings/certificateTemplate doc written by uploadCertificateTemplate()
// below — see firestore.rules and storage.rules for the read/write rules.
export interface CertificateTemplate {
  imageUrl: string;
  /** True when this is the bundled default asset, not an admin upload. */
  isDefault: boolean;
}

// The real EmpirialDesigns "Certified Sales Professional" design, bundled
// into the app so agents get a proper certificate even before any admin
// uploads a custom background. Its known layout (1492×1054) is what
// CERTIFICATE_NAME_LAYOUT/CERTIFICATE_DATE_LAYOUT in agent.scripts.tsx are
// calibrated against — an admin-uploaded replacement with a different
// layout would need those recalibrated too.
export const DEFAULT_CERTIFICATE_TEMPLATE: CertificateTemplate = {
  imageUrl: defaultCertificateImage,
  isDefault: true,
};

// Same query shape as useOwnProfile() in -admin-dashboard/use-dashboard-data.ts:
// a single-doc getDoc, always resolving to a real template — the bundled
// default when nothing's been uploaded (including mock/demo mode, so the
// certificate looks right there too), an admin's upload otherwise.
export function useCertificateTemplate() {
  return useQuery({
    queryKey: ["settings", "certificateTemplate"],
    queryFn: async (): Promise<CertificateTemplate> => {
      if (getMockStaffProfile()) return DEFAULT_CERTIFICATE_TEMPLATE;
      const snap = await getDoc(doc(db, "settings", "certificateTemplate"));
      if (!snap.exists()) return DEFAULT_CERTIFICATE_TEMPLATE;
      const data = snap.data();
      const imageUrl = data.imageUrl as string | undefined;
      return imageUrl ? { imageUrl, isDefault: false } : DEFAULT_CERTIFICATE_TEMPLATE;
    },
  });
}

// Always uploads to a fixed Storage path (no extension) so re-uploads
// overwrite the same object and every reader resolves the same download
// URL shape — the file's content-type is preserved by uploadBytes from the
// File object itself, so this doesn't need an extension to be viewable.
export async function uploadCertificateTemplate(file: File): Promise<string> {
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in to upload a certificate template");
  const storageRef = ref(storage, "certificateTemplate/background");
  await uploadBytes(storageRef, file);
  const imageUrl = await getDownloadURL(storageRef);
  await setDoc(doc(db, "settings", "certificateTemplate"), {
    imageUrl,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });
  return imageUrl;
}
