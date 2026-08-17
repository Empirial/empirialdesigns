// Hero coder config. Owns src/components/Hero.tsx (see agents/shared.js
// SECTION_FILES). Add anything hero-specific to extraInstructions below —
// it gets appended to every prompt this coder receives.
module.exports = {
  wireframes: [
    'Centered stack: small eyebrow label, large centered headline, subheading, single CTA button, no image.',
    'Split layout: headline + subheading + CTA on the left half, image/illustration on the right half.',
    'Full-bleed background image with a centered headline and CTA overlaid on top.',
    'Headline at top spanning the width, supporting image full-width directly below, CTA button beneath the image.',
    'Centered headline + subheading with two CTA buttons side by side (primary + secondary).',
    'Split layout reversed: image/illustration on the left, headline + subheading + CTA on the right.',
    'Left-aligned (not centered) headline + subheading, small stat or trust-badge row beneath the CTA.',
    'Card-style hero: headline and CTA sit inside a bordered/elevated card floating over a subtle background.',
    'Minimal text-only hero: small eyebrow, headline, one-line subheading, no CTA button.',
    // Style packs — ids 10/11/12, see agents/shared.js STYLE_WIREFRAME_ID.
    'Apple style: centered, huge tight-tracking headline, small eyebrow, primary rounded pill CTA plus a secondary "Learn more"-style text link.',
    'Brutalist style: left-aligned, huge uppercase block headline, a stamp-style eyebrow tag, hard-bordered CTA button with an offset drop shadow.',
    'Minimalist style: quiet left-aligned headline (not oversized/bold), generous whitespace, single understated underlined text-link CTA.',
  ],
  extraInstructions: '',
};
