import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import './Carousel.css';

// Must match the CSS transition duration on .carousel-track — this is how long the silent
// post-wrap reset (see the effect below) waits before assuming the slide animation has
// actually finished.
const TRANSITION_MS = 500;
// Pixels a drag must travel to commit to the next/prev slide rather than snap back. A flat
// value rather than a fraction of the slide width: a real swipe covers roughly the same
// physical distance on a phone as a pointer drag does on a wide desktop.
const DRAG_THRESHOLD = 50;
// Movement, more horizontal than vertical, before a pointer press counts as a drag rather
// than a tap or a vertical page scroll. Higher for touch than for a mouse: a finger tap on
// a phone routinely wanders several pixels, and at the mouse threshold those taps were
// being read as drags.
const DRAG_INTENT_MOUSE = 8;
const DRAG_INTENT_TOUCH = 16;
const MAX_SLIDE_WIDTH = 400;

function reducedMotionPreferred() {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Caps how far a fast drag visually pulls the track, so a long swipe still reads as
 *  dragging the row rather than detaching from the pointer entirely. */
function damp(dx: number, frameWidth: number) {
  const limit = frameWidth * 0.6;
  if (Math.abs(dx) <= limit) return dx;
  const excess = Math.abs(dx) - limit;
  return Math.sign(dx) * (limit + excess * 0.35);
}

function PrevIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <title>Vorige</title>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}
function NextIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <title>Volgende</title>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <title>Pauzeren</title>
      <path d="M8 5v14M16 5v14" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <title>Afspelen</title>
      <path d="M7 5l12 7-12 7Z" />
    </svg>
  );
}

type CarouselProps<T> = {
  items: T[];
  renderItem: (item: T) => ReactNode;
  /** Stable per item; the track renders three copies, so this gets suffixed per copy. */
  itemKey: (item: T, index: number) => string;
  /** Called on a real click — not on the click a drag release synthesises. */
  onItemClick?: (item: T) => void;
  autoplayMs: number;
  /** Describes the whole carousel to assistive tech, e.g. "Teamleden". */
  label: string;
  /** Slide height. Slides are fixed-height so the track doesn't jolt between items. */
  minHeight: { mobile: number; desktop: number };
};

/**
 * Auto-cycling, drag-swipeable carousel, shared by the Team and Projecten sections.
 *
 * Both used to hand-roll this separately — nearly 1000 lines between them, the same logic
 * under different variable names, and neither had a pause control. Auto-advancing content
 * with no way to stop it fails WCAG 2.2.2, and no automated check here catches that: axe
 * can't tell that something moves on a timer. Hence the pause button, the arrow keys and
 * the reduced-motion opt-out below — the reasons this consolidation was worth doing at all,
 * not incidental extras.
 *
 * A row of fixed-width slides moves as one via a single CSS `transform: translateX(...)`,
 * animated by a CSS transition. The item array is rendered three times back to back so
 * moving past either end keeps sliding in the same direction into a pixel-identical copy,
 * rather than jumping backwards through the whole row; once that transition has finished an
 * effect below silently — transition off for one frame — snaps the index back into the
 * middle copy at the equivalent position. Both positions render identically, so nothing
 * visibly moves.
 */
