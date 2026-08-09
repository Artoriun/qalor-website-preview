import { defineConfig, devices } from '@playwright/test';

// The regressions a site like this actually suffers are layout ones at specific
// viewports — content overflowing sideways, elements past the footer, a nav that only
// breaks at one width. So the matrix is viewports rather than browsers.
//
// E2E_TARGET picks what the suite runs against:
//
//   dev     (default) the Vite dev server, as before
//   dist    the built + prerendered output, served like the real host
//   subpath the same, built for the GitHub Pages project subpath
//
// The last two exist because the dev server has no prerendered HTML and no base path, so an
// entire class of bug is invisible to a suite that only ever sees it: the Hero painting a
// desktop layout and snapping to mobile after hydration, /admin 404ing under a subpath, a
// link that navigated off the site. All of those shipped with this suite green.
const PORT = Number(process.env.WEB_PORT ?? 3210);
const TARGET = process.env.E2E_TARGET ?? 'dev';
const BASE_PATH = TARGET === 'subpath' ? (process.env.VITE_BASE ?? '/qalor-website-preview/') : '/';
const BASE_URL = `http://localhost:${PORT}${BASE_PATH}`;

// touch.spec.ts runs only under `mobile-touch`, and subpath.spec.ts only against a subpath
// build; neither belongs in the ordinary viewport projects.
const SPECIAL = ['**/touch.spec.ts', '**/subpath.spec.ts'];

const viewportProjects = [
  {
    name: 'desktop',
    use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    testIgnore: SPECIAL,
  },
  {
    name: 'mobile-portrait',
    use: { ...devices['Desktop Chrome'], viewport: { width: 412, height: 915 }, isMobile: false },
    testIgnore: SPECIAL,
  },
  {
    name: 'mobile-landscape',
    use: { ...devices['Desktop Chrome'], viewport: { width: 915, height: 412 }, isMobile: false },
    testIgnore: SPECIAL,
  },
  {
    // The only project with real touch. The three above are Desktop Chrome at a small
    // viewport with isMobile: false — no touch events, and `pointer: fine` — which is why
    // two touch-only bugs shipped to a phone with everything green. Scoped to its own spec
    // rather than run across the suite, because several tests assert the mouse behaviour
    // deliberately (see e2e/touch.spec.ts).
    name: 'mobile-touch',
    use: {
      ...devices['Desktop Chrome'],
      viewport: { width: 412, height: 915 },
      isMobile: true,
      hasTouch: true,
    },
    testMatch: '**/touch.spec.ts',
  },
];

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['html'], ['list']] : 'list',
  timeout: 90_000,
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    navigationTimeout: 60_000,
    actionTimeout: 20_000,
  },
  projects:
    TARGET === 'subpath'
      ? [
          {
            name: 'subpath',
            use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
            testMatch: '**/subpath.spec.ts',
          },
        ]
      : viewportProjects,
  webServer: {
    command:
      TARGET === 'dev'
        ? `npm run dev --workspace=packages/web -- --port ${PORT}`
        : `node scripts/serve-dist.mjs ${PORT} ${BASE_PATH}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
