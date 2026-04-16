import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, TrendingUp, ExternalLink, Sparkles, RefreshCw, Building2, Wallet, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { buildAuthHeaders } from '../utils/authHeaders';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Fallback jobs for demo/offline mode
const FALLBACK_JOBS = [
  {
    id: 'demo_1',
    title: 'Software Engineer - Frontend',
    company: 'Google',
    location: 'Bengaluru, India',
    salary_range: '₹15 - 25 LPA',
    type: 'full-time',
    matchScore: 85,
    matchedSkills: ['React', 'JavaScript', 'TypeScript'],
    apply_link: 'https://careers.google.com',
    logo_url: 'https://logo.clearbit.com/google.com'
  },
  {
    id: 'demo_2',
    title: 'Full Stack Developer',
    company: 'Amazon',
    location: 'Hyderabad, India',
    salary_range: '₹12 - 20 LPA',
    type: 'full-time',
    matchScore: 78,
    matchedSkills: ['Node.js', 'AWS', 'MongoDB'],
    apply_link: 'https://amazon.jobs',
    logo_url: 'https://logo.clearbit.com/amazon.com'
  },
  {
    id: 'demo_3',
    title: 'Backend Engineer',
    company: 'Microsoft',
    location: 'Pune, India',
    salary_range: '₹14 - 22 LPA',
    type: 'full-time',
    matchScore: 72,
    matchedSkills: ['Python', 'Azure', 'SQL'],
    apply_link: 'https://careers.microsoft.com',
    logo_url: 'https://logo.clearbit.com/microsoft.com'
  }
];

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

  const handleImageError = (id) => {
    setImageErrors(prev => ({...prev, [id]: true}));
  };

  const fetchMatchedJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/jobs/skill-match`, {
        headers: buildAuthHeaders(user)
      });
      if (res.ok) {
        const data = await res.json();
        const fetchedJobs = data.jobs || [];
        setProfileComplete(data.profileComplete !== false);
        setSearchQuery(data.searchQuery || '');
        
        // Add Clearbit logos for companies that don't have logos
        const jobsWithLogos = fetchedJobs.map(job => ({
          ...job,
          logo_url: job.logo_url || (job.company ? `https://logo.clearbit.com/${job.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com` : null)
        }));
        setJobs(jobsWithLogos.length > 0 ? jobsWithLogos : FALLBACK_JOBS);
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
  };

  useEffect(() => {
    fetchMatchedJobs();
    const interval = setInterval(fetchMatchedJobs, 5 * 60 * 1000); // Poll every 5 min
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="dash-widget skill-match-jobs">
      <div className="dash-widget-header">
        <div className="dash-widget-title-row">
          <Sparkles size={18} className="dash-widget-icon" />
          <h3 className="dash-widget-title">Jobs Matched to Your Skills</h3>
        </div>
        <button 
          className="dash-refresh-btn" 
          onClick={fetchMatchedJobs}
          disabled={loading}
          title="Refresh jobs"
        >
          <RefreshCw size={14} className={loading ? 'spinning' : ''} />
        </button>
      </div>

      {loading && jobs.length === 0 ? (
        <div className="dash-widget-loading">
          <div className="dash-spinner" />
          <p>Finding jobs that match your skills...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="dash-widget-empty">
          <Briefcase size={32} />
          <p>No matching jobs found.</p>
          {!profileComplete && (
            <>
              <p className="empty-hint">Add skills to your profile to get personalized job recommendations.</p>
              <button 
                className="add-skills-btn-large"
                onClick={() => navigate('/profile')}
              >
                <UserPlus size={16} />
                Complete Your Profile
              </button>
            </>
          )}
          {error && <button onClick={fetchMatchedJobs} className="retry-btn">Retry</button>}
        </div>
      ) : (
        <>
          {!profileComplete && (
            <div className="profile-incomplete-banner">
              <div className="banner-content">
                <Sparkles size={14} />
                <span>Add skills to your profile for better job matches</span>
              </div>
              <button 
                className="add-skills-btn"
                onClick={() => navigate('/profile')}
                title="Go to profile"
              >
                <UserPlus size={14} />
                Add Skills
              </button>
            </div>
          )}
          {error && (
            <div className="demo-mode-banner">
              <Sparkles size={12} />
              Showing demo jobs - {error}
            </div>
          )}
          {searchQuery && (
            <div className={profileComplete ? "search-query-info" : "recent-jobs-info"}>
              {profileComplete ? (
                <>
                  Showing jobs for: <strong>{searchQuery}</strong>
                </>
              ) : (
                <>
                  Showing <strong>{searchQuery}</strong> (Add skills for personalized matches)
                </>
              )}
            </div>
          )}
          <div className="skill-match-jobs-list">
            {jobs.slice(0, 3).map((job) => (
              <div key={job.id} className="skill-match-job-card">
                <div className="skill-match-job-header">
                  <div className="skill-match-company-logo">
                    {job.logo_url && !imageErrors[job.id] ? (
                      <img 
                        src={job.logo_url} 
                        alt={job.company || 'Company'} 
                        className="company-logo-img" 
                        onError={() => handleImageError(job.id)}
                      />
                    ) : (
                      <div className="company-logo-placeholder">
                        <Building2 size={20} />
                      </div>
                    )}
                  </div>
                  {job.matchScore && (
                    <div className="skill-match-score">
                      <TrendingUp size={12} />
                      {job.matchScore}%
                    </div>
                  )}
                </div>
                
                <div className="skill-match-job-info">
                  <h4 className="skill-match-job-title">{job.title}</h4>
                  <p className="skill-match-job-company">{job.company || 'Not specified'}</p>
                </div>
                
                <div className="skill-match-job-meta">
                  <span className="skill-match-job-location">
                    <MapPin size={12} />
                    {job.location || 'Not specified'}
                  </span>
                  {job.salary_range && (
                    <span className="skill-match-job-salary">
                      <Wallet size={12} />
                      {job.salary_range}
                    </span>
                  )}
                  {job.type && (
                    <span className="skill-match-job-type">
                      <Briefcase size={12} />
                      {job.type}
                    </span>
                  )}
                </div>

                {job.matchedSkills && job.matchedSkills.length > 0 && (
                  <div className="skill-match-tags">
                    {job.matchedSkills.slice(0, 3).map((skill) => (
                      <span key={skill} className="skill-match-tag">{skill}</span>
                    ))}
                  </div>
                )}

                <a 
                  href={job.apply_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="skill-match-apply-btn"
                >
                  Apply Now
                  <ExternalLink size={12} />
                </a>
              </div>
            ))}
          </div>
          
          {lastUpdate && (
            <div className="skill-match-footer">
              <span className="skill-match-update-time">
                Updated {new Date(lastUpdate).toLocaleTimeString()}
              </span>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .skill-match-jobs {
          background: var(--color-bg-card, rgba(18, 18, 18, 0.4));
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 20px;
          color: white;
        }

        .dash-widget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .dash-widget-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dash-widget-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }

        .demo-mode-banner {
          background: rgba(251, 191, 36, 0.15);
          border: 1px solid rgba(251, 191, 36, 0.3);
          border-radius: 8px;
          padding: 8px 12px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: rgba(251, 191, 36, 1);
        }

        .profile-incomplete-banner {
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 8px;
          padding: 10px 12px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          font-size: 12px;
          color: rgba(59, 130, 246, 1);
        }

        .banner-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .add-skills-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(59, 130, 246, 0.9);
          color: white;
          border: none;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .add-skills-btn:hover {
          background: rgba(59, 130, 246, 1);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .search-query-info {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 8px;
          padding: 8px 12px;
          margin-bottom: 12px;
          font-size: 12px;
          color: rgba(16, 185, 129, 1);
        }

        .recent-jobs-info {
          background: rgba(168, 85, 247, 0.1);
          border: 1px solid rgba(168, 85, 247, 0.2);
          border-radius: 8px;
          padding: 8px 12px;
          margin-bottom: 12px;
          font-size: 12px;
          color: rgba(168, 85, 247, 1);
        }

        .search-query-info strong,
        .recent-jobs-info strong {
          font-weight: 600;
        }

        .dash-refresh-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 8px;
          padding: 6px 8px;
          cursor: pointer;
          color: white;
          transition: all 0.2s;
        }

        .dash-refresh-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.3);
        }

        .dash-refresh-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .dash-widget-loading,
        .dash-widget-empty {
          text-align: center;
          padding: 40px 20px;
          opacity: 0.9;
        }

        .empty-hint {
          font-size: 13px;
          opacity: 0.8;
          margin: 8px 0 16px;
        }

        .add-skills-btn-large {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(59, 130, 246, 0.9);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 8px;
        }

        .add-skills-btn-large:hover {
          background: rgba(59, 130, 246, 1);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }

        .retry-btn {
          margin-top: 12px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          color: white;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }

        .retry-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .dash-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 12px;
        }

        .skill-match-jobs-list {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .skill-match-job-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 14px;
          transition: all 0.2s;
        }

        .skill-match-job-card:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .skill-match-job-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .skill-match-company-logo {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .company-logo-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: white;
          padding: 4px;
        }

        .company-logo-placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .skill-match-job-info {
          margin-bottom: 10px;
        }

        .skill-match-job-title {
          font-size: 15px;
          font-weight: 600;
          margin: 0 0 4px 0;
          color: white;
          line-height: 1.3;
        }

        .skill-match-job-company {
          font-size: 13px;
          font-weight: 500;
          margin: 0;
          color: rgba(255, 255, 255, 0.7);
        }

        .skill-match-score {
          background: rgba(16, 185, 129, 0.9);
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 3px;
          white-space: nowrap;
        }

        .skill-match-job-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          font-size: 11px;
          opacity: 0.85;
          margin-bottom: 10px;
        }

        .skill-match-job-location,
        .skill-match-job-salary,
        .skill-match-job-type {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px 8px;
          border-radius: 4px;
          white-space: nowrap;
        }

        .skill-match-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }

        .skill-match-tag {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 500;
        }

        .skill-match-apply-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: white;
          color: #121212;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }

        .skill-match-apply-btn:hover {
          transform: translateX(2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .skill-match-footer {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          text-align: center;
        }

        .skill-match-update-time {
          font-size: 11px;
          opacity: 0.7;
        }

        @media (max-width: 960px) {
          .skill-match-jobs-list {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .skill-match-jobs-list {
            grid-template-columns: 1fr;
          }

          .profile-incomplete-banner {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .banner-content {
            width: 100%;
          }

          .add-skills-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
