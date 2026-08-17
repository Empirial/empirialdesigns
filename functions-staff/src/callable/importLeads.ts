import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

import { db } from "../lib/admin";
import { requireAdmin } from "../lib/authz";
import { writeAuditLog } from "../lib/audit";

const MAX_ROWS = 200;

interface ImportRow {
  business: string;
  contactPerson?: string;
  role?: string;
  phone?: string;
  email?: string;
  industry?: string;
  location?: string;
  value?: number;
  source?: string;
}

interface ImportLeadsInput {
  rows: ImportRow[];
}

interface ImportLeadsResult {
  imported: number;
  skippedDuplicates: number;
  errors: { index: number; reason: string }[];
}

/**
 * Replaces admin.import.tsx's fake pipeline (previously: hardcoded MOCK_ROWS,
 * no real parsing, a loop of client-side addLead() calls). The client is
 * responsible for parsing the file/paste and applying the column mapping
 * (see src/lib/csv.ts) — this function does the part that must not be
 * client-trusted: real dedup against existing leads (by phone/email) and
 * the actual bulk write, all in one batch with one audit-log entry.
 */
export const importLeads = onCall<ImportLeadsInput>(async (request) => {
  const { uid } = requireAdmin(request);
  const rows = request.data?.rows;

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new HttpsError("invalid-argument", "rows must be a non-empty array.");
  }
  if (rows.length > MAX_ROWS) {
    throw new HttpsError("invalid-argument", `Import at most ${MAX_ROWS} rows at a time.`);
  }

  // Dedup against every existing lead's phone/email. Reading the full
  // collection is fine at small-business scale; if this ever needs to scale
  // further, this is the first place to add pagination/indexed lookups.
  const existingSnap = await db.collection("leads").select("phone", "email").get();
  const existingPhones = new Set(
    existingSnap.docs.map((d) => ((d.data().phone as string) ?? "").replace(/\D/g, "")).filter(Boolean),
  );
  const existingEmails = new Set(
    existingSnap.docs.map((d) => ((d.data().email as string) ?? "").toLowerCase()).filter(Boolean),
  );

  const batch = db.batch();
  const now = FieldValue.serverTimestamp();
  const seenPhones = new Set<string>();
  const seenEmails = new Set<string>();

  let imported = 0;
  let skippedDuplicates = 0;
  const errors: ImportLeadsResult["errors"] = [];

  rows.forEach((row, index) => {
    if (!row?.business || typeof row.business !== "string" || !row.business.trim()) {
      errors.push({ index, reason: "Missing business name" });
      return;
    }

    const phoneDigits = (row.phone ?? "").replace(/\D/g, "");
    const emailLower = (row.email ?? "").toLowerCase();
    const isDuplicate =
      (phoneDigits.length > 0 && (existingPhones.has(phoneDigits) || seenPhones.has(phoneDigits))) ||
      (emailLower.length > 0 && (existingEmails.has(emailLower) || seenEmails.has(emailLower)));

    if (isDuplicate) {
      skippedDuplicates++;
      return;
    }
    if (phoneDigits) seenPhones.add(phoneDigits);
    if (emailLower) seenEmails.add(emailLower);

    const leadRef = db.collection("leads").doc();
    batch.set(leadRef, {
      business: row.business.trim(),
      contactPerson: row.contactPerson || "Reception",
      role: row.role || "Owner",
      phone: row.phone || "",
      email: row.email || "",
      website: null,
      industry: row.industry || "Retail",
      location: row.location || "Thohoyandou",
      address: "",
      serviceId: null,
      assignedAgentUid: null,
      status: "New",
      value: typeof row.value === "number" && row.value > 0 ? row.value : 3500,
      source: row.source || "Cold List",
      lastContact: null,
      nextFollowUp: null,
      createdAt: now,
      createdBy: uid,
      updatedAt: now,
      updatedBy: uid,
      lostReason: null,
      deletedAt: null,
    });
    batch.set(leadRef.collection("activities").doc(), {
      type: "note",
      title: "Lead imported",
      detail: `Source: ${row.source || "Cold List"} (bulk import)`,
      actor: "Import",
      actorUid: uid,
      at: now,
    });
    imported++;
  });

  if (imported > 0) {
    writeAuditLog(batch, {
      actorUid: uid,
      action: "leads.bulkImport",
      targetCollection: "leads",
      targetId: `import-${Date.now()}`,
      after: { imported, skippedDuplicates, errorCount: errors.length },
    });
    await batch.commit();
  }

  return { imported, skippedDuplicates, errors } satisfies ImportLeadsResult;
});
