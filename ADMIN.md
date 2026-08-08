# Admin portal

Every visible section of the site — Hero, Qalor/About, Werkproces, Projecten, Team, and the
Footer's contact details — is editable at `/admin` without a code change or redeploy. This
document covers how it works and how to move it from local placeholders to a real deployment.

## How it works

- `packages/shared/src/index.ts` holds the **bundled defaults** for every section (the
  `DEFAULT_*` constants and `PROJECTS`/`TEAM_MEMBERS`). These ship inside the built site and
  the API process, so the site is never blank even if the API is unreachable.
- `packages/api` stores only the **difference** from those defaults, in Firestore (or, with
  no Firestore configured, an in-memory store — see below). `GET /api/content` merges the
  two and falls back to the bundled defaults with a `200` on any store error, on purpose: a
  visitor should see the site, never an error page, even mid-outage.
- `packages/web/src/context/ContentContext.tsx` seeds the app from `window.__CONTENT__`
  (written by `scripts/prerender.mjs` at build time) or the bundled defaults, then replaces
  it with a live fetch — so a signed-in editor's own change shows up immediately on refresh,
  without waiting for a rebuild.
- Content edited in the portal reaches **crawlers and first-paint visitors** only at the next
  prerender build. `.github/workflows/ci.yml` runs that weekly (Mondays 04:00 UTC) in
  addition to every push, so an edit is never more than a week from being indexed even if
  nobody redeploys.

Two content shapes:

- **Singleton sections** (Hero, About, WorkProcess's intro, Projects' intro, Team's intro,
  Footer) — one Firestore doc each, edited as a plain form.
- **List sections** (Projects, Team, WorkProcess's steps) — reorder, add, delete, and
  per-item image (or, for a team member, CV PDF) upload.

## Local development — placeholders, no setup required

`npm run dev` (from the repo root) starts both `packages/web` and `packages/api` and the
admin portal works end to end with zero configuration:

- **Login**: `packages/api/.env` ships with `ADMIN_PASSWORD=changeme` — sign in at
  `/admin` with that.
- **Storage**: with no `FIREBASE_*` set, `packages/api` automatically uses an in-memory
  content store (see `packages/api/src/testing/memoryStore.ts` and the startup warning it
  prints). Edits genuinely work — create, edit, reorder, delete — they just reset every time
  the API process restarts.
- **Uploads**: with no `CLOUDINARY_URL` set, image/CV upload answers `503`. Everything else
  works; you just can't attach a new file until that's configured.

## Moving to a real deployment

Do these in any order; each one replaces exactly one placeholder.

### 1. Firestore

Create a Google Cloud project, enable Firestore, and create a service account with
Firestore access. Set in `packages/api/.env` (locally) or the Render dashboard (deployed):

```
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
```

(`FIREBASE_PRIVATE_KEY` is the full PEM block from the service account JSON, with literal
`\n` line breaks — `packages/api/src/firebaseAdmin.ts` un-escapes them.)

### 2. A real admin password

```
npm run hash-password
```

Set the printed value as `ADMIN_PASSWORD_HASH`, confirm you can still log in, then remove
`ADMIN_PASSWORD`.

### 3. A real `JWT_SECRET`

Any long random string, e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
The placeholder value in `.env.example` must not be used anywhere real.

### 4. Cloudinary (signed uploads)

The site's build-time images already use Cloudinary via an **unsigned** upload preset (see
`packages/web/src/lib/images.ts`) — that's a different, separate thing from what the admin
portal needs. Server-side uploads need a real signed API key: Cloudinary dashboard →
Settings → Access Keys, for the same cloud name (`o5hr8kjc`) the rest of the site already
uses. Set:

```
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@o5hr8kjc
```

### 5. Deploy `packages/api`

`render.yaml` (repo root) describes a free-tier Render web service. Provisioning it —
connecting the repo, setting the env vars above in the dashboard — is a one-time manual step
in Render; this file only describes the service once that's done.

Free-tier specifics worth knowing:

- The instance sleeps after ~15 minutes idle; the next request pays a 30-60s cold start.
  Point a free [UptimeRobot](https://uptimerobot.com) monitor at `/health` (not
  `/health/deps` — that one reads Firestore, so a 5-minute ping interval would burn real
  quota) to keep it warm for editors.
- `CORS_ORIGIN` needs to include the live site's real origin (`https://qalor.nl`) once
  deployed there.

### 6. Point the built site at it

Add `VITE_API_URL` as a **GitHub Actions secret** (Settings → Secrets and variables →
Actions → Secrets) set to the Render service's URL. `.github/workflows/ci.yml`'s `deploy`
job already reads it — see the comment right above the prerender step.

Until this is set, the built site simply has no admin-editable content wired in: the
`/admin` route still loads (it's static, bundled), but every save fails with "the server is
not configured" until `VITE_API_URL` points somewhere real, matching the equivalent
behaviour of `packages/api` itself when its own env vars are unset.
