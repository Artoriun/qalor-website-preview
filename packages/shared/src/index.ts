/**
 * NOTE ON IMPORTS
 *
 * Deliberately one file with no relative imports. This package ships raw TypeScript
 * (main points at src/index.ts), and scripts/prerender.mjs loads it directly with plain
 * `node`, which does no extension guessing on relative imports — `from './content'`
 * fails at runtime, and `from './content.ts'` needs allowImportingTsExtensions, which
 * conflicts with this package's own tsconfig. Bundlers (Vite) resolve either form fine,
 * so the breakage would only show up where this file is loaded directly outside one.
 * Add a sibling file here and the build passes while the prerender dies.
 */

export type Project = {
  // number for the bundled defaults below; the admin API assigns a string id (a Firestore
  // doc key) to anything created from the portal. Always treat this as an opaque key.
  id: number | string;
  name: string;
  role: string;
  description: string | string[];
  // Cloudinary URL, untransformed — packages/web/src/lib/images.ts's optimizeUrl()
  // applies f_auto/q_auto/resize at the point of use, per rendered size.
  image: string;
  // Admin-portal bookkeeping. `deleted` is optional — nothing in the bundled defaults
  // starts deleted. `order` isn't really optional in practice: every bundled item below
  // sets one, because the admin portal's reorder buttons swap two items' `order` values,
  // and if any item's were left undefined (falling back to a shared default of 0) that
  // swap would write the same value to both and silently do nothing. See ADMIN.md.
  order?: number;
  deleted?: boolean;
};

const CLOUDINARY = 'https://res.cloudinary.com/o5hr8kjc/image/upload';

/**
 * Cache-busting version segment for Cloudinary delivery URLs.
 *
 * The bundled URLs carry no version, so the path is identical before and after an image is
 * replaced: uploading with `invalidate` clears Cloudinary's CDN, but browsers keep serving
 * the bytes they already hold for the full year these assets are cached for. A version in
 * the path changes the URL, so a replacement is picked up on the next visit.
 *
 * Cloudinary ignores the value when resolving the asset — it only has to differ from last
 * time. **Bump it whenever an image is replaced.**
 *
 * Lives here rather than in the web package because scripts/prerender.mjs builds the hero's
 * preload URL itself and has to produce a byte-identical string; if the preload and the
 * <img> disagree, the browser fetches the hero twice.
 */
export const ASSET_VERSION = 'v1786803387';

export const PROJECTS: Project[] = [
  {
    id: 1,
    order: 0,
    name: 'Heechterp Leeuwarden',
    role: 'Warmtenet Ontwerp',
    description: [
      'warmtenet voor 868 woningen',
      'zowel bestaande bouw als nieuwbouw',
      'in opdracht van woningcorporatie Elkien',
    ],
    image: `${CLOUDINARY}/qalor/projects-heechterp.jpg`,
  },
  {
    id: 2,
    order: 1,
    name: 'Dokkum Fûgellân',
    role: 'Energie Optimalisatie',
    description: [
      'warmtenet voor 1114 woningen + utiliteit',
      'bestaande bouw',
      'in opdracht van gemeente Noardeast-Fryslân',
    ],
    image: `${CLOUDINARY}/qalor/projects-dokkum.jpg`,
  },
  {
    id: 3,
    order: 2,
    name: 'Anjum - Esonstad',
    role: 'Haalbaarheidsonderzoek',
    description: [
      'warmtenet voor 604 woningen + utiliteit',
      'bestaande bouw',
      'in opdracht van gemeente Noardeast-Fryslân / Energiecorporatie De Anjummer Eendragt',
    ],
    image: `${CLOUDINARY}/qalor/projects-anjum.jpg`,
  },
  {
    id: 4,
    order: 3,
    name: 'Sneek Het Eiland',
    role: 'Smart Technology',
    description: [
      'warmte- en koudenet voor 604 woningen',
      'bestaande bouw',
      'in opdracht van gemeente Súdwest-Fryslân',
    ],
    image: `${CLOUDINARY}/qalor/projects-sneek.jpg`,
  },
  {
    id: 5,
    order: 4,
    name: 'Heeg',
    role: 'Innovatie & Advies',
    description: [
      'warmtenet voor 819 woningen',
      'bestaande bouw',
      'in opdracht van gemeente Súdwest-Fryslân',
    ],
    image: `${CLOUDINARY}/qalor/projects-heeg.jpg`,
  },
  {
    id: 6,
    order: 5,
    name: 'Heechterp (vervolgopdracht)',
    role: 'Consultancy',
    description: [
      'warmtenet voor 1130 woningen',
      'zowel bestaande bouw als nieuwbouw',
      'in opdracht van Warmtebedrijf Heechterp',
    ],
    image: `${CLOUDINARY}/qalor/projects-heechterp2.png`,
  },
  {
    id: 7,
    order: 6,
    name: 'Assen Componistenbuurt',
    role: 'Onderzoek',
    description: [
      'warmtenet voor 960 woningen',
      'zowel bestaande bouw als nieuwbouw',
      'in opdracht van Bouwgroep Dijkstra Draisma',
    ],
    image: `${CLOUDINARY}/qalor/projects-assencomp.jpg`,
  },
  {
    id: 8,
    order: 7,
    name: 'Middelsee Leeuwarden',
    role: 'Warmtenet Ontwerp',
    description: [
      'warmtenet voor 1700 woningen',
      'nieuwbouw',
      'in opdracht van gemeente Leeuwarden',
    ],
    // Uploaded as WebP at the root rather than qalor/*.jpg like the other seven. Both
    // differences are inert: optimizeUrl's .jpg -> .webp swap simply finds nothing to
    // replace, and the folder is organisational, not part of how the URL resolves. Left
    // unversioned on purpose so ASSET_VERSION applies to it as it does to the rest.
    image: `${CLOUDINARY}/projects-middelsee.webp`,
  },
];

