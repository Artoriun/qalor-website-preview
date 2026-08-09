import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function assertNoViolations(page: Page, include?: string) {
  const builder = new AxeBuilder({ page }).withTags(AXE_TAGS);
  if (include) builder.include(include);
  const { violations } = await builder.analyze();
  // Named rather than counted, so a failure says what broke and where instead of
  // "expected 0, got 1".
  expect(
    violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([]);
}

// Flips the header's ThemeToggle switch rather than pre-seeding localStorage: this is the
// same path a real visitor uses, so it also exercises the toggle's own contrast/aria-pressed
// state as part of every dark-mode sweep, not just the token swap underneath it.
async function switchToDarkMode(page: Page) {
  await page.getByRole('button', { name: 'Schakel naar donkere modus' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  // body's background-color/color transition over 0.2s (see index.css) — without this,
  // axe can sample mid-fade, where a color briefly sits between its light and dark values
  // and reads as lower contrast than either settled state actually is.
  await page.waitForTimeout(250);
}

/**
 * Accessibility, checked in the browser rather than only in the Lighthouse run —
 * Lighthouse audits one page at one width; this runs at every viewport in the matrix
 * (see playwright.config.ts), which is where a viewport-specific violation would live
 * (e.g. the mobile hamburger menu, which desktop never renders at all).
 */
test('the home page has no accessibility violations', async ({ page }) => {
  await page.goto('/');
  // Give the below-the-fold lazy sections (Team/About/WorkProcess/Projects/Footer) time
  // to resolve and mount before the sweep, so the audit covers the whole page.
  await page.waitForSelector('#footer');
  await assertNoViolations(page);
});

test('the home page has no accessibility violations in dark mode', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('#footer');
  await switchToDarkMode(page);
  await assertNoViolations(page);
});

test('the mobile dropdown menu has no accessibility violations', async ({ page }) => {
  await page.goto('/');
  const hamburger = page.locator('.navbar-hamburger');
  // Only rendered/shown at narrow viewports — nothing to open at desktop width.
  test.skip(!(await hamburger.isVisible()), 'hamburger not shown at this viewport');

  await hamburger.click();
  await expect(page.locator('.navbar-mobile-menu')).toBeVisible();

  // Scoped to the open menu rather than the whole page: this test exists specifically
  // because the menu only exists in the DOM once opened, so the sweep above — which
  // never opens it — structurally cannot see anything inside it. A real violation lived
  // here (the "Contact" link's color) undetected until this was added.
  await assertNoViolations(page, '.navbar-mobile-menu');
});

// The admin API isn't part of this suite's webServer (see playwright.config.ts), so
// there's no session to log in with here — this covers the sign-in screen itself, which is
// still real coverage: it's the one admin screen every visitor who finds /admin actually
// reaches, using the same reused <Navbar/> header as the rest of the portal.
test('the admin sign-in screen has no accessibility violations', async ({ page }) => {
  await page.goto('/admin');
  await page.waitForSelector('#password');
  await assertNoViolations(page);
});

test('the admin sign-in screen has no accessibility violations in dark mode', async ({ page }) => {
  await page.goto('/admin');
  await page.waitForSelector('#password');
  await switchToDarkMode(page);
  await assertNoViolations(page);
});

// One representative service landing page (see SERVICE_PAGES in @qalor/shared). These share
// a single component and stylesheet, so a violation on one is a violation on all four —
// sweeping every one of them would quadruple the runtime for the same finding. Picked the
// longest page, since it has the most blocks and therefore the most heading levels.
test('a service landing page has no accessibility violations', async ({ page }) => {
  await page.goto('/warmtenet-business-case');
  await page.waitForSelector('#footer');
  await assertNoViolations(page);
});

test('a service landing page has no accessibility violations in dark mode', async ({ page }) => {
  await page.goto('/warmtenet-business-case');
  await page.waitForSelector('#footer');
  await switchToDarkMode(page);
  await assertNoViolations(page);
});
