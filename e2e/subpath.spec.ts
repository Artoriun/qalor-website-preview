import { expect, test } from './fixtures';

/**
 * The site built for a project subpath, as the GitHub Pages preview is served
 * (`E2E_TARGET=subpath`, see playwright.config.ts).
 *
 * This variant is where three separate bugs lived, all of them invisible to a suite that
 * only ever ran against the dev server at the domain root:
 *
 * - /admin 404'd, because the route check compared `pathname` to a hardcoded '/admin' and
 *   nothing served an SPA fallback;
 * - prerendering crashed inlining the stylesheet, because the href was base-prefixed but the
 *   file on disk is not;
 * - the service pages' "Bekijk ons volledige werkproces" link was `/#how-it-works`, which
 *   under a subpath resolves to github.io's own root and leaves the site entirely.
 *
 * Paths below are relative on purpose: baseURL already carries the base path, and a leading
 * slash would discard it — which is the very mistake being tested for.
 */

const BASE_PATH = process.env.VITE_BASE ?? '/qalor-website-preview/';

test('the home page boots under the base path', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('#footer')).toBeVisible();
});

test('a service landing page boots under the base path', async ({ page }) => {
  await page.goto('./warmtenet-tekening/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Warmtenet tekening');
});

test('the admin sign-in boots under the base path', async ({ page }) => {
  // Served via 404.html by the host, which is why this is a real assertion and not a
  // formality — without that fallback the host answers with its own error page and the app
  // never boots at all.
  await page.goto('./admin');
  await expect(page.locator('#password')).toBeVisible();
});

test('no link or asset escapes the base path', async ({ page }) => {
  const escapes: string[] = [];

  for (const path of ['./', './warmtenet-tekening/']) {
    await page.goto(path);
    await expect(page.locator('#footer')).toBeVisible();

    escapes.push(
      ...(await page.evaluate((base) => {
        const bad: string[] = [];
        const check = (value: string | null, what: string) => {
          // Only root-absolute values can escape; relative ones resolve against the current
          // directory and protocol-absolute ones are deliberate off-site links.
          if (!value?.startsWith('/')) return;
          if (!value.startsWith(base)) bad.push(`${what}: ${value}`);
        };
        for (const a of document.querySelectorAll('a[href]')) {
          check(a.getAttribute('href'), 'link');
        }
        for (const el of document.querySelectorAll('script[src], link[href], img[src]')) {
          check(el.getAttribute('src') || el.getAttribute('href'), el.tagName.toLowerCase());
        }
        return bad;
      }, BASE_PATH)),
    );
  }

  expect(escapes, `these resolve outside ${BASE_PATH}`).toEqual([]);
});

test('the service page link returns to the home page, not off the site', async ({ page }) => {
  await page.goto('./warmtenet-ontwerp/');
  await page.getByRole('link', { name: /volledige werkproces/i }).click();
  await page.waitForURL(`**${BASE_PATH}#how-it-works`);
  await expect(page.getByRole('heading', { name: 'Ons werkproces' })).toBeVisible();
});
