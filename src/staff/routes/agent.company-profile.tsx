import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Download, Mail, MapPin, MessageCircle } from "lucide-react";

import { Button } from "@staff/components/ui/button";
import { useServices } from "@staff/lib/services-data";
import { formatZAR } from "@staff/lib/format";
import { COMPANY_PROFILE } from "@staff/lib/company-profile-data";
import EmpirialIcon from "@/assets/Brand ID/empirial-icon.png";
import smiteTradeFull from "@/../marketing-assets/portfolio-screenshots/smite-trade-full.jpg";
import careergateFull from "@/../marketing-assets/portfolio-screenshots/careergate-full.jpg";
import littleSaintsFull from "@/../marketing-assets/portfolio-screenshots/little-saints-full.jpg";
import empirialAcademyFull from "@/../marketing-assets/portfolio-screenshots/empirial-academy-full.jpg";

export const Route = createFileRoute("/agent/company-profile")({
  head: () => ({
    meta: [{ title: "Company Profile — Empirial CRM" }],
  }),
  component: PageCompanyProfile,
});

// Same four projects used to represent the range of work on the public
// portfolio page's featured set — kept small on purpose, this is a proof
// section not the full portfolio browser.
const PROOF = [
  { name: "Smite Trade", src: smiteTradeFull },
  { name: "CareerGate", src: careergateFull },
  { name: "Little Saints", src: littleSaintsFull },
  { name: "Empirial Academy", src: empirialAcademyFull },
];

function PageCompanyProfile() {
  const { data: services = [] } = useServices();
  const p = COMPANY_PROFILE;

  return (
    <div className="min-h-screen bg-muted/30 print:bg-white">
      {/* @page can't be expressed as a Tailwind utility — sets sane A4 print
         margins instead of the browser's oversized default. */}
      <style>{"@page { size: A4; margin: 15mm; }"}</style>

      {/* Screen-only toolbar — never printed */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-4 py-3 print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/agent/marketing">
            <ArrowLeft className="mr-1.5 size-4" /> Back to Marketing Materials
          </Link>
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Download className="mr-1.5 size-4" /> Download PDF
        </Button>
      </div>

      {/* The document itself — this is what gets printed. Styled to a
         readable ~A4 measure on screen and pinned to actual A4 on print. */}
      <div className="mx-auto max-w-[210mm] bg-white px-10 py-12 text-neutral-900 shadow-sm print:max-w-none print:px-0 print:py-0 print:shadow-none">
        {/* Cover */}
        <section className="flex flex-col items-start gap-6 border-b border-neutral-200 pb-10">
          <img src={EmpirialIcon} alt="EMPIRIAL" className="size-14 object-contain" />
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">Company Profile</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">{p.tagline}</h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-neutral-600">{p.intro}</p>
          </div>
        </section>

        {/* About */}
        <section className="border-b border-neutral-200 py-10">
          <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">About {p.name}</h2>
          <div className="mt-3 space-y-3">
            {p.about.map((para) => (
              <p key={para} className="text-sm leading-relaxed text-neutral-700">{para}</p>
            ))}
          </div>
        </section>

        {/* Services */}
        <section className="border-b border-neutral-200 py-10">
          <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">What we do</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {services.map((s) => (
              <div key={s.id} className="rounded-lg border border-neutral-200 p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold">{s.name}</p>
                  <p className="whitespace-nowrap text-xs font-medium text-neutral-500">from {formatZAR(s.promoPrice || s.price)}</p>
                </div>
                {s.short ? <p className="mt-1.5 text-xs leading-relaxed text-neutral-600">{s.short}</p> : null}
              </div>
            ))}
          </div>
        </section>

        {/* Why us */}
        <section className="border-b border-neutral-200 py-10">
          <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">Why {p.name}</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {p.whyUs.map((item) => (
              <div key={item.title} className="flex gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-neutral-400" />
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-neutral-600">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Process */}
        <section className="border-b border-neutral-200 py-10">
          <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">How we work</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {p.process.map((step) => (
              <div key={step.step}>
                <p className="text-sm font-semibold text-neutral-400">{step.step}</p>
                <p className="mt-1 text-sm font-semibold">{step.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-600">{step.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Proof */}
        <section className="border-b border-neutral-200 py-10 print:break-inside-avoid">
          <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">Recent work</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PROOF.map((item) => (
              <div key={item.name} className="overflow-hidden rounded-lg border border-neutral-200">
                <div className="h-28 overflow-hidden bg-neutral-100">
                  <img src={item.src} alt={item.name} className="w-full object-cover object-top" />
                </div>
                <p className="p-2 text-xs font-medium">{item.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Location & contact */}
        <section className="py-10">
          <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">Get in touch</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-neutral-400" />
              <div>
                <p className="text-sm font-semibold">{p.location.city}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-neutral-600">{p.location.note}</p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <Mail className="mt-0.5 size-4 shrink-0 text-neutral-400" />
              <div>
                <p className="text-sm font-semibold">Email</p>
                <p className="mt-0.5 text-xs text-neutral-600">{p.contact.email}</p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <MessageCircle className="mt-0.5 size-4 shrink-0 text-neutral-400" />
              <div>
                <p className="text-sm font-semibold">WhatsApp</p>
                <p className="mt-0.5 text-xs text-neutral-600">+{p.contact.whatsapp}</p>
              </div>
            </div>
          </div>
          <p className="mt-8 text-xs text-neutral-400">{p.contact.website}</p>
        </section>
      </div>
    </div>
  );
}
