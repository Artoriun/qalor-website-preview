import { useEffect, useState } from 'react';
import qalorLogo from '../../assets/images/figures/qalorlogowhite.png';
import { useContent } from '../../context/ContentContext';
import Particles from '../Particles/Particles';

const linkStyle: React.CSSProperties = {
  color: '#2B1400',
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
  color: '#2B1400',
  textDecoration: 'none',
  outline: 'none',
};

const Footer = () => {
  const { content } = useContent();
  const { tagline, email, phone, address, addressUrl, btwNumber, iban, copyright } = content.footer;
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
        // Full-brightness #FFA940/#F18825, not a darkened shade: #2B1400 (warm espresso)
        // text clears 6.9-9.2:1 against both stops, so the fill doesn't need to be darkened
        // at all — only white-on-orange forced that tradeoff. The logo image stays white;
        // WCAG's own logotype exception covers it, and it reads fine against bright orange.
        background: 'linear-gradient(135deg, #FFA940, #F18825)',
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
                color: '#2B1400',
                fontFamily:
                  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
              }}
            >
              {tagline}
            </p>
          </div>

          {/* Menu Links */}
          <div>
            <h4
              style={{
                fontSize: '1.2rem',
                marginBottom: '1rem',
                color: '#2B1400',
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
                color: '#2B1400',
                fontFamily:
                  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
              }}
            >
              Contact
            </h4>
            <div
              style={{
                lineHeight: '2',
                color: '#2B1400',
                fontFamily:
                  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
              }}
            >
              <p>
                <a href={`mailto:${email}`} style={contactLinkStyle}>
                  {email}
                </a>
              </p>
              <p>
                <a href={`tel:${phone.replace(/\s+/g, '')}`} style={contactLinkStyle}>
                  {phone}
                </a>
              </p>
              <p>
                <a href={addressUrl} style={contactLinkStyle}>
                  {address}
                </a>
              </p>
              <p>
                <strong>Btw-nummer:</strong> {btwNumber}
              </p>
              <p>
                <strong>IBAN:</strong> {iban}
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid rgba(0,0,0,0.3)',
            paddingTop: '1rem',
            textAlign: 'left',
            color: '#2B1400',
          }}
        >
          <p
            style={{
              fontFamily:
                'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
            }}
          >
            {copyright}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
