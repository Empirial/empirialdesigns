import { Layers } from 'lucide-react';

export default function LayersWorkspace() {
  return (
    <div className="chat-tab-empty">
      <div className="empty-state chat-tab-empty-state">
        <Layers size={28} />
        <h3>No layers yet.</h3>
        <p>Layers will appear here once your site has sections to arrange.</p>
      </div>
    </div>
  );
}
