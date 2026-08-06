import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

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

  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  // Named rather than counted, so a failure says what broke and where instead of
  // "expected 0, got 1".
  expect(
    violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([]);
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
  const { violations } = await new AxeBuilder({ page })
    .include('.navbar-mobile-menu')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  expect(
    violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([]);
});
