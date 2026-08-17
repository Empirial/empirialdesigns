import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { AppShell } from "@staff/components/layout/app-shell";
import { PageHeader } from "@staff/components/shared/page-header";
import { KpiCard, KpiGrid } from "@staff/components/shared/kpi-card";
import { EmptyState } from "@staff/components/shared/empty-state";
import { Pill } from "@staff/components/shared/status-badge";
import { Button } from "@staff/components/ui/button";
import { Card } from "@staff/components/ui/card";
import { Input } from "@staff/components/ui/input";
import { Label } from "@staff/components/ui/label";
import { Textarea } from "@staff/components/ui/textarea";
import { Switch } from "@staff/components/ui/switch";
import { Slider } from "@staff/components/ui/slider";
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
  AlertDialogTrigger,
} from "@staff/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@staff/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@staff/components/ui/table";
import { db } from "@staff/lib/firebase";
import { useServices } from "@staff/lib/services-data";
import { useDeals } from "@staff/lib/deals-data";
import { importEmpirialCatalog } from "@staff/lib/catalog-import";
import { formatZAR } from "@staff/lib/format";
import { cn } from "@staff/lib/utils";
import type { Service } from "@staff/lib/types";
import {
  DollarSign,
  Layers,
  MoreHorizontal,
  Package,
  Percent,
  Search,
  Sparkles,
  TrendingUp,
  Rows3,
  LayoutGrid,
} from "lucide-react";

export const Route = createFileRoute("/admin/services")({
  head: () => ({
    meta: [
      { title: "Services & Pricing — Meridian CRM" },
      { name: "description", content: "Manage the Meridian Digital service catalogue, pricing and commission rates." },
      { property: "og:title", content: "Services & Pricing — Meridian CRM" },
      { property: "og:description", content: "Manage the Meridian Digital service catalogue, pricing and commission rates." },
    ],
  }),
  component: PageAdminServices,
});

type FormState = {
  id?: string;
  name: string;
  category: string;
  description: string;
  price: string;
  priceType: "one-off" | "monthly";
  commissionRate: number;
  active: boolean;
};

const CATEGORIES = ["Web", "Marketing", "Growth", "Automation", "Software", "Design"];

// "svc-design" predates the Sales Playbook catalog swap — it now holds
// Custom Software Development, not graphic design. Kept as-is to avoid
// touching every demo lead/deal that still references this id by string.
// The actual poster/graphic design package lives under "svc-poster" instead.
const CATEGORY_OF: Record<string, string> = {
  "svc-web": "Web",
  "svc-ecom": "Web",
  "svc-app": "Web",
  "svc-seo": "Marketing",
  "svc-ai": "Automation",
  "svc-design": "Software",
  "svc-poster": "Design",
};

function categoryFor(service: Service) {
  return CATEGORY_OF[service.id] ?? "Growth";
}

function isMonthly(service: Service) {
  const name = service.name.toLowerCase();
  return name.includes("seo") || name.includes("ai automation");
}

function emptyForm(): FormState {
  return {
    name: "",
    category: CATEGORIES[0]!,
    description: "",
    price: "",
    priceType: "one-off",
    commissionRate: 10,
    active: true,
  };
}

function formFromService(s: Service): FormState {
  return {
    id: s.id,
    name: s.name,
    category: categoryFor(s),
    description: s.description,
    price: String(s.promoPrice || s.price),
    priceType: isMonthly(s) ? "monthly" : "one-off",
    commissionRate: s.commissionType === "percentage" ? s.commissionValue : 10,
    active: s.status === "Active",
  };
}

