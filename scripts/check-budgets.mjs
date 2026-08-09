#!/usr/bin/env node
/**
 * Two build-time guards.
 *
 * 1. Cloudinary image URLs must go through optimizeUrl()/fullBleedSrcSet()
 *    (packages/web/src/lib/images.ts). The bug this exists to catch already happened
 *    once: a raw Cloudinary URL constant used directly in `src=` served the untransformed
 *    original (several MB, no f_auto/q_auto) — the thing that was still true even after
 *    the rest of the site moved off multi-megabyte local images.
 *
 * 2. Bundle budget on the gzipped initial payload — the entry chunks every visitor
 *    downloads, not the below-the-fold lazy chunks (Team/About/WorkProcess/Projects/
 *    Footer are React.lazy()+Suspense, so they cost only whoever scrolls to them). Set a
 *    little above where the app currently sits, so growth surfaces as a failure to think
 *    about rather than a number nobody reads.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { gzipSync } from 'node:zlib';

const WEB = new URL('../packages/web/', import.meta.url).pathname;
const SHARED = new URL('../packages/shared/', import.meta.url).pathname;
const BUDGET_GZIP = { '.js': true, '.css': true, initial: 90 * 1024 };

// Lazy chunks used to be printed as "(not budgeted)", which meant nobody saw the CV modal
// pull in a PDF viewer and its worker — 1.54MB transferred on click, to display a 102KB
// document. It was invisible precisely because it was off the initial payload.
//
// The ceiling is per chunk, not a total: these are alternatives, not a bundle, so what
// matters is the cost of the one interaction a visitor actually performs. 50KB is
// comfortably above the current largest (3.2KB) and far below what went unnoticed. The
// number is not sacred — the point is that crossing it becomes a decision someone makes
// deliberately rather than something nobody is told about.
const BUDGET_LAZY_GZIP = 50 * 1024;

let failed = false;
const fail = (msg) => {
  console.error(`✗ ${msg}`);
  failed = true;
};

// ---- 1. Cloudinary URLs must go through optimizeUrl()/fullBleedSrcSet() ----------------
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return e.name === 'node_modules' ? [] : walk(p);
    return ['.ts', '.tsx'].includes(extname(e.name)) ? [p] : [];
  });

// Field names on packages/shared's content objects that hold a raw Cloudinary URL
// (Project['image'], TeamMember['photoUrl']) — a fixed allowlist rather than traced
// across files, since a per-file scan can't see that Projects.tsx's `project.image`
// originates in a different package. Update this if packages/shared/src/index.ts grows
// another such field.
const SHARED_IMAGE_FIELDS = new Set(['image', 'photoUrl']);

let cloudinaryUsages = 0;
for (const file of [...walk(join(WEB, 'src')), ...walk(SHARED)]) {
  const text = readFileSync(file, 'utf8');
  // Identifiers holding a raw Cloudinary URL, two shapes: a direct literal
  // (`const heroImage = 'https://res.cloudinary.com/...'`) or built from a base constant
  // (`const CLOUDINARY = 'https://...cloudinary.com/...'` then `image: \`${CLOUDINARY}/...\`,`
  // — packages/shared and WorkProcess.tsx use the second shape).
  const names = new Set(SHARED_IMAGE_FIELDS);
  const bases = new Set();
  for (const m of text.matchAll(/(?:const\s+(\w+)\s*=|(\w+):)\s*`?['"`][^'"`]*cloudinary\.com/g)) {
    const name = m[1] ?? m[2];
    names.add(name);
    if (m[1]) bases.add(name); // only a `const` can serve as a template base
  }
  for (const base of bases) {
    const derived = new RegExp(`(?:const\\s+(\\w+)\\s*=|(\\w+):)\\s*\`\\$\\{${base}\\}`, 'g');
    for (const m of text.matchAll(derived)) names.add(m[1] ?? m[2]);
  }
  // Destructuring-with-rename: `const { image: heroImage } = content.hero` binds the
  // Cloudinary URL to a name that shares nothing textually with 'image', so a plain
  // property access (`step.image`, which the \bimage\b test below already catches through
  // the dot) isn't what's happening here — the local name needs to be tracked in its own
  // right. Only actually fires for names already known to hold a Cloudinary URL, so this
  // can't accidentally start tracking an unrelated `image:` object-literal key.
  for (const known of [...names]) {
    const renamed = new RegExp(`\\b${known}:\\s*(\\w+)`, 'g');
    for (const m of text.matchAll(renamed)) names.add(m[1]);
  }
  text.split('\n').forEach((line, i) => {
    for (const name of names) {
      const re = new RegExp(`\\b${name}\\b`);
      if (!re.test(line)) continue;
      // The declaration/property line itself doesn't need the wrapper — specifically
      // *this name's* declaration, not any object-literal line (a bug here previously
      // matched every `word: ...` line, e.g. `background: ...url(${...})`, so it never
      // actually checked Projects.tsx/Team.tsx's usages at all).
      if (new RegExp(`^\\s*(const\\s+${name}\\s*=|${name}\\s*:)`).test(line)) continue;
      if (!/\bsrc=\{|\bsrcSet=\{|url\(\$\{/.test(line)) continue;
      cloudinaryUsages++;
      if (!/optimizeUrl\(|fullBleedSrcSet\(/.test(line)) {
        fail(
          `${file.replace(WEB, 'packages/web/').replace(SHARED, 'packages/shared/')}:${i + 1} uses ${name} without optimizeUrl()/fullBleedSrcSet(): ${line.trim()}`,
        );
      }
    }
  });
}
console.log(`✓ Cloudinary URLs: ${cloudinaryUsages} usage(s) all transformed`);

// ---- 2. bundle budgets ------------------------------------------------------------------
const assets = join(WEB, 'dist/assets');
try {
  statSync(assets);
} catch {
  console.error('✗ no dist/assets — run the build first');
  process.exit(1);
}

const kb = (n) => `${(n / 1024).toFixed(1)}KB`;
// Entry chunks are the ones Vite names off the HTML entry (index.html -> src/main.tsx);
// everything else is a route-level lazy chunk, named after the component it splits from.
const entry = readdirSync(assets).filter((n) => n.startsWith('index-'));
const lazy = readdirSync(assets).filter((n) => !n.startsWith('index-') && BUDGET_GZIP[extname(n)]);

let initial = 0;
for (const name of entry) {
  const ext = extname(name);
  if (!BUDGET_GZIP[ext]) continue;
  const size = gzipSync(readFileSync(join(assets, name))).length;
  initial += size;
  console.log(`  entry ${name}: ${kb(size)} gzipped`);
}
if (initial > BUDGET_GZIP.initial) {
  fail(`initial payload is ${kb(initial)} gzipped, over the ${kb(BUDGET_GZIP.initial)} budget`);
} else {
  console.log(`✓ initial payload: ${kb(initial)} gzipped (budget ${kb(BUDGET_GZIP.initial)})`);
}
for (const name of lazy) {
  const size = gzipSync(readFileSync(join(assets, name))).length;
  if (size > BUDGET_LAZY_GZIP) {
    fail(`lazy chunk ${name} is ${kb(size)} gzipped, over the ${kb(BUDGET_LAZY_GZIP)} budget`);
  } else {
    console.log(`  lazy  ${name}: ${kb(size)} gzipped (budget ${kb(BUDGET_LAZY_GZIP)})`);
  }
}

process.exit(failed ? 1 : 0);
