import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import type { Repo } from '@/features/repositories/lib/repos.service';

// The "sandbox" for a document project — renders in place of
// SandpackProvider's website preview when repo.type === 'document' (see
// BuilderPage.tsx). Reads straight from repo.document_content (the
// structured { title, sections } the generateDocument Cloud Function saved
// to Firestore) rather than fetching the rendered PDF, so the preview shows
// up instantly; the PDF itself is only touched when the user clicks
// Download.
export default function DocumentWorkspace({
  repo,
  navigate,
  showNotice,
}: {
  repo: Repo;
  navigate: (path: string) => void;
  showNotice: (text: string) => void;
}) {
  const content = repo.document_content;

  return (
    <div className="document-page chat-pill">
      <div className="chat-pill-head">
        <button type="button" className="icon-button" aria-label="Back to dashboard" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} />
        </button>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{repo.repo_name || 'Untitled document'}</span>
        {repo.asset_url ? (
          <a
            href={repo.asset_url}
            target="_blank"
            rel="noreferrer"
            className="primary-button"
            onClick={() => showNotice('Opening your PDF')}
          >
            <Download size={14} /> Download PDF
          </a>
        ) : (
          <button type="button" className="primary-button" disabled>
            <Download size={14} /> Download PDF
          </button>
        )}
      </div>
      <div className="chat-pill-body document-sheet-wrap">
        {content ? (
          <article className="document-sheet">
            <h1>{content.title}</h1>
            {content.sections.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                {section.body.split('\n\n').map((paragraph, j) => (
                  <p key={j}>{paragraph}</p>
                ))}
              </section>
            ))}
          </article>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-white/50">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">Preparing your document…</span>
          </div>
        )}
      </div>
    </div>
  );
}
