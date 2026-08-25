import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { IS_PRERENDERED } from '../lib/prerendered';

export type Theme = 'light' | 'dark';

interface ThemeValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeValue>({ theme: 'light', toggle: () => {} });

/**
 * Reads whatever index.html's inline script already resolved into
 * document.documentElement.dataset.theme — not localStorage or matchMedia directly, and
 * not a plain `useState('light')` corrected in an effect. That script runs before this
 * module even evaluates (see its comment), so the attribute is already correct by the
 * time this lazy initializer runs; reading it here means the very first render is right,
 * the same reasoning Hero.tsx documents for its own isMobile state, applied to a value
 * React doesn't otherwise know about at all.
 */
function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  /**
   * Prerendered markup is always captured light — the prerenderer runs in a fresh browser
   * with nothing in localStorage — so a returning visitor who chose dark would otherwise
   * render ThemeToggle's "Schakel naar lichte modus" against markup that says "Schakel naar
   * donkere modus", and React would discard the whole page over one aria-label.
   *
   * Start where the markup is and correct immediately after. Nothing visible moves: the
   * colours come from data-theme and CSS custom properties, which index.html's blocking
   * script already set before first paint. Only the toggle's own label and icon settle a
   * frame later, and only for visitors who are in dark mode to begin with.
   */
  const [theme, setTheme] = useState<Theme>(() => (IS_PRERENDERED ? 'light' : currentTheme()));

  useEffect(() => {
    setTheme(currentTheme());
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try {
        // 'theme-v2' is the same key index.html's pre-paint script reads — see its comment
        // for why it carries a version. Nothing asserts these two strings match, so a typo
        // here ships a toggle that silently stops persisting and no test goes red.
        localStorage.setItem('theme-v2', next);
      } catch {
        // Private browsing / storage disabled: the toggle still works for this load,
        // it just won't be remembered next visit.
      }
      return next;
    });
  }, []);

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}
