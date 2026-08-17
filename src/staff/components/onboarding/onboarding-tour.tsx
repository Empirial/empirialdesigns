import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bot,
  CheckCircle2,
  KanbanSquare,
  PhoneCall,
  Receipt,
  Rocket,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@staff/components/ui/dialog";
import { Button } from "@staff/components/ui/button";
import { Pill } from "@staff/components/shared/status-badge";
import { cn } from "@staff/lib/utils";

export const TOUR_EVENT = "meridian:start-tour";

type Step = {
  title: string;
  body: string;
  icon: React.ElementType;
  to?: string;
  linkLabel?: string;
};

const ADMIN_STEPS: Step[] = [
  {
    title: "Welcome to the Admin portal",
    body: "This is your control room: the lead database, your agents, pricing and every rand of commission live here. Three minutes now saves you a week later.",
    icon: Rocket,
  },
  {
    title: "1. Bring your leads in",
    body: "Start on Import to upload a spreadsheet of businesses, then clean up and assign them from Lead Management.",
    icon: Upload,
    to: "/admin/import",
    linkLabel: "Open Import",
  },
  {
    title: "2. Assign work to agents",
    body: "Add your sales agents and hand each one a slice of the database. Every agent only sees the leads assigned to them.",
    icon: Users,
    to: "/admin/agents",
    linkLabel: "Open Agents",
  },
  {
    title: "3. Watch the pipeline move",
    body: "The Kanban pipeline shows every deal by stage, so you can spot stalled conversations before they go cold.",
    icon: KanbanSquare,
    to: "/admin/pipeline",
    linkLabel: "Open Pipeline",
  },
  {
    title: "4. Approve commissions & review reports",
    body: "Closed deals land in Commissions for approval, and Reports gives you conversion, call volume and revenue trends.",
    icon: Receipt,
    to: "/admin/commissions",
    linkLabel: "Open Commissions",
  },
];

const AGENT_STEPS: Step[] = [
  {
    title: "Welcome to your Agent workspace",
    body: "Everything you need to call, pitch and close is in here — plus a live view of what you've earned.",
    icon: Rocket,
  },
  {
    title: "1. Start with My Leads",
    body: "Your assigned businesses live here. Open any lead to get the call workspace with contact details, notes and history.",
    icon: PhoneCall,
    to: "/agent/leads",
    linkLabel: "Open My Leads",
  },
  {
    title: "2. Log every call outcome",
    body: "After each call, log the outcome and book a follow-up. Your Follow-ups page becomes your daily call list.",
    icon: CheckCircle2,
    to: "/agent/follow-ups",
    linkLabel: "Open Follow-ups",
  },
  {
    title: "3. Pitch with scripts & pricing",
    body: "Scripts gives you openers and objection handling; Services has every package, price and your commission on it.",
    icon: Wallet,
    to: "/agent/services",
    linkLabel: "Open Services",
  },
  {
    title: "4. Ask the AI assistant, track your numbers",
    body: "Stuck on an objection? Ask the assistant. Then check Performance for your calls, conversion and earnings.",
    icon: Bot,
    to: "/agent/assistant",
    linkLabel: "Open AI Assistant",
  },
];

function storageKey(portal: "admin" | "agent") {
  return `meridian.tour.${portal}.done`;
}

export function OnboardingTour() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const portal: "admin" | "agent" = pathname.startsWith("/agent") ? "agent" : "admin";
  const steps = portal === "agent" ? AGENT_STEPS : ADMIN_STEPS;

  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(storageKey(portal))) {
        setIndex(0);
        setOpen(true);
      }
    } catch {
      /* storage unavailable — skip the tour */
    }
  }, [portal]);

  useEffect(() => {
    const onStart = () => {
      setIndex(0);
      setOpen(true);
    };
    window.addEventListener(TOUR_EVENT, onStart);
    return () => window.removeEventListener(TOUR_EVENT, onStart);
  }, []);

  const finish = () => {
    setOpen(false);
    try {
      localStorage.setItem(storageKey(portal), "1");
    } catch {
      /* ignore */
    }
  };

  const step = steps[index]!;
  const isLast = index === steps.length - 1;
  const Icon = step.icon;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) finish();
      }}
    >
      <DialogContent className="max-w-[calc(100vw-2rem)] gap-0 p-0 sm:max-w-lg">
        <div className="p-5 sm:p-6">
          <DialogHeader className="space-y-3 text-left">
            <div className="flex items-center gap-3">
              <span className="gradient-brand flex size-10 shrink-0 items-center justify-center rounded-2xl text-primary-foreground">
                <Icon className="size-5" />
              </span>
              <Pill tone="primary">
                {portal === "admin" ? "Admin walkthrough" : "Agent walkthrough"} · {index + 1}/
                {steps.length}
              </Pill>
            </div>
            <DialogTitle className="text-display text-lg font-semibold sm:text-xl">
              {step.title}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">{step.body}</DialogDescription>
          </DialogHeader>

          {step.to ? (
            <Button asChild variant="outline" size="sm" className="mt-4" onClick={finish}>
              <Link to={step.to}>
                <BarChart3 className="size-4" />
                {step.linkLabel}
              </Link>
            </Button>
          ) : null}

          <div className="mt-6 flex items-center gap-1.5" aria-hidden>
            {steps.map((s, i) => (
              <span
                key={s.title}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i <= index ? "bg-primary" : "bg-muted",
                )}
              />
            ))}
          </div>
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-2 border-t !border-slate-200 px-5 py-3 dark:!border-slate-700 sm:px-6">
          <Button variant="ghost" size="sm" onClick={finish}>
            Skip tour
          </Button>
          <div className="flex items-center gap-2">
            {index > 0 ? (
              <Button variant="outline" size="sm" onClick={() => setIndex((i) => i - 1)}>
                Back
              </Button>
            ) : null}
            <Button size="sm" onClick={() => (isLast ? finish() : setIndex((i) => i + 1))}>
              {isLast ? "Got it" : "Next"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
