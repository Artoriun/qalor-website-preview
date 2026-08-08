# Qalor Website

The marketing site for Qalor — energy experts specializing in heating networks and
sustainable energy solutions. A **TurboRepo** monorepo: **React**, **TypeScript** and
**Vite** on the front, prerendered to static HTML for real content on first paint. CI
gates every deploy on lint, typecheck, a Playwright layout/accessibility sweep, a
Lighthouse audit and a bundle budget — nothing publishes unless all of it passes.

**Live preview site:** https://artoriun.github.io/qalor-website-preview/

<img width="1440" alt="Qalor homepage" src=".github/readme-assets/homepage.png" />

## Features

- Single-page site — Hero, Team, Qalor/About, Werkproces, Projecten and Footer, all
  anchor-scrolled from the nav. No client-side router: an earlier `react-router-dom`
  dependency was dead weight (nothing ever rendered a `<Route>`) and got dropped in the
  TypeScript port.
- **Every section is admin-editable at `/admin`** — no code change or redeploy needed to
  update copy, images, team members, or projects. See [ADMIN.md](ADMIN.md).
- Prerendered on build: a real browser boots the built app and its DOM is written back
  into `index.html`, so a visitor's first response is actual content, not a blank shell
  waiting on JavaScript.
- Team and project carousels — auto-advancing, drag/swipe-enabled, infinite-wrap.
- Team member CVs open in a modal PDF viewer (`@react-pdf-viewer/core`).
- Below-the-fold sections (Team, About, Werkproces, Projecten, Footer) are
  `React.lazy()` + `Suspense` — only Hero/Navbar, the above-the-fold content, are in the
  initial bundle.
- Images served from Cloudinary with automatic format/quality/size transforms
  (`packages/web/src/lib/images.ts`).
- Contact form component exists (`src/components/Contact`) but isn't wired into the page
  yet — see the commented-out `<Contact />` in `App.tsx`.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **React** + **TypeScript** + **Vite** | UI, type safety, build & dev server |
| **Express** + **Firestore** + **JWT** | Admin API (`packages/api`) — see [ADMIN.md](ADMIN.md) |
| **Cloudinary** | Image hosting/transforms, plus admin-portal uploads |
| **TurboRepo** + npm workspaces | Monorepo build orchestration |
| **AOS** | Scroll-reveal on below-the-fold sections only — never on the Hero, see [Rendering & LCP](#rendering--lcp) |
| **@react-pdf-viewer/core** | Team member CV modal |
| **Biome** | Linting & formatting |
| **Playwright** | Layout tests, the accessibility sweep, and the prerenderer |
| **axe-core** | WCAG rules, run inside the Playwright suite |
| **Lighthouse** | CI gate on accessibility/SEO/best-practices |

## Project Structure

```
.nvmrc                    # Node 22 — required
playwright.config.ts      # 3 viewport projects (desktop, mobile portrait, mobile landscape)
biome.json                 # lint + format config
turbo.json                  # build/dev/typecheck task graph
e2e/
├── layout.spec.ts        # overflow, exactly one h1, footer bounds, hamburger menu, CV modal
└── a11y.spec.ts           # axe sweep at every viewport
scripts/
├── prerender.mjs          # captures the built app's DOM into index.html + sitemap.xml/robots.txt
├── check-budgets.mjs       # gzipped initial-payload budget
└── check-lighthouse.mjs    # accessibility/SEO/best-practices thresholds on the built output
packages/
├── shared/src/index.ts    # typed content schema + bundled defaults for every section — one
│                          #   file, no relative imports; see the note at the top for why
├── api/                   # admin API: Express + Firestore + JWT auth, see ADMIN.md
│   └── src/routes/        # auth.ts, content.ts (singleton + list section merge logic)
└── web/                   # the Vite/React app
    ├── public/            # PDF worker, team CVs, favicon
    └── src/
        ├── components/    # one folder per section, each reading from ContentContext
        ├── context/       # ContentContext.tsx — bundle/prerender/live-API content merge
        └── pages/Admin.tsx  # the admin portal itself, lazy-loaded at /admin
```

## Quick Start

```bash
npm install
npm run dev            # web on http://localhost:5173, api on http://localhost:4000
```

The admin portal (`/admin`) works out of the box with local placeholders — no Firestore or
Cloudinary account needed to try it. See [ADMIN.md](ADMIN.md).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server and the admin API together |
| `npm run build` | Typecheck-clean production build (`turbo run build`) |
| `npm run typecheck` | `tsc --noEmit` across every package |
| `npm run check` | Biome lint + format check |
| `npm run format` | Biome format, writes fixes |
| `npm run test:api` | API unit tests (auth, content merge/override, rate limiting) |
| `npm run test:e2e` | Playwright layout + accessibility suite |
| `npm run prerender` | Capture the built app's DOM into `index.html`; needs `npm run build` first |
| `npm run check:budgets` | Gzipped initial-payload budget |
| `npm run check:lighthouse` | Lighthouse gate; needs `build` + `prerender` first |
| `npm run hash-password` | Prints an `ADMIN_PASSWORD_HASH` for a password you type in |

## Rendering & LCP

The Hero section used to be both `React.lazy()`-loaded behind a Suspense fallback *and*
marked `data-aos="fade-up"` — meaning first paint was a loading spinner, and even once
loaded, AOS held it at `opacity: 0` until a scroll-triggered reveal fired. Both are gone:
Hero and Navbar are eager, plain, undeferred, and carry no `data-aos`. Team lost its
`data-aos` too — it's the first below-the-fold section, close enough to the fold that on
some viewports it was still mid-fade when scanned, which showed up as a real,
non-deterministic color-contrast failure (`e2e/a11y.spec.ts` caught it) and would have
made the Lighthouse accessibility gate flaky in CI. Below-the-fold sections further down
the page (About, Werkproces, Projecten, Footer) keep their scroll-reveal treatment —
they're far enough down that this isn't a risk.

## Testing

`npm run test:e2e` runs layout assertions (no horizontal overflow, exactly one `h1`,
nothing renders past the footer, the mobile hamburger menu works, the team CV modal
opens/closes) and an axe-core accessibility sweep, both across desktop and two mobile
viewports. `npm run check:lighthouse` audits the built, prerendered output and gates on
accessibility/SEO/best-practices at 100 — performance is measured and printed but never
gated, since a shared CI runner's timings vary by more than the thing being measured.
`npm run check:budgets` is the deterministic half of that: a gzipped bundle-size ceiling.

## Deployment

CI's `deploy` job builds, prerenders, and uploads `packages/web/dist/` over FTP to the
live host on every push to `master` — never from a pull request, and additionally on a
weekly schedule so admin-portal edits reach crawlers even without a manual redeploy (see
[ADMIN.md](ADMIN.md)). Needs repo secrets (**Settings → Secrets and variables → Actions**):

- `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`
- Optionally a repo **variable** `FTP_SERVER_DIR` if the account's FTP root isn't the
  site's document root (defaults to `/`)
- `VITE_API_URL`, once the admin API is deployed — see [ADMIN.md](ADMIN.md) for the full
  walkthrough (Firestore, Cloudinary, Render, all still on local placeholders today)

## Licence

© Qalor. All rights reserved. This code is proprietary — it's shared here for
portfolio/demonstration purposes only and isn't licensed for reuse, redistribution, or
modification.
