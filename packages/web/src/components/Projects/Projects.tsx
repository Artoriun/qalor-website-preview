import type { Project } from '@qalor/shared';
import { useContent } from '../../context/ContentContext';
import { optimizeUrl } from '../../lib/images';
import { Carousel } from '../Carousel/Carousel';
import './Projects.css';

const AUTOPLAY_MS = 5000;

/** The visible card is capped at 350px even where the slide is wider, so the image is
 *  requested at twice that rather than twice the slide width — which used to ask for up to
 *  800px for something that never renders above 700. */
const CARD_MAX_WIDTH = 350;

const ProjectCard = ({ project }: { project: Project }) => {
  const lines = Array.isArray(project.description)
    ? project.description
    : project.description.split('\n');

  return (
    <article
      className="project-card"
      style={{
        backgroundImage: `url(${optimizeUrl(project.image, CARD_MAX_WIDTH * 2)})`,
      }}
    >
      {/* Fixed white on a dark scrim, not theme tokens: this text sits on an arbitrary
          photo, so its contrast has nothing to do with the page background and must not
          flip with the theme. The gradient is what guarantees it regardless of the image. */}
      <div className="project-card-caption">
        <h3>{project.name}</h3>
        <ul>
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </article>
  );
};

const Projects = () => {
  const { content } = useContent();
  const { eyebrow, heading } = content.projectsIntro;

  return (
    <section id="projects" data-aos="fade-right" className="projects-section">
      <div className="projects-inner">
        <div className="projects-intro">
          {/* Section-background tier, not the stronger one: this label sits on
              --bg-section, not white, and the stronger tier falls just short of 3:1 there. */}
          <div className="projects-eyebrow">• {eyebrow}</div>
          <h2>{heading}</h2>
        </div>

        <Carousel
          items={content.projects}
          itemKey={(p) => String(p.id)}
          renderItem={(p) => <ProjectCard project={p} />}
          autoplayMs={AUTOPLAY_MS}
          label="Projecten"
          minHeight={{ mobile: 320, desktop: 350 }}
        />
      </div>
    </section>
  );
};

export default Projects;
