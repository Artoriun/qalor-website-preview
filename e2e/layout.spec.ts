import { expect, test } from './fixtures';

/**
 * Layout assertions, not feature tests — the class of regression a human only notices on
 * the wrong device: content overflowing sideways, elements rendering past the footer, a
 * carousel that traps the page in a horizontal scrollbar. The project matrix (see
 * playwright.config.ts) is viewports rather than browsers for the same reason.
 *
 * The site is a single page (qalor.nl has no client-side routing — see the migration
 * plan for why react-router-dom got dropped), so every test here just targets '/'.
 */

test('has no horizontal overflow', async ({ page }) => {
  await page.goto('/');
  // scrollWidth beyond clientWidth is the definition of a sideways scrollbar. +1 for
  // sub-pixel rounding, which is not a real overflow.
  const overflows = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 1;
  });
  expect(overflows, 'page scrolls horizontally').toBe(false);
});

test('has exactly one h1', async ({ page }) => {
  await page.goto('/');
  // Hero's h1 is the only one; About/Team/etc use h2/h3 for their headings.
  await expect(page.locator('h1')).toHaveCount(1);
});

test('renders nothing below the footer', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('#footer');
  await expect(footer).toBeVisible();
  const stray = await page.evaluate(() => {
    const footerEl = document.querySelector('#footer');
    if (!footerEl) return 0;
    const bottom = footerEl.getBoundingClientRect().bottom + window.scrollY;
    return [...document.body.querySelectorAll('*')].filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      return r.top + window.scrollY > bottom + 1;
    }).length;
  });
  expect(stray, 'content renders past the footer').toBe(0);
});

test('the mobile hamburger menu opens and its links are reachable', async ({ page }) => {
  await page.goto('/');
  const hamburger = page.locator('.navbar-hamburger');
  // Desktop viewports hide the hamburger via CSS; only meaningful where it's actually shown.
  test.skip(!(await hamburger.isVisible()), 'hamburger not shown at this viewport');

  await hamburger.click();
  // Scoped to the open menu — Footer has its own "Ons team"/"Projecten" nav links, so an
  // unscoped locator matches both once Footer is no longer lazy-loaded.
  const menu = page.locator('.navbar-mobile-menu');
  await expect(menu.getByRole('button', { name: 'Ons team' })).toBeVisible();
  await expect(menu.getByRole('button', { name: 'Projecten' })).toBeVisible();
});

test('opening a team member CV and closing it with Escape works', async ({ page }) => {
  await page.goto('/');
  // Stop the carousel first: it auto-advances, so a CV button is a moving target and
  // Playwright will wait forever for one to be "stable". This is also the cheapest possible
  // proof that the pause control does what it says.
  const team = page.getByRole('region', { name: 'Teamleden' });
  await team.getByRole('button', { name: /pauzeren/i }).click();

  // The track renders three copies of the slides so the infinite wrap has somewhere to go;
  // only the middle copy is real, the outer two are `inert` duplicates (see Carousel.tsx).
  // Scoping to :not([inert]) targets a button that is actually reachable rather than a
  // clipped copy outside the frame.
  const cvButton = team.locator('.carousel-slide:not([inert]) .team-cv-button').first();
  await cvButton.waitFor({ state: 'visible', timeout: 15_000 });
  await cvButton.click();

  // The PDF renders inside an <iframe>, handed to the browser's own viewer — which headless
  // Chromium doesn't ship, so whether a page actually paints in there isn't observable from
  // this suite and has to be checked on a real browser. What's worth asserting is the part
  // this app controls: the modal opens, the iframe points at the right file, and the
  // fallback link — the only route through on a browser that won't render a PDF inline, see
  // TeamPdfModal.tsx — points at that same file rather than silently drifting from it.
  await expect(page.locator('.pdf-modal-container')).toBeVisible();
  const frame = page.locator('iframe.pdf-modal-frame');
  await expect(frame).toHaveAttribute('src', /\/documents\/.*\.pdf$/);
  const src = await frame.getAttribute('src');
  await expect(page.locator('.pdf-modal-open')).toHaveAttribute('href', src ?? '');

  await page.keyboard.press('Escape');
  await expect(page.locator('.pdf-modal-container')).toBeHidden();
});

