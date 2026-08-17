/**
 * Trimmed copy of src/lib/mock-data.ts's services/scripts/lead seed content,
 * used only by callable/seed.ts's seedDemoData(). functions/ is a separate
 * TypeScript project from the app (its own tsconfig/compile root), so it
 * can't import from src/ — hence the duplication. Keep this in sync with
 * src/lib/mock-data.ts by hand if either changes meaningfully; it doesn't
 * need to match exactly, just be realistic enough to test against.
 */

export interface ServiceSeed {
  id: string;
  name: string;
  short: string;
  description: string;
  price: number;
  promoPrice: number;
  commissionType: "percentage" | "fixed";
  commissionValue: number;
  benefits: string[];
  pitch: string;
  objections: { objection: string; response: string }[];
  icon: string;
}

export const SERVICE_SEEDS: ServiceSeed[] = [
  {
    id: "svc-web",
    name: "Business Website",
    short: "Your professional home online — once-off, R2,500",
    description:
      "Core pages (Home, About, Services, Contact, FAQs), a clear call-to-action, a business Google listing set up properly, map integration, a mobile-friendly build, a quote request form, and a site built to be found on Google and recommended by AI tools like ChatGPT and Siri.",
    price: 2500,
    promoPrice: 2500,
    commissionType: "percentage",
    commissionValue: 10,
    benefits: [
      "Core Pages: Home, About, Services, Contact and FAQs",
      "Call-to-Action button so visitors can call, message or enquire",
      "Google Listing set up and verified for local search",
      "Map Integration showing exactly where you are",
      "Fully Mobile Friendly",
      "Quote Requests via a simple on-site form",
      "AI & SEO Ready — built to be found by Google and AI tools",
    ],
    pitch:
      "Here's what we'd build: a proper site with your Home, About, Services, Contact and FAQ pages, a clear call-to-action button so people can call, message or enquire, your business properly listed and verified on Google so you show up in local search, a map so people can find you, a site that works perfectly on phones since that's where most customers will find you, and a simple quote request form so people can reach you any time of day — even while you're closed. It's a once-off R2,500, no ongoing fee for the build itself.",
    objections: [
      {
        objection: "I don't need a website, I get enough business from word of mouth.",
        response:
          "That's great — word of mouth means people already trust you. A website just makes sure that when someone hears your name and looks you up, they find something professional instead of nothing. It doesn't replace what's working, it backs it up.",
      },
      {
        objection: "It's too expensive, I don't have the budget right now.",
        response:
          "I hear you. At R2,500 once-off, that's less than most businesses spend on a single month of Facebook ads — and this keeps working for you every day going forward, not just while you're paying for it.",
      },
    ],
    icon: "Globe",
  },
  {
    id: "svc-ecom",
    name: "E-Commerce Website",
    short: "Sell online, 24/7 — once-off, R5,000",
    description:
      "Everything in the Business Website, plus a full product catalog, secure on-site payments, automatic receipt emails, a private owner dashboard to manage stock/orders/prices, and a proper cart and checkout.",
    price: 5000,
    promoPrice: 5000,
    commissionType: "percentage",
    commissionValue: 10,
    benefits: [
      "Everything in the Business Website",
      "Catalog: full product catalog customers can browse",
      "Payments: secure payments taken right on your site",
      "Receipts: automatic receipt emails after every purchase",
      "Owner Dashboard: manage stock, orders and prices yourself",
      "Checkout: a proper cart so customers can buy in a few clicks",
    ],
    pitch:
      "We build a full online store — a product catalog customers can actually browse, secure payments so they pay right on your site instead of arranging EFT over WhatsApp, automatic receipt emails so you're not doing it manually, a private owner dashboard where you manage stock, orders and prices yourself, and a proper cart and checkout so people can buy in a few clicks. It includes everything in the Business Website too, so your whole online presence is covered.",
    objections: [
      {
        objection: "I already sell through WhatsApp/Facebook, it works fine.",
        response:
          "It works, but every sale still needs you personally to reply, arrange payment and remember stock. A store does that automatically, 24/7, even when you're asleep or serving another customer.",
      },
      {
        objection: "Online payments feel risky, I don't trust it.",
        response:
          "Totally understandable — we use secure, established payment providers, the same ones big retailers use. The money goes straight to your account; we never touch it.",
      },
    ],
    icon: "ShoppingCart",
  },
  {
    id: "svc-app",
    name: "Application Development",
    short: "A custom app built around how you work — once-off, R9,500",
    description:
      "A web or mobile app tailored to your business (not a generic template), with user accounts, an admin dashboard, integrations with the tools you already use, automatic notifications, and full hosting and launch.",
    price: 9500,
    promoPrice: 9500,
    commissionType: "percentage",
    commissionValue: 10,
    benefits: [
      "Custom Design tailored to your business, not a template",
      "User Accounts for customers or staff",
      "Admin Dashboard to see and control everything",
      "Integrations with tools you already use — payments, maps, more",
      "Notifications: automatic email or push updates",
      "Hosting & Launch handled end to end",
    ],
    pitch:
      "We design and build an app around exactly how you work, not a generic template. Customers or staff get their own accounts, you get an admin dashboard to see and control everything happening in the app in real time, we connect it to tools you already use like payments or maps, it sends automatic notifications to keep everyone updated, and we handle getting it hosted and live so it just works from day one.",
    objections: [
      {
        objection: "This sounds expensive.",
        response:
          "Custom apps are priced per project because no two businesses need the same thing — I'd rather scope exactly what you need first, so you only pay for what actually helps you.",
      },
      {
        objection: "Can't I just use an off-the-shelf app for this?",
        response:
          "You can, and sometimes that's fine. But off-the-shelf tools charge monthly forever and bend your business to fit their workflow. A custom app is built around how you already work, and you own it.",
      },
    ],
    icon: "Smartphone",
  },
  {
    id: "svc-design",
    name: "Custom Software Development",
    short: "A system built specifically for your business — once-off, R15,000",
    description:
      "Software designed around your exact workflow — proper reporting, a dedicated client/staff portal, integration with tools you already use (accounting, CRM and more), automation of repetitive tasks, and optional ongoing maintenance as you grow.",
    price: 15000,
    promoPrice: 15000,
    commissionType: "percentage",
    commissionValue: 10,
    benefits: [
      "Custom Build designed around your exact workflow",
      "Reporting: your data organised, with reports that show what matters",
      "Client/Staff Portal for you, your staff or your clients",
      "Integration with your existing tools",
      "Automation of repetitive tasks",
      "Maintenance available on an ongoing basis",
    ],
    pitch:
      "We design software around your workflow, not a one-size-fits-all tool you have to adapt to. Your data gets organised properly with reports that actually show you what matters, you and your staff or clients get a dedicated portal, we connect it to your existing tools like accounting software or CRM, we automate the repetitive tasks eating your team's time, and ongoing maintenance is available if you want us to keep improving it as you grow.",
    objections: [
      {
        objection: "We already have a system, just outdated.",
        response:
          "That's actually the easiest starting point — we look at what your current system does well, keep that, and fix what's costing you time.",
      },
      {
        objection: "This feels like a big investment.",
        response:
          "It is a real investment, which is why we price it per project after understanding exactly what it needs to do — most clients see it pay for itself in the hours it saves their team.",
      },
    ],
    icon: "Code2",
  },
  {
    id: "svc-ai",
    name: "AI Automation",
    short: "Custom AI agents that do real work — monthly, R999 / R2,499 / R4,999",
    description:
      "Starter: one task, automated — task discovery, an agent built to do it reliably, delivered as a widget or standalone tool, fully tested with a walkthrough. Smart: everything in Starter, plus a multi-task agent, tool integration, a custom workflow and monthly reporting. Elite: everything in Smart, plus a standalone application, multiple agents working together, deep integration, and ongoing monthly optimisation with priority support.",
    price: 999,
    promoPrice: 999,
    commissionType: "percentage",
    commissionValue: 10,
    benefits: [
      "Starter (R999/mo) — Task Discovery, Agent Build, Delivery, Testing & Handover",
      "Smart (R2,499/mo) — adds Multi-Task Agent, Tool Integration, Custom Workflow, Monthly Reporting",
      "Elite (R4,999/mo) — adds Standalone Application, Multiple Agents, Deep Integration, Ongoing Optimisation",
    ],
    pitch:
      "We work in three tiers. Starter is one task, automated — we sit with you, pick the one task worth automating, and build an agent that does it reliably, delivered as a widget on your site or a standalone tool, fully tested with a walkthrough. Smart takes it further — one agent handling several related tasks in sequence, connected to the tools you already use, built around your exact process, with monthly reporting on what it handled and the time it saved. Elite is a full agent system — a standalone application, multiple agents working together and handing off tasks automatically, deeply integrated into your data and workflows, with ongoing monthly training, tuning and priority support.",
    objections: [
      {
        objection: "Isn't AI just a chatbot? I don't need that.",
        response:
          "Fair concern — this isn't a generic chatbot that just answers FAQs. It's an agent built to actually do a specific task in your business, the way a staff member would.",
      },
      {
        objection: "This sounds complicated, I don't understand AI.",
        response:
          "You don't need to — we handle the build and give you a simple walkthrough. All you need to know is what task it's doing and what to check in the monthly report.",
      },
    ],
    icon: "Bot",
  },
  {
    id: "svc-seo",
    name: "SEO & Social Media Management",
    short: "Get found, stay visible — monthly, R1,500 / R2,500 / R4,500",
    description:
      "Package ① gets you found on Google — keyword optimisation, Google listing management, review monitoring, 4 posts a month and a site health check. Package ② adds rank tracking, 8 posts a month across two platforms, a content calendar, monthly reporting and blog content. Package ③ is full management — daily/weekly posting across 3+ platforms, competitor research, a local SEO push, backlink outreach and a monthly strategy call.",
    price: 1500,
    promoPrice: 1500,
    commissionType: "percentage",
    commissionValue: 10,
    benefits: [
      "Package ① (R1,500/mo) — Keyword Optimisation, Google Listing Management, Review Monitoring, Social Posting, Site Health Check",
      "Package ② (R2,500/mo) — adds Rank Tracking, Expanded Posting, Content Calendar, Monthly Reporting, Blog Content",
      "Package ③ (R4,500/mo) — adds Daily Posting, Competitor Research, Local SEO Push, Backlink Outreach, Strategy Call",
    ],
    pitch:
      "Package One gets you found on Google — keyword optimisation, Google Business listing management, review monitoring, 4 posts a month on one platform, and a site health check. Package Two is steady growth — everything in Package One, plus monthly rank tracking, 8 posts a month across two platforms, a proper content calendar, monthly traffic and ranking reports, and blog content if you have one. Package Three is full management — everything in Package Two, plus daily or weekly posting across three or more platforms that we write, design and post, competitor research, a local SEO push to get you listed everywhere that matters, backlink outreach, and a monthly strategy call.",
    objections: [
      {
        objection: "I can just post on Facebook myself, why pay for this?",
        response:
          "You can, and a lot of business owners try — the issue is usually consistency. We handle the calendar, the writing, the posting and the tracking, so it never falls off your plate during busy weeks.",
      },
      {
        objection: "SEO takes months to work, isn't it a waste of money short-term?",
        response:
          "You're right that it compounds over time — that's exactly why starting now matters more than starting later. Every month you wait is a month your competitor could be ranking instead of you.",
      },
    ],
    icon: "Megaphone",
  },
  {
    id: "svc-poster",
    name: "Poster Design",
    short: "Posters, flyers and social graphics — once-off, R250",
    description:
      "A single professionally designed poster, flyer or social media graphic — specials, events, announcements — delivered print-ready and WhatsApp/social-ready.",
    price: 250,
    promoPrice: 250,
    commissionType: "percentage",
    commissionValue: 10,
    benefits: [
      "Custom design, not a generic template",
      "Print-ready and social-ready file formats",
      "Fast turnaround — usually 24 to 48 hours",
      "A simple, cheap add-on to any other service",
    ],
    pitch:
      "Your specials or events deserve better than a phone screenshot. For R250 we design one clean, professional poster you can print, WhatsApp to customers, or post on social media — a small, low-risk way to work with us before deciding on anything bigger.",
    objections: [
      {
        objection: "I can just make one myself on my phone.",
        response:
          "You can — but a designed poster looks like a real business, not a phone screenshot, and at R250 it costs less than most people spend without thinking twice.",
      },
      {
        objection: "I only need this once, not an ongoing thing.",
        response:
          "That's exactly what this is — a once-off design, no commitment. Order another one any time you have a new special or event.",
      },
    ],
    icon: "Palette",
  },
];

