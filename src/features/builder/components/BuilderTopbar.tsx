import { PanelLeftOpen } from 'lucide-react';

// Just a small floating affordance to bring the chat pill back once it's been
// closed — everything else (Save/Share/Upgrade/Publish) now lives in the
// preview pill's own local header, so there's no persistent top bar anymore.
export default function BuilderTopbar({ panelOpen, onOpenPanel }: { panelOpen: boolean; onOpenPanel: () => void }) {
  if (panelOpen) return null;
  return (
    <button type="button" className="icon-button chat-reopen-panel" aria-label="Show chat panel" onClick={onOpenPanel}>
      <PanelLeftOpen size={16} />
    </button>
  );
}
