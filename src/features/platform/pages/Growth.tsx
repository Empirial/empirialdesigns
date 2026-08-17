import { useEffect, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import {
  ArrowLeft, Check, ExternalLink, Loader2, RefreshCw, Search, ShieldCheck, X,
  Activity, Star, MapPin, Globe, Gauge,
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { isMockSession, mockUser } from '@/lib/mockAuth';
import {
  confirmGoogleVerification,
  connectDomain,
  disableUptimeMonitoring,
  disconnectDomain,
  enableUptimeMonitoring,
  findGooglePlace,
  getBusinessAccounts,
  getBusinessLocations,
  getDomainStatus,
  getGoogleConnectUrl,
  getGoogleReviews,
  getLinkedBusinessLocation,
  getRepo,
  getSearchPerformance,
  getUptimeStatus,
  linkGooglePlace,
  requestGoogleVerificationToken,
  runPageSpeedAudit,
  runSeoAudit,
  submitSitemapToGoogle,
  updateBusinessLocation,
  type BusinessAccount,
  type BusinessLocation,
  type GoogleReviewsResult,
  type PageSpeedResult,
  type PlaceCandidate,
  type Repo,
  type SearchPerformance,
  type SeoAuditResult,
  type UptimeStatusResult,
} from '@/features/repositories/lib/repos.service';

// Reachable from the builder's workspace header ("Growth" button, next to
// Publish — see BuilderPage.tsx) at /dashboard/growth/:repoId. Standalone
// full page (own auth resolution, like BuilderPage) rather than nested in
// Platform's sidebar shell, same reasoning as the page this absorbed (Seo.tsx,
// removed) — a project-detail surface, not a list screen.
//
// Everything a business needs to know about how its live site is actually
// doing, in one place: technical SEO readiness, real Core Web Vitals,
// Google Search performance, uptime, real Google reviews (which replace the
// AI's invented testimonials on the next edit — see agents/coders/base.js's
// applyRealReviews), Business Profile, and a custom domain.
export default function GrowthPage({ repoId, navigate }: { repoId: string; navigate: NavigateFunction }) {
  const [repo, setRepo] = useState<Repo | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const showNotice = (text: string) => { setNotice(text); window.setTimeout(() => setNotice(''), 3200); };

  // Technical SEO
  const [audit, setAudit] = useState<SeoAuditResult | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);

  // PageSpeed
  const [pageSpeed, setPageSpeed] = useState<PageSpeedResult | null>(null);
  const [pageSpeedLoading, setPageSpeedLoading] = useState(false);

  // Google Search Console
  const [performance, setPerformance] = useState<SearchPerformance | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Uptime
  const [uptime, setUptime] = useState<UptimeStatusResult | null>(null);
  const [uptimeBusy, setUptimeBusy] = useState(false);

  // Reviews
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeCandidates, setPlaceCandidates] = useState<PlaceCandidate[] | null>(null);
  const [placeSearching, setPlaceSearching] = useState(false);
  const [reviews, setReviews] = useState<GoogleReviewsResult | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [linkingPlaceId, setLinkingPlaceId] = useState<string | null>(null);

  // Business Profile
  const [bizAccounts, setBizAccounts] = useState<BusinessAccount[] | null>(null);
  const [bizLocations, setBizLocations] = useState<BusinessLocation[] | null>(null);
  const [linkedLocation, setLinkedLocation] = useState<BusinessLocation | null>(null);
  const [bizLoading, setBizLoading] = useState(false);

  // Domain
  const [domainInput, setDomainInput] = useState('');
  const [domainBusy, setDomainBusy] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (rawUser) => {
      const user = rawUser ?? (isMockSession() ? mockUser : null);
      if (!user) { navigate('/auth'); return; }
      try {
        const [loadedRepo, token] = await Promise.all([getRepo(repoId), user.getIdToken()]);
        if (!loadedRepo) { setLoadError('That project could not be found.'); return; }
        setRepo(loadedRepo);
        setIdToken(token);
        setPageSpeed(loadedRepo.pagespeed_audit ?? null);
        if (loadedRepo.google_search_console_property) {
          getSearchPerformance(repoId, token).then(setPerformance).catch(() => undefined);
        }
        if (loadedRepo.uptime_monitor_id) {
          getUptimeStatus(repoId, token).then(setUptime).catch(() => undefined);
        }
        if (loadedRepo.google_place_id) {
          setReviewsLoading(true);
          getGoogleReviews(repoId, token).then(setReviews).catch(() => undefined).finally(() => setReviewsLoading(false));
        }
        if (loadedRepo.google_business_location_name) {
          getLinkedBusinessLocation(repoId, token).then(setLinkedLocation).catch(() => undefined);
        }
      } catch (error) {
        console.error('Failed to load project for Growth page:', error);
        setLoadError(error instanceof Error ? error.message : 'Something went wrong loading this project.');
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoId]);

  const refreshRepo = async () => { const updated = await getRepo(repoId); if (updated) setRepo(updated); };

  const runAudit = async () => {
    if (!idToken) return;
    setAuditLoading(true);
    try { setAudit(await runSeoAudit(repoId, idToken)); }
    catch (error) { showNotice(error instanceof Error ? error.message : 'Audit failed — try again'); }
    finally { setAuditLoading(false); }
  };

  const runPageSpeed = async () => {
    if (!idToken) return;
    setPageSpeedLoading(true);
    try { setPageSpeed(await runPageSpeedAudit(repoId, idToken)); }
    catch (error) { showNotice(error instanceof Error ? error.message : 'PageSpeed check failed — try again'); }
    finally { setPageSpeedLoading(false); }
  };

  const connectGoogle = async () => {
    if (!idToken) return;
    setBusy('connect');
    try { window.location.href = await getGoogleConnectUrl(idToken, repoId); }
    catch (error) { showNotice(error instanceof Error ? error.message : 'Could not start Google connection'); setBusy(null); }
  };

  const startVerification = async () => {
    if (!idToken) return;
    setBusy('verify-start');
    try {
      const { instructions } = await requestGoogleVerificationToken(repoId, idToken);
      showNotice(instructions);
      await refreshRepo();
    } catch (error) { showNotice(error instanceof Error ? error.message : 'Could not request a verification token'); }
    finally { setBusy(null); }
  };

  const confirmVerification = async () => {
    if (!idToken) return;
    setBusy('verify-confirm');
    try { await confirmGoogleVerification(repoId, idToken); showNotice('Google confirmed ownership of your site'); await refreshRepo(); }
    catch (error) { showNotice(error instanceof Error ? error.message : 'Google could not confirm the verification tag yet — make sure you published after requesting it.'); }
    finally { setBusy(null); }
  };

  const submitSitemap = async () => {
    if (!idToken) return;
    setBusy('sitemap');
    try { await submitSitemapToGoogle(repoId, idToken); showNotice('Sitemap submitted to Google'); await refreshRepo(); }
    catch (error) { showNotice(error instanceof Error ? error.message : 'Could not submit the sitemap'); }
    finally { setBusy(null); }
  };

  const toggleUptime = async () => {
    if (!idToken) return;
    setUptimeBusy(true);
    try {
      if (repo?.uptime_monitor_id) {
        await disableUptimeMonitoring(repoId, idToken);
        setUptime(null);
      } else {
        await enableUptimeMonitoring(repoId, idToken);
        setUptime(await getUptimeStatus(repoId, idToken));
      }
      await refreshRepo();
    } catch (error) { showNotice(error instanceof Error ? error.message : 'Could not update uptime monitoring'); }
    finally { setUptimeBusy(false); }
  };

  const searchPlaces = async () => {
    if (!idToken || !placeQuery.trim()) return;
    setPlaceSearching(true);
    setPlaceCandidates(null);
    try { setPlaceCandidates(await findGooglePlace(placeQuery.trim(), idToken)); }
    catch (error) { showNotice(error instanceof Error ? error.message : 'Search failed — try again'); }
    finally { setPlaceSearching(false); }
  };

  const linkPlace = async (placeId: string) => {
    if (!idToken) return;
    setLinkingPlaceId(placeId);
    try {
      await linkGooglePlace(repoId, placeId, idToken);
      setPlaceCandidates(null);
      setPlaceQuery('');
      setReviewsLoading(true);
      setReviews(await getGoogleReviews(repoId, idToken));
      showNotice('Google Business linked — real reviews will replace invented ones on your next edit.');
      await refreshRepo();
    } catch (error) { showNotice(error instanceof Error ? error.message : 'Could not link this business'); }
    finally { setLinkingPlaceId(null); setReviewsLoading(false); }
  };

  const loadBizAccounts = async () => {
    if (!idToken) return;
    setBizLoading(true);
    try { setBizAccounts(await getBusinessAccounts(idToken)); }
    catch (error) { showNotice(error instanceof Error ? error.message : 'Connect Google Search first, then try again'); }
    finally { setBizLoading(false); }
  };

  const loadBizLocations = async (accountName: string) => {
    if (!idToken) return;
    setBizLoading(true);
    try { setBizLocations(await getBusinessLocations(accountName, idToken)); }
    catch (error) { showNotice(error instanceof Error ? error.message : 'Could not load locations for that account'); }
    finally { setBizLoading(false); }
  };

  const linkLocation = async (location: BusinessLocation) => {
    if (!idToken) return;
    setBizLoading(true);
    try {
      await updateBusinessLocation(repoId, location.name, {}, idToken);
      setLinkedLocation(location);
      setBizLocations(null);
      showNotice('Business Profile location linked');
      await refreshRepo();
    } catch (error) { showNotice(error instanceof Error ? error.message : 'Could not link this location'); }
    finally { setBizLoading(false); }
  };

  const attachDomain = async () => {
    if (!idToken || !domainInput.trim()) return;
    setDomainBusy(true);
    try { await connectDomain(repoId, domainInput.trim(), idToken); showNotice('Domain added — update your DNS to finish connecting it.'); await refreshRepo(); setDomainInput(''); }
    catch (error) { showNotice(error instanceof Error ? error.message : 'Could not connect that domain'); }
    finally { setDomainBusy(false); }
  };

  const recheckDomain = async () => {
    if (!idToken) return;
    setDomainBusy(true);
    try { await getDomainStatus(repoId, idToken); await refreshRepo(); }
    catch (error) { showNotice(error instanceof Error ? error.message : 'Could not check domain status'); }
    finally { setDomainBusy(false); }
  };

  const removeDomain = async () => {
    if (!idToken) return;
    setDomainBusy(true);
    try { await disconnectDomain(repoId, idToken); showNotice('Domain disconnected'); await refreshRepo(); }
    catch (error) { showNotice(error instanceof Error ? error.message : 'Could not disconnect domain'); }
    finally { setDomainBusy(false); }
  };

  if (loadError) {
    return (
      <div className="standalone-page-shell">
        <div className="page-wide flex items-center justify-center" style={{ minHeight: '60vh' }}>
          <div className="text-center text-white/60">
            <p>{loadError}</p>
            <button type="button" className="secondary-button mt-4" onClick={() => navigate('/dashboard')}>Back to dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  if (!repo || !idToken) {
    return (
      <div className="standalone-page-shell">
        <div className="page-wide flex items-center justify-center" style={{ minHeight: '60vh' }}>
          <Loader2 className="h-6 w-6 animate-spin text-white/50" />
        </div>
      </div>
    );
  }

  const seoStatus = repo.seo_status || 'NOT_CONFIGURED';
  const isPublished = repo.vercel_deployment_status === 'READY' && !!repo.vercel_production_url;
  const uptimeStatus = uptime?.status || repo.uptime_status;

  return (
    <div className="standalone-page-shell">
    <div className="page-wide" style={{ maxWidth: 760 }}>
      <div className="flex items-center gap-3 mb-6">
        <button type="button" className="icon-button" aria-label="Back to editor" onClick={() => navigate(`/dashboard/editor/${repoId}`)}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-lg font-semibold">{repo.repo_name} — Growth</h1>
          <p className="text-xs text-white/40">Search, speed, uptime, real reviews, and your business's online presence.</p>
        </div>
      </div>

      {/* Production */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5 mb-5">
        <h2 className="text-sm font-semibold mb-1">Production</h2>
        {isPublished ? (
          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <Check size={15} /> Live at{' '}
            <a href={repo.vercel_production_url} target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-1">
              {repo.vercel_production_url} <ExternalLink size={12} />
            </a>
          </div>
        ) : (
          <p className="text-sm text-white/50">Not published yet — use Publish in the editor first. Search Console, PageSpeed, and uptime monitoring all need a live URL.</p>
        )}
      </section>

      {/* Technical SEO + PageSpeed */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5 mb-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Technical SEO readiness</h2>
              <button type="button" className="secondary-button" onClick={runAudit} disabled={auditLoading}>
                {auditLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Run audit
              </button>
            </div>
            {audit ? (
              <>
                <p className="text-2xl font-semibold mb-3">{audit.score}<span className="text-sm text-white/40">/100</span></p>
                <ul className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(audit.checks).map(([key, passed]) => (
                    <li key={key} className="flex items-center gap-1.5 text-white/60">
                      {passed ? <Check size={13} className="text-emerald-400" /> : <X size={13} className="text-red-400" />}
                      {formatCheckLabel(key)}
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-white/30 mt-3">A technical readiness score, not a Google ranking score.</p>
              </>
            ) : (
              <p className="text-sm text-white/50">Checks titles, meta descriptions, canonical URLs, sitemap.xml, robots.txt, structured data, alt text, and viewport.</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold flex items-center gap-1.5"><Gauge size={15} /> PageSpeed</h2>
              <button type="button" className="secondary-button" onClick={runPageSpeed} disabled={pageSpeedLoading || !isPublished}>
                {pageSpeedLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Check
              </button>
            </div>
            {pageSpeed ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <Stat label="Performance" value={scoreOrDash(pageSpeed.performance)} />
                  <Stat label="Accessibility" value={scoreOrDash(pageSpeed.accessibility)} />
                  <Stat label="Best practices" value={scoreOrDash(pageSpeed.bestPractices)} />
                  <Stat label="SEO" value={scoreOrDash(pageSpeed.seo)} />
                </div>
                <p className="text-[11px] text-white/30">Real Core Web Vitals for {pageSpeed.strategy}, from Google PageSpeed Insights.</p>
              </>
            ) : (
              <p className="text-sm text-white/50">{isPublished ? 'Run a check for real Core Web Vitals scores.' : 'Publish the site first.'}</p>
            )}
          </div>
        </div>
      </section>

      {/* Google Search Console */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5 mb-5">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Search size={15} /> Google Search</h2>

        {(seoStatus === 'NOT_CONFIGURED' || seoStatus === 'GENERATED') && (
          <div>
            <p className="text-sm text-white/50 mb-3">Connect your Google account to verify ownership, submit your sitemap, and see real search performance.</p>
            <button type="button" className="primary-button" onClick={connectGoogle} disabled={!isPublished || busy === 'connect'}>
              {busy === 'connect' ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Connect Google Search
            </button>
            {!isPublished && <p className="text-[11px] text-white/30 mt-2">Publish the site first.</p>}
          </div>
        )}

        {seoStatus === 'GOOGLE_CONNECTED' && (
          <div>
            <p className="text-sm text-emerald-400 flex items-center gap-1.5 mb-3"><Check size={14} /> Google connected</p>
            <button type="button" className="secondary-button" onClick={startVerification} disabled={busy === 'verify-start'}>
              {busy === 'verify-start' ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />} Get verification token
            </button>
          </div>
        )}

        {seoStatus === 'VERIFICATION_PENDING' && (
          <div>
            <p className="text-sm text-amber-400 mb-3">Verification tag requested — click Publish in the editor to make it live, then confirm below.</p>
            <button type="button" className="primary-button" onClick={confirmVerification} disabled={busy === 'verify-confirm'}>
              {busy === 'verify-confirm' ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />} Confirm verification
            </button>
          </div>
        )}

        {(seoStatus === 'VERIFIED' || seoStatus === 'SITEMAP_SUBMITTED') && (
          <div>
            <p className="text-sm text-emerald-400 flex items-center gap-1.5 mb-3"><Check size={14} /> Site ownership verified</p>
            {seoStatus === 'VERIFIED' ? (
              <button type="button" className="primary-button mb-4" onClick={submitSitemap} disabled={busy === 'sitemap'}>
                {busy === 'sitemap' ? <Loader2 size={14} className="animate-spin" /> : null} Submit sitemap
              </button>
            ) : (
              <p className="text-sm text-emerald-400 flex items-center gap-1.5 mb-4"><Check size={14} /> Sitemap submitted</p>
            )}

            <div className="rounded-lg bg-black/20 p-4">
              <p className="text-xs text-white/40 mb-2">Last 28 days</p>
              {performance?.hasData ? (
                <div className="grid grid-cols-4 gap-3 text-sm">
                  <Stat label="Impressions" value={performance.impressions ?? 0} />
                  <Stat label="Clicks" value={performance.clicks ?? 0} />
                  <Stat label="CTR" value={`${((performance.ctr ?? 0) * 100).toFixed(1)}%`} />
                  <Stat label="Avg. position" value={(performance.avgPosition ?? 0).toFixed(1)} />
                </div>
              ) : (
                <p className="text-sm text-white/40">Collecting Google Search data…</p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Uptime */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold flex items-center gap-1.5"><Activity size={15} /> Uptime</h2>
          <button type="button" className="secondary-button" onClick={toggleUptime} disabled={uptimeBusy || !isPublished}>
            {uptimeBusy ? <Loader2 size={14} className="animate-spin" /> : null}
            {repo.uptime_monitor_id ? 'Stop monitoring' : 'Start monitoring'}
          </button>
        </div>
        {repo.uptime_monitor_id ? (
          <div className="flex items-center gap-4">
            <UptimeBadge status={uptimeStatus} />
            {typeof uptime?.uptimeRatio30d === 'number' && (
              <p className="text-sm text-white/50">{uptime.uptimeRatio30d.toFixed(2)}% over 30 days</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-white/50">{isPublished ? 'Get alerted if your live site goes down.' : 'Publish the site first.'}</p>
        )}
      </section>

      {/* Reviews */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5 mb-5">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Star size={15} /> Reviews</h2>

        {!repo.google_place_id ? (
          <div>
            <p className="text-sm text-white/50 mb-3">Link your Google Business listing to replace the AI's invented testimonials with your real reviews (needs at least 3).</p>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={placeQuery}
                onChange={(e) => setPlaceQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchPlaces()}
                placeholder="Business name and city"
                className="flex-1 h-9 rounded-md bg-black/20 border border-white/10 px-3 text-sm text-white outline-none focus:border-white/30"
              />
              <button type="button" className="secondary-button" onClick={searchPlaces} disabled={placeSearching || !placeQuery.trim()}>
                {placeSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Search
              </button>
            </div>
            {placeCandidates && (
              placeCandidates.length === 0 ? (
                <p className="text-sm text-white/40">No matches — try a more specific name or add the city.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {placeCandidates.map((c) => (
                    <li key={c.placeId} className="flex items-center justify-between gap-3 rounded-lg bg-black/20 p-3">
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{c.name}</p>
                        <p className="text-xs text-white/40 truncate">{c.address}{typeof c.rating === 'number' ? ` · ${c.rating.toFixed(1)}★ (${c.reviewCount ?? 0})` : ''}</p>
                      </div>
                      <button type="button" className="secondary-button shrink-0" onClick={() => linkPlace(c.placeId)} disabled={linkingPlaceId === c.placeId}>
                        {linkingPlaceId === c.placeId ? <Loader2 size={14} className="animate-spin" /> : 'This one'}
                      </button>
                    </li>
                  ))}
                </ul>
              )
            )}
          </div>
        ) : reviewsLoading ? (
          <Loader2 size={16} className="animate-spin text-white/40" />
        ) : reviews ? (
          <div>
            <p className="text-sm text-white/50 mb-3">
              {reviews.name} · {typeof reviews.rating === 'number' ? `${reviews.rating.toFixed(1)}★` : ''} · {reviews.reviewCount ?? 0} reviews
              {reviews.reviews.length < 3 && <span className="text-amber-400"> — need {3 - reviews.reviews.length} more before these replace invented testimonials</span>}
            </p>
            <ul className="flex flex-col gap-2">
              {reviews.reviews.map((r, i) => (
                <li key={i} className="rounded-lg bg-black/20 p-3">
                  <p className="text-sm text-white/80">{r.text}</p>
                  <p className="text-xs text-white/40 mt-1.5">{r.name} · {r.rating}★ · {r.relativeTime}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-white/50">No reviews found for the linked business yet.</p>
        )}
      </section>

      {/* Business Profile */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5 mb-5">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><MapPin size={15} /> Business Profile</h2>

        {linkedLocation ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm text-white/70">
            <p><span className="text-white/40">Name: </span>{linkedLocation.title || '—'}</p>
            <p><span className="text-white/40">Phone: </span>{linkedLocation.phoneNumbers?.primaryPhone || '—'}</p>
            <p><span className="text-white/40">Website: </span>{linkedLocation.websiteUri || '—'}</p>
            <p><span className="text-white/40">Address: </span>{linkedLocation.storefrontAddress?.addressLines?.join(', ') || '—'}</p>
          </div>
        ) : bizLocations ? (
          <ul className="flex flex-col gap-2">
            {bizLocations.map((loc) => (
              <li key={loc.name} className="flex items-center justify-between gap-3 rounded-lg bg-black/20 p-3">
                <p className="text-sm text-white truncate">{loc.title || loc.name}</p>
                <button type="button" className="secondary-button shrink-0" onClick={() => linkLocation(loc)} disabled={bizLoading}>Link</button>
              </li>
            ))}
          </ul>
        ) : bizAccounts ? (
          <ul className="flex flex-col gap-2">
            {bizAccounts.map((acc) => (
              <li key={acc.name} className="flex items-center justify-between gap-3 rounded-lg bg-black/20 p-3">
                <p className="text-sm text-white truncate">{acc.accountName || acc.name}</p>
                <button type="button" className="secondary-button shrink-0" onClick={() => loadBizLocations(acc.name)} disabled={bizLoading}>
                  {bizLoading ? <Loader2 size={14} className="animate-spin" /> : 'Choose'}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div>
            <p className="text-sm text-white/50 mb-3">Manage your Google Maps listing — hours, phone, website — from here. Requires Google to have approved Business Profile access for this project.</p>
            <button type="button" className="secondary-button" onClick={loadBizAccounts} disabled={bizLoading}>
              {bizLoading ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />} Connect
            </button>
          </div>
        )}
      </section>

      {/* Domain */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Globe size={15} /> Domain</h2>

        {repo.custom_domain ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              {repo.custom_domain_status === 'VERIFIED' ? <Check size={14} className="text-emerald-400" /> : <Loader2 size={14} className="text-amber-400" />}
              <p className="text-sm text-white">{repo.custom_domain}</p>
              <span className="text-xs text-white/40">{repo.custom_domain_status === 'VERIFIED' ? 'Connected' : 'Waiting on DNS'}</span>
            </div>
            {repo.custom_domain_status !== 'VERIFIED' && (
              <p className="text-xs text-white/40 mb-3">Add the DNS records your registrar shows for this domain, then recheck. This can take a few hours to propagate.</p>
            )}
            <div className="flex gap-2">
              <button type="button" className="secondary-button" onClick={recheckDomain} disabled={domainBusy}>
                {domainBusy ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Recheck
              </button>
              <button type="button" className="secondary-button" onClick={removeDomain} disabled={domainBusy}>Disconnect</button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-white/50 mb-3">Connect a domain you own instead of the default address. Publish via Vercel first.</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && attachDomain()}
                placeholder="yourbusiness.com"
                className="flex-1 h-9 rounded-md bg-black/20 border border-white/10 px-3 text-sm text-white outline-none focus:border-white/30"
              />
              <button type="button" className="primary-button" onClick={attachDomain} disabled={domainBusy || !domainInput.trim() || !repo.vercel_project_id}>
                {domainBusy ? <Loader2 size={14} className="animate-spin" /> : 'Connect'}
              </button>
            </div>
            {!repo.vercel_project_id && <p className="text-[11px] text-white/30 mt-2">Publish via Vercel first.</p>}
          </div>
        )}
      </section>

      {notice && <div className="toast-notice"><Check size={15} />{notice}</div>}
    </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-[11px] text-white/40">{label}</p>
    </div>
  );
}

function scoreOrDash(score: number | null): string {
  return typeof score === 'number' ? String(score) : '—';
}

function UptimeBadge({ status }: { status?: string }) {
  const map: Record<string, { label: string; color: string }> = {
    UP: { label: 'Up', color: 'text-emerald-400' },
    DOWN: { label: 'Down', color: 'text-red-400' },
    SEEMS_DOWN: { label: 'Possibly down', color: 'text-amber-400' },
    PENDING: { label: 'Checking…', color: 'text-white/50' },
    PAUSED: { label: 'Paused', color: 'text-white/40' },
  };
  const entry = (status && map[status]) || { label: 'Unknown', color: 'text-white/40' };
  return <p className={`text-sm flex items-center gap-1.5 ${entry.color}`}><span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />{entry.label}</p>;
}

function formatCheckLabel(key: string): string {
  const labels: Record<string, string> = {
    pageTitles: 'Page title',
    metaDescriptions: 'Meta description',
    canonicalUrls: 'Canonical URL',
    sitemap: 'Sitemap.xml',
    robotsTxt: 'Robots.txt',
    structuredData: 'Structured data',
    altText: 'Image alt text',
    mobileViewport: 'Mobile viewport',
    indexable: 'Indexable',
  };
  return labels[key] || key;
}
