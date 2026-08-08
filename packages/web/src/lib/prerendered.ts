/**
 * True when the document was written by scripts/prerender.mjs rather than served as the
 * empty SPA shell.
 *
 * Prerendered markup already reflects live content fetched at build time (see
 * ContentContext), so there's nothing to wait for on first paint — components that show a
 * loading state should skip it when this is true, the same way Hero already avoids a
 * mobile/desktop layout flash by reading the real state on first render instead of
 * defaulting to one and correcting later.
 */
export const IS_PRERENDERED =
  typeof document !== 'undefined' && document.documentElement.hasAttribute('data-prerendered');
