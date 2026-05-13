import React from 'react';

export default function ImportStep({
  form,
  setForm,
  loading,
  onImport,
  error,
}) {
  return (
    <section className="portfolio-step-card">
      <h2>Create your profile from existing data</h2>
      <p className="portfolio-step-subtitle">
        Add resume text, GitHub username, and LinkedIn details to generate your first portfolio draft.
      </p>

      <label className="portfolio-label" htmlFor="resumeText">Resume text</label>
      <textarea
        id="resumeText"
        className="portfolio-textarea"
        value={form.resumeText}
        onChange={(event) => setForm((prev) => ({ ...prev, resumeText: event.target.value }))}
        placeholder="Paste your resume text here"
        rows={8}
      />

      <div className="portfolio-row">
        <div>
          <label className="portfolio-label" htmlFor="resumeFileName">Resume file name (optional)</label>
          <input
            id="resumeFileName"
            className="portfolio-input"
            value={form.resumeFileName}
            onChange={(event) => setForm((prev) => ({ ...prev, resumeFileName: event.target.value }))}
            placeholder="resume.pdf"
          />
        </div>
        <div>
          <label className="portfolio-label" htmlFor="githubUsername">GitHub username</label>
          <input
            id="githubUsername"
            className="portfolio-input"
            value={form.githubUsername}
            onChange={(event) => setForm((prev) => ({ ...prev, githubUsername: event.target.value }))}
            placeholder="octocat"
          />
        </div>
      </div>

      <label className="portfolio-label" htmlFor="linkedinUrl">LinkedIn URL</label>
      <input
        id="linkedinUrl"
        className="portfolio-input"
        value={form.linkedinUrl}
        onChange={(event) => setForm((prev) => ({ ...prev, linkedinUrl: event.target.value }))}
        placeholder="https://www.linkedin.com/in/username/"
      />

      <label className="portfolio-label" htmlFor="linkedinHeadline">LinkedIn headline</label>
      <input
        id="linkedinHeadline"
        className="portfolio-input"
        value={form.linkedinHeadline}
        onChange={(event) => setForm((prev) => ({ ...prev, linkedinHeadline: event.target.value }))}
        placeholder="Full Stack Developer"
      />

      <label className="portfolio-label" htmlFor="linkedinSummary">LinkedIn summary</label>
      <textarea
        id="linkedinSummary"
        className="portfolio-textarea"
        value={form.linkedinSummary}
        onChange={(event) => setForm((prev) => ({ ...prev, linkedinSummary: event.target.value }))}
        placeholder="Write a short summary"
        rows={4}
      />

      {error ? <p className="portfolio-error">{error}</p> : null}

      <div className="portfolio-actions">
        <button type="button" className="portfolio-primary-btn" onClick={onImport} disabled={loading}>
          {loading ? 'Importing...' : 'Import and continue'}
        </button>
      </div>
    </section>
  );
}
