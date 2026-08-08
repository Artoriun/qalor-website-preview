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

export const PDF_WORKER_URL = '/pdfjs/pdf.worker.min.js';

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
