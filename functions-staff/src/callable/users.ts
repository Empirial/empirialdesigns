import { randomBytes } from "node:crypto";

import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

import { auth, db } from "../lib/admin";
import { requireAdmin, type AppRole } from "../lib/authz";
import { writeAuditLog } from "../lib/audit";

function randomTempPassword(): string {
  // One-time password shown once to the inviting admin to hand off manually.
  // No email-sending infrastructure exists yet (see docs/phase-8-deferred-stubs.html
  // "Settings > Integrations") — real invite emails are a documented future upgrade.
  return randomBytes(9).toString("base64url");
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]!.toUpperCase())
    .join("");
}

type AgentJobTitle = "Sales Agent" | "Senior Agent" | "Team Lead";

interface InviteUserInput {
  email: string;
  displayName: string;
  role: AppRole;
  // Only used when role === "agent" — optional overrides for the
  // agents/{uid} doc, so the "+ Add Agent" dialog's fields (previously
  // captured in local state but never actually saved, see
  // docs/phase-2-leads-security-rules.html) actually take effect.
  phone?: string;
  jobTitle?: AgentJobTitle;
  monthlyTarget?: number;
  targetDeals?: number;
  commissionRateOverride?: number;
}

/**
 * Replaces the local-only "Invite user" dialog in admin.settings.tsx and the
 * "+ Add Agent" dialog in admin.agents.index.tsx. Creates a real Firebase
 * Auth account directly (no email step), sets the role custom claim, and
 * writes staffUsers/{uid} (+ agents/{uid} if role is "agent"). Returns the
 * temporary password once — the caller is responsible for showing it to the
 * admin so they can hand it to the new hire.
 */
export const inviteUser = onCall<InviteUserInput>(async (request) => {
  const { uid: adminUid } = requireAdmin(request);
  const {
    email,
    displayName,
    role,
    phone,
    jobTitle,
    monthlyTarget,
    targetDeals,
    commissionRateOverride,
  } = request.data ?? ({} as InviteUserInput);

  if (!email || typeof email !== "string") {
    throw new HttpsError("invalid-argument", "email is required.");
  }
  if (!displayName || typeof displayName !== "string") {
    throw new HttpsError("invalid-argument", "displayName is required.");
  }
  if (role !== "admin" && role !== "agent") {
    throw new HttpsError("invalid-argument", "role must be 'admin' or 'agent'.");
  }

  try {
    await auth.getUserByEmail(email);
    throw new HttpsError("already-exists", "An account with that email already exists.");
  } catch (err) {
    if (!(err instanceof Error) || (err as { code?: string }).code !== "auth/user-not-found") {
      throw err;
    }
  }

  // onUserCreate (triggers/onUserCreate.ts) auto-disables every Auth account
  // created after the first admin, since a stray public signup has no
  // legitimate way to exist. auth.createUser() below fires that same trigger
  // for *this* account too — it can't otherwise tell "admin just invited
  // this person" apart from a stranger self-registering. Writing this marker
  // first (before the account exists, so the trigger can never fire before
  // it does) is what lets it recognize a real invite and skip disabling.
  const emailKey = email.trim().toLowerCase();
  await db.doc(`staffInvites/${emailKey}`).set({ role, invitedBy: adminUid, createdAt: FieldValue.serverTimestamp() });

  const tempPassword = randomTempPassword();
  let userRecord;
  try {
    userRecord = await auth.createUser({ email, password: tempPassword, displayName });
  } catch (err) {
    await db.doc(`staffInvites/${emailKey}`).delete().catch(() => undefined);
    throw err;
  }
  const uid = userRecord.uid;

  await auth.setCustomUserClaims(uid, { role });

  const batch = db.batch();
  const now = FieldValue.serverTimestamp();

  batch.set(db.doc(`staffUsers/${uid}`), {
    uid,
    email,
    displayName,
    role,
    agentId: role === "agent" ? uid : null,
    status: "active",
    invitedBy: adminUid,
    notificationPrefs: {},
    createdAt: now,
  });

  if (role === "agent") {
    batch.set(db.doc(`agents/${uid}`), {
      uid,
      name: displayName,
      initials: initialsOf(displayName),
      email,
      phone: phone ?? "",
      role: jobTitle ?? "Sales Agent",
      status: "Active",
      joinedAt: now,
      monthlyTarget: monthlyTarget ?? 30000,
      targetDeals: targetDeals ?? 7,
      commissionRateOverride: commissionRateOverride ?? null,
      callsToday: 0,
      callsThisWeek: [0, 0, 0, 0, 0, 0, 0],
    });
  }

  writeAuditLog(batch, {
    actorUid: adminUid,
    action: "users.invite",
    targetCollection: "staffUsers",
    targetId: uid,
    after: { email, displayName, role },
  });

  await batch.commit();

  return { uid, email, tempPassword };
});

