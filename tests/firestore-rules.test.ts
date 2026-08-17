/**
 * Emulator-based tests for firestore.rules — proves the security rules
 * themselves reject/allow what they're supposed to, independent of any UI
 * or Cloud Function code. Run via `npm run test:rules`, which wraps this in
 * `firebase emulators:exec --only firestore` (needs a local JRE — see
 * README/CLAUDE.md).
 *
 * Coverage here is deliberately aimed at the highest-value gaps flagged in
 * docs/MVP_REVIEW_STAFF_PORTAL_2026-08-15.md: an agent must never be able
 * to read another agent's leads, must never be able to touch a lead's
 * commission-relevant fields directly, and deals/auditLog must stay fully
 * server-owned. This is a down payment on rules coverage, not exhaustive —
 * it does not yet cover every collection in firestore.rules (services,
 * scripts, salesTrainingLessons, callLogs, the AI-builder's user_repos
 * tree, etc.).
 */
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

let testEnv: RulesTestEnvironment;

const ADMIN_UID = "admin-1";
const AGENT_A_UID = "agent-a";
const AGENT_B_UID = "agent-b";

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "empirialdesigns-rules-test",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

/** Seeds fixture data as a trusted admin context (bypasses rules for setup writes). */
async function seed(fn: (db: import("firebase/firestore").Firestore) => Promise<void>) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await fn(ctx.firestore());
  });
}

function asAdmin() {
  return testEnv.authenticatedContext(ADMIN_UID, { role: "admin" }).firestore();
}
function asAgent(uid: string) {
  return testEnv.authenticatedContext(uid, { role: "agent" }).firestore();
}
function asAnon() {
  return testEnv.unauthenticatedContext().firestore();
}

describe("leads/{leadId} — row-level security", () => {
  const leadOwnedByA = { id: "lead-1", assignedAgentUid: AGENT_A_UID, business: "A's Lead", value: 1000, status: "New" };

  beforeEach(async () => {
    await seed(async (db) => {
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "leads", leadOwnedByA.id), leadOwnedByA);
    });
  });

  it("denies a signed-out user reading any lead", async () => {
    const { doc, getDoc } = await import("firebase/firestore");
    await assertFails(getDoc(doc(asAnon(), "leads", leadOwnedByA.id)));
  });

  it("lets the owning agent read their own lead", async () => {
    const { doc, getDoc } = await import("firebase/firestore");
    await assertSucceeds(getDoc(doc(asAgent(AGENT_A_UID), "leads", leadOwnedByA.id)));
  });

  it("denies a different agent reading a lead they don't own — the core row-level-security guarantee", async () => {
    const { doc, getDoc } = await import("firebase/firestore");
    await assertFails(getDoc(doc(asAgent(AGENT_B_UID), "leads", leadOwnedByA.id)));
  });

  it("lets admin read any lead regardless of assignment", async () => {
    const { doc, getDoc } = await import("firebase/firestore");
    await assertSucceeds(getDoc(doc(asAdmin(), "leads", leadOwnedByA.id)));
  });

  it("lets the owning agent update an allowed field (status)", async () => {
    const { doc, updateDoc } = await import("firebase/firestore");
    await assertSucceeds(
      updateDoc(doc(asAgent(AGENT_A_UID), "leads", leadOwnedByA.id), { status: "Called" }),
    );
  });

  it("denies the owning agent updating a commission-relevant field (value) directly", async () => {
    const { doc, updateDoc } = await import("firebase/firestore");
    await assertFails(
      updateDoc(doc(asAgent(AGENT_A_UID), "leads", leadOwnedByA.id), { value: 999999 }),
    );
  });

  it("denies the owning agent reassigning the lead to a different agent directly", async () => {
    const { doc, updateDoc } = await import("firebase/firestore");
    await assertFails(
      updateDoc(doc(asAgent(AGENT_A_UID), "leads", leadOwnedByA.id), { assignedAgentUid: AGENT_B_UID }),
    );
  });

  it("denies a non-owning agent updating even an allowed field on someone else's lead", async () => {
    const { doc, updateDoc } = await import("firebase/firestore");
    await assertFails(
      updateDoc(doc(asAgent(AGENT_B_UID), "leads", leadOwnedByA.id), { status: "Called" }),
    );
  });

  it("denies any client-side hard delete, even for admin", async () => {
    const { doc, deleteDoc } = await import("firebase/firestore");
    await assertFails(deleteDoc(doc(asAdmin(), "leads", leadOwnedByA.id)));
  });

  it("denies a non-admin creating a lead directly", async () => {
    const { doc, setDoc } = await import("firebase/firestore");
    await assertFails(
      setDoc(doc(asAgent(AGENT_A_UID), "leads", "new-lead"), { assignedAgentUid: AGENT_A_UID, business: "Sneaky" }),
    );
  });
});

