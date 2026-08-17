import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Download,
  ExternalLink,
  GraduationCap,
  Lock,
  Search,
  Star,
} from "lucide-react";
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
import { useMyDeals } from "@staff/lib/deals-data";
import { DEFAULT_CERTIFICATE_TEMPLATE, useCertificateTemplate } from "@staff/lib/certificate-template";
import type { ScriptDoc } from "@staff/lib/types";
import { cn } from "@staff/lib/utils";
import { formatDate } from "@staff/lib/format";
import { DEFAULT_SALES_LESSONS, useSalesTrainingLessons } from "@staff/lib/sales-training-data";
import { useOwnProfile } from "./-admin-dashboard/use-dashboard-data";

// Pixel layout calibrated against the bundled certificate-template.webp's
// native 1492×1054 resolution (found by scanning the source PNG for the
// purple "presented to" underline and the printed "/  /" date slashes — see
// the certificate design pass). An admin-uploaded replacement template with
// different blank positions would need these recalibrated.
const CERTIFICATE_SIZE = { width: 1492, height: 1054 };
const NAME_LAYOUT = { centerX: 758, baselineY: 480 };
const DATE_CLEAR_RECT = { x: 605, y: 925, width: 260, height: 65 };
const DATE_LAYOUT = { centerX: 735, baselineY: 964 };
const CERTIFICATE_INK = "#2c0e63";
const CERTIFICATE_PAPER = "#faf9f9";

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

// The real Module 6 assessment from the EmpirialDesigns Sales Agent & Client
// Acquisition Mini Course manual — one question per pillar, converted from
// the manual's open Q&A format to multiple choice using the facilitator
// answer key as the correct option. Score 4/5+ to pass, matching the manual.
const EXAM_QUESTIONS = [
  {
    question: "Sales Fundamentals (Gitomer) — What should a salesperson focus on instead of \"pushing\" a sale?",
    options: [
      "Push harder and repeat the pitch until they say yes",
      "Give people a real reason to want to buy — build trust and lower their perceived risk",
      "Offer the lowest price immediately to remove hesitation",
    ],
    answer: 1,
  },
  {
    question: "Prospecting & Leads (Iannarino) — What's the first small \"commitment\" every salesperson needs before pitching anything?",
    options: [
      "The commitment for time — a small yes to keep the conversation going",
      "A signed contract",
      "A deposit payment",
    ],
    answer: 0,
  },
  {
    question: "Communication (Victor Antonio) — Name the three value levers every buyer ultimately cares about.",
    options: [
      "Price, features, and speed of delivery",
      "Trust, likability, and charisma",
      "Increasing revenue, reducing costs, and expanding reach or market share",
    ],
    answer: 2,
  },
  {
    question: "Closing Deals (Hormozi) — What are the four elements of the Value Equation?",
    options: [
      "Price, Product, Promotion, Place",
      "Discovery, Pitch, Objection, Close",
      "Dream Outcome, Perceived Likelihood of Achievement, Time Delay, and Effort & Sacrifice",
    ],
    answer: 2,
  },
  {
    question: "Business Growth (Gitomer) — What does \"the sale begins after the sale\" mean?",
    options: [
      "The real relationship-building — follow-up, referrals, ongoing service — happens after the first purchase",
      "You should always upsell immediately at the moment of closing",
      "Commission is only paid 30 days after the invoice",
    ],
    answer: 0,
  },
] as const;

const COURSE_STORAGE_KEY = "empirial-sales-agent-course";

