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

export function optimizeUrl(url: string, w = 400, limit = false): string {
  if (!url.includes('/image/upload/')) return url;
  // Cloudinary 400s on a fractional width — callers pass computed values (slideWidth * 2,
  // where slideWidth comes from window.innerWidth * 0.9), which aren't always integers.
  const width = Math.round(w);
  // Portal uploads come back from Cloudinary with a version already in the path; only the
  // bundled URLs need one added.
  const version = HAS_VERSION.test(url) ? '' : `${ASSET_VERSION}/`;
  // c_limit caps at the source's own width instead of upscaling past it: several project
  // photos are under 1000px, and asking for more returns a bigger file with no more detail.
  const crop = limit ? ',c_limit' : '';
  const resized = url.replace(
    '/image/upload/',
    `/image/upload/q_auto,w_${width}${crop}/${version}`,
  );
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

/**
 * Width for a work-process step image.
 *
 * The step box is 550x300 with `object-fit: cover`, so for anything wider than 1.83:1 the
 * *height* binds, not the width: workprocess-berekening is 2.34:1, so filling 300px of height
 * needs ~703px of width. Asking for 550 delivered a 550x235 image that the browser then
 * stretched by 1.28 to cover the box — and by another 2 on a high-DPR screen. That is why
 * replacing the sources with upscaled ones changed nothing visible: delivery was the cap, not
 * the original.
 */
export const STEP_W = 750;

/**
 * `srcset` for a fixed-size image, as DPR candidates rather than widths.
 *
 * `w` descriptors need a `sizes` attribute to mean anything; these boxes are a fixed CSS size,
 * so 1x/2x says exactly what is needed and keeps the small file on ordinary screens.
 */
export function dprSrcSet(url: string, w: number): string {
  if (!url.includes('/image/upload/')) return '';
  return `${optimizeUrl(url, w)} 1x, ${optimizeUrl(url, w * 2)} 2x`;
}

/**
 * Width for the About portrait.
 *
 * It sits in a half-column of the 1400px grid at 450px tall with `object-fit: cover`, and the
 * photo is portrait (0.75:1) — narrower than the box, so the *width* binds at ~700px. The
 * previous fixed 600 was under that even at 1x, and less than half what a 2x screen needs.
 */
export const ABOUT_W = 700;

/**
 * Candidate widths for the About portrait.
 *
 * Capped at 1400 because the source is 1666x2221 — asking beyond it buys nothing but bytes.
 * The steps are chosen against what the layout actually asks for, not for roundness: 668 CSS px
 * at 2x wants 1336 and the widest phone branch at 3x wants ~1170, which is what 1400 and 1200
 * are for. 700 rather than 800 because the two cases that land there need 668 and 640 — a
 * desktop at 1x and a small phone at 2x — and 700 covers both for 82KB where 800 costs 99KB.
 */
const ABOUT_WIDTHS = [400, 600, 700, 1000, 1200, 1400];

/**
 * `srcset` for the About portrait, as widths rather than DPR candidates.
 *
 * dprSrcSet was the wrong tool here and cost real bytes. An x-descriptor says "the box is
 * always ABOUT_W wide", which is a desktop assumption: the box is 668 CSS px on a wide screen
 * but only `100vw - 40px` on a phone — 372 at 412. A 2.625x phone therefore took the 2x
 * candidate, w_1400 at 292KB, to fill a box needing 977. With widths and the `sizes` attribute
 * in About.tsx the same phone takes w_1000 at 174KB.
 *
 * Kept beside fullBleedSrcSet rather than merged with it: the hero is full-bleed and this sits
 * in a half-column, so they share a shape but never a width list.
 */
export function aboutSrcSet(url: string): string {
  if (!url.includes('/image/upload/')) return '';
  return ABOUT_WIDTHS.map((w) => `${optimizeUrl(url, w)} ${w}w`).join(', ');
}
