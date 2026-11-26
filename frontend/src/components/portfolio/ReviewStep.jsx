export default function ReviewStep({ profile, setProfile, onBack, onNext, saving, error }) {
  const basics = profile?.basicInfo || {};
  const skills = [
    ...(profile?.skills?.languages || []),
    ...(profile?.skills?.frameworks || []),
    ...(profile?.skills?.tools || []),
    ...(profile?.skills?.domains || []),
  ].filter(Boolean);
  const experience = Array.isArray(profile?.experience) ? profile.experience : [];
  const education = Array.isArray(profile?.education) ? profile.education : [];

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

      {skills.length > 0 && (
        <>
          <h3 className="portfolio-section-title">Skills</h3>
          <ul className="portfolio-list" aria-label="Skills">
            {skills.map((skill) => (
              <li key={skill}><span>{skill}</span></li>
            ))}
          </ul>
        </>
      )}

      {experience.length > 0 && (
        <>
          <h3 className="portfolio-section-title">Experience</h3>
          <ul className="portfolio-list" aria-label="Experience">
            {experience.map((item, idx) => {
              const role = typeof item === 'string' ? item : (item?.role || item?.title || `Role ${idx + 1}`);
              const company = typeof item === 'object' && item?.company ? item.company : '';
              return (
                <li key={`${role}-${company}-${idx}`}>
                  <strong>{role}</strong>
                  {company ? <span>{company}</span> : null}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {education.length > 0 && (
        <>
          <h3 className="portfolio-section-title">Education</h3>
          <ul className="portfolio-list" aria-label="Education">
            {education.map((item, idx) => {
              const institute = typeof item === 'string' ? item : (item?.institute || item?.school || '');
              const degree = typeof item === 'object' && item?.degree ? item.degree : '';
              return (
                <li key={`${institute}-${degree}-${idx}`}>
                  <strong>{institute || degree || `Education ${idx + 1}`}</strong>
                  {institute && degree ? <span>{degree}</span> : null}
                </li>
              );
            })}
          </ul>
        </>
      )}

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
