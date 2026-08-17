import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Copy, Download, ImageIcon, MessageCircleMore } from "lucide-react";
import { AppShell } from "@staff/components/layout/app-shell";
import { PageHeader } from "@staff/components/shared/page-header";
import { SectionCard } from "@staff/components/shared/section-card";
import { EmptyState } from "@staff/components/shared/empty-state";
import { Button } from "@staff/components/ui/button";
import { Card } from "@staff/components/ui/card";
import { useServices } from "@staff/lib/services-data";
import empirialIcon from "@/assets/Brand ID/empirial-icon.png";

export const Route = createFileRoute("/agent/marketing")({
  head: () => ({
    meta: [
      { title: "Marketing Materials — Empirial CRM" },
      { name: "description", content: "Brand assets and ready-to-send pitches for agents." },
      { property: "og:title", content: "Marketing Materials — Empirial CRM" },
      { property: "og:description", content: "Brand assets and ready-to-send pitches for agents." },
    ],
  }),
  component: PageAgentMarketing,
});

// Bundled straight into the app (same asset used in the sidebar logo) —
// no Firebase Storage upload, no ongoing storage cost. Downloading it is
// just a plain <a download>, no server round-trip.
const BRAND_ASSETS = [{ name: "EMPIRIAL Icon", description: "Square brand mark — profile photos, WhatsApp icon, favicon.", src: empirialIcon, filename: "empirial-icon.png" }];

function PageAgentMarketing() {
  const { data: services = [] } = useServices();

  const copyPitch = (name: string, pitch: string) => {
    navigator.clipboard?.writeText(pitch);
    toast.success(`Copied the ${name} pitch`);
  };

  return (
    <AppShell>
      <PageHeader
        title="Marketing Materials"
        subtitle="Brand assets and ready-to-send pitches — copy, paste, send."
        crumbs={[{ label: "Agent", to: "/agent/dashboard" }, { label: "Marketing Materials" }]}
      />

      <div className="mt-6 space-y-6">
        <SectionCard title="Brand assets" description="Official EMPIRIAL logo files — free to use for anything client-facing">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BRAND_ASSETS.map((asset) => (
              <Card key={asset.filename} className="gap-3 p-4">
                <div className="flex items-center justify-center rounded-lg border border-border bg-muted/30 p-6">
                  <img src={asset.src} alt={asset.name} className="h-16 w-16 object-contain" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{asset.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{asset.description}</p>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <a href={asset.src} download={asset.filename}>
                    <Download className="mr-1.5 size-3.5" /> Download
                  </a>
                </Button>
              </Card>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Ready-to-send pitches"
          description="The real pitch for each service, copy-ready for WhatsApp, email or a DM"
        >
          {services.length === 0 ? (
            <EmptyState icon={MessageCircleMore} title="No services yet" description="Pitches will appear here once the service catalogue is loaded." />
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {services.map((service) => (
                <Card key={service.id} className="gap-2 p-4">
                  <p className="text-sm font-semibold">{service.name}</p>
                  <p className="line-clamp-4 text-xs leading-relaxed text-muted-foreground">{service.pitch}</p>
                  <Button size="sm" variant="outline" className="mt-1 w-fit" onClick={() => copyPitch(service.name, service.pitch)}>
                    <Copy className="mr-1.5 size-3.5" /> Copy pitch
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Posters & social graphics" description="Coming soon">
          <EmptyState
            icon={ImageIcon}
            title="No posters uploaded yet"
            description="Once EmpirialDesigns' own posters, flyers and social media graphics are ready, they'll show up here for you to download and share."
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}
