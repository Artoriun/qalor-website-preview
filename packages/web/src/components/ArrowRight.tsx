/**
 * The right-pointing arrow used in buttons across the site, drawn rather than typed.
 *
 * It used to be the character "→" (U+2192), which Inter does not contain: @fontsource's
 * unicode-range declares U+2191 and U+2193 and skips the one between them. So the glyph was
 * never rendered in the site's own typeface — the browser picked a system font for that one
 * character, and which font, and when, is a per-platform decision. On Android Chrome it
 * resolved late and at different metrics, so a cold load showed the arrow undersized and off
 * its baseline while a refresh looked right, the fallback being cached by then. Standing
 * still the same split was measurable: 18x20 in Chromium against 16.5x21.2 in WebKit.
 *
 * Drawing the shape makes it geometry instead of font fallback — identical on first paint,
 * on every engine, at whatever size the caller asks for.
 *
 * Decorative: every button using this already names itself in text, so it is hidden from
 * assistive tech rather than given a label that would be read twice.
 */
export default function ArrowRight({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 12h15M13 5.5l6.5 6.5-6.5 6.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
