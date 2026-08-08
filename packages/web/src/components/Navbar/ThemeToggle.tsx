import { useTheme } from '../../context/ThemeContext';

function SunIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#F18825"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="#2B1400" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

/** A switch, not a button-that-cycles: the knob position and aria-pressed both encode
 * state, so it reads correctly whether you're looking at it or using a screen reader. */
const ThemeToggle = () => {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Schakel naar lichte modus' : 'Schakel naar donkere modus'}
      aria-pressed={isDark}
      style={{
        position: 'relative',
        width: '44px',
        height: '24px',
        borderRadius: '999px',
        border: 'none',
        background: isDark ? 'var(--accent-on-fill)' : 'var(--border)',
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
        transition: 'background 0.2s ease',
        outline: 'none',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '2px',
          left: isDark ? '22px' : '2px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'left 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
      >
        {isDark ? <MoonIcon /> : <SunIcon />}
      </span>
    </button>
  );
};

export default ThemeToggle;
