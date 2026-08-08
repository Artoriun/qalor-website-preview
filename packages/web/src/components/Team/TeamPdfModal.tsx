import { PDF_WORKER_URL } from '@qalor/shared';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '../../pdf-viewer-override.css';

// packages/shared stores these as root-relative paths ('/pdfjs/...', '/documents/...')
// since it can't depend on Vite's import.meta.env (that file is also imported directly by
// Node in scripts/prerender.mjs, outside Vite entirely). Prefixing with BASE_URL here,
// where Vite's env is actually available, is what makes these resolve correctly when the
// site isn't served from the domain root (e.g. a GitHub Pages project site under a subpath).
const withBase = (path: string) => `${import.meta.env.BASE_URL.replace(/\/$/, '')}${path}`;

// Split out of Team.tsx on purpose: @react-pdf-viewer/core is ~120KB gzipped, of which
// Lighthouse measured ~108KB unused on a page load that never opens the modal — which is
// most of them, since Team itself renders unconditionally near the top of the page. That
// cost was being paid on every visit regardless of whether anyone ever clicks "CV". This
// component is its own lazy chunk, so the library only loads on the actual click.
type TeamPdfModalProps = {
  pdfKey: number;
  pdfPath: string;
  onClose: () => void;
};

const TeamPdfModal = ({ pdfKey, pdfPath, onClose }: TeamPdfModalProps) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        boxSizing: 'border-box',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onTouchStart={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
          onClose();
        }
      }}
    >
      {/* Additional bottom tap area for mobile portrait */}
      <div
        onClick={onClose}
        onTouchStart={onClose}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '80px',
          zIndex: 1001,
        }}
      />

      {/* PDF Container */}
      <div
        className="pdf-modal-container"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: '#F18825',
            color: 'black',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            zIndex: 1003,
            fontSize: '24px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0',
            lineHeight: '1',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          ×
        </button>
        <Worker workerUrl={withBase(PDF_WORKER_URL)}>
          <Viewer key={pdfKey} fileUrl={withBase(pdfPath)} />
        </Worker>
      </div>
    </div>
  );
};

export default TeamPdfModal;
