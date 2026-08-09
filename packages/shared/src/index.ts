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

export const PROJECTS: Project[] = [
  {
    id: 1,
    order: 0,
    name: 'Heechterp Leeuwarden',
    role: 'Warmtenet Ontwerp',
    description:
      'warmtenet voor 868 woningen\nzowel bestaande bouw als nieuwbouw\nindopdrachtgever woningcorporatie Elkien',
    image: `${CLOUDINARY}/qalor/projects-heechterp.jpg`,
  },
  {
    id: 2,
    order: 1,
    name: 'Dokkum Fûgellân',
    role: 'Energie Optimalisatie',
    description:
      'warmtenet voor 1114 woningen + utiliteit\nbestaande bouw\nin opdracht van gemeente Noardeast-Fryslân',
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
      'in opdracht van gemeente Súdwest-Fryslán',
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
      'in opdracht van gemeente Súdwest-Fryslán',
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
      body: 'Een samenwerking van drie recent gepensioneerde warmte-experts\n\nMet meer dan 130 jaar ervaring in de energie wereld waarvan meer dan 100 jaar bij warmtebedrijven.',
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
    body: "Op basis van de AutoCAD tekening, de woningendatabase en de bepaling van het concept en de investeringen van de energie-opwekinstallatie wordt een uitgebreid financieel model in Excel gevuld, waarbij op basis van verschillende uitgangspunten diverse scenario's worden gemaakt.",
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
  heading: 'Onze projecten in 2024-2025',
};

export const DEFAULT_TEAM_INTRO: SectionIntro = {
  eyebrow: 'Ons team',
  heading:
    'Een gezamenlijke werkervaring van meer dan 130 jaar in de warmte wereld waarvan meer dan 100 jaar bij warmtebedrijven heeft geleid tot een unieke krachtenbundeling.',
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
  address: 'Lange Marktstraat 1, 8911AD, Leeuwarden',
  addressUrl: 'https://maps.app.goo.gl/svtgb5ivAYVd9MXAA',
  btwNumber: 'NL005077048B43',
  iban: 'NL94 ABNA 0134 0861 39',
  copyright: 'Copyright @ 2026 Qalor',
};

/**
 * SEO landing pages, one per search intent.
 *
 * Deliberately NOT part of SiteContent, and so not admin-editable yet: this copy is an
 * unreviewed draft (see the review notes that shipped with it — the ontwerp page in
 * particular is written to the narrow "calculatie" reading of what Qalor does, which needs
 * confirming). Building an editor for text that is about to be rewritten is the wrong
 * order. Once the wording is signed off, this moves into SiteContent as a list section
 * alongside projects/team — same shape, same merge, no change needed here to do it.
 *
 * `slug` is the single source of truth for the URL: scripts/prerender.mjs builds ROUTES
 * from this array, so a page added here gets prerendered, sitemapped and schema'd without
 * a second edit somewhere else.
 */
export type ServiceBlock = { title: string; body: string };

export type ServicePage = {
  slug: string;
  /** <title>. Kept distinct from h1: the title carries the brand, the h1 doesn't need to. */
  title: string;
  description: string;
  h1: string;
  intro: string;
  blocks: ServiceBlock[];
};

export const SERVICE_PAGES: ServicePage[] = [
  {
    slug: 'warmtenet-tekening',
    title: 'Warmtenet tekening in AutoCAD | Qalor',
    description:
      'Qalor vervaardigt de nettekening van uw warmtenet in AutoCAD: tracé, leidingdiameters en aansluitingen, als basis voor ontwerp en berekening.',
    h1: 'Warmtenet tekening in AutoCAD',
    intro:
      'Een betrouwbare calculatie van een warmteproject begint bij de tekening. Zonder een nauwkeurig beeld van de ondergrond is elke vermogensbepaling en elke kostenraming een aanname. Daarom is de nettekening in AutoCAD bij Qalor altijd de eerste stap, en niet een administratieve formaliteit achteraf.',
    blocks: [
      {
        title: 'De ondergrond als basis',
        body: 'De basis voor de ondergrond is steevast een oriëntatiemelding van het Kadaster. Die geeft gedetailleerd weer wat er al ligt: kabels, leidingen, riolering en de bijbehorende beheerders. Op die ondergrond wordt het tracé van het warmtenet ingetekend, inclusief de punten waar het net bestaande infrastructuur kruist. Juist die kruisingen en de beschikbare ruimte in het profiel bepalen in de praktijk een groot deel van de aanlegkosten — een tracé dat op een kaartje logisch lijkt, kan in de werkelijke ondergrond onuitvoerbaar of onnodig duur zijn.',
      },
      {
        title: 'Wat de tekening oplevert',
        body: 'De nettekening legt het tracé, de leidingdiameters en de aansluitpunten vast in één document dat de rest van het project draagt. De lengtes per diameter komen rechtstreeks uit de tekening en vormen de invoer voor de kostenraming; de aansluitpunten koppelen het net aan de gebouwendatabase. Wijzigt het tracé, dan werkt dat door in de berekening en in de business case — precies zoals het hoort, in plaats van dat drie documenten los van elkaar uit elkaar gaan lopen.',
      },
      {
        title: 'Waarom door ervaren netbouwers',
        body: 'Een tekening maken kan een tekenaar. Beoordelen of een tracé in de praktijk uitvoerbaar is, vraagt iemand die warmtenetten heeft aangelegd, onderhouden en geëxploiteerd. Het team van Qalor bestaat uit drie warmte-experts met samen meer dan 130 jaar ervaring in de energiewereld, waarvan meer dan 100 jaar bij warmtebedrijven — bij Eneco en haar rechtsvoorgangers. Die ervaring zit verwerkt in de keuzes die tijdens het tekenen gemaakt worden, en dat scheelt later in het traject.',
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
      'Het ontwerp van een warmtenet is de vertaling van een warmtevraag naar een net dat die vraag daadwerkelijk kan leveren — bij vorst, op het drukste moment van de dag, en over een looptijd van decennia. Qalor werkt dat ontwerp uit tot het detailniveau dat nodig is om een project technisch en financieel te kunnen beoordelen.',
    blocks: [
      {
        title: 'Tracé en dimensionering',
        body: 'Het tracé volgt uit de nettekening en de ondergrond zoals die uit de oriëntatiemelding van het Kadaster blijkt. Op basis van de vermogensbehoefte per aansluiting worden de leidingdiameters bepaald, van de transportleiding tot de laatste aftakking. Daarbij is de gelijktijdigheid bepalend: niet alle aangeslotenen vragen tegelijk hun maximale vermogen, en een net dat op de som van alle pieken wordt gedimensioneerd is structureel te zwaar en te duur. Een net dat te krap is uitgelegd, loopt daarentegen tegen zijn grenzen aan zodra er wordt uitgebreid.',
      },
      {
        title: 'Temperatuurregime',
        body: 'De keuze voor het temperatuurregime — de aanvoer- en retourtemperatuur — werkt door in vrijwel elke andere keuze in het ontwerp. Een lagere aanvoertemperatuur maakt duurzamere bronnen bruikbaar en beperkt de warmteverliezen, maar stelt eisen aan de afgifte in de aangesloten gebouwen en leidt tot grotere diameters. Welk regime passend is, hangt af van de gebouwvoorraad in het projectgebied — en dus van de gebouwendatabase.',
      },
      {
        title: 'Ruimte voor groei',
        body: "Warmtenetten worden zelden in één keer volledig aangelegd. In het ontwerp wordt daarom rekening gehouden met latere uitbreiding: waar kan het net worden doorgetrokken, welke diameters houden die uitbreiding mogelijk, en wat betekent dat voor de investering nu tegenover de kosten later. Die afweging is expliciet onderdeel van het ontwerp en komt terug in de scenario's van de exploitatieberekening.",
      },
      {
        title: 'Ontwerp en calculatie in samenhang',
        body: 'Qalor richt zich op projectcalculaties en de daarbij behorende technische analyses. Het ontwerp staat daarbij niet los van de cijfers: elke ontwerpkeuze is tegelijk een kostenkeuze, en beide worden in samenhang uitgewerkt.',
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
      'Een warmtenetberekening is niet sterker dan de gegevens waarop hij rust. Daarom stelt Qalor voor elk project eerst een complete gebouwendatabase op, voordat er één vermogen of één diameter wordt bepaald.',
    blocks: [
      {
        title: 'De gebouwendatabase',
        body: 'De database wordt opgebouwd uit diverse openbare bronnen, waaronder het BAG-register en Atlas Leefomgeving. Per pand in het projectgebied worden gegevens vastgelegd zoals bouwjaar, gebruiksoppervlak en functie. Dat levert een beeld op van de gebouwvoorraad dat aanmerkelijk preciezer is dan een aanname op wijkniveau: twee wijken met evenveel woningen kunnen sterk verschillen in warmtevraag zodra bouwjaar en woningtype uiteenlopen.',
      },
      {
        title: 'Van gebouw naar warmtevraag',
        body: 'Op basis van die gegevens wordt per pand de warmtevraag en de benodigde aansluitwaarde bepaald. Die worden vervolgens samengevoegd tot de vermogensbehoefte van het net als geheel, waarbij rekening wordt gehouden met gelijktijdigheid — de mate waarin aangeslotenen tegelijk warmte vragen. Het verschil tussen de som van alle individuele pieken en de werkelijke netpiek is aanzienlijk, en bepaalt rechtstreeks hoe zwaar het net en de opwekinstallatie uitgevoerd moeten worden.',
      },
      {
        title: 'Van warmtevraag naar leidingdimensionering',
        body: 'Met de vermogens per aansluiting en het gekozen temperatuurregime volgen de benodigde debieten en daarmee de leidingdiameters per segment. Samen met de tracélengtes uit de nettekening levert dat een onderbouwde materiaalstaat op: hoeveel meter van welke diameter, en waar. Dat is tegelijk de invoer voor de kostenraming — de berekening en de business case gebruiken dezelfde uitgangspunten, zodat een wijziging in het ontwerp overal consistent doorwerkt.',
      },
      {
        title: 'Navolgbaar en toetsbaar',
        body: 'Elke aanname in de berekening is terug te voeren op een bron of een expliciet vastgelegd uitgangspunt. Dat maakt het resultaat toetsbaar voor derden — voor een gemeente, een woningcorporatie of een financier die de onderbouwing wil kunnen volgen in plaats van alleen de uitkomst te zien.',
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
        body: 'Op basis van de AutoCAD-tekening, de gebouwendatabase en de bepaling van het concept en de investeringen van de energie-opwekinstallatie wordt een uitgebreid financieel model in Excel gevuld. Aan de investeringskant staan het leidingnet, de opwekinstallatie, de aansluitkosten en de engineering; aan de opbrengstenkant de vastrechten, de warmtelevering en eventuele bijdragen. Daartegenover staan de exploitatiekosten over de looptijd: onderhoud, inkoop van warmte of elektriciteit, netverliezen en beheer.',
      },
      {
        title: "Scenario's in plaats van één uitkomst",
        body: "Een business case met één uitkomst suggereert een zekerheid die er niet is. Daarom worden op basis van verschillende uitgangspunten diverse scenario's doorgerekend: een hoger of lager aansluitpercentage, een ander temperatuurregime, een andere warmtebron, een gefaseerde in plaats van een integrale aanleg. Zo wordt zichtbaar welke variabelen het resultaat werkelijk bepalen — en dat is vaak niet de variabele waar in de discussie de meeste aandacht naar uitgaat.",
      },
      {
        title: 'Onrendabele top',
        body: 'Uit de berekening volgt of, en zo ja in welke mate, er sprake is van een onrendabele top: het deel van de investering dat niet uit de exploitatie kan worden terugverdiend. Die uitkomst is de basis voor het gesprek over subsidie, over de verdeling van kosten tussen partijen, of over de vraag of het project in deze vorm haalbaar is.',
      },
      {
        title: 'Onderbouwd door mensen die het geëxploiteerd hebben',
        body: 'De lange ervaring van het team met het realiseren, onderhouden en exploiteren van warmte- en koudenetten bij Eneco en haar rechtsvoorgangers zorgt voor een gedegen en betrouwbare calculatie. Kostenposten die in theoretische modellen vaak ontbreken, komen uit de praktijk — en die praktijk is waar een business case doorgaans op stukloopt.',
      },
    ],
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
