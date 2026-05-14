import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Mail, MapPin, Globe, ExternalLink, Github, Linkedin,
  Star, GraduationCap, Award, Code2, Briefcase, User,
  Phone, Send, BookOpen, FolderGit2, Trophy
} from 'lucide-react';
import './PublicPortfolioPage.css';

/* ─── Template Mapping ─── */
const TEMPLATE_MAP = {
  'minimal-professional': 'template-minimal-professional',
  'developer-dark': 'template-developer-dark',
  'creative-modern': 'template-creative-modern',
  'fresher-student': 'template-fresher-student',
};

/**
 * PublicPortfolioPage — renders a shareable portfolio at /u/:slug
 * Fetches normalized profile data from the backend and renders it
 * using the template selected during generation.
 */
export default function PublicPortfolioPage() {
  const { slug } = useParams();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;

    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/portfolio/public/${slug}`);
        if (res.status === 404) {
          setError('not-found');
          return;
        }
        if (!res.ok) throw new Error('Failed to load portfolio');
        const data = await res.json();
        setPortfolio(data?.portfolio || data);
      } catch (err) {
        console.error('Portfolio fetch error:', err);
        setError('error');
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [slug]);

  // Set page title
  useEffect(() => {
    if (portfolio?.basics?.name) {
      document.title = `${portfolio.basics.name} — Portfolio`;
    }
    return () => { document.title = 'PrepLoop'; };
  }, [portfolio]);

  if (loading) {
    return (
      <div className="pp-loading">
        <div className="pp-spinner" />
        <p>Loading portfolio…</p>
      </div>
    );
  }

  if (error === 'not-found' || !portfolio) {
    return (
      <div className="pp-not-found">
        <h2>Portfolio Not Found</h2>
        <p>The portfolio you're looking for doesn't exist or hasn't been published yet.</p>
        <Link to="/" className="pp-btn pp-btn-primary">← Back to Home</Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pp-error">
        <h2>Something went wrong</h2>
        <p>We couldn't load this portfolio. Please try again later.</p>
        <Link to="/" className="pp-btn pp-btn-secondary">← Back to Home</Link>
      </div>
    );
  }

  const {
    basics = {},
    socials = {},
    skills = {},
    experience = [],
    education = [],
    projects = [],
    achievements = [],
    openSource = {},
    portfolioMeta = {},
  } = portfolio;

  const template = TEMPLATE_MAP[portfolioMeta.template] || TEMPLATE_MAP['minimal-professional'];
  const sectionVisibility = portfolioMeta.sectionVisibility || {};
  const isVisible = (section) => sectionVisibility[section] !== false;

  const initial = (basics.name || 'U').charAt(0).toUpperCase();

  // Flatten skills into categorized lists
  const skillCategories = [
    { label: 'Languages', items: skills.languages || [] },
    { label: 'Frameworks & Libraries', items: skills.frameworks || [] },
    { label: 'Tools & Platforms', items: skills.tools || [] },
    { label: 'Domains', items: skills.domains || [] },
  ].filter(cat => cat.items.length > 0);

  const hasSkills = skillCategories.length > 0;
  const hasExperience = experience.length > 0;
  const hasProjects = projects.length > 0;
  const hasEducation = education.length > 0;
  const hasAchievements = achievements.length > 0;
  const hasOpenSource = openSource.totalStars > 0 || openSource.totalRepos > 0;
  const hasContact = basics.email || basics.phone || basics.website || socials.linkedin || socials.github;

  return (
    <div className={`pp-portfolio ${template}`}>
      {/* ═══ HERO ═══ */}
      {isVisible('hero') && (
        <section className="pp-hero">
          <div className="pp-container">
            <div className="pp-hero-inner">
              <div className="pp-avatar-wrap">
                <div className="pp-avatar">
                  {basics.photo
                    ? <img src={basics.photo} alt={basics.name} />
                    : initial
                  }
                </div>
              </div>
              <div className="pp-hero-info">
                <h1 className="pp-hero-name">{basics.name || 'Portfolio'}</h1>
                {basics.title && <p className="pp-hero-title">{basics.title}</p>}
                {basics.location && (
                  <p className="pp-hero-location">
                    <MapPin size={14} /> {basics.location}
                  </p>
                )}
                <div className="pp-hero-actions">
                  {basics.email && (
                    <a href={`mailto:${basics.email}`} className="pp-btn pp-btn-primary">
                      <Send size={16} /> Contact Me
                    </a>
                  )}
                  {socials.github && (
                    <a href={`https://github.com/${socials.github}`} target="_blank" rel="noopener noreferrer" className="pp-btn pp-btn-secondary">
                      <Github size={16} /> GitHub
                    </a>
                  )}
                  {socials.linkedin && (
                    <a href={socials.linkedin.startsWith('http') ? socials.linkedin : `https://linkedin.com/in/${socials.linkedin}`}
                       target="_blank" rel="noopener noreferrer" className="pp-btn pp-btn-secondary">
                      <Linkedin size={16} /> LinkedIn
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="pp-container">
        {/* ═══ ABOUT ═══ */}
        {isVisible('about') && basics.summary && (
          <section className="pp-section" style={{ animationDelay: '0.1s' }}>
            <h2 className="pp-section-title">
              <span className="pp-title-icon"><User size={16} /></span>
              About
            </h2>
            <p className="pp-about-text">{basics.summary}</p>
          </section>
        )}

        {/* ═══ SKILLS ═══ */}
        {isVisible('skills') && hasSkills && (
          <section className="pp-section" style={{ animationDelay: '0.15s' }}>
            <h2 className="pp-section-title">
              <span className="pp-title-icon"><Code2 size={16} /></span>
              Skills
            </h2>
            {skillCategories.map(cat => (
              <div key={cat.label} className="pp-skills-group">
                <div className="pp-skills-label">{cat.label}</div>
                <div className="pp-skills-chips">
                  {cat.items.map((skill, i) => (
                    <span key={`${skill}-${i}`} className="pp-skill-chip">{skill}</span>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ═══ EXPERIENCE ═══ */}
        {isVisible('experience') && hasExperience && (
          <section className="pp-section" style={{ animationDelay: '0.2s' }}>
            <h2 className="pp-section-title">
              <span className="pp-title-icon"><Briefcase size={16} /></span>
              Experience
            </h2>
            <div className="pp-timeline">
              {experience.map((exp, i) => (
                <div key={i} className="pp-timeline-item">
                  <div className="pp-timeline-dot" />
                  <div className="pp-timeline-header">
                    <div>
                      <h3 className="pp-timeline-role">{exp.role || exp.title}</h3>
                      <p className="pp-timeline-company">{exp.company}</p>
                    </div>
                    <span className="pp-timeline-dates">
                      {exp.start}{exp.end ? ` — ${exp.end}` : ''}
                    </span>
                  </div>
                  {Array.isArray(exp.achievements) && exp.achievements.length > 0 && (
                    <ul className="pp-timeline-achievements">
                      {exp.achievements.map((ach, j) => (
                        <li key={j}>{ach}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ═══ FEATURED PROJECTS ═══ */}
        {isVisible('projects') && hasProjects && (
          <section className="pp-section" style={{ animationDelay: '0.25s' }}>
            <h2 className="pp-section-title">
              <span className="pp-title-icon"><FolderGit2 size={16} /></span>
              Featured Projects
            </h2>
            <div className="pp-projects-grid">
              {projects.map((project, i) => (
                <div key={i} className="pp-project-card">
                  <div className="pp-project-header">
                    <h3 className="pp-project-name">{project.name}</h3>
                    {typeof project.stars === 'number' && project.stars > 0 && (
                      <span className="pp-project-stars">
                        <Star size={14} /> {project.stars}
                      </span>
                    )}
                  </div>
                  {project.description && (
                    <p className="pp-project-desc">{project.description}</p>
                  )}
                  {Array.isArray(project.technologies) && project.technologies.length > 0 && (
                    <div className="pp-project-tech">
                      {project.technologies.map((tech, j) => (
                        <span key={j}>{tech}</span>
                      ))}
                    </div>
                  )}
                  <div className="pp-project-links">
                    {project.repoUrl && (
                      <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="pp-project-link">
                        <Github size={14} /> Source
                      </a>
                    )}
                    {project.demoUrl && (
                      <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="pp-project-link">
                        <ExternalLink size={14} /> Live Demo
                      </a>
                    )}
                    {project.link && !project.repoUrl && (
                      <a href={project.link} target="_blank" rel="noopener noreferrer" className="pp-project-link">
                        <ExternalLink size={14} /> View
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ═══ OPEN SOURCE / GITHUB STATS ═══ */}
        {isVisible('openSource') && hasOpenSource && (
          <section className="pp-section" style={{ animationDelay: '0.3s' }}>
            <h2 className="pp-section-title">
              <span className="pp-title-icon"><Github size={16} /></span>
              Open Source
            </h2>
            <div className="pp-github-stats">
              {openSource.totalRepos > 0 && (
                <div className="pp-stat-card">
                  <div className="pp-stat-value">{openSource.totalRepos}</div>
                  <div className="pp-stat-label">Repositories</div>
                </div>
              )}
              {openSource.totalStars > 0 && (
                <div className="pp-stat-card">
                  <div className="pp-stat-value">{openSource.totalStars}</div>
                  <div className="pp-stat-label">Total Stars</div>
                </div>
              )}
              {openSource.followers > 0 && (
                <div className="pp-stat-card">
                  <div className="pp-stat-value">{openSource.followers}</div>
                  <div className="pp-stat-label">Followers</div>
                </div>
              )}
              {openSource.contributions > 0 && (
                <div className="pp-stat-card">
                  <div className="pp-stat-value">{openSource.contributions}</div>
                  <div className="pp-stat-label">Contributions</div>
                </div>
              )}
              {openSource.topLanguages?.length > 0 && (
                <div className="pp-stat-card">
                  <div className="pp-stat-value">{openSource.topLanguages.length}</div>
                  <div className="pp-stat-label">Languages Used</div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ═══ EDUCATION ═══ */}
        {isVisible('education') && hasEducation && (
          <section className="pp-section" style={{ animationDelay: '0.35s' }}>
            <h2 className="pp-section-title">
              <span className="pp-title-icon"><GraduationCap size={16} /></span>
              Education
            </h2>
            <div className="pp-education-list">
              {education.map((edu, i) => (
                <div key={i} className="pp-education-item">
                  <div className="pp-edu-icon">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 className="pp-edu-degree">{edu.degree || edu.field}</h3>
                    <p className="pp-edu-school">{edu.institute || edu.school}</p>
                    {edu.year && <p className="pp-edu-year">{edu.year}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ═══ ACHIEVEMENTS ═══ */}
        {isVisible('achievements') && hasAchievements && (
          <section className="pp-section" style={{ animationDelay: '0.4s' }}>
            <h2 className="pp-section-title">
              <span className="pp-title-icon"><Trophy size={16} /></span>
              Achievements
            </h2>
            <div className="pp-achievements-grid">
              {achievements.map((ach, i) => {
                const text = typeof ach === 'string' ? ach : ach.title || ach.name || '';
                return (
                  <div key={i} className="pp-achievement-item">
                    <div className="pp-achievement-icon">
                      <Award size={16} />
                    </div>
                    <span className="pp-achievement-text">{text}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ═══ CONTACT ═══ */}
        {isVisible('contact') && hasContact && (
          <section className="pp-section" style={{ animationDelay: '0.45s' }}>
            <h2 className="pp-section-title">
              <span className="pp-title-icon"><Mail size={16} /></span>
              Get In Touch
            </h2>
            <div className="pp-contact-grid">
              {basics.email && (
                <div className="pp-contact-item">
                  <div className="pp-contact-icon"><Mail size={18} /></div>
                  <div>
                    <div className="pp-contact-label">Email</div>
                    <div className="pp-contact-value">
                      <a href={`mailto:${basics.email}`}>{basics.email}</a>
                    </div>
                  </div>
                </div>
              )}
              {basics.phone && (
                <div className="pp-contact-item">
                  <div className="pp-contact-icon"><Phone size={18} /></div>
                  <div>
                    <div className="pp-contact-label">Phone</div>
                    <div className="pp-contact-value">{basics.phone}</div>
                  </div>
                </div>
              )}
              {basics.website && (
                <div className="pp-contact-item">
                  <div className="pp-contact-icon"><Globe size={18} /></div>
                  <div>
                    <div className="pp-contact-label">Website</div>
                    <div className="pp-contact-value">
                      <a href={basics.website.startsWith('http') ? basics.website : `https://${basics.website}`}
                         target="_blank" rel="noopener noreferrer">{basics.website}</a>
                    </div>
                  </div>
                </div>
              )}
              {socials.linkedin && (
                <div className="pp-contact-item">
                  <div className="pp-contact-icon"><Linkedin size={18} /></div>
                  <div>
                    <div className="pp-contact-label">LinkedIn</div>
                    <div className="pp-contact-value">
                      <a href={socials.linkedin.startsWith('http') ? socials.linkedin : `https://linkedin.com/in/${socials.linkedin}`}
                         target="_blank" rel="noopener noreferrer">
                        {socials.linkedin.replace(/https?:\/\/(www\.)?linkedin\.com\/in\//i, '')}
                      </a>
                    </div>
                  </div>
                </div>
              )}
              {socials.github && (
                <div className="pp-contact-item">
                  <div className="pp-contact-icon"><Github size={18} /></div>
                  <div>
                    <div className="pp-contact-label">GitHub</div>
                    <div className="pp-contact-value">
                      <a href={`https://github.com/${socials.github}`}
                         target="_blank" rel="noopener noreferrer">
                        {socials.github}
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* ═══ FOOTER ═══ */}
      <footer className="pp-footer">
        <div className="pp-container">
          <p className="pp-footer-text">
            Built with <a href="/" target="_blank" rel="noopener noreferrer">PrepLoop</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
