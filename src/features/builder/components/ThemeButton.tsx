import { useState } from 'react';
import { Loader2, Palette } from 'lucide-react';
import { useSandpack } from '@codesandbox/sandpack-react';
import { auth } from '@/lib/firebase';
import { setThemeColor } from '@/features/repositories/lib/repos.service';

// A curated set of hue/saturation pairs, not a full color picker — deliberate:
// the goal is a fast, obviously-correct control, not a color-theory UI. Each
// swatch's on-screen color is computed from the same hue/saturation the
// backend actually applies (see the inline style below), so what you click
// is what you get, no separate "preview" approximation to drift out of sync.
const PRESETS: { name: string; baseHue: number; accentHue: number; accentSaturation: number }[] = [
  { name: 'Neutral', baseHue: 240, accentHue: 240, accentSaturation: 6 },
  { name: 'Ocean blue', baseHue: 210, accentHue: 210, accentSaturation: 55 },
  { name: 'Forest green', baseHue: 140, accentHue: 140, accentSaturation: 42 },
  { name: 'Warm amber', baseHue: 30, accentHue: 30, accentSaturation: 55 },
  { name: 'Deep navy', baseHue: 220, accentHue: 220, accentSaturation: 40 },
  { name: 'Rose', baseHue: 340, accentHue: 340, accentSaturation: 48 },
  { name: 'Violet', baseHue: 265, accentHue: 265, accentSaturation: 42 },
  { name: 'Crimson', baseHue: 10, accentHue: 10, accentSaturation: 52 },
];

// Lives inside the SandpackProvider tree (needs useSandpack to apply the
// result live), same pattern as SaveButton/PublishButton. Deliberately
// bypasses chat entirely — a color change is a deterministic operation
// (functions/index.js's setThemeColor calls buildIndexCssFile directly, no
// LLM call in the loop), so it shouldn't depend on the AI correctly
// classifying a plain-language request as a color change in the first place.
export default function ThemeButton({ repoId, showNotice }: { repoId: string | null; showNotice: (text: string) => void }) {
  const { sandpack } = useSandpack();
  const [open, setOpen] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);

  const apply = async (preset: (typeof PRESETS)[number]) => {
    if (!repoId) { showNotice('Nothing to theme yet'); return; }
    setApplying(preset.name);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) { showNotice('Sign in again to change the theme'); return; }

      const result = await setThemeColor(repoId, idToken, preset);
      // Applied straight to the live file map — same mechanism AssistantPanel
      // uses for AI-applied edits — so the preview updates immediately
      // instead of waiting on a reload or the next Save.
      sandpack.updateFile({ '/src/index.css': result.content });
      showNotice(`Theme set to ${preset.name}`);
      setOpen(false);
    } catch (err) {
      console.error('setThemeColor failed:', err);
      showNotice(err instanceof Error ? err.message : 'Could not change the theme');
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="icon-button"
        aria-label="Change theme color"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Palette size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-lg border border-white/10 bg-neutral-900 p-3 shadow-xl">
          <p className="mb-2 text-xs text-white/40">Theme color</p>
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                title={preset.name}
                aria-label={preset.name}
                onClick={() => apply(preset)}
                disabled={applying !== null}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 disabled:opacity-50"
                style={{ background: `hsl(${preset.accentHue}, ${preset.accentSaturation}%, 45%)` }}
              >
                {applying === preset.name && <Loader2 size={12} className="animate-spin text-white" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