export interface ScriptSeed {
  id: string;
  title: string;
  category: string;
  type: "script" | "objection" | "faq" | "knowledge";
  body: string;
  favourite?: boolean;
}

export const SCRIPT_SEEDS: ScriptSeed[] = [
  {
    id: "sc-playbook-intro",
    title: "How To Use This Playbook",
    category: "Knowledge Base",
    type: "knowledge",
    favourite: true,
    body: "This playbook has two parts. Read them together on every call.\n\nPart 1 — Master Scripts: one full script per service (Opening, Discovery, Pitch, Objections, Closing, Follow-Up, FAQs). This is the backbone of every call, whatever industry you're speaking to.\n\nPart 2 — Industry Playbook Cards: a short plug-in for each of the twelve industries — their specific pain points, the opening hook line to lead with, which service to pitch first, and the two objections and FAQs that come up most in that industry.\n\nHow it works on a call: pick the service that fits what the prospect needs (or let the Industry Card tell you which service to lead with), open with the industry hook line instead of the generic opener, run discovery from the Master Script, and fall back to the Master Script's objections and FAQs — only reaching for the industry-specific ones when they come up. Scripts are a guide, not a script to read word-for-word — adapt the language to how you naturally talk, but keep the structure.\n\n⚠ Agent note: Lines marked like this throughout the playbook flag details (pricing, providers, policies) to confirm are current before quoting them on a live call.",
  },
  {
    id: "sc-web-script",
    title: "Business Website — Call Script",
    category: "Website Sales",
    type: "script",
    favourite: true,
    body: "OPENING\nHi, is this [Owner Name]? My name is [Agent Name], calling from EmpirialDesigns — we build websites for businesses in [area]. Quick reason for the call: I noticed [business name] either doesn't have a website, or it isn't showing up when people search for you on Google. We're currently running a website build for R2,500 once-off, fully done for you, no monthly fees. Have you got two minutes?\n\nDISCOVERY QUESTIONS\n- Do you currently have a website? If yes, when was it last updated?\n- Where do most of your new customers currently come from — referrals, Facebook, walk-in?\n- Have you ever searched your own business name on Google to see what comes up?\n- If a customer typed \"[your service] near me\" right now, would you show up?\n\nTHE PITCH\nHere's what we'd build: a proper site with your Home, About, Services, Contact and FAQ pages, a clear call-to-action button so people can call, message or enquire, your business properly listed and verified on Google so you show up in local search, a map so people can find you, a site that works perfectly on phones since that's where most customers will find you, and a simple quote request form so people can reach you any time of day — even while you're closed. It's a once-off R2,500, no ongoing fee for the build itself.\n\nCLOSING\nAssumptive close: \"Should I get your business details now so we can start on your Home and Contact pages this week?\"\nSoft close: \"Would it make sense to lock in the R2,500 rate now before it goes back to full price, and schedule the build for next week?\"\n\nFOLLOW-UP SEQUENCE\nDay 1 (same day, WhatsApp) — Short recap message with a link to two or three example sites.\nDay 3 — \"Hi [Name], just following up on the website we spoke about — any questions before we get started?\"\nDay 7 — \"Hey [Name], the R2,500 offer closes soon — want me to lock your spot in this week?\"",
  },
  {
    id: "sc-web-objections",
    title: "Business Website — Objections & Rebuttals",
    category: "Objections",
    type: "objection",
    body: "Objection: \"I don't need a website, I get enough business from word of mouth.\"\nRebuttal: That's great — word of mouth means people already trust you. A website just makes sure that when someone hears your name and looks you up, they find something professional instead of nothing. It doesn't replace what's working, it backs it up.\n\nObjection: \"It's too expensive, I don't have the budget right now.\"\nRebuttal: I hear you. At R2,500 once-off, that's less than most businesses spend on a single month of Facebook ads — and this keeps working for you every day going forward, not just while you're paying for it.\n\nObjection: \"I tried a website before and it didn't bring me anything.\"\nRebuttal: Can I ask — was it actually set up with Google, or was it just sitting online with no one finding it? That's usually the gap. We build it to be found, not just to exist.\n\nObjection: \"I need to think about it / talk to my partner.\"\nRebuttal: Totally fair. While you think it over, would it help if I sent two or three example sites we've built for businesses like yours, so you both have something real to look at?",
  },
  {
    id: "sc-web-faq",
    title: "Business Website — FAQs",
    category: "FAQ",
    type: "faq",
    body: "Q: How long does it take?\nA: Typically 5–10 working days once we have your content and logo.\n\nQ: Do I need to give you photos and text?\nA: We can guide you on what to send, or write it for you if needed.\n\nQ: Can I update it myself later?\nA: This tier is built and managed by us. If you want to edit it yourself, ask about the E-Commerce or Application Development tiers, which include an owner dashboard.\n\nQ: What if I want an online store instead?\nA: That's the E-Commerce package — everything in Business Website, plus full online payments and checkout.\n\n⚠ Agent note: Confirm current hosting terms and whether the R2,500 promo is still live before quoting it.",
  },
  {
    id: "sc-ecom-script",
    title: "E-Commerce Website — Call Script",
    category: "Website Sales",
    type: "script",
    body: "OPENING\nHi [Name], EmpirialDesigns here — we build online stores for businesses that want to sell without needing a till or a Facebook inbox full of orders. Do you currently sell online at all, even through WhatsApp or Facebook?\n\nDISCOVERY QUESTIONS\n- How are customers paying you right now — cash, EFT, WhatsApp orders?\n- How much time do you spend each week manually tracking orders and stock?\n- Have you ever lost a sale because someone couldn't pay online there and then?\n- Do you know how many people look at your products versus how many actually buy?\n\nTHE PITCH\nWe build a full online store — a product catalog customers can actually browse, secure payments so they pay right on your site instead of arranging EFT over WhatsApp, automatic receipt emails so you're not doing it manually, a private owner dashboard where you manage stock, orders and prices yourself, and a proper cart and checkout so people can buy in a few clicks. It includes everything in the Business Website too, so your whole online presence is covered.\n\nCLOSING\nAssumptive close: \"Let's get your product list started — can you send me your top 10 products and prices this week?\"\nSoft close: \"Would you like a quick 10-minute screen-share so I can show you exactly what your dashboard will look like before you decide?\"\n\nFOLLOW-UP SEQUENCE\nDay 1 — Send 2 example store links relevant to their industry.\nDay 3 — \"Any questions on the payment setup or the dashboard?\"\nDay 7 — \"Want to lock in a start date this week so you're live before [relevant season/event]?\"",
  },
  {
    id: "sc-ecom-objections",
    title: "E-Commerce Website — Objections & Rebuttals",
    category: "Objections",
    type: "objection",
    body: "Objection: \"I already sell through WhatsApp/Facebook, it works fine.\"\nRebuttal: It works, but every sale still needs you personally to reply, arrange payment and remember stock. A store does that automatically, 24/7, even when you're asleep or serving another customer.\n\nObjection: \"Online payments feel risky, I don't trust it.\"\nRebuttal: Totally understandable — we use secure, established payment providers, the same ones big retailers use. The money goes straight to your account; we never touch it.\n\nObjection: \"I don't have enough products to justify a full store.\"\nRebuttal: You'd be surprised — even 5 to 10 products is enough to start, and we can grow the catalog with you as you add more.\n\nObjection: \"What if I don't know how to manage the dashboard?\"\nRebuttal: That's exactly why we do a full walkthrough at handover, and you can always call us if you get stuck.",
  },
  {
    id: "sc-ecom-faq",
    title: "E-Commerce Website — FAQs",
    category: "FAQ",
    type: "faq",
    body: "Q: Which payment providers do you use?\nA: [Confirm current provider before answering, e.g. PayFast / Yoco / Ozow.]\n\nQ: Do you take a commission on sales?\nA: No — this is a once-off build fee. What you earn is yours.\n\nQ: Can I add products myself after launch?\nA: Yes, that's exactly what the owner dashboard is for.\n\nQ: Do you handle VAT on receipts?\nA: We can configure your receipt template to include your VAT number and rate if you're registered.\n\n⚠ Agent note: Confirm the current payment gateway partner before naming one on a call.",
  },
  {
    id: "sc-app-script",
    title: "Application Development — Call Script",
    category: "Apps",
    type: "script",
    body: "OPENING\nHi [Name], I'm calling from EmpirialDesigns. We build custom apps for businesses whose day-to-day doesn't fit a generic template — bookings, staff management, client accounts, that kind of thing. Is there a part of your business right now still running on WhatsApp, spreadsheets, or paper?\n\nDISCOVERY QUESTIONS\n- Walk me through how a customer or staff member interacts with your business today — where does it get messy?\n- Do you need customers to have their own login, staff, or both?\n- Are you using any tools already that this would need to connect to — payments, maps, bookings?\n- If this app existed tomorrow, what's the one thing it would need to do to make your life easier?\n\nTHE PITCH\nWe design and build an app around exactly how you work, not a generic template. Customers or staff get their own accounts, you get an admin dashboard to see and control everything happening in the app in real time, we connect it to tools you already use like payments or maps, it sends automatic notifications to keep everyone updated, and we handle getting it hosted and live so it just works from day one.\n\nCLOSING\nAssumptive close: \"Let's set up a 20-minute scoping call this week so I can put together an accurate quote for you.\"\nSoft close: \"Would it help if I sent two examples of custom apps we've built, so you can see what's possible before we scope yours?\"\n\nFOLLOW-UP SEQUENCE\nDay 1 — Send scoping questionnaire.\nDay 3 — \"Did you get a chance to look at the questionnaire? Happy to jump on a call instead if that's easier.\"\nDay 10 — \"Just checking in — still keen to move forward, or has anything changed on your end?\"",
  },
  {
    id: "sc-app-objections",
    title: "Application Development — Objections & Rebuttals",
    category: "Objections",
    type: "objection",
    body: "Objection: \"This sounds expensive.\"\nRebuttal: Custom apps are priced per project because no two businesses need the same thing — I'd rather scope exactly what you need first, so you only pay for what actually helps you.\n\nObjection: \"Can't I just use an off-the-shelf app for this?\"\nRebuttal: You can, and sometimes that's fine. But off-the-shelf tools charge monthly forever and bend your business to fit their workflow. A custom app is built around how you already work, and you own it.\n\nObjection: \"I'm worried it'll take too long to build.\"\nRebuttal: That's exactly why we scope it properly upfront — you'll get a clear timeline before we write a single line of code.\n\nObjection: \"What if my needs change after it's built?\"\nRebuttal: That's normal — we offer ongoing maintenance so the app grows with your business instead of becoming outdated.",
  },
  {
    id: "sc-app-faq",
    title: "Application Development — FAQs",
    category: "FAQ",
    type: "faq",
    body: "Q: How is pricing worked out?\nA: Per project, based on a scoping call — we quote before any work starts.\n\nQ: Do you build iOS and Android or just web?\nA: [Confirm current build capability before answering — likely web/PWA-first.]\n\nQ: Who owns the app once it's built?\nA: You do — it's built for your business.\n\nQ: Can it integrate with our existing accounting/CRM?\nA: In most cases yes — we scope integrations during discovery.\n\n⚠ Agent note: Confirm current mobile build capability (native vs. web-app) before promising platforms.",
  },
  {
    id: "sc-design-script",
    title: "Custom Software Development — Call Script",
    category: "Apps",
    type: "script",
    body: "OPENING\nHi [Name], EmpirialDesigns — we build custom software for businesses that have outgrown spreadsheets but don't want to force their business into someone else's generic system. Is there a process right now that feels like it's held together with spreadsheets and admin time?\n\nDISCOVERY QUESTIONS\n- What does your current reporting process look like — is it manual?\n- Do you or your staff/clients need a dedicated portal to log in and see information?\n- What tools are you already using that this would need to talk to — accounting, CRM, stock systems?\n- What repetitive task, if automated, would save your team the most hours per week?\n\nTHE PITCH\nWe design software around your workflow, not a one-size-fits-all tool you have to adapt to. Your data gets organised properly with reports that actually show you what matters, you and your staff or clients get a dedicated portal, we connect it to your existing tools like accounting software or CRM, we automate the repetitive tasks eating your team's time, and ongoing maintenance is available if you want us to keep improving it as you grow.\n\nCLOSING\nAssumptive close: \"Let's book a discovery session so we can map out exactly what the system needs to do before I quote you.\"\nSoft close: \"Would it help to see a report or portal example from a similar project first?\"\n\nFOLLOW-UP SEQUENCE\nDay 1 — Send discovery session confirmation and a short prep list.\nDay 5 — \"How did the discovery notes look on your end — any changes before I finalise scope?\"\nDay 14 — \"Just checking where this sits on your priority list — should we pencil in a build start date?\"",
  },
  {
    id: "sc-design-objections",
    title: "Custom Software Development — Objections & Rebuttals",
    category: "Objections",
    type: "objection",
    body: "Objection: \"We already have a system, just outdated.\"\nRebuttal: That's actually the easiest starting point — we look at what your current system does well, keep that, and fix what's costing you time.\n\nObjection: \"This feels like a big investment.\"\nRebuttal: It is a real investment, which is why we price it per project after understanding exactly what it needs to do — most clients see it pay for itself in the hours it saves their team.\n\nObjection: \"What if it breaks or needs changes down the line?\"\nRebuttal: That's what our maintenance option is for — we don't disappear after launch, we keep it running and improving with you.\n\nObjection: \"How do I know you'll actually understand my business?\"\nRebuttal: That's the whole point of scoping — we don't write a line of code until we fully understand your workflow, so the software fits you, not the other way around.",
  },
  {
    id: "sc-design-faq",
    title: "Custom Software Development — FAQs",
    category: "FAQ",
    type: "faq",
    body: "Q: How long does custom software take to build?\nA: Depends entirely on scope — timeline is confirmed after discovery.\n\nQ: Is this a once-off cost?\nA: Yes, the build is once-off; ongoing maintenance is optional and separate.\n\nQ: Can staff and clients have different access levels?\nA: Yes, we build role-based permissions into the portal.\n\nQ: Do you sign an NDA / handle our data securely?\nA: [Confirm current NDA/data policy before answering.]\n\n⚠ Agent note: Confirm current NDA/data-handling stance before this call — clients in this tier often ask directly.",
  },
  {
    id: "sc-ai-script",
    title: "AI Automation — Call Script",
    category: "AI Automation",
    type: "script",
    body: "OPENING\nHi [Name], I'm calling from EmpirialDesigns. We build AI agents that do real, repetitive work for businesses — replying to enquiries, sorting information, drafting documents — so your team isn't stuck doing it manually. Is there one task in your business that eats up time every single day?\n\nDISCOVERY QUESTIONS\n- What's the one repetitive task you or your staff do every day that you'd love to hand off?\n- How much time would you estimate that task costs you a week?\n- Are you currently using any tools it would need to plug into — email, WhatsApp, a booking system?\n- Is it one task you want handled, or several that flow into each other?\n\nTHE PITCH\nWe work in three tiers. Starter is one task, automated — we sit with you, pick the one task worth automating, and build an agent that does it reliably, delivered as a widget on your site or a standalone tool, fully tested with a walkthrough. Smart takes it further — one agent handling several related tasks in sequence, connected to the tools you already use, built around your exact process, with monthly reporting on what it handled and the time it saved. Elite is a full agent system — a standalone application, multiple agents working together and handing off tasks automatically, deeply integrated into your data and workflows, with ongoing monthly training, tuning and priority support.\n\nCLOSING\nAssumptive close: \"Let's identify the one task worth automating first — can we set up 15 minutes this week to map it out?\"\nSoft close: \"Would it help if I showed you a Starter agent example doing a task similar to what you described?\"\n\nFOLLOW-UP SEQUENCE\nDay 1 — Send Starter tier one-pager and a relevant example.\nDay 4 — \"Have you had a chance to think about which task you'd want automated first?\"\nDay 10 — \"Still want to lock in a Starter build this month, or should I follow up next month instead?\"",
  },
  {
    id: "sc-ai-objections",
    title: "AI Automation — Objections & Rebuttals",
    category: "Objections",
    type: "objection",
    body: "Objection: \"Isn't AI just a chatbot? I don't need that.\"\nRebuttal: Fair concern — this isn't a generic chatbot that just answers FAQs. It's an agent built to actually do a specific task in your business, the way a staff member would.\n\nObjection: \"This sounds complicated, I don't understand AI.\"\nRebuttal: You don't need to — we handle the build and give you a simple walkthrough. All you need to know is what task it's doing and what to check in the monthly report.\n\nObjection: \"It's a monthly cost — what if it doesn't save me enough time?\"\nRebuttal: That's exactly why we start with Starter — one task, proven, before you ever consider Smart or Elite. You see the time saved before you scale up.\n\nObjection: \"Will it replace my staff?\"\nRebuttal: No — it takes the repetitive part off their plate so they can spend time on the things that actually need a person, like your customers.",
  },
  {
    id: "sc-ai-faq",
    title: "AI Automation — FAQs",
    category: "FAQ",
    type: "faq",
    body: "Q: What counts as \"one task\"?\nA: Anything repeatable and rule-based — replying to standard enquiries, sorting leads, drafting follow-ups, data entry, research summaries.\n\nQ: Can I upgrade from Starter to Smart later?\nA: Yes, tiers are designed to grow with you.\n\nQ: Where does the agent live?\nA: As a widget on your website or a standalone tool, depending on the tier.\n\nQ: Is my data safe with an AI agent?\nA: [Confirm current data-handling policy before answering.]\n\n⚠ Agent note: Confirm current data-handling/privacy policy for AI Automation before stating it as fact on calls.",
  },
  {
    id: "sc-seo-script",
    title: "SEO & Social Media Management — Call Script",
    category: "SEO",
    type: "script",
    body: "OPENING\nHi [Name], EmpirialDesigns here — we help businesses actually get found on Google and stay visible on social media, instead of posting once and disappearing for a month. When last did you check where your business ranks on Google for your own services?\n\nDISCOVERY QUESTIONS\n- Do you currently manage your own Google Business listing and social pages, or is nobody really on top of it?\n- How often are you posting right now, honestly?\n- Do you know how you rank compared to your competitors in [area]?\n- Have you ever lost a customer to a competitor who just showed up better online?\n\nTHE PITCH\nPackage One gets you found on Google — keyword optimisation, Google Business listing management, review monitoring, 4 posts a month on one platform, and a site health check. Package Two is steady growth — everything in Package One, plus monthly rank tracking, 8 posts a month across two platforms, a proper content calendar, monthly traffic and ranking reports, and blog content if you have one. Package Three is full management — everything in Package Two, plus daily or weekly posting across three or more platforms that we write, design and post, competitor research, a local SEO push to get you listed everywhere that matters, backlink outreach, and a monthly strategy call.\n\nCLOSING\nAssumptive close: \"Let's start with Package One this month and review your first month's results together — should I get you set up?\"\nSoft close: \"Would it help if I pulled a quick free snapshot of where you currently rank on Google, so you can see where you stand before deciding?\"\n\nFOLLOW-UP SEQUENCE\nDay 1 — Send free ranking snapshot if offered.\nDay 3 — \"Did you get a chance to look at where you're currently ranking? Happy to walk you through it.\"\nDay 7 — \"This month's content calendar slots are filling up — want me to lock your package in this week?\"",
  },
  {
    id: "sc-seo-objections",
    title: "SEO & Social Media Management — Objections & Rebuttals",
    category: "Objections",
    type: "objection",
    body: "Objection: \"I can just post on Facebook myself, why pay for this?\"\nRebuttal: You can, and a lot of business owners try — the issue is usually consistency. We handle the calendar, the writing, the posting and the tracking, so it never falls off your plate during busy weeks.\n\nObjection: \"SEO takes months to work, isn't it a waste of money short-term?\"\nRebuttal: You're right that it compounds over time — that's exactly why starting now matters more than starting later. Every month you wait is a month your competitor could be ranking instead of you.\n\nObjection: \"How do I know it's actually working?\"\nRebuttal: From Package Two up, you get a monthly report showing your traffic and ranking movement — you're not just taking our word for it.\n\nObjection: \"It's another monthly expense on top of everything else.\"\nRebuttal: Understood — think of it less as an expense and more as what keeps bringing customers to the website you already paid for. A site with no visibility is like a shop with no sign.",
  },
  {
    id: "sc-seo-faq",
    title: "SEO & Social Media Management — FAQs",
    category: "FAQ",
    type: "faq",
    body: "Q: Which platforms do you post on?\nA: Typically Facebook, Instagram, and Google Business — tailored to where your customers actually are.\n\nQ: Can I cancel anytime?\nA: [Confirm current contract/notice terms before answering.]\n\nQ: Do you write and design the posts, or do I supply content?\nA: We write and design it — you can review before it goes live if you'd like.\n\nQ: How long until I see ranking improvement?\nA: Typically the first meaningful movement shows in 2–3 months, with compounding results after that.\n\n⚠ Agent note: Confirm current cancellation/notice-period terms before quoting them on a call.",
  },
  {
    id: "sc-industry-construction-trades",
    title: "Industry Card — Construction & Trades",
    category: "Knowledge Base",
    type: "knowledge",
    body: "Builders · Electricians · Plumbers · Welders · Roofing · House Plans · Maintenance\n\nPAIN POINTS\n- Runs on word-of-mouth only, invisible when someone searches \"emergency plumber near me\"\n- No way to show past work or completed jobs to build trust\n- Quoting still happens entirely over the phone, enquiries get lost\n\nOPENING HOOK LINE\nHi [Name], when someone's geyser bursts at 9pm and they Google 'emergency plumber near me,' does your business come up, or does the next guy get the call?\n\nLEAD WITH\nBusiness Website (with quote request form) → then AI Automation Starter for after-hours enquiry replies.\n\nTOP INDUSTRY OBJECTIONS\nObjection: \"My work speaks for itself, I don't need marketing.\"\nRebuttal: It does — but only to people who already know you. A website makes sure it speaks for itself to the strangers searching for you right now too.\n\nObjection: \"I'm not online during the day, I'm on site.\"\nRebuttal: That's exactly why the quote form and after-hours auto-reply matter — the enquiry gets captured while you're on the roof, not lost.\n\nINDUSTRY FAQS\nQ: Can you add a photo gallery of past jobs?\nA: Yes, that's part of the standard build.\n\nQ: Can customers request emergency call-outs directly?\nA: Yes, we can set up a priority contact button for urgent enquiries.",
  },
  {
    id: "sc-industry-food-catering-events",
    title: "Industry Card — Food, Catering & Events",
    category: "Knowledge Base",
    type: "knowledge",
    body: "Caterers · Restaurants · Bakeries · Decorators · Event Companies · Party Hire\n\nPAIN POINTS\n- Orders and bookings tracked manually through chaotic WhatsApp threads\n- No online menu or booking calendar\n- Missed events because the enquiry wasn't answered fast enough\n\nOPENING HOOK LINE\nHi [Name], are your event bookings still coming in through WhatsApp messages you have to track manually, or do you have a system that does it for you?\n\nLEAD WITH\nE-Commerce Website (menu + deposit) or Application Development (booking calendar) → SEO Package for event-season visibility.\n\nTOP INDUSTRY OBJECTIONS\nObjection: \"My bookings come from Instagram, I don't need a website.\"\nRebuttal: Instagram gets you seen, but a site with online booking and deposits stops you losing the booking to someone who replies faster than you can between orders.\n\nObjection: \"It's seasonal, I don't need this year-round.\"\nRebuttal: Even more reason to have it always working — it captures bookings and deposits while you're between busy seasons, not just when you're already slammed.\n\nINDUSTRY FAQS\nQ: Can customers pay a deposit online to secure a booking?\nA: Yes, that's built into the E-Commerce checkout.\n\nQ: Can you build a menu people can browse and share?\nA: Yes, with categories, pricing, and photos.",
  },
  {
    id: "sc-industry-automotive",
    title: "Industry Card — Automotive",
    category: "Knowledge Base",
    type: "knowledge",
    body: "Car Washes · Mechanics · Panel Beaters · Detailing · Tyres · Towing\n\nPAIN POINTS\n- No online booking for services\n- Price lists live only in the owner's head\n- Reviews scattered and unmanaged, no \"near me\" visibility\n\nOPENING HOOK LINE\nHi [Name], if someone's car breaks down right now and they search 'mechanic near me' or 'towing near me,' does your business show up first, or your competitor?\n\nLEAD WITH\nBusiness Website with Google Listing Management → SEO Package ① for local \"near me\" ranking.\n\nTOP INDUSTRY OBJECTIONS\nObjection: \"Most of my customers are regulars, I don't need new ones.\"\nRebuttal: Regulars are gold — but every regular started as a first-time customer who found you somehow. This keeps that pipeline open while you focus on the regulars you have.\n\nObjection: \"I don't have time to manage a website.\"\nRebuttal: You wouldn't need to — that's what Google Listing Management and our posting packages are for. You keep fixing cars, we keep you visible.\n\nINDUSTRY FAQS\nQ: Can customers book a service slot online?\nA: Yes, with Application Development we can build a booking calendar.\n\nQ: Can you help manage negative reviews?\nA: Yes, review monitoring is part of our SEO packages.",
  },
  {
    id: "sc-industry-beauty-grooming",
    title: "Industry Card — Beauty & Grooming",
    category: "Knowledge Base",
    type: "knowledge",
    body: "Salons · Barbers · Spas · Makeup Artists · Nail & Beauty Businesses\n\nPAIN POINTS\n- Bookings handled entirely through DMs and WhatsApp\n- No showcase of past work (before/after photos)\n- Double bookings and no-shows with no deposit system\n\nOPENING HOOK LINE\nHi [Name], how much time do you spend each week just replying to DMs asking 'are you free Saturday'?\n\nLEAD WITH\nApplication Development (booking system with deposits) or Business Website + SEO Package ② for consistent posting.\n\nTOP INDUSTRY OBJECTIONS\nObjection: \"My Instagram is my booking system, it works.\"\nRebuttal: It works until you're mid-appointment and missing messages — a proper booking page captures the slot and the deposit without you lifting your phone.\n\nObjection: \"Deposits will scare clients away.\"\nRebuttal: In our experience it does the opposite — it filters out no-shows and signals you're in demand, which clients respect.\n\nINDUSTRY FAQS\nQ: Can clients choose a specific time slot and pay a deposit?\nA: Yes, with an online booking system.\n\nQ: Can you post before/after photos consistently for me?\nA: Yes, that's exactly what our posting packages are for.",
  },
  {
    id: "sc-industry-cleaning-property-services",
    title: "Industry Card — Cleaning & Property Services",
    category: "Knowledge Base",
    type: "knowledge",
    body: "Cleaning Companies · Laundries · Pest Control · Landscaping\n\nPAIN POINTS\n- No online quote requests\n- Invisible in local searches, relies entirely on referrals\n- No way to showcase recurring contract offerings\n\nOPENING HOOK LINE\nHi [Name], when a new estate or business is looking for a cleaning or landscaping contractor and searches online, do they find you?\n\nLEAD WITH\nBusiness Website with quote form → SEO Package ① for local visibility → AI Automation for auto-quoting.\n\nTOP INDUSTRY OBJECTIONS\nObjection: \"I get contracts through tenders and referrals, not Google.\"\nRebuttal: Tenders and referrals are strong — a website adds a second channel, especially for smaller residential or one-off jobs that never go to tender.\n\nObjection: \"This feels like a big-business thing, I'm small.\"\nRebuttal: This is actually where it helps most — small operators win bigger contracts when they look as established online as they are on the ground.\n\nINDUSTRY FAQS\nQ: Can I list different service packages (once-off vs recurring)?\nA: Yes, we can structure your services page around that.\n\nQ: Can customers request a quote instantly online?\nA: Yes, a quote request form is standard on the Business Website.",
  },
  {
    id: "sc-industry-creative-marketing-it",
    title: "Industry Card — Creative / Marketing / IT",
    category: "Knowledge Base",
    type: "knowledge",
    body: "Photographers · Printers · Signage · Branding · IT Support\n\nPAIN POINTS\n- Portfolio scattered across social platforms\n- No central place to show range of work\n- Competing with agencies that look more polished online\n\nOPENING HOOK LINE\nHi [Name], if a potential client wanted to see your full portfolio in one place right now, could you send them a single link?\n\nLEAD WITH\nBusiness Website (portfolio-style) → Application Development if a client portal is needed.\n\nTOP INDUSTRY OBJECTIONS\nObjection: \"I'm in the industry, I could build my own site.\"\nRebuttal: You definitely could — the real value we add is the time you save and the fact you're focused on client work, not your own site build.\n\nObjection: \"My work is on Behance/Instagram already.\"\nRebuttal: Those are great for discovery, but a site you own means you're not at the mercy of an algorithm, and it's the first thing serious clients check before hiring.\n\nINDUSTRY FAQS\nQ: Can you build a portfolio with client testimonials?\nA: Yes, that's a standard section on the Business Website.\n\nQ: Do you offer a client portal for project files/approvals?\nA: Yes, that falls under Application or Custom Software Development.",
  },
  {
    id: "sc-industry-accommodation-travel",
    title: "Industry Card — Accommodation & Travel",
    category: "Knowledge Base",
    type: "knowledge",
    body: "Guesthouses · Self-Catering Accommodation · Travel Agencies\n\nPAIN POINTS\n- Losing direct bookings to OTA commissions (Booking.com/Airbnb fees)\n- No proper way to show rooms and amenities\n- Invisible for local \"accommodation in [town]\" searches\n\nOPENING HOOK LINE\nHi [Name], every booking that comes through Booking.com or Airbnb, you're paying commission on. What if guests could find and book you directly instead?\n\nLEAD WITH\nBusiness Website with booking enquiry form → E-Commerce/Application Development for direct online booking and payments.\n\nTOP INDUSTRY OBJECTIONS\nObjection: \"I already list on Booking.com and Airbnb, that's enough.\"\nRebuttal: Those platforms are great for discovery, but every booking through them costs you commission. A direct site lets returning guests and referrals book you commission-free.\n\nObjection: \"Guests trust booking platforms more than a small business site.\"\nRebuttal: A professional site with real photos, maps and reviews builds that same trust — and we set it up to look every bit as credible.\n\nINDUSTRY FAQS\nQ: Can guests see room availability and book directly?\nA: Yes, with our E-Commerce or Application build.\n\nQ: Can you integrate with our existing booking calendar?\nA: In most cases yes — we scope this during discovery.",
  },
  {
    id: "sc-industry-professional-services",
    title: "Industry Card — Professional Services",
    category: "Knowledge Base",
    type: "knowledge",
    body: "Accountants · Tax Consultants · Insurance · Business Consultants\n\nPAIN POINTS\n- Credibility matters more than flash — an outdated or missing site undermines trust\n- No lead capture for consultations\n- Clients expect a polished, professional first impression before calling\n\nOPENING HOOK LINE\nHi [Name], when a potential client Googles your firm before their first call with you, what do they currently see?\n\nLEAD WITH\nBusiness Website (credibility-focused) → AI Automation Starter for auto-responding to enquiries/scheduling.\n\nTOP INDUSTRY OBJECTIONS\nObjection: \"My clients come through referrals, they don't need a website.\"\nRebuttal: Referred clients still Google you before calling — a site is often what turns 'I heard about them' into 'I trust them enough to call.'\n\nObjection: \"I'm concerned about looking too generic like every other firm.\"\nRebuttal: That's exactly why we don't use templates — we build around your actual positioning, so you look distinct, not interchangeable.\n\nINDUSTRY FAQS\nQ: Can I have a secure client portal for document sharing?\nA: Yes, that falls under Custom Software Development.\n\nQ: Can the site help me capture consultation bookings?\nA: Yes, a quote/enquiry form is standard, and we can add scheduling via Application Development.",
  },
  {
    id: "sc-industry-technical-services",
    title: "Industry Card — Technical Services",
    category: "Knowledge Base",
    type: "knowledge",
    body: "Solar · HVAC · Locksmiths · Pool Businesses\n\nPAIN POINTS\n- High-value, considered purchases where trust and visibility matter\n- Seasonal/emergency demand (AC in summer, locksmith at midnight)\n- Competitors already investing heavily in local SEO\n\nOPENING HOOK LINE\nHi [Name], when someone's AC breaks down in the middle of summer or they're locked out at midnight and they search online, does your business come up first?\n\nLEAD WITH\nBusiness Website with Google Listing + Map → SEO Package ① or ② for competitive local ranking.\n\nTOP INDUSTRY OBJECTIONS\nObjection: \"This is a niche industry, generic marketing won't work.\"\nRebuttal: That's exactly why we don't do generic — we build around your specific service area and search terms, not a one-size-fits-all template.\n\nObjection: \"My competitors already dominate Google, why bother?\"\nRebuttal: That's more reason to start now — every month you wait is a month they pull further ahead. Local SEO is catchable, but not if you never start.\n\nINDUSTRY FAQS\nQ: Can you help me rank for emergency/after-hours searches specifically?\nA: Yes, that's part of our keyword and local SEO strategy.\n\nQ: Can I showcase installations/completed jobs?\nA: Yes, a portfolio/gallery section is standard.",
  },
  {
    id: "sc-industry-health-wellness",
    title: "Industry Card — Health & Wellness",
    category: "Knowledge Base",
    type: "knowledge",
    body: "Physiotherapists · Dentists · Small Healthcare Practices · Gyms\n\nPAIN POINTS\n- Patients expect to book online, not phone during business hours\n- Credibility and professionalism online directly affects trust\n- No visibility for \"near me\" health searches\n\nOPENING HOOK LINE\nHi [Name], if a new patient needs to find a provider like you near them right now and searches online, does your practice come up?\n\nLEAD WITH\nBusiness Website (professional, trust-building) → Application Development for patient booking/portal.\n\nTOP INDUSTRY OBJECTIONS\nObjection: \"Healthcare is personal, people choose by reputation not websites.\"\nRebuttal: Reputation gets someone considering you — a professional site is what confirms that choice before they book, especially for anyone new to the area.\n\nObjection: \"I'm not sure a website is appropriate for a medical practice.\"\nRebuttal: It's actually expected — patients research providers online before ever calling, and a clear, professional site builds the trust that gets that first booking.\n\nINDUSTRY FAQS\nQ: Can patients book appointments online?\nA: Yes, via Application Development with a booking system.\n\nQ: Can the site list practice info like medical aid accepted?\nA: Yes, that's a standard part of the Services/FAQ pages.",
  },
  {
    id: "sc-industry-security-businesses",
    title: "Industry Card — Security Businesses",
    category: "Knowledge Base",
    type: "knowledge",
    body: "Armed Response · Alarm Installation · Monitoring · Guarding\n\nPAIN POINTS\n- Trust and credibility are everything in this industry\n- No visibility for \"armed response near me\" type searches\n- Competing against big national brands online\n\nOPENING HOOK LINE\nHi [Name], when someone in your service area searches for armed response or security installation near them, does your business show up, or only the big national brands?\n\nLEAD WITH\nBusiness Website (trust-focused, with service area map) → SEO Package for local competitive ranking.\n\nTOP INDUSTRY OBJECTIONS\nObjection: \"People choose security companies by reputation and referral, not Google.\"\nRebuttal: That's true for existing relationships — but anyone new to an area or switching providers searches online first, and that's exactly where the big brands currently beat you.\n\nObjection: \"I don't want too much information about my business publicly visible.\"\nRebuttal: Understood — we control exactly what's shown. The goal is capturing enquiries and building trust, not exposing operational detail.\n\nINDUSTRY FAQS\nQ: Can customers request a security assessment/quote online?\nA: Yes, a quote request form is standard.\n\nQ: Can we keep certain information private while still ranking on Google?\nA: Yes, we scope exactly what's public versus not.",
  },
  {
    id: "sc-industry-retail-miscellaneous",
    title: "Industry Card — Retail & Miscellaneous",
    category: "Knowledge Base",
    type: "knowledge",
    body: "General Local Businesses & Shops\n\nPAIN POINTS\n- No online catalog or store\n- Entirely dependent on foot traffic\n- Invisible outside the immediate neighbourhood, no after-hours sales\n\nOPENING HOOK LINE\nHi [Name], right now if your shop is closed, are you still able to make a sale, or does business stop the second you lock the door?\n\nLEAD WITH\nE-Commerce Website (catalog + online payments) → SEO Package for local discovery.\n\nTOP INDUSTRY OBJECTIONS\nObjection: \"I'm a physical shop, online isn't really my thing.\"\nRebuttal: Even a simple catalog site means people can see what you stock and what's in season before they walk in — it drives foot traffic, it doesn't replace it.\n\nObjection: \"I don't have time to manage an online store.\"\nRebuttal: The owner dashboard is built to be simple — a few minutes to update stock or prices, and we handle the technical side.\n\nINDUSTRY FAQS\nQ: Do I need a huge product range to start?\nA: No, even a small catalog works — we can grow it with you.\n\nQ: Can I still take walk-in payments alongside online ones?\nA: Yes, the online store runs independently of your in-person sales.",
  },
  {
    id: "sc-course-mentors",
    title: "Sales Course — Meet Your Mentors",
    category: "Knowledge Base",
    type: "knowledge",
    body: "This course doesn't invent sales theory from scratch — it applies five proven voices in the sales world directly to EmpirialDesigns' own services, scripts, and industries.\n\nVictor Antonio — B2B selling, social selling, and practical negotiation frameworks.\n\nJeffrey Gitomer — Straightforward, real-world advice from a veteran sales consultant: people love to buy, they hate to be sold.\n\nAlex Hormozi — Breaking down massive-value offers, pricing strategy, and direct-response selling.\n\nSales Feed — A modern, research-backed approach to buyer psychology and prospecting.\n\nAnthony Iannarino — Deep strategic insight on B2B account management, prospecting, and closing complex deals.",
  },
  {
    id: "sc-course-quick-reference",
    title: "Sales Course — Quick Reference (All Five Frameworks)",
    category: "Knowledge Base",
    type: "knowledge",
    favourite: true,
    body: "A one-page recall sheet. Keep this open on real calls until each framework becomes second nature.\n\nGitomer — People love to buy, hate being sold. Objections are disguised risk. Never argue price — argue value. The sale begins after the sale.\n\nSales Feed — Buyers decide emotionally, justify logically. Qualify on real urgency, not manufactured pressure. Drop tactics that don't match how people actually decide.\n\nVictor Antonio — Buyers care about revenue, cost, or reach — frame everything through one of the three. Use silence after stating a price. Never give a concession for nothing.\n\nAlex Hormozi — Value = (Dream Outcome × Perceived Likelihood) ÷ (Time Delay × Effort & Sacrifice). Raise value without dropping price.\n\nAnthony Iannarino — Closing starts with the \"commitment for time.\" Every sale is a chain of small commitments — the close is just the last one.",
  },
];

