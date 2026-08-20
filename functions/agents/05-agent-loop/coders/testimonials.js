// Testimonials coder config. Owns src/components/Testimonials.tsx (see
// agents/shared.js SECTION_FILES). Add anything testimonials-specific to
// extraInstructions below — it gets appended to every prompt this coder
// receives.
module.exports = {
  wireframes: [
    'Grid of quote cards (3 columns), each with an avatar, name, and short quote.',
    'Single large centered quote with avatar, carousel dots beneath for rotating through more.',
    'Two-column: one large featured testimonial on the left, a list of shorter quotes on the right.',
    'Horizontal row of quote cards.',
    'A row of client/partner logos above a single centered featured quote.',
    'Three trust stats (e.g. "500+ clients") above a row of short quotes.',
    'Video-testimonial style cards: thumbnail with a play affordance, name and title beneath each.',
    'Staggered/masonry grid of quote cards at varying heights.',
    'Single-column stacked list of full-width quotes, each separated by a divider.',
    // Style packs — ids 10/11/12, see agents/shared.js STYLE_WIREFRAME_ID.
    'Apple style: 3 glass/translucent rounded quote cards with avatars.',
    'Brutalist style: 3 hard-bordered quote blocks, one highlighted with a bold accent fill, uppercase attribution.',
    'Minimalist style: quiet stacked list of quotes with a divider between each, no cards or avatars.',
  ],
  extraInstructions: '',
};
