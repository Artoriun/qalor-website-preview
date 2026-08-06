#!/usr/bin/env node
/**
 * Runs Lighthouse against the built, prerendered output and fails the build on a
 * regression.
 *
 * Only accessibility, SEO and best-practices are gated. Those three are deterministic —
 * they inspect the markup, not the clock — so a threshold on them means what it says.
 * Performance is measured and printed but never gated: a shared CI runner's timings vary
 * by more than the thing being measured. check-budgets.mjs's bundle budget is the
 * deterministic half of performance, and that one does gate.
 *
 * Serves the output itself rather than assuming a server is up.
 */
import { execFile } from 'node:child_process';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGzip } from 'node:zlib';
import { chromium } from '@playwright/test';

function runLighthouse(args, env) {
  return new Promise((resolve, reject) => {
    const child = execFile('npx', args, { env }, (err) => (err ? reject(err) : resolve()));
    child.stderr?.pipe(process.stderr);
  });
}

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'packages/web/dist');
const PORT = Number(process.env.LH_PORT ?? 4598);
const CHROME_PATH = chromium.executablePath();

const THRESHOLDS = { accessibility: 100, seo: 100, 'best-practices': 100 };

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('✗ no build to audit — run `npm run build && npm run prerender` first');
  process.exit(1);
}

const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.svg', '.json', '.xml', '.txt']);

const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const path = decodeURIComponent(url.pathname);
  // normalize collapses any ../ before it can escape DIST.
  let file = join(DIST, normalize(`/${path}`));
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) file = join(DIST, 'index.html');
  const gzip =
    COMPRESSIBLE.has(extname(file)) && (req.headers['accept-encoding'] ?? '').includes('gzip');
  res.writeHead(200, {
    'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
    'Cache-Control': 'public, max-age=600',
    ...(gzip ? { 'Content-Encoding': 'gzip' } : {}),
  });
  const stream = createReadStream(file);
  if (gzip) stream.pipe(createGzip()).pipe(res);
  else stream.pipe(res);
});

await new Promise((resolve, reject) => {
  server.once('error', (err) =>
    reject(
      err.code === 'EADDRINUSE'
        ? new Error(`port ${PORT} is already in use — free it, or set LH_PORT`)
        : err,
    ),
  );
  server.listen(PORT, resolve);
}).catch((err) => {
  console.error(`✗ ${err.message}`);
  process.exit(1);
});

let failed = false;
try {
  const url = `http://localhost:${PORT}/`;
  const out = join(ROOT, 'lighthouse-home.json');

  await runLighthouse(
    [
      'lighthouse',
      url,
      '--only-categories=performance,accessibility,best-practices,seo',
      '--form-factor=mobile',
      '--screenEmulation.mobile',
      '--output=json',
      `--output-path=${out}`,
      '--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage',
      '--quiet',
    ],
    { ...process.env, CHROME_PATH },
  );

  const report = JSON.parse(readFileSync(out, 'utf8'));
  const score = (id) => Math.round((report.categories[id].score ?? 0) * 100);

  console.log(`\n  ${url}`);
  console.log(
    `    performance ${score('performance')}  (not gated)  ` +
      `LCP ${report.audits['largest-contentful-paint'].displayValue}  ` +
      `CLS ${report.audits['cumulative-layout-shift'].displayValue}`,
  );

  for (const [id, min] of Object.entries(THRESHOLDS)) {
    const actual = score(id);
    const ok = actual >= min;
    console.log(`    ${ok ? '✓' : '✗'} ${id} ${actual} (min ${min})`);
    if (ok) continue;
    failed = true;
    for (const ref of report.categories[id].auditRefs) {
      const audit = report.audits[ref.id];
      if (audit.score === null || audit.score >= 1) continue;
      console.log(`        ${ref.id}: ${audit.title}`);
      for (const item of (audit.details?.items ?? []).slice(0, 5)) {
        const where = item.node?.selector ?? item.url ?? item.text ?? item.description;
        if (where) console.log(`          ${String(where).slice(0, 110)}`);
      }
    }
  }
} finally {
  server.close();
}

process.exit(failed ? 1 : 0);