export type TeamMember = {
  // See the note on Project['id'] above — number for the bundled defaults, string for
  // anything created from the admin portal.
  id: number | string;
  name?: string;
  description?: string;
  isImage?: boolean;
  // Absolute path served from the site root (base '/', not the old GitHub Pages
  // '/qalor/' prefix) — matches vite.config.ts's `base: '/'` and packages/web/public.
  pdfPath?: string;
  // Cloudinary URL, untransformed — see the note on Project['image'] above.
  photoUrl?: string;
  order?: number;
  deleted?: boolean;
};

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 1,
    order: 0,
    name: 'Peter de Keijzer',
    description: 'Warmte-expert',
    pdfPath: '/documents/CV_Peter_de_Keijzer.pdf',
    photoUrl: `${CLOUDINARY}/qalor/team-peter.png`,
  },
  {
    id: 2,
    order: 1,
    name: 'Huub Jansen',
    description: 'Warmte-expert',
    pdfPath: '/documents/CV_Huub_Jansen.pdf',
    photoUrl: `${CLOUDINARY}/qalor/team-huub.png`,
  },
  {
    id: 3,
    order: 2,
    name: 'Jan Pouw',
    description: 'Warmte-expert',
    pdfPath: '/documents/CV_Jan_Pouw.pdf',
    photoUrl: `${CLOUDINARY}/qalor/team-jan.png`,
  },
  { id: 4, order: 3, isImage: true },
];

export const SITE_TITLE = 'Qalor';
export const SITE_DESCRIPTION =
  'Qalor — energiedeskundigen voor warmtenetten: advies, ontwerp en realisatie van energie-efficiënte warmteoplossingen voor gebouwen en wijken.';

/**
 * ADMIN-EDITABLE CONTENT
 *
 * Everything below is what the admin portal (packages/api + packages/web's /admin route)
 * edits. Two shapes, matching how each section actually varies:
 *
 * - Singleton sections (Hero, About, WorkProcess's intro copy, Projects' intro copy, Team's
 *   intro copy, Footer) — one object each, held as one Firestore doc per id in a
 *   `siteContent` collection, override-merged over the DEFAULT_* constant below at request
 *   time. A field a document doesn't have falls through to the bundled default.
 * - List sections (Projects, Team, WorkProcess's steps) — arrays of typed cards with
 *   id/order/deleted, override-merged the same way but per-item, in a collection named
 *   after the list. New items created from the portal simply have no bundled counterpart.
 *
 * See packages/api/src/routes/content.ts for the merge logic and packages/web/src/context/
 * ContentContext.tsx for how the frontend consumes the result.
 */

export type HeroContent = {
  headline: string;
  subheadline: string;
  image: string;
};

export const DEFAULT_HERO: HeroContent = {
  headline: 'Welkom op de website van Qalor',
  subheadline: 'Energiedeskundigen warmtenetten',
  image: `${CLOUDINARY}/qalor/hero.jpg`,
};

export type AboutBlock = {
  id: string;
  title: string;
  // Paragraphs separated by a blank line, matching how the site already renders them.
  body: string;
};

export type AboutContent = {
  eyebrow: string;
  heading: string;
  image: string;
  blocks: AboutBlock[];
};

export const DEFAULT_ABOUT: AboutContent = {
  eyebrow: 'Wat wij doen',
  heading: 'Energiedeskundigen warmtenetten',
  image: `${CLOUDINARY}/qalor/about-peterhuub.jpg`,
  blocks: [
    {
      id: 'wat-is-qalor',
      title: 'Wat is Qalor?',
      body: 'Een samenwerking van drie recent gepensioneerde warmte-experts\n\nMet meer dan 130 jaar ervaring in de energiewereld waarvan meer dan 100 jaar bij warmtebedrijven.',
    },
    {
      id: 'werkzaamheden',
      title: 'Onze werkzaamheden',
      body: 'Wij richten ons op projectcalculaties en de daarbij behorende technische analyses.',
    },
    {
      id: 'ervaring',
      title: 'Ervaring',
      body: 'Onze lange ervaring met het realiseren, onderhouden en exploiteren van warmte- en koudenetten bij Eneco en haar rechtsvoorgangers zorgt voor een gedegen en betrouwbare calculatie van uw warmteproject.',
    },
  ],
};

export type WorkProcessStep = {
  id: string;
  number: string;
  title: string;
  body: string;
  image: string;
  alt: string;
  order?: number;
  deleted?: boolean;
};

export type WorkProcessIntro = {
  eyebrow: string;
  heading: string;
};

export const DEFAULT_WORK_PROCESS_INTRO: WorkProcessIntro = {
  eyebrow: 'Hoe wij te werk gaan',
  heading: 'Ons werkproces',
};

export const WORK_PROCESS_STEPS: WorkProcessStep[] = [
  {
    id: 'step-1',
    order: 0,
    number: '01',
    title: 'Het vervaardigen van een nettekening in AutoCAD',
    body: 'Een betrouwbare calculatie van een warmteproject vereist dat als eerste er een kundige nettekening in AutoCAD wordt gemaakt. De basis voor de ondergrond is daarbij immer een oriëntatiemelding van het Kadaster die de bezetting van de ondergrond gedetailleerd weergeeft.',
    image: `${CLOUDINARY}/qalor/workprocess-nettekening.jpg`,
    alt: 'AutoCAD Nettekening',
  },
  {
    id: 'step-2',
    order: 1,
    number: '02',
    title: 'Het maken van de gebouwendatabase',
    body: 'Een betrouwbare bepaling van de vermogensbehoefte van het warmteproject vereist dat er op basis van diverse openbare bronnen, waaronder het BAG-register en Atlas Leefomgeving, er een complete gebouwendatabase opgesteld wordt.',
    image: `${CLOUDINARY}/qalor/workprocess-gebouwendatabase.jpg`,
    alt: 'Gebouwendatabase',
  },
  {
    id: 'step-3',
    order: 2,
    number: '03',
    title: 'Het maken van de exploitatieberekening',
    body: "Op basis van de AutoCAD-tekening, de gebouwendatabase en de bepaling van het concept en de investeringen van de energieopwekinstallatie wordt een uitgebreid financieel model in Excel gevuld, waarbij op basis van verschillende uitgangspunten diverse scenario's worden gemaakt.",
    image: `${CLOUDINARY}/qalor/workprocess-berekening.jpg`,
    alt: 'Exploitatieberekening',
  },
];

export type SectionIntro = {
  eyebrow: string;
  heading: string;
};

export const DEFAULT_PROJECTS_INTRO: SectionIntro = {
  eyebrow: 'Projectreferenties',
  // No year range: it dated itself the moment a project outside it was added, and the
  // heading is the one place that goes stale without anyone editing anything.
  heading: 'Onze projecten',
};

export const DEFAULT_TEAM_INTRO: SectionIntro = {
  eyebrow: 'Ons team',
  heading:
    'Een gezamenlijke werkervaring van meer dan 130 jaar in de warmtewereld waarvan meer dan 100 jaar bij warmtebedrijven heeft geleid tot een unieke krachtenbundeling.',
};

