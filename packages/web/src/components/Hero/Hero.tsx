import { useEffect, useState } from 'react';
import { fullBleedSrcSet, optimizeUrl } from '../../lib/images';
import Particles from '../Particles/Particles';
import './Hero.css';

const heroImage = 'https://res.cloudinary.com/o5hr8kjc/image/upload/qalor/hero.jpg';

const smoothScrollTo = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  const start = window.pageYOffset;
  const target = element.offsetTop;
  const distance = target - start;
  const duration = 800;
  let startTime: number | null = null;

  const ease = (t: number, b: number, c: number, d: number) => {
    t /= d / 2;
    if (t < 1) return (c / 2) * t * t + b;
    t--;
    return (-c / 2) * (t * (t - 2) - 1) + b;
  };

  function animation(currentTime: number) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const run = ease(timeElapsed, start, distance, duration);
    window.scrollTo(0, run);
    if (timeElapsed < duration) requestAnimationFrame(animation);
  }

  requestAnimationFrame(animation);
};

const Hero = () => {
  // Lazy initializer, not a plain `false`: this section is prerendered at a desktop
  // viewport (see scripts/prerender.mjs), so a mobile visitor hydrating with `useState(false)`
  // painted the desktop layout first and only snapped to the mobile one once the effect
  // below ran — a real, measured layout shift (Lighthouse's layout-shifts audit pinned
  // ~95% of this page's CLS on this exact element). Reading the real width during the
  // first render, hydration or not, means there's nothing to snap to afterwards.
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  // Check for mobile screen size and orientation
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    window.addEventListener('orientationchange', checkScreenSize);
    return () => {
      window.removeEventListener('resize', checkScreenSize);
      window.removeEventListener('orientationchange', checkScreenSize);
    };
  }, []);

  // Inject CSS for hero contact button styling and wat wij doen button dot animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .wat-wij-doen-btn {
        position: relative;
        padding-bottom: 8px !important;
      }
      .wat-wij-doen-btn::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 6px;
        height: 6px;
        background-color: #000;
        border-radius: 50%;
        opacity: 0;
        transition: opacity 0.3s ease, transform 0.2s ease;
      }
      .wat-wij-doen-btn:hover::after {
        opacity: 1;
      }
      /* On touch devices, disable hover but allow click animation */
      @media (hover: none) {
        .wat-wij-doen-btn:hover::after {
          opacity: 0;
        }
      }
      .wat-wij-doen-btn.clicked::after {
        opacity: 1;
        transform: translateX(-50%) scale(1.8);
      }
      /* Override hover state when no-hover class is applied */
      .wat-wij-doen-btn.no-hover:hover::after {
        opacity: 0 !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    // No data-aos here: this is the LCP candidate, and AOS holds elements at
    // opacity:0 until scrolled into view — that would delay first paint of the
    // one thing that should paint first. See the migration plan for context.
    <section
      className="hero"
      style={{
        paddingBottom: '80px',
        paddingLeft: '20px',
        paddingRight: '20px',
        width: '100%',
        minHeight: isMobile ? 'calc(100vh - 100px)' : '60vh',
        height: 'auto',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '1600px',
          margin: '0 auto',
          width: '100%',
          // Full-brightness #FFA940/#F18825: everything on this panel is black text/icons,
          // not white, so nothing here needs darkening to clear 4.5:1 — black on either
          // stop is 8:1+.
          background: 'linear-gradient(135deg, #FFA940, #F18825)',
          borderRadius: '20px',
          padding: '60px 40px',
          position: 'relative',
        }}
      >
        <Particles />
        <div
          style={{
            display: isMobile ? 'flex' : 'grid',
            flexDirection: isMobile ? 'column' : 'row',
            gridTemplateColumns: isMobile ? 'none' : '1fr 1fr',
            gap: isMobile ? '3rem' : '5rem',
            alignItems: 'center',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Left side - Text content */}
          <div
            style={{
              textAlign: isMobile ? 'center' : 'left',
              order: 1,
              position: 'relative',
              zIndex: 3,
            }}
          >
            <h1
              style={{
                fontSize: isMobile ? '3rem' : '4rem',
                marginBottom: '1rem',
                color: '#000',
                fontWeight: '700',
                fontFamily:
                  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
                lineHeight: '1.2',
              }}
            >
              Welkom op de website van Qalor
            </h1>
            <h2
              style={{
                fontSize: isMobile ? '1.6rem' : '2rem',
                marginBottom: '2rem',
                color: '#000',
                fontWeight: '500',
                fontFamily:
                  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
              }}
            >
              Energiedeskundigen warmtenetten
            </h2>
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: isMobile ? 'center' : 'flex-start',
              }}
            >
              <button
                type="button"
                onClick={() => smoothScrollTo('footer')}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#fff',
                  color: '#000',
                  textDecoration: 'none',
                  borderRadius: '50px',
                  fontWeight: '600',
                  fontSize: isMobile ? '1rem' : '1.2rem',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontFamily:
                    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  outline: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Contact
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      backgroundColor: '#F18825',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#000',
                    }}
                  >
                    →
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={(e) => {
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
                  smoothScrollTo('qalor');
                }}
                onTouchEnd={(e) => {
                  // Blur to remove focus state on mobile
                  setTimeout(() => {
                    e.currentTarget.blur();
                  }, 50);
                }}
                className="wat-wij-doen-btn"
                style={{
                  padding: isMobile ? '0.8rem 1.5rem' : '1rem 2rem',
                  background: 'transparent',
                  color: '#000',
                  textDecoration: 'none',
                  borderRadius: '50px',
                  fontWeight: '600',
                  fontSize: isMobile ? '1rem' : '1.2rem',
                  border: 'none',
                  transition: 'all 0.3s ease',
                  fontFamily:
                    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  outline: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#fff';
                }}
                onFocus={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#fff';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#fff';
                }}
              >
                Wat wij doen
              </button>
            </div>
          </div>

          {/* Right side - Image */}
          <div
            style={{
              width: isMobile ? '90%' : '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: isMobile ? '40px' : '0',
              order: 2,
              position: 'relative',
              zIndex: 3,
            }}
          >
            <img
              src={optimizeUrl(heroImage, 1024)}
              srcSet={fullBleedSrcSet(heroImage)}
              sizes="(max-width: 768px) 100vw, 50vw"
              fetchPriority="high"
              alt="Energy efficiency"
              style={{
                width: '100%',
                height: isMobile ? '300px' : '100%',
                minHeight: isMobile ? '300px' : '400px',
                objectFit: 'cover',
                objectPosition: 'right center',
                borderRadius: '15px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
