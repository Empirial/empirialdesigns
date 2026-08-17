import { useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  UploadCloud,
  FileSpreadsheet,
  ClipboardPaste,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { AppShell } from "@staff/components/layout/app-shell";
import { PageHeader } from "@staff/components/shared/page-header";
import { SectionCard } from "@staff/components/shared/section-card";
import { Pill } from "@staff/components/shared/status-badge";
import { LeadFormDialog, type LeadFormPatch } from "@staff/components/leads-admin/lead-form-dialog";
import { Button } from "@staff/components/ui/button";
import { Textarea } from "@staff/components/ui/textarea";
import { Switch } from "@staff/components/ui/switch";
import { Label } from "@staff/components/ui/label";
import { cn } from "@staff/lib/utils";
import { createLead, invalidateLeadQueries, useLeads } from "@staff/lib/leads";
import { callImportLeads, type ImportRow } from "@staff/lib/functions";
import { applyColumnMapping, parseCsv, type ParsedCsv } from "@staff/lib/csv";
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

export const Route = createFileRoute("/admin/import")({
  head: () => ({
    meta: [
      { title: "Import Leads — Meridian CRM" },
      { name: "description", content: "Bulk import leads from a CSV file, map columns and validate before committing." },
      { property: "og:title", content: "Import Leads — Meridian CRM" },
      { property: "og:description", content: "Upload, map and validate leads before adding them to Meridian CRM." },
    ],
  }),
  component: PageAdminImport,
});

const STEPS = ["Upload", "Map columns", "Validate", "Import"];

// System field ids match functions/src/callable/importLeads.ts's ImportRow shape.
const SYSTEM_FIELDS: { id: string; label: string; keywords: string[] }[] = [
  { id: "business", label: "Business Name", keywords: ["business", "company", "name"] },
  { id: "contactPerson", label: "Contact Person", keywords: ["contact", "person", "fullname"] },
  { id: "role", label: "Role", keywords: ["role", "title", "position"] },
  { id: "phone", label: "Phone", keywords: ["phone", "mobile", "cell", "tel"] },
  { id: "email", label: "Email", keywords: ["email", "mail"] },
  { id: "industry", label: "Industry", keywords: ["industry", "sector"] },
  { id: "location", label: "Location", keywords: ["location", "town", "city"] },
  { id: "value", label: "Estimated Value", keywords: ["value", "deal", "amount", "price"] },
  { id: "source", label: "Source", keywords: ["source", "origin"] },
];

/** Best-effort auto-mapping so the admin usually just has to confirm, not map every column by hand. */
function guessMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const header of headers) {
    const normalized = header.toLowerCase().replace(/[^a-z]/g, "");
    const match = SYSTEM_FIELDS.find((f) => f.keywords.some((k) => normalized.includes(k)));
    mapping[header] = match?.id ?? "";
  }
  return mapping;
}

type RowStatus = "Valid" | "Missing information" | "Duplicate";
interface PreviewRow {
  business: string;
  contactPerson: string;
  phone: string;
  email: string;
  industry: string;
  location: string;
  value: number;
  source: string;
  status: RowStatus;
}

type Stage = "upload" | "map" | "validate" | "import";

