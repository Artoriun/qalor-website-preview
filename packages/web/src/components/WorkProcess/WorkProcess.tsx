import { useEffect, useState } from 'react';
import { useContent } from '../../context/ContentContext';
import { dprSrcSet, optimizeUrl, STEP_W } from '../../lib/images';
import './WorkProcess.css';
import ArrowRight from '../ArrowRight';

// Every step shares one look (see the note in the STEPS array this replaced) — not part of
// the admin-editable WorkProcessStep shape, since it's presentation, not content.
const STEP_GRADIENT = 'linear-gradient(135deg, #FFA940, #F18825)';
const STEP_SHADOW = '0 4px 15px rgba(241,136,37,0.3)';

const learnMoreButtonStyle = (compact: boolean): React.CSSProperties => ({
  padding: compact ? '0.75rem 1.5rem' : '1rem 2rem',
  background: 'transparent',
  color: 'var(--text-heading)',
  border: 'none',
  borderRadius: compact ? '6px' : '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: compact ? '0.9rem' : '1rem',
  transition: 'all 0.3s ease',
  boxShadow: 'none',
  alignSelf: compact ? 'flex-start' : undefined,
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  outline: 'none',
});

const numberBadgeStyle = (
  gradient: string,
  shadow: string,
  compact: boolean,
): React.CSSProperties => ({
  width: compact ? '60px' : '80px',
  height: compact ? '60px' : '80px',
  borderRadius: '50%',
  background: gradient,
  color: 'var(--accent-on-fill)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: compact ? '1.5rem' : '2rem',
  fontWeight: 'bold',
  boxShadow: shadow,
  border: compact ? '3px solid var(--bg-page)' : '4px solid var(--bg-page)',
  position: 'relative',
  zIndex: 3,
});

// The landscape step row is [badge column][gap][content], and the content is capped so the
// line length stays readable on a short, wide screen. The container has to be exactly that
// wide too: at any wider value the row can't fill it, and `margin: 0 auto` then centres a
// container whose content sits against its left edge — which reads as the whole section
// being off-centre, because it is.
const LANDSCAPE_BADGE_COL = 60;
const LANDSCAPE_ROW_GAP = 24; // 1.5rem
const LANDSCAPE_CONTENT_MAX = 500;
const LANDSCAPE_GROUP_MAX = LANDSCAPE_BADGE_COL + LANDSCAPE_ROW_GAP + LANDSCAPE_CONTENT_MAX;

