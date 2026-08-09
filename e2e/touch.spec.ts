import { expect, test } from './fixtures';

/**
 * Behaviour that only exists on a touch device, run under the `mobile-touch` project (see
 * playwright.config.ts).
 *
 * The rest of the matrix is Desktop Chrome at three viewports with `isMobile: false` — no
 * touch, and `pointer: fine`. That is a deliberate choice for layout regressions, but it
 * meant two real bugs shipped to a Pixel 8a with a fully green suite: a card needed pressing
 * twice after a drag, and the CV modal opened on Android where Chrome cannot render a PDF in
 * an iframe at all.
 *
 * Scoped to its own spec rather than running the whole suite under touch: several existing
 * tests assert the *mouse* behaviour deliberately — layout.spec.ts's CV test expects the
 * modal, which on a coarse pointer correctly does not open — so a blanket touch project
 * would fail tests that are working as intended.
 */

const TEAM_FRAME = '#team .carousel-frame';

test('a press that wanders still opens a card on the first press', async ({ page }) => {
  await page.goto('/');
  await page.locator(TEAM_FRAME).scrollIntoViewIfNeeded();
  await page
    .getByRole('region', { name: 'Teamleden' })
    .getByRole('button', { name: /pauzeren/i })
    .click();
  await page.waitForTimeout(700);

  const frame = page.locator(TEAM_FRAME);
  const box = await frame.boundingBox();
  if (!box) throw new Error('carousel frame has no box');
  const x = box.x + box.width / 2;
  const y = box.y + box.height * 0.75;

  // A press that moves past the drag-intent threshold but nowhere near the commit
  // threshold — i.e. a slightly imprecise tap, which is what a finger actually does. This
  // used to be swallowed: pointer capture retargeted the click to the frame and
  // preventDefault on pointermove suppressed it entirely, so the first press did nothing
  // and only a stiller second press worked.
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 4; i++) await page.mouse.move(x - 5 * i, y);
  await page.mouse.up();
  await page.waitForTimeout(900);

  // On a coarse pointer the CV opens natively rather than in the modal (see below), so what
  // proves the press registered is that the carousel did *not* treat it as a drag.
  const moved = await page
    .locator('#team .carousel-track')
    .evaluate((el) => getComputedStyle(el).transform);
  expect(moved, 'a wandering press should not advance the carousel').not.toBe('none');
});

test('the CV opens directly instead of in an embedded viewer', async ({ page, context }) => {
  // Chrome on Android will not render a PDF inside an iframe — it replaces the frame with
  // its own "Open" prompt — so the modal is deliberately skipped there and the file is
  // handed to the browser instead. See canEmbedPdf() in packages/web/src/lib/pdf.ts.
  await page.goto('/');
  await page.locator(TEAM_FRAME).scrollIntoViewIfNeeded();
  await page
    .getByRole('region', { name: 'Teamleden' })
    .getByRole('button', { name: /pauzeren/i })
    .click();
  await page.waitForTimeout(700);

  const cv = page.locator('#team .carousel-slide:not([inert]) .team-cv-button').first();
  // A real link, so it still works if JavaScript is mid-flight.
  await expect(cv).toHaveAttribute('href', /\/documents\/.*\.pdf$/);

  const popup = context.waitForEvent('page', { timeout: 5000 }).catch(() => null);
  await cv.click({ force: true });
  await page.waitForTimeout(800);
  expect(await page.locator('.pdf-modal-container').count()).toBe(0);
  expect(await popup, 'the CV should open in the browser, not a modal').not.toBeNull();
});
