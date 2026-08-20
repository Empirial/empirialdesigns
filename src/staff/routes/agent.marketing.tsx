import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Copy, Download, MessageCircleMore } from "lucide-react";
import { AppShell } from "@staff/components/layout/app-shell";
import { PageHeader } from "@staff/components/shared/page-header";
import { SectionCard } from "@staff/components/shared/section-card";
import { EmptyState } from "@staff/components/shared/empty-state";
import { Button } from "@staff/components/ui/button";
import { Card } from "@staff/components/ui/card";
import { useServices } from "@staff/lib/services-data";
import empirialIcon from "@/assets/Brand ID/empirial-icon.png";
import businessWebsitePoster from "@/../marketing-assets/Pricing-posters/ChatGPT Image Aug 16, 2026, 11_44_32 PM.png";
import customSoftwarePoster from "@/../marketing-assets/Pricing-posters/ChatGPT Image Aug 18, 2026, 12_24_02 PM.png";

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

const POSTERS = [
  { name: "Business Website", description: "Business website package — from R2 500.", src: businessWebsitePoster, filename: "empirial-business-website-poster.png", caption: "Get your business online, found and growing with a professional website from R2 500 — no monthly fees, you own it. 🚀" },
  { name: "Custom Software Development", description: "Custom software package — from R15 000.", src: customSoftwarePoster, filename: "empirial-custom-software-poster.png", caption: "Stop forcing your business into generic tools — get custom software built around your workflow from R15 000. 🚀" },
];

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

        <SectionCard title="Posters & social graphics" description="Approved graphics and copy-ready captions for sharing">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {POSTERS.map((poster) => (
              <Card key={poster.filename} className="gap-3 overflow-hidden p-0">
                <div className="flex max-h-[430px] items-center justify-center bg-muted/30 p-3">
                  <img src={poster.src} alt={`${poster.name} promotional poster`} className="max-h-[400px] w-full rounded-md object-contain" />
                </div>
                <div className="space-y-3 p-4 pt-0">
                  <div><p className="text-sm font-semibold">{poster.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{poster.description}</p></div>
                  <p className="rounded-lg border border-border bg-muted/30 p-2.5 text-xs leading-relaxed text-muted-foreground">{poster.caption}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => copyPitch(`${poster.name} caption`, poster.caption)}><Copy className="mr-1.5 size-3.5" /> Copy caption</Button>
                    <Button size="sm" variant="outline" asChild><a href={poster.src} download={poster.filename}><Download className="mr-1.5 size-3.5" /> Download</a></Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
