import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { after, before, describe, test } from 'node:test';
import { v2 as cloudinary } from 'cloudinary';
import express from 'express';
import jwt from 'jsonwebtoken';

/**
 * The upload endpoint, which is the only place multer runs.
 *
 * The first test exists because the route was unreachable: `POST /:list` is registered before
 * `POST /upload`, and Express matches in registration order, so every upload was swallowed by
 * the list handler and answered `404 unknown list 'upload'`. The admin portal calls this from
 * packages/web/src/lib/api.ts, so image and CV uploads were failing in production while the
 * route itself looked perfectly correct in isolation.
 *
 * That is invisible to a unit test of the handler and to any test that does not use the real
 * router mounted the real way, which is why this suite mounts contentRouter as index.ts does.
 *
 * The rest is an upgrade guard for multer 2.x: a single field arriving as a buffer, the size
 * limit still rejecting, and auth refused before anything is parsed.
 */

const SECRET = 'test-jwt-secret-for-upload';
process.env.JWT_SECRET = SECRET;
// Otherwise the handler answers 503 before touching the file, and the parsing this exists to
// check never runs. Shaped like a real value; nothing dials out.
process.env.CLOUDINARY_URL = 'cloudinary://key:secret@example';

let server: Server;
let base = '';
let lastUploadBytes = -1;
let lastOptions: Record<string, unknown> = {};

before(async () => {
  (cloudinary.uploader as unknown as { upload_stream: unknown }).upload_stream = (
    opts: Record<string, unknown>,
    cb: (err: unknown, result: { secure_url: string }) => void,
  ) => ({
    end: (buf: Buffer) => {
      lastUploadBytes = buf.length;
      lastOptions = opts;
      cb(null, { secure_url: 'https://example.test/uploaded' });
    },
  });

  const { contentRouter } = await import('./content');
  const app = express();
  app.use(express.json());
  app.use('/api/content', contentRouter);
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      base = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
      resolve();
    });
  });
});
after(() => server?.close());

const token = () => jwt.sign({ admin: true, epoch: 0 }, SECRET, { algorithm: 'HS256' });

const post = (body: BodyInit | undefined, auth = true) =>
  fetch(`${base}/api/content/upload`, {
    method: 'POST',
    headers: auth ? { Authorization: `Bearer ${token()}` } : {},
    body,
  });

const form = (bytes: number, type = 'image/png', name = 'x.png') => {
  const fd = new FormData();
  fd.append('file', new Blob([new Uint8Array(bytes)], { type }), name);
  return fd;
};

describe('POST /api/content/upload', () => {
  test('is reachable at all, rather than being caught by POST /:list', async () => {
    const res = await post(form(1024));
    assert.notEqual(
      res.status,
      404,
      'the upload route must be registered before /:list, or every upload 404s',
    );
  });

  test('accepts one file and hands its bytes on', async () => {
    const res = await post(form(2048));
    assert.equal(res.status, 200);
    const { url } = (await res.json()) as { url: string };
    assert.equal(url, 'https://example.test/uploaded');
    assert.equal(lastUploadBytes, 2048, 'the whole file should reach the uploader');
  });

  test('a request with no file is refused rather than uploading nothing', async () => {
    assert.equal((await post(new FormData())).status, 400);
  });

  test('rejects a file over the ten-megabyte limit', async () => {
    assert.notEqual((await post(form(11 * 1024 * 1024))).status, 200);
  });

  test('an unauthenticated upload never reaches the parser', async () => {
    lastUploadBytes = -1;
    assert.equal((await post(form(1024), false)).status, 401);
    assert.equal(lastUploadBytes, -1, 'nothing should have been parsed or uploaded');
  });
});

describe('what we ask Cloudinary to store', () => {
  /**
   * A PDF uploaded as an image is stored, and then refused on delivery: Cloudinary blocks PDFs
   * on /image/upload/ by default, which returns 401 and reaches the browser as
   * ERR_INVALID_RESPONSE. A client uploaded a CV and could not open it. Raw delivery is not
   * covered by that block.
   */
  test('a PDF goes to raw storage, with the extension kept', async () => {
    const res = await post(form(2048, 'application/pdf', 'cv.pdf'));
    assert.equal(res.status, 200);
    assert.equal(lastOptions.resource_type, 'raw');
    assert.match(
      String(lastOptions.public_id),
      /\.pdf$/,
      'raw uploads keep no format of their own, so the extension has to be in the public_id or ' +
        'the delivered file has none',
    );
  });

  test('an image is stored as an image', async () => {
    const res = await post(form(2048, 'image/png', 'x.png'));
    assert.equal(res.status, 200);
    assert.equal(lastOptions.resource_type, 'image');
  });
});
