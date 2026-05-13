import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Github,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Star,
  ExternalLink,
  Code,
  Sparkles,
} from 'lucide-react';
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
        if (res.status === 404) {
          if (!cancelled) setError('not-found');
          return;
        }
        if (!res.ok) throw new Error('Failed to load public profile');

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
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const pageTitle = useMemo(() => {
    if (!portfolio?.basics?.name) return 'PrepLoop';
    return `${portfolio.basics.name} — Public Profile`;
  }, [portfolio]);

  useEffect(() => {
    document.title = pageTitle;
    return () => {
      document.title = 'PrepLoop';
    };
  }, [pageTitle]);

  if (loading) {
    return (
      <div className="pp-page pp-page-loading">
        <div className="pp-shell pp-loading-card">
          <Loader2 className="pp-spin" size={24} />
          <p>Loading public profile…</p>
        </div>
      </div>
    );
  }

  if (error === 'not-found') {
    return (
      <div className="pp-page">
        <div className="pp-shell pp-state-card">
          <BadgeCheck size={28} className="pp-state-icon" />
          <h1>Profile not found</h1>
          <p>This public profile link is missing or has not been published yet.</p>
          <Link to="/profile" className="pp-back-link">
            <ArrowLeft size={16} /> Back to profile
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pp-page">
        <div className="pp-shell pp-state-card">
          <Sparkles size={28} className="pp-state-icon" />
          <h1>Could not load profile</h1>
          <p>Please try again in a moment.</p>
          <Link to="/" className="pp-back-link">
            <ArrowLeft size={16} /> Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (!portfolio) return null;

  const { basics, socials, skills, experience, education, projects, achievements } = portfolio;
  const initials = (basics.name || 'U').slice(0, 1).toUpperCase();
  const flatSkills = [...skills.languages, ...skills.frameworks, ...skills.tools, ...skills.domains].filter(Boolean);

  return (
    <div className="pp-page">
      <div className="pp-aurora" />
      <div className="pp-shell">
        <header className="pp-hero">
          <Link to="/profile" className="pp-back-link pp-back-link-top">
            <ArrowLeft size={16} /> Back to profile
          </Link>

          <div className="pp-hero-grid">
            <div className="pp-avatar-wrap">
              <div className="pp-avatar">
                {basics.photo ? <img src={basics.photo} alt={basics.name} /> : initials}
              </div>
            </div>

            <div className="pp-hero-copy">
              <div className="pp-badges">
                <span className="pp-badge"><Star size={14} /> Public profile</span>
                {basics.title && <span className="pp-badge"><Briefcase size={14} /> {basics.title}</span>}
              </div>
              <h1>{basics.name}</h1>
              {basics.summary && <p className="pp-summary">{basics.summary}</p>}

              <div className="pp-meta-row">
                {basics.location && <span><MapPin size={14} /> {basics.location}</span>}
                {basics.email && <a href={`mailto:${basics.email}`}><Mail size={14} /> {basics.email}</a>}
                {basics.website && (
                  <a href={basics.website.startsWith('http') ? basics.website : `https://${basics.website}`} target="_blank" rel="noreferrer">
                    <Globe size={14} /> Website <ExternalLink size={12} />
                  </a>
                )}
              </div>

              <div className="pp-actions">
                {socials.github && (
                  <a href={`https://github.com/${socials.github}`} target="_blank" rel="noreferrer" className="pp-action-btn">
                    <Github size={16} /> GitHub
                  </a>
                )}
                {socials.linkedin && (
                  <a href={socials.linkedin.startsWith('http') ? socials.linkedin : `https://linkedin.com/in/${socials.linkedin}`} target="_blank" rel="noreferrer" className="pp-action-btn">
                    <ExternalLink size={16} /> LinkedIn
                  </a>
                )}
                {socials.portfolio && (
                  <a href={socials.portfolio.startsWith('http') ? socials.portfolio : `https://${socials.portfolio}`} target="_blank" rel="noreferrer" className="pp-action-btn pp-action-btn-ghost">
                    <Code size={16} /> Portfolio
                  </a>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="pp-grid">
          <section className="pp-card pp-card-wide">
            <h2>About</h2>
            <p>{basics.summary || 'No public summary has been added yet.'}</p>
          </section>

          <section className="pp-card">
            <h2>Skills</h2>
            <div className="pp-chip-wrap">
              {flatSkills.length ? flatSkills.map((skill) => (
                <span key={skill} className="pp-chip">{skill}</span>
              )) : <p className="pp-muted">No public skills yet.</p>}
            </div>
          </section>

          <section className="pp-card">
            <h2>Experience</h2>
            {experience.length ? (
              <ul className="pp-list">
                {experience.slice(0, 5).map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
              </ul>
            ) : <p className="pp-muted">No public experience details yet.</p>}
          </section>

          <section className="pp-card">
            <h2>Education</h2>
            {education.length ? (
              <ul className="pp-list">
                {education.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
              </ul>
            ) : <p className="pp-muted">No education details shared.</p>}
          </section>

          <section className="pp-card pp-card-wide">
            <h2>Projects</h2>
            {projects.length ? (
              <div className="pp-project-grid">
                {projects.map((project, index) => (
                  <article key={`${project}-${index}`} className="pp-project-card">
                    <h3>Project {index + 1}</h3>
                    <p>{project}</p>
                  </article>
                ))}
              </div>
            ) : <p className="pp-muted">No projects have been published yet.</p>}
          </section>

          <section className="pp-card pp-card-wide">
            <h2>Achievements</h2>
            {achievements.length ? (
              <ul className="pp-list">
                {achievements.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
              </ul>
            ) : <p className="pp-muted">No achievements shared yet.</p>}
          </section>
        </main>
      </div>
    </div>
  );
}
