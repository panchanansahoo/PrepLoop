import { useRef, useState } from 'react';
import { Upload, FileText, Link2, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { uploadResumeForPortfolio, parseLinkedinExport } from '../../api/portfolioService';

export default function ImportStep({ form, setForm, loading, onImport, error }) {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfStatus, setPdfStatus] = useState(null); // 'ok' | 'error'
  const [parsingLinkedin, setParsingLinkedin] = useState(false);
  const [linkedinStatus, setLinkedinStatus] = useState(null);
  const [showLinkedinHelp, setShowLinkedinHelp] = useState(false);

  const handleFile = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      setPdfStatus('error');
      return;
    }
    setUploadingPdf(true);
    setPdfStatus(null);
    try {
      const result = await uploadResumeForPortfolio(file);
      setForm((prev) => ({
        ...prev,
        resumeText: result.resumeText || '',
        resumeFileName: result.fileName || file.name,
      }));
      setPdfStatus('ok');
    } catch {
      setPdfStatus('error');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleLinkedinParse = async () => {
    if (!form.linkedinExportText?.trim()) return;
    setParsingLinkedin(true);
    setLinkedinStatus(null);
    try {
      const parsed = await parseLinkedinExport(form.linkedinExportText);
      if (parsed) {
        setForm((prev) => ({
          ...prev,
          linkedinHeadline: parsed.headline || prev.linkedinHeadline,
          linkedinSummary: parsed.summary || prev.linkedinSummary,
        }));
        setLinkedinStatus('ok');
      }
    } catch {
      setLinkedinStatus('error');
    } finally {
      setParsingLinkedin(false);
    }
  };

  return (
    <section className="portfolio-step-card">
      <h2>Create your portfolio from existing data</h2>
      <p className="portfolio-step-subtitle">
        Upload your resume PDF, add your GitHub username, and paste your LinkedIn details.
      </p>

      {/* ── Resume PDF Upload ── */}
      <label className="portfolio-label">Resume (PDF)</label>
      <div
        className={`pi-dropzone${dragOver ? ' pi-dropzone-over' : ''}${pdfStatus === 'ok' ? ' pi-dropzone-ok' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        aria-label="Upload resume PDF"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {uploadingPdf ? (
          <><Loader2 size={22} className="pi-spin" /> <span>Parsing PDF…</span></>
        ) : pdfStatus === 'ok' ? (
          <><CheckCircle2 size={22} className="pi-ok-icon" /> <span>{form.resumeFileName || 'Resume uploaded'} — text extracted</span></>
        ) : (
          <>
            <Upload size={22} />
            <span>Drag &amp; drop your resume PDF here, or <strong>click to browse</strong></span>
            <span className="pi-hint">Max 5 MB · PDF only</span>
          </>
        )}
        {pdfStatus === 'error' && (
          <span className="pi-error-inline"><AlertCircle size={14} /> Could not parse PDF. Try a text-based PDF.</span>
        )}
      </div>

      {form.resumeFileName && pdfStatus === 'ok' && (
        <div className="pi-file-badge">
          <FileText size={14} />
          {form.resumeFileName}
          <button
            type="button"
            className="pi-clear-btn"
            onClick={(e) => { e.stopPropagation(); setForm((p) => ({ ...p, resumeText: '', resumeFileName: '' })); setPdfStatus(null); }}
            aria-label="Remove resume"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── Fallback: paste resume text ── */}
      <details className="pi-details">
        <summary className="pi-details-summary">Or paste resume text manually</summary>
        <textarea
          className="portfolio-textarea"
          value={form.resumeText}
          onChange={(e) => setForm((prev) => ({ ...prev, resumeText: e.target.value }))}
          placeholder="Paste your resume text here"
          rows={7}
          style={{ marginTop: 8 }}
        />
      </details>

      {/* ── GitHub ── */}
      <div className="portfolio-row" style={{ marginTop: 14 }}>
        <div>
          <label className="portfolio-label" htmlFor="githubUsername">GitHub username</label>
          <input
            id="githubUsername"
            className="portfolio-input"
            value={form.githubUsername}
            onChange={(e) => setForm((prev) => ({ ...prev, githubUsername: e.target.value }))}
            placeholder="octocat"
          />
        </div>
        <div>
          <label className="portfolio-label" htmlFor="linkedinUrl">LinkedIn URL</label>
          <input
            id="linkedinUrl"
            className="portfolio-input"
            value={form.linkedinUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, linkedinUrl: e.target.value }))}
            placeholder="https://linkedin.com/in/username"
          />
        </div>
      </div>

      {/* ── LinkedIn Export Text ── */}
      <div style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label className="portfolio-label" style={{ margin: 0 }}>
            <Link2 size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            LinkedIn About / Export text
          </label>
          <button
            type="button"
            className="pi-help-btn"
            onClick={() => setShowLinkedinHelp((v) => !v)}
            aria-label="How to get LinkedIn export"
          >
            How?
          </button>
        </div>

        {showLinkedinHelp && (
          <div className="pi-help-box">
            <strong>How to get your LinkedIn data:</strong>
            <ol>
              <li>Go to LinkedIn → Me → Settings &amp; Privacy</li>
              <li>Data Privacy → Get a copy of your data</li>
              <li>Select "The works" or just "Profile" → Request archive</li>
              <li>Once downloaded, open <code>Profile.csv</code> and paste the content below</li>
              <li>Or simply copy-paste your LinkedIn "About" section text</li>
            </ol>
          </div>
        )}

        <textarea
          className="portfolio-textarea"
          value={form.linkedinExportText || ''}
          onChange={(e) => setForm((prev) => ({ ...prev, linkedinExportText: e.target.value }))}
          placeholder="Paste your LinkedIn About section or exported profile text here…"
          rows={5}
          style={{ marginTop: 6 }}
        />

        {form.linkedinExportText?.trim() && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              className="portfolio-secondary-btn"
              onClick={handleLinkedinParse}
              disabled={parsingLinkedin}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {parsingLinkedin ? <Loader2 size={14} className="pi-spin" /> : <Link2 size={14} />}
              {parsingLinkedin ? 'Parsing…' : 'Auto-fill from LinkedIn text'}
            </button>
            {linkedinStatus === 'ok' && <span className="pi-status-ok"><CheckCircle2 size={14} /> Fields filled</span>}
            {linkedinStatus === 'error' && <span className="pi-status-err"><AlertCircle size={14} /> Parse failed</span>}
          </div>
        )}
      </div>

      {/* ── LinkedIn headline / summary (auto-filled or manual) ── */}
      <div className="portfolio-row" style={{ marginTop: 14 }}>
        <div>
          <label className="portfolio-label" htmlFor="linkedinHeadline">LinkedIn headline</label>
          <input
            id="linkedinHeadline"
            className="portfolio-input"
            value={form.linkedinHeadline}
            onChange={(e) => setForm((prev) => ({ ...prev, linkedinHeadline: e.target.value }))}
            placeholder="Full Stack Developer"
          />
        </div>
        <div>
          <label className="portfolio-label" htmlFor="linkedinSummary">LinkedIn summary</label>
          <input
            id="linkedinSummary"
            className="portfolio-input"
            value={form.linkedinSummary}
            onChange={(e) => setForm((prev) => ({ ...prev, linkedinSummary: e.target.value }))}
            placeholder="Brief professional summary"
          />
        </div>
      </div>

      {error ? <p className="portfolio-error">{error}</p> : null}

      <div className="portfolio-actions">
        <button type="button" className="portfolio-primary-btn" onClick={onImport} disabled={loading}>
          {loading ? 'Importing…' : 'Import and continue →'}
        </button>
      </div>
    </section>
  );
}
