import type { TeamMember } from '@qalor/shared';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import qalorLogoImg from '../../assets/images/figures/qalor logo.png';
import { useContent } from '../../context/ContentContext';
import { optimizeUrl } from '../../lib/images';
import { Carousel } from '../Carousel/Carousel';
import './Team.css';

// Only loaded once someone actually opens a CV. Far less critical than it was when this
// pulled in a PDF library (see TeamPdfModal.tsx), but the modal is still only needed on
// click.
const TeamPdfModal = lazy(() => import('./TeamPdfModal'));

const AUTOPLAY_MS = 3000;
const CARD_MAX_WIDTH = 350;

type Slide = TeamMember & { photo?: string };

const TeamCard = ({ member, onOpenCv }: { member: Slide; onOpenCv: (m: Slide) => void }) => {
  if (member.isImage) {
    // No background: the logo PNG is RGBA, so it sits on whatever is behind it in either
    // theme. It used to be forced onto a white plate, which read as a white card floating
    // in the middle of the dark-mode carousel.
    return <img className="team-card team-card-logo" src={qalorLogoImg} alt="Qalor" />;
  }

  return (
    <article
      className="team-card"
      style={member.photo ? { backgroundImage: `url(${member.photo})` } : undefined}
    >
      {/* Fixed white on a scrim rather than theme tokens: this text sits on a photo, so its
          contrast has nothing to do with the page background and must not flip with the
          theme. The gradient is solid through the bottom half where the text actually sits
          and fades out only above it — checked against the real team photos by the a11y
          sweep, which passes down to about 0.25 opacity; 0.5 trades some of that margin for
          a visibly lighter fade, per feedback that 0.78 read as too dark. */}
      <div className="team-card-caption">
        <h3>{member.name}</h3>
        <div className="team-card-meta">
          <p>{member.description}</p>
          {member.pdfPath && (
            <button
              type="button"
              className="team-cv-button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenCv(member);
              }}
            >
              CV
              <span className="team-cv-arrow" aria-hidden="true">
                →
              </span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

const Team = () => {
  const { content } = useContent();
  const { eyebrow, heading } = content.teamIntro;
  const [openCv, setOpenCv] = useState<string | null>(null);

  const members: Slide[] = useMemo(
    () =>
      content.team.map((m) => ({
        ...m,
        photo: m.isImage ? undefined : m.photoUrl && optimizeUrl(m.photoUrl, CARD_MAX_WIDTH * 2),
      })),
    [content.team],
  );

  // Escape closes the modal, and the page behind it must not scroll while it's open.
  useEffect(() => {
    if (!openCv) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenCv(null);
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [openCv]);

  const openMemberCv = (m: Slide) => {
    if (!m.isImage && m.pdfPath) setOpenCv(m.pdfPath);
  };

  return (
    <>
      {openCv && (
        // Immediate backdrop while the modal's own chunk is still being fetched, so the
        // click has instant visual feedback instead of nothing happening.
        <Suspense fallback={<div className="team-modal-placeholder" />}>
          <TeamPdfModal pdfPath={openCv} onClose={() => setOpenCv(null)} />
        </Suspense>
      )}

      {/* No data-aos here: Team is the first below-the-fold section, close enough to the
          fold that on a tall-but-short viewport (desktop, 900px) it's already within AOS's
          trigger offset at load — caught as a real, non-deterministic contrast issue by
          e2e/a11y.spec.ts (mid-fade text reads as lower contrast than its settled state)
          and would have made the Lighthouse accessibility gate flaky in CI for the same
          reason. */}
      <section id="team" className="team-section">
        <div className="team-inner">
          <div className="team-intro">
            <div className="team-eyebrow">• {eyebrow}</div>
            <h2>{heading}</h2>
          </div>

          <Carousel
            items={members}
            itemKey={(m) => String(m.id)}
            renderItem={(m) => <TeamCard member={m} onOpenCv={openMemberCv} />}
            onItemClick={openMemberCv}
            autoplayMs={AUTOPLAY_MS}
            label="Teamleden"
            minHeight={{ mobile: 300, desktop: 320 }}
          />
        </div>
      </section>
    </>
  );
};

export default Team;
