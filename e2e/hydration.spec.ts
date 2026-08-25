import { expect, test } from './fixtures';

/**
 * The prerendered markup must be adopted, not replaced.
 *
 * main.tsx hydrates when the document carries `data-prerendered` and mounts otherwise.
 * Getting that wrong is silent and expensive: `createRoot` on a container that already has
 * children empties it and builds a fresh tree, so the prerendered page paints, is destroyed
 * and is rebuilt — the Hero's entrance animation replays on a new node, AOS re-initialises
 * and drops five sections back to transparent, and the images decode twice. On a warm cache
 * the rebuild lands inside the Hero's own 500ms animation and is invisible; cold, it reads
 * as the page loading twice. The site shipped that way, through every check.
 *
 * scripts/prerender.mjs watches for React's 418/423/425 during its capture, but that gate
 * can only fire once something actually hydrates — while the app used `createRoot` it was
 * unfalsifiable and passed on every build. These tests are the other half: they assert the
 * outcome in a browser rather than the absence of an error during prerendering.
 */

// Only meaningful against a prerendered target. The dev server has no server-rendered
// markup to adopt, so there is nothing here to check.
test.beforeEach(async ({ page }) => {
  await page.goto('./');
  const prerendered = await page.evaluate(() =>
    document.documentElement.hasAttribute('data-prerendered'),
  );
  test.skip(!prerendered, 'not a prerendered build');
});

test('React adopts the prerendered DOM instead of rebuilding it', async ({ page }) => {
  // Stamp a node before the bundle executes. A property set on a DOM element cannot survive
  // that element being replaced, so this distinguishes adoption from a re-mount in a way
  // that comparing markup cannot — the rebuilt tree looks identical once it settles.
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    if (h1) h1.dataset.stampedBeforeHydration = 'yes';
  });
  await page.waitForLoadState('load');
  await page.waitForTimeout(1500);

  await expect(page.locator('h1')).toHaveAttribute('data-stamped-before-hydration', 'yes');
});

test('hydration reports no React error', async ({ page }) => {
  // 418/423/425 are hydration-only. The e2e fixture already fails a test on any uncaught
  // page error, so this asserts the specific message rather than merely the absence of one,
  // and names it so a future failure explains itself.
  const reactErrors: string[] = [];
  page.on('pageerror', (e) => {
    if (/Minified React error #(418|423|425)/.test(e.message)) reactErrors.push(e.message);
  });

  await page.goto('./', { waitUntil: 'load' });
  await page.waitForTimeout(1500);

  expect(reactErrors, 'the prerendered markup was thrown away').toEqual([]);
});

test('the text the server sent is the text React keeps', async ({ page }, testInfo) => {
  // Only at the viewport the markup was captured at. Elsewhere the comparison is meaningless
  // by design: components legitimately re-render for a narrow screen once mounted, so their
  // text differs from a desktop capture without anything being wrong. The hydration error
  // check above is what covers the other viewports.
  test.skip(testInfo.project.name !== 'desktop', 'markup is captured at the desktop viewport');

  // Adjacent JSX text children are the failure mode this catches. `<strong>IBAN:</strong>
  // {iban}` renders two text nodes, prerendering serialises the DOM where adjacent text
  // merges into one, and React then looks for a node the markup no longer has. It is
  // invisible in the rendered output and fatal to hydration, so compare node by node.
  const textNodes = () =>
    page.evaluate(() => {
      const out: string[] = [];
      const w = document.createTreeWalker(
        document.getElementById('root') as Node,
        NodeFilter.SHOW_TEXT,
      );
      while (w.nextNode()) out.push(w.currentNode.nodeValue ?? '');
      return out;
    });

  // JS blocked, so this is exactly what the host served.
  await page.route('**/assets/*.js', (r) => r.abort());
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  const server = await textNodes();
  await page.unroute('**/assets/*.js');

  await page.goto('./', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const client = await textNodes();

  expect(client, 'text nodes differ between the served markup and React').toEqual(server);
});
