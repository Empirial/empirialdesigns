import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import { AppShell } from "@staff/components/layout/app-shell";
import { PageHeader } from "@staff/components/shared/page-header";
import { EmptyState } from "@staff/components/shared/empty-state";
import { Button } from "@staff/components/ui/button";
import { DEFAULT_SALES_LESSONS, useSalesTrainingLessons, type TrainingLesson } from "@staff/lib/sales-training-data";
import { useCourseProgress } from "@staff/lib/academy-data";
import { cn } from "@staff/lib/utils";

export const Route = createFileRoute("/agent/academy/$lessonId")({
  head: () => ({
    meta: [{ title: "Lesson — Sales Agent Academy — Empirial CRM" }],
  }),
  component: PageAgentAcademyLesson,
});

function PageAgentAcademyLesson() {
  const { lessonId } = Route.useParams();
  const { data: courseLessons = DEFAULT_SALES_LESSONS } = useSalesTrainingLessons();
  const { completedLessons, toggleLesson } = useCourseProgress(courseLessons);
  const [quizPassed, setQuizPassed] = useState(false);

  const index = courseLessons.findIndex((l) => l.id === lessonId);
  const lesson = index >= 0 ? courseLessons[index] : undefined;
  const previous = index > 0 ? courseLessons[index - 1] : undefined;
  const next = index >= 0 && index < courseLessons.length - 1 ? courseLessons[index + 1] : undefined;

  // Reset quiz-passed state on navigating to a different lesson.
  useEffect(() => {
    setQuizPassed(false);
  }, [lessonId]);

  if (!lesson) {
    return (
      <AppShell>
        <PageHeader
          title="Lesson not found"
          crumbs={[{ label: "Agent", to: "/agent/dashboard" }, { label: "Academy", to: "/agent/academy" }, { label: "Lesson" }]}
        />
        <div className="mt-6">
          <EmptyState
            title="This lesson doesn't exist"
            description="It may have been removed or renamed. Head back to the Academy to pick a module."
          />
          <Button asChild className="mt-4">
            <Link to="/agent/academy">Back to Academy</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const complete = completedLessons.has(lesson.id);

  return (
    <AppShell>
      <PageHeader
        title={lesson.title}
        subtitle={`${lesson.duration} · Module ${index + 1} of ${courseLessons.length}`}
        crumbs={[{ label: "Agent", to: "/agent/dashboard" }, { label: "Academy", to: "/agent/academy" }, { label: lesson.title }]}
      />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <article className="surface-card p-6 sm:p-8">
          {lesson.mentors && lesson.mentors.length > 0 ? (
            <div className="mb-5 flex flex-wrap gap-1.5">
              {lesson.mentors.map((mentor) => (
                <span key={mentor} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {mentor}
                </span>
              ))}
            </div>
          ) : null}

          <p className="text-base leading-relaxed text-muted-foreground">{lesson.summary}</p>

          <div className="mt-6 rounded-xl border border-border bg-muted/30 p-5">
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">In this lesson</p>
            <ul className="mt-3 space-y-2.5 text-sm text-foreground/90">
              {lesson.points.map((point) => (
                <li key={point} className="flex gap-2.5">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {lesson.body ? (
            <div className="prose-academy mt-8 space-y-5 text-[15px] leading-[1.8] text-foreground/90">
              {lesson.body.split("\n\n").map((paragraph, i) => (
                <p key={i} className="whitespace-pre-wrap">{paragraph}</p>
              ))}
            </div>
          ) : null}

          {lesson.quiz && lesson.quiz.length > 0 ? (
            <LessonQuiz key={lesson.id} quiz={lesson.quiz} onPass={() => setQuizPassed(true)} />
          ) : lesson.activity ? (
            <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-5">
              <p className="text-xs font-semibold tracking-wide text-primary uppercase">Activity</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">{lesson.activity}</p>
            </div>
          ) : null}

          {lesson.keyTakeaway ? (
            <div className="mt-5 rounded-xl border border-warning/30 bg-warning/10 p-5">
              <p className="text-xs font-semibold tracking-wide text-warning-foreground uppercase">Key takeaway</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">{lesson.keyTakeaway}</p>
            </div>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Button
                variant={complete ? "outline" : "default"}
                disabled={!complete && Boolean(lesson.quiz?.length) && !quizPassed}
                onClick={() => toggleLesson(lesson.id)}
              >
                <CheckCircle2 className="mr-1.5 size-4" /> {complete ? "Mark as incomplete" : "Mark lesson complete"}
              </Button>
              {!complete && lesson.quiz?.length && !quizPassed ? (
                <p className="mt-1.5 text-xs text-muted-foreground">Pass the quiz above to unlock this.</p>
              ) : null}
            </div>
            <div className="flex gap-2">
              {previous ? (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/agent/academy/$lessonId" params={{ lessonId: previous.id }}>
                    <ArrowLeft className="mr-1.5 size-4" /> {previous.title.replace(/^Module \d+ · /, "")}
                  </Link>
                </Button>
              ) : null}
              {next ? (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/agent/academy/$lessonId" params={{ lessonId: next.id }}>
                    {next.title.replace(/^Module \d+ · /, "")} <ArrowRight className="ml-1.5 size-4" />
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </article>

        <aside className="space-y-2">
          <p className="px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">Course modules</p>
          {courseLessons.map((l, i) => {
            const isCurrent = l.id === lesson.id;
            const isComplete = completedLessons.has(l.id);
            return (
              <Link
                key={l.id}
                to="/agent/academy/$lessonId"
                params={{ lessonId: l.id }}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                  isCurrent ? "border-primary/40 bg-primary/10 font-medium text-primary" : "border-border hover:bg-muted/50",
                )}
              >
                <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold", isComplete ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground")}>
                  {isComplete ? <CheckCircle2 className="size-3.5" /> : i + 1}
                </span>
                <span className="truncate">{l.title.replace(/^Module \d+ · /, "")}</span>
              </Link>
            );
          })}
          <Button asChild variant="outline" size="sm" className="mt-2 w-full">
            <Link to="/agent/academy">Back to Academy overview</Link>
          </Button>
        </aside>
      </div>
    </AppShell>
  );
}

function LessonQuiz({ quiz, onPass }: { quiz: NonNullable<TrainingLesson["quiz"]>; onPass: () => void }) {
  const [answers, setAnswers] = useState<(number | undefined)[]>(() => quiz.map(() => undefined));
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = answers.every((a) => a !== undefined);
  const correctCount = quiz.filter((q, i) => answers[i] === q.answer).length;
  const passed = submitted && correctCount === quiz.length;

  function handleSubmit() {
    setSubmitted(true);
    if (quiz.every((q, i) => answers[i] === q.answer)) {
      onPass();
    }
  }

  function retry() {
    setAnswers(quiz.map(() => undefined));
    setSubmitted(false);
  }

  return (
    <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-5">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-primary uppercase">
        <HelpCircle className="size-4" /> Quick quiz
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Get every question right to mark this lesson complete.</p>

      <div className="mt-4 space-y-4">
        {quiz.map((question, qIndex) => {
          const selected = answers[qIndex];
          const isCorrect = submitted && selected === question.answer;
          const isWrong = submitted && selected !== undefined && selected !== question.answer;
          return (
            <fieldset key={question.question} className="rounded-lg border border-border bg-card p-4">
              <legend className="flex items-start gap-2 px-1 text-sm font-medium">
                {submitted ? (
                  isCorrect ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  ) : (
                    <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                  )
                ) : null}
                <span>{question.question}</span>
              </legend>
              <div className="mt-2 space-y-1.5">
                {question.options.map((option, oIndex) => {
                  const isSelected = selected === oIndex;
                  const showAsCorrect = submitted && oIndex === question.answer;
                  const showAsWrongPick = submitted && isSelected && oIndex !== question.answer;
                  return (
                    <label
                      key={option}
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors",
                        showAsCorrect
                          ? "border-success/40 bg-success/10"
                          : showAsWrongPick
                            ? "border-destructive/40 bg-destructive/10"
                            : isSelected
                              ? "border-primary bg-primary/10"
                              : "border-border hover:bg-muted/50",
                      )}
                    >
                      <input
                        type="radio"
                        name={`quiz-${question.question}`}
                        checked={isSelected}
                        disabled={submitted}
                        onChange={() =>
                          setAnswers((prev) => {
                            const next = [...prev];
                            next[qIndex] = oIndex;
                            return next;
                          })
                        }
                      />
                      {option}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-3">
        {!submitted ? (
          <Button size="sm" disabled={!allAnswered} onClick={handleSubmit}>
            Check answers
          </Button>
        ) : passed ? (
          <p className="text-sm font-medium text-success">All correct — lesson unlocked below.</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{correctCount} / {quiz.length} correct — give it another go.</p>
            <Button size="sm" variant="outline" onClick={retry}>
              Try again
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
