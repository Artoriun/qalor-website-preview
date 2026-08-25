import { DEFAULT_SITE_CONTENT, type SiteContent } from '@qalor/shared';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { apiGetContent, HAS_API } from '../lib/api';
import { IS_PRERENDERED } from '../lib/prerendered';

/**
 * Content, seeded from the bundle and refreshed from the API.
 *
 * Seeding from `DEFAULT_SITE_CONTENT` rather than an empty/null state is deliberate and
 * load-bearing:
 *
 *   - Hydration compares the client's first render against the prerendered markup. A blank
 *     initial state renders a different tree, React discards the server HTML, and the
 *     Largest Contentful Paint candidate (Hero's own headline/image) is thrown away with it
 *     — the exact failure mode Hero.tsx's isMobile lazy-initializer comment already
 *     documents for a different reason.
 *   - Free tiers sleep. If the API never answers, the site still shows its content instead
 *     of nothing.
 *
 * The prerenderer renders from the live API, which drifts from the bundle as soon as
 * anything is edited in the portal, so it injects `window.__CONTENT__` describing what the
 * markup actually holds. The client starts from that when present.
 */
declare global {
  interface Window {
    __CONTENT__?: SiteContent;
  }
}

const SEED: SiteContent =
  (typeof window !== 'undefined' && window.__CONTENT__) || DEFAULT_SITE_CONTENT;

interface ContentValue {
  content: SiteContent;
  loading: boolean;
  refresh: () => Promise<void>;
}

const ContentContext = createContext<ContentValue>({
  content: SEED,
  loading: false,
  refresh: async () => {},
});

/**
 * Replace state only when the content actually changed.
 *
 * A parsed JSON response is always a new object, so `setContent(fresh)` never matches
 * React's identity check and re-renders every consumer even when the API returned exactly
 * what is already on screen — which is the normal case, since the prerendered markup was
 * built from this same API. Once the page hydrates rather than remounting, that redundant
 * commit is the only thing left that can repaint after first paint.
 *
 * Stringify is enough here and cheaper than it looks: SiteContent is plain JSON, both sides
 * come from the same serialiser so key order is stable, and this runs once per page load.
 */
function sameContent(a: SiteContent, b: SiteContent): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(SEED);
  // Prerendered pages start settled: their markup is already build-time accurate, so there
  // is nothing to wait for and no reason to show a loading state.
  const [loading, setLoading] = useState(!IS_PRERENDERED);

  const refresh = useCallback(async () => {
    if (!HAS_API) return;
    try {
      const fresh = await apiGetContent();
      setContent((prev) => (sameContent(prev, fresh) ? prev : fresh));
    } catch {
      // Keep whatever we have. A failed refresh must not blank the page.
    }
  }, []);

  useEffect(() => {
    // Static-only deployment: the bundled content is all there is, and it is already shown.
    if (!HAS_API) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const fresh = await apiGetContent();
        if (!cancelled) setContent((prev) => (sameContent(prev, fresh) ? prev : fresh));
      } catch {
        // ignored, see refresh()
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Memoised so the provider does not hand every consumer a new object on each render —
  // without it the `setLoading(false)` commit alone re-renders the whole subtree.
  const value = useMemo(() => ({ content, loading, refresh }), [content, loading, refresh]);

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent(): ContentValue {
  return useContext(ContentContext);
}
