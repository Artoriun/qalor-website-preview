import type { ServicePage as ServicePageContent } from '@qalor/shared';
import Footer from '../components/Footer/Footer';
import Navbar from '../components/Navbar/Navbar';
import './ServicePage.css';

/**
 * One SEO landing page per search intent (see SERVICE_PAGES in @qalor/shared).
 *
 * Deliberately lean: Navbar, this page's own copy, Footer — not the full marketing page
 * underneath it. Repeating About/Team/Werkproces/Projecten on all four service pages would
 * put four near-identical copies of those sections in the index, which is the exact
 * duplicate-content problem these pages exist to solve.
 *
 * Not lazy-loaded, unlike Admin: this is the landing page a search visitor arrives on, so
 * it is the critical path for that visit rather than something to defer. It's ~1KB of
 * markup and no new dependencies.
 */
export default function ServicePage({ page }: { page: ServicePageContent }) {
  return (
    <div className="service-page">
      <Navbar />
      <main>
        <article>
          <header>
            <p className="service-eyebrow">Onze dienstverlening</p>
            <h1>{page.h1}</h1>
            <p className="service-intro">{page.intro}</p>
          </header>

          {page.blocks.map((block) => (
            <section key={block.title}>
              <h2>{block.title}</h2>
              <p>{block.body}</p>
            </section>
          ))}

          {/* Real navigation, not decoration: a search visitor lands here mid-funnel, and
              this is the only route back to the process, projects and contact details that
              would otherwise be a page they never see.

              BASE_URL-prefixed, not a bare '/': under a project subpath a hardcoded '/'
              leaves the site altogether (github.io's own root), same trap Navbar.tsx's
              smoothScrollTo has. */}
          <p className="service-back">
            <a href={`${import.meta.env.BASE_URL}#how-it-works`}>Bekijk ons volledige werkproces</a>
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
