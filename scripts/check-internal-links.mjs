/**
 * Every landing page must be reachable by a real link from the built site.
 *
 * All four service pages shipped orphaned: nothing on qalor.nl linked to
 * /warmtenet-tekening/, /warmtenet-ontwerp/, /warmtenetberekening/ or
 * /warmtenet-business-case/. They were reachable only from sitemap.xml. The slugs did appear
 * in the JS bundle, but that is App.tsx matching `pathname` against SERVICE_PAGES — routing,
 * not a link — which is exactly why the gap survived review.
 *
 * A page nothing links to collects almost no internal link equity and reads to a crawler as
 * unimportant, which is a sufficient explanation on its own for a page-two ranking.
 *
 * Standalone rather than folded into prerender.mjs: this runs in milliseconds against a dist
 * that already exists, so it can be proven by breaking one file, instead of costing a full
 * rebuild per attempt.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SERVICE_PAGES } from '../packages/shared/src/index.ts';

const DIST = process.env.DIST ?? 'packages/web/dist';
const BASE = process.env.VITE_BASE ?? '/';

const read = (p) => {
  try {
    return readFileSync(join(DIST, p), 'utf8');
  } catch {
    return null;
  }
};

/** Hrefs in a document, normalised to a leading-slash path so BASE does not matter. */
function hrefs(html) {
  return [...html.matchAll(/href="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((h) => !/^(https?:|mailto:|tel:|#)/.test(h))
    .map((h) => `/${h.replace(BASE, '').replace(/^\//, '')}`);
}

const problems = [];
const home = read('index.html');
if (!home) {
  console.error(`✗ no built home page at ${join(DIST, 'index.html')} — build and prerender first`);
  process.exit(1);
}
const homeLinks = hrefs(home);

for (const page of SERVICE_PAGES) {
  const want = `/${page.slug}/`;
  if (!homeLinks.includes(want)) {
    problems.push(`the home page does not link to ${want}`);
  }
  const doc = read(join(page.slug, 'index.html'));
  if (!doc) {
    problems.push(`${want} was never prerendered`);
    continue;
  }
  // Each landing page should reach at least one sibling, so the set is crawlable as a group
  // rather than as four dead ends that only point back up to the home page.
  const siblings = SERVICE_PAGES.filter((p) => p.slug !== page.slug).map((p) => `/${p.slug}/`);
  const links = hrefs(doc);
  if (!siblings.some((s) => links.includes(s))) {
    problems.push(`${want} links to no other landing page`);
  }
}

if (problems.length) {
  console.error('✗ landing pages are not properly linked:');
  for (const p of problems) console.error(`    ${p}`);
  console.error(
    '\n  A page reachable only from sitemap.xml is orphaned. Link it from the home page and\n' +
      '  from its siblings — see section 1 of SEO.md.',
  );
  process.exit(1);
}
console.log(
  `✓ all ${SERVICE_PAGES.length} landing pages are linked from the home page and to each other`,
);
