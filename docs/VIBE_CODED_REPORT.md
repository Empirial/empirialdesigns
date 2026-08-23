# The "Vibe Coded" Report

> Source material for [`agents/02-system-prompts/coder.js`](../functions/agents/02-system-prompts/coder.js)'s
> copy-quality rules — see the note at the end of this doc for exactly which
> parts of this report are actually enforced in this codebase, and which
> aren't (and why).

## Introduction

I spent weeks combing through more than 500 vibe coded websites across
Reddit, Hacker News, Indie Hackers, Twitter threads, Product Hunt launches,
and small personal sites built in the middle of the night.

Patterns repeat. Mistakes repeat. Aesthetic habits repeat.

This report documents every consistent marker that signals a website was
coded fast, rushed, and guided more by vibes than intention. It is not a
criticism. It is a source of awareness. Shipping fast is good, but shipping
fast without clarity creates a very distinct look.

Use this report to avoid that look or lean into it intentionally.

## Section 1. Visual red flags

These are the most common visual giveaways that instantly scream vibe coded.

### 1. The signature purple problem
- Random purple gradient hero sections
- Neon purple text shadows
- Purple hover fills on buttons
- Purple glow drop shadows
- Purple accents even when the brand is not purple at all
- Purple on purple so nothing stands out

Purple is the unofficial mascot of vibe coded design.

### 2. Sparkle icons everywhere
The sparkle emoji or sparkle icon shows up in hero text, buttons, pricing
cards, and even footers. Example: "Launch your idea today ✨"

One sparkle is (maybe) fine. Twenty sparkles is a vibe coded diagnosis.

### 3. Hover animations on every card
Hover effects are overused. The big offenders:
- Cards lifting up aggressively
- Cards rotating slightly
- Cards moving a few pixels but breaking alignment
- Hover shadows that look like a flashlight under the mouse
- Buttons that bounce

Hover animations are fine when subtle. Vibe coded sites are never subtle.

### 4. Emojis used as UI elements
Emojis instead of icons. Emojis inside headings. Emojis on buttons. Emojis
in the footer. Emojis as bullets in pricing tables. Emoji overload is a key
signal of rushed UI decisions.

### 5. Fake testimonials
Huge vibe coded energy.
- Avatar looks AI generated
- Name is "Sarah P."
- Quote is generic like "Helped me so much"
- No job title
- No link
- Repeated wording
- Same face used twice

The viewer can feel the lack of legitimacy instantly.

### 6. Social icons that do nothing
Especially the Instagram icon that leads to "#". Or Twitter link goes to
twitter.com. Or LinkedIn opens a 404. If a social icon is there only for
decoration, it becomes a vibe coded tell.

### 7. Massive icons with tiny text
The visual hierarchy looks inverted. Huge 48px icon. Text so small it feels
like an afterthought. This creates cheapness.

### 8. Generic fonts with no rhythm
Most vibe coded sites use: Inter, Poppins, Montserrat, Roboto.

Nothing wrong with the fonts, but the usage becomes vibe coded when:
- Heading weight is too thick
- Body text is too light
- Line height is inconsistent
- No spacing rhythm

Typography reveals whether thought went into the build.

### 9. Semi transparent headers
These show up everywhere. Often combined with:
- Blur backgrounds
- Thin borders
- Low contrast text

It becomes a vibe coded tell when the transparency interacts poorly with
scrolling content.

### 10. Bad animations
- Lottie animations that do not match the brand
- Wiggle effects
- Bounce overshoot
- Cards popping into place with no easing
- Scroll animations that stutter
- Animations triggered too early

Bad animation is a dead giveaway of rushed builds.

## Section 2. Structural red flags

These are layout and UX issues that show up again and again.

### 1. No loading states
A big one. When you click something and nothing happens for seconds, the
whole experience feels amateur.

Signs of missing loading states:
- Button stays the same during async actions
- No skeleton screens
- No progress indicator
- Empty white gaps while data loads

