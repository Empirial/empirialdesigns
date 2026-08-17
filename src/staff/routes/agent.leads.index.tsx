import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  LayoutGrid,
  List,
  PhoneCall,
  Search,
  ThumbsDown,
  Workflow,
} from "lucide-react";
import { AppShell } from "@staff/components/layout/app-shell";
import { PageHeader } from "@staff/components/shared/page-header";
import { EmptyState } from "@staff/components/shared/empty-state";
import { TablePagination } from "@staff/components/shared/table-pagination";
import { StatusBadge } from "@staff/components/shared/status-badge";
import { Pill } from "@staff/components/shared/status-badge";
import { Button } from "@staff/components/ui/button";
import { Input } from "@staff/components/ui/input";
import { Card } from "@staff/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@staff/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@staff/components/ui/table";
import { INDUSTRIES, LOCATIONS } from "@staff/components/leads-admin/constants";
import { invalidateLeadQueries, updateOwnLeadStatus, useMyLeads } from "@staff/lib/leads";
import { useServices } from "@staff/lib/services-data";
import { LEAD_STATUSES, type Lead } from "@staff/lib/types";
import { formatDate, formatZAR, isOverdue } from "@staff/lib/format";
import { cn } from "@staff/lib/utils";

export const Route = createFileRoute("/agent/leads/")({
  head: () => ({
    meta: [
      { title: "My Leads — Meridian CRM" },
      { name: "description", content: "Your assigned leads, ready to call." },
      { property: "og:title", content: "My Leads — Meridian CRM" },
      { property: "og:description", content: "The sales-agent portal lead list." },
    ],
  }),
  component: PageAgentLeadsIndex,
});

const ALL = "all";
const STATUS_CHIPS = ["Not Called", "Called", "Interested", "Follow-up", "Proposal Sent", "Closed Won"] as const;

