import React, { useState, useCallback, useRef } from 'react';
import {
  X, FileText, Github, Linkedin, Upload, Loader2, CheckCircle2,
  AlertCircle, ArrowRight, Star, Code2, Check, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './ImportCenterModal.css';

const buildAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

const FIELD_LABELS = {
  fullName: 'Full Name',
  currentRole: 'Current Role',
  bio: 'Bio / Summary',
  skills: 'Skills',
  experience: 'Experience',
  education: 'Education',
  location: 'Location',
  company: 'Company',
  website: 'Website',
  phone: 'Phone',
  githubUsername: 'GitHub Username',
  projects: 'Projects',
};

export default function ImportCenterModal({ isOpen, onClose, onApply, currentProfile }) {
  const { user } = useAuth();
  const [activeSource, setActiveSource] = useState('resume');
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState(null); // 'importing' | 'success' | 'error'
  const [statusText, setStatusText] = useState('');
  const [fieldMapping, setFieldMapping] = useState({});
  const [checkedFields, setCheckedFields] = useState(new Set());
  const [githubUsername, setGithubUsername] = useState('');
  const [linkedinData, setLinkedinData] = useState({
    name: '', headline: '', about: '', skills: '',
    experience: '', education: '', location: '', company: '', website: '', phone: ''
  });
  const [importedProjects, setImportedProjects] = useState([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const resetState = useCallback(() => {
    setFieldMapping({});
    setCheckedFields(new Set());
    setImportedProjects([]);
    setStatus(null);
    setStatusText('');
  }, []);

  const handleSourceChange = useCallback((source) => {
    setActiveSource(source);
    resetState();
  }, [resetState]);

  // ─── Resume Upload Handler ───
  const handleResumeFile = useCallback(async (file) => {
    if (!file) return;
    if (!file.type.includes('pdf') && !file.type.includes('text')) {
      setStatus('error');
      setStatusText('Please upload a PDF or text file');
      return;
    }

    setImporting(true);
    setStatus('importing');
    setStatusText('Analyzing your resume...');

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const res = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        body: formData,
      });

      if (!res.ok) throw new Error('Resume analysis failed');
      const data = await res.json();

      // Now extract portfolio fields
      const portfolioRes = await fetch('/api/resume/extract-portfolio', {
        method: 'POST',
        headers: buildAuthHeaders(),
      });

      if (portfolioRes.ok) {
        const portfolioData = await portfolioRes.json();
        const mapping = portfolioData.fieldMapping || {};

        setFieldMapping(mapping);
        setCheckedFields(new Set(Object.keys(mapping)));

        if (mapping.projects?.value) {
          setImportedProjects(mapping.projects.value);
        }

        setStatus('success');
        setStatusText(`Found ${Object.keys(mapping).length} fields from your resume`);
      } else {
        // Fallback to basic mapping from analysis data
        const basicMapping = {};
        const ip = data.resumeProfile;
        if (ip?.candidateHeadline) basicMapping.currentRole = { value: ip.candidateHeadline, confidence: 'medium', source: 'resume' };
        if (ip?.coreSkills?.length) basicMapping.skills = { value: ip.coreSkills.join(', '), confidence: 'high', source: 'resume' };
        if (ip?.summary) basicMapping.bio = { value: ip.summary, confidence: 'medium', source: 'resume' };

        setFieldMapping(basicMapping);
        setCheckedFields(new Set(Object.keys(basicMapping)));
        setStatus('success');
        setStatusText(`Found ${Object.keys(basicMapping).length} fields from your resume`);
      }
    } catch (err) {
      console.error('Resume import error:', err);
      setStatus('error');
      setStatusText('Failed to analyze resume. Please try again.');
    }
    setImporting(false);
  }, [user]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer?.files?.[0];
    handleResumeFile(file);
  }, [handleResumeFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragging(false), []);

  // ─── GitHub Import Handler ───
  const handleGithubImport = useCallback(async () => {
    if (!githubUsername.trim()) return;

    setImporting(true);
    setStatus('importing');
    setStatusText(`Fetching data from GitHub...`);

    try {
      const res = await fetch('/api/resume/import-github', {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({ username: githubUsername.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'GitHub import failed');
      }

      const data = await res.json();
      const mapping = data.fieldMapping || {};

      setFieldMapping(mapping);
      setCheckedFields(new Set(Object.keys(mapping)));

      if (data.projects?.length) {
        setImportedProjects(data.projects);
      }

      setStatus('success');
      setStatusText(`Found ${Object.keys(mapping).length} fields + ${data.projects?.length || 0} repos`);
    } catch (err) {
      console.error('GitHub import error:', err);
      setStatus('error');
      setStatusText(err.message || 'Failed to import GitHub data');
    }
    setImporting(false);
  }, [githubUsername, user]);

  // ─── LinkedIn Import Handler ───
  const handleLinkedinImport = useCallback(async () => {
    const filled = Object.values(linkedinData).some(v => v.trim());
    if (!filled) return;

    setImporting(true);
    setStatus('importing');
    setStatusText('Processing LinkedIn data...');

    try {
      const res = await fetch('/api/resume/import-linkedin', {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({ linkedinUrl: '', profileData: linkedinData }),
      });

      if (!res.ok) throw new Error('LinkedIn import failed');
      const data = await res.json();
      const mapping = data.fieldMapping || {};

      setFieldMapping(mapping);
      setCheckedFields(new Set(Object.keys(mapping)));

      setStatus('success');
      setStatusText(`Found ${Object.keys(mapping).length} fields from LinkedIn data`);
    } catch (err) {
      console.error('LinkedIn import error:', err);
      setStatus('error');
      setStatusText('Failed to import LinkedIn data');
    }
    setImporting(false);
  }, [linkedinData, user]);

  // ─── Field Toggle ───
  const toggleField = useCallback((key) => {
    setCheckedFields(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const acceptAll = useCallback(() => {
    setCheckedFields(new Set(Object.keys(fieldMapping)));
  }, [fieldMapping]);

  // ─── Apply Selected Fields ───
  const handleApply = useCallback(() => {
    const updates = {};
    const projectsToAdd = [];

    checkedFields.forEach(key => {
      const field = fieldMapping[key];
      if (!field) return;

      if (key === 'projects') {
        if (Array.isArray(field.value)) {
          projectsToAdd.push(...field.value);
        }
      } else {
        // Only apply if current profile field is empty
        const currentValue = currentProfile?.[key] || '';
        if (!String(currentValue).trim()) {
          updates[key] = field.value;
        } else {
          // If current has data, still include it (user explicitly checked it)
          updates[key] = field.value;
        }
      }
    });

    if (projectsToAdd.length > 0) {
      updates.projects = projectsToAdd;
    }

    updates._importSource = activeSource;
    updates._importTimestamp = new Date().toISOString();

    onApply(updates);
    onClose();
  }, [checkedFields, fieldMapping, activeSource, currentProfile, onApply, onClose]);

  if (!isOpen) return null;

  const fieldEntries = Object.entries(fieldMapping).filter(([k]) => k !== 'projects');
  const hasProjects = importedProjects.length > 0;
  const checkedCount = checkedFields.size;
  const totalFields = Object.keys(fieldMapping).length;

  return (
    <div className="icm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="icm-modal">
        {/* Header */}
        <div className="icm-header">
          <div className="icm-header-text">
            <h2>
              <Sparkles size={20} style={{ color: '#8b5cf6' }} />
              Import Your Profile
            </h2>
            <p>Auto-fill your portfolio from existing sources. Review each field before applying.</p>
          </div>
          <button className="icm-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Source Tabs */}
        <div className="icm-sources">
          <button
            className={`icm-source-btn ${activeSource === 'resume' ? 'active' : ''}`}
            onClick={() => handleSourceChange('resume')}
          >
            <div className="icm-source-icon"><FileText size={22} /></div>
            <span className="icm-source-label">Resume</span>
            <span className="icm-source-sub">Upload PDF</span>
          </button>
          <button
            className={`icm-source-btn ${activeSource === 'github' ? 'active' : ''}`}
            onClick={() => handleSourceChange('github')}
          >
            <div className="icm-source-icon"><Github size={22} /></div>
            <span className="icm-source-label">GitHub</span>
            <span className="icm-source-sub">Repos & Profile</span>
          </button>
          <button
            className={`icm-source-btn ${activeSource === 'linkedin' ? 'active' : ''}`}
            onClick={() => handleSourceChange('linkedin')}
          >
            <div className="icm-source-icon"><Linkedin size={22} /></div>
            <span className="icm-source-label">LinkedIn</span>
            <span className="icm-source-sub">Manual Entry</span>
          </button>
        </div>

        {/* Input Area — Resume */}
        {activeSource === 'resume' && !Object.keys(fieldMapping).length && (
          <div className="icm-input-area">
            <div
              className={`icm-dropzone ${dragging ? 'dragging' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="icm-dropzone-icon"><Upload size={32} /></div>
              <p className="icm-dropzone-text">
                {importing ? 'Analyzing...' : 'Drop your resume here or click to browse'}
              </p>
              <p className="icm-dropzone-sub">Supports PDF and TXT files (max 5MB)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                style={{ display: 'none' }}
                onChange={(e) => handleResumeFile(e.target.files?.[0])}
              />
            </div>
          </div>
        )}

        {/* Input Area — GitHub */}
        {activeSource === 'github' && !Object.keys(fieldMapping).length && (
          <div className="icm-input-area">
            <div className="icm-input-group">
              <label>GitHub Username</label>
              <input
                className="icm-input"
                placeholder="e.g. octocat"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGithubImport()}
              />
            </div>
            <button
              className={`icm-import-btn ${importing ? 'loading' : ''}`}
              onClick={handleGithubImport}
              disabled={importing || !githubUsername.trim()}
            >
              {importing ? <Loader2 size={16} className="icm-spinning" /> : <Github size={16} />}
              {importing ? 'Fetching...' : 'Import from GitHub'}
            </button>
          </div>
        )}

        {/* Input Area — LinkedIn */}
        {activeSource === 'linkedin' && !Object.keys(fieldMapping).length && (
          <div className="icm-input-area">
            <div className="icm-form-grid">
              <div className="icm-input-group">
                <label>Full Name</label>
                <input className="icm-input" placeholder="John Doe" value={linkedinData.name}
                  onChange={(e) => setLinkedinData(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="icm-input-group">
                <label>Headline / Role</label>
                <input className="icm-input" placeholder="Software Engineer at Google" value={linkedinData.headline}
                  onChange={(e) => setLinkedinData(p => ({ ...p, headline: e.target.value }))} />
              </div>
              <div className="icm-input-group">
                <label>Company</label>
                <input className="icm-input" placeholder="Current company" value={linkedinData.company}
                  onChange={(e) => setLinkedinData(p => ({ ...p, company: e.target.value }))} />
              </div>
              <div className="icm-input-group">
                <label>Location</label>
                <input className="icm-input" placeholder="San Francisco, CA" value={linkedinData.location}
                  onChange={(e) => setLinkedinData(p => ({ ...p, location: e.target.value }))} />
              </div>
              <div className="icm-input-group full-width">
                <label>Skills (comma-separated)</label>
                <input className="icm-input" placeholder="React, Node.js, Python, AWS..." value={linkedinData.skills}
                  onChange={(e) => setLinkedinData(p => ({ ...p, skills: e.target.value }))} />
              </div>
              <div className="icm-input-group full-width">
                <label>About / Summary</label>
                <textarea className="icm-input icm-textarea" placeholder="Brief professional summary..." value={linkedinData.about}
                  onChange={(e) => setLinkedinData(p => ({ ...p, about: e.target.value }))} />
              </div>
              <div className="icm-input-group full-width">
                <label>Experience (brief)</label>
                <input className="icm-input" placeholder="SWE at Google (2 yrs), Intern at Meta..." value={linkedinData.experience}
                  onChange={(e) => setLinkedinData(p => ({ ...p, experience: e.target.value }))} />
              </div>
              <div className="icm-input-group full-width">
                <label>Education</label>
                <input className="icm-input" placeholder="B.S. CS from Stanford University" value={linkedinData.education}
                  onChange={(e) => setLinkedinData(p => ({ ...p, education: e.target.value }))} />
              </div>
            </div>
            <button
              className={`icm-import-btn ${importing ? 'loading' : ''}`}
              onClick={handleLinkedinImport}
              disabled={importing || !Object.values(linkedinData).some(v => v.trim())}
            >
              {importing ? <Loader2 size={16} /> : <Linkedin size={16} />}
              {importing ? 'Processing...' : 'Import LinkedIn Data'}
            </button>
          </div>
        )}

        {/* Status Message */}
        {status && (
          <div className={`icm-status ${status}`}>
            {status === 'importing' && <div className="icm-spinner" />}
            {status === 'success' && <CheckCircle2 size={16} />}
            {status === 'error' && <AlertCircle size={16} />}
            <span>{statusText}</span>
          </div>
        )}

        {/* Field Preview */}
        {fieldEntries.length > 0 && (
          <>
            <div className="icm-fields-header">
              <span className="icm-fields-title">
                Extracted Fields ({checkedCount}/{totalFields})
              </span>
              <button className="icm-accept-all" onClick={acceptAll}>
                Accept All
              </button>
            </div>
            <div className="icm-fields-list">
              {fieldEntries.map(([key, field]) => {
                const isChecked = checkedFields.has(key);
                const displayValue = typeof field.value === 'object'
                  ? JSON.stringify(field.value).substring(0, 60)
                  : String(field.value).substring(0, 80);

                return (
                  <div
                    key={key}
                    className={`icm-field-row ${isChecked ? 'accepted' : 'skipped'}`}
                    onClick={() => toggleField(key)}
                  >
                    <div className={`icm-field-check ${isChecked ? 'checked' : ''}`}>
                      {isChecked && <Check size={12} />}
                    </div>
                    <div className="icm-field-info">
                      <div className="icm-field-label">{FIELD_LABELS[key] || key}</div>
                      <div className="icm-field-value" title={String(field.value)}>
                        {displayValue}
                      </div>
                    </div>
                    <span className={`icm-field-badge ${field.confidence || 'medium'}`}>
                      {field.confidence || 'medium'}
                    </span>
                  </div>
                );
              })}

              {/* Projects Preview */}
              {hasProjects && checkedFields.has('projects') && (
                <div className="icm-field-row accepted" onClick={() => toggleField('projects')}>
                  <div className={`icm-field-check ${checkedFields.has('projects') ? 'checked' : ''}`}>
                    {checkedFields.has('projects') && <Check size={12} />}
                  </div>
                  <div className="icm-field-info">
                    <div className="icm-field-label">Projects ({importedProjects.length})</div>
                    <div className="icm-projects-grid">
                      {importedProjects.slice(0, 4).map((p, i) => (
                        <div key={i} className="icm-project-card">
                          <div className="icm-project-name">{p.name}</div>
                          {p.description && <div className="icm-project-desc">{p.description}</div>}
                          <div className="icm-project-meta">
                            {p.language && <span><Code2 size={10} /> {p.language}</span>}
                            {typeof p.stars === 'number' && <span><Star size={10} /> {p.stars}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <span className="icm-field-badge high">high</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        {Object.keys(fieldMapping).length > 0 && (
          <div className="icm-footer">
            <button
              className="icm-apply-btn"
              onClick={handleApply}
              disabled={checkedCount === 0}
            >
              <ArrowRight size={16} />
              Apply {checkedCount} Field{checkedCount !== 1 ? 's' : ''} to Profile
            </button>
            <button className="icm-cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
