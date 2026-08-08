import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { after, afterEach, before, beforeEach, describe, test } from 'node:test';
import { DEFAULT_HERO, PROJECTS } from '@qalor/shared';
import express from 'express';
import jwt from 'jsonwebtoken';
import { setStore } from '../firebaseAdmin';
import { createMemoryStore } from '../testing/memoryStore';
import { contentRouter } from './content';

/**
 * The content merge logic end to end, over real HTTP, against an in-memory stand-in for
 * the store — same shape firebaseAdmin.ts falls back to for local placeholders, so this
 * suite is exercising the actual fallback path too, not just a test-only substitute.
 */

const SECRET = 'test-jwt-secret';

let server: Server;
let base = '';
let fake: ReturnType<typeof createMemoryStore>;

before(async () => {
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

beforeEach(() => {
  fake = createMemoryStore();
  setStore(fake);
  process.env.JWT_SECRET = SECRET;
});
afterEach(() => {
  setStore(null);
});

const authHeader = () => ({
  Authorization: `Bearer ${jwt.sign({ admin: true, epoch: 0 }, SECRET, { algorithm: 'HS256' })}`,
});

const getContent = () => fetch(`${base}/api/content`).then((r) => r.json());

describe('GET /api/content', () => {
  test('serves the bundled defaults with nothing overridden', async () => {
    const content = (await getContent()) as { hero: typeof DEFAULT_HERO };
    assert.deepEqual(content.hero, DEFAULT_HERO);
  });

  test('falls back to the bundled defaults with a 200 when the store is unreachable', async () => {
    fake.breakWith('store unavailable');
    const res = await fetch(`${base}/api/content`);
    assert.equal(res.status, 200);
    const content = (await res.json()) as { hero: typeof DEFAULT_HERO };
    assert.deepEqual(content.hero, DEFAULT_HERO);
  });
});

describe('singleton sections (PUT /api/content/site/:id)', () => {
  test('requires auth', async () => {
    const res = await fetch(`${base}/api/content/site/hero`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ headline: 'nope' }),
    });
    assert.equal(res.status, 401);
  });

  test('an edited field overrides the bundled default; unedited fields keep it', async () => {
    await fetch(`${base}/api/content/site/hero`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ headline: 'Nieuwe kop' }),
    });
    const content = (await getContent()) as { hero: typeof DEFAULT_HERO };
    assert.equal(content.hero.headline, 'Nieuwe kop');
    assert.equal(content.hero.subheadline, DEFAULT_HERO.subheadline);
  });

  test('an unknown field is dropped, not written to the store', async () => {
    await fetch(`${base}/api/content/site/hero`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ headline: 'ok', evil: 'injected' }),
    });
    const stored = fake.dump()['siteContent/hero'];
    assert.equal(stored?.evil, undefined);
  });

  test('an unknown section id 404s', async () => {
    const res = await fetch(`${base}/api/content/site/nonexistent`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ x: 1 }),
    });
    assert.equal(res.status, 404);
  });
});

describe('list sections (projects/team/workProcessSteps)', () => {
  test('an edited item overrides the bundled one by id; the rest are untouched', async () => {
    const target = PROJECTS[0];
    await fetch(`${base}/api/content/projects/${target.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ name: 'Renamed project' }),
    });
    const content = (await getContent()) as { projects: typeof PROJECTS };
    const edited = content.projects.find((p) => p.id === target.id);
    assert.equal(edited?.name, 'Renamed project');
    assert.equal(content.projects.length, PROJECTS.length);
  });

  test('creating adds an item with no bundled counterpart', async () => {
    const res = await fetch(`${base}/api/content/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
    });
    assert.equal(res.status, 200);
    const created = (await res.json()) as { id: number };
    const content = (await getContent()) as { projects: typeof PROJECTS };
    assert.ok(content.projects.some((p) => p.id === created.id));
    assert.equal(content.projects.length, PROJECTS.length + 1);
  });

  test('soft-delete (deleted: true) removes it from GET but keeps the override', async () => {
    const target = PROJECTS[0];
    await fetch(`${base}/api/content/projects/${target.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ deleted: true }),
    });
    const content = (await getContent()) as { projects: typeof PROJECTS };
    assert.ok(!content.projects.some((p) => p.id === target.id));
    assert.ok(fake.dump()[`projects/${target.id}`]);
  });

  test('hard delete (DELETE) restores the bundled item to its default', async () => {
    const target = PROJECTS[0];
    await fetch(`${base}/api/content/projects/${target.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ name: 'Temporarily renamed' }),
    });
    await fetch(`${base}/api/content/projects/${target.id}`, {
      method: 'DELETE',
      headers: authHeader(),
    });
    const content = (await getContent()) as { projects: typeof PROJECTS };
    const restored = content.projects.find((p) => p.id === target.id);
    assert.equal(restored?.name, target.name);
  });

  test('items are sorted by order', async () => {
    const [a, b] = PROJECTS;
    await fetch(`${base}/api/content/projects/${a.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ order: 2 }),
    });
    await fetch(`${base}/api/content/projects/${b.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ order: 1 }),
    });
    const content = (await getContent()) as { projects: typeof PROJECTS };
    const ids = content.projects.map((p) => p.id);
    assert.ok(ids.indexOf(b.id) < ids.indexOf(a.id));
  });

  test('an unknown list name 404s', async () => {
    const res = await fetch(`${base}/api/content/nonexistent`, {
      method: 'POST',
      headers: authHeader(),
    });
    assert.equal(res.status, 404);
  });

  test('writes require auth', async () => {
    const target = PROJECTS[0];
    assert.equal(
      (
        await fetch(`${base}/api/content/projects/${target.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'nope' }),
        })
      ).status,
      401,
    );
    assert.equal(
      (await fetch(`${base}/api/content/projects/${target.id}`, { method: 'DELETE' })).status,
      401,
    );
  });
});
