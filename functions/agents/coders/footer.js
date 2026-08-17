// Footer coder config. Owns src/components/Footer.tsx (see agents/shared.js
// SECTION_FILES). Add anything footer-specific to extraInstructions below —
// it gets appended to every prompt this coder receives. Contact-details
// handling (real vs. mock) is decided upstream by the Goal Setter and
// arrives here as part of the goal text, not as separate config.
module.exports = {
  wireframes: [
    '4-column layout: brand/logo + tagline, nav links, services links, contact details.',
    'Simple centered footer: logo, one row of links, copyright line beneath.',
    '2-column layout: contact details + address on the left, newsletter signup form on the right.',
    'A wide CTA banner ("Ready to start?") above the standard link columns.',
    'High-contrast footer with a social icons row prominently displayed above the link columns.',
    'Minimal single-row footer: logo left, copyright + legal links right.',
    '3-column layout: short about blurb, sitemap links, contact + social icons.',
    'Footer with an embedded map/location block beside the contact details.',
    'Footer with a contact form beside the brand and nav link columns.',
    // Style packs — ids 10/11/12, see agents/shared.js STYLE_WIREFRAME_ID.
    'Apple style: translucent 4-column footer, tight-tracked brand name, quiet uppercase column labels.',
    'Brutalist style: inverted high-contrast 4-column footer (dark fill), bold uppercase everything, one accent-colored hover state.',
    'Minimalist style: quiet 3-column footer, thin hairline divider, no icons background fill.',
  ],
  extraInstructions: '',
};
