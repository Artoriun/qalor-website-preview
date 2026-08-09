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
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { createStaticServer, listen } from './lib/static-server.mjs';

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

// Gated, unlike performance. The distinction is not arbitrary: performance is dominated by
// wall-clock timings that drift with whatever else a shared CI runner is doing, whereas CLS
// measures how much the layout moved — a property of the markup and CSS, not of the machine.
// It sat at an intermittent 0.033 while the Hero painted a desktop layout and then snapped to
// the mobile one, and has been a steady 0 since that was fixed; 0.05 leaves room for noise
// without letting a real shift back in.
const MAX_CLS = 0.05;

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('✗ no build to audit — run `npm run build && npm run prerender` first');
  process.exit(1);
}

// Shared with the Playwright run against the built output — see scripts/lib/static-server.mjs.
const server = createStaticServer({ dist: DIST, basePath: '/' });
await listen(server, PORT);

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

  const cls = report.audits['cumulative-layout-shift'].numericValue ?? 0;
  const clsOk = cls <= MAX_CLS;
  console.log(`    ${clsOk ? '✓' : '✗'} CLS ${cls.toFixed(3)} (max ${MAX_CLS})`);
  if (!clsOk) {
    failed = true;
    for (const item of (report.audits['layout-shifts']?.details?.items ?? []).slice(0, 5)) {
      const where = item.node?.selector ?? item.url ?? item.description;
      if (where) console.log(`        ${String(where).slice(0, 110)}`);
    }
  }

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
