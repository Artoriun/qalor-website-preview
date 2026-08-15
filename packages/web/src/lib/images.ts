import { ASSET_VERSION } from '@qalor/shared';
/**
 * Inject Cloudinary format/quality/resize transforms into an image URL.
 *
 * `q_auto` picks a quality level from the image content, and swapping the file extension
 * to `.webp` forces WebP delivery — together doing most of the work: the untransformed
 * originals ran up to 6MB (heechterp2.png), the reason the pre-migration Lighthouse
 * performance score was in the 50s with a 6.5s LCP.
 *
 * Extension-swap, not `f_auto`/`f_webp` as a transformation parameter (TurboHamstarter's
 * sibling helper uses `f_auto`, and that was this file's first version too): verified
 * directly against this account with curl, `f_auto`/`f_webp` silently served the original
 * JPEG instead of WebP for several of the uploaded images, reproducibly, regardless of
 * width or Accept header — while the extension-swap form converted every one of them
 * correctly, every time. WebP alone (no AVIF fallback) is an acceptable trade for that
 * reliability; browser support for WebP alone is effectively universal now.
 */
/** Cloudinary URLs that already carry their own version, which must not be doubled up. */
const HAS_VERSION = /\/image\/upload\/(?:[^/]+\/)*v\d+\//;

export function optimizeUrl(url: string, w = 400): string {
  if (!url.includes('/image/upload/')) return url;
  // Cloudinary 400s on a fractional width — callers pass computed values (slideWidth * 2,
  // where slideWidth comes from window.innerWidth * 0.9), which aren't always integers.
  const width = Math.round(w);
  // Portal uploads come back from Cloudinary with a version already in the path; only the
  // bundled URLs need one added.
  const version = HAS_VERSION.test(url) ? '' : `${ASSET_VERSION}/`;
  const resized = url.replace('/image/upload/', `/image/upload/q_auto,w_${width}/${version}`);
  return resized.replace(/\.(jpe?g|png)$/i, '.webp');
}

/** Width for full-bleed images (the hero photo) as opposed to smaller in-content ones. */
export const FULL_BLEED_W = 1200;

/** Candidate widths for the full-bleed hero image's `srcset`. */
const FULL_BLEED_WIDTHS = [480, 768, 1024, 1200];

/** `srcset` for a full-bleed image. Empty for non-Cloudinary URLs, which cannot be
 *  resized — the caller's plain `src` still applies. */
export function fullBleedSrcSet(url: string): string {
  if (!url.includes('/image/upload/')) return '';
  return FULL_BLEED_WIDTHS.map((w) => `${optimizeUrl(url, w)} ${w}w`).join(', ');
}
