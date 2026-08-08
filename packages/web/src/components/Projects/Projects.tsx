import { useEffect, useRef, useState } from 'react';
import { useContent } from '../../context/ContentContext';
import { optimizeUrl } from '../../lib/images';

const AUTOPLAY_MS = 5000;

const Projects = () => {
  const { content } = useContent();
  const { eyebrow, heading } = content.projectsIntro;
  const PROJECTS = content.projects;
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const [prevClicked, setPrevClicked] = useState(false);
  const [nextClicked, setNextClicked] = useState(false);
  const [current, setCurrent] = useState(3);
  const [transition, setTransition] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [slideWidth, setSlideWidth] = useState(400);

  // Drag functionality state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragStartSlide, setDragStartSlide] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setSlideWidth(mobile ? Math.min(window.innerWidth * 0.9, 400) : 400);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Infinite slides logic
  const infiniteSlides = [...PROJECTS.slice(-3), ...PROJECTS, ...PROJECTS.slice(0, 3)];

  const advance = () => {
    setCurrent((prev) => {
      if (prev === PROJECTS.length + 2) {
        setTimeout(() => {
          setTransition(false);
          setCurrent(3);
          setTimeout(() => setTransition(true), 50);
        }, 500);
      }
      return prev + 1;
    });
  };

  const restartAutoplay = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(advance, AUTOPLAY_MS);
  };

  useEffect(() => {
    timerRef.current = setInterval(advance, AUTOPLAY_MS);
    return () => clearInterval(timerRef.current);
  }, []);

  const handlePrev = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    setPrevClicked(true);
    setTimeout(() => setPrevClicked(false), 250);
    setTransition(true);
    if (current === 3) {
      setCurrent(2);
      setTimeout(() => {
        setTransition(false);
        setCurrent(PROJECTS.length + 2);
        setTimeout(() => setTransition(true), 50);
      }, 500);
    } else {
      setCurrent(current - 1);
    }

    restartAutoplay();
  };

  const handleNext = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    setNextClicked(true);
    setTimeout(() => setNextClicked(false), 250);
    setTransition(true);
    if (current === PROJECTS.length + 2) {
      setCurrent(PROJECTS.length + 3);
      setTimeout(() => {
        setTransition(false);
        setCurrent(3);
        setTimeout(() => setTransition(true), 50);
      }, 500);
    } else {
      setCurrent(current + 1);
    }

    restartAutoplay();
  };

  // Drag event handlers
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isDragging) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setIsDragging(true);
    setDragStart(clientX);
    setDragStartSlide(current);
    setDragOffset(0);
    setTransition(false);

    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const offset = clientX - dragStart;
    setDragOffset(offset);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;

    setIsDragging(false);
    setTransition(true);

    const threshold = slideWidth * 0.3; // 30% of slide width to trigger change

    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0) {
        // Dragged right - go to previous slide
        setPrevClicked(true);
        setTimeout(() => setPrevClicked(false), 250);
        if (current === 3) {
          setCurrent(2);
          setTimeout(() => {
            setTransition(false);
            setCurrent(PROJECTS.length + 2);
            setTimeout(() => setTransition(true), 50);
          }, 500);
        } else {
          setCurrent(current - 1);
        }
      } else {
        // Dragged left - go to next slide
        setNextClicked(true);
        setTimeout(() => setNextClicked(false), 250);
        if (current === PROJECTS.length + 2) {
          setCurrent(PROJECTS.length + 3);
          setTimeout(() => {
            setTransition(false);
            setCurrent(3);
            setTimeout(() => setTransition(true), 50);
          }, 500);
        } else {
          setCurrent(current + 1);
        }
      }
    } else {
      // Snap back to current slide
      setCurrent(dragStartSlide);
    }

    setDragOffset(0);
    restartAutoplay();
  };

  return (
    <section
      id="projects"
      data-aos="fade-right"
      style={{ padding: '80px 20px', backgroundColor: 'var(--bg-section)', width: '100%' }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div
            style={{
              fontSize: '1.6rem',
              // Section-background tier, not the stronger one: this label sits on
              // --bg-section, not white, and the stronger tier falls just short of 3:1 there.
              color: 'var(--accent-text-strong-section)',
              marginBottom: '0.5rem',
              fontWeight: '400',
            }}
          >
            • {eyebrow}
          </div>
          <h2
            style={{
              fontSize: '2.5rem',
              margin: '0 0 1rem 0',
              color: 'var(--text-heading)',
              fontWeight: '600',
            }}
          >
            {heading}
          </h2>
        </div>
        <div
          style={{
            position: 'relative',
            width: isMobile ? '90vw' : `${slideWidth * 3}px`,
            maxWidth: isMobile ? '90vw' : `${slideWidth * 3}px`,
            margin: '0 auto',
            height: isMobile ? 'auto' : '350px',
            minHeight: isMobile ? '320px' : '350px',
            padding: '0',
            overflow: 'hidden',
            boxSizing: 'border-box',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
          }}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          <div
            style={{
              display: 'flex',
              transform: `translateX(-${current * slideWidth - dragOffset}px)`,
              transition: transition && !isDragging ? 'transform 0.5s ease-in-out' : 'none',
              height: '100%',
            }}
          >
            {infiniteSlides.map((project, idx) => (
              <div
                key={`slide-${idx}`}
                style={{
                  width: slideWidth,
                  flexShrink: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: isMobile ? '0 10px' : '0 20px',
                  cursor: isDragging ? 'grabbing' : 'default',
                  pointerEvents: isDragging ? 'none' : 'auto',
                }}
              >
                <div
                  style={{
                    // The visible card is capped at 350px wide (see maxWidth below) even
                    // though the slide itself can be wider — retina-sized off the actual
                    // display cap, not off slideWidth, which was requesting up to 800px
                    // for something that never renders wider than 700px.
                    background: `#fff url(${optimizeUrl(project.image, Math.min(slideWidth, 350) * 2)}) center/cover no-repeat`,
                    borderRadius: '8px',
                    textAlign: 'center',
                    width: '100%',
                    maxWidth: isMobile ? '100%' : '350px',
                    minHeight: isMobile ? '280px' : '280px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    boxShadow: '0 8px 25px rgba(241,136,37,0.15)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      left: '0',
                      right: '0',
                      textAlign: 'center',
                      paddingBottom: isMobile ? '0.75rem' : '1rem',
                      paddingTop: '1rem',
                      paddingLeft: isMobile ? '1.5rem' : '2rem',
                      paddingRight: isMobile ? '1.5rem' : '2rem',
                      background:
                        'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0) 100%)',
                      borderRadius: '0 0 8px 8px',
                      minHeight: isMobile ? '110px' : '120px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '0.4rem', color: '#fff' }}>
                      {project.name}
                    </h3>
                    <ul
                      style={{
                        color: '#fff',
                        textAlign: 'left',
                        margin: '0 auto',
                        display: 'inline-block',
                        paddingLeft: '1.2em',
                        fontSize: '0.85rem',
                        marginTop: '-0.2rem',
                        marginBottom: '0',
                      }}
                    >
                      {(Array.isArray(project.description)
                        ? project.description
                        : project.description.split('\n')
                      ).map((line, i) => (
                        <li
                          key={line}
                          style={{ marginBottom: i === 0 ? '0.18rem' : '0', fontSize: '0.85rem' }}
                        >
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '20px',
            marginTop: '0.5rem',
            width: '100%',
            position: 'relative',
          }}
        >
          <button
            type="button"
            onClick={handlePrev}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              border: '2px solid var(--accent)',
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-on-fill)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 'bold',
              transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              outline: 'none',
              transform: prevClicked ? 'scale(1.2)' : 'scale(1)',
            }}
          >
            ←
          </button>
          <button
            type="button"
            onClick={handleNext}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              border: '2px solid var(--accent)',
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-on-fill)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 'bold',
              transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              outline: 'none',
              transform: nextClicked ? 'scale(1.2)' : 'scale(1)',
            }}
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
};

export default Projects;
