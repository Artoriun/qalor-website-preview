# Qalor Website

The marketing site for Qalor — energy experts specializing in heating networks and
sustainable energy solutions. A **TurboRepo** monorepo: **React**, **TypeScript** and
**Vite** on the front, prerendered to static HTML for real content on first paint. CI
gates every deploy on lint, typecheck, a Playwright layout/accessibility sweep, a
Lighthouse audit and a bundle budget — nothing publishes unless all of it passes.

**Live preview site:** https://artoriun.github.io/qalor-website-preview/

<img width="1440" alt="Qalor homepage in light mode" src=".github/readme-assets/homepage.png" />

<img width="1440" alt="The same page in dark mode — the navigation bar and page background go dark while the Hero's orange fill is unchanged" src=".github/readme-assets/homepage-dark.png" />

## Features

- Single-page marketing site — Hero, Team, Qalor/About, Werkproces, Projecten and Footer,
  all anchor-scrolled from the nav. No client-side router: an earlier `react-router-dom`
  dependency was dead weight (nothing ever rendered a `<Route>`) and got dropped in the
  TypeScript port; the handful of extra routes below are plain `pathname` checks.
- **Every section is admin-editable at `/admin`** — no code change or redeploy needed to
  update copy, images, team members, or projects. See [ADMIN.md](ADMIN.md).
- **WCAG AA dark mode**, toggled from the header. CSS custom properties on `:root`,
  redefined under `[data-theme="dark"]` and set by a blocking inline script in
  `index.html` before first paint — so there's no flash of the wrong theme and nothing for
  React to disagree with on hydration. Light is the standard first visit regardless of the
  OS setting; only an explicit toggle (persisted to `localStorage`) switches it. The
  orange *fills* are deliberately theme-invariant: a button's own background against its
  own label never depended on the page behind it.
- **SEO landing pages** at `/warmtenet-tekening/`, `/warmtenet-ontwerp/`,
  `/warmtenetberekening/` and `/warmtenet-business-case/` — one page per search intent,
  each with its own copy, title, canonical and `Service` schema. See [SEO.md](SEO.md).
- Prerendered on build: a real browser boots the built app on each route and writes the
  resulting DOM back into that route's `index.html`, so a visitor's (or crawler's) first
  response is actual content, not a blank shell waiting on JavaScript.
- Team and project carousels share one component
  (`packages/web/src/components/Carousel/`) — auto-advancing, drag/swipe-enabled,
  infinite-wrap, with a pause button, arrow-key navigation, position dots and a
  `prefers-reduced-motion` opt-out. The two used to hand-roll the same logic separately and
  neither could be stopped, which fails WCAG 2.2.2 — and no automated check catches that,
  since axe can't tell that something moves on a timer.
- Team member CVs open in a modal rendered by the browser's own PDF viewer — an `<iframe>`,
  no library. The previous `@react-pdf-viewer/core` + self-hosted pdf.js worker transferred
  1.54MB to display a 102KB document; 1.09MB of that was the worker alone.
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
├── fixtures.ts           # shared `test`: any uncaught page error fails the test
├── layout.spec.ts        # overflow, one h1, footer bounds, CV modal, landscape geometry
├── carousel.spec.ts       # drag threshold/snap-back, pause + resume, arrow keys, overflow
├── touch.spec.ts          # touch-only behaviour (the rest of the matrix has no touch)
├── subpath.spec.ts        # the build served from a project subpath
└── a11y.spec.ts           # axe sweep at every viewport, light and dark, incl. the CV modal
scripts/
├── lib/static-server.mjs  # serves dist like the real host (base path, 404.html); shared
├── serve-dist.mjs         # CLI wrapper, used as Playwright's webServer for the built output
├── prerender.mjs          # captures each route's DOM into <route>/index.html, + sitemap/robots/llms
├── check-budgets.mjs       # gzipped initial-payload budget
└── check-lighthouse.mjs    # accessibility/SEO/best-practices thresholds on the built output
packages/
├── shared/src/index.ts    # typed content schema + bundled defaults for every section, and
│                          #   SERVICE_PAGES (the SEO landing pages) — one file, no relative
│                          #   imports; see the note at the top for why
├── api/                   # admin API: Express + Firestore + JWT auth, see ADMIN.md
│   └── src/routes/        # auth.ts, content.ts (singleton + list section merge logic)
└── web/                   # the Vite/React app
    ├── public/            # team CVs, favicon, .htaccess (SPA 404 fallback)
    └── src/
        ├── components/    # one folder per section, each reading from ContentContext
        ├── context/       # ContentContext.tsx — bundle/prerender/live-API content merge
        └── pages/         # Admin.tsx (lazy, /admin) and ServicePage.tsx (the SEO routes)
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
| `npm run test:e2e` | Playwright suite against the dev server |
| `npm run test:e2e:dist` | The same suite against the built, prerendered output |
| `npm run test:e2e:subpath` | The subpath build (as GitHub Pages serves it) |
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
viewports. The sweep covers the home page, a service landing page and the admin sign-in
screen, each in **both light and dark mode** — the dark pass flips the real header toggle
rather than pre-seeding `localStorage`, so it exercises the toggle itself as well as the
tokens underneath it. `npm run check:lighthouse` audits the built, prerendered output and gates on
accessibility/SEO/best-practices at 100 — performance is measured and printed but never
gated, since a shared CI runner's timings vary by more than the thing being measured.
`npm run check:budgets` is the deterministic half of that: a gzipped bundle-size ceiling.

`npm run prerender` gates itself too: it fails the build if a route captures almost no text,
if any route logs a React hydration error, or if a route **lays out differently once
hydrated** than it did on first paint. That last one exists because a React error is not the
only way prerendering goes wrong: a component that decides its layout from
`window.innerWidth` hydrates "cleanly" while a phone visibly watches the heading jump from
4rem to 3rem, because the prerendered HTML was captured at a desktop viewport.

The suite runs three times in CI: against the dev server, against the built and prerendered
output, and against a build made for the GitHub Pages project subpath. The last two are not
redundant — prerendering and base paths are where several bugs have lived, and neither
exists on the dev server.

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

Two build-time env vars matter outside CI:

| Variable | Effect |
|---|---|
| `VITE_BASE` | Base path. `/` for the real domain; `/qalor-website-preview/` for the GitHub Pages preview. Read by `vite.config.ts` **and** `prerender.mjs`, so build and preview can't disagree. |
| `NOINDEX=1` | Adds a `robots` noindex to every prerendered page and drops the sitemap line from `robots.txt`. Set on preview builds so they don't compete with qalor.nl — see [SEO.md](SEO.md). |

## Licence

© Qalor. All rights reserved. This code is proprietary — it's shared here for
portfolio/demonstration purposes only and isn't licensed for reuse, redistribution, or
modification.
