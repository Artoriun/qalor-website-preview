import './fonts.css';
import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { IS_PRERENDERED } from './lib/prerendered';

/**
 * Adopt the prerendered markup rather than replacing it.
 *
 * createRoot on a container that already has children does not reuse them — it empties the
 * container and mounts a fresh tree. scripts/prerender.mjs writes the whole captured page
 * into #root, so every visitor got that painted and then destroyed and rebuilt: the Hero's
 * hero-in animation replaying from opacity 0 on a brand-new node, AOS re-initialising against
 * DOM React had just created and dropping five sections back to transparent, and the images
 * decoding a second time. A warm cache hid it by landing the rebuild inside the Hero's own
 * 500ms animation; cold, the gap is hundreds of milliseconds, which is what reads as the page
 * loading twice.
 *
 * Hydrate only where there is markup to adopt. /admin and 404.html are served as the plain
 * shell with an empty #root, and hydrating an empty container is an error, so those mount
 * normally. ContentContext already seeds from window.__CONTENT__ for exactly this reason —
 * its comments describe a hydration pass that, until now, never happened.
 */
const container = document.getElementById('root');
if (!container) throw new Error('#root is missing from the document');

const tree = (
  <StrictMode>
    <App />
  </StrictMode>
);

if (IS_PRERENDERED) {
  hydrateRoot(container, tree);
} else {
  createRoot(container).render(tree);
}
