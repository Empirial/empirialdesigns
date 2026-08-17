import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckCircle2, ClipboardCheck, Download, GraduationCap, Lock, ChevronRight } from "lucide-react";
import { AppShell } from "@staff/components/layout/app-shell";
import { PageHeader } from "@staff/components/shared/page-header";
import { Button } from "@staff/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@staff/components/ui/dialog";
import { useMyDeals } from "@staff/lib/deals-data";
import { DEFAULT_CERTIFICATE_TEMPLATE, useCertificateTemplate } from "@staff/lib/certificate-template";
import { cn } from "@staff/lib/utils";
import { DEFAULT_SALES_LESSONS, useSalesTrainingLessons } from "@staff/lib/sales-training-data";
import { EXAM_QUESTIONS, useCourseProgress } from "@staff/lib/academy-data";
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

export const Route = createFileRoute("/agent/academy/")({
  head: () => ({
    meta: [
      { title: "Sales Agent Academy — Empirial CRM" },
      { name: "description", content: "The six-module Sales Agent & Client Acquisition Mini Course." },
      { property: "og:title", content: "Sales Agent Academy — Empirial CRM" },
      { property: "og:description", content: "Work through the course and earn your Certified Sales Professional certificate." },
    ],
  }),
  component: PageAgentAcademy,
});

function PageAgentAcademy() {
  const { data: courseLessons = DEFAULT_SALES_LESSONS } = useSalesTrainingLessons();
  const { data: myDeals = [] } = useMyDeals();
  const hasFirstSale = myDeals.length > 0;
  const { completedLessons, completedCount, courseComplete } = useCourseProgress(courseLessons);

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

  return (
    <AppShell>
      <PageHeader
        title="Sales Agent Academy"
        subtitle="Become a confident, customer-first sales agent."
        crumbs={[{ label: "Agent", to: "/agent/dashboard" }, { label: "Academy" }]}
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

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {courseLessons.map((lesson, index) => {
            const complete = completedLessons.has(lesson.id);
            return (
              <Link
                key={lesson.id}
                to="/agent/academy/$lessonId"
                params={{ lessonId: lesson.id }}
                className="group flex items-start gap-3 rounded-xl border border-border bg-card/85 p-4 transition-colors hover:border-primary/40 hover:bg-card"
              >
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold", complete ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground")}>
                  {complete ? <CheckCircle2 className="size-4" /> : index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold group-hover:text-primary">{lesson.title}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{lesson.duration} · {lesson.summary}</span>
                </span>
                <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            );
          })}
        </div>

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