describe("deals/{dealId} — fully Cloud-Functions-owned", () => {
  const deal = { id: "deal-1", agentUid: AGENT_A_UID, commission: 500, value: 5000, business: "A's Deal" };

  beforeEach(async () => {
    await seed(async (db) => {
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "deals", deal.id), deal);
    });
  });

  it("lets the owning agent read their own deal", async () => {
    const { doc, getDoc } = await import("firebase/firestore");
    await assertSucceeds(getDoc(doc(asAgent(AGENT_A_UID), "deals", deal.id)));
  });

  it("denies a different agent reading someone else's deal", async () => {
    const { doc, getDoc } = await import("firebase/firestore");
    await assertFails(getDoc(doc(asAgent(AGENT_B_UID), "deals", deal.id)));
  });

  it("denies any client write, including the owning agent trying to bump their own commission", async () => {
    const { doc, updateDoc } = await import("firebase/firestore");
    await assertFails(updateDoc(doc(asAgent(AGENT_A_UID), "deals", deal.id), { commission: 999999 }));
  });

  it("denies admin writing a deal directly too — commission math must only ever come from setDealPayment()/logCall()", async () => {
    const { doc, updateDoc } = await import("firebase/firestore");
    await assertFails(updateDoc(doc(asAdmin(), "deals", deal.id), { paymentStatus: "Paid" }));
  });
});

describe("auditLog/{entryId} — admin read-only, Cloud-Functions-only write", () => {
  beforeEach(async () => {
    await seed(async (db) => {
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "auditLog", "entry-1"), { action: "leads.logCall", actorUid: AGENT_A_UID });
    });
  });

  it("lets admin read audit entries", async () => {
    const { doc, getDoc } = await import("firebase/firestore");
    await assertSucceeds(getDoc(doc(asAdmin(), "auditLog", "entry-1")));
  });

  it("denies an agent reading audit entries, including their own actions", async () => {
    const { doc, getDoc } = await import("firebase/firestore");
    await assertFails(getDoc(doc(asAgent(AGENT_A_UID), "auditLog", "entry-1")));
  });

  it("denies any client write, admin included", async () => {
    const { doc, setDoc } = await import("firebase/firestore");
    await assertFails(setDoc(doc(asAdmin(), "auditLog", "entry-2"), { action: "fake" }));
  });
});

