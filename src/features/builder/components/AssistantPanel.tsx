import { useRef, useState } from 'react';
import { ChevronDown, History, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useSandpack, useSandpackNavigation } from '@codesandbox/sandpack-react';
import EmpirialIcon from '@/assets/Brand ID/empirial-icon.png';
import { auth } from '@/lib/firebase';
import { appendChatMessages, saveRepoFiles, type ChatMessage } from '@/features/repositories/lib/repos.service';
import { parseAiFileBlocks, streamAiChat, stripFileBlocksForDisplay, type ChatTurn } from '../lib/aiChat';
import ProjectMenu from './ProjectMenu';
import PromptComposer from './PromptComposer';

export default function AssistantPanel({
  projectName, onRenameCommit, onDashboard, onSettings, panelOpen, onTogglePanel, showNotice,
  repoId, repoOwner, repoName, initialHistory,
}: {
  projectName: string;
  onRenameCommit: (name: string) => void;
  onDashboard: () => void;
  onSettings: () => void;
  panelOpen: boolean;
  onTogglePanel: () => void;
  showNotice: (text: string) => void;
  repoId?: string | null;
  repoOwner?: string;
  repoName?: string;
  /** Previously saved transcript for this project, oldest first — see repos.service.ts's getChatHistory. */
  initialHistory?: ChatMessage[];
}) {
  const { sandpack } = useSandpack();
  const { refresh } = useSandpackNavigation();
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState(projectName);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>(() => (initialHistory || []).map((m) => m.content));
  const [sending, setSending] = useState(false);
  // Firestore `seq` continues from wherever the loaded history left off, so a
  // reload never collides with or overwrites previously saved messages.
  const nextSeqRef = useRef((initialHistory || []).length);

  const startRename = () => { setDraftName(projectName); setProjectMenuOpen(false); setRenaming(true); };
  const commitRename = () => { setRenaming(false); if (draftName.trim() && draftName !== projectName) onRenameCommit(draftName.trim()); };

  const send = async () => {
    if (!message.trim() || sending) return;
    if (!repoOwner || !repoName) {
      showNotice('This project is still setting up — try again in a moment.');
      return;
    }

    const userText = message;
    // messages alternates user/assistant by index parity (even = user, odd = assistant) —
    // reconstruct that as the {role, content} history the Cloud Function expects.
    const history: ChatTurn[] = messages.map((content, i) => ({ role: i % 2 === 0 ? 'user' : 'assistant', content }));
    history.push({ role: 'user', content: userText });

    setMessage('');
    setMessages((prev) => [...prev, userText, '']); // trailing '' is the streaming assistant slot
    setSending(true);

    // rawAssistantText is the full stream, <file> blocks included — needed
    // by parseAiFileBlocks below. assistantText is what's actually shown in
    // the bubble and saved to history: the code is applied to the project
    // directly, never meant to be read by the user in the chat thread.
    let rawAssistantText = '';
    let assistantText = '';
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('You need to be signed in to chat with the AI.');
      const idToken = await user.getIdToken();

      rawAssistantText = await streamAiChat(idToken, { repoOwner, repoName, history }, (partial) => {
        const shown = stripFileBlocksForDisplay(partial);
        setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? shown : m)));
      });

      const { files, changedCount } = parseAiFileBlocks(rawAssistantText);
      if (changedCount > 0) {
        sandpack.updateFile(files);
        showNotice(`Applied changes to ${changedCount} file${changedCount === 1 ? '' : 's'}`);

        // Don't wait on RepoAutosave's 2.5s debounce for a change that just
        // came from the AI — if the user reloads (or bails out after seeing
        // a still-crashed preview) before that timer fires, the fix is lost
        // client-side only and the next load pulls the old, still-broken
        // file straight back out of Firestore. Persist it the moment it's
        // applied instead; RepoAutosave's own debounced save still covers
        // everything else (manual code edits, etc.) as before.
        if (repoId) {
          saveRepoFiles(repoId, files).catch((saveError) => {
            console.error('Failed to persist AI-applied changes:', saveError);
          });
        }

        // A prior compile crash can leave the preview iframe stuck showing
        // its old error overlay even after the fixing file lands — nudge it
        // to recompile against the new code rather than leaving the user to
        // find the manual refresh button themselves.
        refresh();
      } else {
        showNotice('AI responded — no file changes were included');
      }

      // Falls back to a plain confirmation on the rare turn that's 100% file
      // blocks with no lead-in prose, so the bubble is never left blank.
      assistantText = stripFileBlocksForDisplay(rawAssistantText)
        || (changedCount > 0 ? "Done — I've applied the changes." : rawAssistantText);
      setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? assistantText : m)));
    } catch (error) {
      console.error('AI chat error:', error);
      const detail = error instanceof Error ? error.message : 'Unknown error';
      assistantText = `Sorry, something went wrong: ${detail}`;
      setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? assistantText : m)));
      showNotice('AI chat failed — see the message in the thread');
    } finally {
      setSending(false);
    }

    // Save this turn so it's still here next time this project is opened.
    // Best-effort: a failed write here shouldn't disrupt the conversation
    // the user can already see on screen.
    if (repoId) {
      const userSeq = nextSeqRef.current;
      const assistantSeq = userSeq + 1;
      nextSeqRef.current = assistantSeq + 1;
      try {
        await appendChatMessages(repoId, [
          { role: 'user', content: userText, seq: userSeq },
          { role: 'assistant', content: assistantText, seq: assistantSeq },
        ]);
      } catch (persistError) {
        console.error('Failed to save chat history:', persistError);
      }
    }
  };

  return (
    <aside className="chat-conversation chat-pill">
      <div className="chat-pill-head">
        <img src={EmpirialIcon} alt="EMPIRIAL" className="h-6 w-6 shrink-0 rounded-md object-cover" />
        <div className="relative min-w-0">
          {renaming ? (
            <input
              autoFocus value={draftName} onChange={e => setDraftName(e.target.value)} onBlur={commitRename}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitRename(); } }}
              className="w-36 rounded-md bg-white/10 px-2 py-1 text-sm text-white outline-none"
            />
          ) : (
            <button type="button" onClick={() => setProjectMenuOpen(!projectMenuOpen)} className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-white/10">
              <span className="truncate">{projectName}</span><ChevronDown size={14} className="text-white/40" />
            </button>
          )}
          {projectMenuOpen && !renaming && <ProjectMenu onDashboard={onDashboard} onRename={startRename} onSettings={onSettings} />}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button type="button" className="icon-button" aria-label="Version history" onClick={() => showNotice('Version history opened')}><History size={16} /></button>
          <button type="button" className="icon-button" aria-label={panelOpen ? 'Hide chat panel' : 'Show chat panel'} onClick={onTogglePanel}>
            {panelOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </button>
        </div>
      </div>

      <div className="chat-thread">
        {/* The founding prompt is now just messages[0] — seeded straight
            into chat_messages by BuilderPage.tsx at creation time (and
            backfilled from generation_prompt for older projects) — instead
            of a separate render-only prop read from a URL query string that
            didn't survive the post-creation navigate(). */}
        {messages.length === 0 && (
          <div className="chat-reasoning">
            <p className="chat-reasoning-label">Ready when you are</p>
            <p>
              Tell me what to change and I&apos;ll edit the live files directly — layout, copy, colors,
              new sections, whatever the project needs next.
            </p>
          </div>
        )}
        {messages.map((item, index) => (
          <div key={index} className={index % 2 ? 'assistant-bubble' : 'assistant-user'}>
            {item || (sending && index === messages.length - 1 ? '…' : '')}
          </div>
        ))}
      </div>

      <PromptComposer value={message} onChange={setMessage} onSend={send} disabled={sending} />
    </aside>
  );
}
