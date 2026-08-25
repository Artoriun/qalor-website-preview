#!/usr/bin/env node
/**
 * Prerenders the site's routes (see ROUTES below) to static HTML.
 *
 * The site is a client-rendered SPA: without this, a visitor's (or crawler's) first
 * response is `<div id="root"></div>` and real content only appears once React has
 * booted. Booting the built app in a real browser and writing the resulting DOM back
 * into index.html fixes that — the text is in the markup before any script runs, and
 * the app still boots on top and hydrates over it.
 *
 * Uses Playwright because it's already a dependency for the layout/a11y suite — no SSR
 * runtime, no second framework.
 *
 * Content comes from the admin API (packages/api) when VITE_API_URL is set, falling back
 * to the bundled defaults in packages/shared otherwise — same mechanism as the sibling
 * turbo-portfolio-starter project: a Firestore edit is only ever a diff from the bundle, so
 * a sleeping free-tier API (or one that was simply never configured) still produces a
 * correct, non-blank build rather than failing it. Whatever content this run actually used
 * gets embedded as `window.__CONTENT__` in the output, so the client's first hydration pass
 * matches exactly what the static HTML shows — a mismatch there (bundle vs. what was
 * fetched) would trip the hydration gate below just as surely as a real content bug.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import {
  ASSET_VERSION,
  DEFAULT_SITE_CONTENT,
  SERVICE_PAGES,
  SITE_DESCRIPTION,
  SITE_TITLE,
} from '@qalor/shared';

// Where the site will actually live. Used for the canonical link and sitemap.
const SITE = (process.env.SITE_URL ?? 'https://qalor.nl').replace(/\/$/, '');

// Set on preview builds (the GitHub Pages copy). That host serves the same real content as
// production, which without this is duplicate content competing with qalor.nl for the very
// terms ROUTES below is built to win. Canonicals already point at SITE (qalor.nl) even from
// the preview, which handles most of it; the noindex meta this adds is the explicit half.
const NOINDEX = process.env.NOINDEX === '1';
const DIST = new URL('../packages/web/dist/', import.meta.url).pathname;
const PORT = 4599;

/**
 * One prerendered file per search intent, derived from SERVICE_PAGES so the copy, the URL,
 * the sitemap and the schema can never disagree — adding a landing page is one edit in
 * @qalor/shared, not four here.
 *
 * Qalor's five target terms are three different intents (a drawing, a design, a
 * calculation/business case) and one page cannot rank for all of them. Each route gets its
 * own <title>, meta description, canonical and JSON-LD Service block, written to its own
 * directory so a static host serves it as a real URL.
 *
 * Trailing slashes are deliberate: the files are written as <path>/index.html, which is
 * what a static host (GitHub Pages, Apache) serves for a directory request, and it
 * canonicalises to the slashed form — so the canonical and sitemap must agree with that or
 * they fight. App.tsx matches both forms, for hosts that don't redirect.
 */
const ROUTES = [
  {
    path: '/',
    title: 'Warmtenet ontwerp, tekening en berekening | Qalor',
    description: SITE_DESCRIPTION,
    service: null,
  },
  ...SERVICE_PAGES.map((p) => ({
    path: `/${p.slug}/`,
    title: p.title,
    description: p.description,
    service: p.h1,
  })),
];

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('✗ no build to prerender — run `npm run build` first');
  process.exit(1);
}

