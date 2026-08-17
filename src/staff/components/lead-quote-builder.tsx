import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Copy, FileText, Send } from "lucide-react";
import { Button } from "@staff/components/ui/button";
import { Checkbox } from "@staff/components/ui/checkbox";
import { EmptyState } from "@staff/components/shared/empty-state";
import { callCreateQuote } from "@staff/lib/functions";
import { invalidateLeadQueries } from "@staff/lib/leads";
import { formatQuoteSummary, invalidateQuoteQueries, useLeadQuotes } from "@staff/lib/quotes";
import { formatDateTime, formatZAR } from "@staff/lib/format";
import type { Service } from "@staff/lib/types";

/**
 * Replaces the old fake "Documents" tab (hardcoded MOCK_DOCS, a toast that
 * pretended to download a file). The agent picks services the lead wants;
 * createQuote() reads each service's real price server-side and writes one
 * quote doc + a "Quote sent" lead activity. "Sending" is scoped to what this
 * app can actually do — there's no email/WhatsApp infrastructure — so the
 * agent copies the generated summary out to send manually, the same pattern
 * the Services page already uses for "copy pitch."
 */
export function LeadQuoteBuilder({
  leadId,
  business,
  services,
}: {
  leadId: string;
  business: string;
  services: Service[];
}) {
  const queryClient = useQueryClient();
  const { data: quotes = [], isLoading: quotesLoading } = useLeadQuotes(leadId);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeServices = services.filter((s) => s.status === "Active");
  const selectedServices = activeServices.filter((s) => selectedIds.includes(s.id));
  const runningTotal = selectedServices.reduce((sum, s) => sum + (s.promoPrice || s.price), 0);

  function toggle(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function sendQuote() {
    if (selectedIds.length === 0) {
      toast.error("Pick at least one service");
      return;
    }
    setSending(true);
    try {
      const result = await callCreateQuote({ leadId, serviceIds: selectedIds });
      const summary = formatQuoteSummary(business, result.data.items, result.data.total);
      await navigator.clipboard?.writeText(summary).catch(() => undefined);
      toast.success(`Quote sent — R${result.data.total.toLocaleString("en-ZA")} total. Summary copied to clipboard.`);
      setSelectedIds([]);
      invalidateQuoteQueries(queryClient, leadId);
      invalidateLeadQueries(queryClient, leadId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create that quote — try again.");
    } finally {
      setSending(false);
    }
  }

  async function copyPastQuote(quote: (typeof quotes)[number]) {
    const summary = formatQuoteSummary(quote.business, quote.items, quote.total);
    await navigator.clipboard?.writeText(summary).catch(() => undefined);
    setCopiedId(quote.id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId((id) => (id === quote.id ? null : id)), 2000);
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-medium">Build a quote</p>
        {activeServices.length === 0 ? (
          <EmptyState compact title="No active services to quote" />
        ) : (
          <div className="space-y-1">
            {activeServices.map((s) => (
              <label
                key={s.id}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-muted/40"
              >
                <span className="flex items-center gap-2.5 text-sm">
                  <Checkbox checked={selectedIds.includes(s.id)} onCheckedChange={() => toggle(s.id)} />
                  {s.name}
                </span>
                <span className="text-sm font-medium tabular-nums text-muted-foreground">
                  {formatZAR(s.promoPrice || s.price)}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5">
          <span className="text-sm text-muted-foreground">{selectedIds.length} service(s) selected</span>
          <span className="text-sm font-semibold tabular-nums">{formatZAR(runningTotal)}</span>
        </div>
      )}

      <Button onClick={sendQuote} disabled={sending || selectedIds.length === 0} className="w-full">
        <Send className="mr-1.5 size-3.5" />
        {sending ? "Sending…" : "Send quote"}
      </Button>

      <div>
        <p className="mb-2 text-sm font-medium">Previously sent</p>
        {quotesLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : quotes.length === 0 ? (
          <EmptyState compact title="No quotes sent yet" />
        ) : (
          <div className="space-y-2">
            {quotes.map((q) => (
              <div key={q.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="size-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {q.items.length} service{q.items.length === 1 ? "" : "s"} — {formatZAR(q.total)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(q.createdAt)}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => copyPastQuote(q)}>
                  {copiedId === q.id ? (
                    <>
                      <Check className="mr-1.5 size-3.5" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1.5 size-3.5" /> Copy
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
