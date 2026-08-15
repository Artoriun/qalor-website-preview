import { ASSET_VERSION, DEFAULT_SITE_CONTENT } from '@qalor/shared';
import { expect, test } from './fixtures';

/**
 * Cloudinary URLs must survive the render path intact.
 *
 * This supplies its own URLs rather than inspecting whatever the bundled content happens to
 * hold: an assertion over ambient content silently weakens the day someone edits that content,
 * and passes over an empty list if the section stops rendering at all. Injecting through
 * `window.__CONTENT__` — the same channel the prerenderer uses — covers both branches of
 * optimizeUrl deterministically, with no network and no account.
 *
 * The sibling turbohamstarter suite makes the same check the same way; the difference here is
 * that this site's URLs are bundled without a version, so optimizeUrl has to add one.
 */

const CLOUD = 'https://res.cloudinary.com/o5hr8kjc/image/upload';

/** Bundled content with a raw hero image and an already-versioned About image. */
function contentWithBothUrlShapes() {
  return {
    ...DEFAULT_SITE_CONTENT,
    hero: { ...DEFAULT_SITE_CONTENT.hero, image: `${CLOUD}/qalor/hero.jpg` },
    about: { ...DEFAULT_SITE_CONTENT.about, image: `${CLOUD}/v1234/qalor/about-peterhuub.jpg` },
  };
}

/** Every Cloudinary URL the page asks for, from `src`, `srcset` and the hero's preload link. */
async function renderedCloudinaryUrls(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const found: string[] = [];
    for (const el of document.querySelectorAll('img, link[rel="preload"][as="image"]')) {
      const attrs = [
        el.getAttribute('src') ?? '',
        el.getAttribute('srcset') ?? '',
        el.getAttribute('href') ?? '',
        el.getAttribute('imagesrcset') ?? '',
      ].join(' ');
      // Whole URLs, not a split on commas: the transform itself contains one (`q_auto,w_700`).
      for (const url of attrs.match(/https?:\/\/\S+?(?=\s|$)/g) ?? []) {
        if (url.includes('res.cloudinary.com')) found.push(url);
      }
    }
    return found;
  });
}

test('Cloudinary images are resized and carry exactly one version', async ({ page }) => {
  // Dev only. A prerendered page embeds its own `window.__CONTENT__` inline, which runs after
  // any addInitScript and wins — so on the built targets this would quietly test the bundled
  // content instead of the URLs it means to inject, and the branch assertions below would be
  // asserting something they never set up. The built output's real-content equivalent is the
  // versioned-URL test in layout.spec.ts, which runs on every target.
  test.skip(
    (process.env.E2E_TARGET ?? 'dev') !== 'dev',
    'content injection is overridden by the prerendered page',
  );
  const content = contentWithBothUrlShapes();
  // Both channels, because which one wins depends on the target. `HAS_API` is
  // `import.meta.env.DEV || BASE !== ''`, so against the dev server the provider always
  // refetches and overwrites the seed; against the built output there is no API and the seed
  // is all there is. Stubbing only one of them silently tests the bundled content instead.
  await page.route('**/api/content', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(content) }),
  );
  await page.addInitScript((seed) => {
    window.__CONTENT__ = seed;
  }, content);

  await page.goto('/');
  await page.locator('img').first().waitFor();
  const urls = await renderedCloudinaryUrls(page);

  // Without this the assertions below would pass over an empty list and report success having
  // inspected nothing — the failure mode that makes a check worse than no check.
  expect(urls.length, 'no Cloudinary images rendered — this test checked nothing').toBeGreaterThan(
    0,
  );

  for (const url of urls) {
    expect(url, `${url} was not resized`).toMatch(/\/image\/upload\/[^/]*w_\d+/);
    // Lookahead rather than a consuming match: `/v1/v2/` overlaps on the middle slash, so a
    // `/\/v\d+\//g` count reports 1 for a doubled version — "fine" for the exact bug this is
    // here to catch.
    expect(url.match(/\/v\d+(?=\/)/g) ?? [], `${url} lost or doubled its version`).toHaveLength(1);
  }

  const hero = urls.filter((u) => u.includes('/hero.'));
  const about = urls.filter((u) => u.includes('/about-peterhuub.'));
  expect(hero.length, 'hero image did not render').toBeGreaterThan(0);
  expect(about.length, 'about image did not render').toBeGreaterThan(0);

  // A bundled URL has no version of its own, so it must be given the current one.
  for (const url of hero) {
    expect(url, `${url} should carry ASSET_VERSION`).toContain(`/${ASSET_VERSION}/`);
  }
  // A portal upload arrives already versioned, and that version identifies the actual asset —
  // replacing it with ASSET_VERSION would point at a version of the image that never existed.
  for (const url of about) {
    expect(url, `${url} should keep its own version`).toContain('/v1234/');
  }
});
