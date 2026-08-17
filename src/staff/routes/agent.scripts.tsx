import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookOpen, Copy, ExternalLink, GraduationCap, Search, Star } from "lucide-react";
import { AppShell } from "@staff/components/layout/app-shell";
import { PageHeader } from "@staff/components/shared/page-header";
import { EmptyState } from "@staff/components/shared/empty-state";
import { SectionCard } from "@staff/components/shared/section-card";
import { Button } from "@staff/components/ui/button";
import { Input } from "@staff/components/ui/input";
import { Card } from "@staff/components/ui/card";
import { ScrollArea } from "@staff/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@staff/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@staff/components/ui/accordion";
import { useScripts, toggleMyScriptFavourite } from "@staff/lib/scripts-data";
import { DEFAULT_SALES_LESSONS, useSalesTrainingLessons } from "@staff/lib/sales-training-data";
import { useCourseProgress } from "@staff/lib/academy-data";
import type { ScriptDoc } from "@staff/lib/types";
import { cn } from "@staff/lib/utils";
import { formatDate } from "@staff/lib/format";

export const Route = createFileRoute("/agent/scripts")({
  head: () => ({
    meta: [
      { title: "Scripts & Lessons — Empirial CRM" },
      { name: "description", content: "Call scripts, objection handling and knowledge base for agents." },
      { property: "og:title", content: "Scripts & Lessons — Empirial CRM" },
      { property: "og:description", content: "The agent script and resource library." },
    ],
  }),
  component: PageAgentScripts,
});

function PageAgentScripts() {
  const { data: scripts = [] } = useScripts();
  const { data: courseLessons = DEFAULT_SALES_LESSONS } = useSalesTrainingLessons();
  const { completedCount } = useCourseProgress(courseLessons);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [reading, setReading] = useState<ScriptDoc | null>(null);
  const [favPendingIds, setFavPendingIds] = useState<Set<string>>(new Set());

  const categories = useMemo(() => Array.from(new Set<string>(scripts.map((s) => s.category))), [scripts]);
  const objectionScripts = useMemo(() => scripts.filter((s) => s.category === "Objections"), [scripts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scripts.filter((s) => {
      if (category !== "all" && s.category !== category) return false;
      if (q && !`${s.title} ${s.body}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [scripts, search, category]);

  const favourites = filtered.filter((s) => s.favourite);
  const rest = filtered.filter((s) => !s.favourite);

  const copy = (s: ScriptDoc) => {
    navigator.clipboard?.writeText(s.body);
    toast.success(`Copied "${s.title}"`);
  };

  const handleToggleFav = async (s: ScriptDoc) => {
    setFavPendingIds((prev) => new Set(prev).add(s.id));
    try {
      await toggleMyScriptFavourite(s.id, !!s.favourite);
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update favourite — try again.");
    } finally {
      setFavPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(s.id);
        return next;
      });
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Scripts & Lessons"
        subtitle="Build your sales skills, then use the right words at the right moment."
        crumbs={[{ label: "Agent", to: "/agent/dashboard" }, { label: "Scripts" }]}
      />

      <Link
        to="/agent/academy"
        className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-card p-5 shadow-[var(--shadow-card)] transition-colors hover:border-primary/40 sm:flex-row sm:items-center sm:p-6"
      >
        <div className="flex items-center gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
            <GraduationCap className="size-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">Empirial Sales Agent Academy</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {completedCount} / {courseLessons.length} modules complete — work through the course and earn your
              Certified Sales Professional certificate.
            </p>
          </div>
        </div>
        <Button variant="outline" className="shrink-0">
          Open Academy <ExternalLink className="ml-1.5 size-3.5" />
        </Button>
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[220px_1fr]">
        <div className="space-y-1">
          <button
            onClick={() => setCategory("all")}
            className={cn(
              "block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
              category === "all" ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted/50",
            )}
          >
            All categories
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                category === c ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted/50",
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scripts…"
              className="pl-9"
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={BookOpen} title="No sales scripts yet" description="Your admin can add scripts here when they are ready." />
          ) : (
            <>
              {favourites.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Favourites</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {favourites.map((s) => (
                      <ScriptCard
                        key={s.id}
                        script={s}
                        onOpen={() => setReading(s)}
                        onCopy={() => copy(s)}
                        onFav={() => handleToggleFav(s)}
                        favPending={favPendingIds.has(s.id)}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
              <div>
                {favourites.length > 0 ? (
                  <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">All scripts</p>
                ) : null}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {rest.map((s) => (
                    <ScriptCard
                      key={s.id}
                      script={s}
                      onOpen={() => setReading(s)}
                      onCopy={() => copy(s)}
                      onFav={() => handleToggleFav(s)}
                      favPending={favPendingIds.has(s.id)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          <SectionCard title="Objection handling" description="Suggested responses to common customer questions">
            {objectionScripts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No objection-handling scripts have been added yet.</p>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {objectionScripts.map((s) => (
                  <AccordionItem key={s.id} value={s.id}>
                    <AccordionTrigger className="text-sm">{s.title}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">{s.body}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </SectionCard>

          <SectionCard
            title="Service information"
            description="Pricing, commission and sales points"
            action={
              <Button asChild variant="outline" size="sm">
                <Link to="/agent/services">
                  View all services <ExternalLink className="ml-1.5 size-3.5" />
                </Link>
              </Button>
            }
          >
            <p className="text-sm text-muted-foreground">
              Head to the service catalogue for pricing, commission rates and copy-ready pitches for every product.
            </p>
          </SectionCard>
        </div>
      </div>

      <Dialog open={!!reading} onOpenChange={(o) => !o && setReading(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{reading?.title}</DialogTitle>
            <DialogDescription>
              {reading?.category} · Updated {reading ? formatDate(reading.updatedAt) : ""}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-72 pr-3">
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{reading?.body}</p>
          </ScrollArea>
          <Button onClick={() => reading && copy(reading)}>
            <Copy className="mr-1.5 size-4" /> Copy script
          </Button>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function ScriptCard({
  script,
  onOpen,
  onCopy,
  onFav,
  favPending,
}: {
  script: ScriptDoc;
  onOpen: () => void;
  onCopy: () => void;
  onFav: () => void;
  favPending?: boolean;
}) {
  return (
    <Card className="gap-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <button onClick={onOpen} className="min-w-0 text-left">
          <p className="truncate text-sm font-semibold hover:underline">{script.title}</p>
          <p className="text-xs text-muted-foreground">{script.category}</p>
        </button>
        <button onClick={onFav} disabled={favPending} aria-label="Toggle favourite" className="disabled:opacity-50">
          <Star className={cn("size-4", script.favourite ? "fill-warning text-warning" : "text-muted-foreground")} />
        </button>
      </div>
      <p className="line-clamp-2 text-xs text-muted-foreground">{script.body}</p>
      <div className="flex gap-2 pt-1">
        <Button size="sm" variant="outline" className="flex-1" onClick={onOpen}>
          Read
        </Button>
        <Button size="sm" variant="ghost" onClick={onCopy}>
          <Copy className="size-3.5" />
        </Button>
      </div>
    </Card>
  );
}
