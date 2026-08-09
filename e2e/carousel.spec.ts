import { expect, type Page, test } from '@playwright/test';

/**
 * The shared carousel (packages/web/src/components/Carousel/Carousel.tsx), exercised through
 * the Projecten section.
 *
 * Asserting on the track's transform rather than on which card looks centred: the track is
 * moved by a single translateX, so that value *is* the carousel's position, and reading it
 * avoids depending on image loading or on where a given project happens to sit.
 */
const TRACK = '#projects .carousel-track';
const FRAME = '#projects .carousel-frame';

async function translateX(page: Page) {
  const matrix = await page.locator(TRACK).evaluate((el) => getComputedStyle(el).transform);
  if (matrix === 'none') return 0;
  // matrix(a, b, c, d, tx, ty)
  return Number.parseFloat(matrix.split(',')[4]);
}

/** Stops autoplay so a measurement can't be overtaken by the timer mid-assertion. */
async function pause(page: Page) {
  await page
    .getByRole('region', { name: 'Projecten' })
    .getByRole('button', { name: /pauzeren/i })
    .click();
}

async function drag(page: Page, dx: number) {
  const box = await page.locator(FRAME).boundingBox();
  if (!box) throw new Error('carousel frame has no box');
  const y = box.y + box.height / 2;
  const startX = box.x + box.width / 2;
  await page.mouse.move(startX, y);
  await page.mouse.down();
  // Several moves, not one jump: the drag only engages after DRAG_INTENT pixels of mostly
  // horizontal movement, and a single large move can be coalesced into one event.
  for (let i = 1; i <= 5; i++) await page.mouse.move(startX + (dx * i) / 5, y);
  await page.mouse.up();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.locator(FRAME).scrollIntoViewIfNeeded();
  await pause(page);
  // Let any in-flight slide transition finish before a test reads the transform. Autoplay
  // can fire between load and the click above, and reading translateX mid-animation gives a
  // value that keeps changing on its own — which showed up as flakiness under parallel
  // workers rather than as a consistent failure.
  await page.waitForTimeout(700);
});

test('dragging past the threshold moves to the next slide', async ({ page }) => {
  const before = await translateX(page);
  await drag(page, -150);
  await page.waitForTimeout(700);
  // Next slide means the track has moved further left, i.e. more negative.
  expect(await translateX(page)).toBeLessThan(before);
});

test('a drag under the threshold snaps back without changing slide', async ({ page }) => {
  const before = await translateX(page);
  await drag(page, -20);
  await page.waitForTimeout(700);
  expect(await translateX(page)).toBeCloseTo(before, 0);
});

test('a long drag does not produce horizontal page overflow', async ({ page }) => {
  await drag(page, -900);
  await page.waitForTimeout(700);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('the pause button stops the carousel advancing', async ({ page }) => {
  // beforeEach already paused it. Projecten autoplays every 5s, so this window would cover
  // two advances if the pause were not working.
  const before = await translateX(page);
  await page.waitForTimeout(6000);
  expect(await translateX(page)).toBeCloseTo(before, 0);

  // And pressing it again resumes — otherwise this test would still pass on a carousel that
  // simply never advanced at all.
  await page
    .getByRole('region', { name: 'Projecten' })
    .getByRole('button', { name: /doorgaan/i })
    .click();
  // Move the pointer off the carousel first: hovering pauses it (WCAG 2.2.2 again), so
  // leaving the mouse where the button was would keep it paused and this assertion would
  // fail for the wrong reason.
  await page.mouse.move(0, 0);
  await page.waitForTimeout(6500);
  expect(await translateX(page)).not.toBeCloseTo(before, 0);
});

test('the arrow keys move the carousel', async ({ page }) => {
  const before = await translateX(page);
  await page.locator(FRAME).focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(700);
  expect(await translateX(page)).toBeLessThan(before);
});

test('a press that wanders but never commits still counts as a click', async ({ page }) => {
  // The gesture that broke opening a CV on a phone: a press that moves past the drag-intent
  // threshold but nowhere near the commit threshold. That is a tap as far as the visitor is
  // concerned, and its click used to be swallowed along with a real drag's — so a slide had
  // to be pressed twice. Exercised on the Projecten carousel via its own slide click, since
  // the mechanism lives in the shared component.
  await page.locator(FRAME).evaluate((el) => {
    (el as HTMLElement).dataset.clicks = '0';
    el.addEventListener('click', () => {
      const n = Number((el as HTMLElement).dataset.clicks ?? '0');
      (el as HTMLElement).dataset.clicks = String(n + 1);
    });
  });
  await drag(page, -20);
  await page.waitForTimeout(400);
  expect(await page.locator(FRAME).getAttribute('data-clicks')).toBe('1');
});

test.describe('on a touch device', () => {
  // Only the touch-related context options, not a whole device preset: a preset also carries
  // defaultBrowserType, which Playwright refuses to change inside a describe. isMobile is
  // what flips the emulated pointer to coarse, which is what lib/pdf.ts reads.
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 412, height: 915 } });

  test('the CV opens directly instead of in an embedded viewer', async ({ page, context }) => {
    // Chrome on Android will not render a PDF inside an iframe — it replaces the frame with
    // its own "Open" prompt — so the modal is deliberately skipped there and the file is
    // handed to the browser instead. See canEmbedPdf() in lib/pdf.ts.
    await page.goto('/');
    await page.locator('#team .carousel-frame').scrollIntoViewIfNeeded();
    await page
      .getByRole('region', { name: 'Teamleden' })
      .getByRole('button', { name: /pauzeren/i })
      .click();
    await page.waitForTimeout(700);

    const cv = page.locator('#team .carousel-slide:not([inert]) .team-cv-button').first();
    // A real link, so it works even with JavaScript mid-flight.
    await expect(cv).toHaveAttribute('href', /\/documents\/.*\.pdf$/);

    const popup = context.waitForEvent('page', { timeout: 5000 }).catch(() => null);
    await cv.click({ force: true });
    await page.waitForTimeout(800);
    expect(await page.locator('.pdf-modal-container').count()).toBe(0);
    expect(await popup).not.toBeNull();
  });
});
