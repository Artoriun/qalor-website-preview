import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { createGzip } from 'node:zlib';

/**
 * Serves a built `dist` the way the real hosts do, for anything that needs to test the
 * production output rather than the dev server.
 *
 * Extracted so there is one of these rather than three: check-lighthouse.mjs had its own
 * copy, and the Playwright run against the built output needs the same thing. Both now
 * import this.
 *
 * Two behaviours are deliberately modelled on the real hosts rather than on convenience:
 *
 * - `basePath` — the GitHub Pages preview is served from a project subpath, and three
 *   separate bugs (a 404ing /admin, a crash inlining the stylesheet, a link that navigated
 *   off the site entirely) existed *only* in that variant. Serving it that way locally is
 *   what makes them testable.
 * - An unmatched path returns `404.html` **with a 404 status**, matching
 *   packages/web/public/.htaccess's `ErrorDocument 404 /404.html` and GitHub Pages' native
 *   handling. Returning 200 with index.html would be friendlier and would hide exactly the
 *   class of routing bug this is here to catch.
 */
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
};

const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.svg', '.json', '.xml', '.txt']);

export function createStaticServer({ dist, basePath = '/' }) {
  const prefix = basePath.endsWith('/') ? basePath : `${basePath}/`;

  return createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let path = decodeURIComponent(url.pathname);

    // Everything is published under the base path; anything outside it doesn't exist as far
    // as this host is concerned, which is the point — a link that escapes the base should
    // 404 here rather than quietly resolving.
    if (prefix !== '/') {
      if (path === prefix.slice(0, -1)) path = prefix;
      if (!path.startsWith(prefix)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' }).end('404 outside base path');
        return;
      }
      path = path.slice(prefix.length - 1);
    }

    // normalize collapses any ../ before it can escape dist.
    let file = join(dist, normalize(`/${path}`));
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');

    let status = 200;
    if (!existsSync(file)) {
      file = join(dist, '404.html');
      status = 404;
      if (!existsSync(file)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' }).end('404 not found');
        return;
      }
    }

    const gzip =
      COMPRESSIBLE.has(extname(file)) && (req.headers['accept-encoding'] ?? '').includes('gzip');
    res.writeHead(status, {
      'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=600',
      ...(gzip ? { 'Content-Encoding': 'gzip' } : {}),
    });
    const stream = createReadStream(file);
    if (gzip) stream.pipe(createGzip()).pipe(res);
    else stream.pipe(res);
  });
}

/** Resolves once listening, or exits with a readable message if the port is taken. */
export async function listen(server, port) {
  await new Promise((resolve, reject) => {
    server.once('error', (err) =>
      reject(err.code === 'EADDRINUSE' ? new Error(`port ${port} is already in use`) : err),
    );
    server.listen(port, resolve);
  }).catch((err) => {
    console.error(`✗ ${err.message}`);
    process.exit(1);
  });
}
