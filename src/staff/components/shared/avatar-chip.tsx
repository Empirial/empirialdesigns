import { Avatar, AvatarFallback } from "@staff/components/ui/avatar";
import { cn } from "@staff/lib/utils";
import { initialsOf } from "@staff/lib/format";

export function AvatarChip({
  name,
  subtitle,
  size = "md",
  className,
  tone = "primary",
}: {
  name: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  tone?: "primary" | "muted";
}) {
  const dims = { sm: "size-7 text-[10px]", md: "size-9 text-xs", lg: "size-12 text-sm" }[size];
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <Avatar className={dims}>
        <AvatarFallback
          className={cn(
            "font-semibold",
            tone === "primary" ? "bg-primary/12 text-primary" : "bg-secondary text-secondary-foreground",
          )}
        >
          {initialsOf(name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className={cn("truncate font-medium", size === "lg" ? "text-base" : "text-sm")}>{name}</p>
        {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
    </div>
  );
}

export function UnassignedChip() {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <span className="size-7 rounded-full border border-dashed border-border" />
      Unassigned
    </span>
  );
}