export function Carousel<T>({
  items,
  renderItem,
  itemKey,
  onItemClick,
  autoplayMs,
  label,
  minHeight,
}: CarouselProps<T>) {
  const count = items.length;
  const extended = count > 0 ? [...items, ...items, ...items] : [];

  // Index into `extended`, starting at the head of the middle copy. Deterministic — it must
  // be, since scripts/prerender.mjs captures this component's DOM and fails the build on a
  // hydration mismatch, so the first client render has to agree with the captured one.
  const [trackIndex, setTrackIndex] = useState(count);
  // Three independent things stop the autoplay and they must not share one flag: hovering
  // and focusing are transient (they end when the pointer or focus leaves), while the pause
  // button is a sticky choice the visitor made. Collapsed into a single boolean, clicking
  // the button toggled the `true` its own focus event had just set, so the button appeared
  // to do nothing wherever hover wasn't independently holding it — caught by
  // e2e/carousel.spec.ts on mobile, where there is no hover to mask it.
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const paused = userPaused || hovered || focused;
  const [dragPx, setDragPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [animate, setAnimate] = useState(true);
  // 400 on the first render for the same hydration reason as trackIndex; the real viewport
  // width is only consulted after mount.
  const [slideWidth, setSlideWidth] = useState(MAX_SLIDE_WIDTH);
  const [isMobile, setIsMobile] = useState(false);

  const frameRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  // Which slide the press started on. Needed because the click has to be handled on the
  // frame rather than per slide — see the frame's onClick below.
  const pressedItemRef = useRef<T | null>(null);

  const index = count > 0 ? ((trackIndex % count) + count) % count : 0;

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setSlideWidth(mobile ? Math.min(window.innerWidth * 0.9, MAX_SLIDE_WIDTH) : MAX_SLIDE_WIDTH);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // An item deleted in the admin portal while this is open must not leave trackIndex
  // pointing past the end of a now-shorter extended[].
  useEffect(() => {
    if (count > 0 && trackIndex >= count * 3) setTrackIndex(count);
  }, [count, trackIndex]);

  // The silent post-wrap reset described in the doc comment above.
  useEffect(() => {
    if (count === 0 || (trackIndex >= count && trackIndex < count * 2)) return;
    const timer = setTimeout(() => {
      setAnimate(false);
      setTrackIndex((i) => (i >= count * 2 ? i - count : i + count));
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    }, TRANSITION_MS + 30);
    return () => clearTimeout(timer);
  }, [trackIndex, count]);

  // trackIndex is a dependency despite not being read: every slide change, whether from
  // this timer or a manual one, should restart the countdown rather than race an old one.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see comment above
  useEffect(() => {
    if (paused || isDragging || count < 2) return;
    // A slideshow that keeps moving after someone has asked for less motion is exactly what
    // this media query exists to prevent, and a plain setTimeout is invisible to any
    // CSS-level reduced-motion handling.
    if (reducedMotionPreferred()) return;
    const timer = setTimeout(() => setTrackIndex((i) => i + 1), autoplayMs);
    return () => clearTimeout(timer);
  }, [trackIndex, paused, isDragging, count, autoplayMs]);

  const next = () => count >= 2 && setTrackIndex((i) => i + 1);
  const prev = () => count >= 2 && setTrackIndex((i) => i - 1);

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (count < 2) return;
    if ((e.target as HTMLElement).closest('.carousel-btn')) return;
    // A new press is always a fresh gesture: any synthetic click left over from a previous
    // drag has already fired by now, so nothing is left to swallow.
    isDraggingRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    const slide = (e.target as HTMLElement).closest<HTMLElement>('.carousel-slide');
    const idx = slide ? Number(slide.dataset.idx) : Number.NaN;
    pressedItemRef.current = Number.isNaN(idx) ? null : extended[idx];
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const start = dragStartRef.current;
    if (!start || count < 2) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;

    if (!isDraggingRef.current) {
      // Vertical intent wins: this must not hijack a page scroll that happens to start on
      // the carousel.
      const intent = e.pointerType === 'mouse' ? DRAG_INTENT_MOUSE : DRAG_INTENT_TOUCH;
      if (Math.abs(dx) < intent || Math.abs(dx) < Math.abs(dy)) return;
      isDraggingRef.current = true;
      setIsDragging(true);
      setAnimate(false);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    // Deliberately no preventDefault() here. Calling it on a pointermove suppresses the
    // compatibility mouse events, and with them the click — so *any* press that wandered
    // past the intent threshold produced no click at all, which is what made a slide need
    // pressing twice on a phone to open a CV. Scrolling and text selection are already
    // handled declaratively by `touch-action: pan-y` and `user-select: none` on the frame,
    // so nothing here needs the default suppressed.
    setDragPx(damp(dx, frameRef.current?.offsetWidth || 1));
  }

  function onPointerEnd(e: ReactPointerEvent<HTMLDivElement>) {
    const start = dragStartRef.current;
    dragStartRef.current = null;
    if (!isDraggingRef.current || !start) return;

    const dx = e.clientX - start.x;
    const committed = Math.abs(dx) > DRAG_THRESHOLD;

    // Only swallow the click when the gesture actually moved the carousel. A press that
    // engaged the drag but never reached the commit threshold is, as far as the visitor is
    // concerned, a tap — and swallowing that one was why a slide had to be pressed twice on
    // a phone to open anything: the first press wandered past the intent threshold, so its
    // click was discarded, and only a stiller second press got through.
    if (committed) {
      // Cleared shortly after release rather than immediately: the pointerup that ends a
      // drag still fires a synthetic click on the slide underneath a moment later, and the
      // slide's handler reads this ref to swallow that one click.
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 100);
    } else {
      isDraggingRef.current = false;
    }

    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
    setAnimate(true);
    setDragPx(0);
    if (committed) setTrackIndex((i) => i + (dx < 0 ? 1 : -1));
  }

  function onKeyDown(e: ReactKeyboardEvent<HTMLElement>) {
    if (count < 2) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    }
  }

  if (count === 0) return null;

  const step = slideWidth;
  const visible = isMobile ? 1 : 3;

  return (
    // Focus pauses it as well as hover: a keyboard or touch user has no hover state, and
    // WCAG 2.2.2 wants a way to stop auto-advancing content regardless of input device.
    <section
      className="carousel"
      aria-roledescription="carousel"
      aria-label={label}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setHovered(false)}
      onKeyDown={onKeyDown}
    >
      {/* biome-ignore lint/a11y/useSemanticElements: role="group" below has no native
          equivalent for a slide viewport — see the note by that attribute. */}
      <div
        ref={frameRef}
        // Focusable so the arrow-key handling on the section above is actually reachable:
        // without a tab stop here, arrows only work once focus happens to be on one of the
        // buttons below, which is not something a keyboard user can discover. The prev/next
        // buttons remain the primary control; this makes the shortcut real rather than
        // theoretical. The ARIA carousel pattern puts the tab stop on the slides container
        // exactly like this; the rule below only knows that a div is not natively focusable.
        // biome-ignore lint/a11y/noNoninteractiveTabindex: deliberate tab stop, see above
        tabIndex={0}
        // Focus pauses only within the frame — the slides themselves — not on the controls
        // below. Focusing the play button is an explicit request to resume; if that also
        // counted as "focus is inside, so pause", pressing play would do nothing until you
        // clicked away, which is exactly what e2e/carousel.spec.ts caught.
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false);
        }}
        // No native element carries this meaning — <fieldset> is the closest semantic match
        // and is for form controls, not a slide viewport. `group` plus a label is what the
        // ARIA carousel pattern specifies.
        role="group"
        aria-label="Sleep of gebruik de pijltjestoetsen om te bladeren"
        className={`carousel-frame${isDragging ? ' is-dragging' : ''}`}
        style={{
          width: `${step * visible}px`,
          minHeight: isMobile ? minHeight.mobile : minHeight.desktop,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        // Handled here rather than on each slide: once a drag engages, setPointerCapture
        // retargets the eventual click to this frame, so a per-slide handler simply never
        // ran after any press that wandered — which is what made a card need pressing twice
        // on a phone. Resolving the slide from where the press started works whether or not
        // capture was involved. A click on something interactive inside a slide (the CV
        // link) stops propagation and never reaches this.
        // The keyboard path is the CV link inside the card and the buttons below; this
        // handler is a mouse convenience on top of them.
        onClick={() => {
          if (isDraggingRef.current) return;
          const item = pressedItemRef.current;
          if (item !== null) onItemClick?.(item);
        }}
      >
        <div
          className="carousel-track"
          style={{
            transform: `translateX(calc(-1 * ${trackIndex} * ${step}px + ${dragPx}px))`,
            transition: animate ? undefined : 'none',
          }}
        >
          {extended.map((item, i) => {
            // Only the middle copy is exposed to assistive tech: the outer two are the
            // pixel-identical duplicates that make the infinite wrap work, and announcing
            // every item three times is worse than not announcing the duplicates at all.
            // Deliberately different from hiding everything except the one at trackIndex —
            // three slides are visible at desktop width, and hiding two of them would take
            // real, on-screen content away from a screen reader.
            //
            // `inert`, not aria-hidden: these slides contain focusable elements (the team
            // cards' CV buttons), and aria-hidden alone leaves them tabbable while telling
            // screen readers to ignore them — a keyboard user lands on a control that
            // announces nothing. axe reports that as aria-hidden-focus, which is how it was
            // caught here. inert takes the subtree out of the tab order and the
            // accessibility tree together.
            const isDuplicate = i < count || i >= count * 2;
            return (
              <div
                // `extended` is three fixed, never-reordered copies of `items`, so the index
                // is as stable an identity here as the item's own key — which repeats three
                // times and cannot be the key on its own.
                // biome-ignore lint/suspicious/noArrayIndexKey: see comment above
                key={`${itemKey(item, i % count)}-${i}`}
                className="carousel-slide"
                data-idx={i}
                style={{ width: `${step}px` }}
                inert={isDuplicate}
              >
                {renderItem(item)}
              </div>
            );
          })}
        </div>
      </div>

      <div className="carousel-controls">
        <button type="button" className="carousel-btn" onClick={prev} aria-label="Vorige">
          <PrevIcon />
        </button>
        <button
          type="button"
          className="carousel-btn"
          onClick={() => setUserPaused((p) => !p)}
          // Reflects the explicit choice, not the effective state: the button must not
          // relabel itself to "resume" merely because the pointer is hovering.
          aria-label={
            userPaused ? 'Doorgaan met automatisch wisselen' : 'Automatisch wisselen pauzeren'
          }
          aria-pressed={userPaused}
        >
          {userPaused ? <PlayIcon /> : <PauseIcon />}
        </button>
        <button type="button" className="carousel-btn" onClick={next} aria-label="Volgende">
          <NextIcon />
        </button>
      </div>

      <div className="carousel-dots">
        {items.map((item, i) => (
          <button
            key={itemKey(item, i)}
            type="button"
            className={`carousel-dot${i === index ? ' is-active' : ''}`}
            aria-label={`Ga naar ${i + 1} van ${count}`}
            aria-current={i === index || undefined}
            onClick={() => setTrackIndex(count + i)}
          />
        ))}
      </div>
    </section>
  );
}
