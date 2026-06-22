import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, Briefcase, Github, Globe, Loader2, Mail, MapPin, Star, ExternalLink, Code, Sparkles, GitFork, Calendar, GraduationCap, Award, Phone, Twitter, Linkedin } from 'lucide-react';
import './PublicPortfolioPage.css';

function normalizePortfolioData(data) {
  const profile = data?.portfolio || data || {};
  const basics = profile.basics || {};
  const socials = profile.socials || {};
  const skills = profile.skills || {};
  const experience = Array.isArray(profile.experience) ? profile.experience : [];
  const education = Array.isArray(profile.education) ? profile.education : [];

  return {
    basics: {
      name: basics.name || 'Public Profile',
      title: basics.title || '',
      photo: basics.photo || '',
      location: basics.location || '',
      email: basics.email || '',
      website: basics.website || '',
      summary: basics.summary || '',
    },
    socials: {
      github: socials.github || '',
      linkedin: socials.linkedin || '',
      twitter: socials.twitter || '',
      portfolio: socials.portfolio || '',
    },
    skills: {
      languages: skills.languages || [],
      frameworks: skills.frameworks || [],
      tools: skills.tools || [],
      domains: skills.domains || [],
    },
    experience,
    education,
    projects: Array.isArray(profile.projects) ? profile.projects : [],
    achievements: Array.isArray(profile.achievements) ? profile.achievements : [],
    portfolioMeta: profile.portfolioMeta || {},
  };
}

function SkillChip({ label, category }) {
  return <span className={`pp-chip pp-chip-${category}`}>{label}</span>;
}

