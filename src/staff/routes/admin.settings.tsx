import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { collection, getDocs, orderBy, query, limit as fbLimit, Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { AppShell } from "@staff/components/layout/app-shell";
import { PageHeader } from "@staff/components/shared/page-header";
import { SectionCard } from "@staff/components/shared/section-card";
import { Pill } from "@staff/components/shared/status-badge";
import { Button } from "@staff/components/ui/button";
import { Input } from "@staff/components/ui/input";
import { Label } from "@staff/components/ui/label";
import { Switch } from "@staff/components/ui/switch";
import { Checkbox } from "@staff/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@staff/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@staff/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@staff/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@staff/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@staff/components/ui/table";
import {
  Building2,
  Users,
  Percent,
  ListChecks,
  Bell,
  Plug,
  ShieldCheck,
  Mail,
  MessageCircle,
  Calendar,
  CreditCard,
  Copy,
} from "lucide-react";
import { services as seedServices } from "@staff/lib/mock-data";
import { formatDateTime } from "@staff/lib/format";
import { cn } from "@staff/lib/utils";
import { db } from "@staff/lib/firebase";
import { callChangeUserRole, callInviteUser, callRemoveUser } from "@staff/lib/functions";
import type { AppRole } from "@staff/lib/auth";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Meridian CRM" },
      { name: "description", content: "Configure company profile, users, commissions, leads and integrations." },
      { property: "og:title", content: "Settings — Meridian CRM" },
      { property: "og:description", content: "Configure company profile, users, commissions, leads and integrations." },
    ],
  }),
  component: PageAdminSettings,
});

const SECTIONS = [
  { id: "company", label: "Company Profile", icon: Building2 },
  { id: "users", label: "Users & Roles", icon: Users },
  { id: "commissions", label: "Commission Rules", icon: Percent },
  { id: "leads", label: "Lead Settings", icon: ListChecks },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "security", label: "Security", icon: ShieldCheck },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function PageAdminSettings() {
  const [section, setSection] = useState<SectionId>("company");

  return (
    <AppShell>
      <PageHeader
        title="Settings"
        subtitle="Configure Meridian CRM to match your team's workflow."
        crumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Settings" }]}
      />
      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="surface-card h-fit p-2 lg:sticky lg:top-20">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                section === s.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <s.icon className="size-4 shrink-0" />
              {s.label}
            </button>
          ))}
        </nav>
        <div className="min-w-0">
          {section === "company" && <CompanySection />}
          {section === "users" && <UsersSection />}
          {section === "commissions" && <CommissionsSection />}
          {section === "leads" && <LeadSettingsSection />}
          {section === "notifications" && <NotificationsSection />}
          {section === "integrations" && <IntegrationsSection />}
          {section === "security" && <SecuritySection />}
        </div>
      </div>
    </AppShell>
  );
}

