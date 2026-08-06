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
  id: number;
  name: string;
  role: string;
  description: string | string[];
  color: string;
  // Cloudinary URL, untransformed — packages/web/src/lib/images.ts's optimizeUrl()
  // applies f_auto/q_auto/resize at the point of use, per rendered size.
  image: string;
};

const CLOUDINARY = 'https://res.cloudinary.com/o5hr8kjc/image/upload';

export const PROJECTS: Project[] = [
  {
    id: 1,
    name: 'Heechterp Leeuwarden',
    role: 'Warmtenet Ontwerp',
    description:
      'warmtenet voor 868 woningen\nzowel bestaande bouw als nieuwbouw\nindopdrachtgever woningcorporatie Elkien',
    color: '#007bff',
    image: `${CLOUDINARY}/qalor/projects-heechterp.jpg`,
  },
  {
    id: 2,
    name: 'Dokkum Fûgellân',
    role: 'Energie Optimalisatie',
    description:
      'warmtenet voor 1114 woningen + utiliteit\nbestaande bouw\nin opdracht van gemeente Noardeast-Fryslân',
    color: '#28a745',
    image: `${CLOUDINARY}/qalor/projects-dokkum.jpg`,
  },
  {
    id: 3,
    name: 'Anjum - Esonstad',
    role: 'Haalbaarheidsonderzoek',
    description: [
      'warmtenet voor 604 woningen + utiliteit',
      'bestaande bouw',
      'in opdracht van gemeente Noardeast-Fryslân / Energiecorporatie De Anjummer Eendragt',
    ],
    color: '#dc3545',
    image: `${CLOUDINARY}/qalor/projects-anjum.jpg`,
  },
  {
    id: 4,
    name: 'Sneek Het Eiland',
    role: 'Smart Technology',
    description: [
      'warmte- en koudenet voor 604 woningen',
      'bestaande bouw',
      'in opdracht van gemeente Súdwest-Fryslán',
    ],
    color: '#fd7e14',
    image: `${CLOUDINARY}/qalor/projects-sneek.jpg`,
  },
  {
    id: 5,
    name: 'Heeg',
    role: 'Innovatie & Advies',
    description: [
      'warmtenet voor 819 woningen',
      'bestaande bouw',
      'in opdracht van gemeente Súdwest-Fryslán',
    ],
    color: '#6f42c1',
    image: `${CLOUDINARY}/qalor/projects-heeg.jpg`,
  },
  {
    id: 6,
    name: 'Heechterp (vervolgopdracht)',
    role: 'Consultancy',
    description: [
      'warmtenet voor 1130 woningen',
      'zowel bestaande bouw als nieuwbouw',
      'in opdracht van Warmtebedrijf Heechterp',
    ],
    color: '#20c997',
    image: `${CLOUDINARY}/qalor/projects-heechterp2.png`,
  },
  {
    id: 7,
    name: 'Assen Componistenbuurt',
    role: 'Onderzoek',
    description: [
      'warmtenet voor 960 woningen',
      'zowel bestaande bouw als nieuwbouw',
      'in opdracht van Bouwgroep Dijkstra Draisma',
    ],
    color: '#ffc107',
    image: `${CLOUDINARY}/qalor/projects-assencomp.jpg`,
  },
];

export type TeamMember = {
  id: number;
  name?: string;
  description?: string;
  isImage?: boolean;
  // Absolute path served from the site root (base '/', not the old GitHub Pages
  // '/qalor/' prefix) — matches vite.config.ts's `base: '/'` and packages/web/public.
  pdfPath?: string;
  // Cloudinary URL, untransformed — see the note on Project['image'] above.
  photoUrl?: string;
};

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 1,
    name: 'Peter de Keijzer',
    description: 'Warmte-expert',
    pdfPath: '/documents/CV_Peter_de_Keijzer.pdf',
    photoUrl: `${CLOUDINARY}/qalor/team-peter.png`,
  },
  {
    id: 2,
    name: 'Huub Jansen',
    description: 'Warmte-expert',
    pdfPath: '/documents/CV_Huub_Jansen.pdf',
    photoUrl: `${CLOUDINARY}/qalor/team-huub.png`,
  },
  {
    id: 3,
    name: 'Jan Pouw',
    description: 'Warmte-expert',
    pdfPath: '/documents/CV_Jan_Pouw.pdf',
    photoUrl: `${CLOUDINARY}/qalor/team-jan.png`,
  },
  { id: 4, isImage: true },
];

export const PDF_WORKER_URL = '/pdfjs/pdf.worker.min.js';

export const SITE_TITLE = 'Qalor';
export const SITE_DESCRIPTION =
  'Qalor — energiedeskundigen voor warmtenetten: advies, ontwerp en realisatie van energie-efficiënte warmteoplossingen voor gebouwen en wijken.';
