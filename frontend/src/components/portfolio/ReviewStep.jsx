import React from 'react';

export default function ReviewStep({ profile, setProfile, onBack, onNext, saving, error }) {
  const basics = profile?.basicInfo || {};

  const updateBasics = (key, value) => {
    setProfile((prev) => ({
      ...prev,
      basicInfo: {
        ...(prev?.basicInfo || {}),
        [key]: value,
      },
    }));
  };

  return (
    <section className="portfolio-step-card">
      <h2>Review and edit generated profile</h2>

      <div className="portfolio-row">
        <div>
          <label className="portfolio-label" htmlFor="fullName">Full name</label>
          <input
            id="fullName"
            className="portfolio-input"
            value={basics.fullName || ''}
            onChange={(event) => updateBasics('fullName', event.target.value)}
          />
        </div>
        <div>
          <label className="portfolio-label" htmlFor="headline">Headline</label>
          <input
            id="headline"
            className="portfolio-input"
            value={basics.headline || ''}
            onChange={(event) => updateBasics('headline', event.target.value)}
          />
        </div>
      </div>

      <label className="portfolio-label" htmlFor="summary">Summary</label>
      <textarea
        id="summary"
        className="portfolio-textarea"
        value={basics.summary || ''}
        onChange={(event) => updateBasics('summary', event.target.value)}
        rows={6}
      />

      <h3 className="portfolio-section-title">Featured projects (auto-selected)</h3>
      <ul className="portfolio-list">
        {(profile?.projects || []).slice(0, 5).map((project) => (
          <li key={project.id || project.name}>
            <strong>{project.name || 'Untitled project'}</strong>
            <span>{project.description || 'No description'}</span>
          </li>
        ))}
      </ul>

      {error ? <p className="portfolio-error">{error}</p> : null}

      <div className="portfolio-actions">
        <button type="button" className="portfolio-secondary-btn" onClick={onBack}>Back</button>
        <button type="button" className="portfolio-primary-btn" onClick={onNext} disabled={saving}>
          {saving ? 'Saving...' : 'Save and continue'}
        </button>
      </div>
    </section>
  );
}
