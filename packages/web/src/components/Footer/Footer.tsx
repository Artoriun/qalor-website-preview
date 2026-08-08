import { useEffect, useState } from 'react';
import qalorLogo from '../../assets/images/figures/qalorlogowhite.png';
import Particles from '../Particles/Particles';

const linkStyle: React.CSSProperties = {
  color: 'white',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
  fontSize: 'inherit',
  padding: 0,
  textAlign: 'left',
  outline: 'none',
};

const contactLinkStyle: React.CSSProperties = {
  color: 'white',
  textDecoration: 'none',
  outline: 'none',
};

const Footer = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const smoothScrollTo = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  return (
    <footer
      className="footer-section"
      id="footer"
      data-aos="fade-in"
      style={{
        padding: isMobile ? '2rem 1rem' : '2rem 20px',
        // #B75F0C/#733C07: same hue as the brand orange, darkened to clear 4.5:1 against
        // white — this section has real body text (contact details) directly on top.
        background: 'linear-gradient(135deg, #B75F0C, #733C07)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Particles />
      <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: isMobile ? '1.5rem' : '2rem',
            marginBottom: '2rem',
            padding: isMobile ? '0 0.5rem' : '0',
          }}
        >
          {/* Company Info */}
          <div>
            <img
              src={qalorLogo}
              alt="Qalor Logo"
              loading="lazy"
              style={{
                height: '48px',
                marginBottom: '1rem',
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
            <p
              style={{
                lineHeight: '1.6',
                color: 'white',
                fontFamily:
                  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
              }}
            >
              Energiedeskundigen warmtenetten
            </p>
          </div>

          {/* Menu Links */}
          <div>
            <h4
              style={{
                fontSize: '1.2rem',
                marginBottom: '1rem',
                color: 'white',
                fontFamily:
                  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
              }}
            >
              Menu
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2' }}>
              <li>
                <button type="button" onClick={() => smoothScrollTo('team')} style={linkStyle}>
                  Ons team
                </button>
              </li>
              <li>
                <button type="button" onClick={() => smoothScrollTo('qalor')} style={linkStyle}>
                  Qalor
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => smoothScrollTo('how-it-works')}
                  style={linkStyle}
                >
                  Ons werkproces
                </button>
              </li>
              <li>
                <button type="button" onClick={() => smoothScrollTo('projects')} style={linkStyle}>
                  Projecten
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4
              style={{
                fontSize: '1.2rem',
                marginBottom: '1rem',
                color: 'white',
                fontFamily:
                  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
              }}
            >
              Contact
            </h4>
            <div
              style={{
                lineHeight: '2',
                color: 'white',
                fontFamily:
                  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
              }}
            >
              <p>
                <a href="mailto:pdk@qalor.nl" style={contactLinkStyle}>
                  pdk@qalor.nl
                </a>
              </p>
              <p>
                <a href="tel:0611216938" style={contactLinkStyle}>
                  06 112 16 938
                </a>
              </p>
              <p>
                <a href="https://maps.app.goo.gl/svtgb5ivAYVd9MXAA" style={contactLinkStyle}>
                  Lange Marktstraat 1, 8911AD, Leeuwarden
                </a>
              </p>
              <p>
                <strong>Btw-nummer:</strong> NL005077048B43
              </p>
              <p>
                <strong>IBAN:</strong> NL94 ABNA 0134 0861 39
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.6)',
            paddingTop: '1rem',
            textAlign: 'left',
            color: 'white',
          }}
        >
          <p
            style={{
              fontFamily:
                'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
            }}
          >
            Copyright @ 2025 Qalor
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
