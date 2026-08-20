import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Copy, Download, ExternalLink, MessageCircleMore } from "lucide-react";
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
import applicationDevPoster from "@/../marketing-assets/Pricing-posters/ChatGPT Image Aug 18, 2026, 12_23_48 PM.png";
import ecommercePoster from "@/../marketing-assets/Pricing-posters/ChatGPT Image Aug 18, 2026, 12_24_48 PM.png";
import aiAutomationPoster from "@/../marketing-assets/Pricing-posters/ChatGPT Image Aug 18, 2026, 12_25_03 PM.png";
import smiteTradeFull from "@/../marketing-assets/portfolio-screenshots/smite-trade-full.jpg";
import mrpdfFull from "@/../marketing-assets/portfolio-screenshots/mrpdf-full.jpg";
import careergateFull from "@/../marketing-assets/portfolio-screenshots/careergate-full.jpg";
import zionFull from "@/../marketing-assets/portfolio-screenshots/zion-full.jpg";
import samtambaniFull from "@/../marketing-assets/portfolio-screenshots/samtambani-full.jpg";
import littleSaintsFull from "@/../marketing-assets/portfolio-screenshots/little-saints-full.jpg";
import mBendlaMAttorneysFull from "@/../marketing-assets/portfolio-screenshots/m-bendla-m-attorneys-full.jpg";
import nnaElectricalsFull from "@/../marketing-assets/portfolio-screenshots/nna-electricals-full.jpg";
import mphelaIndustriesFull from "@/../marketing-assets/portfolio-screenshots/mphela-industries-full.jpg";
import gogoCarwashFull from "@/../marketing-assets/portfolio-screenshots/gogo-carwash-full.jpg";
import bongsKitchenFull from "@/../marketing-assets/portfolio-screenshots/bongs-kitchen-full.jpg";
import empirialQuizinesFull from "@/../marketing-assets/portfolio-screenshots/empirial-quizines-full.jpg";
import empirialAcademyFull from "@/../marketing-assets/portfolio-screenshots/empirial-academy-full.jpg";
import uresureFull from "@/../marketing-assets/portfolio-screenshots/uresure-full.jpg";
import ytShikaAttorneysFull from "@/../marketing-assets/portfolio-screenshots/yt-shika-attorneys-full.jpg";
import empirialCoffeeFull from "@/../marketing-assets/portfolio-screenshots/empirial-coffee-full.jpg";
import empirialEstateFull from "@/../marketing-assets/portfolio-screenshots/empirial-estate-full.jpg";
import empirialPastryFull from "@/../marketing-assets/portfolio-screenshots/empirial-pastry-full.jpg";
import empirialAttorneysFull from "@/../marketing-assets/portfolio-screenshots/empirial-attorneys-full.jpg";
import missEmpirialSaFull from "@/../marketing-assets/portfolio-screenshots/miss-empirial-sa-full.jpg";
import siyaleleProjectsFull from "@/../marketing-assets/portfolio-screenshots/siyalele-projects-full.jpg";
import pitchlyFull from "@/../marketing-assets/portfolio-screenshots/pitchly-full.jpg";

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
  { name: "Application Development", description: "Custom web/mobile app package — from R9 500.", src: applicationDevPoster, filename: "empirial-application-development-poster.png", caption: "Get a custom web or mobile app built around exactly how your business works — user accounts, admin dashboard, integrations, all from R9 500. 🚀" },
  { name: "E-Commerce Website", description: "E-commerce website package — from R5 000.", src: ecommercePoster, filename: "empirial-ecommerce-website-poster.png", caption: "Sell online 24/7 with a full e-commerce store — product catalog, secure payments, owner dashboard — from R5 000. 🚀" },
  { name: "AI Automation Solutions", description: "AI automation plans — from R999/month.", src: aiAutomationPoster, filename: "empirial-ai-automation-poster.png", caption: "Let AI handle the busywork — lead capture, email automation, WhatsApp automation and more — plans from R999/month. 🚀" },
];

