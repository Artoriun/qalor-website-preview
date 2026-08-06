import AOS from 'aos';
import 'aos/dist/aos.css';
import { useEffect } from 'react';
import About from './components/About/About';
// Contact isn't wired in — see the commented-out <Contact /> below.
// import Contact from './components/Contact/Contact';
import Footer from './components/Footer/Footer';
import Hero from './components/Hero/Hero';
import Navbar from './components/Navbar/Navbar';
import Projects from './components/Projects/Projects';
import Team from './components/Team/Team';
import WorkProcess from './components/WorkProcess/WorkProcess';

// Nothing code-split anymore at this level. Team used to be — it pulled in
// @react-pdf-viewer/core (117KB gzipped) — but that dependency is only actually needed
// once someone opens a CV, not on every page load, so it moved to its own lazy chunk
// inside Team itself (see TeamPdfModal.tsx). Without it, Team's own code is as cheap as
// About/WorkProcess/Projects/Footer, and being eager here avoids the same
// Suspense-fallback CLS those already had fixed for them (the "Laden..." placeholder is a
// very different height from the real section that replaces it).

function App() {
  useEffect(() => {
    // Scroll position restoration
    const saveScrollPosition = () => {
      sessionStorage.setItem('scrollPosition', window.scrollY.toString());
    };

    const restoreScrollPosition = () => {
      const savedPosition = sessionStorage.getItem('scrollPosition');
      if (savedPosition) {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          window.scrollTo({
            top: Number.parseInt(savedPosition, 10),
            behavior: 'instant', // Use instant for immediate restoration
          });
        });
      }
    };

    // Save scroll position before page unload
    window.addEventListener('beforeunload', saveScrollPosition);

    // Restore scroll position after page load
    if (document.readyState === 'complete') {
      restoreScrollPosition();
    } else {
      window.addEventListener('load', restoreScrollPosition);
    }

    // Initialize AOS immediately for faster page interaction
    AOS.init({
      duration: 600,
      once: true,
      offset: 100,
      disable: false, // Enable AOS to test just WorkProcess
    });

    // Refresh AOS once all assets are loaded for better accuracy
    const refreshAOS = () => {
      AOS.refresh();
    };

    if (document.readyState !== 'complete') {
      window.addEventListener('load', refreshAOS);
    }

    // Cleanup function
    return () => {
      window.removeEventListener('beforeunload', saveScrollPosition);
      window.removeEventListener('load', restoreScrollPosition);
      window.removeEventListener('load', refreshAOS);
    };
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        minHeight: '100vh',
        overflowX: 'hidden',
        margin: 0,
        padding: 0,
      }}
    >
      <Navbar />
      <Hero />
      <Team />
      <About />
      <WorkProcess />
      <Projects />
      {/* <Contact /> */}
      <Footer />
    </div>
  );
}

export default App;