export interface LeadSeed {
  business: string;
  contactPerson: string;
  role: string;
  phone: string;
  email: string;
  industry: string;
  location: string;
  serviceId: string;
  status: string;
  value: number;
  source: string;
  /** Whether this lead should be pre-assigned to a real agent at seed time (round-robin). */
  preAssign: boolean;
  /** Days offset from "now" for a synthetic nextFollowUp; omit for none. */
  followUpInDays?: number;
  lostReason?: string;
}

export const LEAD_SEEDS: LeadSeed[] = [
  { business: "Tshivenda Construction", contactPerson: "Mpho Netshiluvhi", role: "Owner", phone: "+27 15 962 1140", email: "info@tshivendaconstruction.co.za", industry: "Construction", location: "Thohoyandou", serviceId: "svc-web", status: "Interested", value: 3500, source: "Cold List", preAssign: true, followUpInDays: 1 },
  { business: "Makhado Family Dental", contactPerson: "Dr. Rendani Mulaudzi", role: "Practice Manager", phone: "+27 15 516 0092", email: "reception@makhadodental.co.za", industry: "Healthcare", location: "Makhado", serviceId: "svc-ai", status: "Follow-up", value: 5500, source: "Referral", preAssign: true, followUpInDays: 1 },
  { business: "Thohoyandou Funeral Services", contactPerson: "Azwindini Ravhuhali", role: "Director", phone: "+27 15 962 8871", email: "admin@tfsfunerals.co.za", industry: "Funeral Services", location: "Thohoyandou", serviceId: "svc-web", status: "Proposal Sent", value: 5000, source: "Walk-in", preAssign: true, followUpInDays: 2 },
  { business: "Limpopo Solar Solutions", contactPerson: "Karabo Sithole", role: "Sales Manager", phone: "+27 15 291 4432", email: "sales@limposolar.co.za", industry: "Renewable Energy", location: "Polokwane", serviceId: "svc-seo", status: "Closed Won", value: 1800, source: "Website Form", preAssign: true },
  { business: "Venda Guest Lodge", contactPerson: "Tshilidzi Mudau", role: "Owner", phone: "+27 15 963 2214", email: "bookings@vendaguestlodge.co.za", industry: "Hospitality", location: "Thohoyandou", serviceId: "svc-app", status: "Interested", value: 19500, source: "Directory", preAssign: true, followUpInDays: 3 },
  { business: "Makhado Attorneys", contactPerson: "Adv. Lufuno Ramaru", role: "Partner", phone: "+27 15 516 3390", email: "office@makhadoattorneys.co.za", industry: "Legal", location: "Makhado", serviceId: "svc-web", status: "Called", value: 5000, source: "Cold List", preAssign: true },
  { business: "Polokwane Auto Repairs", contactPerson: "Johan van Rooyen", role: "Owner", phone: "+27 15 297 7781", email: "johan@polokwaneauto.co.za", industry: "Automotive", location: "Polokwane", serviceId: "svc-seo", status: "Follow-up", value: 1800, source: "Cold List", preAssign: true, followUpInDays: -1 },
  { business: "Elim Medical Centre", contactPerson: "Sister Nomsa Baloyi", role: "Administrator", phone: "+27 15 556 0043", email: "admin@elimmedical.co.za", industry: "Healthcare", location: "Elim", serviceId: "svc-ai", status: "Not Called", value: 5500, source: "Cold List", preAssign: true },
  { business: "Giyani Fresh Produce", contactPerson: "Hlengani Mkhabela", role: "Owner", phone: "+27 15 812 4419", email: "orders@giyanifresh.co.za", industry: "Agriculture", location: "Giyani", serviceId: "svc-ecom", status: "Interested", value: 7500, source: "Referral", preAssign: true, followUpInDays: 2 },
  { business: "Tzaneen Tyre & Fitment", contactPerson: "Willem Botha", role: "Branch Manager", phone: "+27 15 307 5520", email: "tzaneen@tyrefit.co.za", industry: "Automotive", location: "Tzaneen", serviceId: "svc-design", status: "Closed Won", value: 950, source: "Walk-in", preAssign: true },
  { business: "Louis Trichardt Hardware", contactPerson: "Elmarie Coetzee", role: "Owner", phone: "+27 15 516 7712", email: "sales@lthardware.co.za", industry: "Retail", location: "Louis Trichardt", serviceId: "svc-ecom", status: "Proposal Sent", value: 7500, source: "Cold List", preAssign: true, followUpInDays: 4 },
  { business: "Vhembe Driving School", contactPerson: "Rudzani Nemakonde", role: "Owner", phone: "+27 72 118 9931", email: "vhembedriving@gmail.com", industry: "Education", location: "Thohoyandou", serviceId: "svc-web", status: "Called", value: 3500, source: "Facebook", preAssign: true },
  { business: "Nandoni Catering Co.", contactPerson: "Mulalo Tshikovhi", role: "Owner", phone: "+27 76 445 2201", email: "nandonicatering@gmail.com", industry: "Hospitality", location: "Thohoyandou", serviceId: "svc-design", status: "Not Interested", value: 950, source: "Directory", preAssign: true, lostReason: "No budget this quarter" },
  { business: "Makhado Bakery & Deli", contactPerson: "Anna Sibanda", role: "Manager", phone: "+27 15 516 1188", email: "hello@makhadobakery.co.za", industry: "Retail", location: "Makhado", serviceId: "svc-design", status: "New", value: 950, source: "Cold List", preAssign: false },
  { business: "Polokwane Legal Aid", contactPerson: "Adv. Kgomotso Maake", role: "Office Manager", phone: "+27 15 291 0074", email: "info@polokwanelegal.co.za", industry: "Legal", location: "Polokwane", serviceId: "svc-web", status: "New", value: 5000, source: "Directory", preAssign: false },
  { business: "Elim Beauty Bar", contactPerson: "Rofhiwa Mashau", role: "Owner", phone: "+27 78 220 4471", email: "elimbeautybar@gmail.com", industry: "Beauty", location: "Elim", serviceId: "svc-app", status: "New", value: 19500, source: "Facebook", preAssign: false },
  { business: "Giyani Logistics Hub", contactPerson: "Sibusiso Chauke", role: "Operations Director", phone: "+27 15 812 9903", email: "ops@giyanilogistics.co.za", industry: "Logistics", location: "Giyani", serviceId: "svc-ai", status: "Assigned", value: 5500, source: "Referral", preAssign: true },
  { business: "Tzaneen Citrus Estate", contactPerson: "Pieter Marais", role: "General Manager", phone: "+27 15 307 1129", email: "info@tzaneencitrus.co.za", industry: "Agriculture", location: "Tzaneen", serviceId: "svc-ecom", status: "Closed Won", value: 7500, source: "Website Form", preAssign: true },
  { business: "Thohoyandou Wellness Clinic", contactPerson: "Dr. Tendani Ravele", role: "Owner", phone: "+27 15 962 3345", email: "clinic@thowellness.co.za", industry: "Healthcare", location: "Thohoyandou", serviceId: "svc-seo", status: "Closed Won", value: 1800, source: "Referral", preAssign: true },
  { business: "Makhado Panel Beaters", contactPerson: "Shaun Pillay", role: "Owner", phone: "+27 15 516 4409", email: "shaun@makhadopanel.co.za", industry: "Automotive", location: "Makhado", serviceId: "svc-web", status: "Closed Lost", value: 3500, source: "Cold List", preAssign: true, lostReason: "Went with a cheaper freelancer" },
  { business: "Louis Trichardt Guest House", contactPerson: "Marlene Prinsloo", role: "Owner", phone: "+27 15 516 8823", email: "stay@ltguesthouse.co.za", industry: "Hospitality", location: "Louis Trichardt", serviceId: "svc-web", status: "Follow-up", value: 3500, source: "Directory", preAssign: true, followUpInDays: 0 },
  { business: "Venda Tech Repairs", contactPerson: "Khathu Nemadodzi", role: "Owner", phone: "+27 73 990 1123", email: "vendatech@gmail.com", industry: "Retail", location: "Thohoyandou", serviceId: "svc-seo", status: "Interested", value: 1800, source: "Walk-in", preAssign: true, followUpInDays: 2 },
  { business: "Polokwane Kids Academy", contactPerson: "Naledi Phiri", role: "Principal", phone: "+27 15 291 6612", email: "office@pkacademy.co.za", industry: "Education", location: "Polokwane", serviceId: "svc-web", status: "Not Called", value: 5000, source: "Cold List", preAssign: true },
  { business: "Giyani Funeral Parlour", contactPerson: "Themba Maluleke", role: "Director", phone: "+27 15 812 3320", email: "info@giyanifunerals.co.za", industry: "Funeral Services", location: "Giyani", serviceId: "svc-web", status: "Called", value: 5000, source: "Cold List", preAssign: true },
  { business: "Tzaneen Solar & Electrical", contactPerson: "Riaan Steyn", role: "Owner", phone: "+27 15 307 8890", email: "riaan@tzaneensolar.co.za", industry: "Renewable Energy", location: "Tzaneen", serviceId: "svc-ai", status: "Follow-up", value: 5500, source: "Referral", preAssign: true, followUpInDays: -2 },
  { business: "Elim Community Pharmacy", contactPerson: "Nkateko Mabunda", role: "Pharmacist", phone: "+27 15 556 2287", email: "elimpharmacy@gmail.com", industry: "Healthcare", location: "Elim", serviceId: "svc-ecom", status: "Not Called", value: 7500, source: "Directory", preAssign: true },
  { business: "Makhado Steel Works", contactPerson: "Gerhard du Toit", role: "Owner", phone: "+27 15 516 9931", email: "info@makhadosteel.co.za", industry: "Construction", location: "Makhado", serviceId: "svc-seo", status: "New", value: 1800, source: "Cold List", preAssign: false },
  { business: "Thohoyandou Print Shop", contactPerson: "Ntsieni Muvhali", role: "Owner", phone: "+27 71 442 7765", email: "thoprint@gmail.com", industry: "Retail", location: "Thohoyandou", serviceId: "svc-design", status: "Assigned", value: 950, source: "Walk-in", preAssign: true },
  { business: "Polokwane Fleet Services", contactPerson: "Dineo Mokoena", role: "Fleet Manager", phone: "+27 15 291 3348", email: "fleet@polokwanefleet.co.za", industry: "Logistics", location: "Polokwane", serviceId: "svc-app", status: "Proposal Sent", value: 19500, source: "Website Form", preAssign: true, followUpInDays: 5 },
  { business: "Louis Trichardt Vet Clinic", contactPerson: "Dr. Hannes Kruger", role: "Veterinarian", phone: "+27 15 516 2204", email: "vet@ltvet.co.za", industry: "Healthcare", location: "Louis Trichardt", serviceId: "svc-ai", status: "Not Called", value: 5500, source: "Directory", preAssign: true },
];