function PageAdminServices() {
  const { data: services = [], isLoading: servicesLoading } = useServices();
  const { data: deals = [], isLoading: dealsLoading } = useDeals();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [activeOnly, setActiveOnly] = useState(false);
  const [view, setView] = useState<"grid" | "table">("grid");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [archiveTarget, setArchiveTarget] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  async function handleImportCatalog() {
    if (
      !window.confirm(
        "Import the real EmpirialDesigns catalog — 7 services, 31 scripts, and the 6-module sales course — into this workspace? Safe to run again later; it only touches those exact documents.",
      )
    ) {
      return;
    }
    setImporting(true);
    try {
      const result = await importEmpirialCatalog();
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
      queryClient.invalidateQueries({ queryKey: ["salesTrainingLessons"] });
      toast.success(`Imported ${result.services} services, ${result.scripts} scripts, ${result.lessons} course lessons.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't import the catalog.");
    } finally {
      setImporting(false);
    }
  }

  const dealsByService = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number; commission: number }>();
    for (const d of deals) {
      const cur = map.get(d.serviceId) ?? { count: 0, revenue: 0, commission: 0 };
      cur.count += 1;
      cur.revenue += d.value;
      cur.commission += d.commission;
      map.set(d.serviceId, cur);
    }
    return map;
  }, [deals]);

  const filtered = useMemo(() => {
    return services.filter((s) => {
      if (activeOnly && s.status !== "Active") return false;
      if (category !== "all" && categoryFor(s) !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!s.name.toLowerCase().includes(q) && !s.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [services, activeOnly, category, search]);

  const totalRevenue = deals.reduce((sum, d) => sum + d.value, 0);
  const activeCount = services.filter((s) => s.status === "Active").length;
  const avgPrice = services.length
    ? Math.round(services.reduce((sum, s) => sum + (s.promoPrice || s.price), 0) / services.length)
    : 0;

  function openCreate() {
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(s: Service) {
    setForm(formFromService(s));
    setDialogOpen(true);
  }

  async function submit() {
    if (!form.name.trim()) {
      toast.error("Service name is required");
      return;
    }
    const price = Number(form.price) || 0;
    const payload = {
      name: form.name,
      description: form.description,
      short: form.description.slice(0, 60),
      price,
      promoPrice: price,
      commissionType: "percentage" as const,
      commissionValue: form.commissionRate,
      status: form.active ? "Active" : "Inactive",
    };
    setSaving(true);
    try {
      if (form.id) {
        await updateDoc(doc(db, "services", form.id), payload);
      } else {
        await addDoc(collection(db, "services"), payload);
      }
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success(form.id ? "Service updated" : "Service created");
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the service — try again.");
    } finally {
      setSaving(false);
    }
  }

  async function duplicate(s: Service) {
    setDuplicatingId(s.id);
    try {
      await addDoc(collection(db, "services"), {
        name: `${s.name} (Copy)`,
        description: s.description,
        short: s.short,
        price: s.price,
        promoPrice: s.promoPrice,
        commissionType: s.commissionType,
        commissionValue: s.commissionValue,
        status: "Inactive",
        benefits: s.benefits,
        pitch: s.pitch,
        objections: s.objections,
        icon: s.icon,
      });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success(`Duplicated ${s.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't duplicate the service — try again.");
    } finally {
      setDuplicatingId(null);
    }
  }

  async function toggleStatus(s: Service) {
    const newStatus: Service["status"] = s.status === "Active" ? "Inactive" : "Active";
    setTogglingId(s.id);
    try {
      await updateDoc(doc(db, "services", s.id), { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success(`${s.name} ${newStatus === "Active" ? "activated" : "deactivated"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update status — try again.");
    } finally {
      setTogglingId(null);
    }
  }

  async function archive() {
    if (!archiveTarget) return;
    if (archiveTarget.status !== "Active") {
      toast.success(`${archiveTarget.name} archived`);
      setArchiveTarget(null);
      return;
    }
    setArchiving(true);
    try {
      await updateDoc(doc(db, "services", archiveTarget.id), { status: "Inactive" });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success(`${archiveTarget.name} archived`);
      setArchiveTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't archive the service — try again.");
    } finally {
      setArchiving(false);
    }
  }

  if (servicesLoading || dealsLoading) {
    return (
      <AppShell>
        <PageHeader
          title="Services & Pricing"
          subtitle="Manage the catalogue agents pitch to leads, pricing and commission structure."
          crumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Services" }]}
        />
        <div className="mt-6 text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Services & Pricing"
        subtitle="Manage the catalogue agents pitch to leads, pricing and commission structure."
        crumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Services" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleImportCatalog} disabled={importing}>
              {importing ? "Importing…" : "Import real catalog"}
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>+ Add Service</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{form.id ? "Edit service" : "Add a new service"}</DialogTitle>
                <DialogDescription>
                  This appears in the catalogue agents use to pitch and close deals.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="svc-name">Name</Label>
                  <Input
                    id="svc-name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Website Development"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Select
                      value={form.category}
                      onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Price type</Label>
                    <Select
                      value={form.priceType}
                      onValueChange={(v) => setForm((f) => ({ ...f, priceType: v as FormState["priceType"] }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one-off">Once-off</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="svc-desc">Description</Label>
                  <Textarea
                    id="svc-desc"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="What does this service include?"
                    rows={3}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="svc-price">Price (ZAR)</Label>
                  <Input
                    id="svc-price"
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="3500"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Commission rate</Label>
                    <span className="text-sm font-medium tabular-nums">{form.commissionRate}%</span>
                  </div>
                  <Slider
                    value={[form.commissionRate]}
                    min={0}
                    max={25}
                    step={1}
                    onValueChange={([v]) => setForm((f) => ({ ...f, commissionRate: v ?? 0 }))}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium">Active</p>
                    <p className="text-xs text-muted-foreground">Visible for agents to pitch</p>
                  </div>
                  <Switch
                    checked={form.active}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={submit} disabled={saving}>
                  {saving ? "Saving…" : form.id ? "Save changes" : "Add service"}
                </Button>
              </DialogFooter>
            </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="mt-6 space-y-6">
        <KpiGrid>
          <KpiCard label="Total services" value={services.length} icon={Package} />
          <KpiCard label="Active" value={activeCount} icon={Sparkles} tone="success" />
          <KpiCard label="Avg. price" value={formatZAR(avgPrice, { compact: true })} icon={DollarSign} />
          <KpiCard
            label="Revenue attributed"
            value={formatZAR(totalRevenue, { compact: true })}
            icon={TrendingUp}
            tone="primary"
          />
        </KpiGrid>

        <div className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services..."
                className="pl-9"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 text-sm">
              <Switch checked={activeOnly} onCheckedChange={setActiveOnly} id="active-only" />
              <Label htmlFor="active-only" className="text-muted-foreground">
                Active only
              </Label>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border p-1">
            <Button
              size="icon"
              variant={view === "grid" ? "secondary" : "ghost"}
              className="size-8"
              onClick={() => setView("grid")}
              aria-label="Grid view"
            >
              <LayoutGrid className="size-4" />
            </Button>
            <Button
              size="icon"
              variant={view === "table" ? "secondary" : "ghost"}
              className="size-8"
              onClick={() => setView("table")}
              aria-label="Table view"
            >
              <Rows3 className="size-4" />
            </Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No services match your filters"
            description="Try clearing the search or category filter."
            action={
              <Button variant="outline" onClick={() => { setSearch(""); setCategory("all"); setActiveOnly(false); }}>
                Clear filters
              </Button>
            }
          />
        ) : view === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((s) => {
              const dealStats = dealsByService.get(s.id) ?? { count: 0, revenue: 0, commission: 0 };
              const monthly = isMonthly(s);
              const estCommission =
                s.commissionType === "percentage"
                  ? Math.round(((s.promoPrice || s.price) * s.commissionValue) / 100)
                  : s.commissionValue;
              return (
                <Card key={s.id} className="flex flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{s.name}</p>
                      <Pill tone="info" size="sm" className="mt-1.5">
                        {categoryFor(s)}
                      </Pill>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="size-7 shrink-0" aria-label="Service actions">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(s)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem disabled={duplicatingId === s.id} onClick={() => duplicate(s)}>
                          {duplicatingId === s.id ? "Duplicating…" : "Duplicate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.preventDefault();
                            setArchiveTarget(s);
                          }}
                        >
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{s.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-semibold tabular-nums">
                      {formatZAR(s.promoPrice || s.price)}
                    </span>
                    {monthly ? <span className="text-xs text-muted-foreground">/month</span> : null}
                  </div>
                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Percent className="size-3.5" /> {s.commissionValue}
                      {s.commissionType === "percentage" ? "%" : " R"} commission
                    </div>
                    <div className="text-right font-medium">≈ {formatZAR(estCommission)}</div>
                    <div className="text-muted-foreground">Deals closed</div>
                    <div className="text-right font-medium">{dealStats.count}</div>
                    <div className="text-muted-foreground">Revenue</div>
                    <div className="text-right font-medium">{formatZAR(dealStats.revenue, { compact: true })}</div>
                  </div>
                  <div className="mt-1 flex items-center justify-between border-t border-border pt-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={s.status === "Active"}
                        disabled={togglingId === s.id}
                        onCheckedChange={() => toggleStatus(s)}
                      />
                      <span className="text-xs text-muted-foreground">{s.status}</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                      Edit
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="surface-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Deals</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => {
                  const dealStats = dealsByService.get(s.id) ?? { count: 0, revenue: 0, commission: 0 };
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>
                        <Pill tone="info" size="sm">
                          {categoryFor(s)}
                        </Pill>
                      </TableCell>
                      <TableCell className={cn("tabular-nums")}>
                        {formatZAR(s.promoPrice || s.price)}
                        {isMonthly(s) ? "/mo" : ""}
                      </TableCell>
                      <TableCell>
                        {s.commissionValue}
                        {s.commissionType === "percentage" ? "%" : " R fixed"}
                      </TableCell>
                      <TableCell>{dealStats.count}</TableCell>
                      <TableCell>{formatZAR(dealStats.revenue, { compact: true })}</TableCell>
                      <TableCell>
                        <Switch
                          checked={s.status === "Active"}
                          disabled={togglingId === s.id}
                          onCheckedChange={() => toggleStatus(s)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog open={!!archiveTarget} onOpenChange={(o) => !o && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {archiveTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The service will be deactivated and hidden from the active catalogue. You can reactivate it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={archiving}
              onClick={(e) => {
                e.preventDefault();
                void archive();
              }}
            >
              {archiving ? "Archiving…" : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
