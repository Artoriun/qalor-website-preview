/**
 * Sets every environment variable the deployed API needs, in one call, and redeploys.
 *
 *   npm run render:env -- --service qalor-api --firebase ~/Downloads/sa.json
 *
 * Run it through that script rather than `node` directly: it passes
 * --disable-warning=MODULE_TYPELESS_PACKAGE_JSON, because importing password.ts makes Node
 * complain that packages/api/package.json declares no "type" and suggests adding
 * "type": "module". Do not do that. That tsconfig sets "module": "commonjs", so the flag
 * would make `node dist/index.js` parse CommonJS output as ESM and the deployed API would
 * stop booting. The warning is noise here and the suggestion is actively wrong, so it is
 * silenced by name rather than by --no-warnings, which would hide real ones too.
 *
 * The alternative is eight rows typed into a web form, where the only one that is hard to
 * get right is also the one that fails most opaquely: FIREBASE_PRIVATE_KEY has to arrive
 * with literal backslash-n, because packages/api/src/firebaseAdmin.ts un-escapes it, and
 * copying it out of a JSON viewer turns those into real newlines.
 *
 * Secrets are read from the service-account file and from prompts. Nothing is written to
 * disk, echoed, or passed as an argv value that would land in shell history.
 *
 * Render's PUT /env-vars REPLACES the whole set rather than merging, so this sends all
 * eight every time — a partial run would silently delete the rest. It also does not deploy
 * on its own; the API docs are explicit about that, hence the final POST.
 */

import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
// The API's own hasher, not a reimplementation and not the CLI's stdout: the format is
// `scrypt$salt$key` and packages/api verifies against exactly this function, so importing it
// is the only version that cannot drift. (scripts/hash-password.mjs prints the same value
// prefixed with `ADMIN_PASSWORD_HASH=`, which is a parse waiting to go wrong.)
import { hashPassword } from '../packages/api/src/password.ts';

const API = 'https://api.render.com/v1';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1]]);
    return acc;
  }, []),
);

const serviceName = args.service ?? 'qalor-api';
if (!args.firebase || !args.values) {
  console.error(
    'usage: npm run render:env -- --firebase <service-account.json> --values <values.env>' +
      '\n       [--service <name>]  (default: qalor-api)',
  );
  process.exit(1);
}

/**
 * Values come from a file, not prompts.
 *
 * Prompting was the obvious design and it does not survive contact with reality: readline
 * with terminal:true behaves differently under npm, under different terminal emulators, and
 * — worst — leaves the shell in raw mode if the process dies mid-prompt, after which the
 * next run appears to hang with no output at all. A file has none of those failure modes,
 * is re-runnable without retyping four secrets, and can be inspected before it is used.
 *
 * Format is KEY=value, one per line, # for comments. Values are taken verbatim after the
 * first '=' so a Cloudinary URL or a base64 secret containing '=' survives intact.
 */
function readValues(file) {
  const text = readFileSync(file.replace(/^~/, process.env.HOME), 'utf8');
  const out = {};
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

// ---- gather -------------------------------------------------------------------------------

const sa = JSON.parse(readFileSync(args.firebase.replace(/^~/, process.env.HOME), 'utf8'));
for (const k of ['project_id', 'client_email', 'private_key']) {
  if (!sa[k]) throw new Error(`${args.firebase} is missing ${k} — not a service-account key?`);
}
// JSON.stringify re-escapes the newlines to the \n form firebaseAdmin.ts expects; the
// surrounding quotes come off because Render stores the value verbatim.
const privateKey = JSON.stringify(sa.private_key).slice(1, -1);
if (privateKey.includes('\n')) throw new Error('private key still contains real newlines');

const vals = readValues(args.values);
const need = ['RENDER_API_KEY', 'ADMIN_PASSWORD', 'CLOUDINARY_URL'];
const absent = need.filter((k) => !vals[k]);
if (absent.length) {
  console.error(`${args.values} is missing: ${absent.join(', ')}`);
  process.exit(1);
}
const renderKey = vals.RENDER_API_KEY;
const adminPassword = vals.ADMIN_PASSWORD;
const cloudinaryUrl = vals.CLOUDINARY_URL;
const corsOrigin = vals.CORS_ORIGIN || 'https://qalor.nl';
const dbId = vals.FIREBASE_DATABASE_ID || '';

const envVars = [
  { key: 'NODE_VERSION', value: '22' },
  { key: 'ADMIN_PASSWORD_HASH', value: hashPassword(adminPassword) },
  { key: 'JWT_SECRET', value: randomBytes(32).toString('hex') },
  { key: 'CORS_ORIGIN', value: corsOrigin },
  { key: 'FIREBASE_PROJECT_ID', value: sa.project_id },
  { key: 'FIREBASE_CLIENT_EMAIL', value: sa.client_email },
  { key: 'FIREBASE_PRIVATE_KEY', value: privateKey },
  { key: 'CLOUDINARY_URL', value: cloudinaryUrl },
  // Only sent when the values file names one. A project can hold several Firestore
  // databases and the Admin SDK reaches (default) unless given an id, so omitting this is
  // correct for a default database and required for any other — sending an empty string
  // would not be, hence the filter rather than a blank entry.
  ...(dbId ? [{ key: 'FIREBASE_DATABASE_ID', value: dbId }] : []),
];

// ---- apply --------------------------------------------------------------------------------

const call = async (path, init = {}) => {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${renderKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...init.headers,
    },
  });
  if (!res.ok)
    throw new Error(`${init.method ?? 'GET'} ${path} -> ${res.status} ${await res.text()}`);
  return res.json();
};

const found = await call(`/services?name=${encodeURIComponent(serviceName)}&limit=20`);
const service = found.map((f) => f.service).find((s) => s?.name === serviceName);
if (!service) {
  throw new Error(
    `no service named "${serviceName}". Create it first (New -> Blueprint reads render.yaml), then re-run.`,
  );
}
console.log(`\n  service ${service.name}  ${service.id}`);

await call(`/services/${service.id}/env-vars`, { method: 'PUT', body: JSON.stringify(envVars) });
console.log(`  set ${envVars.length} variables:`);
for (const v of envVars) {
  // Length only. Printing any of these values would defeat the point of prompting for them.
  console.log(`    ${v.key.padEnd(22)} ${v.value.length} chars`);
}

const deploy = await call(`/services/${service.id}/deploys`, { method: 'POST', body: '{}' });
console.log(`\n  deploy ${deploy.id} ${deploy.status ?? 'queued'}`);
console.log(`  watch: ${service.dashboardUrl}`);
console.log(`\n  when live, verify Firestore is actually reachable:`);
console.log(`    curl -s https://${service.slug ?? serviceName}.onrender.com/health/deps`);
