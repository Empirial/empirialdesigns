// Services coder config. Owns src/components/Services.tsx (see
// agents/shared.js SECTION_FILES). Add anything services-specific to
// extraInstructions below — it gets appended to every prompt this coder
// receives.
module.exports = {
  wireframes: [
    'Grid of cards (3 columns), each with an icon, title, and short description.',
    'Grid of larger cards (2 columns), each with an image, title, and description.',
    'Stacked horizontal rows, each with an icon on the left and title + description on the right.',
    'Tabbed layout: service categories as tabs, a single content panel changes below the selected tab.',
    'Alternating layout: each service alternates image-left/text-right, then image-right/text-left.',
    'Numbered-steps layout (01, 02, 03…) presenting services as a process.',
    'Accordion layout: services listed as collapsible rows that expand to show detail.',
    'One featured service shown large at the top, remaining services in a smaller grid below.',
    'Pricing-card style: each service is a comparison card with its own CTA.',
    // Style packs — ids 10/11/12, see agents/shared.js STYLE_WIREFRAME_ID.
    'Apple style: 3 glass/translucent rounded cards with a filled icon circle, subtle lift on hover.',
    'Brutalist style: 3 hard-bordered blocks in one bordered row, no rounding, blunt uppercase titles.',
    'Minimalist style: quiet stacked list rows (icon + title + description), divider lines, no cards.',
  ],
  extraInstructions: '',
};
