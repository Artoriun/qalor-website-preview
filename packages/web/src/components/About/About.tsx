import { useEffect, useState } from 'react';
import { optimizeUrl } from '../../lib/images';

const peterhuubImg = 'https://res.cloudinary.com/o5hr8kjc/image/upload/qalor/about-peterhuub.jpg';

const About = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Check for mobile and tablet screen sizes
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsTablet(width > 768 && width <= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const headingSize = isMobile ? '2rem' : isTablet ? '2.25rem' : '2.5rem';
  const imageHeight = isMobile ? '300px' : isTablet ? '380px' : '450px';
  const imagePosition = isMobile ? 'center -50px' : isTablet ? 'center -90px' : 'center -125px';

  return (
    <section
      id="qalor"
      data-aos="fade-in"
      style={{ padding: '80px 20px', backgroundColor: '#f8f9fa', width: '100%' }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div
            style={{
              fontSize: '1.6rem',
              // #DF730E, not the #E5770F used elsewhere: this label sits on the section's
              // #f8f9fa background, not white, and #E5770F falls just short of 3:1 there.
              color: '#DF730E',
              marginBottom: '0.5rem',
              fontWeight: '400',
              fontFamily:
                'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
            }}
          >
            • Wat wij doen
          </div>
          <h2
            style={{
              fontSize: headingSize,
              margin: '0',
              color: '#333',
              fontWeight: '600',
              fontFamily:
                'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
            }}
          >
            Energiedeskundigen warmtenetten
          </h2>
        </div>

        <div
          style={{
            display: isMobile ? 'flex' : 'grid',
            flexDirection: isMobile ? 'column' : 'row',
            gridTemplateColumns: isMobile ? 'none' : '1fr 1fr',
            gap: isMobile ? '2rem' : '4rem',
            alignItems: 'center',
            marginBottom: '3rem',
          }}
        >
          {/* Left side - Three texts stacked */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
            <div
              style={{
                textAlign: isMobile ? 'center' : 'left',
                padding: isMobile ? '1.5rem' : '2rem',
              }}
            >
              {/* Title with checkmark */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                  justifyContent: isMobile ? 'center' : 'flex-start',
                }}
              >
                {/* Checkmark */}
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#F18825',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ color: '#2B1400', fontSize: '14px', fontWeight: 'bold' }}>✓</span>
                </div>

                <h3 style={{ fontSize: '1.5rem', margin: '0', color: '#000' }}>Wat is Qalor?</h3>
              </div>

              {/* Content */}
              <div>
                <p style={{ lineHeight: '1.6', color: '#555' }}>
                  Een samenwerking van drie recent gepensioneerde warmte-experts
                </p>
                <p style={{ lineHeight: '1.6', color: '#555', marginTop: '0.5rem' }}>
                  Met meer dan 130 jaar ervaring in de energie wereld waarvan meer dan 100 jaar bij
                  warmtebedrijven.
                </p>
              </div>
            </div>

            <div
              style={{
                textAlign: isMobile ? 'center' : 'left',
                padding: isMobile ? '1.5rem' : '2rem',
              }}
            >
              {/* Title with checkmark */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                  justifyContent: isMobile ? 'center' : 'flex-start',
                }}
              >
                {/* Checkmark */}
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#F18825',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ color: '#2B1400', fontSize: '14px', fontWeight: 'bold' }}>✓</span>
                </div>

                <h3 style={{ fontSize: '1.5rem', margin: '0', color: '#000' }}>
                  Onze werkzaamheden
                </h3>
              </div>

              {/* Content */}
              <div>
                <p style={{ lineHeight: '1.6', color: '#555' }}>
                  Wij richten ons op projectcalculaties en de daarbij behorende technische analyses.
                </p>
              </div>
            </div>

            <div
              style={{
                textAlign: isMobile ? 'center' : 'left',
                padding: isMobile ? '1.5rem' : '2rem',
              }}
            >
              {/* Title with checkmark */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                  justifyContent: isMobile ? 'center' : 'flex-start',
                }}
              >
                {/* Checkmark */}
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#F18825',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ color: '#2B1400', fontSize: '14px', fontWeight: 'bold' }}>✓</span>
                </div>

                <h3 style={{ fontSize: '1.5rem', margin: '0', color: '#000' }}>Ervaring</h3>
              </div>

              {/* Content */}
              <div>
                <p style={{ lineHeight: '1.6', color: '#555' }}>
                  Onze lange ervaring met het realiseren, onderhouden en exploiteren van warmte- en
                  koudenetten bij Eneco en haar rechtsvoorgangers zorgt voor een gedegen en
                  betrouwbare calculatie van uw warmteproject.
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Image */}
          <img
            src={optimizeUrl(peterhuubImg, 600)}
            alt="Peter & Huub"
            loading="lazy"
            data-aos="zoom-in"
            data-aos-delay="300"
            style={{
              width: '100%',
              height: imageHeight,
              objectFit: 'cover',
              objectPosition: imagePosition,
              borderRadius: '12px',
              boxShadow: '0 8px 25px rgba(241,136,37,0.2)',
            }}
          />
        </div>
      </div>
    </section>
  );
};

export default About;
