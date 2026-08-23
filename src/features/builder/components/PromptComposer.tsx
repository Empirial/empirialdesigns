import { useRef, useState } from 'react';
import { ChevronDown, Mic, MicOff, Plus, Send } from 'lucide-react';
import { useSpeechToText } from '../lib/useSpeechToText';

export default function PromptComposer({ value, onChange, onSend, disabled }: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}) {
  const [mode, setMode] = useState<'Build' | 'Ask'>('Build');
  const [modeMenuOpen, setModeMenuOpen] = useState(false);

  // Whatever was already typed before dictation started, so live results
  // are appended onto it rather than replacing it — recomputed fresh on
  // every recognition update (see useSpeechToText's own comment) rather
  // than tracked as an incremental diff.
  const dictationBaseRef = useRef('');
  const { supported: micSupported, listening, start: startListening, stop: stopListening } = useSpeechToText((final, interim) => {
    const base = dictationBaseRef.current;
    const sep = base && !/\s$/.test(base) ? ' ' : '';
    onChange(base + (final ? sep + final : '') + (interim ? (base || final ? ' ' : '') + interim : ''));
  });
  const toggleMic = () => {
    if (listening) { stopListening(); return; }
    dictationBaseRef.current = value;
    startListening();
  };

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
          placeholder={listening ? 'Listening…' : 'Ask EMPIRIAL...'}
        />
        {micSupported && (
          <button
            type="button"
            className={`subtle-button composer-mic-button${listening ? ' composer-mic-button-active' : ''}`}
            aria-label={listening ? 'Stop voice input' : 'Speak your instruction'}
            aria-pressed={listening}
            onClick={toggleMic}
          >
            {listening ? <MicOff size={15} /> : <Mic size={15} />}
          </button>
        )}
        <button aria-label="Send website instruction" className="send-button" onClick={onSend} disabled={disabled}><Send size={15} /></button>
      </div>
    </div>
  );
}