function PageAgentLeadsIndex() {
  const { data: myLeads = [], isLoading, error } = useMyLeads();
  const { data: services = [] } = useServices();
  const serviceOf = (id: string | null) => services.find((s) => s.id === id) ?? null;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>(ALL);
  const [industry, setIndustry] = useState<string>(ALL);
  const [location, setLocation] = useState<string>(ALL);
  const [sort, setSort] = useState<"newest" | "followup" | "value">("newest");
  const [view, setView] = useState<"table" | "cards">("table");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = myLeads.filter((l) => {
      if (q) {
        const hay = `${l.business} ${l.contactPerson} ${l.phone} ${l.email}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (status !== ALL && l.status !== status) return false;
      if (industry !== ALL && l.industry !== industry) return false;
      if (location !== ALL && l.location !== location) return false;
      return true;
    });
    rows = [...rows].sort((a, b) => {
      if (sort === "value") return b.value - a.value;
      if (sort === "followup") {
        if (!a.nextFollowUp) return 1;
        if (!b.nextFollowUp) return -1;
        return new Date(a.nextFollowUp).getTime() - new Date(b.nextFollowUp).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return rows;
  }, [myLeads, search, status, industry, location, sort]);

  useEffect(() => setPage(1), [search, status, industry, location, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of myLeads) m.set(l.status, (m.get(l.status) ?? 0) + 1);
    return m;
  }, [myLeads]);

  const clearAll = () => {
    setSearch("");
    setStatus(ALL);
    setIndustry(ALL);
    setLocation(ALL);
  };

  const markNotInterested = async (lead: Lead) => {
    try {
      await updateOwnLeadStatus(lead.id, "Not Interested");
      invalidateLeadQueries(queryClient);
      toast.success(`${lead.business} marked as not interested`);
    } catch {
      toast.error("Couldn't update that lead — try again.");
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <PageHeader title="My Leads" crumbs={[{ label: "Agent", to: "/agent/dashboard" }, { label: "My Leads" }]} />
        <div className="mt-6 text-sm text-muted-foreground">Loading your leads…</div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <PageHeader title="My Leads" crumbs={[{ label: "Agent", to: "/agent/dashboard" }, { label: "My Leads" }]} />
        <div className="mt-6 text-sm text-destructive">Couldn't load your leads — try refreshing.</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="My Leads"
        subtitle={`${myLeads.length} leads assigned to you`}
        crumbs={[{ label: "Agent", to: "/agent/dashboard" }, { label: "My Leads" }]}
      />

      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_CHIPS.map((s) => {
            const active = status === s;
            return (
              <button
                key={s}
                onClick={() => setStatus(active ? ALL : s)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/50",
                )}
              >
                {s}
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums">
                  {counts.get(s) ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        <div className="surface-card flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search business, contact or phone…"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {LEAD_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Industry" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All industries</SelectItem>
                {INDUSTRIES.map((i) => (
                  <SelectItem key={i} value={i}>{i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Location" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All locations</SelectItem>
                {LOCATIONS.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="followup">Follow-up due</SelectItem>
                <SelectItem value="value">Highest value</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center rounded-lg border border-border p-0.5">
              <Button
                size="icon"
                variant={view === "table" ? "secondary" : "ghost"}
                className="size-8"
                onClick={() => setView("table")}
                aria-label="Table view"
              >
                <List className="size-4" />
              </Button>
              <Button
                size="icon"
                variant={view === "cards" ? "secondary" : "ghost"}
                className="size-8"
                onClick={() => setView("cards")}
                aria-label="Card view"
              >
                <LayoutGrid className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Workflow}
            title="No leads match your filters"
            description="Try adjusting or clearing your search and filters."
            action={<Button variant="outline" onClick={clearAll}>Clear all filters</Button>}
          />
        ) : view === "table" ? (
          <div className="surface-card overflow-hidden p-0">
            <div className="scrollbar-slim overflow-x-auto">
              <Table className="min-w-[1300px]">
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Contact</TableHead>
                    <TableHead>Next Follow-up</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((lead) => {
                    const svc = serviceOf(lead.serviceId);
                    const overdue = isOverdue(lead.nextFollowUp);
                    return (
                      <TableRow key={lead.id} className="hover:bg-muted/40">
                        <TableCell>
                          <p className="font-medium">{lead.business}</p>
                          <p className="text-xs text-muted-foreground">{lead.contactPerson}</p>
                        </TableCell>
                        <TableCell>
                          <p>{lead.contactPerson}</p>
                          <p className="text-xs text-muted-foreground">{lead.role}</p>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <a
                            href={`tel:${lead.phone}`}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                          >
                            <PhoneCall className="size-3.5" />
                            {lead.phone}
                          </a>
                        </TableCell>
                        <TableCell>{lead.industry}</TableCell>
                        <TableCell>{lead.location}</TableCell>
                        <TableCell className="max-w-[160px] truncate">{svc?.short ?? "—"}</TableCell>
                        <TableCell className="tabular-nums">{formatZAR(lead.value)}</TableCell>
                        <TableCell><StatusBadge status={lead.status} /></TableCell>
                        <TableCell className="tabular-nums">{formatDate(lead.lastContact)}</TableCell>
                        <TableCell className={overdue ? "font-medium text-destructive tabular-nums" : "tabular-nums"}>
                          {formatDate(lead.nextFollowUp)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => markNotInterested(lead)}
                          >
                            <ThumbsDown className="size-3.5" />
                            Not interested
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <TablePagination
              page={pageSafe}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              label="leads"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pageRows.map((lead) => {
              const svc = serviceOf(lead.serviceId);
              const overdue = isOverdue(lead.nextFollowUp);
              return (
                <Card
                  key={lead.id}
                  className="gap-3 p-4 transition-shadow hover:shadow-[var(--shadow-card)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{lead.business}</p>
                      <p className="text-xs text-muted-foreground">{lead.contactPerson} · {lead.role}</p>
                    </div>
                    <StatusBadge status={lead.status} size="sm" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Pill tone="neutral" size="sm">{lead.industry}</Pill>
                    <Pill tone="neutral" size="sm">{lead.location}</Pill>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{svc?.short ?? "No service"}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold tabular-nums">{formatZAR(lead.value)}</span>
                    <span className={cn("text-xs tabular-nums", overdue && "font-medium text-destructive")}>
                      Follow-up: {formatDate(lead.nextFollowUp)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={`tel:${lead.phone}`}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border py-1.5 text-xs font-medium hover:bg-muted/50"
                    >
                      <PhoneCall className="size-3.5" /> Call
                    </a>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => markNotInterested(lead)}
                    >
                      <ThumbsDown className="size-3.5" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {view === "cards" && filtered.length > 0 ? (
          <TablePagination
            page={pageSafe}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            label="leads"
          />
        ) : null}
      </div>
    </AppShell>
  );
}
