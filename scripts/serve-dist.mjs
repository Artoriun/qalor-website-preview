#!/usr/bin/env node
/**
 * Serves packages/web/dist the way the real hosts do — see scripts/lib/static-server.mjs for
 * what "the way the real hosts do" means and why it matters.
 *
 * Used as Playwright's webServer when E2E_TARGET is set, so the suite can run against the
 * built, prerendered output instead of the dev server. That distinction is not cosmetic:
 * prerendering is what produced the Hero's desktop-layout-then-snap bug, and the dev server
 * has no prerendered HTML at all, so no test running against it could ever have caught it.
 *
 * Usage: node scripts/serve-dist.mjs [port] [basePath]
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStaticServer, listen } from './lib/static-server.mjs';

const DIST = fileURLToPath(new URL('../packages/web/dist/', import.meta.url));
const port = Number(process.argv[2] ?? process.env.WEB_PORT ?? 3210);
const basePath = process.argv[3] ?? process.env.VITE_BASE ?? '/';

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('✗ nothing built to serve — run `npm run build && npm run prerender` first');
  process.exit(1);
}

// A dist built for a different base path than the one being served would 404 on every asset
// and fail every test with something far less obvious than this message.
if (basePath !== '/') {
  const html = readFileSync(join(DIST, 'index.html'), 'utf8');
  if (!html.includes(`"${basePath}assets/`)) {
    console.error(
      `✗ dist was not built for base path ${basePath} — rebuild with VITE_BASE=${basePath}`,
    );
    process.exit(1);
  }
}

const server = createStaticServer({ dist: DIST, basePath });
await listen(server, port);
console.log(`serving ${DIST} at http://localhost:${port}${basePath}`);
