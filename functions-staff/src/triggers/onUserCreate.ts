import { FieldValue } from "firebase-admin/firestore";
// Auth `onCreate` triggers are a 1st-gen-only feature — 2nd-gen (firebase-functions/v2)
// does not support them, so this one function stays on the v1 SDK deliberately.
import * as functionsV1 from "firebase-functions/v1";

import { auth, db } from "../lib/admin";

/**
 * Fires whenever a new Firebase Auth account is created.
 *
 * Bootstrap rule: the very first person to sign up becomes admin (tracked via
 * an atomic transaction against meta/public.adminBootstrapped, so concurrent
 * first signups can't both win).
 *
 * After bootstrap, the only legitimate way for a new account to appear is
 * through inviteUser (callable/users.ts) — an admin acting on someone else's
 * behalf via the Admin SDK, which fires this same onCreate trigger for the
 * account it makes. inviteUser writes a staffInvites/{email} marker *before*
 * calling auth.createUser(), so by the time this trigger can possibly run,
 * the marker already exists — that ordering (not a retry/delay) is what
 * makes the check below race-free. Any other new account — a stray public
 * signup, or someone's first-ever Google sign-in on the /staff login page —
 * has no matching marker and no legitimate way to exist, so it's disabled
 * immediately rather than left as an ownerless, roleless account.
 */
export const onUserCreate = functionsV1.auth.user().onCreate(async (user) => {
  const metaRef = db.doc("meta/public");
  const userRef = db.doc(`staffUsers/${user.uid}`);

  const becameAdmin = await db.runTransaction(async (tx) => {
    const metaSnap = await tx.get(metaRef);
    const alreadyBootstrapped = metaSnap.exists && metaSnap.data()?.adminBootstrapped === true;

    if (alreadyBootstrapped) {
      return false;
    }

    tx.set(metaRef, { adminBootstrapped: true }, { merge: true });
    tx.set(userRef, {
      uid: user.uid,
      email: user.email ?? null,
      displayName: user.displayName ?? user.email ?? "Admin",
      role: "admin",
      agentId: null,
      status: "active",
      invitedBy: null,
      notificationPrefs: {},
      createdAt: FieldValue.serverTimestamp(),
    });

    return true;
  });

  if (becameAdmin) {
    await auth.setCustomUserClaims(user.uid, { role: "admin" });
    return;
  }

  if (user.email) {
    const inviteRef = db.doc(`staffInvites/${user.email.trim().toLowerCase()}`);
    const inviteSnap = await inviteRef.get();
    if (inviteSnap.exists) {
      // inviteUser already set the role claim and wrote staffUsers/{uid}
      // itself — this trigger's only remaining job for an invited account is
      // to leave it enabled and clean up the marker so it can't be reused.
      await inviteRef.delete();
      return;
    }
  }

  await auth.updateUser(user.uid, { disabled: true });
});
