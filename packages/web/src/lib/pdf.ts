/**
 * packages/shared stores CV paths root-relative ('/documents/...') because it can't depend
 * on Vite's import.meta.env — that file is also imported directly by Node in
 * scripts/prerender.mjs, outside Vite entirely. Prefixing here, where Vite's env exists, is
 * what makes them resolve when the site isn't served from the domain root (the GitHub Pages
 * preview lives under a project subpath). An admin-uploaded CV is an absolute Cloudinary URL
 * instead, and must be left alone.
 */
export const withBase = (path: string) =>
  /^https?:\/\//.test(path) ? path : `${import.meta.env.BASE_URL.replace(/\/$/, '')}${path}`;

/**
 * Whether this browser will actually render a PDF inside an <iframe>.
 *
 * Chrome on Android does not: it replaces the frame with a grey "CV_....pdf / Open" prompt,
 * so the modal is worse than useless there — it hides the page behind a panel that shows
 * nothing. iOS Safari has its own long-standing trouble with the same thing. Both are touch
 * devices, and every browser that does embed PDFs properly is on a machine with a mouse, so
 * pointer type is the closest honest proxy for the capability. It cannot be feature-detected
 * directly: a browser that declines to render simply paints nothing and reports no error.
 *
 * Where this returns false the CV is opened directly instead — which is what those browsers
 * do well, in their own full-screen viewer.
 */
export const canEmbedPdf = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;
