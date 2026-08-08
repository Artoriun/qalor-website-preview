import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import qalorLogoImg from '../../assets/images/figures/qalor logo.png';
import { useContent } from '../../context/ContentContext';
import { optimizeUrl } from '../../lib/images';

// See TeamPdfModal.tsx's own comment: @react-pdf-viewer/core only loads once someone
// actually opens a CV, not on every page load.
const TeamPdfModal = lazy(() => import('./TeamPdfModal'));

const AUTOPLAY_MS = 3000;

const Team = () => {
  const { content } = useContent();
  const { eyebrow, heading } = content.teamIntro;
  const teamMembers = useMemo(
    () =>
      content.team.map((m) => ({
        ...m,
        backgroundImage: m.isImage ? undefined : m.photoUrl && optimizeUrl(m.photoUrl, 700),
        imageUrl: m.isImage ? qalorLogoImg : undefined,
      })),
    [content.team],
  );
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const [prevClicked, setPrevClicked] = useState(false);
  const [nextClicked, setNextClicked] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [slideWidth, setSlideWidth] = useState(400);
  const [showPDF, setShowPDF] = useState(false);
  const [currentPdfPath, setCurrentPdfPath] = useState('');
  const [pdfKey, setPdfKey] = useState(0); // Force PDF viewer re-render on orientation change

  // Drag functionality state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragStartSlide, setDragStartSlide] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setSlideWidth(mobile ? Math.min(window.innerWidth * 0.9, 400) : 400);

      // Force PDF viewer to re-render if it's currently showing
      if (showPDF) {
        setPdfKey((prev) => prev + 1);
      }
    };

    const handleOrientationChange = () => {
      // Add a small delay to ensure the viewport has updated
      setTimeout(() => {
        checkScreenSize();
      }, 100);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [showPDF]);

  const infiniteSlides = [...teamMembers.slice(-3), ...teamMembers, ...teamMembers.slice(0, 3)];

  // Function to start auto-play timer
  const startAutoPlay = () => {
    // Always clear any existing timer first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }

    // Only start timer if PDF is not showing
    if (!showPDF) {
      timerRef.current = setInterval(() => {
        setCurrentSlide((prev) => {
          if (prev === teamMembers.length + 2) {
            setTimeout(() => {
              setIsTransitioning(false);
              setCurrentSlide(3);
              setTimeout(() => setIsTransitioning(true), 50);
            }, 500);
          }
          return prev + 1;
        });
      }, AUTOPLAY_MS);
    }
  };

  useEffect(() => {
    startAutoPlay();
    return () => clearInterval(timerRef.current);
  }, []);

  // Restart auto-play when PDF closes
  useEffect(() => {
    if (!showPDF) {
      // Small delay to ensure proper state update
      const timer = setTimeout(() => {
        startAutoPlay();
      }, 100);
      return () => clearTimeout(timer);
    }
    // Clear timer when PDF opens
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
  }, [showPDF]);

  useEffect(() => {
    setCurrentSlide(3);
  }, []);

  const handlePrevClick = () => {
    setPrevClicked(true);
    setTimeout(() => setPrevClicked(false), 250);
    setIsTransitioning(true);
    if (currentSlide === 3) {
      setCurrentSlide(2);
      setTimeout(() => {
        setIsTransitioning(false);
        setCurrentSlide(teamMembers.length + 2);
        setTimeout(() => setIsTransitioning(true), 50);
      }, 500);
    } else {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleNextClick = () => {
    setNextClicked(true);
    setTimeout(() => setNextClicked(false), 250);
    setIsTransitioning(true);
    if (currentSlide === teamMembers.length + 2) {
      setCurrentSlide(teamMembers.length + 3);
      setTimeout(() => {
        setIsTransitioning(false);
        setCurrentSlide(3);
        setTimeout(() => setIsTransitioning(true), 50);
      }, 500);
    } else {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePDFClick = (member: (typeof teamMembers)[number]) => {
    // Only open PDF if the carousel wasn't dragged and member has a PDF
    if (!member.isImage && !hasMoved && member.pdfPath) {
      setCurrentPdfPath(member.pdfPath);
      setShowPDF(true);
      // Timer will be cleared automatically by useEffect
    }
  };

  const handleClosePDF = () => {
    setShowPDF(false);
    // Timer will be restarted automatically by useEffect
  };

  // Add keyboard support and better mobile handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showPDF) {
        handleClosePDF();
      }
    };

    if (showPDF) {
      document.addEventListener('keydown', handleKeyDown);
      // Disable body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [showPDF]);

  // Drag event handlers
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragStart(clientX);
    setDragStartSlide(currentSlide);
    setDragOffset(0);
    setHasMoved(false);

    // Clear auto-play timer during potential drag
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (dragStart === 0) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const offset = clientX - dragStart;

    // Start dragging if moved more than 5 pixels
    if (Math.abs(offset) > 5 && !hasMoved) {
      setHasMoved(true);
      setIsDragging(true);
      setIsTransitioning(false);
    }

    if (hasMoved) {
      setDragOffset(offset);
    }
  };

  const handleDragEnd = () => {
    const moved = hasMoved;

    if (moved && isDragging) {
      setIsDragging(false);
      setIsTransitioning(true);

      const threshold = slideWidth * 0.3; // 30% of slide width to trigger change

      if (Math.abs(dragOffset) > threshold) {
        if (dragOffset > 0) {
          // Dragged right - go to previous slide
          handlePrevClick();
        } else {
          // Dragged left - go to next slide
          handleNextClick();
        }
      } else {
        // Snap back to current slide
        setCurrentSlide(dragStartSlide);
      }

      setDragOffset(0);

      // Restart auto-play timer
      startAutoPlay();
    }

    // Reset drag state
    setDragStart(0);

    // Reset hasMoved after a short delay to prevent accidental PDF opening
    setTimeout(() => {
      setHasMoved(false);
    }, 100);
  };

  // Handle click vs drag
  const handleSlideClick = (member: (typeof teamMembers)[number]) => {
    // If we haven't moved significantly, treat it as a click
    if (!hasMoved) {
      handlePDFClick(member);
    }
  };

  return (
    <>
      {showPDF && (
        // Immediate backdrop while the modal's own chunk (and @react-pdf-viewer/core with
        // it) is still being fetched, so the click has instant visual feedback instead of
        // nothing happening for the first couple hundred ms.
        <Suspense
          fallback={
            <div
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                zIndex: 1000,
              }}
            />
          }
        >
          <TeamPdfModal pdfKey={pdfKey} pdfPath={currentPdfPath} onClose={handleClosePDF} />
        </Suspense>
      )}
      {/* No data-aos here: Team is the first below-the-fold section, close enough to
          the fold that on a tall-but-short viewport (desktop, 900px) it's already
          within AOS's trigger offset at load — caught as a real, non-deterministic
          contrast issue by e2e/a11y.spec.ts (mid-fade text reads as lower contrast than
          its settled state) and would have made the Lighthouse accessibility gate
          flaky in CI for the same reason. Already lazy-loaded via Suspense, so it
          doesn't need a second, AOS-driven reveal on top of that. */}
      <section
        id="team"
        style={{ padding: '80px 20px', backgroundColor: 'var(--bg-page)', width: '100%' }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
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
                fontSize: '2rem',
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
          <div style={{ position: 'relative' }}>
            {/* Slideshow Container */}
            <div
              style={{
                overflow: 'hidden',
                width: isMobile ? '90vw' : '1220px',
                maxWidth: '1220px',
                margin: '0 auto',
                height: isMobile ? 'auto' : '400px',
                minHeight: isMobile ? '350px' : '400px',
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
                  transform: `translateX(-${currentSlide * slideWidth - dragOffset}px)`,
                  transition:
                    isTransitioning && !isDragging ? 'transform 0.5s ease-in-out' : 'none',
                  height: '100%',
                }}
              >
                {infiniteSlides.map((member, index) => (
                  <div
                    key={`slide-${index}`}
                    style={{
                      width: slideWidth,
                      flexShrink: 0,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: isMobile ? '0 10px' : '0 20px',
                      cursor: isDragging ? 'grabbing' : 'pointer',
                      pointerEvents: 'auto',
                    }}
                    onClick={() => handleSlideClick(member)}
                  >
                    <div
                      style={{
                        background: member.isImage
                          ? 'transparent'
                          : member.backgroundImage
                            ? `url(${member.backgroundImage})`
                            : 'var(--bg-section)',
                        backgroundSize: member.backgroundImage ? 'cover' : 'auto',
                        backgroundPosition: member.backgroundImage ? 'center' : 'initial',
                        padding: '0',
                        borderRadius: '8px',
                        textAlign: 'center',
                        width: '100%',
                        maxWidth: isMobile ? '100%' : '350px',
                        minHeight: isMobile ? '300px' : '320px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: member.isImage ? 'center' : 'flex-end',
                        overflow: 'hidden',
                        position: 'relative',
                        boxShadow: '0 8px 25px rgba(241,136,37,0.15)',
                      }}
                    >
                      {member.isImage ? (
                        <img
                          src={member.imageUrl}
                          alt="Qalor"
                          style={{
                            width: '100%',
                            height: member.id === 4 ? '100%' : isMobile ? '300px' : '320px',
                            objectFit: member.id === 4 ? 'contain' : 'cover',
                            borderRadius: '8px',
                            background: member.id === 4 ? 'white' : undefined,
                            maxWidth: member.id === 4 ? '350px' : undefined,
                            maxHeight: member.id === 4 ? (isMobile ? '300px' : '320px') : undefined,
                            margin: member.id === 4 ? '0 auto' : undefined,
                            display: member.id === 4 ? 'block' : undefined,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            position: 'absolute',
                            // Taller than just the text it wraps, unlike before: this extends
                            // up over the top half of the photo so the gradient has real room
                            // to fade out above the text instead of fading through it. flex +
                            // justify-content: flex-end keeps the text pinned to the bottom,
                            // inside the gradient's solid zone, regardless of exact text length.
                            top: '50%',
                            bottom: '0',
                            left: '0',
                            right: '0',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            textAlign: 'center',
                            padding: '16px 0 12px 0',
                            // Solid through the bottom half (where the text actually sits, via
                            // justify-content above), fading out only in the top half — checked
                            // against the real team photos with e2e/a11y.spec.ts (passes down
                            // to about 0.25; 0.5 trades some of that margin for a visibly
                            // lighter fade, per feedback that 0.78 read as too dark).
                            background:
                              'linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0) 100%)',
                            borderRadius: '0 0 8px 8px',
                          }}
                        >
                          <h3 style={{ fontSize: '1.3rem', marginBottom: '0', color: '#fff' }}>
                            {member.name}
                          </h3>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              marginBottom: '8px',
                            }}
                          >
                            <p
                              style={{
                                color: '#fff',
                                lineHeight: '1.4',
                                margin: 0,
                                fontSize: '1rem',
                              }}
                            >
                              {member.description}
                            </p>
                            {member.pdfPath && (
                              <button
                                type="button"
                                style={{
                                  background: '#fff',
                                  color: '#000',
                                  border: 'none',
                                  borderRadius: '50px',
                                  padding: '5px 9px',
                                  fontSize: '0.85rem',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
                                  outline: 'none',
                                  transition: 'background 0.2s, color 0.2s',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                  height: '24px',
                                  minHeight: '24px',
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePDFClick(member);
                                }}
                              >
                                CV
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--accent)',
                                    fontSize: '13px',
                                    fontWeight: 'bold',
                                    color: 'var(--accent-on-fill)',
                                    marginLeft: '4px',
                                  }}
                                >
                                  &rarr;
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Navigation Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '20px',
              marginTop: '0.5rem',
              alignItems: 'center',
            }}
          >
            <button
              type="button"
              onClick={handlePrevClick}
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
              &larr;
            </button>
            <button
              type="button"
              onClick={handleNextClick}
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
              &rarr;
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Team;
