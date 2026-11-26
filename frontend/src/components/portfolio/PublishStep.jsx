import { Link } from 'react-router-dom';

export default function PublishStep({
  settings,
  setSettings,
  onBack,
  onPublish,
  publishing,
  error,
  result,
}) {
  return (
    <section className="portfolio-step-card">
      <h2>Publish your portfolio</h2>
      <p className="portfolio-step-subtitle">
        Choose your slug and publish to a branded link.
      </p>

      <div className="portfolio-row">
        <div>
          <label className="portfolio-label" htmlFor="slug">Slug</label>
          <input
            id="slug"
            className="portfolio-input"
            value={settings.slug}
            onChange={(event) => setSettings((prev) => ({ ...prev, slug: event.target.value }))}
            placeholder="your-name"
          />
        </div>

        <div>
          <label className="portfolio-label" htmlFor="visibility">Visibility</label>
          <select
            id="visibility"
            className="portfolio-input"
            value={settings.visibility}
            onChange={(event) => setSettings((prev) => ({ ...prev, visibility: event.target.value }))}
          >
            <option value="public">Public</option>
            <option value="unlisted">Unlisted</option>
            <option value="private">Private</option>
          </select>
        </div>
      </div>

      {error ? <p className="portfolio-error">{error}</p> : null}

      {result ? (
        <div className="portfolio-result-card">
          <h3>{result.published ? 'Portfolio published' : 'Private portfolio saved'}</h3>
          <p><Link to={`/u/${encodeURIComponent(result.slug)}?site=1`}>
            {result.published ? 'Open portfolio' : 'Preview private portfolio'}
          </Link></p>
          {result.publishedUrl && <p>{result.publishedUrl}</p>}
          {result.shortUrl && <p>Short link {result.shortUrl}</p>}
        </div>
      ) : null}

      <div className="portfolio-actions">
        <button type="button" className="portfolio-secondary-btn" onClick={onBack}>Back</button>
        <button type="button" className="portfolio-primary-btn" onClick={onPublish} disabled={publishing}>
          {publishing ? 'Saving…' : settings.visibility === 'private' ? 'Save private portfolio' : 'Publish portfolio'}
        </button>
      </div>
    </section>
  );
}
