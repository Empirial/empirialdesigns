import { useState, type ChangeEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, Megaphone, Trash2, Upload } from "lucide-react";

import { AppShell } from "@staff/components/layout/app-shell";
import { PageHeader } from "@staff/components/shared/page-header";
import { SectionCard } from "@staff/components/shared/section-card";
import { EmptyState } from "@staff/components/shared/empty-state";
import { Button } from "@staff/components/ui/button";
import { Card } from "@staff/components/ui/card";
import { Input } from "@staff/components/ui/input";
import { Label } from "@staff/components/ui/label";
import { Textarea } from "@staff/components/ui/textarea";
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
  type MarketingMaterial,
  type MaterialType,
  deleteMarketingMaterial,
  uploadMarketingMaterial,
  useMarketingMaterials,
} from "@staff/lib/marketing-materials-data";

export const Route = createFileRoute("/admin/marketing")({
  head: () => ({
    meta: [
      { title: "Marketing Materials — Empirial CRM" },
      { name: "description", content: "Upload posters, brand assets and portfolio screenshots for agents to use." },
      { property: "og:title", content: "Marketing Materials — Empirial CRM" },
      { property: "og:description", content: "Upload posters, brand assets and portfolio screenshots for agents to use." },
    ],
  }),
  component: PageAdminMarketing,
});

const TYPE_LABEL: Record<MaterialType, string> = {
  poster: "Poster / social graphic",
  brand: "Brand asset",
  portfolio: "Portfolio screenshot",
};

const TYPE_SECTIONS: { type: MaterialType; title: string; description: string }[] = [
  { type: "poster", title: "Posters & social graphics", description: "Promotional images with a copy-ready caption" },
  { type: "brand", title: "Brand assets", description: "Logos and other official brand marks" },
  { type: "portfolio", title: "Portfolio screenshots", description: "Client site captures with a live URL" },
];

type FormState = {
  type: MaterialType;
  name: string;
  description: string;
  caption: string;
  url: string;
  file: File | null;
};

function emptyForm(): FormState {
  return { type: "poster", name: "", description: "", caption: "", url: "", file: null };
}

function PageAdminMarketing() {
  const { data: materials = [], isLoading } = useMarketingMaterials();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MarketingMaterial | null>(null);
  const [deleting, setDeleting] = useState(false);

  function openCreate(type: MaterialType) {
    setForm({ ...emptyForm(), type });
    setDialogOpen(true);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setForm((f) => ({ ...f, file }));
  }

  async function submit() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.file) {
      toast.error("Choose an image to upload");
      return;
    }
    setSaving(true);
    try {
      await uploadMarketingMaterial({
        type: form.type,
        name: form.name.trim(),
        description: form.description.trim(),
        caption: form.caption.trim(),
        url: form.url.trim(),
        file: form.file,
      });
      queryClient.invalidateQueries({ queryKey: ["marketingMaterials"] });
      toast.success(`${form.name} added`);
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't upload — try again.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMarketingMaterial(deleteTarget);
      queryClient.invalidateQueries({ queryKey: ["marketingMaterials"] });
      toast.success(`${deleteTarget.name} removed`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't remove — try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Marketing Materials"
        subtitle="Upload posters, brand assets and portfolio screenshots — they appear on every agent's Marketing Materials page."
        crumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Marketing Materials" }]}
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openCreate("poster")}>+ Add material</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add a marketing material</DialogTitle>
                <DialogDescription>This appears on the agent Marketing Materials page immediately.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as MaterialType }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(TYPE_LABEL) as MaterialType[]).map((t) => (
                        <SelectItem key={t} value={t}>{TYPE_LABEL[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mm-name">Name</Label>
                  <Input
                    id="mm-name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder={form.type === "portfolio" ? "e.g. Client Name" : "e.g. Spring Promo"}
                  />
                </div>
                {form.type === "portfolio" ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="mm-url">Live site URL</Label>
                    <Input
                      id="mm-url"
                      value={form.url}
                      onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                      placeholder="https://client-site.co.za"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="mm-desc">Description</Label>
                    <Textarea
                      id="mm-desc"
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Short description shown under the image"
                      rows={2}
                    />
                  </div>
                )}
                {form.type === "poster" ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="mm-caption">Caption</Label>
                    <Textarea
                      id="mm-caption"
                      value={form.caption}
                      onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
                      placeholder="Copy-ready caption for WhatsApp, email or social"
                      rows={3}
                    />
                  </div>
                ) : null}
                <div className="space-y-1.5">
                  <Label>Image</Label>
                  <Button variant="outline" className="w-full" asChild>
                    <label className="cursor-pointer">
                      <Upload className="mr-1.5 size-4" />
                      {form.file ? form.file.name : "Choose image"}
                      <input className="hidden" type="file" accept="image/*" onChange={handleFileChange} />
                    </label>
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
                <Button onClick={submit} disabled={saving}>{saving ? "Uploading…" : "Add material"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mt-6 space-y-6">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          TYPE_SECTIONS.map((section) => {
            const items = materials.filter((m) => m.type === section.type);
            return (
              <SectionCard key={section.type} title={section.title} description={section.description}>
                {items.length === 0 ? (
                  <EmptyState
                    icon={Megaphone}
                    title="Nothing uploaded yet"
                    description="Bundled defaults still show on the agent page — this only lists new uploads."
                    action={<Button variant="outline" onClick={() => openCreate(section.type)}>+ Add {TYPE_LABEL[section.type].toLowerCase()}</Button>}
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((m) => (
                      <Card key={m.id} className="gap-3 overflow-hidden p-0">
                        <div className="flex max-h-[220px] items-center justify-center bg-muted/30 p-3">
                          <img src={m.imageUrl} alt={m.name} className="max-h-[190px] w-full rounded-md object-contain" />
                        </div>
                        <div className="space-y-2 p-4 pt-0">
                          <p className="text-sm font-semibold">{m.name}</p>
                          {m.description ? <p className="text-xs text-muted-foreground">{m.description}</p> : null}
                          {m.caption ? (
                            <p className="rounded-lg border border-border bg-muted/30 p-2 text-xs leading-relaxed text-muted-foreground line-clamp-3">{m.caption}</p>
                          ) : null}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {m.url ? (
                              <Button size="sm" variant="outline" asChild>
                                <a href={m.url} target="_blank" rel="noreferrer"><ExternalLink className="mr-1.5 size-3.5" /> Visit site</a>
                              </Button>
                            ) : null}
                            <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(m)}>
                              <Trash2 className="mr-1.5 size-3.5" /> Remove
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </SectionCard>
            );
          })
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes it from every agent's Marketing Materials page immediately. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              {deleting ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
