#!/usr/bin/env node
/**
 * Two build-time guards.
 *
 * 1. Cloudinary image URLs must go through optimizeUrl()/fullBleedSrcSet()/dprSrcSet()
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
// 95KB rather than 90KB since the header logo became a data URI (Navbar.tsx). It is worth
// the ~5KB: as a file it was an 11KB Low-priority image behind ~287KB of High-priority
// requests, so it painted at ~2.7s on a cold mobile load, and neither fetchpriority nor
// preloading moved it outside the run-to-run spread — a saturated connection does not
// reorder. Inlining removed the request instead and put it at ~1.25s. It is counted twice,
// once in the entry chunk and once in the prerendered markup, because React has to render
// the same src string it hydrates against.
const BUDGET_GZIP = { '.js': true, '.css': true, initial: 95 * 1024 };

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

// ---- 1. Cloudinary URLs must go through optimizeUrl()/fullBleedSrcSet()/dprSrcSet() ----
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
      if (!/optimizeUrl\(|fullBleedSrcSet\(|dprSrcSet\(/.test(line)) {
        fail(
          `${file.replace(WEB, 'packages/web/').replace(SHARED, 'packages/shared/')}:${i + 1} uses ${name} without optimizeUrl()/fullBleedSrcSet()/dprSrcSet(): ${line.trim()}`,
        );
      }
    }
  });
}
// The count is a floor, not decoration. The scan above is textual and single-line: it only
// looks at lines carrying `src={`, `srcSet={` or `url(${` *and* an identifier it has traced to
// a Cloudinary URL. Move such a URL onto its own line, or through a local whose name it has not
// traced, and the line stops matching — the check does not fail, it just quietly stops covering
// that usage. Which is the failure mode a coverage check can least afford, since the output
// still reads as a tick. Raise this number when a real usage is added.
const MIN_CLOUDINARY_USAGES = 11;
if (cloudinaryUsages < MIN_CLOUDINARY_USAGES) {
  fail(
    `only ${cloudinaryUsages} Cloudinary usage(s) matched, expected at least ` +
      `${MIN_CLOUDINARY_USAGES} — a usage stopped being covered rather than being fixed. ` +
      'Keep the transform call on the same line as the src, srcSet or url() it feeds.',
  );
} else {
  console.log(`✓ Cloudinary URLs: ${cloudinaryUsages} usage(s) all transformed`);
}

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
/**
 * The entry files index.html actually references, not every `index-*` in the directory.
 *
 * Reading the directory measured stale builds too: turbo restores `dist/**` from its cache,
 * so hashes from earlier builds pile up beside the current ones and the budget sums two
 * complete entry sets, reporting roughly double on a build well inside its budget. CI never
 * sees it — a fresh checkout has no cache to restore — which makes it a defect that only ever
 * appears locally, where the check should be most useful.
 *
 * It is also the more honest measurement: the budget is a claim about what a visitor
 * downloads, and what a visitor downloads is what the document asks for.
 */
const html = readFileSync(join(WEB, 'dist/index.html'), 'utf8');
const entry = [
  ...new Set([...html.matchAll(/assets\/(index-[\w-]+\.(?:js|css))/g)].map((m) => m[1])),
];
if (entry.length === 0) {
  fail('no entry assets referenced by dist/index.html — was the build run?');
  process.exit(1);
}

// Same staleness one step removed: a lazy chunk is referenced from the entry bundle rather
// than from the document, so that is where to look. A leftover chunk is referenced by nobody.
const entryJs = entry
  .filter((n) => extname(n) === '.js')
  .map((n) => readFileSync(join(assets, n), 'utf8'))
  .join('');
const lazy = readdirSync(assets).filter(
  (n) => !n.startsWith('index-') && BUDGET_GZIP[extname(n)] && entryJs.includes(n),
);

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
