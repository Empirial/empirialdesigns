import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Plus, Search, Upload, Download, X, MoreHorizontal, Trash2, UserPlus, Eye, Pencil, CheckCircle2 } from "lucide-react";
import { AppShell } from "@staff/components/layout/app-shell";
import { PageHeader } from "@staff/components/shared/page-header";
import { EmptyState } from "@staff/components/shared/empty-state";
import { TablePagination } from "@staff/components/shared/table-pagination";
import { AvatarChip, UnassignedChip } from "@staff/components/shared/avatar-chip";
import { StatusBadge } from "@staff/components/shared/status-badge";
import { LeadFormDialog, type LeadFormPatch } from "@staff/components/leads-admin/lead-form-dialog";
import { INDUSTRIES, LOCATIONS } from "@staff/components/leads-admin/constants";
import { Button } from "@staff/components/ui/button";
import { Input } from "@staff/components/ui/input";
import { Checkbox } from "@staff/components/ui/checkbox";
import { Skeleton } from "@staff/components/ui/skeleton";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@staff/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@staff/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@staff/components/ui/dialog";
import { useAgents } from "@staff/lib/agents-data";
import { useServices } from "@staff/lib/services-data";
import { createLead, invalidateLeadQueries, updateOwnLeadStatus, useLeads } from "@staff/lib/leads";
import { callBulkAssignLeads, callBulkDeleteLeads, callBulkSetLeadStatus } from "@staff/lib/functions";
import { firebaseAuth } from "@staff/lib/auth";
import { db } from "@staff/lib/firebase";
import { LEAD_STATUSES, type Lead, type LeadStatus } from "@staff/lib/types";
import { formatDate, isOverdue } from "@staff/lib/format";

export const Route = createFileRoute("/admin/leads")({
  head: () => ({
    meta: [
      { title: "Lead Management — Meridian CRM" },
      { name: "description", content: "Search, filter, assign and manage the full Meridian CRM lead database." },
      { property: "og:title", content: "Lead Management — Meridian CRM" },
      { property: "og:description", content: "Master lead database for the Meridian sales team." },
    ],
  }),
  component: PageAdminLeads,
});

const ALL = "all";

