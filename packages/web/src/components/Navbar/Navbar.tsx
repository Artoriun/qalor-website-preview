import { type CSSProperties, useEffect, useRef, useState } from 'react';
import qalorLogo from '../../assets/images/figures/qalor logo.png';
import './Navbar.css';
import ThemeToggle from './ThemeToggle';

const navbarStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
  background: 'var(--bg-page)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  padding: '0.5rem 0',
};

const navbarInnerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '95%',
  margin: '0 auto',
  maxWidth: '1400px',
};

const navButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-heading)',
  cursor: 'pointer',
  fontSize: 'inherit',
  fontFamily: 'inherit',
  outline: 'none',
};

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Reused on /admin now (see Admin.tsx) as well as the marketing page, where these
  // section ids don't exist — a plain scrollIntoView there would silently do nothing.
  // Off the homepage, navigate there with the anchor instead of pretending the click
  // worked.
  const smoothScrollTo = (elementId: string) => {
    if (window.location.pathname !== '/') {
      window.location.href = `/#${elementId}`;
      return;
    }
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
    setIsMenuOpen(false); // Close mobile menu after clicking
  };

  const handleNavClick = (elementId: string) => (e: React.MouseEvent<HTMLButtonElement>) => {
    // Add clicked class for animation
    e.currentTarget.classList.add('clicked');
    setTimeout(() => {
      e.currentTarget.classList.remove('clicked');
      // On mobile, force remove any hover state after animation
      if ('ontouchstart' in window) {
        e.currentTarget.classList.add('no-hover');
        setTimeout(() => {
          e.currentTarget.classList.remove('no-hover');
        }, 100);
      }
    }, 200);
    smoothScrollTo(elementId);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLButtonElement>) => {
    // Blur to remove focus state on mobile
    setTimeout(() => {
      e.currentTarget.blur();
    }, 50);
  };

  return (
    <nav style={navbarStyle}>
      <div style={navbarInnerStyle}>
        {/* Logo on the left */}
        <div
          style={{ fontWeight: 'bold', fontSize: '1.5rem', display: 'flex', alignItems: 'center' }}
        >
          {/* Replace with actual logo image if available */}
          <img
            src={qalorLogo}
            alt="Qalor Logo"
            style={{
              height: '48px',
              cursor: 'pointer',
              transition: 'transform 0.3s ease',
              transform: 'scale(1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onClick={(e) => {
              // Create click animation - scale up momentarily
              e.currentTarget.style.transition = 'transform 0.15s ease';
              e.currentTarget.style.transform = 'scale(1.3)';

              setTimeout(() => {
                e.currentTarget.style.transition = 'transform 0.3s ease';
                e.currentTarget.style.transform = 'scale(1)';
              }, 150);

              if (window.location.pathname !== '/') {
                window.location.href = '/';
                return;
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setIsMenuOpen(false);
            }}
          />
        </div>

        {/* Desktop Navigation Links */}
        <ul className="navbar-desktop-nav">
          <li>
            <button
              onClick={handleNavClick('team')}
              onTouchEnd={handleTouchEnd}
              style={navButtonStyle}
              type="button"
            >
              Ons team
            </button>
          </li>
          <li>
            <button
              onClick={handleNavClick('qalor')}
              onTouchEnd={handleTouchEnd}
              style={navButtonStyle}
              type="button"
            >
              Qalor
            </button>
          </li>
          <li>
            <button
              onClick={handleNavClick('how-it-works')}
              onTouchEnd={handleTouchEnd}
              style={navButtonStyle}
              type="button"
            >
              Ons werkproces
            </button>
          </li>
          <li>
            <button
              onClick={handleNavClick('projects')}
              onTouchEnd={handleTouchEnd}
              style={navButtonStyle}
              type="button"
            >
              Projecten
            </button>
          </li>
        </ul>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ThemeToggle />

          {/* Desktop Contact button */}
          <button
            type="button"
            onClick={() => smoothScrollTo('footer')}
            className="navbar-desktop-contact"
            style={{
              // Full-brightness #F18825, not a darkened shade: #2B1400 (warm espresso) text
              // on it clears 6.89:1 (well past the 4.5:1 floor), so there's no need to
              // darken the fill itself — only white-on-orange needed that. Same reason this
              // isn't redefined for dark mode: the pairing's contrast never depended on the
              // page background.
              background: 'var(--accent)',
              color: 'var(--accent-on-fill)',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '50px',
              padding: '0.5rem 1rem',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--accent)';
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                pointerEvents: 'none', // Prevent hover effects on text and arrow
              }}
            >
              <span style={{ pointerEvents: 'none' }}>Contact</span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#fff',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: 'var(--accent-on-fill)',
                  pointerEvents: 'none', // Prevent hover effects on arrow
                }}
              >
                →
              </span>
            </span>
          </button>

          {/* Mobile Hamburger Menu */}
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={toggleMenu}
              className="navbar-hamburger"
              aria-label="Menu"
              aria-expanded={isMenuOpen}
            >
              <div className="navbar-hamburger-line" />
              <div className="navbar-hamburger-line" />
              <div className="navbar-hamburger-line" />
            </button>

            {/* Mobile Dropdown Menu */}
            {isMenuOpen && (
              <div className="navbar-mobile-menu">
                <button
                  type="button"
                  onClick={() => smoothScrollTo('team')}
                  className="navbar-mobile-menu-item"
                  style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
                >
                  Ons team
                </button>
                <button
                  type="button"
                  onClick={() => smoothScrollTo('qalor')}
                  className="navbar-mobile-menu-item"
                  style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
                >
                  Qalor
                </button>
                <button
                  type="button"
                  onClick={() => smoothScrollTo('how-it-works')}
                  className="navbar-mobile-menu-item"
                  style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
                >
                  Ons werkproces
                </button>
                <button
                  type="button"
                  onClick={() => smoothScrollTo('projects')}
                  className="navbar-mobile-menu-item"
                  style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
                >
                  Projecten
                </button>
                <button
                  type="button"
                  onClick={() => smoothScrollTo('footer')}
                  className="navbar-mobile-menu-item contact"
                  style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
                >
                  Contact
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