// ---- load content -------------------------------------------------------------------------
async function loadContent() {
  // http→https is coerced for a real host (Render answers http with a 301, and a redirect
  // would need re-following) but not for localhost — VITE_API_URL=http://localhost:4000 is
  // exactly how this script gets tested locally, and there's no TLS server listening there
  // to coerce it to.
  const raw = process.env.VITE_API_URL ?? '';
  const api = /^http:\/\/(localhost|127\.0\.0\.1)/.test(raw)
    ? raw
    : raw.replace(/^http:\/\//, 'https://');
  if (!api) {
    console.warn('! VITE_API_URL not set — prerendering from bundled content');
    return DEFAULT_SITE_CONTENT;
  }
  try {
    const res = await fetch(`${api}/api/content`, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const data = await res.json();
    if (!data || typeof data !== 'object' || !data.hero) throw new Error('malformed response');
    return data;
  } catch (err) {
    console.warn(`! live API unreachable (${err.message}) — prerendering from bundled content`);
    return DEFAULT_SITE_CONTENT;
  }
}
const content = await loadContent();

// ---- serve the built app ----------------------------------------------------
// detached, so the whole process group can be killed rather than just the npx wrapper.
// `npx` spawns vite as a *child*: killing npx alone can leave vite holding the port, which
// is invisible until something runs this script twice in one job — as CI now does, once for
// the domain-root build and once for the subpath one. The second run then fails --strictPort
// and reports an empty capture, which points nowhere near the real cause.
// Delete this script's own output from a previous run before anything serves dist.
//
// `vite preview` serves a real file in preference to the SPA fallback, so a leftover
// dist/<route>/index.html is what capture() below re-reads: last run's markup, rendered by
// last run's bundle, with last run's base path baked into every URL. Nothing empties dist
// in between — turbo caches the build, and on a cache hit Vite never runs, so its
// emptyOutDir never fires.
//
// That made the output depend on what happened to be in dist beforehand. A subpath build
// emitted '/#how-it-works' and a root-absolute footer logo on all four service pages while
// the bundle it was supposedly capturing had the base path compiled in correctly, and the
// subpath suite went from passing to failing with no change to the source. Both links are
// broken on a project-subpath host: one navigates off the site, the other 404s.
for (const route of ROUTES) {
  if (route.path === '/') continue;
  rmSync(join(DIST, route.path), { recursive: true, force: true });
}

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  cwd: new URL('../packages/web/', import.meta.url).pathname,
  stdio: 'ignore',
  detached: true,
});
const stop = () => {
  try {
    process.kill(-server.pid, 'SIGTERM');
  } catch {
    // Already gone, or never started.
  }
};
process.on('exit', stop);
process.on('SIGINT', () => {
  stop();
  process.exit(1);
});

// Must match vite.config.ts's base (same env var), or `vite preview` serves the app at a
// path this script never navigates to and the capture below is an empty shell.
const BASE = process.env.VITE_BASE ?? '/';
const origin = `http://localhost:${PORT}`;
const appUrl = `${origin}${BASE}`;
let up = false;
for (let i = 0; i < 60; i++) {
  try {
    const r = await fetch(appUrl);
    if (r.ok) {
      up = true;
      break;
    }
  } catch {}
  await new Promise((r) => setTimeout(r, 500));
}
// Said out loud rather than left to surface as "captured 0 chars of text", which reads like
// a broken app when it actually means nothing was ever served.
if (!up) {
  console.error(
    `✗ the preview server never came up at ${appUrl} — port ${PORT} may still be held by a` +
      ' previous run',
  );
  stop();
  process.exit(1);
}

// ---- render -------------------------------------------------------------------
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

// Set before any app script runs, so ContentContext's initial render already matches what
// gets captured below — the same content this script embeds into the final HTML further
// down. Without this the capture would use bundled defaults while the embedded
// window.__CONTENT__ holds live-API content (or vice versa), and a real visitor's first
// hydration pass would disagree with one of them.
await page.addInitScript((data) => {
  window.__CONTENT__ = data;
}, content);

/**
 * Capture one route's rendered DOM.
 *
 * Navigates per route rather than reusing a single capture: the service routes render
 * genuinely different content from the home page now (App.tsx matches the path against
 * SERVICE_PAGES), which is the whole point of them existing. `vite preview` falls back to
 * index.html for paths with no matching file, so this works before the directories this
 * script is about to write exist.
 */
