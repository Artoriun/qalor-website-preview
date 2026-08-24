/**
 * Submits the site's URLs to IndexNow after a deploy.
 *
 * IndexNow is a push notification to a search engine: instead of waiting to be recrawled on
 * whatever schedule the crawler had in mind, the host says "these URLs changed". Bing,
 * Yandex, Seznam, Naver and Yep consume it and act within minutes, and they share
 * submissions with each other, so one request reaches all of them.
 *
 * Google is not among them. It trialled IndexNow in 2021 and never adopted it, and the
 * sitemap ping endpoint it used to offer was retired in 2023 — so at Google the only fast
 * path is Search Console's URL Inspection, which is manual, per-URL and rate-limited.
 * Nothing here can substitute for that; this covers everyone else automatically.
 *
 * The URL list is derived from SERVICE_PAGES, the same array scripts/prerender.mjs builds
 * ROUTES and sitemap.xml from, so a page added there is submitted without a second edit.
 */

import { readFileSync } from 'node:fs';
import { SERVICE_PAGES } from '@qalor/shared';

const SITE = (process.env.SITE_URL ?? 'https://qalor.nl').replace(/\/$/, '');
const KEY = process.env.INDEXNOW_KEY;

if (!KEY) {
  // A missing key is a configuration gap, not a failure: the deploy already happened, and
  // this step is explicitly continue-on-error. Say so plainly rather than throwing.
  console.log('INDEXNOW_KEY is unset — skipping. Set it as an Actions variable to enable.');
  process.exit(0);
}

/**
 * Refuse to submit a build that asks not to be indexed.
 *
 * The preview deployment is built with NOINDEX=1 and every page carries a robots noindex
 * tag; asking a crawler to come and look at it is the exact opposite of what that build is
 * for. Nothing else stops this — the step lives in a deploy job, and a copy of this
 * repository that publishes a preview would inherit it silently.
 *
 * Read from the built artifact rather than from the NOINDEX variable, because the artifact
 * is what was actually uploaded. A build whose env said one thing and whose output says
 * another should be believed on its output.
 */
const built = new URL('../packages/web/dist/index.html', import.meta.url).pathname;
let shell = '';
try {
  shell = readFileSync(built, 'utf8');
} catch {
  console.log(`no build at ${built} — skipping (nothing was published from here)`);
  process.exit(0);
}
if (/<meta[^>]+name=["']robots["'][^>]*noindex/i.test(shell)) {
  console.log('this build is noindexed — not submitting it to IndexNow');
  process.exit(0);
}

const host = new URL(SITE).host;
const urlList = [`${SITE}/`, ...SERVICE_PAGES.map((p) => `${SITE}/${p.slug}/`)];

// The key file has to be fetchable at the site root before a submission is trusted; a ping
// naming a key that 404s is rejected. Checking it here turns that into a clear message
// rather than an opaque 403 from the API.
const keyUrl = `${SITE}/${KEY}.txt`;
const keyRes = await fetch(keyUrl).catch((e) => ({ ok: false, status: e.message }));
if (!keyRes.ok) {
  console.log(`key file not reachable at ${keyUrl} (${keyRes.status}) — skipping submission`);
  process.exit(0);
}
const served = (await keyRes.text()).trim();
if (served !== KEY) {
  console.log(`key file at ${keyUrl} does not contain the key it is named after — skipping`);
  process.exit(0);
}

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key: KEY, keyLocation: keyUrl, urlList }),
});

// 200 accepted, 202 accepted but the key is still being validated. Both are successes.
console.log(`IndexNow ${res.status} ${res.statusText} for ${urlList.length} URLs on ${host}`);
for (const u of urlList) console.log(`  ${u}`);
if (![200, 202].includes(res.status)) {
  console.log(await res.text().catch(() => ''));
}
