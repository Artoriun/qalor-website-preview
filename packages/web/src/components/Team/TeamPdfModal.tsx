import './TeamPdfModal.css';

// packages/shared stores CV paths as root-relative ('/documents/...') since it can't depend
// on Vite's import.meta.env (that file is also imported directly by Node in
// scripts/prerender.mjs, outside Vite entirely). Prefixing with BASE_URL here, where Vite's
// env is actually available, is what makes these resolve when the site isn't served from the
// domain root (e.g. a GitHub Pages project site under a subpath). An admin-uploaded CV is an
// absolute Cloudinary URL instead, which must be left alone.
const withBase = (path: string) =>
  /^https?:\/\//.test(path) ? path : `${import.meta.env.BASE_URL.replace(/\/$/, '')}${path}`;

/**
 * The CV modal, rendered by the browser's own PDF viewer via <iframe>.
 *
 * This used to be @react-pdf-viewer/core on top of a self-hosted pdf.js worker. Measured on
 * the production build, opening one CV transferred 1.54MB — 1.09MB of that the worker alone,
 * 407KB the viewer — to display a 102KB document. Every modern browser already ships a PDF
 * viewer with zoom, print and download built in, so all of that was reimplementing something
 * native, at roughly fifteen times the weight of the file being shown.
 *
 * Still lazy-loaded from Team.tsx. That mattered enormously when this pulled in a library;
 * it barely matters now, but the modal is genuinely only needed on click, so there's no
 * reason to move it back into the initial bundle.
 *
 * The "open in a new tab" link is not a decorative extra — it is the fallback path. iOS
 * Safari has a long history of rendering only the first page of a PDF in an iframe, and
 * in-app browsers (Instagram, Facebook) sometimes refuse to render one inline at all. On
 * those, the iframe may show nothing useful and this link is the only way through, so it is
 * always visible rather than hidden behind a failure that can't be feature-detected.
 */
type TeamPdfModalProps = {
  /** Remounts the iframe when a different CV is opened without the modal closing first. */
  pdfKey: number;
  pdfPath: string;
  onClose: () => void;
};

const TeamPdfModal = ({ pdfKey, pdfPath, onClose }: TeamPdfModalProps) => {
  const url = withBase(pdfPath);

  return (
    <div
      className="pdf-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pdf-modal-container">
        <div className="pdf-modal-bar">
          {/* Phrased as a question rather than a bare link because whether the iframe below
              actually renders cannot be feature-detected — a browser that refuses to show a
              PDF inline gives no signal, it just paints nothing. So the blank case has to
              explain itself in advance instead of being handled after the fact. */}
          <p className="pdf-modal-hint">
            Verschijnt de CV niet?{' '}
            <a className="pdf-modal-open" href={url} target="_blank" rel="noopener noreferrer">
              Open in nieuw tabblad
            </a>
          </p>
          <button type="button" className="pdf-modal-close" onClick={onClose} aria-label="Sluiten">
            ×
          </button>
        </div>
        <iframe key={pdfKey} src={url} title="CV" className="pdf-modal-frame" />
      </div>
    </div>
  );
};

export default TeamPdfModal;
