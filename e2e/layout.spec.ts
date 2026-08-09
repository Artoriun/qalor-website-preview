import { expect, test } from '@playwright/test';

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
