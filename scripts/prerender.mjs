#!/usr/bin/env node
/**
 * Prerenders the single '/' route to static HTML.
 *
 * The site is a client-rendered SPA: without this, a visitor's (or crawler's) first
 * response is `<div id="root"></div>` and real content only appears once React has
 * booted. Booting the built app in a real browser and writing the resulting DOM back
 * into index.html fixes that — the text is in the markup before any script runs, and
 * the app still boots on top and hydrates over it.
 *
 * Uses Playwright because it's already a dependency for the layout/a11y suite — no SSR
 * runtime, no second framework. Unlike TurboHamstarter (this repo's sibling project),
 * there's no admin-editable content or API to diverge from: everything here is bundled
 * at build time, so there's no __CONTENT__ embedding step, no multi-route/i18n loop, and
 * no GitHub Pages 404.html SPA-fallback to write (there's no client-side router left —
 * react-router-dom was dead weight and got dropped in the TS port).
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { SITE_DESCRIPTION, SITE_TITLE } from '@qalor/shared';

// Where the site will actually live. Used for the canonical link and sitemap.
const SITE = (process.env.SITE_URL ?? 'https://qalor.nl').replace(/\/$/, '');
const DIST = new URL('../packages/web/dist/', import.meta.url).pathname;
const PORT = 4599;

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('✗ no build to prerender — run `npm run build` first');
  process.exit(1);
}

// ---- serve the built app ----------------------------------------------------
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  cwd: new URL('../packages/web/', import.meta.url).pathname,
  stdio: 'ignore',
});
const stop = () => server.kill();
process.on('exit', stop);
process.on('SIGINT', () => {
  stop();
  process.exit(1);
});

const origin = `http://localhost:${PORT}`;
for (let i = 0; i < 60; i++) {
  try {
    const r = await fetch(origin);
    if (r.ok) break;
  } catch {}
  await new Promise((r) => setTimeout(r, 500));
}

// ---- render -------------------------------------------------------------------
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto(origin, { waitUntil: 'networkidle' });

// The below-the-fold sections are React.lazy()+Suspense, not viewport-gated — they
// resolve on their own shortly after mount. 'networkidle' above already waits for their
// chunk requests, but give React one more tick to finish committing the resolved trees
// before capturing, since Suspense's fallback -> real content swap isn't itself a
// network event.
await page.waitForTimeout(300);

const root = await page.evaluate(() => document.getElementById('root')?.innerHTML ?? '');
const visible = root
  .replace(/<script[\s\S]*?<\/script>/g, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();
if (visible.length < 200) {
  console.error(`✗ prerender captured only ${visible.length} chars of text — not publishing`);
  await browser.close();
  stop();
  process.exit(1);
}

let template = readFileSync(join(DIST, 'index.html'), 'utf8');
if (!template.includes('<div id="root"></div>')) {
  console.error(`✗ ${DIST}index.html is not a clean build shell — run \`npm run build\` first`);
  process.exit(1);
}

// Inline the built stylesheet instead of linking it: a single-route site gets nothing
// from the browser caching a separate CSS file across visits, but it does pay for the
// extra render-blocking round trip (Lighthouse's render-blocking-insight flagged this
// directly). The file is small (a few KB gzipped), so inlining it is strictly cheaper here.
const cssLinkMatch = template.match(/<link rel="stylesheet"[^>]*href="([^"]+\.css)"[^>]*>/);
if (cssLinkMatch) {
  const cssPath = join(DIST, cssLinkMatch[1].replace(/^\//, ''));
  const css = readFileSync(cssPath, 'utf8');
  template = template.replace(cssLinkMatch[0], `<style>${css}</style>`);
}

const canonicalTag = `<link rel="canonical" href="${esc(SITE)}/" />`;
const ogTags = [
  '<meta property="og:type" content="website" />',
  `<meta property="og:title" content="${esc(SITE_TITLE)}" />`,
  `<meta property="og:description" content="${esc(SITE_DESCRIPTION)}" />`,
  `<meta property="og:url" content="${esc(SITE)}/" />`,
].join('\n    ');

/**
 * Preload the LCP candidate (Hero's photo) so the browser starts fetching it while
 * parsing <head>, instead of waiting for React to render the <img> tag that would
 * otherwise be the first thing to request it. Mirrors Hero.tsx's own
 * optimizeUrl()/fullBleedSrcSet() call exactly (packages/web/src/lib/images.ts) — this
 * script can't import that (it's app-internal, not a published package), so the
 * transform is duplicated here; keep both in sync if either changes.
 */
const HERO_IMAGE = 'https://res.cloudinary.com/o5hr8kjc/image/upload/qalor/hero.jpg';
const heroOptimize = (w) =>
  HERO_IMAGE.replace('/image/upload/', `/image/upload/q_auto,w_${w}/`).replace(/\.jpg$/, '.webp');
const heroSrcSet = [480, 768, 1024, 1200].map((w) => `${heroOptimize(w)} ${w}w`).join(', ');
const preloadTag = `<link rel="preload" as="image" href="${esc(heroOptimize(1024))}" imagesrcset="${esc(heroSrcSet)}" imagesizes="(max-width: 768px) 100vw, 50vw" fetchpriority="high" />`;

const html = template
  .replace('<html ', '<html data-prerendered ')
  .replace('</title>', `</title>\n    ${canonicalTag}\n    ${ogTags}\n    ${preloadTag}`)
  .replace('<div id="root"></div>', `<div id="root">${root}</div>`);

writeFileSync(join(DIST, 'index.html'), html);

// ---- sitemap + robots -----------------------------------------------------------
const today = new Date().toISOString().slice(0, 10);
writeFileSync(
  join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${SITE}/</loc><lastmod>${today}</lastmod></url>\n</urlset>\n`,
);
writeFileSync(
  join(DIST, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`,
);

// ---- hydration gate -------------------------------------------------------------
/**
 * Writing correct-looking HTML isn't enough: if the client's first render disagrees
 * with it by even one text node, React discards the whole prerendered subtree and
 * re-renders from scratch, which undoes the point of prerendering (nothing looks
 * broken to a visitor, so this is invisible without a check like this one).
 */
// Not checked here: "does the visible text stay the same after load". The below-the-fold
// sections are React.lazy()+Suspense, so a fallback -> real content swap shortly after
// load is expected, correct behavior, not a regression — a check like that would fail on
// every healthy build. What actually indicates a broken prerender is a hydration error.
const hydrationPage = await browser.newPage();
const mismatches = [];
hydrationPage.on('pageerror', (e) => {
  const code = e.message.match(/Minified React error #(\d+)/)?.[1];
  // 418 hydration mismatch, 423 error while hydrating, 425 text content mismatch.
  if (code && ['418', '423', '425'].includes(code)) mismatches.push(code);
});

await hydrationPage.goto(origin, { waitUntil: 'networkidle' });
await hydrationPage.waitForTimeout(500);

let failed = false;

if (mismatches.length) {
  console.error(
    `✗ page fails to hydrate (React ${[...new Set(mismatches)].join(', ')}) — the prerendered markup is being thrown away`,
  );
  failed = true;
}

await browser.close();
stop();

if (failed) {
  console.error('✗ prerender produced problem(s); not publishing this build');
  process.exit(1);
}
console.log('✓ prerendered / — hydrates cleanly, sitemap.xml and robots.txt written');
