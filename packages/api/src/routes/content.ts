import {
  DEFAULT_ABOUT,
  DEFAULT_FOOTER,
  DEFAULT_HERO,
  DEFAULT_PROJECTS_INTRO,
  DEFAULT_SITE_CONTENT,
  DEFAULT_TEAM_INTRO,
  DEFAULT_WORK_PROCESS_INTRO,
  PROJECTS,
  type SiteContent,
  TEAM_MEMBERS,
  WORK_PROCESS_STEPS,
} from '@qalor/shared';
import { v2 as cloudinary } from 'cloudinary';
import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../asyncHandler';
import { db } from '../firebaseAdmin';
import { requireAuth } from '../middleware/requireAuth';
import type { MemorySnapshot } from '../testing/memoryStore';

/**
 * Editable content, served as the bundled defaults with Firestore (or the in-memory dev
 * store — see firebaseAdmin.ts) overrides merged on top.
 *
 * The merge is the important part. `DEFAULT_SITE_CONTENT` in the shared package is what the
 * site renders before this API answers and what it keeps rendering if the API is asleep —
 * free tiers sleep — so the site is never blank. The store only ever holds the *difference*
 * from those defaults, which also keeps writes small.
 *
 * Two content shapes, both merged the same way underneath: a handful of *singleton*
 * sections (hero/about/workProcessIntro/projectsIntro/teamIntro/footer), one Firestore doc
 * each in `siteContent`; and three *list* sections (projects/team/workProcessSteps), one doc
 * per item in a collection named after the list.
 */
export const contentRouter = Router();

// Memory storage, not disk: Render's filesystem is ephemeral (and the local dev store is
// in-memory too) — the buffer goes straight to Cloudinary. 10MB is well above any sensible
// web image/CV and well below the point where a handful of concurrent uploads would exhaust
// a free instance's memory.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ---- singleton sections -----------------------------------------------------------------

const SINGLETON_DEFAULTS: Record<string, Record<string, unknown>> = {
  hero: DEFAULT_HERO,
  about: DEFAULT_ABOUT,
  workProcessIntro: DEFAULT_WORK_PROCESS_INTRO,
  projectsIntro: DEFAULT_PROJECTS_INTRO,
  teamIntro: DEFAULT_TEAM_INTRO,
  footer: DEFAULT_FOOTER,
};

// Allow-listed per id rather than passing req.body through: an unknown key would be written
// to the store verbatim and served to every visitor.
const SINGLETON_FIELDS: Record<string, string[]> = {
  hero: ['headline', 'subheadline', 'image'],
  about: ['eyebrow', 'heading', 'image', 'blocks'],
  workProcessIntro: ['eyebrow', 'heading'],
  projectsIntro: ['eyebrow', 'heading'],
  teamIntro: ['eyebrow', 'heading'],
  footer: ['tagline', 'email', 'phone', 'address', 'addressUrl', 'btwNumber', 'iban', 'copyright'],
};

// ---- list sections ------------------------------------------------------------------------

const LIST_BUNDLED: Record<string, Array<Record<string, unknown>>> = {
  projects: PROJECTS,
  team: TEAM_MEMBERS,
  workProcessSteps: WORK_PROCESS_STEPS,
};

const LIST_FIELDS: Record<string, string[]> = {
  projects: ['name', 'role', 'description', 'image', 'order', 'deleted'],
  team: ['name', 'description', 'isImage', 'pdfPath', 'photoUrl', 'order', 'deleted'],
  workProcessSteps: ['number', 'title', 'body', 'image', 'alt', 'order', 'deleted'],
};

// New items get a fresh numeric id — Date.now() rather than an incrementing counter so it
// stays unique with no shared state, matching how the bundled ids (1, 2, 3…) never collide
// with a timestamp-sized number.
const NEW_ITEM_TEMPLATE: Record<string, Record<string, unknown>> = {
  projects: { name: 'Nieuw project', role: '', description: '', image: '' },
  team: { name: 'Nieuw teamlid', description: '' },
  workProcessSteps: { number: '00', title: 'Nieuwe stap', body: '', image: '', alt: '' },
};

