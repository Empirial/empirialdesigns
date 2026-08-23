/* Single source of truth for the Company Profile document — reused by the
   in-app preview on the Marketing Materials page and the printable
   /agent/company-profile page, so the two never drift apart.

   Copy is pulled from the real public site (src/features/marketing/
   EmpirialSite.tsx — AboutPage and ContactPage) rather than invented, so the
   profile says the same thing prospects can already read on empirialdesigns.com. */

export const COMPANY_PROFILE = {
  name: "EMPIRIAL",
  tagline: "Building intelligent digital businesses.",
  intro:
    "EMPIRIAL exists to help ambitious people turn good ideas into clear, credible, useful digital experiences.",
  about: [
    "We started EMPIRIAL because too many businesses are forced to choose between beautiful design and technology that works. We believe the best digital products need both.",
    "Our job is to bring clarity to complex ideas, create experiences people trust, and build systems that help your business keep moving after launch.",
  ],
  whyUs: [
    { title: "You own it", detail: "No forced monthly fees on our website packages — pay once, the site is yours." },
    { title: "Built around you", detail: "Custom-built to fit your workflow, not a generic template stretched to fit." },
    { title: "Keeps working after launch", detail: "Systems and support designed to keep moving long after handover." },
    { title: "Human + AI", detail: "The best work sits where human thinking meets useful technology." },
  ],
  process: [
    { step: "01", title: "Discovery call", detail: "We learn about your business, your goals and what's not working today." },
    { step: "02", title: "Proposal & scope", detail: "A clear plan — what's included, timeline and price, no surprises." },
    { step: "03", title: "Build", detail: "Design and development, with check-ins so you always know where things stand." },
    { step: "04", title: "Launch & handover", detail: "Go live, plus training so your team can run with it." },
  ],
  location: {
    city: "Makhado (Louis Trichardt), Limpopo, South Africa",
    note: "Working remotely with ambitious businesses locally and globally.",
  },
  contact: {
    email: "hello@empirialdesigns.com",
    whatsapp: "27651859143",
    website: "empirialdesigns.com",
  },
} as const;
