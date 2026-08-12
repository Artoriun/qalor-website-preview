# Qalor Website

The marketing site for Qalor — energy experts specialising in heating networks and sustainable
energy solutions. Prerendered to static HTML so the first response is real content, with every
section editable from an admin portal.

**Live preview:** https://artoriun.github.io/qalor-website-preview/

<img width="1440" alt="Qalor homepage in light mode" src=".github/readme-assets/homepage.png" />

<img width="1440" alt="The same page in dark mode — the navigation bar and page background go dark while the Hero's orange fill is unchanged" src=".github/readme-assets/homepage-dark.png" />

---

## Stack

| | |
| --- | --- |
| **Front end** | React, TypeScript, Vite |
| **Back end** | Express, Firestore |
| **Media** | Cloudinary |
| **Tooling** | TurboRepo, Biome, Playwright, Lighthouse |
| **Hosting** | FTP (production) · GitHub Pages (preview) |

---

## Quick start

```bash
npm install
npm run dev      # web + API
```

The admin portal at `/admin` works out of the box with local placeholders — no Firestore or
Cloudinary account needed to try it. See [ADMIN.md](ADMIN.md) for the full setup.

### Scripts

```bash
npm run build            # production build
npm run prerender        # capture each route's DOM into its own index.html
npm run ci               # everything CI runs, in order
npm run test:e2e         # Playwright layout and accessibility sweep
npm run check:budgets    # gzipped payload budget
npm run check:lighthouse # accessibility / SEO / best-practices gate
npm run hash-password    # prints an ADMIN_PASSWORD_HASH
```

---

## Features

- **Single-page marketing site** — Hero, Team, About, Werkproces, Projecten and Footer, all
  anchor-scrolled from the nav
- **Every section is admin-editable** at `/admin` — copy, images, team members and projects
  change without a redeploy
- **SEO landing pages** at `/warmtenet-tekening/`, `/warmtenet-ontwerp/`,
  `/warmtenetberekening/` and `/warmtenet-business-case/`, one per search intent, each with
  its own copy, title, canonical and `Service` schema. See [SEO.md](SEO.md)
- **WCAG AA dark mode** from the header, set by a blocking inline script before first paint so
  there is no flash of the wrong theme. Light is the standard first visit regardless of the OS
  setting
- **Shared carousel** for Team and Projecten — auto-advancing, drag and swipe, infinite wrap,
  pause button, arrow-key navigation and a `prefers-reduced-motion` opt-out
- **Team CVs** open in a modal rendered by the browser's own PDF viewer, no library
- **Images** from Cloudinary with automatic format, quality and size transforms

---

## Rendering

Hero and Navbar are eager, plain and undeferred, and carry no scroll-reveal: they are the
above-the-fold content, so deferring or fading them would delay the largest contentful paint
by exactly the length of the animation. Sections further down keep their reveal treatment.

`npm run prerender` boots the built app in a real browser on each route and writes the
resulting DOM back into that route's `index.html`. It gates itself: the build fails if a route
captures almost no text, logs a hydration error, or lays out differently once hydrated than it
did on first paint.

---

## Testing

`npm run ci` runs the pipeline in CI's order: Biome, `tsc`, API tests, a Playwright layout and
accessibility sweep, the suite again against the built output and its subpath variant, a
gzipped bundle budget, and Lighthouse.

Accessibility, SEO and best practices are gated at 100, and CLS at 0.05. Performance is
measured and printed but not gated — a shared runner's timings vary by more than the thing
being measured, while CLS describes the markup rather than the machine.

---

## Deployment

Production deploys by FTP from `master`, and only after every check passes. The GitHub Pages
preview above is built from `main` with a base path and a `noindex`.

**Node 22** is required (`.nvmrc`).
