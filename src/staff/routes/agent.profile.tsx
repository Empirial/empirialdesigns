import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Landmark, User } from "lucide-react";
import { AppShell } from "@staff/components/layout/app-shell";
import { PageHeader } from "@staff/components/shared/page-header";
import { SectionCard } from "@staff/components/shared/section-card";
import { Button } from "@staff/components/ui/button";
import { Input } from "@staff/components/ui/input";
import { Label } from "@staff/components/ui/label";
import { useAgentDoc, updateOwnBankingDetails } from "@staff/lib/agents-data";
import { firebaseAuth, getMockStaffProfile } from "@staff/lib/auth";

export const Route = createFileRoute("/agent/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — Empirial CRM" },
      { name: "description", content: "Your agent profile and payout banking details." },
      { property: "og:title", content: "My Profile — Empirial CRM" },
      { property: "og:description", content: "Your agent profile and payout banking details." },
    ],
  }),
  component: PageAgentProfile,
});

function PageAgentProfile() {
  const mockProfile = getMockStaffProfile();
  const myUid = firebaseAuth.currentUser?.uid ?? (mockProfile ? "ag-1" : undefined);
  const { data: agent, isLoading } = useAgentDoc(myUid);
  const queryClient = useQueryClient();

  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [saving, setSaving] = useState(false);

  // Seed the form once the agent doc loads — a plain useEffect, not
  // per-keystroke sync, so typing isn't fought by refetches.
  useEffect(() => {
    if (!agent) return;
    setBankName(agent.bankName ?? "");
    setAccountNumber(agent.accountNumber ?? "");
    setBranchCode(agent.branchCode ?? "");
  }, [agent]);

  async function handleSave() {
    setSaving(true);
    try {
      await updateOwnBankingDetails({
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        branchCode: branchCode.trim(),
      });
      await queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Banking details saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save your banking details — try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="My Profile"
        subtitle="Your account details and payout banking information."
        crumbs={[{ label: "Agent", to: "/agent/dashboard" }, { label: "My Profile" }]}
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <SectionCard title="Account">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <User className="size-4" /> Read-only — contact your admin to change these
          </div>
          {isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={agent?.name ?? ""} disabled />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={agent?.email ?? ""} disabled />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={agent?.phone ?? ""} disabled />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Input value={agent?.role ?? ""} disabled />
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Payout banking details">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Landmark className="size-4" /> Used by admin to pay out your approved commissions
          </div>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="bank-name">Bank name</Label>
              <Input
                id="bank-name"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. Capitec, FNB, Standard Bank"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="account-number">Account number</Label>
              <Input
                id="account-number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. 1234567890"
                inputMode="numeric"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="branch-code">Branch code</Label>
              <Input
                id="branch-code"
                value={branchCode}
                onChange={(e) => setBranchCode(e.target.value)}
                placeholder="e.g. 470010 (universal branch code if unsure)"
                inputMode="numeric"
              />
            </div>
            {mockProfile ? (
              <p className="text-xs text-muted-foreground">Saving is disabled in demo mode.</p>
            ) : null}
            <Button onClick={handleSave} disabled={saving || Boolean(mockProfile)}>
              {saving ? "Saving…" : "Save banking details"}
            </Button>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
