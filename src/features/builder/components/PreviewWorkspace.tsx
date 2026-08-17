import { SandpackPreview } from '@codesandbox/sandpack-react';

// No header here on purpose — the one global BuilderTopbar is the only toolbar
// this workspace should ever show. Save/Share/Upgrade/Publish now live in the
// preview pill's own local header instead.
//
// `device`: 'desktop' (default) fills the whole pill, absolutely positioned
// (Sandpack's internal preview container already does flex:1/display:flex
// expecting a definite height from its parent — inset:0 is more reliable
// than chasing percentage-height through several nested flex layers).
// 'mobile' instead constrains the iframe to a phone-width frame, centered in
// the same space, so the generated site's own responsive breakpoints are
// what's actually being previewed — not just a smaller viewport rect.
export default function PreviewWorkspace({ device = 'desktop' }: { device?: 'desktop' | 'mobile' }) {
  if (device === 'mobile') {
    return (
      <div className="chat-preview-frame chat-preview-frame-mobile">
        <div className="chat-preview-device">
          <SandpackPreview showOpenInCodeSandbox={false} showRefreshButton={false} style={{ width: '100%', height: '100%' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="chat-preview-frame">
      <SandpackPreview showOpenInCodeSandbox={false} showRefreshButton={false} style={{ position: 'absolute', inset: 0 }} />
    </div>
  );
}