async function capture(path) {
  await page.goto(`${appUrl.replace(/\/$/, '')}${path}`, { waitUntil: 'networkidle' });
  // The below-the-fold sections are React.lazy()+Suspense, not viewport-gated — they
  // resolve on their own shortly after mount. 'networkidle' above already waits for their
  // chunk requests, but give React one more tick to finish committing the resolved trees
  // before capturing, since Suspense's fallback -> real content swap isn't itself a
  // network event.
  await page.waitForTimeout(300);

  // Capture what React renders, not what the page became afterwards.
  //
  // AOS stamps `aos-init` onto every [data-aos] element after mount, and `aos-animate` once
  // one scrolls into view. React renders those sections carrying neither, so leaving the
  // classes in the markup is a className mismatch on all five — enough by itself to make
  // hydration bail and discard the whole prerendered page, which is the failure the gate
  // below exists to catch.
  //
  // Stripped from the live DOM before serialising rather than by regex afterwards:
  // `class="projects-section aos-init"` has to keep the classes around it, and a string
  // substitution is the wrong tool for that.
  const root = await page.evaluate(() => {
    for (const el of document.querySelectorAll('[data-aos]')) {
      el.classList.remove('aos-init', 'aos-animate');
      if (el.getAttribute('class') === '') el.removeAttribute('class');
    }
    // Particles sizes its canvas from offsetWidth/offsetHeight in an effect, so the DOM
    // carries width/height attributes React never rendered — and the captured number is
    // whatever this viewport measured, which no visitor's viewport will agree with.
    for (const c of document.querySelectorAll('canvas')) {
      c.removeAttribute('width');
      c.removeAttribute('height');
    }
    return document.getElementById('root')?.innerHTML ?? '';
  });
  const visible = root
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (visible.length < 200) {
    console.error(
      `✗ prerender captured only ${visible.length} chars of text for ${path} — not publishing`,
    );
    await browser.close();
    stop();
    process.exit(1);
  }
  return root;
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
  // href is base-prefixed ('/qalor-website-preview/assets/…' on the preview build), but the
  // file on disk sits at dist/assets/… — strip the base, not just the leading slash.
  const cssPath = join(DIST, cssLinkMatch[1].replace(BASE, '').replace(/^\//, ''));
  const css = readFileSync(cssPath, 'utf8');
  template = template.replace(cssLinkMatch[0], `<style>${css}</style>`);
}

/**
 * JSON-LD. Organization on every page (one business, stated once per document), plus a
 * Service block on the four service routes describing that specific offering.
 *
 * `provider` points back at the Organization by @id rather than repeating it, so a
 * consumer reading any single page can tell all five Services belong to one company.
 * Contact details come from the same admin-editable content the Footer renders, not a
 * second hardcoded copy that would silently drift once someone edits them in the portal.
 */
const orgId = `${SITE}/#organization`;
const organization = {
  '@type': 'Organization',
  '@id': orgId,
  name: SITE_TITLE,
  url: `${SITE}/`,
  description: SITE_DESCRIPTION,
  email: content.footer.email,
  telephone: content.footer.phone,
  address: { '@type': 'PostalAddress', streetAddress: content.footer.address },
  vatID: content.footer.btwNumber,
};

const jsonLdFor = (route) => {
  const graph = [organization];
  if (route.service) {
    graph.push({
      '@type': 'Service',
      name: route.service,
      serviceType: route.service,
      description: route.description,
      url: `${SITE}${route.path}`,
      provider: { '@id': orgId },
      areaServed: { '@type': 'Country', name: 'Nederland' },
    });
  }
  // Same '<' escape as the content script below, for the same reason: these strings are
  // admin-editable, so a stray "</script>" in one would otherwise close this tag early.
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(
    /</g,
    '\\u003c',
  );
  return `<script type="application/ld+json">${json}</script>`;
};

const headFor = (route) => {
  const url = `${esc(SITE)}${esc(route.path)}`;
  return [
    ...(NOINDEX ? ['<meta name="robots" content="noindex, nofollow" />'] : []),
    `<link rel="canonical" href="${url}" />`,
    '<meta property="og:type" content="website" />',
    `<meta property="og:title" content="${esc(route.title)}" />`,
    `<meta property="og:description" content="${esc(route.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    jsonLdFor(route),
  ].join('\n    ');
};

/**
 * Preload the LCP candidate (Hero's photo) so the browser starts fetching it while
 * parsing <head>, instead of waiting for React to render the <img> tag that would
 * otherwise be the first thing to request it. Mirrors Hero.tsx's own
 * optimizeUrl()/fullBleedSrcSet() call exactly (packages/web/src/lib/images.ts) — this
 * script can't import that (it's app-internal, not a published package), so the
 * transform is duplicated here; keep both in sync if either changes.
 *
 * Reads content.hero.image rather than a hardcoded URL: once the image is admin-editable,
 * a hardcoded default would silently stop matching whatever Hero.tsx actually renders as
 * soon as someone changes it in the portal.
 */
const heroOptimize = (w) =>
  content.hero.image
    .replace(
      '/image/upload/',
      // ASSET_VERSION comes from @qalor/shared so this and optimizeUrl() cannot drift apart:
      // a preload that disagrees with the <img> by even one path segment is a second
      // download of the hero, not a head start on the first.
      `/image/upload/q_auto,w_${w}/${/\/image\/upload\/(?:[^/]+\/)*v\d+\//.test(content.hero.image) ? '' : `${ASSET_VERSION}/`}`,
    )
    .replace(/\.(jpe?g|png)$/i, '.webp');
const heroSrcSet = [480, 768, 1024, 1200].map((w) => `${heroOptimize(w)} ${w}w`).join(', ');
const preloadTag = `<link rel="preload" as="image" href="${esc(heroOptimize(1024))}" imagesrcset="${esc(heroSrcSet)}" imagesizes="(max-width: 768px) 100vw, 50vw" fetchpriority="high" />`;
// Escapes '<' so a stray "</script>" inside admin-edited text (a body field, say) can't
// prematurely close this tag — the rest of `template` after it would then render as raw
// text on the page instead of being part of the document, and depending on what followed,
// worse.
const contentJson = JSON.stringify(content).replace(/</g, '\\u003c');
const contentScript = `<script>window.__CONTENT__=${contentJson}</script>`;

for (const route of ROUTES) {
  const root = await capture(route.path);
  const html = template
    .replace('<html ', '<html data-prerendered ')
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${esc(route.description)}" />`,
    )
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(route.title)}</title>`)
    .replace('</title>', `</title>\n    ${headFor(route)}\n    ${preloadTag}\n    ${contentScript}`)
    .replace('<div id="root"></div>', `<div id="root">${root}</div>`);

  // Two properties of the exact bytes about to be written. Both were visible bugs on
  // production, both are reintroduced by an ordinary-looking edit, and nothing else here
  // would notice — the hydration gate above passes either way, and check-budgets.mjs runs
  // before this script, against the un-prerendered shell.
  //
  // Every @font-face must say `optional`. @fontsource ships every face as `swap`, so adding
  // a weight the obvious way — importing '@fontsource/inter/800.css' — silently restores the
  // reflow that widened the hero h1 from 244.0px to 260.1px about a second after paint.
  // packages/web/src/fonts.css is where weights get added instead.
  const swaps = (html.match(/font-display:\s*swap/g) ?? []).length;
  if (swaps > 0) {
    throw new Error(
      `${route.path || '/'}: ${swaps} @font-face rule(s) use font-display: swap. Declare the ` +
        `weight in packages/web/src/fonts.css with 'optional' rather than importing an ` +
        `@fontsource stylesheet, which ships 'swap' and reflows the text after first paint.`,
    );
  }

  // The header logo must be inlined. Scoped to <nav> because the footer carries an <img> with
  // the same alt text and is correctly a file — it is below the fold, where a second copy of
  // the base64 would be paid by everyone to help nobody. As a file the header logo was an
  // 11KB Low-priority image behind ~287KB of higher-priority traffic and appeared at ~2.7s;
  // dropping '?inline' from the import in Navbar.tsx puts it back with nothing else changing.
  const nav = html.match(/<nav[\s>][\s\S]*?<\/nav>/);
  if (!nav) throw new Error(`${route.path || '/'}: no <nav> in the prerendered markup`);
  const logo = nav[0].match(/<img[^>]*alt="Qalor Logo"[^>]*>/);
  if (!logo) throw new Error(`${route.path || '/'}: no header logo <img> inside <nav>`);
  if (!/src="data:/.test(logo[0])) {
    const src = logo[0].match(/src="([^"]*)"/)?.[1] ?? '(none)';
    throw new Error(
      `${route.path || '/'}: the header logo is a file request (src="${src}") rather than a ` +
        `data URI. Navbar.tsx imports it with '?inline' so that it costs no request at all.`,
    );
  }

  const outDir = join(DIST, route.path);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), html);
}

// A static host (GitHub Pages, and this site's own FTP host — neither ships an
// .htaccess/_redirects from this repo) serves 404.html for any path with no matching
// file, which is every route this SPA has other than '/' (i.e. '/admin'). `template`
// here is the plain, un-prerendered shell — not `html` above — on purpose: it boots
// fresh into whatever route the real pathname says, rather than flashing the home
// page's prerendered markup before Admin.tsx replaces it.
writeFileSync(join(DIST, '404.html'), template);

// ---- sitemap + robots -----------------------------------------------------------
const today = new Date().toISOString().slice(0, 10);
const urls = ROUTES.map(
  (r) => `  <url><loc>${SITE}${r.path}</loc><lastmod>${today}</lastmod></url>`,
).join('\n');
writeFileSync(
  join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
);
// Deliberately NOT `Disallow: /` on a NOINDEX build. Disallow blocks *crawling*, which
// means Googlebot never fetches the page and so never sees the noindex meta tag added
// above — a URL blocked that way can still get indexed from an external link, with no way
// to tell Google to drop it. Allowing the crawl so it reads noindex is what actually keeps
// the preview out of the index. The sitemap line is dropped on a NOINDEX build for the
// same reason it exists on a real one: it's an invitation to index.
writeFileSync(
  join(DIST, 'robots.txt'),
  NOINDEX
    ? `User-agent: *\nAllow: /\n`
    : `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`,
);

// llms.txt (https://llmstxt.org/): an H1, a one-line summary, then linked sections — the
// single-page site's own anchors, so an LLM pointed at this file can jump straight to the
// section it needs instead of having to fetch and parse the whole page.
writeFileSync(
  join(DIST, 'llms.txt'),
  `# ${SITE_TITLE}\n\n> ${SITE_DESCRIPTION}\n\n## Pages\n\n- [Home](${SITE}/): Overview of Qalor's heating-network expertise and services.\n${ROUTES.filter(
    (r) => r.service,
  )
    .map((r) => `- [${r.service}](${SITE}${r.path}): ${r.description}`)
    .join(
      '\n',
    )}\n\n## Sections\n\n- [Ons team](${SITE}/#team): The team and their combined experience in the heating industry.\n- [Qalor](${SITE}/#qalor): What Qalor does and how it approaches energy projects.\n- [Ons werkproces](${SITE}/#how-it-works): The step-by-step process behind every heating-network project.\n- [Projecten](${SITE}/#projects): Completed heating-network projects.\n- [Contact](${SITE}/#footer): Contact details.\n`,
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

// Every route, not just '/': the service pages are a separate render path (App.tsx matches
// the pathname against SERVICE_PAGES), so a mismatch there would go unnoticed by a gate
// that only ever loaded the home page. By this point the loop above has written the real
// files, so `vite preview` serves the actual prerendered output rather than the fallback.
for (const route of ROUTES) {
  await hydrationPage.goto(`${appUrl.replace(/\/$/, '')}${route.path}`, {
    waitUntil: 'networkidle',
  });
  await hydrationPage.waitForTimeout(500);
}

let failed = false;

if (mismatches.length) {
  console.error(
    `✗ page fails to hydrate (React ${[...new Set(mismatches)].join(', ')}) — the prerendered markup is being thrown away`,
  );
  failed = true;
}

// ---- first-paint vs hydrated layout gate ---------------------------------------
/**
 * The hydration gate above only catches React *errors* (418/423/425). A component that
 * decides its layout from `window.innerWidth` throws none of those: React silently patches
 * the styles, the page "hydrates cleanly", and a phone still visibly jumps.
 *
 * That shipped. The Hero read innerWidth during render, so the desktop layout was baked into
 * the prerendered HTML and a phone painted a 4rem heading in a two-column grid before
 * snapping to 3rem in one column — measured at 64px -> 48px, with everything below moving up
 * 145px.
 *
 * So: load each route at a mobile viewport twice — once with JavaScript disabled, which is
 * what actually paints first, and once normally — and require the h1 to be laid out
 * identically. Deliberately narrow: a whole-page geometry diff would trip over Particles'
 * canvas and animation timing, whereas this encodes one precise rule — the prerendered markup
 * must not commit to a layout the client will disagree with.
 */
const PARITY_VIEWPORT = { width: 412, height: 915 };

async function measureH1(url, javaScriptEnabled) {
  const ctx = await browser.newContext({ viewport: PARITY_VIEWPORT, javaScriptEnabled });
  const measurePage = await ctx.newPage();
  await measurePage.goto(url, { waitUntil: 'load' });
  // Let hydration and the Hero's load animation settle before measuring the JS pass.
  if (javaScriptEnabled) await measurePage.waitForTimeout(900);
  const measurement = await measurePage.evaluate(() => {
    const h1 = document.querySelector('h1');
    if (!h1) return null;
    const rect = h1.getBoundingClientRect();
    return {
      fontSize: getComputedStyle(h1).fontSize,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    };
  });
  await ctx.close();
  return measurement;
}

for (const route of ROUTES) {
  const url = `${appUrl.replace(/\/$/, '')}${route.path}`;
  const firstPaint = await measureH1(url, false);
  const hydrated = await measureH1(url, true);
  if (!firstPaint || !hydrated) continue;
  const differs = ['fontSize', 'width', 'height'].filter((k) => firstPaint[k] !== hydrated[k]);
  if (differs.length) {
    console.error(
      `✗ ${route.path} lays out differently once hydrated — the prerendered HTML commits to a` +
        ' layout the client disagrees with, so a visitor sees it jump. Decide it in CSS' +
        ' (a media query) rather than from window.innerWidth.',
    );
    for (const k of differs) {
      console.error(`    h1 ${k}: first paint ${firstPaint[k]} -> hydrated ${hydrated[k]}`);
    }
    failed = true;
  }
}

await browser.close();
stop();

if (failed) {
  console.error('✗ prerender produced problem(s); not publishing this build');
  process.exit(1);
}
console.log(
  `✓ prerendered ${ROUTES.length} routes (${ROUTES.map((r) => r.path).join(' ')}) — hydrates cleanly, sitemap.xml and robots.txt written`,
);
