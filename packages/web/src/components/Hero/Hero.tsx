import { useContent } from '../../context/ContentContext';
import { fullBleedSrcSet, optimizeUrl } from '../../lib/images';
import Particles from '../Particles/Particles';
import './Hero.css';
import ArrowRight from '../ArrowRight';

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
  const { content } = useContent();
  const { headline, subheadline, image: heroImage } = content.hero;

  return (
    // No data-aos here: this is the LCP candidate, and AOS holds elements at opacity:0
    // until scrolled into view — that would delay first paint of the one thing that should
    // paint first. The fade below is a plain CSS animation that runs on load instead.
    <section className="hero">
      <div className="hero-panel">
        <Particles />
        <div className="hero-grid">
          <div className="hero-text">
            {/* The descriptive line is the h1, not the welcoming one.
                "Welkom op de website van Qalor" was the h1 — the strongest on-page signal
                there is, spent on a phrase nobody searches — while "Energiedeskundigen
                warmtenetten" sat under it as an h2.

                The tags are swapped and the styling is not: the welcome still reads as the
                big line, because heading level is semantics and not size. Both strings stay
                admin-editable, so whatever the client puts in `subheadline` is now the h1 —
                noted in SEO.md so the field keeps carrying something descriptive. */}
            <p className="hero-headline">{headline}</p>
            <h1 className="hero-subheadline">{subheadline}</h1>
            <div className="hero-actions">
              <button
                type="button"
                className="hero-contact-btn"
                onClick={() => smoothScrollTo('footer')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Contact
                  <span className="hero-contact-arrow">
                    <ArrowRight size={16} />
                  </span>
                </span>
              </button>
              <button
                type="button"
                className="wat-wij-doen-btn"
                onClick={(e) => {
                  e.currentTarget.classList.add('clicked');
                  const btn = e.currentTarget;
                  setTimeout(() => btn.classList.remove('clicked'), 200);
                  smoothScrollTo('qalor');
                }}
              >
                Wat wij doen
              </button>
            </div>
          </div>

          <div className="hero-image-wrap">
            <img
              src={optimizeUrl(heroImage, 1024)}
              srcSet={fullBleedSrcSet(heroImage)}
              sizes="(max-width: 768px) 100vw, 50vw"
              fetchPriority="high"
              alt="Energy efficiency"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