Even one loading indicator can fix this instantly.

### 2. Inconsistent component placement
Components move around from page to page.
- Button sizes change
- Padding changes
- Text alignment switches randomly
- Containers have random widths

This often happens when people copy paste components without a system.

### 3. Slow server actions
Pages hang. Buttons freeze. Animations lag.

Not a visual issue, but users feel it. And when users feel it, the entire
site gets labeled vibe coded.

### 4. Misaligned grids
- Cards not aligned
- Uneven spacing
- Margins collapsing
- Sticky elements drifting out of position

One pixel misalignment can destroy the entire visual impression.

### 5. Too many different border radiuses
Huge giveaway.
- 4px here
- 12px there
- 32px buttons
- Circular avatars
- Square images

Inconsistent radiuses make everything look unintentional.

## Section 3. Content and copy red flags

Copywriting also gives away vibe coded builds.

### 1. Slightly off copyright text
- "All right reversed"
- "Copyright 2024 YourSiteName"
- "Created by yourbrand"
- "Made by Me"

Looks small, but it signals lack of polish.

### 2. Meaningless taglines
Examples seen dozens of times:
- "Build your dreams"
- "Launch faster"
- "Create without limits"
- "Where ideas become reality"
- "The future of something"

These are filler phrases that make a website feel empty.

### 3. Overloaded hero sections
Everything thrown into one place: sparkle, emoji, gradient, button, second
button, animated card, microcopy, background image, shadow, Lottie
animation.

Hero sections often look like everything was placed there in one sitting.

## Section 4. Technical red flags

Signals that the project was shipped fast without cleanup.

### 1. Missing meta tags
- No OpenGraph image
- HTML title says "Home"
- No description

Instant vibe coded marker.

### 2. Broken responsiveness
- Text overflowing
- Cards stacked weird
- Buttons too wide
- Layout collapsing on mobile

This was extremely common.

### 3. Non-functional interactive elements
- Carousels that do not slide
- Tabs that do not tab
- Accordions that do not open
- Modals that never close
- Dark mode toggle that does nothing

When interactive elements do not respond, users assume vibe coded.

## Section 5. Vibe coded energy checklist

A compressed master list to use before shipping a site. If you check 5 or
more, your site probably looks vibe coded.

**Brand and visuals:** purple gradient · sparkle emoji · hover animations
everywhere · emojis in headings · fake testimonials · massive icons ·
generic font combos · semi transparent header · random border radiuses

**UX and layout:** inconsistent components · no loading state · misaligned
grids · slow interactions · sticky header jitter · weird spacing rhythm

**Technical:** missing OG image · no favicon · non-functional buttons · bad
mobile layout · placeholder text left in

**Copy:** generic taglines · slightly off copyright text · buzzword
stacking · no value proposition

## Section 6. The fix — how to remove all vibe coded energy

The core fixes:
- Establish a 4 or 8 point spacing system
- Pick one font pair and stick to it
- Standardize border radiuses
- Remove most animations
- Create one elevation style and reuse it
- Fix responsiveness before polishing desktop
- Add loading states everywhere
- Tighten your copy to a single clear promise
- Test every button, link, and social icon
- Reduce visual novelty and increase clarity

The fastest way to make a site feel premium is consistency.

### The LLM prompt