const WorkProcess = () => {
  const { content } = useContent();
  const { eyebrow, heading } = content.workProcessIntro;
  const steps = content.workProcessSteps;
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isTablet, setIsTablet] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setWindowWidth(width);
      setIsTablet(width >= 769 && width <= 1024);
      setIsLandscape(width > height && width / height > 1.2); // Landscape if significantly wider than tall
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;
  const useMobileLayout = isMobile || isTablet;

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
    <section
      id="how-it-works"
      data-aos="fade-right"
      style={{
        padding: useMobileLayout ? (isLandscape ? '60px 15px' : '80px 20px') : '80px 20px',
        backgroundColor: 'var(--bg-page)',
        width: '100%',
        overflow: 'hidden', // Prevent horizontal overflow in landscape
        position: 'relative', // Ensure proper positioning context
        margin: '0 auto', // Ensure section itself is centered
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%',
          position: 'relative', // Ensure proper positioning context
          transform: 'translateX(0)', // Prevent any transform issues from AOS
          left: 0, // Ensure no left positioning offset
          right: 0, // Ensure no right positioning offset
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div
            style={{
              fontSize: '1.6rem',
              color: 'var(--accent-text-strong)',
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
              fontSize: '2.5rem',
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
            display: 'flex',
            flexDirection: 'column',
            gap: useMobileLayout ? '3rem' : '4rem',
            position: 'relative',
            // Narrow + center the whole group (line and steps together) as one unit in
            // landscape mobile. This used to be applied per-step instead (each step
            // individually narrowed/centered while the line stayed fixed to the outer
            // edge), which put the line and the badges it should align with in
            // different coordinate spaces — a real misalignment on landscape phones.
            width: isLandscape && useMobileLayout ? '90%' : '100%',
            maxWidth: isLandscape && useMobileLayout ? `${LANDSCAPE_GROUP_MAX}px` : 'none',
            margin: isLandscape && useMobileLayout ? '0 auto' : '0',
          }}
        >
          {/* Single vertical line for mobile/tablet, absolutely positioned in steps container */}
          {useMobileLayout && <div className="vertical-line-mobile" />}

          {/* Vertical connecting line - Desktop only */}
          {!useMobileLayout && (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '80px',
                bottom: '80px',
                width: '3px',
                background: 'linear-gradient(180deg, #FFA940, #F18825)',
                transform: 'translateX(-50%)',
                zIndex: 1,
                borderRadius: '2px',
              }}
            />
          )}

          {steps.map((step, index) => {
            // Desktop alternates image side: even steps image-left, odd steps image-right.
            const imageFirst = index % 2 === 0;
            const image = (
              <div
                style={{
                  flex: '1',
                  height: '250px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={optimizeUrl(step.image, STEP_W)}
                  srcSet={dprSrcSet(step.image, STEP_W)}
                  loading="lazy"
                  alt={step.alt}
                  style={{
                    height: '300px',
                    width: '100%',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    boxShadow: '0 8px 25px rgba(0,123,255,0.15)',
                  }}
                />
              </div>
            );
            const number = (
              <div
                style={{
                  flex: '0 0 120px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div style={numberBadgeStyle(STEP_GRADIENT, STEP_SHADOW, false)}>{step.number}</div>
              </div>
            );
            const text = (
              <div style={{ flex: '1' }}>
                <h3
                  style={{
                    fontSize: '1.8rem',
                    marginBottom: '1.5rem',
                    color: 'var(--text-heading)',
                    lineHeight: '1.3',
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    lineHeight: '1.7',
                    color: 'var(--text-body)',
                    marginBottom: '2rem',
                    fontSize: '1.1rem',
                  }}
                >
                  {step.body}
                </p>
                <button
                  type="button"
                  onClick={() => smoothScrollTo('footer')}
                  style={learnMoreButtonStyle(false)}
                >
                  Meer leren
                  <ArrowRight size={16} />
                </button>
              </div>
            );

            return (
              <div
                key={step.number}
                style={{
                  display: 'flex',
                  alignItems: useMobileLayout ? 'flex-start' : 'center',
                  gap: useMobileLayout ? '1.5rem' : '3rem',
                  minHeight: useMobileLayout ? 'auto' : '300px',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {useMobileLayout ? (
                  <>
                    {/* Number on left */}
                    <div
                      style={{
                        flex: `0 0 ${LANDSCAPE_BADGE_COL}px`,
                        minWidth: `${LANDSCAPE_BADGE_COL}px`,
                        maxWidth: `${LANDSCAPE_BADGE_COL}px`,
                        width: `${LANDSCAPE_BADGE_COL}px`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        position: 'relative',
                        left: 0,
                        marginLeft: 0,
                        boxSizing: 'border-box',
                      }}
                    >
                      <div style={numberBadgeStyle(STEP_GRADIENT, STEP_SHADOW, true)}>
                        {step.number}
                      </div>
                    </div>

                    {/* Content area */}
                    <div
                      style={{
                        flex: '1',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                        maxWidth: isLandscape ? `${LANDSCAPE_CONTENT_MAX}px` : 'none',
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            fontSize: '1.5rem',
                            marginBottom: '1rem',
                            color: 'var(--text-heading)',
                            lineHeight: '1.3',
                          }}
                        >
                          {step.title}
                        </h3>
                        <p
                          style={{
                            lineHeight: '1.6',
                            color: 'var(--text-body)',
                            marginBottom: '1.5rem',
                            fontSize: '1rem',
                          }}
                        >
                          {step.body}
                        </p>
                      </div>

                      <img
                        src={optimizeUrl(step.image, STEP_W)}
                        srcSet={dprSrcSet(step.image, STEP_W)}
                        loading="lazy"
                        alt={step.alt}
                        style={{
                          height: '260px',
                          width: '100%',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          boxShadow: '0 8px 25px rgba(241,136,37,0.15)',
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => smoothScrollTo('footer')}
                        style={learnMoreButtonStyle(true)}
                      >
                        Meer leren
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </>
                ) : imageFirst ? (
                  <>
                    {image}
                    {number}
                    {text}
                  </>
                ) : (
                  <>
                    {text}
                    {number}
                    {image}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WorkProcess;