function PageAdminImport() {
  const { data: existingLeads = [] } = useLeads();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [validating, setValidating] = useState(false);
  const [hideInvalid, setHideInvalid] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skippedDuplicates: number; errorCount: number } | null>(null);

  const stepIndex = { upload: 0, map: 1, validate: 2, import: 3 }[stage];

  // Same write shape as admin.leads.tsx's handleCreateLead — this page's
  // "Add lead manually" button is an escape hatch for the odd one-off lead
  // that doesn't belong in a bulk file, not part of the CSV import flow.
  async function handleCreateLead(patch: LeadFormPatch) {
    await createLead(patch);
    invalidateLeadQueries(queryClient);
  }

  function ingestText(text: string, sourceLabel: string) {
    const result = parseCsv(text);
    if (result.headers.length === 0 || result.rows.length === 0) {
      toast.error("Couldn't find any rows in that file — check it's a comma-separated CSV with a header row.");
      return;
    }
    setParsed(result);
    setMapping(guessMapping(result.headers));
    setStage("map");
    toast.success(`${sourceLabel} received — detected ${result.headers.length} columns, ${result.rows.length} rows`);
  }

  function handleFileChosen(file: File) {
    const reader = new FileReader();
    reader.onload = () => ingestText(String(reader.result ?? ""), "File");
    reader.onerror = () => toast.error("Couldn't read that file — try again.");
    reader.readAsText(file);
  }

  const previewRows: PreviewRow[] = useMemo(() => {
    if (!parsed) return [];
    const mapped = applyColumnMapping(parsed, mapping);

    const existingPhones = new Set(existingLeads.map((l) => l.phone.replace(/\D/g, "")).filter(Boolean));
    const existingEmails = new Set(existingLeads.map((l) => l.email.toLowerCase()).filter(Boolean));
    const seenPhones = new Set<string>();
    const seenEmails = new Set<string>();

    return mapped.map((row): PreviewRow => {
      const business = row.business ?? "";
      const phone = row.phone ?? "";
      const email = row.email ?? "";
      const phoneDigits = phone.replace(/\D/g, "");
      const emailLower = email.toLowerCase();

      let status: RowStatus = "Valid";
      if (!business.trim()) {
        status = "Missing information";
      } else if (
        (phoneDigits && (existingPhones.has(phoneDigits) || seenPhones.has(phoneDigits))) ||
        (emailLower && (existingEmails.has(emailLower) || seenEmails.has(emailLower)))
      ) {
        status = "Duplicate";
      }
      if (status === "Valid") {
        if (phoneDigits) seenPhones.add(phoneDigits);
        if (emailLower) seenEmails.add(emailLower);
      }

      return {
        business,
        contactPerson: row.contactPerson ?? "",
        phone,
        email,
        industry: row.industry ?? "",
        location: row.location ?? "",
        value: Number(row.value) || 0,
        source: row.source ?? "",
        status,
      };
    });
  }, [parsed, mapping, existingLeads]);

  const summary = useMemo(() => {
    const valid = previewRows.filter((r) => r.status === "Valid").length;
    const missing = previewRows.filter((r) => r.status === "Missing information").length;
    const dup = previewRows.filter((r) => r.status === "Duplicate").length;
    return { valid, missing, dup };
  }, [previewRows]);

  const visibleRows = hideInvalid ? previewRows.filter((r) => r.status === "Valid") : previewRows;

  const handleValidate = () => {
    setValidating(true);
    // A brief pause reads better than an instant jump even though this is
    // real client-side computation, not a network call.
    setTimeout(() => {
      setValidating(false);
      setStage("validate");
      toast.info(`Validation complete: ${summary.valid} valid, ${summary.missing} missing info, ${summary.dup} duplicates`);
    }, 300);
  };

  const handleImport = async () => {
    const validRows: ImportRow[] = previewRows
      .filter((r) => r.status === "Valid")
      .map((r) => ({
        business: r.business,
        contactPerson: r.contactPerson || undefined,
        phone: r.phone || undefined,
        email: r.email || undefined,
        industry: r.industry || undefined,
        location: r.location || undefined,
        value: r.value > 0 ? r.value : undefined,
        source: r.source || undefined,
      }));

    if (validRows.length === 0) {
      toast.error("No valid rows to import.");
      return;
    }

    setImporting(true);
    try {
      const result = await callImportLeads({ rows: validRows });
      setImportResult({
        imported: result.data.imported,
        skippedDuplicates: result.data.skippedDuplicates,
        errorCount: result.data.errors.length,
      });
      setStage("import");
      toast.success(`Imported ${result.data.imported} leads into the database`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed — try again.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Import leads"
        subtitle="Bring leads in bulk from a CSV file — map fields, validate, then commit."
        crumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Leads", to: "/admin/leads" }, { label: "Import" }]}
        actions={
          <>
            <LeadFormDialog
              trigger={<Button variant="outline"><Plus className="mr-1.5 size-4" /> Add lead manually</Button>}
              onSubmit={handleCreateLead}
            />
            <Button variant="outline" asChild>
              <Link to="/admin/leads">Back to leads</Link>
            </Button>
          </>
        }
      />

      <div className="mt-6 space-y-6">
        <div className="surface-card p-5">
          <ol className="flex flex-wrap items-center gap-2 sm:gap-4">
            {STEPS.map((label, i) => (
              <li key={label} className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                      i < stepIndex
                        ? "bg-primary text-primary-foreground"
                        : i === stepIndex
                          ? "bg-primary/15 text-primary ring-2 ring-primary/40"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {i < stepIndex ? <CheckCircle2 className="size-4" /> : i + 1}
                  </span>
                  <span className={cn("text-sm", i <= stepIndex ? "font-medium text-foreground" : "text-muted-foreground")}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 ? <ArrowRight className="size-4 text-muted-foreground/50" /> : null}
              </li>
            ))}
          </ol>
        </div>

        {stage === "upload" ? (
          <SectionCard title="Upload your file" description="CSV exports from other CRMs, spreadsheets or directories (.csv only — Excel/.xlsx isn't supported yet).">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileChosen(file);
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-14 text-center transition-colors",
                dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/30",
              )}
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-background shadow-[var(--shadow-card)]">
                <UploadCloud className="size-6 text-primary" />
              </span>
              <p className="text-sm font-medium">Drag and drop your CSV file here</p>
              <p className="text-xs text-muted-foreground">Supports .csv up to 10MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileChosen(file);
                  e.target.value = "";
                }}
              />
              <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
                {SYSTEM_FIELDS.map((f) => (
                  <span
                    key={f.id}
                    className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground"
                  >
                    {f.label}
                  </span>
                ))}
              </div>
              <p className="max-w-md text-[11px] text-muted-foreground">
                First row should be column headers. Columns are matched by name automatically (e.g. a header
                called "Company" is recognized as Business Name) — you'll confirm or fix the mapping on the next
                step either way.
              </p>
              <Button className="mt-2" onClick={() => fileInputRef.current?.click()}>
                <FileSpreadsheet className="mr-1.5 size-4" /> Browse files
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button variant="outline" onClick={() => setPasteOpen((v) => !v)}>
                <ClipboardPaste className="mr-1.5 size-4" /> Paste data
              </Button>
              <span className="text-xs text-muted-foreground">or paste CSV rows straight from a spreadsheet</span>
            </div>
            {pasteOpen ? (
              <div className="mt-3 space-y-2">
                <Textarea
                  rows={5}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={"Business,Contact,Phone,Email\nAcme Ltd,Jane Doe,0821234567,jane@acme.co.za"}
                />
                <Button
                  size="sm"
                  disabled={!pasteText.trim()}
                  onClick={() => ingestText(pasteText, "Pasted data")}
                >
                  Use pasted data
                </Button>
              </div>
            ) : null}
          </SectionCard>
        ) : null}

        {stage === "map" && parsed ? (
          <SectionCard title="Map columns" description="Match each detected column to a Meridian CRM field.">
            <div className="mb-4 flex flex-wrap gap-2">
              {parsed.headers.map((c) => (
                <Pill key={c} tone="info">{c}</Pill>
              ))}
            </div>
            <div className="space-y-3">
              {parsed.headers.map((col) => (
                <div key={col} className="flex flex-col items-start gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-mono text-sm text-muted-foreground">{col}</span>
                  <ArrowRight className="hidden size-4 text-muted-foreground/50 sm:block" />
                  <Select
                    value={mapping[col] || "__ignore"}
                    onValueChange={(v) => setMapping((m) => ({ ...m, [col]: v === "__ignore" ? "" : v }))}
                  >
                    <SelectTrigger className="w-full sm:w-[220px]"><SelectValue placeholder="Map to field…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__ignore">Don't import</SelectItem>
                      {SYSTEM_FIELDS.map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStage("upload")}>Back</Button>
              <Button onClick={handleValidate} disabled={validating}>
                {validating ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
                {validating ? "Validating…" : "Validate Leads"}
              </Button>
            </div>
          </SectionCard>
        ) : null}

        {stage === "validate" || stage === "import" ? (
          <SectionCard
            title="Preview & validate"
            description="Review parsed rows before committing them to your lead database."
            action={
              <div className="flex items-center gap-2">
                <Label htmlFor="hide-invalid" className="text-xs text-muted-foreground">Hide invalid rows</Label>
                <Switch id="hide-invalid" checked={hideInvalid} onCheckedChange={setHideInvalid} />
              </div>
            }
            noPadding
          >
            <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3">
              <Pill tone="success">{summary.valid} valid</Pill>
              <Pill tone="warning">{summary.missing} missing info</Pill>
              <Pill tone="danger">{summary.dup} duplicate</Pill>
            </div>
            <div className="scrollbar-slim overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleRows.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{r.business || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>{r.contactPerson || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="tabular-nums">{r.phone || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>{r.email || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>{r.industry || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>{r.location || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="tabular-nums">{r.value > 0 ? `R${r.value.toLocaleString("en-ZA")}` : "—"}</TableCell>
                      <TableCell>
                        <Pill tone={r.status === "Valid" ? "success" : r.status === "Duplicate" ? "danger" : "warning"}>
                          {r.status === "Duplicate" ? <Copy className="mr-1 size-3" /> : r.status === "Missing information" ? <AlertTriangle className="mr-1 size-3" /> : <CheckCircle2 className="mr-1 size-3" />}
                          {r.status}
                        </Pill>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {stage === "validate" ? (
              <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
                <Button variant="outline" onClick={() => setStage("map")} disabled={importing}>Cancel</Button>
                <Button onClick={handleImport} disabled={importing || summary.valid === 0}>
                  {importing ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
                  {importing ? "Importing…" : "Import Leads"}
                </Button>
              </div>
            ) : null}
          </SectionCard>
        ) : null}

        {stage === "import" && importResult ? (
          <SectionCard title="Import complete" className="border-success/30">
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-success/10 text-success">
                <CheckCircle2 className="size-6" />
              </span>
              <p className="text-sm font-medium">{importResult.imported} leads were successfully imported</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {importResult.skippedDuplicates} duplicates were skipped
                {importResult.errorCount > 0 ? ` and ${importResult.errorCount} rows had errors` : ""} — re-checked
                against the real database at import time, not just this preview.
              </p>
              <Button asChild>
                <Link to="/admin/leads">View leads</Link>
              </Button>
            </div>
          </SectionCard>
        ) : null}
      </div>
    </AppShell>
  );
}
