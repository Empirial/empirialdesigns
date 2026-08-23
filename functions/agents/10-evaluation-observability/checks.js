// Layer 10: pattern checks run against a Coder's actual stamped output —
// the copy-tell rules 02-system-prompts/coder.js instructs the model to
// follow (see its own comment, and docs/VIBE_CODED_REPORT.md), turned into
// something a script can catch instead of a human eyeballing every diff.
// A pass here doesn't guarantee good copy (that still needs a human read —
// run-eval.js prints the text either way); it catches the specific, named
// regressions those prompt rules exist to prevent.

const BANNED_COPY_PATTERNS = [
  {
    id: 'em-en-dash',
    label: 'em dash (—) or en dash (–)',
    test: (text) => /[—–]/.test(text),
  },
  {
    id: 'generic-tagline',
    label: 'hollow filler tagline',
    test: (text) => /\b(build your dreams|launch faster|create without limits|where ideas become reality|the future of)\b/i.test(text),
  },
  {
    id: 'buzzword-stack',
    label: 'buzzword stacking (2+ of: innovative/seamless/revolutionary/game-changing/cutting-edge/unlock/unleash/elevate/empower)',
    test: (text) => {
      const hits = text.match(/\b(innovative|seamless|revolutionary|game-changing|cutting-edge|unlock|unleash|elevate|empower)\b/gi);
      return Boolean(hits && hits.length >= 2);
    },
  },
  {
    id: 'decorative-emoji',
    label: 'decorative emoji',
    // eslint-disable-next-line no-misleading-character-class
    test: (text) => /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(text),
  },
  {
    id: 'bare-generic-cta',
    label: 'bare generic CTA ("Learn more" / "Click here")',
    test: (text) => /(>|\s)(learn more|click here)(<|\s|\.)/i.test(text),
  },
];

/** Runs every pattern against one Coder's stamped file content. Returns the
 * list of pattern ids that matched (empty = clean). */
function findCopyTells(text) {
  return BANNED_COPY_PATTERNS.filter((p) => p.test(text)).map((p) => ({ id: p.id, label: p.label }));
}

module.exports = { BANNED_COPY_PATTERNS, findCopyTells };
