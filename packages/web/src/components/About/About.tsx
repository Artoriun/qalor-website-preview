import { useEffect, useState } from 'react';
import { useContent } from '../../context/ContentContext';
import { optimizeUrl } from '../../lib/images';

const About = () => {
  const { content } = useContent();
  const { eyebrow, heading, image, blocks } = content.about;
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
      style={{ padding: '80px 20px', backgroundColor: 'var(--bg-section)', width: '100%' }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div
            style={{
              fontSize: '1.6rem',
              // Section-background tier, not the stronger one: this label sits on
              // --bg-section, not white, and the stronger tier falls just short of 3:1 there.
              color: 'var(--accent-text-strong-section)',
              marginBottom: '0.5rem',
              fontWeight: '400',
              fontFamily:
                'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
            }}
          >
            • {eyebrow}
          </div>
          <h2
            style={{
              fontSize: headingSize,
              margin: '0',
              color: 'var(--text-heading)',
              fontWeight: '600',
              fontFamily:
                'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
            }}
          >
            {heading}
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
          {/* Left side - Blocks stacked, each with a checkmark title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
            {blocks.map((block) => (
              <div
                key={block.id}
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
                      background: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        color: 'var(--accent-on-fill)',
                        fontSize: '14px',
                        fontWeight: 'bold',
                      }}
                    >
                      ✓
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.5rem', margin: '0', color: 'var(--text-heading)' }}>
                    {block.title}
                  </h3>
                </div>

                {/* Content */}
                <div>
                  {block.body.split('\n\n').map((paragraph) => (
                    <p
                      key={paragraph}
                      style={{ lineHeight: '1.6', color: 'var(--text-body)', marginTop: '0.5rem' }}
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Right side - Image */}
          <img
            src={optimizeUrl(image, 600)}
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