function isListName(name: string): boolean {
  return name in LIST_BUNDLED;
}

function isSingletonId(id: string): boolean {
  return id in SINGLETON_DEFAULTS;
}

function pick(body: Record<string, unknown>, fields: string[]): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const field of fields) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  return data;
}

/** Turns a store snapshot into an id → override-fields lookup. */
function overridesById(snap: MemorySnapshot): Record<string, Record<string, unknown>> {
  const overrides: Record<string, Record<string, unknown>> = {};
  snap.forEach((doc) => {
    overrides[doc.id] = doc.data() ?? {};
  });
  return overrides;
}

/** Bundled defaults + per-item Firestore overrides, soft-deletes filtered, sorted by order. */
function mergeList(
  bundled: Array<Record<string, unknown>>,
  snap: MemorySnapshot,
): Array<Record<string, unknown>> {
  const overrides = overridesById(snap);
  const bundledIds = new Set(bundled.map((item) => String(item.id)));

  const merged: Array<Record<string, unknown>> = bundled.map((item) => {
    const override = overrides[String(item.id)];
    return override ? { ...item, ...override } : item;
  });
  // Items created from the portal have no bundled counterpart.
  const created: Array<Record<string, unknown>> = Object.entries(overrides)
    .filter(([id]) => !bundledIds.has(id))
    .map(([id, data]) => ({ id, ...data }));

  return [...merged, ...created]
    .filter((item) => !item.deleted)
    .sort((a, b) => ((a.order as number) ?? 0) - ((b.order as number) ?? 0));
}

/**
 * Public. Never fails: a store outage falls back to the bundled content with a 200, because
 * a visitor should see the site rather than an error. That does mean this endpoint cannot be
 * used to detect a broken data layer — /health/deps exists for that.
 */
contentRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    try {
      const [siteSnap, projectsSnap, teamSnap, stepsSnap] = await Promise.all([
        db.collection('siteContent').get(),
        db.collection('projects').get(),
        db.collection('team').get(),
        db.collection('workProcessSteps').get(),
      ]);
      const siteOverrides = overridesById(siteSnap);
      const merged = (id: string) => ({ ...SINGLETON_DEFAULTS[id], ...(siteOverrides[id] ?? {}) });

      const content: SiteContent = {
        hero: merged('hero') as SiteContent['hero'],
        about: merged('about') as SiteContent['about'],
        workProcessIntro: merged('workProcessIntro') as SiteContent['workProcessIntro'],
        workProcessSteps: mergeList(
          WORK_PROCESS_STEPS,
          stepsSnap,
        ) as SiteContent['workProcessSteps'],
        projectsIntro: merged('projectsIntro') as SiteContent['projectsIntro'],
        projects: mergeList(PROJECTS, projectsSnap) as SiteContent['projects'],
        teamIntro: merged('teamIntro') as SiteContent['teamIntro'],
        team: mergeList(TEAM_MEMBERS, teamSnap) as SiteContent['team'],
        footer: merged('footer') as SiteContent['footer'],
      };
      res.json(content);
    } catch {
      res.json(DEFAULT_SITE_CONTENT);
    }
  }),
);

contentRouter.put(
  '/site/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!isSingletonId(id)) {
      res.status(404).json({ error: `unknown section '${id}'` });
      return;
    }
    const data = pick(req.body as Record<string, unknown>, SINGLETON_FIELDS[id]);
    // merge, so editing one field cannot blank the others.
    await db.collection('siteContent').doc(id).set(data, { merge: true });
    res.json({ ok: true });
  }),
);

