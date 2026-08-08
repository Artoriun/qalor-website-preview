import { useEffect, useState } from 'react';
import { optimizeUrl } from '../../lib/images';
import './WorkProcess.css';

const CLOUDINARY = 'https://res.cloudinary.com/o5hr8kjc/image/upload';
const nettekeningImg = `${CLOUDINARY}/qalor/workprocess-nettekening.jpg`;
const gebouwendatabaseImg = `${CLOUDINARY}/qalor/workprocess-gebouwendatabase.jpg`;
const berekeningImg = `${CLOUDINARY}/qalor/workprocess-berekening.jpg`;

const learnMoreButtonStyle = (compact: boolean): React.CSSProperties => ({
  padding: compact ? '0.75rem 1.5rem' : '1rem 2rem',
  background: 'transparent',
  color: '#000',
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
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: compact ? '1.5rem' : '2rem',
  fontWeight: 'bold',
  boxShadow: shadow,
  border: compact ? '3px solid #fff' : '4px solid #fff',
  position: 'relative',
  zIndex: 3,
});

type Step = {
  number: string;
  title: string;
  body: string;
  image: string;
  alt: string;
  gradient: string;
  shadow: string;
};

const STEPS: Step[] = [
  {
    number: '01',
    title: 'Het vervaardigen van een nettekening in AutoCAD',
    body: 'Een betrouwbare calculatie van een warmteproject vereist dat als eerste er een kundige nettekening in AutoCAD wordt gemaakt. De basis voor de ondergrond is daarbij immer een oriëntatiemelding van het Kadaster die de bezetting van de ondergrond gedetailleerd weergeeft.',
    image: nettekeningImg,
    alt: 'AutoCAD Nettekening',
    // All three steps share one gradient (the previous per-step variants were also part
    // of the inconsistent-orange problem). Same hue as the logo's #F18825, darkened just
    // enough to clear 3:1 against white — fine here since the badge digits are large/bold.
    gradient: 'linear-gradient(135deg, #E5770F, #D9720C)',
    shadow: '0 4px 15px rgba(241,136,37,0.3)',
  },
  {
    number: '02',
    title: 'Het maken van de gebouwendatabase',
    body: 'Een betrouwbare bepaling van de vermogensbehoefte van het warmteproject vereist dat er op basis van diverse openbare bronnen, waaronder het BAG-register en Atlas Leefomgeving, er een complete gebouwendatabase opgesteld wordt.',
    image: gebouwendatabaseImg,
    alt: 'Gebouwendatabase',
    gradient: 'linear-gradient(135deg, #E5770F, #D9720C)',
    shadow: '0 4px 15px rgba(241,136,37,0.3)',
  },
  {
    number: '03',
    title: 'Het maken van de exploitatieberekening',
    body: "Op basis van de AutoCAD tekening, de woningendatabase en de bepaling van het concept en de investeringen van de energie-opwekinstallatie wordt een uitgebreid financieel model in Excel gevuld, waarbij op basis van verschillende uitgangspunten diverse scenario's worden gemaakt.",
    image: berekeningImg,
    alt: 'Exploitatieberekening',
    gradient: 'linear-gradient(135deg, #E5770F, #D9720C)',
    shadow: '0 4px 15px rgba(241,136,37,0.3)',
  },
];

const WorkProcess = () => {
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
        backgroundColor: '#fff',
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
              color: '#E5770F',
              marginBottom: '0.5rem',
              fontWeight: '400',
              fontFamily:
                'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
            }}
          >
            • Hoe wij te werk gaan
          </div>
          <h2
            style={{
              fontSize: '2.5rem',
              margin: '0',
              color: '#333',
              fontWeight: '600',
              fontFamily:
                'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
            }}
          >
            Ons werkproces
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
            maxWidth: isLandscape && useMobileLayout ? '700px' : 'none',
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
                background: 'linear-gradient(180deg, #E5770F, #D9720C)',
                transform: 'translateX(-50%)',
                zIndex: 1,
                borderRadius: '2px',
              }}
            />
          )}

          {STEPS.map((step, index) => {
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
                  src={optimizeUrl(step.image, 550)}
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
                <div style={numberBadgeStyle(step.gradient, step.shadow, false)}>{step.number}</div>
              </div>
            );
            const text = (
              <div style={{ flex: '1' }}>
                <h3
                  style={{
                    fontSize: '1.8rem',
                    marginBottom: '1.5rem',
                    color: '#333',
                    lineHeight: '1.3',
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    lineHeight: '1.7',
                    color: '#555',
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
                  <span style={{ fontSize: '1rem' }}>→</span>
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
                        flex: '0 0 60px',
                        minWidth: '60px',
                        maxWidth: '60px',
                        width: '60px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        position: 'relative',
                        left: 0,
                        marginLeft: 0,
                        boxSizing: 'border-box',
                      }}
                    >
                      <div style={numberBadgeStyle(step.gradient, step.shadow, true)}>
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
                        maxWidth: isLandscape ? '500px' : 'none',
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            fontSize: '1.5rem',
                            marginBottom: '1rem',
                            color: '#333',
                            lineHeight: '1.3',
                          }}
                        >
                          {step.title}
                        </h3>
                        <p
                          style={{
                            lineHeight: '1.6',
                            color: '#555',
                            marginBottom: '1.5rem',
                            fontSize: '1rem',
                          }}
                        >
                          {step.body}
                        </p>
                      </div>

                      <img
                        src={optimizeUrl(step.image, 550)}
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
                        <span style={{ fontSize: '1rem' }}>→</span>
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