function PageAgentScripts() {
  const { data: scripts = [] } = useScripts();
  const { data: courseLessons = DEFAULT_SALES_LESSONS } = useSalesTrainingLessons();
  const { data: myDeals = [] } = useMyDeals();
  const hasFirstSale = myDeals.length > 0;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [reading, setReading] = useState<ScriptDoc | null>(null);
  const [favPendingIds, setFavPendingIds] = useState<Set<string>>(new Set());
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(() => {
    try {
      const saved = window.localStorage.getItem(COURSE_STORAGE_KEY);
      return new Set<string>(saved ? JSON.parse(saved).lessons ?? [] : []);
    } catch {
      return new Set();
    }
  });
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [examOpen, setExamOpen] = useState(false);
  const [certificateOpen, setCertificateOpen] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [examScore, setExamScore] = useState<number | null>(null);
  const [certifiedAt, setCertifiedAt] = useState<Date | null>(null);
  const [certificateReady, setCertificateReady] = useState(false);
  // A callback ref (not a plain useRef) so the draw effect below re-runs the
  // instant the canvas actually mounts — Radix's Dialog portals its content
  // in asynchronously, so canvasRef.current can still be null on the same
  // render pass where certificateOpen flips to true.
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);

  const { data: ownProfile } = useOwnProfile();
  const { data: certificateTemplate = DEFAULT_CERTIFICATE_TEMPLATE } = useCertificateTemplate();
  const agentDisplayName = ownProfile?.displayName?.trim() || "Empirial Sales Agent";

  // Draws the real certificate design onto a canvas with the agent's name
  // and completion date burned in — this is what "Download certificate"
  // exports, not a print stylesheet. Coordinates are the NAME_LAYOUT/
  // DATE_LAYOUT/DATE_CLEAR_RECT constants above, calibrated against the
  // template's native 1492×1054 pixels so it stays sharp on download
  // regardless of how small the dialog renders it on screen.
  useEffect(() => {
    if (!certificateOpen || !certifiedAt || !canvasEl) return;
    const canvas = canvasEl;
    let cancelled = false;
    setCertificateReady(false);

    const image = new Image();
    // Needed for admin-uploaded templates (a different origin — Firebase
    // Storage), so the canvas isn't tainted and toBlob() below can actually
    // read pixel data. A no-op for the bundled same-origin default asset.
    image.crossOrigin = "anonymous";
    image.onload = () => {
      if (cancelled) return;
      canvas.width = CERTIFICATE_SIZE.width;
      canvas.height = CERTIFICATE_SIZE.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(image, 0, 0, CERTIFICATE_SIZE.width, CERTIFICATE_SIZE.height);

      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = CERTIFICATE_INK;
      ctx.font = "italic 700 46px Georgia, 'Times New Roman', serif";
      ctx.fillText(agentDisplayName, NAME_LAYOUT.centerX, NAME_LAYOUT.baselineY);

      // The template prints a blank "/  /" date line — clear it and write
      // the real completion date over it rather than fighting its spacing.
      ctx.fillStyle = CERTIFICATE_PAPER;
      ctx.fillRect(DATE_CLEAR_RECT.x, DATE_CLEAR_RECT.y, DATE_CLEAR_RECT.width, DATE_CLEAR_RECT.height);
      ctx.fillStyle = CERTIFICATE_INK;
      ctx.font = "600 28px Georgia, 'Times New Roman', serif";
      const dateLabel = certifiedAt.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
      ctx.fillText(dateLabel, DATE_LAYOUT.centerX, DATE_LAYOUT.baselineY);

      setCertificateReady(true);
    };
    image.onerror = () => {
      if (!cancelled) toast.error("Couldn't load the certificate design — try reopening this dialog.");
    };
    image.src = certificateTemplate.imageUrl;

    return () => {
      cancelled = true;
    };
  }, [certificateOpen, certifiedAt, canvasEl, certificateTemplate.imageUrl, agentDisplayName]);

  const downloadCertificate = () => {
    const canvas = canvasEl;
    if (!canvas || !certificateReady) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fileSafeName = agentDisplayName.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "agent";
      link.href = url;
      link.download = `EmpirialDesigns-Certificate-${fileSafeName}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

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
  const completedCount = courseLessons.filter((lesson) => completedLessons.has(lesson.id)).length;
  const courseComplete = courseLessons.length > 0 && completedCount === courseLessons.length;

  useEffect(() => {
    try {
      window.localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify({ lessons: [...completedLessons] }));
    } catch {
      // The course remains usable even if browser storage is unavailable.
    }
  }, [completedLessons]);

  const toggleLesson = (id: string) => {
    setCompletedLessons((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submitExam = () => {
    const correct = EXAM_QUESTIONS.filter((question, index) => answers[index] === question.answer).length;
    const score = Math.round((correct / EXAM_QUESTIONS.length) * 100);
    setExamScore(score);
    if (score >= 80) {
      setExamOpen(false);
      setCertifiedAt(new Date());
      setCertificateOpen(true);
      toast.success("You passed the Sales Agent Certification!");
    } else {
      toast.error("You need 80% to pass. Review the lessons and try again.");
    }
  };

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

      <section className="mt-6 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-card p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
              <GraduationCap className="size-5" /> Empirial Sales Agent Academy
            </div>
            <h2 className="text-xl font-bold">Become a confident, customer-first sales agent</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Work through the six-module Sales Agent & Client Acquisition Mini Course, pass the final assessment,
              and earn your Certified Sales Professional certificate.
            </p>
          </div>
          <div className="min-w-48 rounded-xl border border-border bg-card/90 p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Course progress</p>
            <p className="mt-1 text-2xl font-bold">{completedCount} / {courseLessons.length}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${courseLessons.length ? (completedCount / courseLessons.length) * 100 : 0}%` }} />
            </div>
          </div>
        </div>

        <Accordion type="single" collapsible className="mt-6 rounded-xl border border-border bg-card/85 px-4">
          {courseLessons.map((lesson, index) => {
            const complete = completedLessons.has(lesson.id);
            return (
              <AccordionItem key={lesson.id} value={lesson.id}>
                <AccordionTrigger className="gap-3 py-4 text-left hover:no-underline">
                  <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold", complete ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground")}>
                    {complete ? <CheckCircle2 className="size-4" /> : index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{lesson.title}</span>
                    <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{lesson.duration} · {lesson.summary}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-4 pl-10">
                  {lesson.mentors && lesson.mentors.length > 0 ? (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {lesson.mentors.map((mentor) => (
                        <span key={mentor} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                          {mentor}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {lesson.points.map((point) => <li key={point} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />{point}</li>)}
                  </ul>

                  {lesson.body ? (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedLessons((previous) => {
                          const next = new Set(previous);
                          if (next.has(lesson.id)) next.delete(lesson.id);
                          else next.add(lesson.id);
                          return next;
                        })
                      }
                      className="mt-3 text-xs font-semibold text-primary hover:underline"
                    >
                      {expandedLessons.has(lesson.id) ? "Hide full lesson" : "Read full lesson"}
                    </button>
                  ) : null}

                  {lesson.body && expandedLessons.has(lesson.id) ? (
                    <div className="mt-3 space-y-4">
                      <ScrollArea className="h-64 rounded-lg border border-border bg-muted/30 p-4">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{lesson.body}</p>
                      </ScrollArea>
                      {lesson.activity ? (
                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                          <p className="text-xs font-semibold tracking-wide text-primary uppercase">Activity</p>
                          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{lesson.activity}</p>
                        </div>
                      ) : null}
                      {lesson.keyTakeaway ? (
                        <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
                          <p className="text-xs font-semibold tracking-wide text-warning-foreground uppercase">Key takeaway</p>
                          <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{lesson.keyTakeaway}</p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <Button className="mt-4" size="sm" variant={complete ? "outline" : "default"} onClick={() => toggleLesson(lesson.id)}>
                    <CheckCircle2 className="mr-1.5 size-4" /> {complete ? "Mark as incomplete" : "Mark lesson complete"}
                  </Button>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-border bg-card/90 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <ClipboardCheck className="mt-0.5 size-5 shrink-0 text-primary" />
            <div><p className="text-sm font-semibold">Final Sales Agent Assessment</p><p className="text-xs text-muted-foreground">Pass with 80% or more to receive your certificate.</p></div>
          </div>
          <Button disabled={!courseComplete} onClick={() => { setAnswers([]); setExamScore(null); setExamOpen(true); }}>
            {courseComplete ? <ClipboardCheck className="mr-1.5 size-4" /> : <Lock className="mr-1.5 size-4" />}
            Take final exam
          </Button>
        </div>
      </section>

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

      <Dialog open={examOpen} onOpenChange={setExamOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>Sales Agent Certification Exam</DialogTitle><DialogDescription>Choose the best answer for every question. You need at least 80% to pass.</DialogDescription></DialogHeader>
          <div className="space-y-5">
            {EXAM_QUESTIONS.map((question, questionIndex) => (
              <fieldset key={question.question} className="rounded-xl border border-border p-4">
                <legend className="px-1 text-sm font-semibold">{questionIndex + 1}. {question.question}</legend>
                <div className="mt-3 space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <label key={option} className={cn("flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors", answers[questionIndex] === optionIndex ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50")}>
                      <input type="radio" name={`question-${questionIndex}`} checked={answers[questionIndex] === optionIndex} onChange={() => setAnswers((previous) => { const next = [...previous]; next[questionIndex] = optionIndex; return next; })} />
                      {option}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          {examScore !== null ? <p className="text-sm font-medium">Latest score: {examScore}%</p> : null}
          <Button disabled={answers.filter((answer) => answer !== undefined).length !== EXAM_QUESTIONS.length} onClick={submitExam}>Submit exam</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={certificateOpen} onOpenChange={setCertificateOpen}>
        <DialogContent className="max-w-2xl text-center">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Certified Sales Professional</DialogTitle>
            <DialogDescription className="text-center">
              This certifies that you have completed the EmpirialDesigns Sales Agent & Client Acquisition Mini
              Course. Download it below — your name and completion date are printed onto the real design, ready to
              save or print yourself.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
            <canvas ref={setCanvasEl} className="block h-auto w-full" aria-label={`Certificate of completion for ${agentDisplayName}`} />
            {!certificateReady && (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Preparing your certificate…</div>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Final exam score: <span className="font-semibold text-foreground">{examScore}%</span>
          </p>

          <Button onClick={downloadCertificate} disabled={!certificateReady}>
            <Download className="mr-1.5 size-4" /> Download certificate
          </Button>

          {/* The digital certificate above is earned by passing the assessment. The
              signed physical copy is a separate incentive that only unlocks once the
              agent closes a real deal — see useMyDeals() above, not a stub check. */}
          <div className={cn("rounded-xl border p-4 text-left", hasFirstSale ? "border-success/40 bg-success/10" : "border-border bg-muted/30")}>
            <p className={cn("text-xs font-semibold tracking-wide uppercase", hasFirstSale ? "text-success" : "text-muted-foreground")}>
              Physical certificate
            </p>
            {hasFirstSale ? (
              <p className="mt-1.5 text-sm text-foreground/90">
                🎉 You've closed your first sale — you now qualify for a free, signed physical copy of this
                certificate. Ask your manager to have it printed for you.
              </p>
            ) : (
              <p className="mt-1.5 text-sm text-muted-foreground">
                Your downloadable digital certificate is ready above. A free, signed physical copy unlocks the
                moment you close your first sale — no charge for your first one.
              </p>
            )}
          </div>
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