function CompanySection() {
  const [name, setName] = useState("Meridian Digital Solutions");
  const [email, setEmail] = useState("info@meridian.co.za");
  const [phone, setPhone] = useState("+27 15 555 0134");
  const [address, setAddress] = useState("12 Church Street, Thohoyandou, Limpopo");
  const [vat, setVat] = useState("4480123456");

  return (
    <SectionCard
      title="Company Profile"
      description="Details shown on invoices and client-facing documents."
      action={
        <Button onClick={() => toast.info("Company Profile isn't wired up yet — changes here aren't saved.")}>Save</Button>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 text-xs text-muted-foreground">
            Logo
          </div>
          <Button variant="outline" size="sm" onClick={() => toast.info("Logo upload — coming soon")}>
            Upload logo
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Company name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>VAT number</Label>
            <Input value={vat} onChange={(e) => setVat(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

interface UserRow {
  uid: string;
  displayName: string;
  email: string;
  role: AppRole;
  status: string;
}

const ROLE_LABEL: Record<AppRole, string> = { admin: "Admin", agent: "Agent" };

function useUsersList() {
  return useQuery({
    queryKey: ["staffUsers", "all"],
    queryFn: async () => {
      const snap = await getDocs(collection(db, "staffUsers"));
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          uid: d.id,
          displayName: data.displayName ?? data.email ?? "Unknown",
          email: data.email ?? "",
          role: (data.role as AppRole) ?? "agent",
          status: data.status ?? "active",
        } satisfies UserRow;
      });
    },
  });
}

function UsersSection() {
  const { data: users = [], isLoading } = useUsersList();
  const queryClient = useQueryClient();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<UserRow | null>(null);
  const [invite, setInvite] = useState({ name: "", email: "", role: "agent" as AppRole });
  const [tempPasswordResult, setTempPasswordResult] = useState<{ email: string; tempPassword: string } | null>(null);

  const refreshUsers = () => queryClient.invalidateQueries({ queryKey: ["staffUsers"] });

  const sendInvite = async () => {
    if (!invite.name.trim() || !invite.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setInviting(true);
    try {
      const result = await callInviteUser({
        email: invite.email.trim(),
        displayName: invite.name.trim(),
        role: invite.role,
      });
      refreshUsers();
      setInviteOpen(false);
      setInvite({ name: "", email: "", role: "agent" });
      setTempPasswordResult({ email: result.data.email, tempPassword: result.data.tempPassword });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send that invite — try again.");
    } finally {
      setInviting(false);
    }
  };

  const changeRole = async (u: UserRow, role: AppRole) => {
    try {
      await callChangeUserRole({ uid: u.uid, role });
      refreshUsers();
      toast.success(`${u.displayName} is now ${ROLE_LABEL[role]}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't change that role — try again.");
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    try {
      await callRemoveUser({ uid: removeTarget.uid });
      refreshUsers();
      toast.success(`${removeTarget.displayName} removed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't remove that user — try again.");
    } finally {
      setRemoveTarget(null);
    }
  };

  return (
    <SectionCard
      title="Users & Roles"
      description="Manage who has access to Meridian CRM."
      action={
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button size="sm">Invite user</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite user</DialogTitle>
              <DialogDescription>
                Creates their account directly with a temporary password — there's no email step yet, so you'll
                need to share the password with them yourself.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={invite.name} onChange={(e) => setInvite((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={invite.email} onChange={(e) => setInvite((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={invite.role} onValueChange={(v) => setInvite((f) => ({ ...f, role: v as AppRole }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={inviting}>
                Cancel
              </Button>
              <Button onClick={sendInvite} disabled={inviting}>
                {inviting ? "Sending…" : "Send invite"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
      noPadding
    >
      {isLoading ? (
        <p className="p-4 text-sm text-muted-foreground">Loading users…</p>
      ) : users.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">No users yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.uid}>
                <TableCell className="font-medium">{u.displayName}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <Select value={u.role} onValueChange={(v) => changeRole(u, v as AppRole)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setRemoveTarget(u)}>
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <AlertDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removeTarget?.displayName}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will lose access to Meridian CRM immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!tempPasswordResult} onOpenChange={(o) => !o && setTempPasswordResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Account created</DialogTitle>
            <DialogDescription>
              Share this temporary password with {tempPasswordResult?.email} — it won't be shown again. They should
              change it after signing in.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
            <code className="text-sm font-medium">{tempPasswordResult?.tempPassword}</code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (tempPasswordResult) {
                  navigator.clipboard?.writeText(tempPasswordResult.tempPassword);
                  toast.success("Copied to clipboard");
                }
              }}
            >
              <Copy className="mr-1.5 size-3.5" /> Copy
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setTempPasswordResult(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}

function CommissionsSection() {
  const [defaultCommission, setDefaultCommission] = useState(10);
  const [payoutSchedule, setPayoutSchedule] = useState("monthly");
  const [minPayout, setMinPayout] = useState(500);
  const [overrides, setOverrides] = useState(
    seedServices.map((s) => ({ id: s.id, name: s.name, rate: s.commissionValue })),
  );

  return (
    <div className="space-y-6">
      <SectionCard
        title="Commission Rules"
        description="Set defaults and payout schedule."
        action={<Button onClick={() => toast.success("Settings saved")}>Save</Button>}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Default commission (%)</Label>
            <Input
              type="number"
              value={defaultCommission}
              onChange={(e) => setDefaultCommission(Number(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Payout schedule</Label>
            <Select value={payoutSchedule} onValueChange={setPayoutSchedule}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Minimum payout (R)</Label>
            <Input type="number" value={minPayout} onChange={(e) => setMinPayout(Number(e.target.value) || 0)} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Per-service overrides" noPadding>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead className="w-40 text-right">Commission %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {overrides.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.name}</TableCell>
                <TableCell className="text-right">
                  <Input
                    type="number"
                    value={o.rate}
                    className="ml-auto w-24 text-right"
                    onChange={(e) => {
                      const v = Number(e.target.value) || 0;
                      setOverrides((prev) => prev.map((x) => (x.id === o.id ? { ...x, rate: v } : x)));
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}

function LeadSettingsSection() {
  const [defaultStatus, setDefaultStatus] = useState("New");
  const [autoAssign, setAutoAssign] = useState(true);
  const [assignMode, setAssignMode] = useState("round-robin");
  const [dupDetection, setDupDetection] = useState(true);
  const [requiredFields, setRequiredFields] = useState({
    phone: true,
    email: true,
    industry: false,
    address: false,
  });

  return (
    <SectionCard
      title="Lead Settings"
      description="Control how new leads enter and flow through the pipeline."
      action={<Button onClick={() => toast.info("Lead Settings isn't wired up yet — changes here aren't saved.")}>Save</Button>}
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Default lead status</Label>
            <Select value={defaultStatus} onValueChange={setDefaultStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Assigned">Assigned</SelectItem>
                <SelectItem value="Not Called">Not Called</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Auto-assignment</p>
              <p className="text-xs text-muted-foreground">Automatically assign new leads</p>
            </div>
            <Switch checked={autoAssign} onCheckedChange={setAutoAssign} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Assignment method</Label>
          <RadioGroup value={assignMode} onValueChange={setAssignMode} className="flex gap-6">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="round-robin" id="rr" />
              <Label htmlFor="rr" className="font-normal">Round-robin</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="manual" id="manual" />
              <Label htmlFor="manual" className="font-normal">Manual</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
          <div>
            <p className="text-sm font-medium">Duplicate detection</p>
            <p className="text-xs text-muted-foreground">Flag leads with matching phone/email</p>
          </div>
          <Switch checked={dupDetection} onCheckedChange={setDupDetection} />
        </div>

        <div className="space-y-2">
          <Label>Required fields</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(requiredFields) as (keyof typeof requiredFields)[]).map((key) => (
              <div key={key} className="flex items-center gap-2">
                <Checkbox
                  id={`rf-${key}`}
                  checked={requiredFields[key]}
                  onCheckedChange={(v) =>
                    setRequiredFields((prev) => ({ ...prev, [key]: v === true }))
                  }
                />
                <Label htmlFor={`rf-${key}`} className="font-normal capitalize">
                  {key}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

interface NotifRow {
  key: string;
  label: string;
  email: boolean;
  inApp: boolean;
}

function NotificationsSection() {
  const [rows, setRows] = useState<NotifRow[]>([
    { key: "assigned", label: "New lead assigned", email: true, inApp: true },
    { key: "followup", label: "Follow-up reminders", email: true, inApp: true },
    { key: "closed", label: "Deal closed", email: true, inApp: false },
    { key: "summary", label: "Weekly summary", email: true, inApp: false },
  ]);

  function toggle(key: string, field: "email" | "inApp") {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: !r[field] } : r)));
    toast.info("Notification preferences aren't wired up yet — this toggle isn't saved.");
  }

  return (
    <SectionCard title="Notifications" description="Choose how your team gets notified. (Not yet wired up — preferences aren't saved.)" noPadding>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead className="w-28 text-center">Email</TableHead>
            <TableHead className="w-28 text-center">In-app</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.key}>
              <TableCell className="font-medium">{r.label}</TableCell>
              <TableCell className="text-center">
                <Switch checked={r.email} onCheckedChange={() => toggle(r.key, "email")} />
              </TableCell>
              <TableCell className="text-center">
                <Switch checked={r.inApp} onCheckedChange={() => toggle(r.key, "inApp")} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}

function IntegrationsSection() {
  const integrations = [
    { name: "Email", icon: Mail, desc: "Sync inbox and send follow-up emails." },
    { name: "WhatsApp", icon: MessageCircle, desc: "Message leads directly from Meridian." },
    { name: "Calendar", icon: Calendar, desc: "Sync follow-ups with your calendar." },
    { name: "Payment gateway", icon: CreditCard, desc: "Accept card and EFT payments." },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {integrations.map((i) => (
        <SectionCard key={i.name}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <i.icon className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">{i.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{i.desc}</p>
              </div>
            </div>
            <Pill tone="warning" size="sm">Coming soon</Pill>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => toast.info(`${i.name} integration — coming soon`)}
          >
            Connect
          </Button>
        </SectionCard>
      ))}
    </div>
  );
}

interface AuditLogRow {
  id: string;
  actorUid: string;
  action: string;
  at: string;
}

/** Real entries written by writeAuditLog() — every mutating staff callable, logCall() included. */
function useAuditLog() {
  return useQuery({
    queryKey: ["auditLog", "recent"],
    queryFn: async () => {
      const snap = await getDocs(
        query(collection(db, "auditLog"), orderBy("at", "desc"), fbLimit(50)),
      );
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          actorUid: (data.actorUid as string) ?? "unknown",
          action: (data.action as string) ?? "unknown",
          at: data.at instanceof Timestamp ? data.at.toDate().toISOString() : new Date().toISOString(),
        } satisfies AuditLogRow;
      });
    },
  });
}

function SecuritySection() {
  const { data: users = [] } = useUsersList();
  const { data: auditLog = [], isLoading: auditLoading } = useAuditLog();
  const actorName = (uid: string) => users.find((u) => u.uid === uid)?.displayName ?? uid;

  return (
    <div className="space-y-6">
      <SectionCard
        title="Security"
        description="Protect access to Meridian CRM."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Two-factor authentication</p>
              <p className="text-xs text-muted-foreground">Require a code at login for all admins</p>
            </div>
            <div className="flex items-center gap-2">
              <Pill tone="warning" size="sm">Coming soon</Pill>
              <Switch checked={false} disabled aria-label="Two-factor authentication (not yet available)" />
            </div>
          </div>
          <div className="space-y-1.5 sm:max-w-xs">
            <Label>Session timeout</Label>
            <Select value="60" disabled>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="240">4 hours</SelectItem>
                <SelectItem value="480">8 hours</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Not configurable yet — sessions currently follow Firebase Auth's default expiry.</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Audit log" description="Live feed of the last 50 staff actions." noPadding>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : auditLog.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No audit entries yet.
                </TableCell>
              </TableRow>
            ) : (
              auditLog.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{actorName(a.actorUid)}</TableCell>
                  <TableCell className="text-muted-foreground">{a.action}</TableCell>
                  <TableCell>{formatDateTime(a.at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
