import { ArrowLeft, Pencil, Settings } from 'lucide-react';

export default function ProjectMenu({ onDashboard, onRename, onSettings }: {
  onDashboard: () => void;
  onRename: () => void;
  onSettings: () => void;
}) {
  return (
    <div className="chat-project-menu">
      <button type="button" onClick={onDashboard}><ArrowLeft size={14} /> Dashboard</button>
      <div className="chat-project-menu-section">
        <div className="flex items-center justify-between"><span className="font-medium text-white/80">Empirial Studio</span><span className="chat-plan-badge">Free</span></div>
        <div className="mt-2 flex items-center justify-between text-white/40"><span>Credits</span><span>12 left</span></div>
        <div className="usage-track mt-1.5"><span style={{ width: '88%' }} /></div>
      </div>
      <button type="button" onClick={onRename}><Pencil size={14} /> Rename</button>
      <button type="button" onClick={onSettings}><Settings size={14} /> Settings</button>
    </div>
  );
}
