// Layer 10: the fixed set of test cases the eval suite (run-eval.js) runs
// against the live pipeline. Two kinds:
//   GOAL_SETTER_CASES — one "create" per business type goalSetter.js's own
//     color-inference rules name explicitly, plus one edit case per branch
//     of its classification logic (a section edit, a recolor, a no-op/
//     clarification, a status query, a file_fix). Each has an `expect`
//     function that gets the parsed result from agents/05-agent-loop/
//     goalSetter.js's run() and returns true/false.
//   COPY_CASES — one goal per section, run through the real Coder
//     (05-agent-loop/coders/runCoder.js) so the eval checks actual stamped
//     output, not just the prompt in isolation. Checked against
//     checks.js's BANNED_COPY_PATTERNS.
//
// Keep this list small and fast to eyeball — it exists to catch a prompt
// regression before it ships (see agents/README.md's layer 10 note), not to
// be an exhaustive corpus. Add a case here whenever a system prompt change
// (goalSetter.js, coder.js) is meant to fix a specific misclassification or
// copy tell — that's the regression this suite exists to pin down.

const GOAL_SETTER_CASES = [
  {
    name: 'create — bakery (warm/amber hue)',
    intent: 'create',
    rawInput: "Build a website for Miller's Bakery, a small neighborhood bakery in Portland known for sourdough and morning pastries.",
    expect: (r) => r.affectedSections.length === 6 && r.palette.accentHue >= 15 && r.palette.accentHue <= 45,
  },
  {
    name: 'create — law firm (navy/teal hue)',
    intent: 'create',
    rawInput: 'Create a site for Hargrove & Associates, a family law firm in Denver. Should feel formal and trustworthy.',
    expect: (r) => r.affectedSections.length === 6 && r.palette.accentHue >= 180 && r.palette.accentHue <= 220,
  },
  {
    name: 'create — wellness studio (green hue)',
    intent: 'create',
    rawInput: 'Build a site for Evergreen Wellness, an organic/eco-friendly yoga and wellness studio.',
    expect: (r) => r.affectedSections.length === 6 && r.palette.accentHue >= 120 && r.palette.accentHue <= 160,
  },
  {
    name: 'edit — hero-only content change',
    intent: 'edit',
    rawInput: 'Change the hero headline to mention our new weekend hours.',
    sectionManifest: [{ id: 'hero', summary: 'Bakery hero with headline and CTA', wireframe: 2 }],
    expect: (r) => r.affectedSections.includes('hero') && !r.statusQuery && !r.fileFix && !r.recolor,
  },
  {
    name: 'edit — explicit recolor',
    intent: 'edit',
    rawInput: 'Change the accent color to a deep forest green.',
    sectionManifest: [{ id: 'hero', summary: 'Bakery hero', wireframe: 2 }],
    expect: (r) => r.recolor === true,
  },
  {
    name: 'edit — greeting is a no-op, not a section edit',
    intent: 'edit',
    rawInput: 'hey! this looks great so far',
    sectionManifest: [
      { id: 'hero', summary: 'Bakery hero', wireframe: 2 },
      { id: 'about', summary: 'About the bakery', wireframe: 1 },
    ],
    expect: (r) => r.affectedSections.length === 0 && !r.statusQuery && !r.fileFix && !r.recolor,
  },
  {
    name: 'edit — status question, not a content edit',
    intent: 'edit',
    rawInput: 'is my site live yet? what URL is it on?',
    sectionManifest: [{ id: 'hero', summary: 'Bakery hero', wireframe: 2 }],
    expect: (r) => r.statusQuery === true && r.affectedSections.length === 0,
  },
  {
    name: 'edit — build error routes to file_fix',
    intent: 'edit',
    rawInput: "The site crashes on load: Could not find module '@/components/ui/sonner'.",
    sectionManifest: [{ id: 'hero', summary: 'Bakery hero', wireframe: 2 }],
    expect: (r) => r.fileFix === true && !r.statusQuery,
  },
  {
    name: 'edit — map request routes to footer, no address given',
    intent: 'edit',
    rawInput: 'Can you add a map showing our location?',
    sectionManifest: [{ id: 'hero', summary: 'Bakery hero', wireframe: 2 }],
    expect: (r) => r.affectedSections.includes('footer') && r.realAddress === null,
  },
  {
    name: 'edit — real address in message is captured verbatim',
    intent: 'edit',
    rawInput: "Add a map — we're at 118 SE Alder St, Portland, OR 97214.",
    sectionManifest: [{ id: 'hero', summary: 'Bakery hero', wireframe: 2 }],
    expect: (r) => r.affectedSections.includes('footer') && typeof r.realAddress === 'string' && r.realAddress.includes('118 SE Alder'),
  },
];

const COPY_CASES = [
  {
    section: 'hero',
    goal: "Hero for Riverside Family Dental, a friendly dental practice in Austin, TX. Primary CTA books an appointment.",
  },
  {
    section: 'about',
    goal: "About section for Riverside Family Dental — family-owned, 15 years serving Austin, gentle care for anxious patients.",
  },
  {
    section: 'services',
    goal: "Services list for Riverside Family Dental: cleanings, whitening, Invisalign, emergency same-day appointments.",
  },
  {
    section: 'testimonials',
    goal: "Testimonials section for Riverside Family Dental. No real reviews linked yet — invent plausible ones.",
  },
  {
    section: 'nav',
    goal: "Navigation for Riverside Family Dental linking to the other sections, with a 'Book now' CTA.",
  },
  {
    section: 'footer',
    goal: "Footer for Riverside Family Dental with contact info and copyright.",
  },
];

module.exports = { GOAL_SETTER_CASES, COPY_CASES };
