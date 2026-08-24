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
import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';
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
if (!args.firebase) {
  console.error('usage: node scripts/render-env.mjs --service <name> --firebase <sa.json>');
  process.exit(1);
}

const rl = createInterface({ input: stdin, output: stdout, terminal: true });
const ask = async (q) => (await rl.question(q)).trim();

/**
 * Reads without echoing, so a pasted secret does not stay on screen.
 *
 * Deliberately the same shape as scripts/hash-password.mjs: one readline interface, and a
 * temporary 'data' listener that prints an asterisk per keystroke while readline collects
 * the real characters. The obvious alternative — `for await (const chunk of stdin)` — works
 * exactly once. Consuming stdin as an async iterator destroys the stream when the loop
 * exits, so the second prompt dies with `AbortError: The operation was aborted`, and the
 * readline interface still attached to that stdin re-throws it as an unhandled 'error'
 * event. It reads like a Node bug and is not one.
 */
const askSecret = (q) =>
  new Promise((resolve) => {
    stdout.write(q);
    const onData = (ch) => {
      if (['\n', '\r', '\u0004'].includes(ch.toString())) stdin.removeListener('data', onData);
      else stdout.write('*');
    };
    stdin.on('data', onData);
    rl.question('').then((answer) => {
      stdin.removeListener('data', onData);
      stdout.write('\n');
      resolve(answer.trim());
    });
  });

// ---- gather -------------------------------------------------------------------------------

const sa = JSON.parse(readFileSync(args.firebase.replace(/^~/, process.env.HOME), 'utf8'));
for (const k of ['project_id', 'client_email', 'private_key']) {
  if (!sa[k]) throw new Error(`${args.firebase} is missing ${k} — not a service-account key?`);
}
// JSON.stringify re-escapes the newlines to the \n form firebaseAdmin.ts expects; the
// surrounding quotes come off because Render stores the value verbatim.
const privateKey = JSON.stringify(sa.private_key).slice(1, -1);
if (privateKey.includes('\n')) throw new Error('private key still contains real newlines');

const renderKey = await askSecret('Render API key (Account Settings -> API Keys): ');
const adminPassword = await askSecret('Admin portal password to set: ');
const cloudinaryUrl = await askSecret('CLOUDINARY_URL (cloudinary://key:secret@o5hr8kjc): ');
const corsOrigin = (await ask('CORS_ORIGIN [https://qalor.nl]: ')).trim() || 'https://qalor.nl';
rl.close();

const envVars = [
  { key: 'NODE_VERSION', value: '22' },
  { key: 'ADMIN_PASSWORD_HASH', value: hashPassword(adminPassword) },
  { key: 'JWT_SECRET', value: randomBytes(32).toString('hex') },
  { key: 'CORS_ORIGIN', value: corsOrigin },
  { key: 'FIREBASE_PROJECT_ID', value: sa.project_id },
  { key: 'FIREBASE_CLIENT_EMAIL', value: sa.client_email },
  { key: 'FIREBASE_PRIVATE_KEY', value: privateKey },
  { key: 'CLOUDINARY_URL', value: cloudinaryUrl },
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
