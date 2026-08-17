import { SandpackCodeEditor, SandpackCodeViewer, SandpackFileExplorer, SandpackLayout } from '@codesandbox/sandpack-react';

// Used for both the Files tab (readOnly — browsing) and the Code tab (editable),
// so the two toolbar tabs give genuinely different value instead of duplicating.
//
// Absolutely positioned inside `.chat-preview-frame` for the same reason as
// PreviewWorkspace — Sandpack's own layout expects a definite height from its
// parent, and inset:0 against a flex-sized positioned container is more
// reliable than chasing height:100% through nested flex/percentage layers.
export default function CodeWorkspace({ readOnly }: { readOnly?: boolean }) {
  return (
    <div className="chat-preview-frame">
      <SandpackLayout style={{ position: 'absolute', inset: 0, border: 0, borderRadius: 0 }}>
        <SandpackFileExplorer style={{ height: '100%' }} />
        {readOnly
          ? <div style={{ height: '100%' }}><SandpackCodeViewer showLineNumbers /></div>
          : <SandpackCodeEditor style={{ height: '100%' }} showLineNumbers showTabs closableTabs />}
      </SandpackLayout>
    </div>
  );
}
