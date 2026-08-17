import { ChangeEvent, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { AppShell } from "@staff/components/layout/app-shell";
import { PageHeader } from "@staff/components/shared/page-header";
import { EmptyState } from "@staff/components/shared/empty-state";
import { Pill } from "@staff/components/shared/status-badge";
import { Button } from "@staff/components/ui/button";
import { Card } from "@staff/components/ui/card";
import { Input } from "@staff/components/ui/input";
import { Label } from "@staff/components/ui/label";
import { Textarea } from "@staff/components/ui/textarea";
import { Switch } from "@staff/components/ui/switch";
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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@staff/components/ui/sheet";
import { db } from "@staff/lib/firebase";
import { toggleMyScriptFavourite, useScripts } from "@staff/lib/scripts-data";
import { relativeTime } from "@staff/lib/format";
import {
  DEFAULT_SALES_LESSONS,
  deleteSalesTrainingLesson,
  replaceSalesTrainingLessons,
  saveSalesTrainingLesson,
  type TrainingLesson,
  useSalesTrainingLessons,
} from "@staff/lib/sales-training-data";
import { cn } from "@staff/lib/utils";
import type { ScriptDoc } from "@staff/lib/types";
import { uploadCertificateTemplate, useCertificateTemplate } from "@staff/lib/certificate-template";
import { Award, BookOpen, Copy, FileText, GraduationCap, Pencil, Plus, Search, Star, Trash2, Upload } from "lucide-react";

export const Route = createFileRoute("/admin/scripts")({
  head: () => ({
    meta: [
      { title: "Sales Scripts & Resources — Meridian CRM" },
      { name: "description", content: "Browse and manage sales scripts, objection handling and knowledge base articles." },
      { property: "og:title", content: "Sales Scripts & Resources — Meridian CRM" },
      { property: "og:description", content: "Browse and manage sales scripts, objection handling and knowledge base articles." },
    ],
  }),
  component: PageAdminScripts,
});

const CATEGORIES: ScriptDoc["category"][] = [
  "Opening",
  "Website Sales",
  "SEO",
  "Apps",
  "AI Automation",
  "Follow-up",
  "Objections",
  "Closing",
  "FAQ",
  "Knowledge Base",
];

type FormState = {
  id?: string;
  title: string;
  category: ScriptDoc["category"];
  tags: string;
  body: string;
};

function emptyForm(): FormState {
  return { title: "", category: "Opening", tags: "", body: "" };
}

function tagsOf(script: ScriptDoc): string[] {
  const words = script.title
    .toLowerCase()
    .replace(/["'.,]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3);
  return Array.from(new Set([script.type, ...words.slice(0, 2)]));
}

type LessonForm = Omit<TrainingLesson, "id"> & { id?: string; pointsText: string; mentorsText: string };

function emptyLessonForm(order = DEFAULT_SALES_LESSONS.length + 1): LessonForm {
  return { title: "", duration: "10 min", summary: "", points: [], pointsText: "", mentorsText: "", order };
}

function PageAdminScripts() {
  const { data: scripts = [], isLoading } = useScripts();
  const { data: courseLessons = DEFAULT_SALES_LESSONS } = useSalesTrainingLessons();
  const { data: certificateTemplate } = useCertificateTemplate();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [deleteTarget, setDeleteTarget] = useState<ScriptDoc | null>(null);
  const [readTarget, setReadTarget] = useState<ScriptDoc | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingFavId, setTogglingFavId] = useState<string | null>(null);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [lessonForm, setLessonForm] = useState<LessonForm>(emptyLessonForm());
  const [lessonSaving, setLessonSaving] = useState(false);
  const [lessonDeletingId, setLessonDeletingId] = useState<string | null>(null);
  const [certificateUploading, setCertificateUploading] = useState(false);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of scripts) map.set(s.category, (map.get(s.category) ?? 0) + 1);
    return map;
  }, [scripts]);

  const filtered = useMemo(() => {
    return scripts
      .filter((s) => activeCategory === "All" || s.category === activeCategory)
      .filter((s) => !favOnly || s.favourite)
      .filter((s) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          s.title.toLowerCase().includes(q) ||
          s.body.toLowerCase().includes(q) ||
          tagsOf(s).some((t) => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  }, [scripts, activeCategory, favOnly, search]);

  function openCreate() {
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(s: ScriptDoc) {
    setForm({ id: s.id, title: s.title, category: s.category as ScriptDoc["category"], tags: tagsOf(s).join(", "), body: s.body });
    setDialogOpen(true);
  }

  async function submit() {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Title and body are required");
      return;
    }
    const type: ScriptDoc["type"] =
      form.category === "Objections"
        ? "objection"
        : form.category === "FAQ"
          ? "faq"
          : form.category === "Knowledge Base"
            ? "knowledge"
            : "script";
    setSaving(true);
    try {
      if (form.id) {
        await updateDoc(doc(db, "scripts", form.id), {
          title: form.title,
          category: form.category,
          type,
          body: form.body,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "scripts"), {
          title: form.title,
          category: form.category,
          type,
          body: form.body,
          favouriteBy: [],
          updatedAt: serverTimestamp(),
        });
      }
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
      toast.success(form.id ? "Script updated" : "Script created");
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the script — try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleFavourite(s: ScriptDoc) {
    setTogglingFavId(s.id);
    try {
      await toggleMyScriptFavourite(s.id, Boolean(s.favourite));
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update favourite — try again.");
    } finally {
      setTogglingFavId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "scripts", deleteTarget.id));
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
      toast.success("Script deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete the script — try again.");
    } finally {
      setDeleting(false);
    }
  }

  function copyBody(s: ScriptDoc) {
    navigator.clipboard.writeText(s.body).then(
      () => toast.success("Copied to clipboard"),
      () => toast.error("Could not copy"),
    );
  }

  function editLesson(lesson?: TrainingLesson) {
    setLessonForm(
      lesson
        ? { ...lesson, pointsText: lesson.points.join("\n"), mentorsText: (lesson.mentors ?? []).join(", ") }
        : emptyLessonForm(courseLessons.length + 1),
    );
    setLessonDialogOpen(true);
  }

  async function saveLesson() {
    const points = lessonForm.pointsText.split("\n").map((point) => point.trim()).filter(Boolean);
    const mentors = lessonForm.mentorsText.split(",").map((mentor) => mentor.trim()).filter(Boolean);
    if (!lessonForm.title.trim() || !lessonForm.summary.trim() || points.length === 0) {
      toast.error("Add a title, summary and at least one lesson point.");
      return;
    }
    setLessonSaving(true);
    try {
      const { pointsText, mentorsText, ...lesson } = lessonForm;
      await saveSalesTrainingLesson({
        ...lesson,
        title: lesson.title.trim(),
        summary: lesson.summary.trim(),
        points,
        mentors: mentors.length ? mentors : undefined,
        body: lesson.body?.trim() || undefined,
        activity: lesson.activity?.trim() || undefined,
        keyTakeaway: lesson.keyTakeaway?.trim() || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["salesTrainingLessons"] });
      toast.success(lessonForm.id ? "Lesson updated" : "Lesson added to the course");
      setLessonDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save the lesson.");
    } finally { setLessonSaving(false); }
  }

  async function removeLesson(id: string) {
    setLessonDeletingId(id);
    try {
      await deleteSalesTrainingLesson(id);
      queryClient.invalidateQueries({ queryKey: ["salesTrainingLessons"] });
      toast.success("Lesson removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't remove the lesson.");
    } finally { setLessonDeletingId(null); }
  }

  async function uploadCourse(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as TrainingLesson[] | { lessons?: TrainingLesson[] };
      const lessons = Array.isArray(data) ? data : data.lessons;
      if (!lessons?.length || lessons.some((lesson) => !lesson.title || !lesson.summary || !Array.isArray(lesson.points))) {
        throw new Error("Use a JSON file with a lessons array containing title, duration, summary and points.");
      }
      await replaceSalesTrainingLessons(lessons.map((lesson, index) => ({ ...lesson, id: lesson.id || `uploaded-${Date.now()}-${index}`, order: lesson.order ?? index + 1 })));
      queryClient.invalidateQueries({ queryKey: ["salesTrainingLessons"] });
      toast.success("Course uploaded and published to agents.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't upload this course file.");
    }
  }

  async function handleUploadCertificateTemplate(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setCertificateUploading(true);
    try {
      await uploadCertificateTemplate(file);
      queryClient.invalidateQueries({ queryKey: ["settings", "certificateTemplate"] });
      toast.success("Certificate template uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't upload the certificate template.");
    } finally {
      setCertificateUploading(false);
    }
  }

  if (isLoading) {
    return (
      <AppShell>
        <PageHeader
          title="Sales Scripts & Resources"
          subtitle="Cold call openers, objection handling, closing scripts and knowledge base articles."
          crumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Scripts" }]}
        />
        <div className="mt-6 text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Sales Scripts & Resources"
        subtitle="Cold call openers, objection handling, closing scripts and knowledge base articles."
        crumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Scripts" }]}
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>+ New Script</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto scrollbar-slim sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>{form.id ? "Edit script" : "New script"}</DialogTitle>
                <DialogDescription>Scripts are visible to every agent in the field.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-1">
                <div className="space-y-1.5">
                  <Label htmlFor="sc-title">Title</Label>
                  <Input
                    id="sc-title"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Cold Call Introduction"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Select
                      value={form.category}
                      onValueChange={(v) => setForm((f) => ({ ...f, category: v as ScriptDoc["category"] }))}
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
                    <Label htmlFor="sc-tags">Tags (comma separated)</Label>
                    <Input
                      id="sc-tags"
                      value={form.tags}
                      onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                      placeholder="pricing, intro"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sc-body">Script body</Label>
                  <Textarea
                    id="sc-body"
                    value={form.body}
                    onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                    rows={12}
                    className="font-mono text-sm"
                    placeholder="Write the full script here..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={submit} disabled={saving}>
                  {saving ? "Saving…" : form.id ? "Save changes" : "Create script"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <section className="surface-card mt-6 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary"><GraduationCap className="size-5" /> Sales Agent Academy</div>
            <h2 className="mt-1 text-lg font-bold">Course content</h2>
            <p className="mt-1 text-sm text-muted-foreground">Manage the lessons agents must complete before their certification exam.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild><label className="cursor-pointer"><Upload className="mr-1.5 size-4" /> Upload course<input className="hidden" type="file" accept="application/json,.json" onChange={uploadCourse} /></label></Button>
            <Button onClick={() => editLesson()}><Plus className="mr-1.5 size-4" /> Add lesson</Button>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {courseLessons.map((lesson) => (
            <Card key={lesson.id} className="gap-3 p-4">
              <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-primary">Lesson {lesson.order} · {lesson.duration}</p><p className="mt-1 text-sm font-semibold">{lesson.title}</p></div><Button size="icon" variant="ghost" className="size-8" onClick={() => editLesson(lesson)} aria-label={`Edit ${lesson.title}`}><Pencil className="size-4" /></Button></div>
              <p className="line-clamp-2 text-xs text-muted-foreground">{lesson.summary}</p>
              <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground"><span>{lesson.points.length} learning points</span><button disabled={lessonDeletingId === lesson.id} onClick={() => removeLesson(lesson.id)} className="text-destructive hover:underline disabled:opacity-50">Remove</button></div>
            </Card>
          ))}
        </div>

        <Card className="mt-5 gap-3 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              {certificateTemplate?.imageUrl ? (
                <img
                  src={certificateTemplate.imageUrl}
                  alt="Current certificate template"
                  className="h-16 w-24 shrink-0 rounded-md border border-border object-cover"
                />
              ) : (
                <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
                  <Award className="size-6" />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold">Certificate template</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Background image used behind the agent's completion certificate.
                  {certificateTemplate?.isDefault ? " Currently the default EmpirialDesigns design." : ""}
                </p>
              </div>
            </div>
            <Button variant="outline" disabled={certificateUploading} asChild>
              <label className="cursor-pointer">
                <Upload className="mr-1.5 size-4" />
                {certificateUploading ? "Uploading…" : "Upload template"}
                <input
                  className="hidden"
                  type="file"
                  accept="image/*"
                  disabled={certificateUploading}
                  onChange={handleUploadCertificateTemplate}
                />
              </label>
            </Button>
          </div>
        </Card>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="surface-card h-fit p-2">
          <button
            onClick={() => setActiveCategory("All")}
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
              activeCategory === "All" ? "bg-primary/10 font-medium text-primary" : "text-foreground hover:bg-muted",
            )}
          >
            All scripts
            <span className="text-xs text-muted-foreground">{scripts.length}</span>
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                activeCategory === c ? "bg-primary/10 font-medium text-primary" : "text-foreground hover:bg-muted",
              )}
            >
              {c}
              <span className="text-xs text-muted-foreground">{counts.get(c) ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, body or tags..."
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Switch checked={favOnly} onCheckedChange={setFavOnly} id="fav-only" />
              <Label htmlFor="fav-only" className="text-muted-foreground">
                Favourites only
              </Label>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No scripts found"
              description="Try a different category or search term."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((s) => (
                <Card key={s.id} className="flex flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{s.title}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Pill tone="info" size="sm">
                          {s.category}
                        </Pill>
                        {tagsOf(s).map((t) => (
                          <Pill key={t} tone="neutral" size="sm">
                            {t}
                          </Pill>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleFavourite(s)}
                      disabled={togglingFavId === s.id}
                      className={cn(
                        "shrink-0 rounded-full p-1.5 transition-colors hover:bg-muted disabled:opacity-50",
                        s.favourite ? "text-warning" : "text-muted-foreground",
                      )}
                    >
                      <Star className={cn("size-4", s.favourite && "fill-current")} />
                    </button>
                  </div>
                  <p className="line-clamp-3 text-xs whitespace-pre-line text-muted-foreground">{s.body}</p>
                  <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                    <span className="text-xs text-muted-foreground">Updated {relativeTime(s.updatedAt)}</span>
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => setReadTarget(s)}>
                        <BookOpen className="size-3.5" /> Read
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                        Edit
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-destructive hover:text-destructive"
                        aria-label="Delete script"
                        onClick={() => setDeleteTarget(s)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Sheet open={!!readTarget} onOpenChange={(o) => !o && setReadTarget(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{readTarget?.title}</SheetTitle>
            <SheetDescription>
              {readTarget ? `${readTarget.category} · updated ${relativeTime(readTarget.updatedAt)}` : ""}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4 px-4 pb-6">
            <p className="rounded-lg bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-line">
              {readTarget?.body}
            </p>
            <Button className="w-full" onClick={() => readTarget && copyBody(readTarget)}>
              <Copy className="size-4" /> Copy to clipboard
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>This removes the script from the shared library for all agents.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>{lessonForm.id ? "Edit course lesson" : "Add course lesson"}</DialogTitle><DialogDescription>These details are shown to every sales agent in the academy.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-[1fr_110px]"><div className="space-y-1.5"><Label htmlFor="lesson-title">Lesson title</Label><Input id="lesson-title" value={lessonForm.title} onChange={(event) => setLessonForm((form) => ({ ...form, title: event.target.value }))} /></div><div className="space-y-1.5"><Label htmlFor="lesson-duration">Duration</Label><Input id="lesson-duration" value={lessonForm.duration} onChange={(event) => setLessonForm((form) => ({ ...form, duration: event.target.value }))} placeholder="10 min" /></div></div>
            <div className="space-y-1.5"><Label htmlFor="lesson-summary">Summary</Label><Textarea id="lesson-summary" value={lessonForm.summary} onChange={(event) => setLessonForm((form) => ({ ...form, summary: event.target.value }))} rows={3} /></div>
            <div className="space-y-1.5"><Label htmlFor="lesson-points">Learning points</Label><Textarea id="lesson-points" value={lessonForm.pointsText} onChange={(event) => setLessonForm((form) => ({ ...form, pointsText: event.target.value }))} rows={6} placeholder="One learning point per line" /><p className="text-xs text-muted-foreground">Use one line for each point agents need to learn.</p></div>
            <div className="space-y-1.5"><Label htmlFor="lesson-mentors">Mentors (optional)</Label><Input id="lesson-mentors" value={lessonForm.mentorsText} onChange={(event) => setLessonForm((form) => ({ ...form, mentorsText: event.target.value }))} placeholder="Jeffrey Gitomer, Sales Feed" /><p className="text-xs text-muted-foreground">Comma-separated. Shown as chips above the lesson.</p></div>
            <div className="space-y-1.5"><Label htmlFor="lesson-body">Full lesson text (optional)</Label><Textarea id="lesson-body" value={lessonForm.body ?? ""} onChange={(event) => setLessonForm((form) => ({ ...form, body: event.target.value }))} rows={8} placeholder="The complete lesson prose, shown behind a &quot;Read full lesson&quot; toggle." /></div>
            <div className="space-y-1.5"><Label htmlFor="lesson-activity">Activity (optional)</Label><Textarea id="lesson-activity" value={lessonForm.activity ?? ""} onChange={(event) => setLessonForm((form) => ({ ...form, activity: event.target.value }))} rows={4} /></div>
            <div className="space-y-1.5"><Label htmlFor="lesson-key-takeaway">Key takeaway (optional)</Label><Textarea id="lesson-key-takeaway" value={lessonForm.keyTakeaway ?? ""} onChange={(event) => setLessonForm((form) => ({ ...form, keyTakeaway: event.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setLessonDialogOpen(false)} disabled={lessonSaving}>Cancel</Button><Button onClick={saveLesson} disabled={lessonSaving}>{lessonSaving ? "Saving…" : "Save lesson"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