function PageAdminLeads() {
  const { data: leads = [], isLoading: loading } = useLeads();
  const { data: agents = [] } = useAgents();
  const { data: services = [] } = useServices();
  const queryClient = useQueryClient();

  const agentOf = (id: string | null) => agents.find((a) => a.id === id) ?? null;
  const serviceOf = (id: string | null) => services.find((s) => s.id === id) ?? null;

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>(ALL);
  const [agent, setAgent] = useState<string>(ALL);
  const [industry, setIndustry] = useState<string>(ALL);
  const [location, setLocation] = useState<string>(ALL);
  const [service, setService] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [assignTarget, setAssignTarget] = useState<Lead | string[] | null>(null);
  const [assignAgentId, setAssignAgentId] = useState<string>("");
  const [deleteTarget, setDeleteTarget] = useState<string[] | null>(null);
  const [quickAssignOpen, setQuickAssignOpen] = useState(false);
  const [quickAssignAgentId, setQuickAssignAgentId] = useState("");
  const [quickAssignCount, setQuickAssignCount] = useState("100");

  const [bulkAssignPending, setBulkAssignPending] = useState(false);
  const [bulkStatusPending, setBulkStatusPending] = useState(false);
  const [assignDialogPending, setAssignDialogPending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (q) {
        const hay = `${l.business} ${l.contactPerson} ${l.phone} ${l.email}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (status !== ALL && l.status !== status) return false;
      if (agent !== ALL) {
        if (agent === "unassigned" ? l.assignedAgentId !== null : l.assignedAgentId !== agent) return false;
      }
      if (industry !== ALL && l.industry !== industry) return false;
      if (location !== ALL && l.location !== location) return false;
      if (service !== ALL && l.serviceId !== service) return false;
      return true;
    });
  }, [leads, search, status, agent, industry, location, service]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  useEffect(() => setPage(1), [search, status, agent, industry, location, service]);

  const unassignedCount = leads.filter((l) => l.assignedAgentId === null).length;

  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (search) chips.push({ key: "search", label: `Search: "${search}"`, clear: () => setSearch("") });
  if (status !== ALL) chips.push({ key: "status", label: `Status: ${status}`, clear: () => setStatus(ALL) });
  if (agent !== ALL)
    chips.push({
      key: "agent",
      label: `Agent: ${agent === "unassigned" ? "Unassigned" : agentOf(agent)?.name ?? agent}`,
      clear: () => setAgent(ALL),
    });
  if (industry !== ALL) chips.push({ key: "industry", label: `Industry: ${industry}`, clear: () => setIndustry(ALL) });
  if (location !== ALL) chips.push({ key: "location", label: `Location: ${location}`, clear: () => setLocation(ALL) });
  if (service !== ALL)
    chips.push({ key: "service", label: `Service: ${serviceOf(service)?.name ?? service}`, clear: () => setService(ALL) });

  const clearAll = () => {
    setSearch("");
    setStatus(ALL);
    setAgent(ALL);
    setIndustry(ALL);
    setLocation(ALL);
    setService(ALL);
  };

  const toggleRow = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const allPageSelected = pageRows.length > 0 && pageRows.every((l) => selected.has(l.id));
  const toggleAllPage = (checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      pageRows.forEach((l) => (checked ? next.add(l.id) : next.delete(l.id)));
      return next;
    });
  };

  const selectedIds = Array.from(selected);

  const handleExport = () => toast.success(`Exported ${filtered.length} leads to CSV`);

  const handleBulkAssign = async (agentUid: string) => {
    setBulkAssignPending(true);
    try {
      await callBulkAssignLeads({ leadIds: selectedIds, agentUid });
      invalidateLeadQueries(queryClient);
      toast.success(`Assigned ${selectedIds.length} leads to ${agentOf(agentUid)?.name ?? "agent"}`);
      setSelected(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't assign those leads — try again.");
    } finally {
      setBulkAssignPending(false);
    }
  };

  const handleQuickAssign = async () => {
    const count = Math.floor(Number(quickAssignCount));
    if (!quickAssignAgentId || !Number.isFinite(count) || count < 1) {
      toast.error("Choose an agent and a valid number of leads.");
      return;
    }
    const ids = filtered.filter((lead) => lead.assignedAgentId === null).slice(0, count).map((lead) => lead.id);
    if (!ids.length) { toast.error("No unassigned leads match the current filters."); return; }
    setBulkAssignPending(true);
    try {
      await callBulkAssignLeads({ leadIds: ids, agentUid: quickAssignAgentId });
      invalidateLeadQueries(queryClient);
      toast.success(`Assigned ${ids.length} leads to ${agentOf(quickAssignAgentId)?.name ?? "agent"}`);
      setQuickAssignOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't allocate those leads.");
    } finally { setBulkAssignPending(false); }
  };

  const handleBulkStatus = async (nextStatus: LeadStatus) => {
    setBulkStatusPending(true);
    try {
      await callBulkSetLeadStatus({ leadIds: selectedIds, status: nextStatus });
      invalidateLeadQueries(queryClient);
      toast.success(`Updated status for ${selectedIds.length} leads`);
      setSelected(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update those leads — try again.");
    } finally {
      setBulkStatusPending(false);
    }
  };

  const handleAssignDialogConfirm = async () => {
    if (!assignTarget || !assignAgentId) return;
    const ids = Array.isArray(assignTarget) ? assignTarget : [assignTarget.id];
    setAssignDialogPending(true);
    try {
      await callBulkAssignLeads({ leadIds: ids, agentUid: assignAgentId });
      invalidateLeadQueries(queryClient);
      toast.success(`Assigned ${ids.length} lead(s) to ${agentOf(assignAgentId)?.name ?? "agent"}`);
      setAssignTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't assign this lead — try again.");
    } finally {
      setAssignDialogPending(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeletePending(true);
    try {
      await callBulkDeleteLeads({ leadIds: deleteTarget });
      invalidateLeadQueries(queryClient);
      toast.success(`Deleted ${deleteTarget.length} lead(s)`);
      setSelected(new Set());
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete those leads — try again.");
    } finally {
      setDeletePending(false);
    }
  };

  const handleCreateLead = async (patch: LeadFormPatch) => {
    await createLead(patch);
    invalidateLeadQueries(queryClient);
  };

  const handleUpdateLead = async (patch: LeadFormPatch) => {
    if (!editLead) return;
    const uid = firebaseAuth.currentUser?.uid ?? null;
    await updateDoc(doc(db, "leads", editLead.id), {
      business: patch.business,
      contactPerson: patch.contactPerson,
      role: patch.role,
      phone: patch.phone,
      email: patch.email,
      industry: patch.industry,
      location: patch.location,
      serviceId: patch.serviceId,
      source: patch.source,
      assignedAgentUid: patch.assignedAgentId,
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    });
    invalidateLeadQueries(queryClient, editLead.id);
  };

  // Admin-only: closing a lead is deliberately not exposed to agents (see
  // agent.leads.$id.tsx's QUICK_STATUS_OPTIONS) — an agent closing a deal
  // goes through the real Log Call → Closed Won flow with a service/value,
  // which creates the actual deal/commission record. This direct status
  // flip is for admin cleanup/override use (e.g. a deal closed offline),
  // and intentionally does not create a deal or commission of its own.
  const handleMarkClosedClient = async (lead: Lead) => {
    setClosingId(lead.id);
    try {
      await updateOwnLeadStatus(lead.id, "Closed Won");
      invalidateLeadQueries(queryClient, lead.id);
      toast.success(`${lead.business} marked as closed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't close that lead — try again.");
    } finally {
      setClosingId(null);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Leads"
        subtitle={`${leads.length} leads · ${unassignedCount} unassigned`}
        crumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Leads" }]}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/admin/import">
                <Upload className="mr-1.5 size-4" /> Import
              </Link>
            </Button>
            <Button variant="outline" onClick={() => setQuickAssignOpen(true)}>
              <UserPlus className="mr-1.5 size-4" /> Quick allocate
            </Button>
            <LeadFormDialog
              trigger={
                <Button>
                  <Plus className="mr-1.5 size-4" /> Add Lead
                </Button>
              }
              onSubmit={handleCreateLead}
            />
          </>
        }
      />

      <div className="mt-6 space-y-4">
        <div className="surface-card flex flex-col gap-3 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search business, contact, phone or email…"
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
              <Select value={agent} onValueChange={setAgent}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Agent" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All agents</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
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
              <Select value={service} onValueChange={setService}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Service" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All services</SelectItem>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-1.5 size-4" /> Export CSV
              </Button>
            </div>
          </div>
          {chips.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <button
                  key={c.key}
                  onClick={c.clear}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary"
                >
                  {c.label}
                  <X className="size-3" />
                </button>
              ))}
              <button onClick={clearAll} className="text-xs font-medium text-primary hover:underline">
                Clear all
              </button>
            </div>
          ) : null}
        </div>

        {selected.size > 0 ? (
          <div className="surface-card flex flex-wrap items-center gap-3 border-primary/30 bg-primary/5 p-3">
            <span className="text-sm font-medium">{selected.size} selected</span>
            <Select disabled={bulkAssignPending} onValueChange={handleBulkAssign}>
              <SelectTrigger className="h-8 w-[170px]">
                <SelectValue placeholder={bulkAssignPending ? "Assigning…" : "Assign agent…"} />
              </SelectTrigger>
              <SelectContent>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select disabled={bulkStatusPending} onValueChange={(v) => handleBulkStatus(v as LeadStatus)}>
              <SelectTrigger className="h-8 w-[170px]">
                <SelectValue placeholder={bulkStatusPending ? "Updating…" : "Change status…"} />
              </SelectTrigger>
              <SelectContent>
                {LEAD_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => toast.success(`Exported ${selected.size} leads`)}>
              <Download className="mr-1.5 size-3.5" /> Export
            </Button>
            <Button size="sm" variant="outline" className="text-destructive" onClick={() => setDeleteTarget(selectedIds)}>
              <Trash2 className="mr-1.5 size-3.5" /> Delete
            </Button>
            <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setSelected(new Set())}>
              Clear selection
            </Button>
          </div>
        ) : null}

        <div className="surface-card overflow-hidden p-0">
          <div className="scrollbar-slim overflow-x-auto">
            <Table className="min-w-[1400px]">
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={allPageSelected} onCheckedChange={(c) => toggleAllPage(!!c)} />
                  </TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Assigned Agent</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Contact</TableHead>
                  <TableHead>Next Follow-up</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 13 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : pageRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="p-0">
                      <EmptyState
                        title="No leads match your filters"
                        description="Try adjusting or clearing your search and filters."
                        action={<Button variant="outline" onClick={clearAll}>Clear all filters</Button>}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((lead) => {
                    const agentRec = agentOf(lead.assignedAgentId);
                    const svc = serviceOf(lead.serviceId);
                    const overdue = isOverdue(lead.nextFollowUp);
                    return (
                      <TableRow key={lead.id} className="hover:bg-muted/40">
                        <TableCell>
                          <Checkbox checked={selected.has(lead.id)} onCheckedChange={(c) => toggleRow(lead.id, !!c)} />
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{lead.business}</p>
                          <p className="text-xs text-muted-foreground">{lead.contactPerson}</p>
                        </TableCell>
                        <TableCell>
                          <p>{lead.contactPerson}</p>
                          <p className="text-xs text-muted-foreground">{lead.role}</p>
                        </TableCell>
                        <TableCell>{lead.industry}</TableCell>
                        <TableCell>{lead.location}</TableCell>
                        <TableCell className="tabular-nums">{lead.phone}</TableCell>
                        <TableCell className="max-w-[180px] truncate">{lead.email}</TableCell>
                        <TableCell>
                          {agentRec ? <AvatarChip name={agentRec.name} size="sm" /> : <UnassignedChip />}
                        </TableCell>
                        <TableCell>{svc?.short ?? "—"}</TableCell>
                        <TableCell><StatusBadge status={lead.status} /></TableCell>
                        <TableCell className="tabular-nums">{formatDate(lead.lastContact)}</TableCell>
                        <TableCell className={overdue ? "font-medium text-destructive tabular-nums" : "tabular-nums"}>
                          {formatDate(lead.nextFollowUp)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8" aria-label="Lead actions">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to="/agent/leads/$id" params={{ id: lead.id }}>
                                  <Eye className="mr-2 size-4" /> View lead
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditLead(lead)}>
                                <Pencil className="mr-2 size-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setAssignTarget(lead);
                                  setAssignAgentId(lead.assignedAgentId ?? "");
                                }}
                              >
                                <UserPlus className="mr-2 size-4" /> Assign
                              </DropdownMenuItem>
                              {lead.status !== "Closed Won" && lead.status !== "Closed Lost" ? (
                                <DropdownMenuItem
                                  disabled={closingId === lead.id}
                                  onClick={() => handleMarkClosedClient(lead)}
                                >
                                  <CheckCircle2 className="mr-2 size-4" />
                                  {closingId === lead.id ? "Closing…" : "Mark as Closed Client"}
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget([lead.id])}>
                                <Trash2 className="mr-2 size-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {!loading && filtered.length > 0 ? (
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
      </div>

      <Dialog open={quickAssignOpen} onOpenChange={setQuickAssignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Quick allocate unassigned leads</DialogTitle><DialogDescription>Assign the next matching unassigned leads without selecting rows one by one. Use the filters above first if you want a specific group.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><label className="text-sm font-medium">Agent</label><Select value={quickAssignAgentId} onValueChange={setQuickAssignAgentId}><SelectTrigger><SelectValue placeholder="Choose agent" /></SelectTrigger><SelectContent>{agents.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><label className="text-sm font-medium">Number of leads</label><Input type="number" min="1" value={quickAssignCount} onChange={(event) => setQuickAssignCount(event.target.value)} /><p className="text-xs text-muted-foreground">{filtered.filter((lead) => lead.assignedAgentId === null).length} unassigned leads match the current filters.</p></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setQuickAssignOpen(false)} disabled={bulkAssignPending}>Cancel</Button><Button onClick={() => void handleQuickAssign()} disabled={bulkAssignPending}>{bulkAssignPending ? "Assigning…" : "Allocate leads"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {editLead ? (
        <LeadFormDialog
          trigger={<span className="hidden" />}
          lead={editLead}
          open={!!editLead}
          onOpenChange={(o) => !o && setEditLead(null)}
          onSubmit={handleUpdateLead}
        />
      ) : null}

      <Dialog
        open={!!assignTarget}
        onOpenChange={(o) => {
          if (!o && !assignDialogPending) setAssignTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign lead</DialogTitle>
            <DialogDescription>Choose an agent to own this lead.</DialogDescription>
          </DialogHeader>
          <Select value={assignAgentId} onValueChange={setAssignAgentId} disabled={assignDialogPending}>
            <SelectTrigger><SelectValue placeholder="Select agent" /></SelectTrigger>
            <SelectContent>
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignTarget(null)} disabled={assignDialogPending}>
              Cancel
            </Button>
            <Button disabled={!assignAgentId || assignDialogPending} onClick={handleAssignDialogConfirm}>
              {assignDialogPending ? "Assigning…" : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && !deletePending && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.length ?? 0} lead(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This action can't be undone. These leads will be permanently removed from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deletePending}
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
            >
              {deletePending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
