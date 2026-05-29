import React, { useState, useEffect, useCallback } from 'react';
import { Briefcase, MapPin, TrendingUp, ExternalLink, Sparkles, RefreshCw, Building2, Wallet, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { buildAuthHeaders } from '../utils/authHeaders';
import { authFetch } from '../utils/authFetch';
import { useNavigate } from 'react-router-dom';
import './SkillMatchJobs.css';

import { API_URL } from '../config/api.js';

const FALLBACK_JOBS = [
  { id: 'demo_1', title: 'Software Engineer - Frontend', company: 'Google', location: 'Bengaluru, India', salary_range: '₹15 - 25 LPA', type: 'full-time', matchScore: 85, matchedSkills: ['React', 'JavaScript', 'TypeScript'], apply_link: 'https://careers.google.com', logo_url: 'https://logo.clearbit.com/google.com' },
  { id: 'demo_2', title: 'Full Stack Developer', company: 'Amazon', location: 'Hyderabad, India', salary_range: '₹12 - 20 LPA', type: 'full-time', matchScore: 78, matchedSkills: ['Node.js', 'AWS', 'MongoDB'], apply_link: 'https://amazon.jobs', logo_url: 'https://logo.clearbit.com/amazon.com' },
  { id: 'demo_3', title: 'Backend Engineer', company: 'Microsoft', location: 'Pune, India', salary_range: '₹14 - 22 LPA', type: 'full-time', matchScore: 72, matchedSkills: ['Python', 'Azure', 'SQL'], apply_link: 'https://careers.microsoft.com', logo_url: 'https://logo.clearbit.com/microsoft.com' },
];

// Map common company names to their actual domain for Clearbit
const COMPANY_DOMAIN_MAP = {
  google: 'google.com', amazon: 'amazon.com', microsoft: 'microsoft.com',
  meta: 'meta.com', apple: 'apple.com', netflix: 'netflix.com',
  uber: 'uber.com', airbnb: 'airbnb.com', stripe: 'stripe.com',
  tcs: 'tcs.com', infosys: 'infosys.com', wipro: 'wipro.com',
  hcltech: 'hcltech.com', cognizant: 'cognizant.com', accenture: 'accenture.com',
};

function getLogoUrl(company) {
  if (!company) return null;
  const key = company.toLowerCase().trim().split(/\s+/)[0];
  const domain = COMPANY_DOMAIN_MAP[key] || `${key.replace(/[^a-z0-9]/g, '')}.com`;
  return `https://logo.clearbit.com/${domain}`;
}

export default function SkillMatchJobs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const [profileComplete, setProfileComplete] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = useCallback((id) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  }, []);

  const fetchMatchedJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${API_URL}/api/jobs/skill-match`);
      if (res.ok) {
        const data = await res.json();
        const fetched = data.jobs || [];
        setProfileComplete(data.profileComplete !== false);
        setSearchQuery(data.searchQuery || '');
        const withLogos = fetched.map(job => ({
          ...job,
          logo_url: job.logo_url || getLogoUrl(job.company),
        }));
        setJobs(withLogos.length > 0 ? withLogos : FALLBACK_JOBS);
        setLastUpdate(new Date());
      } else {
        setError('Failed to load jobs');
        setJobs(FALLBACK_JOBS);
      }
    } catch (err) {
      console.error('Failed to fetch skill-matched jobs:', err);
      setError('Unable to connect to server');
      setJobs(FALLBACK_JOBS);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchMatchedJobs();
    const interval = setInterval(fetchMatchedJobs, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchMatchedJobs]);

  return (
    <div className="smj-widget">
      <div className="smj-header">
        <div className="smj-title-row">
          <Sparkles size={18} className="smj-icon" />
          <h3 className="smj-title">Jobs Matched to Your Skills</h3>
        </div>
        <button className="smj-refresh-btn" onClick={fetchMatchedJobs} disabled={loading} title="Refresh jobs">
          <RefreshCw size={14} className={loading ? 'smj-spinning' : ''} />
        </button>
      </div>

      {loading && jobs.length === 0 ? (
        <div className="smj-state">
          <div className="smj-spinner" />
          <p>Finding jobs that match your skills...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="smj-state">
          <Briefcase size={32} />
          <p>No matching jobs found.</p>
          {!profileComplete && (
            <>
               <p className="smj-hint">Add skills, location, and qualification to your profile to get better job recommendations.</p>
              <button className="smj-cta-btn" onClick={() => navigate('/profile')}>
                <UserPlus size={16} /> Complete Your Profile
              </button>
            </>
          )}
          {error && <button onClick={fetchMatchedJobs} className="smj-retry-btn">Retry</button>}
        </div>
      ) : (
        <>
          {!profileComplete && (
            <div className="smj-banner smj-banner-blue">
              <div className="smj-banner-content"><Sparkles size={14} /><span>Add skills to your profile for better job matches</span></div>
              <button className="smj-add-skills-btn" onClick={() => navigate('/profile')}><UserPlus size={14} /> Add Skills</button>
            </div>
          )}
          {error && (
            <div className="smj-banner smj-banner-yellow">
              <Sparkles size={12} /> Showing demo jobs — {error}
            </div>
          )}
          {searchQuery && (
            <div className={`smj-query-info ${profileComplete ? 'smj-query-green' : 'smj-query-purple'}`}>
              {profileComplete
                ? <>Showing jobs for: <strong>{searchQuery}</strong></>
                : <>Showing <strong>{searchQuery}</strong> (Add skills for personalized matches)</>}
            </div>
          )}
          <div className="smj-list">
            {jobs.slice(0, 3).map(job => (
              <div key={job.id} className="smj-card">
                <div className="smj-card-header">
                  <div className="smj-logo">
                    {job.logo_url && !imageErrors[job.id] ? (
                      <img src={job.logo_url} alt={job.company || 'Company'} className="smj-logo-img" onError={() => handleImageError(job.id)} />
                    ) : (
                      <div className="smj-logo-placeholder"><Building2 size={20} /></div>
                    )}
                  </div>
                  {job.matchScore != null && (
                    <div className="smj-score"><TrendingUp size={12} />{job.matchScore}%</div>
                  )}
                </div>
                <div className="smj-info">
                  <h4 className="smj-job-title">{job.title}</h4>
                  <p className="smj-company">{job.company || 'Not specified'}</p>
                </div>
                <div className="smj-meta">
                  <span className="smj-meta-item"><MapPin size={12} />{job.location || 'Not specified'}</span>
                  {job.salary_range && <span className="smj-meta-item"><Wallet size={12} />{job.salary_range}</span>}
                  {job.type && <span className="smj-meta-item"><Briefcase size={12} />{job.type}</span>}
                </div>
                {job.matchedSkills?.length > 0 && (
                  <div className="smj-tags">
                    {job.matchedSkills.slice(0, 3).map(skill => (
                      <span key={skill} className="smj-tag">{skill}</span>
                    ))}
                  </div>
                )}
                <a href={job.apply_link} target="_blank" rel="noopener noreferrer" className="smj-apply-btn">
                  Apply Now <ExternalLink size={12} />
                </a>
              </div>
            ))}
          </div>
          {lastUpdate && (
            <div className="smj-footer">
              <span className="smj-update-time">Updated {new Date(lastUpdate).toLocaleTimeString()}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
