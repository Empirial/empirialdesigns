import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@staff/lib/utils";
import type { LeadStatus } from "@staff/lib/types";

const statusBadge = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors",
  {
    variants: {
      tone: {
        neutral: "border-border bg-muted text-muted-foreground",
        info: "border-info/25 bg-info/10 text-info",
        primary: "border-primary/25 bg-primary/10 text-primary",
        success: "border-success/25 bg-success/10 text-success",
        warning: "border-warning/35 bg-warning/15 text-warning-foreground",
        danger: "border-destructive/25 bg-destructive/10 text-destructive",
        violet: "border-chart-5/25 bg-chart-5/10 text-chart-5",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px]",
        md: "px-2.5 py-0.5 text-xs",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof statusBadge>["tone"]>;

export const LEAD_STATUS_TONE: Record<LeadStatus, BadgeTone> = {
  New: "info",
  Assigned: "violet",
  "Not Called": "neutral",
  Called: "info",
  Interested: "primary",
  "Follow-up": "warning",
  "Proposal Sent": "violet",
  "Closed Won": "success",
  "Closed Lost": "danger",
  "Not Interested": "danger",
};

export const LEAD_STATUS_DOT: Record<LeadStatus, string> = {
  New: "bg-info",
  Assigned: "bg-chart-5",
  "Not Called": "bg-muted-foreground",
  Called: "bg-info",
  Interested: "bg-primary",
  "Follow-up": "bg-warning",
  "Proposal Sent": "bg-chart-5",
  "Closed Won": "bg-success",
  "Closed Lost": "bg-destructive",
  "Not Interested": "bg-destructive",
};

export function StatusBadge({
  status,
  className,
  size,
}: {
  status: LeadStatus;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span className={cn(statusBadge({ tone: LEAD_STATUS_TONE[status], size }), className)}>
      <span className={cn("size-1.5 rounded-full", LEAD_STATUS_DOT[status])} />
      {status}
    </span>
  );
}

export function Pill({
  children,
  tone,
  size,
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  size?: "sm" | "md";
  className?: string;
}) {
  return <span className={cn(statusBadge({ tone, size }), className)}>{children}</span>;
}

export function PaymentBadge({ status }: { status: "Pending" | "Approved" | "Paid" }) {
  const tone: BadgeTone = status === "Paid" ? "success" : status === "Approved" ? "info" : "warning";
  return <Pill tone={tone}>{status}</Pill>;
}
