import { useEffect, useState } from 'react';
import { useContent } from '../../context/ContentContext';
import { ABOUT_W, dprSrcSet, optimizeUrl } from '../../lib/images';

const About = () => {
  const { content } = useContent();
  const { eyebrow, heading, image, blocks } = content.about;
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Width alone isn't enough to decide the layout. A phone held in landscape is around
  // 915x412 — wide enough to pass for a tablet, so it used to get the side-by-side grid and
  // a 380px-tall image inside a 412px-tall viewport, which left almost nothing of either
  // column visible at once. A short viewport stacks regardless of how wide it is.
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const short = window.innerHeight <= 500;
      setIsMobile(width <= 768 || short);
      setIsTablet(!short && width > 768 && width <= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    // Rotating a phone doesn't always fire resize before the new dimensions settle.
    window.addEventListener('orientationchange', checkScreenSize);
    return () => {
      window.removeEventListener('resize', checkScreenSize);
      window.removeEventListener('orientationchange', checkScreenSize);
    };
  }, []);

  const headingSize = isMobile ? '2rem' : isTablet ? '2.25rem' : '2.5rem';
  const imageHeight = isMobile ? '300px' : isTablet ? '380px' : '450px';
  // A percentage, not the three fixed pixel offsets this used to have. The source photo is
  // portrait (600x800) and the frame is landscape, so `cover` scales it up and leaves a lot
  // of vertical overflow — how much depends entirely on the frame's aspect. On a phone in
  // landscape the frame is roughly 868x298, which overflows by ~859px, and a 50px nudge off
  // the top left the shot showing sky and roofline with both faces pushed out of frame. A
  // percentage is resolved against that overflow, so one value keeps the subjects framed at
  // every size instead of needing a new magic number per breakpoint.
  const imagePosition = 'center 20%';

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
            {`• ${eyebrow}`}
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
            src={optimizeUrl(image, ABOUT_W)}
            srcSet={dprSrcSet(image, ABOUT_W)}
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
