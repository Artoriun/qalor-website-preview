import { SERVICE_PAGES, type ServicePage as ServicePageContent } from '@qalor/shared';
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
  const siblings = SERVICE_PAGES.filter((p) => p.slug !== page.slug);
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
          {/* The other landing pages. Without these each page is a dead end that only
              points back up to the home page, so the four never form a crawlable group and
              none of them passes any equity to the others. Anchor text is the sibling's own
              H1 for the same reason it is on the home page. */}
          {siblings.length > 0 && (
            <nav className="service-siblings" aria-label="Andere diensten">
              <h2>Andere diensten</h2>
              <ul>
                {siblings.map((other) => (
                  <li key={other.slug}>
                    <a href={`${import.meta.env.BASE_URL}${other.slug}/`}>{other.h1}</a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <p className="service-back">
            <a href={`${import.meta.env.BASE_URL}#how-it-works`}>Bekijk ons volledige werkproces</a>
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
