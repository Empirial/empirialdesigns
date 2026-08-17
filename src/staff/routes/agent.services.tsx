import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BadgePercent,
  CheckCircle2,
  Copy,
  MessageSquareQuote,
  Search,
  ShieldQuestion,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@staff/components/layout/app-shell";
import { PageHeader } from "@staff/components/shared/page-header";
import { EmptyState } from "@staff/components/shared/empty-state";
import { Badge } from "@staff/components/ui/badge";
import { Button } from "@staff/components/ui/button";
import { Input } from "@staff/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@staff/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@staff/components/ui/sheet";
import { useServices } from "@staff/lib/services-data";
import { formatZAR } from "@staff/lib/format";
import type { Service } from "@staff/lib/types";

export const Route = createFileRoute("/agent/services")({
  component: PageAgentServices,
  head: () => ({
    meta: [
      { title: "Services & Pricing · Meridian CRM" },
      {
        name: "description",
        content:
          "Browse the full service catalogue with pricing, commission rates, pitches and objection handling for every offer.",
      },
      { property: "og:title", content: "Services & Pricing · Meridian CRM" },
      {
        property: "og:description",
        content: "Pricing, commission and ready-made pitches for every Meridian service.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function commissionLabel(s: Service) {
  return s.commissionType === "percentage"
    ? `${s.commissionValue}% commission`
    : `${formatZAR(s.commissionValue)} commission`;
}

function commissionEarned(s: Service) {
  const base = s.promoPrice || s.price;
  return s.commissionType === "percentage" ? (base * s.commissionValue) / 100 : s.commissionValue;
}

function PageAgentServices() {
  const { data: services = [], isLoading } = useServices();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"name" | "price-desc" | "commission-desc">("name");
  const [active, setActive] = useState<Service | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = services
      .filter((s) => s.status === "Active")
      .filter(
        (s) =>
          !q ||
          s.name.toLowerCase().includes(q) ||
          s.short.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q),
      );
    const sorted = [...list];
    if (sort === "price-desc") sorted.sort((a, b) => b.promoPrice - a.promoPrice);
    if (sort === "commission-desc") sorted.sort((a, b) => commissionEarned(b) - commissionEarned(a));
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [services, query, sort]);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error("Could not copy — please select the text manually");
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <PageHeader
          title="Services & Pricing"
          subtitle="Everything you can sell, what it costs and what you earn on it."
          crumbs={[{ label: "Agent", to: "/agent/dashboard" }, { label: "Services" }]}
        />
        <div className="mt-6 text-sm text-muted-foreground">Loading services…</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Services & Pricing"
        subtitle="Everything you can sell, what it costs and what you earn on it."
        crumbs={[{ label: "Agent", to: "/agent/dashboard" }, { label: "Services" }]}
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search services, benefits or pitches"
            aria-label="Search services"
            className="pl-9"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <SelectTrigger className="w-full sm:w-56" aria-label="Sort services">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort: A–Z</SelectItem>
            <SelectItem value="price-desc">Sort: Highest price</SelectItem>
            <SelectItem value="commission-desc">Sort: Best commission</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={Search}
          title="No services match your search"
          description="Try a different keyword to find the offer you're looking for."
          action={
            <Button variant="outline" size="sm" onClick={() => setQuery("")}>
              Clear search
            </Button>
          }
        />
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((s) => (
            <article key={s.id} className="surface-card flex flex-col gap-4 p-5">
              <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <h2 className="text-display truncate text-base font-semibold">{s.name}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.short}</p>
                </div>
                <Badge variant="secondary" className="shrink-0 gap-1">
                  <BadgePercent className="size-3" />
                  {s.commissionType === "percentage"
                    ? `${s.commissionValue}%`
                    : formatZAR(s.commissionValue, { compact: true })}
                </Badge>
              </header>

              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-display text-xl font-semibold tabular-nums">
                  {formatZAR(s.promoPrice)}
                </span>
                {s.promoPrice < s.price ? (
                  <span className="text-sm text-muted-foreground line-through tabular-nums">
                    {formatZAR(s.price)}
                  </span>
                ) : null}
                <span className="text-xs text-muted-foreground">· {commissionLabel(s)}</span>
              </div>

              <ul className="space-y-1.5">
                {s.benefits.slice(0, 3).map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="min-w-0">{b}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-11 sm:min-h-9"
                  onClick={() => copy(s.pitch, "Pitch")}
                >
                  <Copy className="size-3.5" />
                  Copy pitch
                </Button>
                <Button size="sm" className="min-h-11 sm:min-h-9" onClick={() => setActive(s)}>
                  View details
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent className="flex w-full max-w-full flex-col gap-0 overflow-y-auto sm:max-w-lg">
          {active ? (
            <>
              <SheetHeader className="text-left">
                <SheetTitle className="text-display pr-8">{active.name}</SheetTitle>
                <SheetDescription>{active.short}</SheetDescription>
              </SheetHeader>

              <div className="mt-4 space-y-6 pb-8">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Selling price</p>
                    <p className="text-display mt-1 text-lg font-semibold tabular-nums">
                      {formatZAR(active.promoPrice)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">You earn</p>
                    <p className="text-display mt-1 text-lg font-semibold tabular-nums text-primary">
                      {formatZAR(commissionEarned(active))}
                    </p>
                  </div>
                </div>

                <section>
                  <h3 className="text-display text-sm font-semibold">What it is</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{active.description}</p>
                </section>

                <section>
                  <h3 className="text-display text-sm font-semibold">Client benefits</h3>
                  <ul className="mt-2 space-y-2">
                    {active.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span className="min-w-0">{b}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="rounded-xl border border-border bg-muted/30 p-4">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                    <h3 className="text-display flex min-w-0 items-center gap-2 text-sm font-semibold">
                      <MessageSquareQuote className="size-4 shrink-0 text-primary" />
                      Opening pitch
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Copy opening pitch"
                      onClick={() => copy(active.pitch, "Pitch")}
                    >
                      <Copy className="size-4" />
                    </Button>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{active.pitch}</p>
                </section>

                <section>
                  <h3 className="text-display flex items-center gap-2 text-sm font-semibold">
                    <ShieldQuestion className="size-4 text-primary" />
                    Objection handling
                  </h3>
                  <div className="mt-3 space-y-3">
                    {active.objections.map((o) => (
                      <div key={o.objection} className="rounded-xl border border-border p-3">
                        <p className="text-sm font-medium">“{o.objection}”</p>
                        <p className="mt-1.5 text-sm text-muted-foreground">{o.response}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <Button
                  className="w-full min-h-11"
                  onClick={() =>
                    copy(
                      `${active.name} — ${formatZAR(active.promoPrice)}\n\n${active.pitch}\n\n${active.benefits
                        .map((b) => `• ${b}`)
                        .join("\n")}`,
                      "Full service brief",
                    )
                  }
                >
                  <Sparkles className="size-4" />
                  Copy full brief for WhatsApp
                </Button>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
