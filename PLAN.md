# Aura Build — AI Website Builder Plan

## What We're Building
An AI website builder where a user logs in, describes the site they want, and immediately gets a live editable preview. They can then chat to refine it. Think Lovable/Bolt but using our own stack.

---

## User Flow (End-to-End)

```
/auth  →  /dashboard  →  /builder/:projectId
  ↑            ↓                   ↓
Login     Type prompt        Chat + Live Preview
          Submit prompt      (Sandpack + AI edits)
          → AI generates     → User refines with chat
            first version    → Download / Publish
```

---

## Pages Overview

### 1. `/auth` — Login/Signup ✅ DONE
No changes needed. Firebase Auth works. Mock login works. Moving on.

---

### 2. `/dashboard` — Prompt Entry (MAKE FUNCTIONAL)
**Current state:** UI is complete and looks great (Lovable style). The prompt box exists and navigates to `/chat` but nothing real happens.

**What needs to change (logic only, no visual changes):**

#### Step A — On Prompt Submit
When the user types a website description and hits send:
1. Create a new project document in Firestore (`user_repos` collection)
2. Store the initial prompt in that document
3. Navigate to `/builder/:projectId` passing the prompt as state

```
handleSubmit():
  1. prompt = textarea value
  2. projectId = `${user.uid}_${Date.now()}`
  3. Firestore: setDoc('user_repos', projectId, { user_id, prompt, status: 'generating', created_at })
  4. navigate(`/builder/${projectId}`, { state: { initialPrompt: prompt } })
```

#### Step B — Sidebar "All projects" link
Wire the "All projects" button in `LovableSidebar` to navigate to `/repos` (already exists).

#### What stays the same
- The gradient mesh background
- The textarea prompt box layout
- The "Got an idea" heading
- The bottom panel with tab buttons (My projects / Recently viewed / Templates)
- The sidebar visual design

**Only adding:** One API key field (small, subtle) — a settings icon in the sidebar bottom that opens a modal where the user pastes their Claude API key. Stored in `localStorage` for now.

---

### 3. `/builder/:projectId` — The Builder (MAIN PAGE TO BUILD)
This is the page that matters. It replaces both `/chat` and `/preview`.

**Layout:** Two-pane split (same visual DNA as current ChatInterface)

```
┌─────────────────────────────────────────────────────┐
│  [Sidebar Trigger]  Aura Build        [Deploy btn]  │  ← Header
├─────────────────┬───────────────────────────────────┤
│                 │                                   │
│   Chat Pane     │       Preview Pane                │
│   (380px)       │       (flex-1)                    │
│                 │                                   │
│  Message list   │  [Preview | Code]  [Desktop|Mobile]│
│  ─────────────  │  ─────────────────────────────────│
│  File picker    │                                   │
│  Input box      │      Sandpack Live Preview        │
│  Send button    │      (renders React in browser)   │
│                 │                                   │
└─────────────────┴───────────────────────────────────┘
```

#### On Load Behaviour
1. Read `projectId` from URL params
2. Load Firestore doc to get the `initialPrompt`
3. If `files` field is empty in Firestore → **auto-trigger first generation** using `initialPrompt`
4. If `files` already exist (returning to project) → load them straight into Sandpack
5. Show loading state while AI generates

#### AI Generation Flow
```
User prompt  →  POST to Claude API  →  Parse response  →  Update Sandpack files  →  Auto-save to Firestore
```

The AI is given:
- A system prompt that tells it to output React + Tailwind code
- A file format instruction: wrap each file in `<file path="/App.js">...</file>` tags
- The user's website description

**For chat edits (after initial generation):**
- User types a change request (e.g. "make the hero darker")
- Same flow: send to Claude with the current files as context
- Parse response, patch only changed files in Sandpack
- Auto-save

#### API Integration
Using **Claude API (Anthropic)** directly from the browser for now (dev mode).
- Model: `claude-3-5-haiku-20241022` (fast, cheap for iteration)
- API key: read from `localStorage` (set in Dashboard settings modal)
- Later: move to a Supabase Edge Function or Firebase Function to hide the key

#### Sandpack Setup
- Template: `react`
- External resources: `https://cdn.tailwindcss.com`
- Starting files: default blank canvas (same as current `DEFAULT_FILES`)
- AI updates files → call `sandpack.updateFile()` for each changed file
- Auto-save to Firestore `vfs` field every 2.5 seconds (already built in `DebouncedSave` component)

#### Export
Already works in `Preview.tsx` (JSZip + file-saver). Copy this logic in.

---

## Data Model (Firestore)

Collection: `user_repos`