interface ChangeUserRoleInput {
  uid: string;
  role: AppRole;
}

export const changeUserRole = onCall<ChangeUserRoleInput>(async (request) => {
  const { uid: adminUid } = requireAdmin(request);
  const { uid, role } = request.data ?? ({} as ChangeUserRoleInput);

  if (!uid || typeof uid !== "string") {
    throw new HttpsError("invalid-argument", "uid is required.");
  }
  if (role !== "admin" && role !== "agent") {
    throw new HttpsError("invalid-argument", "role must be 'admin' or 'agent'.");
  }

  const userRef = db.doc(`staffUsers/${uid}`);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new HttpsError("not-found", "User not found.");
  }
  const previousRole = userSnap.data()?.role as AppRole | undefined;

  await auth.setCustomUserClaims(uid, { role });

  const batch = db.batch();
  batch.update(userRef, { role, agentId: role === "agent" ? uid : null });

  if (role === "agent") {
    const agentSnap = await db.doc(`agents/${uid}`).get();
    if (!agentSnap.exists) {
      const profile = userSnap.data()!;
      batch.set(db.doc(`agents/${uid}`), {
        uid,
        name: profile.displayName ?? profile.email,
        initials: initialsOf(profile.displayName ?? profile.email ?? "??"),
        email: profile.email,
        phone: "",
        role: "Sales Agent",
        status: "Active",
        joinedAt: FieldValue.serverTimestamp(),
        monthlyTarget: 30000,
        targetDeals: 7,
        commissionRateOverride: null,
        callsToday: 0,
        callsThisWeek: [0, 0, 0, 0, 0, 0, 0],
      });
    }
  }

  writeAuditLog(batch, {
    actorUid: adminUid,
    action: "users.changeRole",
    targetCollection: "staffUsers",
    targetId: uid,
    before: { role: previousRole ?? null },
    after: { role },
  });

  await batch.commit();
  return { uid, role };
});

interface RemoveUserInput {
  uid: string;
}

/**
 * Disables the Firebase Auth account and revokes the role claim rather than
 * hard-deleting — reversible, and keeps their name attached to historical
 * leads/deals/audit entries instead of leaving dangling references.
 */
export const removeUser = onCall<RemoveUserInput>(async (request) => {
  const { uid: adminUid } = requireAdmin(request);
  const { uid } = request.data ?? ({} as RemoveUserInput);

  if (!uid || typeof uid !== "string") {
    throw new HttpsError("invalid-argument", "uid is required.");
  }
  if (uid === adminUid) {
    throw new HttpsError("failed-precondition", "You can't remove your own account.");
  }

  const userRef = db.doc(`staffUsers/${uid}`);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new HttpsError("not-found", "User not found.");
  }

  await auth.updateUser(uid, { disabled: true });
  await auth.setCustomUserClaims(uid, { role: null });

  const batch = db.batch();
  batch.update(userRef, { status: "removed" });

  // Also flip agents/{uid}.status so the Agents list (which reads that
  // collection, not staffUsers) doesn't keep showing a removed agent as
  // "Active" — only relevant when this user actually had an agent doc.
  const agentSnap = await db.doc(`agents/${uid}`).get();
  if (agentSnap.exists) {
    batch.update(agentSnap.ref, { status: "Inactive" });
  }

  writeAuditLog(batch, {
    actorUid: adminUid,
    action: "users.remove",
    targetCollection: "staffUsers",
    targetId: uid,
  });
  await batch.commit();

  return { uid };
});

interface ResetUserPasswordInput {
  uid: string;
}

/**
 * Admin-triggered password reset for an existing agent/admin — generates a
 * fresh one-time temp password (same shape as inviteUser's), shown once to
 * the admin to hand off manually. No email-sending infrastructure exists
 * yet, same caveat as inviteUser above.
 */
export const resetUserPassword = onCall<ResetUserPasswordInput>(async (request) => {
  const { uid: adminUid } = requireAdmin(request);
  const { uid } = request.data ?? ({} as ResetUserPasswordInput);

  if (!uid || typeof uid !== "string") {
    throw new HttpsError("invalid-argument", "uid is required.");
  }

  const userRef = db.doc(`staffUsers/${uid}`);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new HttpsError("not-found", "User not found.");
  }
  const email = userSnap.data()?.email as string | undefined;
  if (!email) {
    throw new HttpsError("failed-precondition", "This user has no email on file.");
  }

  const tempPassword = randomTempPassword();
  await auth.updateUser(uid, { password: tempPassword });

  const batch = db.batch();
  writeAuditLog(batch, {
    actorUid: adminUid,
    action: "users.resetPassword",
    targetCollection: "staffUsers",
    targetId: uid,
  });
  await batch.commit();

  return { uid, email, tempPassword };
});
