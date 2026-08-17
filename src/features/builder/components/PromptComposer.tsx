import { useState } from 'react';
import { ChevronDown, Plus, Send } from 'lucide-react';

export default function PromptComposer({ value, onChange, onSend, disabled }: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}) {
  const [mode, setMode] = useState<'Build' | 'Ask'>('Build');
  const [modeMenuOpen, setModeMenuOpen] = useState(false);

  return (
    <div className="chat-composer">
      <div className="chat-composer-pill">
        <button type="button" className="subtle-button" aria-label="Add an attachment"><Plus size={15} /></button>
        <div className="relative">
          <button type="button" className="subtle-button" onClick={() => setModeMenuOpen(!modeMenuOpen)}>{mode} <ChevronDown size={12} /></button>
          {modeMenuOpen && (
            <div className="chat-page-menu chat-page-menu-up">
              {(['Build', 'Ask'] as const).map(m => (
                <button type="button" key={m} onClick={() => { setMode(m); setModeMenuOpen(false); }}>{m}</button>
              ))}
            </div>
          )}
        </div>
        <textarea
          aria-label="Describe an edit to the website"
          rows={1}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          placeholder="Ask EMPIRIAL..."
        />
        <button aria-label="Send website instruction" className="send-button" onClick={onSend} disabled={disabled}><Send size={15} /></button>
      </div>
    </div>
  );
}
