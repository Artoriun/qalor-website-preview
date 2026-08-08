import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';

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
  const [theme, setTheme] = useState<Theme>(currentTheme);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem('theme', next);
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
