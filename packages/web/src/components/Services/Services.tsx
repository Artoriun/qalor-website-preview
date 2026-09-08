import { SERVICE_PAGES } from '@qalor/shared';
import './Services.css';

/**
 * The home page's links to the four landing pages.
 *
 * These pages shipped orphaned — nothing on the site linked to them, so they were reachable
 * only from sitemap.xml and collected almost no internal link equity. Their slugs did appear
 * in the JS bundle, but that is App.tsx matching `pathname` against SERVICE_PAGES, which is
 * routing and not a link.
 *
 * Built from SERVICE_PAGES so the section cannot drift from the pages that exist: adding a
 * landing page there puts it here too, and scripts/check-internal-links.mjs fails the build
 * if any entry ends up unlinked again.
 *
 * Real anchors with the page's own title as the anchor text, not buttons and not "lees meer":
 * anchor text is one of the few things a crawler reads as a description of the destination.
 */
export default function Services() {
  return (
    <section id="diensten" data-aos="fade-right" className="services-section">
      <div className="services-inner">
        <h2>Onze diensten</h2>
        <p className="services-lead">
          Van de nettekening tot de exploitatieberekening — elke stap van een warmteproject,
          uitgewerkt tot het detailniveau waarop een besluit genomen kan worden.
        </p>
        <ul className="services-list">
          {/* Dutch pages only. The English set is reached from the language link below, not
              mixed into this list — one crawl path per language. */}
          {SERVICE_PAGES.filter((page) => (page.lang ?? 'nl') === 'nl').map((page) => (
            <li key={page.slug}>
              <a href={`${import.meta.env.BASE_URL}${page.slug}/`}>{page.h1}</a>
              <p>{page.description}</p>
            </li>
          ))}
        </ul>
        <p className="services-lang">
          <a href={`${import.meta.env.BASE_URL}en/`} hrefLang="en">
            Qalor in English
          </a>
        </p>
      </div>
    </section>
  );
}
