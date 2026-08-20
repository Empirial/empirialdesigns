// About coder config. Owns src/components/About.tsx (see agents/shared.js
// SECTION_FILES). Add anything about-specific to extraInstructions below —
// it gets appended to every prompt this coder receives.
module.exports = {
  wireframes: [
    'Two-column: paragraph text on the left, supporting image on the right.',
    'Two-column reversed: image on the left, paragraph text on the right.',
    'Centered single-column story text with a visually distinct pull-quote mid-paragraph.',
    'Text block on top, 3-4 stat/number highlights in a row beneath it.',
    'Timeline/milestones layout presenting the company story as sequential steps.',
    'Text block plus a grid of small value/principle cards beneath it.',
    'Full-width text block over a large background image, text on a semi-transparent panel.',
    'Split layout with a founder/team photo beside a short bio paragraph.',
    'Text on the left, a checklist/bullet list of differentiators on the right.',
    // Style packs — ids 10/11/12, see agents/shared.js STYLE_WIREFRAME_ID.
    'Apple style: centered story text, tight-tracked heading, a large rounded image beneath with a soft layered shadow.',
    'Brutalist style: hard-bordered two-column block, uppercase headline, grayscale photo boxed in its own bordered panel.',
    'Minimalist style: quiet single-column text block, no image, generous line-height, medium (not bold) heading weight.',
  ],
  extraInstructions: '',
};
