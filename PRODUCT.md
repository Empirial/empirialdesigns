# Product

## Register

product

## Users

Two groups share this codebase:

- **Prospective agency clients** browsing the public marketing site (Home, Services, Portfolio, About, Contact) to evaluate Empirial Designs and get in touch. This surface is `brand` register and is out of scope for this document — see `src/features/marketing/`.
- **Signed-up platform users** using the AI website-generator product: sign in, describe or pick a template for a site, get a real GitHub repo with AI-generated code, then preview and iteratively edit it in-browser before publishing. This is the `product` register this file governs: `src/features/auth/`, `src/features/repositories/` (RepoManagement, Preview), and `src/features/platform/`.

Context: a solo founder or small-business owner who wants a working website without hiring a developer, working at a laptop, moving fast, judging credibility partly by how the tool itself looks and behaves.

## Product Purpose

Let a signed-in user describe or select what they want, generate a real working website (React/Vite/Tailwind) via AI into a GitHub repo, then preview, edit, and publish it — with progress and trust visible at every step (loading, saved, deployed).

## Brand Personality

Clean, trustworthy, engineered — Stripe as the reference point. Confident through restraint and precision, not through decoration. Generous whitespace, clear hierarchy, a single accent color used deliberately rather than everywhere. The interface should read as a serious tool an actual engineer would ship, not a marketing page pretending to be an app.

## Anti-references

Explicitly reject the "generic AI SaaS" look:
- Purple-to-blue gradient heroes and gradient-filled buttons used as decoration
- Gradient text (`background-clip: text`) on headings
- Glassmorphic cards (`backdrop-blur` + translucent panels) used as a default surface treatment
- Hero-metric stat blocks (big number + small label + supporting stats)
- Neon-on-black crypto/trading dashboard energy

Note: the current codebase (Auth, RepoManagement) already leans on indigo/purple gradients and glassmorphic panels — that is the pattern being actively moved away from, not a style to preserve.

## Design Principles

1. **Restraint reads as trust.** One accent color, used sparingly and consistently for primary actions and state — not for every button, border, and background.
2. **Show real state, never fake it.** Loading, empty, error, and success states must reflect what's actually happening (a real Firestore write, a real Cloud Function call) — no toast that lies about what just happened.
3. **Hierarchy through type and space, not chrome.** Prefer size/weight contrast and spacing rhythm over borders, shadows, or gradient dividers to separate content.
4. **Consistency across the three platform pages.** Auth, RepoManagement, and Preview should read as one product, not three separately-themed prototypes.
5. **Dense where it earns density.** The Preview/editor workspace is a power-tool surface (code, chat, live preview) — it can be tighter and more information-dense than Auth, which should stay spare.

## Accessibility & Inclusion

Baseline WCAG AA: visible focus states on all interactive elements, sufficient contrast on text over any background treatment, no color-only status indicators, keyboard-operable dialogs/menus (inherited for free from Radix primitives already in use).
