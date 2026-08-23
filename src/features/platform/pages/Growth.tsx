import { useEffect, useState, type ReactNode } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import {
  ArrowLeft, Check, ExternalLink, Loader2, RefreshCw, Search, ShieldCheck, X,
  Activity, Star, MapPin, Globe, Gauge, Eye, MousePointerClick, Percent, Hash,
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
  getDeploymentStatus,
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
        // Live Vercel status, not just whatever Firestore had cached from
        // the last publish — a deploy that finished after the user left the
        // page (or a redeploy triggered straight from Vercel) would
        // otherwise leave this page showing a stale Production banner/KPI
        // tile indefinitely. Same self-healing endpoint BuilderPage.tsx's
        // header now also refreshes on load.
        if (loadedRepo.vercel_project_id) {
          getDeploymentStatus(repoId, token)
            .then(({ status, url }) => setRepo((prev) => (prev ? { ...prev, vercel_deployment_status: status, vercel_production_url: url ?? prev.vercel_production_url } : prev)))
            .catch(() => undefined);
        }
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

  // Derived, display-only — no new fetches, just reads the same state the
  // detail cards below already hold. Purely for the at-a-glance stat strip
  // (growth-stats) so the page's overall health reads in one glance instead
  // of requiring a read of all 6 cards underneath it.
  const seoTile = audit
    ? { value: `${audit.score}`, sub: '/ 100', score: audit.score, tone: scoreTone(audit.score) }
    : { value: 'Not checked', sub: 'Run an audit below', score: null, tone: 'neutral' as const };
  const speedTile = pageSpeed && typeof pageSpeed.performance === 'number'
    ? { value: `${pageSpeed.performance}`, sub: '/ 100', score: pageSpeed.performance, tone: scoreTone(pageSpeed.performance) }
    : { value: isPublished ? 'Not checked' : 'Not published', sub: isPublished ? 'Run a check below' : 'Publish first', score: null, tone: 'neutral' as const };
  const uptimeTile = repo.uptime_monitor_id
    ? { value: (uptimeStatus && { UP: 'Up', DOWN: 'Down', SEEMS_DOWN: 'Possibly down', PENDING: 'Checking…', PAUSED: 'Paused' }[uptimeStatus]) || 'Unknown', sub: typeof uptime?.uptimeRatio30d === 'number' ? `${uptime.uptimeRatio30d.toFixed(2)}% / 30d` : 'Monitoring', tone: uptimeStatus === 'UP' ? 'ok' : uptimeStatus === 'DOWN' ? 'error' : uptimeStatus === 'SEEMS_DOWN' ? 'warn' : 'neutral' as const }
    : { value: 'Not monitored', sub: 'Enable below', tone: 'neutral' as const };
  const reviewsTile = repo.google_place_id
    ? (reviews && typeof reviews.rating === 'number' ? { value: `${reviews.rating.toFixed(1)}★`, sub: `${reviews.reviewCount ?? 0} reviews`, tone: reviews.rating >= 4 ? 'ok' : reviews.rating >= 3 ? 'warn' : 'error' as const } : { value: 'Loading…', sub: '', tone: 'neutral' as const })
    : { value: 'Not linked', sub: 'Link below', tone: 'neutral' as const };

  return (
    <div className="standalone-page-shell">
    <div className="page-wide" style={{ maxWidth: 900 }}>
      <div className="growth-header">
        <button type="button" className="icon-button" aria-label="Back to editor" onClick={() => navigate(`/dashboard/editor/${repoId}`)}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <span className="eyebrow"><Activity size={12} /> GROWTH</span>
          <h1 className="page-title">{repo.repo_name}</h1>
          <p className="page-subtitle">Search, speed, uptime, real reviews, and your business's online presence.</p>
        </div>
      </div>

      {/* Production — the one fact on this page more important than
          everything below it, so it gets a banner instead of a card
          identical to the other 6. */}
      <div className={`growth-banner ${isPublished ? 'is-live' : ''}`}>
        <span className="growth-banner-label">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" /> {isPublished ? 'Live in production' : 'Production'}
        </span>
        {isPublished ? (
          <a href={repo.vercel_production_url} target="_blank" rel="noreferrer" className="growth-banner-url">
            {repo.vercel_production_url} <ExternalLink size={14} />
          </a>
        ) : (
          <p className="growth-banner-empty">Not published yet — use Publish in the editor first. Search Console, PageSpeed, and uptime monitoring all need a live URL.</p>
        )}
      </div>

      {/* At-a-glance KPI row — a dial per metric (gauge where there's a
          0-100 score, an icon dial otherwise) instead of plain numbers, so
          the site's overall health reads in one glance. */}
      <div className="growth-stats">
        <StatTile label="SEO readiness" icon={<ShieldCheck size={16} />} {...seoTile} />
        <StatTile label="PageSpeed" icon={<Gauge size={16} />} {...speedTile} />
        <StatTile label="Uptime" icon={<Activity size={16} />} {...uptimeTile} />
        <StatTile label="Reviews" icon={<Star size={16} />} {...reviewsTile} />
      </div>

      <div className="growth-grid">

      {/* Technical SEO + PageSpeed */}
      <div className="growth-card span-2">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <div className="growth-card-head">
              <span className="growth-card-title"><span className="growth-icon-chip"><ShieldCheck size={14} /></span> Technical SEO readiness</span>
              <button type="button" className="secondary-button" onClick={runAudit} disabled={auditLoading}>
                {auditLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Run audit
              </button>
            </div>
            {audit ? (
              <>
                <div className="flex items-center gap-4 mb-3">
                  <RadialGauge value={audit.score} tone={scoreTone(audit.score)} size={64} strokeWidth={6} />
                  <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                    {Object.entries(audit.checks).map(([key, passed]) => (
                      <li key={key} className="flex items-center gap-1.5 text-white/60">
                        {passed ? <Check size={13} className="text-emerald-400" /> : <X size={13} className="text-red-400" />}
                        {formatCheckLabel(key)}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-[11px] text-white/30">A technical readiness score, not a Google ranking score.</p>
              </>
            ) : (
              <p className="text-sm text-white/50">Checks titles, meta descriptions, canonical URLs, sitemap.xml, robots.txt, structured data, alt text, and viewport.</p>
            )}
          </div>

          <div>
            <div className="growth-card-head">
              <span className="growth-card-title"><span className="growth-icon-chip"><Gauge size={14} /></span> PageSpeed</span>
              <button type="button" className="secondary-button" onClick={runPageSpeed} disabled={pageSpeedLoading || !isPublished}>
                {pageSpeedLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Check
              </button>
            </div>
            {pageSpeed ? (
              <>
                <div className="kpi-mini-row mb-3">
                  <MiniGauge label="Performance" score={pageSpeed.performance} />
                  <MiniGauge label="Accessibility" score={pageSpeed.accessibility} />
                  <MiniGauge label="Best practices" score={pageSpeed.bestPractices} />
                  <MiniGauge label="SEO" score={pageSpeed.seo} />
                </div>
                <p className="text-[11px] text-white/30">Real Core Web Vitals for {pageSpeed.strategy}, from Google PageSpeed Insights.</p>
              </>
            ) : (
              <p className="text-sm text-white/50">{isPublished ? 'Run a check for real Core Web Vitals scores.' : 'Publish the site first.'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Google Search Console */}
      <div className="growth-card span-2">
        <div className="growth-card-head">
          <span className="growth-card-title"><span className="growth-icon-chip"><Search size={14} /></span> Google Search</span>
        </div>

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
            <StatusPill tone="ok" className="mb-3"><Check size={13} /> Google connected</StatusPill>
            <div>
              <button type="button" className="secondary-button" onClick={startVerification} disabled={busy === 'verify-start'}>
                {busy === 'verify-start' ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />} Get verification token
              </button>
            </div>
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
            <StatusPill tone="ok" className="mb-3"><Check size={13} /> Site ownership verified</StatusPill>
            {seoStatus === 'VERIFIED' ? (
              <div className="mb-4">
                <button type="button" className="primary-button" onClick={submitSitemap} disabled={busy === 'sitemap'}>
                  {busy === 'sitemap' ? <Loader2 size={14} className="animate-spin" /> : null} Submit sitemap
                </button>
              </div>
            ) : (
              <StatusPill tone="ok" className="mb-4"><Check size={13} /> Sitemap submitted</StatusPill>
            )}

            <div className="rounded-lg bg-black/20 p-4">
              <p className="text-xs text-white/40 mb-2">Last 28 days</p>
              {performance?.hasData ? (
                <div className="kpi-stat-row">
                  <KpiStat icon={<Eye size={14} />} label="Impressions" value={performance.impressions ?? 0} />
                  <KpiStat icon={<MousePointerClick size={14} />} label="Clicks" value={performance.clicks ?? 0} />
                  <KpiStat icon={<Percent size={14} />} label="CTR" value={`${((performance.ctr ?? 0) * 100).toFixed(1)}%`} />
                  <KpiStat icon={<Hash size={14} />} label="Avg. position" value={(performance.avgPosition ?? 0).toFixed(1)} />
                </div>
              ) : (
                <p className="text-sm text-white/40">Collecting Google Search data…</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Uptime */}
      <div className="growth-card">
        <div className="growth-card-head">
          <span className="growth-card-title"><span className="growth-icon-chip"><Activity size={14} /></span> Uptime</span>
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
      </div>

      {/* Reviews */}
      <div className="growth-card">
        <div className="growth-card-head">
          <span className="growth-card-title"><span className="growth-icon-chip"><Star size={14} /></span> Reviews</span>
        </div>

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
      </div>

      {/* Business Profile */}
      <div className="growth-card">
        <div className="growth-card-head">
          <span className="growth-card-title"><span className="growth-icon-chip"><MapPin size={14} /></span> Business Profile</span>
        </div>

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
      </div>

      {/* Domain */}
      <div className="growth-card">
        <div className="growth-card-head">
          <span className="growth-card-title"><span className="growth-icon-chip"><Globe size={14} /></span> Domain</span>
        </div>

        {repo.custom_domain ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <StatusPill tone={repo.custom_domain_status === 'VERIFIED' ? 'ok' : 'warn'}>
                {repo.custom_domain_status === 'VERIFIED' ? <Check size={13} /> : <Loader2 size={13} className="animate-spin" />}
                {repo.custom_domain_status === 'VERIFIED' ? 'Connected' : 'Waiting on DNS'}
              </StatusPill>
              <p className="text-sm text-white">{repo.custom_domain}</p>
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
      </div>

      </div>

      {notice && <div className="toast-notice"><Check size={15} />{notice}</div>}
    </div>
    </div>
  );
}

type Tone = 'ok' | 'warn' | 'error' | 'neutral';

/** One reusable tinted-surface status readout — see dashboard-theme.css's
 * .status-pill. Replaces this page's previous ad hoc "colored text + icon"
 * repeated at every status line with one consistent look. */
function StatusPill({ tone, className = '', children }: { tone: Tone; className?: string; children: ReactNode }) {
  return <span className={`status-pill tone-${tone} ${className}`}>{children}</span>;
}

function scoreTone(score: number): Tone {
  return score >= 80 ? 'ok' : score >= 50 ? 'warn' : 'error';
}

/** One dial in the at-a-glance KPI row at the top of the page — a radial
 * gauge for anything with a 0-100 score, an icon dial otherwise (uptime,
 * reviews have no such score). See dashboard-theme.css's .growth-stats. */
function StatTile({ label, icon, value, sub, score, tone }: { label: string; icon: ReactNode; value: string; sub?: string; score?: number | null; tone: Tone }) {
  return (
    <div className="growth-stat-tile">
      <span className="growth-stat-tile-dial">
        {typeof score === 'number'
          ? <RadialGauge value={score} tone={tone} size={48} strokeWidth={5} />
          : <span className={`growth-stat-tile-dial-icon tone-${tone}`}>{icon}</span>}
      </span>
      <span className="growth-stat-tile-body">
        <p className="growth-stat-tile-label">{label}</p>
        <p className={`growth-stat-tile-value tone-${tone}`}>{value}</p>
        {sub && <p className="growth-stat-tile-sub">{sub}</p>}
      </span>
    </div>
  );
}

/** SVG donut gauge for a 0-100 score — used both in the KPI row and inline
 * in the Technical SEO / PageSpeed cards, so a score always reads as a dial
 * first and a number second. See dashboard-theme.css's .kpi-gauge*. */
function RadialGauge({ value, tone, size = 56, strokeWidth = 6 }: { value: number; tone: Tone; size?: number; strokeWidth?: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const center = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="kpi-gauge" role="img" aria-label={`Score ${Math.round(clamped)} out of 100`}>
      <circle className="kpi-gauge-track" cx={center} cy={center} r={radius} strokeWidth={strokeWidth} />
      <circle
        className={`kpi-gauge-arc tone-${tone}`}
        cx={center} cy={center} r={radius} strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${center} ${center})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className={`kpi-gauge-text tone-${tone}`} style={{ fontSize: size * 0.32 }}>
        {Math.round(clamped)}
      </text>
    </svg>
  );
}

/** One small gauge + label, used in a row for PageSpeed's 4 sub-scores. */
function MiniGauge({ label, score }: { label: string; score: number | null }) {
  const tone = typeof score === 'number' ? scoreTone(score) : 'neutral';
  return (
    <div className="kpi-mini">
      {typeof score === 'number'
        ? <RadialGauge value={score} tone={tone} size={52} strokeWidth={5} />
        : <RadialGauge value={0} tone="neutral" size={52} strokeWidth={5} />}
      <p className="kpi-mini-label">{label}</p>
    </div>
  );
}

/** One icon + number stat, used for a row of related metrics (Search
 * Console's impressions/clicks/CTR/position) instead of bare label/value
 * pairs. See dashboard-theme.css's .kpi-stat*. */
function KpiStat({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <div className="kpi-stat">
      <span className="kpi-stat-icon">{icon}</span>
      <span>
        <p className="kpi-stat-value">{value}</p>
        <p className="kpi-stat-label">{label}</p>
      </span>
    </div>
  );
}

function UptimeBadge({ status }: { status?: string }) {
  const map: Record<string, { label: string; tone: Tone }> = {
    UP: { label: 'Up', tone: 'ok' },
    DOWN: { label: 'Down', tone: 'error' },
    SEEMS_DOWN: { label: 'Possibly down', tone: 'warn' },
    PENDING: { label: 'Checking…', tone: 'neutral' },
    PAUSED: { label: 'Paused', tone: 'neutral' },
  };
  const entry = (status && map[status]) || { label: 'Unknown', tone: 'neutral' as const };
  return <StatusPill tone={entry.tone}><span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />{entry.label}</StatusPill>;
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