> You are a senior product designer and front end engineer who specialises
> in clean, premium, intentional UI. Your job is to generate websites and
> components that never look vibe coded. Every output must show clarity,
> consistency, structure, and thoughtful design decisions. You should
> behave like someone who builds design systems for a living, not like
> someone generating a quick MVP.
>
> Begin every project by establishing a strict spacing rhythm. Choose
> either a 4 point or 8 point scale and use it everywhere for margins,
> padding, and gaps. Never introduce random spacing values. A predictable
> rhythm is one of the clearest signals of polish, and rhythm breaks are
> one of the clearest signals of vibe coded work.
>
> Typography must also follow a clear system. Select a single heading font
> and a single body font. Define a type ramp with consistent sizes and line
> heights, then apply it without improvisation. Headings should feel
> intentional and should follow a logical hierarchy. Body text should never
> be overly bold or overly light, and spacing between text blocks must be
> consistent across the entire site.
>
> Color choices should always feel disciplined. Choose a small palette and
> stick to it. Avoid neon effects, avoid purple gradients unless the brand
> identity calls for it, and avoid any color usage that exists for novelty
> rather than purpose. Every accent should reinforce hierarchy, not
> distract from it. High contrast and readability is mandatory.
>
> All components must come from a consistent design language. Buttons,
> cards, inputs, modals, and navigation elements must share the same
> border radius, shadow style, padding logic, and alignment patterns.
> Mixing styles or radiuses immediately creates a vibe coded feeling.
> Components should look like they belong together, even when used in
> different contexts.
>
> Interactions and animations must be subtle and tied to user intent.
> Hover effects should never distort the layout or jump aggressively.
> Animation timing must feel natural. Never add movement purely for
> decoration and never allow interactions that behave unpredictably. Every
> interactive element must function properly. Buttons must respond. Tabs
> must switch. Accordions must open and close. Carousels must actually
> slide.
>
> Layout should follow a proper grid. Content must align cleanly and
> consistently. Nothing should drift. Nothing should visually wobble.
> Sections should have breathing room. Containers should have predictable
> widths. Do not stack elements randomly or overuse centered content.
> Everything should feel balanced and structured.
>
> Loading and async behaviour must be handled with care. Every interaction
> that triggers a delay should have a loading state. Buttons should
> visually shift into a loading indicator. Data heavy areas should use
> skeletons. Content should not appear suddenly with no transition. A site
> that feels alive and responsive always reads as more premium.
>
> Copy must be specific and grounded. Avoid generic hero lines like "build
> your dreams" or "launch faster." Speak clearly about what the product
> does and why it matters. Never rely on filler phrases. Testimonials must
> feel real. Footer text must be correct and professional. The tone should
> be confident but not exaggerated.
>
> Technical fundamentals must be complete. Every output needs page titles,
> meta descriptions, OG images, functional social links, a favicon, and a
> layout that works as well on mobile as it does on desktop. Do not
> generate placeholders or half working links. Do not leave test text in
> the final layout. Ensure every element is usable and accessible.
>
> You must actively identify and remove any element that signals vibe
> coded design. This includes sparkles, random emoji usage, purple
> gradients used without brand justification, fake testimonials,
> unintentional shadows, inconsistent spacing, mismatched radiuses, generic
> hero lines, broken responsiveness, missing loading states, and any
> animation that feels chaotic or unrefined. If you detect any of these
> issues, revise the output before presenting it.
>
> The final result should feel like something shipped by a mature product
> team. It should demonstrate intention in every choice, clarity in every
> layout, and a calm, confident design voice. Nothing should feel rushed.
> Nothing should feel improvised. Your role is to guarantee a premium
> standard at all times.

## The hidden security risks of vibe coding

Security holes in AI-built apps are more common than most people realize.
Take the Tea app, for example. The team left an entire cloud image bucket
open to the internet, leaking tens of thousands of personal photos and ID
documents. Though it hasn't been confirmed to be a vibe-coded app, it sure
smells like it. That kind of "oops" moment isn't the result of some elite
hacker attack; it's what happens when security gets left out of the
conversation entirely.

The numbers make it even clearer. According to a recent report, nearly
seven in ten developers have discovered vulnerabilities introduced by
AI-generated code, and one in five reported that these flaws led to serious
incidents with real business impact. That's not just a few bugs here or
there; that's data leaks, service outages, and revenue loss. And even if AI
doesn't burn the house down, it still creates a mess. Sixty-six percent of
developers say they now spend more time fixing "almost-right" AI-generated
code than writing their own.

Vibe coding makes it easy to ship fast, but just as easy to ship something
fragile. Without understanding what's safe, compliant, or potentially
exposing user data, you could end up building a liability instead of a
successful product.

