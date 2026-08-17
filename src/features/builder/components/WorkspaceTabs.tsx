import { Code2, FileText, Globe2, Layers } from 'lucide-react';

export type WorkspaceView = 'Preview' | 'Files' | 'Code' | 'Layers';

const TABS: { id: WorkspaceView; icon: typeof Globe2 }[] = [
  { id: 'Preview', icon: Globe2 },
  { id: 'Files', icon: FileText },
  { id: 'Code', icon: Code2 },
  { id: 'Layers', icon: Layers },
];

export default function WorkspaceTabs({ active, onChange }: { active: WorkspaceView; onChange: (view: WorkspaceView) => void }) {
  return (
    <div className="chat-tab-switch">
      {TABS.map(({ id, icon: Icon }) => (
        <button type="button" key={id} aria-label={id} title={id} className={active === id ? 'selected' : ''} onClick={() => onChange(id)}>
          <Icon size={14} />{active === id && id}
        </button>
      ))}
    </div>
  );
}
