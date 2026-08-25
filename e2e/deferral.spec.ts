import { expect, test } from './fixtures';

/**
 * The below-the-fold photos must not be requested during the first load.
 *
 * On a cold mobile visit the hero is the LCP element, and it shares one HTTP/2 connection with
 * every other image because they all live on res.cloudinary.com. Measured on production: 13
 * Cloudinary requests before LCP and an LCP of 7984-8300ms, against 5 requests and 3576-3936ms
 * once .projects-section and #how-it-works skip rendering until they are approached. Priority
 * does not fix it — fetchpriority and preload were both measured and moved less than the
 * run-to-run spread, because a saturated connection has no ordering left to win.
 *
 * Lighthouse cannot defend this. scripts/check-lighthouse.mjs serves the build from localhost,
 * which hands over every image instantly, so the contention it would need to observe does not
 * exist there and the score is identical either way. What is deterministic on localhost is
 * *which* images the page asks for before anyone scrolls, and that is what this measures.
 *
 * The pass criteria are deliberately two-sided. Asserting only that nothing is requested early
 * would be satisfied by a page that never loads the photos at all, so the second half scrolls
 * to the bottom and requires every one of them to arrive and render.
 */

/** A real 1x1 GIF, so a stubbed <img> still decodes and reports naturalWidth > 0. */
const PIXEL_GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

const CLOUDINARY = /res\.cloudinary\.com/;

/**
 * Reads the URLs the deferred sections *would* fetch, from the DOM rather than a hardcoded
 * list — every one of these is admin-editable, so a filename allowlist starts rotting the first
 * time someone uploads through the portal.
 *
 * Attribute reads only. Calling getBoundingClientRect/scrollIntoViewIfNeeded/innerText on
 * anything inside a skipped subtree forces the browser to lay it out, which fetches the very
 * images under test — a version of this that queried geometry first would pass no matter what
 * the CSS said.
 */
async function deferredImageUrls(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const urls = new Set<string>();
    // Matched up to the extension rather than to the next comma or space: optimizeUrl always
    // ends these `.webp`, and the transform in the middle contains a comma of its own
    // (`q_auto,w_750`), so splitting a srcset on commas cuts the URL in half.
    const URL_RE = /https?:\/\/[^\s)"']*?\.webp/g;
    for (const el of document.querySelectorAll('#projects [style*="--card-image"]')) {
      for (const url of (el.getAttribute('style') ?? '').match(URL_RE) ?? []) urls.add(url);
    }
    for (const el of document.querySelectorAll('#how-it-works img')) {
      const attrs = `${el.getAttribute('src') ?? ''} ${el.getAttribute('srcset') ?? ''}`;
      for (const url of attrs.match(URL_RE) ?? []) urls.add(url);
    }
    return [...urls].filter((u) => u.includes('res.cloudinary.com'));
  });
}

test('the below-fold photos wait until they are approached', async ({ page }) => {
  const requested: string[] = [];
  // Stubbed rather than fetched: this is about which requests are made, not what comes back,
  // and a test that reaches a CDN is slower and fails for reasons that are not about the code.
  await page.route(CLOUDINARY, (route) => {
    requested.push(route.request().url());
    return route.fulfill({ status: 200, contentType: 'image/gif', body: PIXEL_GIF });
  });

  await page.goto('./', { waitUntil: 'load' });
  await page.waitForTimeout(1500);

  const beforeScroll = [...requested];
  const deferred = await deferredImageUrls(page);

  // Guards against a page that renders nothing scoring perfectly. The hero has to have been
  // asked for, and the deferred sections have to actually hold photos.
  expect(
    beforeScroll.some((u) => u.includes('hero')),
    'the hero image was never requested — the page under test did not render',
  ).toBe(true);
  expect(deferred.length, 'no deferred image URLs found in the markup').toBeGreaterThanOrEqual(11);

  const early = deferred.filter((u) => beforeScroll.includes(u));
  expect(
    early,
    'requested before any scroll — these share one connection with the hero, see ' +
      'content-visibility on .projects-section / #how-it-works',
  ).toEqual([]);

  // A new photo near the fold should be a decision someone makes, not something nobody is told.
  expect(
    new Set(beforeScroll).size,
    'more Cloudinary images are being requested up front than expected',
  ).toBeLessThanOrEqual(8);

  // ---- the other half: deferred must not mean dropped -------------------------------------
  // A viewport at a time, the way somebody reads the page. Jumping straight to scrollHeight
  // passes over the middle of the document without ever intersecting it, so the step images
  // never load and the check below fails for a reason that has nothing to do with the CSS —
  // which is what happened here at 915x412, where the page is many viewports tall.
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 250));
    }
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(2500);

  // Not "every URL in the markup was fetched": each card carries both a 1x and a 3x candidate
  // and the browser picks one by resolution, so half of them are never meant to be requested.
  // What has to be true is that this section woke up at all, and then that it rendered — the
  // check below is the real one, since a photo that resolves to nothing is the failure worth
  // catching, whichever candidate the browser chose.
  expect(
    new Set(requested).size,
    'scrolling to the bottom requested nothing new — the section never woke up',
  ).toBeGreaterThan(new Set(beforeScroll).size);

  const broken = await page.evaluate(() => {
    const out: string[] = [];
    for (const el of document.querySelectorAll('#projects .project-card')) {
      if (getComputedStyle(el).backgroundImage === 'none') out.push('project-card');
    }
    for (const img of document.querySelectorAll<HTMLImageElement>('#how-it-works img')) {
      if (img.naturalWidth === 0) out.push(img.getAttribute('alt') ?? 'step image');
    }
    return out;
  });
  expect(broken, 'rendered nothing after scrolling — deferred turned into dropped').toEqual([]);
});

test('every image inside a skipped section is lazy', async ({ page }) => {
  // content-visibility does not reach the HTML parser: an <img> without loading="lazy" is
  // fetched before layout ever happens, so skipping the subtree does not defer it. The pairing
  // is the mechanism, and nothing else in the suite would notice it being broken — deleting
  // loading="lazy" from a step image silently restores the problem this all exists to fix.
  await page.goto('./', { waitUntil: 'load' });

  const eager = await page.evaluate(() => {
    const out: string[] = [];
    for (const img of document.querySelectorAll('img')) {
      let el: HTMLElement | null = img;
      while (el) {
        if (getComputedStyle(el).contentVisibility === 'auto') {
          if (img.getAttribute('loading') !== 'lazy') {
            out.push(img.getAttribute('alt') || img.getAttribute('src') || 'unnamed image');
          }
          break;
        }
        el = el.parentElement;
      }
    }
    return out;
  });

  expect(
    eager,
    'inside a content-visibility section but not lazy, so still fetched up front',
  ).toEqual([]);
});