function ExperienceItem({ item, index }) {
  const isObj = typeof item === 'object' && item !== null;
  const role = isObj ? (item.role || item.title || `Role ${index + 1}`) : String(item);
  const company = isObj ? (item.company || '') : '';
  const start = isObj ? (item.startDate || item.start || '') : '';
  const end = isObj ? (item.endDate || item.end || 'Present') : '';
  const achievements = isObj && Array.isArray(item.achievements) ? item.achievements : [];

  return (
    <div className="pp-exp-item">
      <div className="pp-exp-dot" />
      <div className="pp-exp-body">
        <div className="pp-exp-header">
          <strong className="pp-exp-role">{role}</strong>
          {company && <span className="pp-exp-company"><Briefcase size={13} /> {company}</span>}
        </div>
        {(start || end) && (
          <span className="pp-exp-dates"><Calendar size={12} /> {start}{start && end ? ' – ' : ''}{end}</span>
        )}
        {achievements.length > 0 && (
          <ul className="pp-exp-bullets">
            {achievements.slice(0, 3).map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}

function EducationItem({ item }) {
  const isObj = typeof item === 'object' && item !== null;
  const institute = isObj ? (item.institute || item.school || '') : String(item);
  const degree = isObj ? (item.degree || '') : '';
  const year = isObj ? (item.year || '') : '';

  return (
    <div className="pp-edu-item">
      <GraduationCap size={16} className="pp-edu-icon" />
      <div>
        <strong>{institute}</strong>
        {degree && <div className="pp-edu-degree">{degree}</div>}
        {year && <div className="pp-edu-year">{year}</div>}
      </div>
    </div>
  );
}

function ProjectCard({ project, index }) {
  const isObj = typeof project === 'object' && project !== null;
  const name = isObj ? (project.name || `Project ${index + 1}`) : `Project ${index + 1}`;
  const description = isObj ? (project.description || '') : String(project);
  const stack = isObj && Array.isArray(project.stack) ? project.stack : [];
  const repoUrl = isObj ? project.repoUrl : null;
  const liveUrl = isObj ? project.liveUrl : null;
  const stars = isObj ? (project.metrics?.stars || 0) : 0;
  const forks = isObj ? (project.metrics?.forks || 0) : 0;
  const language = isObj ? (project.stack?.[0] || '') : '';

  return (
    <article className="pp-project-card">
      <div className="pp-project-header">
        <h3 className="pp-project-name">{name}</h3>
        {language && <span className="pp-project-lang">{language}</span>}
      </div>
      {description && <p className="pp-project-desc">{description}</p>}
      {stack.length > 0 && (
        <div className="pp-project-stack">
          {stack.slice(0, 5).map((s) => <span key={s} className="pp-project-tag">{s}</span>)}
        </div>
      )}
      <div className="pp-project-footer">
        <div className="pp-project-stats">
          {stars > 0 && <span><Star size={13} /> {stars}</span>}
          {forks > 0 && <span><GitFork size={13} /> {forks}</span>}
        </div>
        <div className="pp-project-links">
          {repoUrl && (
            <a href={repoUrl} target="_blank" rel="noreferrer" className="pp-project-link">
              <Github size={14} /> Code
            </a>
          )}
          {liveUrl && (
            <a href={liveUrl} target="_blank" rel="noreferrer" className="pp-project-link pp-project-link-live">
              <ExternalLink size={14} /> Live
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export default function PublicPortfolioPage() {
  const { slug } = useParams();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchPortfolio() {
      if (!slug) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/portfolio/public/${encodeURIComponent(slug)}`);
        if (res.status === 404) { if (!cancelled) setError('not-found'); return; }
        if (res.status === 403) { if (!cancelled) setError('private'); return; }
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        if (!cancelled) setPortfolio(normalizePortfolioData(data));
      } catch (err) {
        console.error('Public portfolio fetch error:', err);
        if (!cancelled) setError('error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchPortfolio();
    return () => { cancelled = true; };
  }, [slug]);

  const pageTitle = useMemo(() => {
    if (!portfolio?.basics?.name) return 'PrepLoop';
    return `${portfolio.basics.name} — Portfolio`;
  }, [portfolio]);

  useEffect(() => {
    document.title = pageTitle;
    return () => { document.title = 'PrepLoop'; };
  }, [pageTitle]);

  if (loading) {
    return (
      <div className="pp-page pp-page-loading">
        <div className="pp-shell pp-loading-card">
          <Loader2 className="pp-spin" size={24} />
          <p>Loading portfolio…</p>
        </div>
      </div>
    );
  }

  if (error === 'not-found') {
    return (
      <div className="pp-page">
        <div className="pp-shell pp-state-card">
          <BadgeCheck size={28} className="pp-state-icon" />
          <h1>Portfolio not found</h1>
          <p>This portfolio link is missing or has not been published yet.</p>
          <Link to="/" className="pp-back-link"><ArrowLeft size={16} /> Back to home</Link>
        </div>
      </div>
    );
  }

  if (error === 'private') {
    return (
      <div className="pp-page">
        <div className="pp-shell pp-state-card">
          <BadgeCheck size={28} className="pp-state-icon" />
          <h1>This portfolio is private</h1>
          <p>The owner has not made this portfolio public yet.</p>
          <Link to="/" className="pp-back-link"><ArrowLeft size={16} /> Back to home</Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pp-page">
        <div className="pp-shell pp-state-card">
          <Sparkles size={28} className="pp-state-icon" />
          <h1>Could not load portfolio</h1>
          <p>Please try again in a moment.</p>
          <Link to="/" className="pp-back-link"><ArrowLeft size={16} /> Back to home</Link>
        </div>
      </div>
    );
  }

  if (!portfolio) return null;

  const { basics, socials, skills, experience, education, projects, achievements } = portfolio;
  const initials = (basics.name || 'U').slice(0, 2).toUpperCase();
  const allSkills = [
    ...skills.languages.map((s) => ({ label: s, cat: 'lang' })),
    ...skills.frameworks.map((s) => ({ label: s, cat: 'fw' })),
    ...skills.tools.map((s) => ({ label: s, cat: 'tool' })),
    ...skills.domains.map((s) => ({ label: s, cat: 'domain' })),
  ];
  const featuredProjects = projects.filter((p) => p?.featured).length > 0
    ? projects.filter((p) => p?.featured)
    : projects.slice(0, 6);

  return (
    <div className="pp-page">
      <div className="pp-aurora" />
      <div className="pp-aurora pp-aurora-2" />

      <div className="pp-shell">
        <nav className="pp-nav">
          <Link to="/" className="pp-back-link">
            <ArrowLeft size={16} /> PrepLoop
          </Link>
          <span className="pp-nav-badge"><Sparkles size={12} /> Portfolio</span>
        </nav>

        {/* ── Hero ── */}
        <header className="pp-hero">
          <div className="pp-hero-grid">
            <div className="pp-avatar-wrap">
              <div className="pp-avatar">
                {basics.photo
                  ? <img src={basics.photo} alt={basics.name} />
                  : initials}
              </div>
              {socials.github && (
                <a
                  href={`https://github.com/${socials.github}`}
                  target="_blank"
                  rel="noreferrer"
                  className="pp-avatar-github"
                  aria-label="GitHub"
                >
                  <Github size={16} />
                </a>
              )}
            </div>

            <div className="pp-hero-copy">
              <div className="pp-badges">
                {basics.title && <span className="pp-badge"><Briefcase size={13} /> {basics.title}</span>}
                <span className="pp-badge pp-badge-verified"><BadgeCheck size={13} /> Verified Profile</span>
              </div>

              <h1 className="pp-hero-name">{basics.name}</h1>

              {basics.summary && <p className="pp-summary">{basics.summary}</p>}

              <div className="pp-meta-row">
                {basics.location && <span><MapPin size={13} /> {basics.location}</span>}
                {basics.email && (
                  <a href={`mailto:${basics.email}`}><Mail size={13} /> {basics.email}</a>
                )}
                {basics.website && (
                  <a
                    href={basics.website.startsWith('http') ? basics.website : `https://${basics.website}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Globe size={13} /> Website <ExternalLink size={11} />
                  </a>
                )}
              </div>

              <div className="pp-actions">
                {socials.github && (
                  <a href={`https://github.com/${socials.github}`} target="_blank" rel="noreferrer" className="pp-action-btn">
                    <Github size={15} /> GitHub
                  </a>
                )}
                {socials.linkedin && (
                  <a
                    href={socials.linkedin.startsWith('http') ? socials.linkedin : `https://linkedin.com/in/${socials.linkedin}`}
                    target="_blank"
                    rel="noreferrer"
                    className="pp-action-btn pp-action-btn-linkedin"
                  >
                    <Linkedin size={15} /> LinkedIn
                  </a>
                )}
                {socials.twitter && (
                  <a href={`https://twitter.com/${socials.twitter}`} target="_blank" rel="noreferrer" className="pp-action-btn pp-action-btn-ghost">
                    <Twitter size={15} /> Twitter
                  </a>
                )}
                {basics.email && (
                  <a href={`mailto:${basics.email}`} className="pp-action-btn pp-action-btn-ghost">
                    <Mail size={15} /> Contact
                  </a>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ── Body Grid ── */}
        <div className="pp-body">

          {/* Skills */}
          {allSkills.length > 0 && (
            <section className="pp-card pp-card-wide">
              <h2 className="pp-section-title"><Code size={18} /> Skills &amp; Technologies</h2>
              <div className="pp-chip-wrap">
                {allSkills.map(({ label, cat }) => (
                  <SkillChip key={label} label={label} category={cat} />
                ))}
              </div>
            </section>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <section className="pp-card">
              <h2 className="pp-section-title"><Briefcase size={18} /> Experience</h2>
              <div className="pp-exp-timeline">
                {experience.slice(0, 6).map((item, i) => (
                  <ExperienceItem key={i} item={item} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {education.length > 0 && (
            <section className="pp-card">
              <h2 className="pp-section-title"><GraduationCap size={18} /> Education</h2>
              <div className="pp-edu-list">
                {education.map((item, i) => (
                  <EducationItem key={i} item={item} />
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {featuredProjects.length > 0 && (
            <section className="pp-card pp-card-wide">
              <h2 className="pp-section-title"><Star size={18} /> Featured Projects</h2>
              <div className="pp-project-grid">
                {featuredProjects.map((project, i) => (
                  <ProjectCard key={project?.id || i} project={project} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* Achievements */}
          {achievements.length > 0 && (
            <section className="pp-card pp-card-wide">
              <h2 className="pp-section-title"><Award size={18} /> Achievements</h2>
              <ul className="pp-achievements-list">
                {achievements.map((item, i) => (
                  <li key={i} className="pp-achievement-item">
                    <Award size={14} className="pp-achievement-icon" />
                    <span>{typeof item === 'string' ? item : item?.title || JSON.stringify(item)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* ── Footer ── */}
        <footer className="pp-footer">
          <p>Built with <Sparkles size={13} className="pp-footer-spark" /> <a href="https://preploop.me" target="_blank" rel="noreferrer">PrepLoop</a></p>
        </footer>
      </div>
    </div>
  );
}