// Registered before the `/:list` routes below, and it has to stay there. Express matches in
// registration order, so with this underneath, `POST /api/content/upload` is captured by
// `/:list` with list="upload" and answered `404 unknown list 'upload'` — which is exactly
// what the admin portal's image and CV uploads were getting. upload.test.ts pins it.
/**
 * One upload endpoint for everything — a singleton's image (hero.image, about.image), a
 * list item's image, or a team member's CV PDF. Not scoped to a section: uploading doesn't
 * write any content by itself, it just returns a URL the client then puts in a normal PUT
 * (the same way pasting an image URL by hand would). `resource_type: 'auto'` lets
 * Cloudinary store either kind — images get its normal image pipeline (so packages/web's
 * optimizeUrl() transforms still work), a PDF is stored as a raw asset and served back
 * as-is.
 */
contentRouter.post(
  '/upload',
  requireAuth,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!process.env.CLOUDINARY_URL) {
      res.status(503).json({ error: 'Upload is not configured. Set CLOUDINARY_URL.' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }
    // 'auto' classifies a PDF as an image, and Cloudinary refuses to deliver PDFs from
    // /image/upload/ unless the account opts in — the asset stores fine and then answers 401,
    // which reaches the browser as ERR_INVALID_RESPONSE. Raw delivery is not covered by that
    // block, so anything that is not an image goes there instead.
    //
    // Raw resources carry no format of their own, so the extension has to be part of the
    // public_id or the delivered file arrives without one.
    const isImage = req.file.mimetype.startsWith('image/');
    const extension = req.file.originalname.match(/\.[a-z0-9]+$/i)?.[0] ?? '';
    const publicId = isImage ? `${Date.now()}` : `${Date.now()}${extension}`;

    try {
      const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: 'content', public_id: publicId, resource_type: isImage ? 'image' : 'raw' },
            (error, uploaded) =>
              error ? reject(error) : resolve(uploaded as { secure_url: string }),
          )
          .end(req.file?.buffer);
      });
      res.json({ url: result.secure_url });
    } catch (err) {
      console.error('[content] upload failed:', err);
      res.status(500).json({ error: 'Upload failed' });
    }
  }),
);

contentRouter.post(
  '/:list',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { list } = req.params;
    if (!isListName(list)) {
      res.status(404).json({ error: `unknown list '${list}'` });
      return;
    }
    const id = String(Date.now());
    // Fields the caller supplies win over the template. The portal composes a new item in the
    // browser and only sends it when Save is pressed, so creation carries its content — it used
    // to publish an empty placeholder on the click of "+ Nieuw item", which is how a blank team
    // member reached the live site. Same whitelist the update route uses.
    const data = {
      ...NEW_ITEM_TEMPLATE[list],
      order: Date.now(),
      ...pick(req.body as Record<string, unknown>, LIST_FIELDS[list]),
    };
    await db.collection(list).doc(id).set(data);
    // The id is a string here, same as every other created item's id in mergeList's
    // "created" branch below — Firestore doc keys are always strings, so a bundled item's
    // numeric id (1, 2, 3…) and a created item's id (a Date.now() string) are genuinely
    // different shapes. The frontend and admin UI use it as an opaque key either way.
    res.json({ id, ...data });
  }),
);

contentRouter.put(
  '/:list/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { list, id } = req.params;
    if (!isListName(list)) {
      res.status(404).json({ error: `unknown list '${list}'` });
      return;
    }
    const data = pick(req.body as Record<string, unknown>, LIST_FIELDS[list]);
    await db.collection(list).doc(id).set(data, { merge: true });
    res.json({ ok: true });
  }),
);

/**
 * Hard delete. The portal soft-deletes by default (`deleted: true`, sent through the PUT
 * route above) so an item can be restored; this removes the override entirely, which for a
 * bundled item means it reverts to what's in packages/shared.
 */
contentRouter.delete(
  '/:list/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { list, id } = req.params;
    if (!isListName(list)) {
      res.status(404).json({ error: `unknown list '${list}'` });
      return;
    }
    await db.collection(list).doc(id).delete();
    res.json({ ok: true });
  }),
);
