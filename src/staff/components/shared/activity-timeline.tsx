import {
  Bot,
  CheckCircle2,
  FileText,
  Handshake,
  Mail,
  PhoneCall,
  StickyNote,
  UserPlus,
} from "lucide-react";
import { relativeTime } from "@staff/lib/format";
import type { ActivityItem } from "@staff/lib/types";
import { cn } from "@staff/lib/utils";

const ICONS = {
  call: PhoneCall,
  note: StickyNote,
  status: CheckCircle2,
  email: Mail,
  assignment: UserPlus,
  deal: Handshake,
  followup: FileText,
} as const;

const TONES: Record<ActivityItem["type"], string> = {
  call: "bg-info/10 text-info",
  note: "bg-secondary text-secondary-foreground",
  status: "bg-primary/10 text-primary",
  email: "bg-chart-5/10 text-chart-5",
  assignment: "bg-warning/15 text-warning-foreground",
  deal: "bg-success/10 text-success",
  followup: "bg-muted text-muted-foreground",
};

export function ActivityTimeline({
  items,
  className,
  emptyLabel = "No activity logged yet.",
}: {
  items: ActivityItem[];
  className?: string;
  emptyLabel?: string;
}) {
  if (!items.length) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <ol className={cn("relative space-y-4", className)}>
      <span className="absolute top-2 bottom-2 left-[15px] w-px bg-border" aria-hidden />
      {items.map((item) => {
        const Icon = ICONS[item.type] ?? Bot;
        return (
          <li key={item.id} className="relative flex gap-3">
            <span
              className={cn(
                "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-card",
                TONES[item.type],
              )}
            >
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="text-sm font-medium">{item.title}</p>
                <span className="text-xs text-muted-foreground">{relativeTime(item.at)}</span>
              </div>
              {item.detail ? (
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
              ) : null}
              <p className="mt-1 text-xs text-muted-foreground/80">by {item.actor}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