```
{
  user_id: string,
  prompt: string,          // ← ADD: the initial website description
  repo_name: string,       // auto-generated slug
  repo_owner: string,
  status: 'generating' | 'ready' | 'error',
  vfs: {                   // Virtual File System for Sandpack
    '/App.js': { code: '...' },
    '/index.js': { code: '...' },
    '/public/index.html': { code: '...' }
  },
  messages: [],            // ← ADD: chat history (array of { role, content })
  created_at: string,
  last_updated: string
}
```

---

## Claude API System Prompt

```
You are an expert React developer. Generate complete, working React + Tailwind CSS code.

Rules:
- Use only React (no TypeScript, no imports from npm except react/react-dom)
- Style with Tailwind CSS utility classes (CDN is available)
- Output ONLY file blocks in this exact format:

<file path="/App.js">
// your complete React component here
export default function App() { ... }
</file>

- Always output a complete /App.js file
- Make the design beautiful, modern, and responsive
- Use real placeholder content relevant to the website type
- Never include explanations outside the file blocks
```

---

## Implementation Order

### Phase 1 — Wire Dashboard → Builder Navigation
**Files to change:** `Dashboard.tsx`
- `handleSubmit()`: create Firestore doc, navigate to `/builder/:projectId`
- Add API key modal (small gear icon in `LovableSidebar`)

**Files to change:** `LovableSidebar.tsx`
- Add gear/settings icon at bottom
- Settings modal: one input for Claude API key, save to `localStorage`

**Files to change:** `App.tsx`
- Add route: `<Route path="/builder/:projectId" element={<Builder />} />`

---

### Phase 2 — Build the Builder Page
**New file:** `src/pages/Builder.tsx`

Steps:
1. Read `:projectId` from URL
2. Load Firestore doc on mount
3. If no `vfs` → call Claude API with the `prompt` field → generate initial site
4. Render Sandpack with the files
5. Chat input → send to Claude with current files as context → update Sandpack
6. DebouncedSave writes `vfs` + `messages` back to Firestore
7. Export ZIP button

---

### Phase 3 — API Key Flow
**Where:** `localStorage` key `empirial_claude_api_key`

Logic:
- If key exists → use it in all Claude API calls
- If key is missing → show inline prompt in the Builder: *"Add your Claude API key to start building"* with a link to the settings modal
- Settings accessible from sidebar gear icon on Dashboard and from Builder header

---

### Phase 4 — Sidebar Projects List
**Files to change:** `LovableSidebar.tsx`
- "All projects" button → fetch user's `user_repos` from Firestore → render as list in sidebar
- Each project → `navigate(/builder/:projectId)`
- "New project" button → back to dashboard

---

## Routes After This Plan

```
/auth                → Auth (unchanged)
/dashboard           → Dashboard (prompt entry, project list)
/builder/:projectId  → Builder (AI chat + Sandpack preview) ← NEW
/repos               → RepoManagement (keep for template store)
/generate            → GenerateWebsite (keep for template picker)
/preview/:repoId     → Preview (keep as legacy, may deprecate)
/chat                → ChatInterface (keep as legacy, may deprecate)
```

---

## What We Are NOT Changing
- Dashboard visual design — keep exactly as is
- Auth page
- `LovableSidebar` visual design — only adding a gear icon
- Landing page (`/`)
- Template store logic in `/repos`
- Firebase Auth setup

---

## What We Need Before Starting Code

1. **Claude API key** — you (the developer) need one from console.anthropic.com
2. **Firestore rules** — make sure `user_repos` allows authenticated reads/writes
3. Confirm Sandpack is already installed (`@codesandbox/sandpack-react` — used in `Preview.tsx` so yes it is)

---

## Summary

| Step | What | File | Status |
|------|------|------|--------|
| 1 | Wire Dashboard submit → create project + navigate | `Dashboard.tsx` | TODO |
| 2 | API key settings modal in sidebar | `LovableSidebar.tsx` | TODO |
| 3 | Register `/builder/:projectId` route | `App.tsx` | TODO |
| 4 | Build `Builder.tsx` (chat + Sandpack + Claude) | `src/pages/Builder.tsx` | TODO |
| 5 | Auto-generate on first load from prompt | `Builder.tsx` | TODO |
| 6 | Chat edits → Claude → patch Sandpack | `Builder.tsx` | TODO |
| 7 | Auto-save `vfs` to Firestore | `Builder.tsx` | TODO |
| 8 | Export ZIP | `Builder.tsx` | TODO |
| 9 | Projects list in sidebar | `LovableSidebar.tsx` | TODO |
