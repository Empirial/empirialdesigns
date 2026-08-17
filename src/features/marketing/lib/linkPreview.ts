import { useEffect, useState } from 'react';

// See functions/index.js's fetchLinkPreview — pulls Open Graph / meta tags
// and a favicon off a public URL, cached server-side in Firestore for 14
// days so 24 portfolio cards don't re-scrape their target sites on every load.
const FIREBASE_FUNCTION_URL = 'https://us-central1-empirialdesigns.cloudfunctions.net';

export type LinkPreview = {
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
};

// Module-level cache (by URL, for the life of the page) — the coverflow
// remounts its cards on every filter switch, and this keeps that from
// re-requesting a preview it already has.
const cache = new Map<string, Promise<LinkPreview | null>>();

function fetchLinkPreview(url: string): Promise<LinkPreview | null> {
  if (!cache.has(url)) {
    const promise = fetch(`${FIREBASE_FUNCTION_URL}/fetchLinkPreview?url=${encodeURIComponent(url)}`)
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);
    cache.set(url, promise);
  }
  return cache.get(url)!;
}

// Returns null until (and unless) a preview resolves — callers should keep
// their own curated fallback copy for that case, since a target site can be
// slow, blocking scrapers, or just down.
export function useLinkPreview(url?: string): LinkPreview | null {
  const [preview, setPreview] = useState<LinkPreview | null>(null);

  useEffect(() => {
    if (!url) { setPreview(null); return; }
    let cancelled = false;
    fetchLinkPreview(url).then((result) => { if (!cancelled) setPreview(result); });
    return () => { cancelled = true; };
  }, [url]);

  return preview;
}