// Two assertions that each encode a bug found by hand on a phone in landscape. Both are
// geometry, not appearance — cheap and deterministic, unlike a screenshot baseline.
test('the Qalor section stacks rather than sitting side by side on a short viewport', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-landscape', 'short-viewport behaviour');
  await page.goto('/');
  // A phone in landscape is ~915x412 — wide enough to have been treated as a tablet, so it
  // got the side-by-side grid and a 380px image inside a 412px-tall viewport.
  const stacked = await page.locator('#qalor').evaluate((section) => {
    const img = section.querySelector('img');
    const heading = section.querySelector('h3');
    if (!img || !heading) return null;
    const imgRect = img.getBoundingClientRect();
    const textRect = heading.getBoundingClientRect();
    // Compared horizontally, not vertically: in a two-column grid the text column is taller
    // than the image, so "do their vertical ranges overlap" answers yes for both layouts
    // depending on which block you pick. Columns share a horizontal band only when stacked.
    return Math.min(imgRect.right, textRect.right) - Math.max(imgRect.left, textRect.left) > 0;
  });
  expect(stacked, 'the image should sit below the text, not beside it').toBe(true);
});

test('the Werkproces steps are centred on a short viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-landscape', 'short-viewport behaviour');
  await page.goto('/');
  const offset = await page.locator('#how-it-works').evaluate((section) => {
    const rect = section.getBoundingClientRect();
    const badges = [...section.querySelectorAll('div')]
      .filter((d) => /^\d\d$/.test(d.textContent?.trim() ?? ''))
      .map((d) => d.getBoundingClientRect());
    const titles = [...section.querySelectorAll('h3')].map((h) => h.getBoundingClientRect());
    if (!badges.length || !titles.length) return null;
    const left = Math.min(...badges.map((b) => b.left));
    const right = Math.max(...titles.map((t) => t.right));
    return Math.abs((left + right) / 2 - (rect.left + rect.right) / 2);
  });
  // Was ~58px off: the content column is capped at 500px but the group around it was 700px
  // wide, so `margin: 0 auto` centred a container whose content sat against its left edge.
  expect(offset, 'step group is not centred in its section').toBeLessThanOrEqual(2);
});

test('the header logo returns to its resting size after a press', async ({ page }) => {
  await page.goto('/');
  const logo = page.locator('nav img[alt="Qalor Logo"]');
  await logo.click();
  // The press animation scales to 1.3 and back. It used to never come back: the reset ran in
  // a setTimeout that read `e.currentTarget`, which React has already cleared by then, so it
  // threw and the logo stayed enlarged. A mouse hid this — onMouseLeave reset the scale on
  // the way out — so it only showed up on a phone. The page-error fixture catches the throw;
  // this catches the visible symptom, and neither is any use without a test that actually
  // presses the logo.
  await expect
    .poll(() => logo.evaluate((el) => (el as HTMLElement).style.transform), { timeout: 3000 })
    .toBe('scale(1)');
});

/**
 * The same property as e2e/images.spec.ts, but against the real bundled content rather than
 * injected URLs: that one proves optimizeUrl behaves, this one proves what the site actually
 * ships is versioned — the case where someone hand-adds an unversioned URL to @qalor/shared.
 */
test('every Cloudinary image is requested at a versioned URL', async ({ page }) => {
  await page.goto('/');
  const { bad, seen } = await page.evaluate(() => {
    const bad: string[] = [];
    let seen = 0;
    // Includes the hero's preload link, not just <img>: scripts/prerender.mjs builds that URL
    // itself, so it can drift from optimizeUrl() — and a preload that disagrees with the
    // <img> downloads the hero twice instead of getting a head start on it.
    const sources = document.querySelectorAll('img, link[rel="preload"][as="image"]');
    for (const img of sources) {
      const attrs = [
        img.getAttribute('src') ?? '',
        img.getAttribute('srcset') ?? '',
        img.getAttribute('href') ?? '',
        img.getAttribute('imagesrcset') ?? '',
      ].join(' ');
      // Match whole URLs rather than splitting the srcset on commas: the transformation
      // itself contains one (`q_auto,w_700`), so a naive split cuts every URL in half and
      // the test fails on its own parsing.
      for (const candidate of attrs.match(/https?:\/\/\S+?(?=\s|$)/g) ?? []) {
        if (!candidate.includes('/image/upload/')) continue;
        seen++;
        if (!/\/v\d+\//.test(candidate)) bad.push(candidate);
      }
    }
    return { bad, seen };
  });
  // Nothing to inspect would otherwise read as success: this assertion is about what the
  // page really requests, so an empty page passes it vacuously.
  expect(seen, 'no Cloudinary images on the page — this test checked nothing').toBeGreaterThan(0);
  // Without a version the path is identical before and after an image is replaced, so
  // browsers keep serving the old bytes for the full year these are cached for — the CDN
  // invalidation on upload does nothing for anyone who already loaded the page.
  expect(bad, 'unversioned Cloudinary URLs').toEqual([]);
});