// Full-page (top-to-bottom) captures of real client sites, for showing
// prospects the whole build rather than just the hero crop used on the
// public /portfolio page — see recapture-portfolio.mjs for how these are
// generated (real per-position scrolling, not a plain fullPage screenshot,
// so scroll-scrubbed reveal animations render correctly instead of blank).
const PORTFOLIO_SCREENSHOTS = [
  { name: "Smite Trade", src: smiteTradeFull, filename: "smite-trade-full.jpg", url: "https://smitetrade.co.za" },
  { name: "MrPDF", src: mrpdfFull, filename: "mrpdf-full.jpg", url: "https://mrpdf.co.za" },
  { name: "CareerGate", src: careergateFull, filename: "careergate-full.jpg", url: "https://careergate.co.za" },
  { name: "Zion", src: zionFull, filename: "zion-full.jpg", url: "https://apex-905a6.web.app/" },
  { name: "Samtambani", src: samtambaniFull, filename: "samtambani-full.jpg", url: "https://samtambani.netlify.app" },
  { name: "Little Saints", src: littleSaintsFull, filename: "little-saints-full.jpg", url: "https://littlesaints.co.za" },
  { name: "M Bendla-M Attorneys", src: mBendlaMAttorneysFull, filename: "m-bendla-m-attorneys-full.jpg", url: "https://www.mbendelamtattorneys.co.za" },
  { name: "NNA Electricals", src: nnaElectricalsFull, filename: "nna-electricals-full.jpg", url: "https://nnaelectrical.co.za/" },
  { name: "Mphela Industries", src: mphelaIndustriesFull, filename: "mphela-industries-full.jpg", url: "https://mphelaindus.web.app/" },
  { name: "GoGo Carwash", src: gogoCarwashFull, filename: "gogo-carwash-full.jpg", url: "https://gogocarwash1.netlify.app" },
  { name: "Bong's Kitchen", src: bongsKitchenFull, filename: "bongs-kitchen-full.jpg", url: "https://bongskitchen.netlify.app" },
  { name: "Empirial Quizines", src: empirialQuizinesFull, filename: "empirial-quizines-full.jpg", url: "https://empirialquizines.netlify.app" },
  { name: "Empirial Academy", src: empirialAcademyFull, filename: "empirial-academy-full.jpg", url: "https://empirialacademy.netlify.app" },
  { name: "UreSure", src: uresureFull, filename: "uresure-full.jpg", url: "https://uresure.netlify.app" },
  { name: "YT Shika Attorneys", src: ytShikaAttorneysFull, filename: "yt-shika-attorneys-full.jpg", url: "https://ytshikaattonerys.netlify.app/" },
  { name: "Empirial Coffee", src: empirialCoffeeFull, filename: "empirial-coffee-full.jpg", url: "https://empirialcoffee.netlify.app" },
  { name: "Empirial Estate", src: empirialEstateFull, filename: "empirial-estate-full.jpg", url: "https://empirialestate.netlify.app" },
  { name: "Empirial Pastry", src: empirialPastryFull, filename: "empirial-pastry-full.jpg", url: "https://empirialpastry.netlify.app" },
  { name: "Empirial Attorneys", src: empirialAttorneysFull, filename: "empirial-attorneys-full.jpg", url: "https://empirialattorney.netlify.app/" },
  { name: "Miss Empirial SA", src: missEmpirialSaFull, filename: "miss-empirial-sa-full.jpg", url: "https://missempirialsa.netlify.app" },
  { name: "Siyalele Projects", src: siyaleleProjectsFull, filename: "siyalele-projects-full.jpg", url: "https://siyaleleprojects.netlify.app" },
  { name: "Pitchly", src: pitchlyFull, filename: "pitchly-full.jpg", url: "https://pitchly-5e336.web.app" },
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

        <SectionCard title="Portfolio previews" description="Full top-to-bottom screenshots of real client builds — show a prospect the whole site, not just the hero">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {PORTFOLIO_SCREENSHOTS.map((shot) => (
              <Card key={shot.filename} className="gap-3 overflow-hidden p-0">
                <a href={shot.src} target="_blank" rel="noreferrer" className="block max-h-[260px] overflow-hidden bg-muted/30">
                  <img src={shot.src} alt={`${shot.name} full-page screenshot`} className="w-full object-cover object-top" />
                </a>
                <div className="space-y-3 p-4 pt-0">
                  <p className="text-sm font-semibold">{shot.name}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" asChild><a href={shot.src} download={shot.filename}><Download className="mr-1.5 size-3.5" /> Download</a></Button>
                    <Button size="sm" variant="outline" asChild><a href={shot.url} target="_blank" rel="noreferrer"><ExternalLink className="mr-1.5 size-3.5" /> Visit site</a></Button>
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