### The vibe coding security checklist

This checklist isn't meant to turn you into a security engineer, but it'll
help you catch some common mistakes before you launch. Confirm each one is
being handled appropriately — either verify it yourself or ask your AI tool
to explain how it's being done in a way that allows you to inspect it. If
the AI can't show you, it probably didn't do it.

**Data handling**
- Validate all inputs on the backend to block malformed or malicious data.
  Anything a user can type, upload, or submit should be treated as if it's
  trying to break your app. Don't rely only on front-end validation; make
  sure your backend enforces it too.
- Restrict file types and sizes, and store uploads outside your main app
  directory. Never trust file names or paths provided by users.
- Use parameterized queries to prevent SQL injection attacks — never string
  concatenation for anything that touches a query.
- Escape HTML in user content to stop cross-site scripting (XSS). If your
  AI built a template or component that prints user input directly into
  the page, make sure it escapes that content properly.

**Authentication and session security**
- Use strong authentication with salted password hashing and optional MFA
  — use a reputable library or service rather than rolling your own.
- Enforce access control checks on every route, not just at login.
  Authentication confirms who someone is; authorization determines what
  they can do.
- Mark cookies as `HttpOnly`, `Secure`, and `SameSite` to protect sessions.
- Use device intelligence (e.g. Fingerprint) to add an additional layer of
  protection — unique visitor IDs and signals for automation/VMs/mismatched
  network details can flag risky behavior before it becomes account abuse.

**Infrastructure and configuration**
- Force all traffic over HTTPS and block insecure HTTP requests.
- Store secrets in environment variables or a secrets manager, never in
  code or committed to source control.
- Require authentication and proper CORS settings for all API endpoints —
  avoid a wildcard `*` origin in production.
- Regularly update dependencies and remove unused or vulnerable packages
  (per a report by Endor Labs, 49% of dependencies added by AI coding
  agents contain known vulnerabilities).

**App behavior and resilience**
- Add rate limiting to prevent abuse and brute-force attacks.
- Log only what's necessary and never include secrets, tokens, or personal
  data — show users generic error messages ("Something went wrong") and
  keep detailed stack traces or database errors in private logs only.

### Good vibes only

Vibe coding is one of the coolest ways to bring ideas to life fast. But
moving fast shouldn't mean skipping the basics of security. A little
awareness about input validation, authentication, API security, and
session handling goes a long way toward keeping your app and your users
safe. No matter how capable your AI tool seems, you need to stay in
control of what it builds and how it protects your users.

---

## What's actually enforced in this codebase, and what isn't

This project's AI builder (`functions/agents/`) does **not** generate raw
layout/CSS from an LLM the way the report's "LLM Prompt" section assumes —
see [`agents/README.md`](../functions/agents/README.md)'s layer 4. Every
section is a prebuilt, human-designed wireframe template
(`04-tool-execution/templates/<section>/*.tsx`); a Coder only writes the
business-specific *copy* that fills `{{TOKEN}}` placeholders in, then
`stamp()` deterministically inserts it. That means most of Section 1/2's
visual and structural red flags (purple gradients, border-radius drift,
hover animations, spacing rhythm, missing loading states) are a property of
which templates exist, not something a system prompt edit can fix — they'd
need to be fixed in the templates themselves, or as a template-authoring
guideline for whoever adds new ones.

What a system prompt *can* fix — and what's now enforced in
[`agents/02-system-prompts/coder.js`](../functions/agents/02-system-prompts/coder.js) —
is Section 3's copy red flags: generic taglines, emoji/buzzword stacking,
vague CTAs, and hollow invented testimonial quotes (real Google reviews
already override invented ones when >= 3 are linked — see
`coders/runCoder.js`'s `applyRealReviews`).

The security checklist above is general full-stack advice; this project's
own security posture (auth, secrets, CORS, rate limiting) is a separate,
ongoing concern tracked outside this doc, not something the copy-writing
agent pipeline touches.