export type FooterContent = {
  tagline: string;
  email: string;
  phone: string;
  address: string;
  addressUrl: string;
  btwNumber: string;
  iban: string;
  copyright: string;
};

export const DEFAULT_FOOTER: FooterContent = {
  tagline: 'Energiedeskundigen warmtenetten',
  email: 'pdk@qalor.nl',
  phone: '06 112 16 938',
  address: 'Lange Marktstraat 1, 8911 AD, Leeuwarden',
  addressUrl: 'https://maps.app.goo.gl/svtgb5ivAYVd9MXAA',
  btwNumber: 'NL005077048B43',
  iban: 'NL94 ABNA 0134 0861 39',
  copyright: '© Qalor',
};

/**
 * SEO landing pages, one per search intent.
 *
 * Deliberately NOT part of SiteContent, and so not admin-editable: this text is the
 * client's own, supplied and signed off, which settles the two questions the earlier draft
 * carried (the narrow "calculatie" reading of the ontwerp page, and the terminology — the
 * terms are now theirs). What kept it out of SiteContent was that it was about to be
 * rewritten; that reason is spent, and moving it there — as a list section alongside
 * projects/team, same shape, same merge — is now a change worth making on its own.
 *
 * `slug` is the single source of truth for the URL: scripts/prerender.mjs builds ROUTES
 * from this array, so a page added here gets prerendered, sitemapped and schema'd without
 * a second edit somewhere else.
 */
export type ServiceBlock = { title: string; body: string };

/** One question and its answer. Rendered on the page and emitted as FAQPage JSON-LD. */
export type ServiceFaq = { q: string; a: string };

export type ServicePage = {
  slug: string;
  /** <title>. Kept distinct from h1: the title carries the brand, the h1 doesn't need to. */
  title: string;
  description: string;
  h1: string;
  intro: string;
  blocks: ServiceBlock[];
  /**
   * Answers to what people actually type. These do two jobs: they match long-tail queries
   * the body copy phrases differently, and FAQ rich results widen the entry in the results
   * page, which lifts clicks on rankings the site already holds.
   */
  faq?: ServiceFaq[];
  /**
   * Content language. Absent means Dutch — the site's default and, for now, every page
   * that existed before the English set.
   */
  lang?: 'nl' | 'en';
  /**
   * Slug of the same page in the other language, if there is one. Drives reciprocal
   * hreflang: Google ignores a one-sided declaration, so both sides must name each other.
   */
  altSlug?: string;
};

