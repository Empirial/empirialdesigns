import { chromium } from 'playwright';
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';

const HERO_DIR = 'D:/empirialdesigns/src/assets/portfolio';
const FULL_DIR = 'D:/empirialdesigns/marketing-assets/portfolio-screenshots';
const VIEWPORT = { width: 1440, height: 900 };
const MAX_FULL_HEIGHT = 12000; // sanity cap against runaway scrollHeight

const SITES = [
  ['smite-trade', 'https://smitetrade.co.za'],
  ['mrpdf', 'https://mrpdf.co.za'],
  ['careergate', 'https://careergate.co.za'],
  ['zion', 'https://apex-905a6.web.app/'],
  ['samtambani', 'https://samtambani.netlify.app'],
  ['little-saints', 'https://littlesaints.co.za'],
  ['m-bendla-m-attorneys', 'https://www.mbendelamtattorneys.co.za'],
  ['nna-electricals', 'https://nnaelectrical.co.za/'],
  ['mphela-industries', 'https://mphelaindus.web.app/'],
  ['gogo-carwash', 'https://gogocarwash1.netlify.app'],
  ['bongs-kitchen', 'https://bongskitchen.netlify.app'],
  ['empirial-quizines', 'https://empirialquizines.netlify.app'],
  ['empirial-academy', 'https://empirialacademy.netlify.app'],
  ['uresure', 'https://uresure.netlify.app'],
  ['yt-shika-attorneys', 'https://ytshikaattonerys.netlify.app/'],
  ['empirial-coffee', 'https://empirialcoffee.netlify.app'],
  ['empirial-estate', 'https://empirialestate.netlify.app'],
  ['empirial-pastry', 'https://empirialpastry.netlify.app'],
  ['empirial-attorneys', 'https://empirialattorney.netlify.app/'],
  ['miss-empirial-sa', 'https://missempirialsa.netlify.app'],
  ['siyalele-projects', 'https://siyaleleprojects.netlify.app'],
  ['pitchly', 'https://pitchly-5e336.web.app'],
];

const only = process.argv.slice(2);
const targets = only.length ? SITES.filter(([slug]) => only.includes(slug)) : SITES;

async function run() {
  // Chromium throttles requestAnimationFrame in headless/background-tab
  // contexts by default — that's what was stalling Pitchly's Framer Motion
  // hero animation forever regardless of how long the script waited: RAF
  // callbacks just weren't firing. These flags disable that throttling.
  const browser = await chromium.launch({
    args: ['--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding'],
  });
  const results = [];

  for (const [slug, url] of targets) {
    const page = await browser.newPage({ viewport: VIEWPORT });
    try {
      console.log(`-> ${slug} (${url})`);
      await page.goto(url, { waitUntil: 'load', timeout: 45000 });
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
      // Above-the-fold mount animations (fade/slide-in on load, sometimes
      // gated behind client-side hydration on top of network load) need a
      // real beat to finish before either shot — shooting too early catches
      // them mid-fade. Longer than it looks like it should need on purpose.
      await page.waitForTimeout(2800);

      // Hero shot first, before any scrolling: several sites replay their
      // fade-in the moment the hero section re-enters the viewport, so
      // capturing after a scroll-down-then-back-up pass caught it mid-replay
      // instead of settled.
      const heroPath = path.join(HERO_DIR, `${slug}-hero.jpg`);
      await page.screenshot({ path: heroPath, type: 'jpeg', quality: 85 });

      // Hide fixed/sticky-positioned elements (nav bars, floating WhatsApp
      // buttons, etc.) right after the hero shot — otherwise each of the
      // slice screenshots below recaptures them pinned at the same
      // on-screen spot, and stitching prints them repeatedly down the final
      // image instead of once. They're already visible in the hero shot.
      await page.evaluate(() => {
        for (const el of document.querySelectorAll('*')) {
          const pos = getComputedStyle(el).position;
          if (pos === 'fixed' || pos === 'sticky') {
            el.style.setProperty('visibility', 'hidden', 'important');
          }
        }
      }).catch(() => {});

      // Full-page: stitch real viewport slices captured while genuinely
      // scrolled to each position, rather than Playwright's fullPage option
      // (which renders the whole document at once via CDP without actually
      // scrolling). Sites using scroll-scrubbed GSAP ScrollTrigger timelines
      // key their animation progress off the live scrollY — captured that
      // way, every section below the fold rendered at its scrollY=0 (hidden)
      // state, producing huge blank bands. Real per-position scrolling keeps
      // each slice's scroll-driven state correct.
      let height = await page.evaluate(() => document.body.scrollHeight);
      height = Math.min(height, MAX_FULL_HEIGHT);
      const slices = [];
      let target = 0;
      while (true) {
        await page.evaluate((y) => window.scrollTo(0, y), target);
        // The browser clamps scrollY at the real max — read it back so the
        // final (short) slice lands at its true position instead of the
        // loop's requested (possibly overshot) target.
        const actualY = await page.evaluate(() => window.scrollY);
        await page.waitForTimeout(500);
        const buf = await page.screenshot({ type: 'png' });
        slices.push({ buf, y: actualY });
        if (actualY + VIEWPORT.height >= height) break;
        target += VIEWPORT.height;
      }

      const composite = sharp({
        create: { width: VIEWPORT.width, height, channels: 3, background: '#ffffff' },
      }).composite(slices.map(({ buf, y }) => ({ input: buf, top: y, left: 0 })));

      const fullPath = path.join(FULL_DIR, `${slug}-full.jpg`);
      await composite.jpeg({ quality: 85 }).toFile(fullPath);

      results.push([slug, 'ok']);
    } catch (err) {
      results.push([slug, `FAILED: ${err.message}`]);
      console.error(`   FAILED: ${slug} — ${err.message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();

  console.log('\n=== Summary ===');
  for (const [slug, status] of results) console.log(`${slug}: ${status}`);
}

run();
