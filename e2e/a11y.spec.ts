import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/**
 * Waits for anything still moving, so contrast is measured on settled colour.
 *
 * The dark-mode helper below already knew about this and slept 250ms for it. The light-mode
 * sweeps did not, and axe 4.13 caught the hero's contact button mid-fade — reporting a
 * contrast failure on `#2b1400` over `#fff`, which is about 15:1 once it has arrived. Waiting
 * on the animations themselves is both more reliable than a fixed sleep and faster.
 *
 * Infinite animations are skipped: a decorative loop has no finished state, so awaiting one
 * waits forever rather than settling.
 */
async function animationsSettled(page: Page) {
  await page.evaluate(async () => {
    const settling = Promise.all(
      document
        .getAnimations()
        // Only what is actually going somewhere. A decorative loop has no finished state, and
        // a paused animation's promise never resolves either — the CV modal has one, and
        // awaiting it hung the sweep for the full test timeout instead of reporting anything.
        .filter(
          (a) =>
            a.playState === 'running' &&
            a.effect?.getTiming().iterations !== Number.POSITIVE_INFINITY,
        )
        .map((a) => a.finished.catch(() => {})),
    );
    // A ceiling regardless, so this can never be the reason a run hangs. Anything still
    // moving after two seconds is not a transition axe is about to misread.
    await Promise.race([settling, new Promise((resolve) => setTimeout(resolve, 2000))]);
  });
}

async function assertNoViolations(page: Page, include?: string) {
  await animationsSettled(page);
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
/**
 * The portal behind the sign-in, which nothing swept until a duplicate-id bug shipped.
 *
 * Every field's DOM id was the field key alone, so all four team members had an input with
 * id="photoUrl". A label resolves htmlFor against the first match in the document, so tapping
 * "Bestand kiezen" on a newly added member opened the *first* member's file picker, scrolled
 * the page up to it, and uploaded the photo onto the wrong person.
 *
 * axe does not catch this: duplicate-id-active was removed in axe-core 4.10, and this suite is
 * on 4.13. The sweeps below are still worth having — nothing had ever audited the portal — but
 * the duplicate ids need their own assertion, which is the test after them.
 *
 * The gate is a plain localStorage read, so a token that never leaves the browser is enough to
 * render the portal — the server checks properly on every request it makes.
 */
async function openPortal(page: Page, tab: string) {
  await page.addInitScript(() => localStorage.setItem('admin_token', 'e2e-not-verified-here'));
  await page.goto('/admin');
  // Scoped to the tab strip: the navbar behind the portal has buttons with the same words.
  await page.locator('.admin-tab', { hasText: new RegExp(`^${tab}$`) }).click();
}

test('the admin team editor has no accessibility violations', async ({ page }) => {
  await openPortal(page, 'Team');
  await expect(page.locator('.admin-card').first()).toBeVisible();
  await assertNoViolations(page);
});

test('the admin projects editor has no accessibility violations', async ({ page }) => {
  // A second list, because the ids are built per item and per list — one list passing does not
  // prove the scheme holds where two lists render the same field keys.
  await openPortal(page, 'Projecten');
  await expect(page.locator('.admin-card').first()).toBeVisible();
  await assertNoViolations(page);
});

/**
 * Ids have to be unique, and no accessibility rule available here enforces it any more.
 *
 * This is the guard for the bug above: a repeated id makes every htmlFor in the list point at
 * the first match, so a control silently operates on someone else's row.
 */
for (const tab of ['Team', 'Projecten', 'Werkproces'] as const) {
  test(`the ${tab} editor gives every field its own id`, async ({ page }) => {
    await openPortal(page, tab);
    await expect(page.locator('.admin-card').first()).toBeVisible();

    const duplicates = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
      return [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
    });
    expect(duplicates, 'these ids appear more than once on the page').toEqual([]);
  });
}

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

// Overlays were never swept. The CV modal shipped with a 4.27:1 contrast failure on its
// fallback link — --accent-text-body is tuned against --bg-page (4.51:1) and measures 4.27:1
// on --bg-section — which was found by running axe against the open modal by hand, not by
// this suite. Anything that covers the page deserves the same scan the page gets.
async function openCvModal(page: Page) {
  await page.goto('/');
  const team = page.getByRole('region', { name: 'Teamleden' });
  // Pause first: the carousel auto-advances, so a CV control is otherwise a moving target.
  await team.getByRole('button', { name: /pauzeren/i }).click();
  const cv = team.locator('.carousel-slide:not([inert]) .team-cv-button').first();
  await cv.waitFor({ state: 'visible', timeout: 15_000 });
  await cv.click();
  await expect(page.locator('.pdf-modal-container')).toBeVisible();
}

test('the CV modal has no accessibility violations', async ({ page }) => {
  await openCvModal(page);
  await assertNoViolations(page, '.pdf-modal-container');
});

test('the CV modal has no accessibility violations in dark mode', async ({ page }) => {
  await page.goto('/');
  await switchToDarkMode(page);
  await openCvModal(page);
  await assertNoViolations(page, '.pdf-modal-container');
});