export const SERVICE_PAGES: ServicePage[] = [
  {
    slug: 'warmtenet-tekening',
    title: 'Warmtenet tekening in AutoCAD | Qalor',
    description:
      'Qalor vervaardigt de nettekening van uw warmtenet in AutoCAD: tracé, leidingdiameters en aansluitingen, als basis voor ontwerp en berekening.',
    h1: 'Warmtenet tekening in AutoCAD',
    intro:
      'Een betrouwbare calculatie van een warmteproject begint bij de tekening. Zonder een nauwkeurig beeld van de ondergrond is elke kostenraming een aanname. Daarom is de nettekening in AutoCAD bij Qalor altijd de eerste stap.',
    blocks: [
      {
        title: 'De ondergrond als basis',
        body: 'De basis voor de ondergrond is steevast een oriëntatiemelding van het Kadaster. Die geeft gedetailleerd weer wat er al ligt: kabels, leidingen, riolering en de bijbehorende beheerders. Op die ondergrond wordt het tracé van het warmtenet ingetekend, inclusief de punten waar het net bestaande infrastructuur kruist. Juist die kruisingen en de beschikbare ruimte in het profiel bepalen in de praktijk een wezenlijk deel van de aanlegkosten — een tracé dat logisch lijkt, kan in de werkelijke ondergrond onuitvoerbaar of onnodig duur zijn.',
      },
      {
        title: 'Wat de tekening oplevert',
        body: 'De nettekening legt het tracé, de leidingdiameters en de aansluitleidingen vast in één document dat de rest van het project draagt. De lengtes komen rechtstreeks uit de tekening en de diameters worden berekend en dit vormt de invoer voor de investeringscalculatie (CAPEX).',
      },
      {
        title: 'Waarom door deskundigen met een zeer uitgebreide ervaring',
        body: 'Een tekening maken kan een tekenaar. Beoordelen of een tracé in de praktijk uitvoerbaar is, vraagt iemand die warmtenetten heeft aangelegd, onderhouden en geëxploiteerd. Het team van Qalor bestaat uit drie warmte-experts met samen meer dan 130 jaar ervaring in de energiewereld, waarvan meer dan 100 jaar bij warmtebedrijven — bij Eneco en haar rechtsvoorgangers. Die ervaring zit verwerkt in de keuzes die tijdens het tekenen gemaakt worden, en dat komt terug in de kwaliteit van het opgeleverde werk.',
      },
    ],
    faq: [
      {
        q: 'Waarom begint een calculatie van een warmtenet met een tekening?',
        a: 'Zonder een nauwkeurig beeld van de ondergrond is elke kostenraming een aanname. De lengtes van het trace en de leidingdiameters komen rechtstreeks uit de nettekening, en die vormen de invoer voor de investeringscalculatie. Begint de calculatie zonder tekening, dan rust zij op geschatte lengtes.',
      },
      {
        q: 'Welke ondergrond gebruikt Qalor voor de nettekening?',
        a: 'Steevast een orientatiemelding van het Kadaster. Die geeft gedetailleerd weer wat er al ligt: kabels, leidingen, riolering en de bijbehorende beheerders. Op die ondergrond wordt het trace ingetekend, inclusief de punten waar het net bestaande infrastructuur kruist.',
      },
      {
        q: 'Waarom bepalen juist de kruisingen een deel van de aanlegkosten?',
        a: 'Een trace dat op kaart logisch lijkt, kan in de werkelijke ondergrond onuitvoerbaar of onnodig duur zijn. De kruisingen met bestaande infrastructuur en de beschikbare ruimte in het profiel bepalen in de praktijk een wezenlijk deel van de kosten, en die komen pas in beeld op een tekening met de juiste ondergrond.',
      },
    ],
  },
  {
    slug: 'warmtenet-ontwerp',
    title: 'Warmtenet ontwerp door energiedeskundigen | Qalor',
    description:
      'Ontwerp van warmtenetten voor gebouwen en wijken: tracékeuze, dimensionering en temperatuurregime, door ingenieurs met ruim 100 jaar ervaring bij warmtebedrijven.',
    h1: 'Warmtenet ontwerp',
    intro:
      'Het ontwerp van een warmtenet is de vertaling van een warmtevraag naar een net dat die vraag daadwerkelijk kan leveren — bij strenge vorst, tijdens de piekvraag. Qalor werkt dat ontwerp uit tot het detailniveau dat nodig is om een project technisch en financieel te kunnen beoordelen.',
    blocks: [
      {
        title: 'Tracé en dimensionering',
        body: 'Het tracé volgt uit de nettekening en de ondergrond zoals die uit de oriëntatiemelding van het Kadaster blijkt. Op basis van de vermogensbehoefte per aansluiting worden de leidingdiameters bepaald, van de transportleiding tot aan de laatste aansluitleiding. Daarbij is de bepaling van de gelijktijdigheid op alle niveaus in het warmtenet essentieel: niet alle aangeslotenen vragen tegelijk hun maximale vermogen, en een net dat op de som van alle pieken wordt gedimensioneerd is veel te zwaar en te duur. Een net dat te krap is uitgelegd, loopt daarentegen tegen zijn grenzen aan zodra er wordt uitgebreid.',
      },
      {
        title: 'Temperatuurregime',
        body: 'De keuze voor het temperatuurregime — de aanvoer- en retourtemperatuur — werkt door in vrijwel elke andere keuze in het ontwerp. Een lagere aanvoertemperatuur maakt duurzamere bronnen bruikbaar en beperkt de warmteverliezen, maar stelt eisen aan de afgifte in de aangesloten gebouwen en leidt tot grotere diameters. Welk regime passend is, hangt af van de gebouwvoorraad in het projectgebied — en dus van de gebouwendatabase.',
      },
      {
        title: 'Ruimte voor groei',
        body: "Warmtenetten worden zelden in één keer volledig aangelegd. In het ontwerp wordt daarom rekening gehouden met latere uitbreiding: waar kan het net worden doorgetrokken, welke diameters maken die uitbreiding mogelijk, en wat betekent dat voor de investering (CAPEX) nu tegenover de investeringen (CAPEX) later. Die afweging is expliciet onderdeel van het ontwerp en komt terug in de scenario's van de exploitatieberekening.",
      },
      {
        title: 'Ontwerp en calculatie in samenhang',
        body: 'Qalor richt zich op projectcalculaties en de daarbij behorende technische analyses. Het ontwerp staat daarbij niet los van de cijfers: elke ontwerpkeuze is tegelijk een kostenkeuze, en beide worden in samenhang uitgewerkt.',
      },
    ],
    faq: [
      {
        q: 'Wat betekent gelijktijdigheid bij het dimensioneren van een warmtenet?',
        a: 'Niet alle aangeslotenen vragen tegelijk hun maximale vermogen. Een net dat op de som van alle pieken wordt gedimensioneerd is veel te zwaar en te duur; een net dat te krap is uitgelegd loopt tegen zijn grenzen aan zodra er wordt uitgebreid. De bepaling van de gelijktijdigheid op alle niveaus in het net is daarom essentieel.',
      },
      {
        q: 'Hoe wordt het temperatuurregime gekozen?',
        a: 'Een lagere aanvoertemperatuur maakt duurzamere bronnen bruikbaar en beperkt de warmteverliezen, maar stelt eisen aan de afgifte in de aangesloten gebouwen en leidt tot grotere diameters. Welk regime passend is hangt af van de gebouwvoorraad in het projectgebied, en dus van de gebouwendatabase.',
      },
      {
        q: 'Wordt in het ontwerp rekening gehouden met latere uitbreiding?',
        a: "Ja. Warmtenetten worden zelden in een keer volledig aangelegd. In het ontwerp wordt vastgelegd waar het net kan worden doorgetrokken en welke diameters die uitbreiding mogelijk maken, en wat dat betekent voor de investering nu tegenover de investeringen later. Die afweging komt terug in de scenario's van de exploitatieberekening.",
      },
    ],
  },
  {
    slug: 'warmtenetberekening',
    title: 'Warmtenetberekening en gebouwendatabase | Qalor',
    description:
      'Warmtenetberekening op basis van een gebouwendatabase: warmtevraag, vermogens en leidingdimensionering, onderbouwd per aansluiting.',
    h1: 'Warmtenetberekening en gebouwendatabase',
    intro:
      'Een warmtenetberekening is niet sterker dan de gegevens waarop zij rust. Daarom stelt Qalor voor elk project eerst een complete gebouwendatabase op of doet gefundeerde aannamen op dat gebied, voordat vermogens en diameters worden bepaald.',
    blocks: [
      {
        title: 'De gebouwendatabase',
        body: 'De database wordt opgebouwd uit diverse openbare bronnen, waaronder het BAG-register en Atlas Leefomgeving. Per pand in het projectgebied worden gegevens vastgelegd zoals bouwjaar, gebruiksoppervlak en functie. Dat levert een beeld op van de gebouwvoorraad dat aanmerkelijk preciezer is dan een aanname op wijkniveau: twee wijken met evenveel woningen kunnen sterk verschillen in warmtevraag zodra bouwjaar en woningtype uiteenlopen.',
      },
      {
        title: 'Van gebouw naar warmtevraag',
        body: 'Op basis van die gegevens wordt per pand de warmtevraag en de benodigde aansluitwaarde bepaald. Die worden vervolgens samengevoegd tot de vermogensbehoefte van het net als geheel, waarbij rekening wordt gehouden met gelijktijdigheid — de mate waarin aangeslotenen tegelijk warmte vragen. Het verschil tussen de som van alle individuele pieken en het werkelijke te leveren piekvermogen is aanzienlijk, en bepaalt rechtstreeks hoe zwaar het net en de opwekinstallatie uitgevoerd moeten worden.',
      },
      {
        title: 'Van warmtevraag naar leidingdimensionering',
        body: 'Met de vermogens per aansluiting en het gekozen temperatuurregime volgen de benodigde debieten en daarmee de leidingdiameters per tracé. Samen met de tracélengtes uit de nettekening levert dat een onderbouwde materiaalstaat op: hoeveel meter van welke diameter, en waar. Dat is tegelijk de invoer voor de kostenraming — de berekening en de business case gebruiken dezelfde uitgangspunten, zodat een wijziging in het ontwerp overal consistent doorwerkt.',
      },
      {
        title: 'Navolgbaar en toetsbaar',
        body: 'Elke aanname in de berekening is terug te voeren op een bron of een expliciet vastgelegd uitgangspunt. Dat maakt het resultaat toetsbaar voor derden — voor een gemeente, een woningcorporatie of een financier die de onderbouwing wil kunnen volgen in plaats van alleen de uitkomst te zien.',
      },
    ],
    faq: [
      {
        q: 'Waar komen de gegevens voor de gebouwendatabase vandaan?',
        a: 'Uit diverse openbare bronnen, waaronder het BAG-register en Atlas Leefomgeving. Per pand in het projectgebied worden gegevens vastgelegd zoals bouwjaar, gebruiksoppervlak en functie.',
      },
      {
        q: 'Waarom niet gewoon rekenen met een aanname op wijkniveau?',
        a: 'Twee wijken met evenveel woningen kunnen sterk verschillen in warmtevraag zodra bouwjaar en woningtype uiteenlopen. Een database per pand levert een beeld op dat aanmerkelijk preciezer is, en dat verschil werkt door in de vermogens, de diameters en uiteindelijk in de investering.',
      },
      {
        q: 'Is de warmtenetberekening toetsbaar voor derden?',
        a: 'Elke aanname is terug te voeren op een bron of een expliciet vastgelegd uitgangspunt. Dat maakt het resultaat navolgbaar voor een gemeente, een woningcorporatie of een financier die de onderbouwing wil kunnen volgen in plaats van alleen de uitkomst te zien.',
      },
    ],
  },
  {
    slug: 'warmtenet-business-case',
    title: 'Warmtenet business case en exploitatieberekening | Qalor',
    description:
      'Exploitatieberekening en business case voor uw warmtenet: investering, opbrengsten en onrendabele top, zodat een project financieel onderbouwd is.',
    h1: 'Warmtenet business case en exploitatieberekening',
    intro:
      'Een warmtenet is een investering met een looptijd van decennia. De vraag is zelden of het technisch kan, maar of het financieel uit kan — en onder welke voorwaarden. De exploitatieberekening van Qalor brengt dat in beeld.',
    blocks: [
      {
        title: 'Het financiële model',
        body: 'Op basis van de AutoCAD-tekening, de gebouwendatabase en de bepaling van het concept en de investeringen van de energieopwekinstallatie wordt een uitgebreid financieel model in Excel gevuld. Aan de investeringskant staan het leidingnet, de opwekinstallatie, de aansluitkosten en de engineering; aan de opbrengstenkant het vastrecht, de warmtelevering en eventuele subsidies. Daartegenover staan de exploitatiekosten over de looptijd: onderhoud, inkoop van warmte en elektriciteit, netverliezen en beheer.',
      },
      {
        title: "Scenario's in plaats van één uitkomst",
        body: "Een business case met één uitkomst suggereert een zekerheid die er niet is. Daarom worden op basis van verschillende uitgangspunten diverse scenario's doorgerekend: een hoger of lager aansluitpercentage, een ander temperatuurregime, een andere warmtebron, een gefaseerde in plaats van een integrale aanleg. Zo wordt zichtbaar welke variabelen het resultaat werkelijk bepalen — en dat is een ander beeld dan de variabele waar in de discussie vaak de meeste aandacht naar uitgaat.",
      },
      {
        title: 'Onrendabele top',
        body: 'Uit de berekening volgt of, en zo ja in welke mate, er sprake is van een onrendabele top: het deel van de investering dat niet uit de exploitatie kan worden terugverdiend. Die uitkomst is de basis voor het gesprek over subsidie, over de verdeling van kosten tussen partijen, of over de vraag of het project in deze vorm haalbaar is.',
      },
      {
        title: 'Onderbouwd door mensen die het geëxploiteerd hebben',
        body: 'De lange ervaring van het team met het realiseren, onderhouden en exploiteren van warmte- en koudenetten bij Eneco en haar rechtsvoorgangers zorgt voor een gedegen en betrouwbare calculatie. Kostenposten die in theoretische modellen vaak ontbreken, komen uit de praktijk — en die praktijk is waar een business case zonder lange ervaring kan ontsporen.',
      },
    ],
    faq: [
      {
        q: 'Wat is een onrendabele top?',
        a: 'Het deel van de investering dat niet uit de exploitatie kan worden terugverdiend. Uit de berekening volgt of daarvan sprake is en zo ja in welke mate. Die uitkomst is de basis voor het gesprek over subsidie, over de verdeling van kosten tussen partijen, of over de vraag of het project in deze vorm haalbaar is.',
      },
      {
        q: "Waarom worden er meerdere scenario's doorgerekend?",
        a: 'Een business case met een enkele uitkomst suggereert een zekerheid die er niet is. Door verschillende uitgangspunten door te rekenen - een hoger of lager aansluitpercentage, een ander temperatuurregime, een andere warmtebron, gefaseerde in plaats van integrale aanleg - wordt zichtbaar welke variabelen het resultaat werkelijk bepalen.',
      },
      {
        q: 'Welke kosten zitten er in de exploitatieberekening?',
        a: 'Aan de investeringskant het leidingnet, de opwekinstallatie, de aansluitkosten en de engineering. Aan de opbrengstenkant het vastrecht, de warmtelevering en eventuele subsidies. Daartegenover de exploitatiekosten over de looptijd: onderhoud, inkoop van warmte en elektriciteit, netverliezen en beheer.',
      },
    ],
  },
  {
    slug: 'onrendabele-top-warmtenet',
    title: 'Onrendabele top warmtenet berekenen | Qalor',
    description:
      'De onrendabele top van een warmtenet onderbouwd berekenen: welk deel van de investering niet uit de exploitatie terugkomt, en waar dat vandaan komt.',
    h1: 'Onrendabele top van een warmtenet berekenen',
    intro:
      'Bij vrijwel elk warmtenet komt het gesprek uit op dezelfde vraag: welk deel van de investering komt niet uit de exploitatie terug, en wie draagt dat. De onrendabele top is het antwoord op die vraag - maar alleen als de berekening eronder navolgbaar is.',
    blocks: [
      {
        title: 'Wat de onrendabele top precies is',
        body: 'De onrendabele top is het deel van de investering dat over de looptijd niet wordt terugverdiend uit de exploitatie. Het is geen eigenschap van de techniek maar de uitkomst van een rekensom: investering, opbrengsten en kosten over decennia, tegen elkaar afgezet. Verandert een van die posten, dan verandert de onrendabele top mee - en dat is precies waarom een enkel getal zonder onderbouwing weinig waard is.',
      },
      {
        title: 'Waar het bedrag vandaan komt',
        body: 'De onrendabele top volgt uit de exploitatieberekening en dus uit de posten daarin: het leidingnet en de opwekinstallatie aan de investeringskant, het vastrecht en de warmtelevering aan de opbrengstenkant, en over de looptijd het onderhoud, de inkoop van warmte en elektriciteit, de netverliezen en het beheer. Elk van die posten is terug te voeren op de nettekening, de gebouwendatabase of een expliciet vastgelegd uitgangspunt.',
      },
      {
        title: 'Welke variabelen het bedrag werkelijk bepalen',
        body: "Het aansluitpercentage, het temperatuurregime en de keuze van de warmtebron doen in de meeste projecten meer met de uitkomst dan de post waar in de discussie de meeste aandacht naar uitgaat. Door scenario's naast elkaar door te rekenen wordt zichtbaar welke variabelen het resultaat dragen, en welke in de praktijk nauwelijks verschil maken.",
      },
      {
        title: 'Waarvoor de uitkomst gebruikt wordt',
        body: 'De onrendabele top is zelden een eindpunt. Het is de basis voor het gesprek over subsidie, over de verdeling van kosten tussen gemeente, corporatie en warmtebedrijf, of over de vraag of het project in deze vorm doorgang moet vinden. Een uitkomst die niet navolgbaar is, houdt in dat gesprek geen stand.',
      },
    ],
    faq: [
      {
        q: 'Hoe bereken je de onrendabele top van een warmtenet?',
        a: 'Door de volledige exploitatie over de looptijd door te rekenen: investering, opbrengsten en kosten, met de nettekening en de gebouwendatabase als onderbouwing. Het verschil dat niet uit de exploitatie terugkomt is de onrendabele top. Een berekening zonder die onderbouwing levert een getal op dat niet te toetsen is.',
      },
      {
        q: 'Betekent een onrendabele top dat een project niet haalbaar is?',
        a: 'Nee. Vrijwel elk warmtenet kent er een. De vraag is hoe groot die is, welke variabelen hem bepalen en of er partijen of subsidies zijn die hem kunnen dragen. Dat is een andere vraag dan of het project technisch kan.',
      },
      {
        q: 'Kan de onrendabele top nog omlaag?',
        a: "Vaak wel, en meestal niet via de post waar het gesprek zich op richt. Een ander temperatuurregime, een gefaseerde aanleg of een hoger aansluitpercentage werken in veel projecten sterker door dan een scherpere prijs op het leidingwerk. Welke dat zijn, volgt uit de scenario's.",
      },
    ],
  },
  {
    slug: 'haalbaarheidsonderzoek-warmtenet',
    title: 'Haalbaarheidsonderzoek warmtenet | Qalor',
    description:
      'Haalbaarheidsonderzoek voor een warmtenet: technische en financiele onderbouwing van een projectgebied, voordat er groot geld aan vervolgstappen gaat.',
    h1: 'Haalbaarheidsonderzoek warmtenet',
    intro:
      'Voordat een warmtenet ontworpen wordt, staat er een andere vraag: is dit gebied hiervoor geschikt, en onder welke voorwaarden. Een haalbaarheidsonderzoek beantwoordt die vraag met cijfers in plaats van met een aanname.',
    blocks: [
      {
        title: 'Wat er onderzocht wordt',
        body: 'Het projectgebied wordt in kaart gebracht: welke gebouwen staan er, wat is hun warmtevraag, welke bronnen zijn beschikbaar en hoe zou een trace door de bestaande ondergrond lopen. Daaruit volgt een eerste beeld van de investering en van de exploitatie - genoeg om te beoordelen of vervolgstappen zinvol zijn.',
      },
      {
        title: 'Waarom het met de gebouwen begint',
        body: 'De warmtevraag bepaalt vrijwel alles wat erna komt: de vermogens, de diameters, de omvang van de opwekinstallatie en daarmee de investering. Die vraag wordt per pand bepaald uit openbare bronnen, waaronder het BAG-register en Atlas Leefomgeving, en niet geschat op wijkniveau. Twee wijken met evenveel woningen kunnen sterk verschillen zodra bouwjaar en woningtype uiteenlopen.',
      },
      {
        title: 'Wat een haalbaarheidsonderzoek niet is',
        body: 'Het is geen ontwerp en geen definitieve business case. Het detailniveau is bewust lager: genoeg om een go of no-go te onderbouwen, niet genoeg om op aan te besteden. Blijkt het gebied kansrijk, dan zijn de nettekening, de warmtenetberekening en de exploitatieberekening de vervolgstappen, die op dezelfde uitgangspunten voortbouwen.',
      },
      {
        title: 'Toetsbaar voor wie meebeslist',
        body: 'Een haalbaarheidsonderzoek belandt zelden bij een enkele lezer. Gemeente, woningcorporatie, netbeheerder en financier kijken elk met een andere vraag mee. Elke aanname is daarom terug te voeren op een bron of een vastgelegd uitgangspunt, zodat de onderbouwing te volgen is en niet alleen de uitkomst.',
      },
    ],
    faq: [
      {
        q: 'Wat kost een haalbaarheidsonderzoek voor een warmtenet?',
        a: 'Dat hangt af van de omvang van het projectgebied en van het detailniveau dat nodig is om de beslissing te kunnen nemen. Een gebied van enkele honderden woningen vraagt een ander onderzoek dan een wijk met utiliteit erbij. Qalor bepaalt de omvang in overleg, op basis van de vraag die beantwoord moet worden.',
      },
      {
        q: 'Wat is het verschil met een business case?',
        a: "Een haalbaarheidsonderzoek beantwoordt of een gebied kansrijk is; een business case rekent het project financieel volledig door, inclusief scenario's en onrendabele top. Het onderzoek gaat vooraf en werkt met een lager detailniveau.",
      },
      {
        q: "Hoe lang duurt zo'n onderzoek?",
        a: 'Dat volgt uit de omvang van het gebied en uit de beschikbaarheid van gegevens over de bestaande ondergrond en de gebouwvoorraad. In de praktijk is het opbouwen van de gebouwendatabase vaak bepalend voor de doorlooptijd.',
      },
    ],
  },
  {
    slug: 'gelijktijdigheid-warmtenet',
    title: 'Gelijktijdigheid in een warmtenet bepalen | Qalor',
    description:
      'Gelijktijdigheid bepaalt hoe zwaar een warmtenet uitgevoerd moet worden. Te ruim gedimensioneerd is duur, te krap loopt vast bij uitbreiding.',
    h1: 'Gelijktijdigheid in een warmtenet',
    intro:
      'Niet alle aangeslotenen vragen tegelijk hun maximale vermogen. Hoeveel er werkelijk tegelijk wordt gevraagd - de gelijktijdigheid - bepaalt hoe zwaar het net en de opwekinstallatie uitgevoerd moeten worden, en daarmee een aanzienlijk deel van de investering.',
    blocks: [
      {
        title: 'Waarom de som van de pieken niet klopt',
        body: 'Als elke aansluiting haar maximale vermogen zou vragen op hetzelfde moment, zou een net op die som gedimensioneerd moeten worden. Dat gebeurt in de praktijk niet. Het verschil tussen de som van alle individuele pieken en het werkelijk te leveren piekvermogen is aanzienlijk, en een net dat op die som wordt uitgelegd is veel te zwaar en te duur.',
      },
      {
        title: 'En waarom te krap net zo duur is',
        body: 'De andere kant is even reeel. Een net dat scherp op de verwachte gelijktijdigheid is uitgelegd, loopt tegen zijn grenzen aan zodra er wordt uitgebreid of zodra de gebouwvoorraad verandert. Wat op de investering bespaard is, komt dan terug als een beperking op de groei van het net.',
      },
      {
        title: 'Op alle niveaus, niet alleen op het geheel',
        body: 'Gelijktijdigheid speelt niet alleen voor het net als geheel. Ook per streng, per cluster en per aansluitleiding verschilt het beeld: hoe kleiner de groep aangeslotenen, hoe minder de pieken tegen elkaar wegvallen. De bepaling op elk niveau is daarom onderdeel van de dimensionering, van de transportleiding tot aan de laatste aansluitleiding.',
      },
      {
        title: 'Wat het met de rest van de calculatie doet',
        body: 'Uit de gelijktijdigheid volgen de vermogens, uit de vermogens en het temperatuurregime volgen de debieten, en daaruit de diameters per trace. Samen met de tracelengtes uit de nettekening levert dat de materiaalstaat op - en daarmee de investering. Een aanname over gelijktijdigheid werkt dus door tot in de business case.',
      },
    ],
    faq: [
      {
        q: 'Wat is gelijktijdigheid in een warmtenet?',
        a: 'De mate waarin aangeslotenen tegelijk warmte vragen. Omdat niet iedereen op hetzelfde moment zijn maximale vermogen afneemt, is het werkelijk te leveren piekvermogen lager dan de som van alle individuele pieken.',
      },
      {
        q: 'Waarom mag je niet gewoon alle pieken optellen?',
        a: 'Omdat het net dan veel zwaarder en duurder wordt uitgevoerd dan nodig. Het verschil tussen de som van de pieken en het werkelijke piekvermogen is aanzienlijk en bepaalt rechtstreeks de diameters en de omvang van de opwekinstallatie.',
      },
      {
        q: 'Verschilt de gelijktijdigheid per deel van het net?',
        a: 'Ja. Hoe kleiner de groep aangeslotenen, hoe minder de pieken tegen elkaar wegvallen. Op een aansluitleiding ligt de gelijktijdigheid daarom dichter bij een dan op de transportleiding, en de dimensionering houdt daar op elk niveau rekening mee.',
      },
    ],
  },
  {
    slug: 'wet-collectieve-warmte',
    title: 'Wet collectieve warmte (Wcw) en uw projectcalculatie | Qalor',
    description:
      'Wat de Wet collectieve warmte betekent voor de calculatie van een warmteproject: publiek meerderheidsbelang, tarieven en de onderbouwing die daarbij hoort.',
    h1: 'Wet collectieve warmte (Wcw) en de projectcalculatie',
    intro:
      'De Wet collectieve warmte verandert wie een warmtenet mag exploiteren en hoe tarieven tot stand komen. Voor gemeenten en corporaties die nu een project voorbereiden, verandert daarmee ook wat een calculatie moet kunnen laten zien.',
    blocks: [
      {
        title: 'Waar de wet over gaat',
        body: 'De Wcw regelt de aanwijzing van warmtebedrijven, het publieke meerderheidsbelang in nieuwe collectieve warmtesystemen en de wijze waarop tarieven worden vastgesteld - weg van de koppeling met de gasprijs, richting kosten die aan het warmtesysteem zelf toe te rekenen zijn.',
      },
      {
        title: 'Wat dat met de calculatie doet',
        body: 'Een tariefstelling op basis van werkelijke kosten vraagt dat die kosten navolgbaar zijn: welke investering, welke exploitatiekosten, welke afschrijvingstermijn en welk rendement. Dat is precies de onderbouwing die een exploitatieberekening levert, en het is een strengere eis dan een business case die alleen op een eindbedrag uitkomt.',
      },
      {
        title: 'Publiek belang en de rol van de gemeente',
        body: 'Waar de gemeente of een publieke partij een meerderheidsbelang neemt, verschuift de vraag van of een marktpartij het wil doen naar of het publiek verantwoord kan. Dat maakt de verdeling van de onrendabele top tussen partijen een expliciet onderwerp in plaats van een sluitpost.',
      },
      {
        title: 'Wat Qalor hierin doet',
        body: 'Qalor stelt geen juridisch advies op. Wat Qalor levert is de rekenkundige onderbouwing waarop die gesprekken rusten: een investerings- en exploitatieberekening waarvan elke aanname terug te voeren is op een bron, zodat de cijfers standhouden tegenover een toezichthouder, een financier of een gemeenteraad.',
      },
    ],
    faq: [
      {
        q: 'Wat betekent de Wet collectieve warmte voor een lopend project?',
        a: 'Vooral dat de onderbouwing van kosten en tarieven zwaarder weegt. Een calculatie die alleen een eindbedrag oplevert, volstaat niet meer waar tarieven op werkelijke kosten gebaseerd moeten worden.',
      },
      {
        q: 'Geeft Qalor juridisch advies over de Wcw?',
        a: 'Nee. Qalor richt zich op projectcalculaties en de bijbehorende technische analyses. De rekenkundige onderbouwing die de wet vraagt, is wel precies wat een exploitatieberekening van Qalor oplevert.',
      },
      {
        q: 'Moet een gemeente nu al rekenen aan een warmtenet?',
        a: 'Als er een projectgebied in beeld is, helpt het om vroeg te weten wat het kost en welke variabelen de uitkomst bepalen. Een haalbaarheidsonderzoek geeft dat beeld voordat er grote bedragen aan vervolgstappen vastzitten.',
      },
    ],
  },
  {
    slug: 'en',
    title: 'District heating consultancy in the Netherlands | Qalor',
    description:
      'Qalor calculates district heating projects in the Netherlands: network drawings, load calculations and full business cases, by engineers who have run heat networks.',
    h1: 'District heating consultancy in the Netherlands',
    intro:
      'Qalor calculates district heating projects - from the network drawing through to the operating model. Three heat specialists with over 130 years of combined experience in the energy sector, more than 100 of them at heat utilities.',
    blocks: [
      {
        title: 'What we do',
        body: 'We produce project calculations and the technical analysis behind them: the network drawing in AutoCAD, a building-level database of heat demand, the sizing of pipes and plant, and a full operating calculation over the lifetime of the asset. Design and cost are worked out together, because every design choice is also a cost choice.',
      },
      {
        title: 'Why the numbers hold up',
        body: 'Every assumption traces back to a source or an explicitly recorded starting point - the Dutch Land Registry for what is already in the ground, the national building register for the building stock. That makes the result reviewable by a municipality, a housing association or a lender who wants to follow the reasoning rather than accept the outcome.',
      },
      {
        title: 'Who we work for',
        body: 'Municipalities, housing associations, developers and heat companies in the Netherlands, typically at the point where a project needs to be shown to be financially sound before it can proceed. Our work is in Dutch practice and Dutch regulation; this page exists for international parties involved in those projects.',
      },
    ],
    faq: [
      {
        q: 'Do you work outside the Netherlands?',
        a: 'Our work is grounded in Dutch data sources, Dutch regulation and Dutch construction practice, so our projects are in the Netherlands. International parties investing in or partnering on Dutch heat projects are welcome to contact us in English.',
      },
      {
        q: 'Can you deliver in English?',
        a: 'Yes. Calculations and reporting can be delivered in English for international stakeholders, though the underlying sources and regulation remain Dutch.',
      },
    ],
    lang: 'en',
  },
  {
    slug: 'en/district-heating-business-case',
    title: 'District heating business case and operating model | Qalor',
    description:
      'A district heating business case built on real inputs: investment, revenue, operating cost over the lifetime, and the unprofitable top that follows from them.',
    h1: 'District heating business case',
    intro:
      'A heat network is an investment measured in decades. The question is rarely whether it can be built, but whether it can be paid for, and on what terms. That is what the operating calculation sets out to answer.',
    blocks: [
      {
        title: 'The financial model',
        body: 'Built from the network drawing, the building database and the chosen generation concept. On the investment side: the pipe network, the plant, connection costs and engineering. On the revenue side: standing charges, heat sales and any subsidy. Against those, the operating costs over the lifetime - maintenance, purchased heat and electricity, network losses and management.',
      },
      {
        title: 'Scenarios rather than one answer',
        body: 'A business case with a single outcome implies a certainty that is not there. Different starting points are modelled side by side - a higher or lower connection rate, a different temperature regime, a different heat source, phased rather than one-off construction - so it becomes visible which variables actually drive the result. That is usually not the variable the discussion focuses on.',
      },
      {
        title: 'The unprofitable top',
        body: 'The calculation shows whether, and by how much, part of the investment cannot be recovered from operations. In Dutch practice this is the onrendabele top, and it is the basis for the conversation about subsidy, about how costs are shared between parties, or about whether the project is viable in its current form.',
      },
    ],
    faq: [
      {
        q: 'What is an unprofitable top?',
        a: 'The portion of the investment that cannot be recovered from operating the network over its lifetime. Almost every heat network has one; the useful questions are how large it is, which variables drive it, and who can carry it.',
      },
      {
        q: 'What inputs do you need to start?',
        a: 'A project area. From there the building stock is derived from public registers, and the route from the land registry record of existing underground infrastructure. Where data is missing, assumptions are made explicit rather than hidden in the result.',
      },
    ],
    lang: 'en',
    altSlug: 'warmtenet-business-case',
  },
  {
    slug: 'en/heat-network-feasibility-study',
    title: 'Heat network feasibility study, Netherlands | Qalor',
    description:
      'A feasibility study for a district heating project in the Netherlands: heat demand, route, indicative investment and operating outlook, before committing to design.',
    h1: 'Heat network feasibility study',
    intro:
      'Before a heat network is designed, a different question comes first: is this area suitable, and on what terms. A feasibility study answers that with figures rather than an assumption.',
    blocks: [
      {
        title: 'What is assessed',
        body: 'The project area is mapped: which buildings are there, what their heat demand is, which sources are available, and how a route would run through the existing underground infrastructure. That yields a first view of the investment and of operations - enough to judge whether further steps are worthwhile.',
      },
      {
        title: 'Why it starts with the buildings',
        body: 'Heat demand determines nearly everything downstream: capacities, pipe diameters, the size of the plant and therefore the investment. Demand is established per building from public registers rather than estimated at neighbourhood level. Two areas with the same number of homes can differ sharply once construction year and housing type diverge.',
      },
      {
        title: 'What it is not',
        body: 'It is not a design and not a final business case. The level of detail is deliberately lower: enough to support a go or no-go, not enough to tender on. If the area looks promising, the network drawing, the load calculation and the operating model follow, building on the same starting points.',
      },
    ],
    faq: [
      {
        q: 'How does a feasibility study differ from a business case?',
        a: 'A feasibility study answers whether an area is promising; a business case models the project financially in full, including scenarios and the unprofitable top. The study comes first and works at a lower level of detail.',
      },
      {
        q: 'What determines how long it takes?',
        a: 'The size of the area and the availability of data on the existing underground infrastructure and the building stock. In practice, assembling the building database is often what governs the timeline.',
      },
    ],
    lang: 'en',
    altSlug: 'haalbaarheidsonderzoek-warmtenet',
  },
];

/** The full shape GET /api/content returns, and what ContentContext seeds itself with. */
export type SiteContent = {
  hero: HeroContent;
  about: AboutContent;
  workProcessIntro: WorkProcessIntro;
  workProcessSteps: WorkProcessStep[];
  projectsIntro: SectionIntro;
  projects: Project[];
  teamIntro: SectionIntro;
  team: TeamMember[];
  footer: FooterContent;
};

export const DEFAULT_SITE_CONTENT: SiteContent = {
  hero: DEFAULT_HERO,
  about: DEFAULT_ABOUT,
  workProcessIntro: DEFAULT_WORK_PROCESS_INTRO,
  workProcessSteps: WORK_PROCESS_STEPS,
  projectsIntro: DEFAULT_PROJECTS_INTRO,
  projects: PROJECTS,
  teamIntro: DEFAULT_TEAM_INTRO,
  team: TEAM_MEMBERS,
  footer: DEFAULT_FOOTER,
};