describe("notifications/{notificationId} — recipient may only flip their own `read` field", () => {
  const notif = { id: "notif-1", recipientUid: AGENT_A_UID, title: "Test", read: false };

  beforeEach(async () => {
    await seed(async (db) => {
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "notifications", notif.id), notif);
    });
  });

  it("lets the recipient mark their own notification read", async () => {
    const { doc, updateDoc } = await import("firebase/firestore");
    await assertSucceeds(updateDoc(doc(asAgent(AGENT_A_UID), "notifications", notif.id), { read: true }));
  });

  it("denies a different agent reading or touching someone else's notification", async () => {
    const { doc, getDoc, updateDoc } = await import("firebase/firestore");
    await assertFails(getDoc(doc(asAgent(AGENT_B_UID), "notifications", notif.id)));
    await assertFails(updateDoc(doc(asAgent(AGENT_B_UID), "notifications", notif.id), { read: true }));
  });

  it("denies the recipient changing any field other than `read`", async () => {
    const { doc, updateDoc } = await import("firebase/firestore");
    await assertFails(updateDoc(doc(asAgent(AGENT_A_UID), "notifications", notif.id), { title: "Hijacked" }));
  });

  it("denies client-side creation of a notification (Cloud-Functions-only)", async () => {
    const { doc, setDoc } = await import("firebase/firestore");
    await assertFails(
      setDoc(doc(asAgent(AGENT_A_UID), "notifications", "fake-notif"), {
        recipientUid: AGENT_A_UID,
        title: "Self-sent",
        read: false,
      }),
    );
  });
});

describe("quotes/{quoteId} — Cloud-Functions-owned, agent-scoped read", () => {
  const quote = { id: "quote-1", leadId: "lead-1", agentUid: AGENT_A_UID, total: 3500, status: "Sent" };

  beforeEach(async () => {
    await seed(async (db) => {
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "quotes", quote.id), quote);
    });
  });

  it("lets the creating agent read their own quote", async () => {
    const { doc, getDoc } = await import("firebase/firestore");
    await assertSucceeds(getDoc(doc(asAgent(AGENT_A_UID), "quotes", quote.id)));
  });

  it("denies a different agent reading someone else's quote", async () => {
    const { doc, getDoc } = await import("firebase/firestore");
    await assertFails(getDoc(doc(asAgent(AGENT_B_UID), "quotes", quote.id)));
  });

  it("denies any client write, including the creating agent", async () => {
    const { doc, setDoc, updateDoc } = await import("firebase/firestore");
    await assertFails(updateDoc(doc(asAgent(AGENT_A_UID), "quotes", quote.id), { total: 1 }));
    await assertFails(
      setDoc(doc(asAgent(AGENT_A_UID), "quotes", "fake-quote"), { leadId: "lead-1", agentUid: AGENT_A_UID, total: 1 }),
    );
  });
});

describe("user_repos/{repoId} — AI builder ownership (the other half of the same Firestore instance)", () => {
  const OWNER_UID = "builder-user-1";
  const OTHER_UID = "builder-user-2";
  const repo = { id: "repo-1", user_id: OWNER_UID, name: "My Site" };

  beforeEach(async () => {
    await seed(async (db) => {
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "user_repos", repo.id), repo);
    });
  });

  it("lets the owner read their own repo", async () => {
    const { doc, getDoc } = await import("firebase/firestore");
    const ctx = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertSucceeds(getDoc(doc(ctx, "user_repos", repo.id)));
  });

  it("denies a different signed-in user reading someone else's repo", async () => {
    const { doc, getDoc } = await import("firebase/firestore");
    const ctx = testEnv.authenticatedContext(OTHER_UID).firestore();
    await assertFails(getDoc(doc(ctx, "user_repos", repo.id)));
  });

  it("denies creating a repo doc under someone else's user_id", async () => {
    const { doc, setDoc } = await import("firebase/firestore");
    const ctx = testEnv.authenticatedContext(OTHER_UID).firestore();
    await assertFails(setDoc(doc(ctx, "user_repos", "sneaky-repo"), { user_id: OWNER_UID, name: "Stolen" }));
  });
});

describe("deny-by-default catch-all", () => {
  it("denies read/write on any collection not explicitly listed in firestore.rules", async () => {
    const { doc, getDoc, setDoc } = await import("firebase/firestore");
    await assertFails(getDoc(doc(asAdmin(), "somethingUnlisted", "x")));
    await assertFails(setDoc(doc(asAdmin(), "somethingUnlisted", "x"), { a: 1 }));
  });
});
