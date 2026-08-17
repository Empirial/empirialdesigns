// Nav coder config. Owns src/components/Navigation.tsx (see agents/shared.js
// SECTION_FILES). Add anything nav-specific to extraInstructions below —
// it gets appended to every prompt this coder receives.
module.exports = {
  wireframes: [
    'Logo left, horizontal nav links centered, single filled CTA button far right.',
    'Logo left, nav links immediately right of it, no separate CTA (CTA styled as the last nav link).',
    'Logo centered, nav links split evenly on either side of it.',
    'Logo left, nav links collapsed behind a menu control even on desktop, CTA button visible top-right.',
    'Logo left, nav links right, plus a slim secondary utility row above it (contact/social icons).',
    'Minimal nav: logo left only, single CTA button right, no visible link list.',
    'Logo left, nav links right, CTA styled as an outline/bordered button rather than filled.',
    'Two-tier nav: slim top bar with contact info/social icons, main bar below with logo + links + CTA.',
    'Logo left, nav links center-right, a phone number or contact detail shown prominently instead of a CTA button.',
    // Style packs — ids 10/11/12, see agents/shared.js STYLE_WIREFRAME_ID.
    'Apple style: translucent sticky bar, tight-tracked small logo, rounded pill CTA.',
    'Brutalist style: thick-bordered bar, uppercase bold links, hard-bordered high-contrast CTA button.',
    'Minimalist style: thin single hairline border, quiet lowercase-weight links, CTA styled as an understated underlined text link.',
  ],
  extraInstructions: '',
};
