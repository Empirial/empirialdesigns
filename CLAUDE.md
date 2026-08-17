# CLAUDE.md — Frontend Website Rules

## Project Overview
- **Stack:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Root:** `C:/Users/mphel/Downloads/empirialdesigns/`
- **Supabase:** Auth and DB via `src/integrations/supabase/client.ts`
- **Routing:** React Router v6, routes defined in `src/App.tsx`
- **UI Components:** shadcn/ui in `src/components/ui/`

## Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.

## Reference Images
- If a reference image is provided: match layout, spacing, typography, and color exactly. Swap in placeholder content (images via `https://placehold.co/`, generic copy). Do not improve or add to the design.
- If no reference image: design from scratch with high craft (see guardrails below).
- Screenshot your output, compare against reference, fix mismatches, re-screenshot. Do at least 2 comparison rounds. Stop only when no visible differences remain or user says so.

## Local Server
- **Always serve on localhost** — never screenshot a `file:///` URL.
- Start the dev server: `npm run dev` (Vite serves at `http://localhost:8080` by default)
- Dev server runs from project root: `C:/Users/mphel/Downloads/empirialdesigns/`
- If the server is already running, do not start a second instance.

## Screenshot Workflow
- Puppeteer is **not pre-installed** in this project — check `node_modules` before assuming it's available.
- If screenshots are needed, install puppeteer: `npm install --save-dev puppeteer`
- **Always screenshot from localhost:** use the Vite dev server URL (typically `http://localhost:8080`)
- After screenshotting, read the PNG with the Read tool — Claude can see and analyze the image directly.
- When comparing, be specific: "heading is 32px but reference shows ~24px", "card gap is 16px but should be 24px"
- Check: spacing/padding, font size/weight/line-height, colors (exact hex), alignment, border-radius, shadows, image sizing

## Output Defaults
- All pages live in `src/pages/` — use PascalCase filenames (e.g., `MyPage.tsx`)
- Register new routes in `src/App.tsx` above the `<Route path="*" />` catch-all
- Reusable components go in `src/components/`
- Use shadcn/ui primitives where possible; custom Tailwind for bespoke designs
- Placeholder images: `https://placehold.co/WIDTHxHEIGHT`
- Mobile-first responsive

## Brand Assets
- Always check the `public/` folder before designing. It may contain logos, color guides, or images.
- If assets exist there, use them. Do not use placeholders where real assets are available.
- Current brand color feel: warm cream background (`#f0ede8`, `#f5f1eb`), mesh gradients (blue, purple, pink), dark charcoal CTAs (`#1f2937`)

## Anti-Generic Guardrails
- **Colors:** Never use default Tailwind palette (indigo-500, blue-600, etc.). Pick a custom brand color and derive from it.
- **Shadows:** Never use flat `shadow-md`. Use layered, color-tinted shadows with low opacity.
- **Typography:** Never use the same font for headings and body. Pair a display/serif with a clean sans. Apply tight tracking (`-0.03em`) on large headings, generous line-height (`1.7`) on body.
- **Gradients:** Layer multiple radial gradients. Add grain/texture via SVG noise filter for depth.
- **Animations:** Only animate `transform` and `opacity`. Never `transition-all`. Use spring-style easing.
- **Interactive states:** Every clickable element needs hover, focus-visible, and active states. No exceptions.
- **Images:** Add a gradient overlay (`bg-gradient-to-t from-black/60`) and a color treatment layer with `mix-blend-multiply`.
- **Spacing:** Use intentional, consistent spacing tokens — not random Tailwind steps.
- **Depth:** Surfaces should have a layering system (base → elevated → floating), not all sit at the same z-plane.

## Hard Rules
- Do not add sections, features, or content not in the reference
- Do not "improve" a reference design — match it
- Do not stop after one screenshot pass
- Do not use `transition-all`
- Do not use default Tailwind blue/indigo as primary color
- **File casing:** Always use PascalCase for page/component files. TypeScript on this project enforces strict casing — mismatches will cause build errors.
- **Imports:** Match import paths exactly to the physical filename casing (e.g., `./pages/GenerateWebsite` not `./pages/generatewebsite`)
