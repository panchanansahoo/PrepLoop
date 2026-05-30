import { useState, useEffect, useCallback } from 'react';
import './AdminDashboard.css';
import axios from 'axios';
import { buildApiUrl } from '../utils/safeApiUrl';
import {
  Users, FileText, BarChart3, Trash2, ShieldCheck, Shield,
  Search, ChevronLeft, ChevronRight, AlertTriangle, TrendingUp,
  UserCheck, UserX, MessageSquare, Loader2, RefreshCw,
  Briefcase, Plus, Edit3, ToggleLeft, ToggleRight, X, ExternalLink
} from 'lucide-react';

export default function AdminDashboard() {
  const API_BASE_URL = import.meta.env.VITE_API_URL || '';
  const buildAdminApiUrl = useCallback(
    (path) => buildApiUrl(path, { rawBaseUrl: API_BASE_URL, apiPrefix: '/api' }),
    [API_BASE_URL]
  );
  const FORM_LABELS = {
    requirements: 'Requirements (comma-separated)',
  };

  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // User filters
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);

  // Content filters
  const [contentType, setContentType] = useState('posts');
  const [contentPage, setContentPage] = useState(1);
  const [contentTotal, setContentTotal] = useState(0);

  // Job management
  const [jobs, setJobs] = useState([]);
  const [jobPage, setJobPage] = useState(1);
  const [jobTotal, setJobTotal] = useState(0);
  const [jobSearch, setJobSearch] = useState('');
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobForm, setJobForm] = useState({
    title: '', company: '', category: 'fresher', job_type: 'full-time',
    location: '', salary_range: '', description: '', requirements: '',
    apply_link: '', deadline: '', tags: '', is_active: true
  });

  const LIMIT = 15;

  const clearMessages = () => { setError(''); setSuccess(''); };

  // ─── Fetch Stats ───
  const fetchStats = useCallback(async () => {
    setLoading(true);
    clearMessages();
    try {
      const res = await axios.get('/api/admin/stats');
      setStats(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Fetch Users ───
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    clearMessages();
    try {
      const res = await axios.get('/api/admin/users', {
        params: {
          page: userPage,
          limit: LIMIT,
          search: userSearch || undefined,
          role: userRoleFilter || undefined
        }
      });
      setUsers(res.data.users);
      setUserTotal(res.data.total);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [userPage, userSearch, userRoleFilter]);

  // ─── Fetch Content ───
  const fetchContent = useCallback(async () => {
    setLoading(true);
    clearMessages();
    try {
      const res = await axios.get('/api/admin/content', {
        params: { type: contentType, page: contentPage, limit: LIMIT }
      });
      setContent(res.data.items);
      setContentTotal(res.data.total);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  }, [contentType, contentPage]);

  // ─── Fetch Jobs ───
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    clearMessages();
    try {
      const res = await axios.get('/api/jobs', {
        params: { page: jobPage, limit: LIMIT, search: jobSearch || undefined, include_inactive: true }
      });
      setJobs(res.data.jobs || []);
      setJobTotal(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [jobPage, jobSearch]);

  useEffect(() => {
    if (activeTab === 'stats') fetchStats();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'content') fetchContent();
    if (activeTab === 'jobs') fetchJobs();
  }, [activeTab, fetchStats, fetchUsers, fetchContent, fetchJobs]);

  // ─── Actions ───
  const handleRoleChange = async (userId, newRole) => {
    clearMessages();
    try {
      await axios.put(buildAdminApiUrl(`/admin/users/${userId}/role`), { role: newRole });
      setSuccess(`Role updated to ${newRole}`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (!window.confirm(`Delete user ${email}? This cannot be undone.`)) return;
    clearMessages();
    try {
      await axios.delete(`/api/admin/users/${userId}`);
      setSuccess('User deleted');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleDeleteContent = async (type, id) => {
    if (!window.confirm(`Delete this ${type.slice(0, -1)}?`)) return;
    clearMessages();
    try {
      await axios.delete(`/api/admin/content/${type}/${id}`);
      setSuccess('Content deleted');
      fetchContent();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete content');
    }
  };

  // ─── Job Actions ───
  const resetJobForm = () => {
    setJobForm({
      title: '', company: '', category: 'fresher', job_type: 'full-time',
      location: '', salary_range: '', description: '', requirements: '',
      apply_link: '', deadline: '', tags: '', is_active: true
    });
    setEditingJob(null);
  };

  const openCreateJob = () => { resetJobForm(); setShowJobModal(true); };

  const openEditJob = (job) => {
    setEditingJob(job);
    setJobForm({
      title: job.title || '', company: job.company || '', category: job.category || 'fresher',
      job_type: job.job_type || 'full-time', location: job.location || '',
      salary_range: job.salary_range || '', description: job.description || '',
      requirements: Array.isArray(job.requirements) ? job.requirements.join(', ') : (job.requirements || ''),
      apply_link: job.apply_link || '',
      deadline: job.deadline ? job.deadline.split('T')[0] : '',
      tags: Array.isArray(job.tags) ? job.tags.join(', ') : (job.tags || ''),
      is_active: job.is_active !== false
    });
    setShowJobModal(true);
  };

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    const payload = {
      ...jobForm,
      requirements: jobForm.requirements ? jobForm.requirements.split(',').map(r => r.trim()).filter(Boolean) : [],
      tags: jobForm.tags ? jobForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      deadline: jobForm.deadline || null
    };
    try {
      if (editingJob) {
        await axios.put(`/api/jobs/${editingJob.id}`, payload);
        setSuccess('Job updated successfully');
      } else {
        await axios.post('/api/jobs', payload);
        setSuccess('Job created successfully');
      }
      setShowJobModal(false);
      resetJobForm();
      fetchJobs();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save job');
    }
  };

  const handleToggleJob = async (jobId) => {
    clearMessages();
    try {
      await axios.patch(`/api/jobs/${jobId}/toggle`);
      setSuccess('Job status toggled');
      fetchJobs();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to toggle job');
    }
  };

  const handleDeleteJob = async (jobId, title) => {
    if (!window.confirm(`Delete job "${title}"? This cannot be undone.`)) return;
    clearMessages();
    try {
      await axios.delete(`/api/jobs/${jobId}`);
      setSuccess('Job deleted');
      fetchJobs();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete job');
    }
  };

  const totalUserPages = Math.ceil(userTotal / LIMIT);
  const totalContentPages = Math.ceil(contentTotal / LIMIT);
  const totalJobPages = Math.ceil(jobTotal / LIMIT);

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-header-left">
          <ShieldCheck size={28} />
          <div>
            <h1>Admin Dashboard</h1>
            <p>Manage users, content, and platform analytics</p>
          </div>
        </div>
      </div>

      {/* Feedback Messages */}
      {error && (
        <div className="admin-alert admin-alert-error">
          <AlertTriangle size={16} /> {error}
          <button onClick={() => setError('')} className="admin-alert-close">&times;</button>
        </div>
      )}
      {success && (
        <div className="admin-alert admin-alert-success">
          <UserCheck size={16} /> {success}
          <button onClick={() => setSuccess('')} className="admin-alert-close">&times;</button>
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tabs">
        {[
          { key: 'stats', label: 'Overview', icon: BarChart3 },
          { key: 'users', label: 'Users', icon: Users },
          { key: 'content', label: 'Content', icon: MessageSquare },
          { key: 'jobs', label: 'Jobs', icon: Briefcase }
        ].map(tab => (
          <button
            key={tab.key}
            className={`admin-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab.key); clearMessages(); }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="admin-loading">
          <Loader2 size={28} className="spin" />
          <span>Loading...</span>
        </div>
      )}

      {/* ═══ STATS TAB ═══ */}
      {activeTab === 'stats' && stats && !loading && (
        <div className="admin-stats-grid">
          <StatCard label="Total Users" value={stats.totalUsers} icon={Users} color="#6366f1" />
          <StatCard label="New (7d)" value={stats.newUsersLast7Days} icon={TrendingUp} color="#22c55e" />
          <StatCard label="Submissions" value={stats.totalSubmissions} icon={FileText} color="#f59e0b" />
          <StatCard label="Interviews" value={stats.totalInterviews} icon={BarChart3} color="#ec4899" />
          <StatCard label="Posts" value={stats.totalPosts} icon={MessageSquare} color="#8b5cf6" />
          <StatCard label="Replies" value={stats.totalReplies} icon={MessageSquare} color="#14b8a6" />

          {stats.subscriptionBreakdown && (
            <div className="admin-stats-card wide">
              <h3>Subscription Tiers</h3>
              <div className="tier-bars">
                {stats.subscriptionBreakdown.map(t => (
                  <div key={t.subscription_tier} className="tier-bar-row">
                    <span className="tier-label">{t.subscription_tier || 'free'}</span>
                    <div className="tier-bar-track">
                      <div
                        className="tier-bar-fill"
                        style={{ width: `${Math.min((t.count / stats.totalUsers) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="tier-count">{t.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ USERS TAB ═══ */}
      {activeTab === 'users' && !loading && (
        <div className="admin-users-section">
          <div className="admin-toolbar">
            <div className="admin-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={userSearch}
                onChange={e => { setUserSearch(e.target.value); setUserPage(1); }}
              />
            </div>
            <select
              value={userRoleFilter}
              onChange={e => { setUserRoleFilter(e.target.value); setUserPage(1); }}
              className="admin-select"
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <button className="admin-btn-icon" onClick={fetchUsers} title="Refresh">
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Tier</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="admin-user-cell">
                      <div className="admin-avatar">{(u.full_name || u.email || '?')[0].toUpperCase()}</div>
                      <span>{u.full_name || '—'}</span>
                    </td>
                    <td>{u.email || '—'}</td>
                    <td>
                      <span className={`admin-role-badge ${u.role}`}>
                        {u.role === 'admin' ? <ShieldCheck size={12} /> : <Shield size={12} />}
                        {u.role}
                      </span>
                    </td>
                    <td><span className="admin-tier-badge">{u.subscription_tier || 'free'}</span></td>
                    <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                    <td className="admin-actions-cell">
                      {u.role === 'user' ? (
                        <button
                          className="admin-btn-sm promote"
                          onClick={() => handleRoleChange(u.id, 'admin')}
                          title="Promote to Admin"
                        >
                          <ShieldCheck size={14} /> Promote
                        </button>
                      ) : (
                        <button
                          className="admin-btn-sm demote"
                          onClick={() => handleRoleChange(u.id, 'user')}
                          title="Demote to User"
                        >
                          <UserX size={14} /> Demote
                        </button>
                      )}
                      <button
                        className="admin-btn-sm delete"
                        onClick={() => handleDeleteUser(u.id, u.email)}
                        title="Delete User"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={6} className="admin-empty">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalUserPages > 1 && (
            <Pagination current={userPage} total={totalUserPages} onChange={setUserPage} />
          )}
        </div>
      )}

      {/* ═══ CONTENT TAB ═══ */}
      {activeTab === 'content' && !loading && (
        <div className="admin-content-section">
          <div className="admin-toolbar">
            <select
              value={contentType}
              onChange={e => { setContentType(e.target.value); setContentPage(1); }}
              className="admin-select"
            >
              <option value="posts">Posts</option>
              <option value="replies">Replies</option>
            </select>
            <button className="admin-btn-icon" onClick={fetchContent} title="Refresh">
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="admin-content-list">
            {content.map(item => (
              <div key={item.id} className="admin-content-card">
                <div className="admin-content-header">
                  <span className="admin-content-author">
                    {item.profiles?.full_name || 'Unknown'}
                  </span>
                  <span className="admin-content-date">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                  </span>
                </div>
                {item.title && <h4 className="admin-content-title">{item.title}</h4>}
                <p className="admin-content-body">
                  {(item.content || item.body || '').slice(0, 200)}
                  {(item.content || item.body || '').length > 200 ? '...' : ''}
                </p>
                <div className="admin-content-footer">
                  {item.category && <span className="admin-content-tag">{item.category}</span>}
                  <button
                    className="admin-btn-sm delete"
                    onClick={() => handleDeleteContent(contentType, item.id)}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
            {content.length === 0 && (
              <div className="admin-empty-state">
                <MessageSquare size={32} />
                <p>No {contentType} found</p>
              </div>
            )}
          </div>

          {totalContentPages > 1 && (
            <Pagination current={contentPage} total={totalContentPages} onChange={setContentPage} />
          )}
        </div>
      )}

      {/* ═══ JOBS TAB ═══ */}
      {activeTab === 'jobs' && !loading && (
        <div className="admin-jobs-section">
          <div className="admin-toolbar">
            <div className="admin-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search jobs..."
                value={jobSearch}
                onChange={e => { setJobSearch(e.target.value); setJobPage(1); }}
              />
            </div>
            <button className="admin-btn-primary" onClick={openCreateJob}>
              <Plus size={16} /> Add Job
            </button>
            <button className="admin-btn-icon" onClick={fetchJobs} title="Refresh">
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Company</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Deadline</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job.id} className={!job.is_active ? 'inactive-row' : ''}>
                    <td className="admin-job-title-cell">
                      <span className="admin-job-title">{job.title}</span>
                      {job.apply_link && (
                        <a href={job.apply_link} target="_blank" rel="noopener noreferrer" className="admin-job-link">
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </td>
                    <td>{job.company || '—'}</td>
                    <td><span className="admin-content-tag">{job.category}</span></td>
                    <td><span className="admin-tier-badge">{job.job_type}</span></td>
                    <td>
                      <button
                        className={`admin-btn-sm ${job.is_active ? 'promote' : 'demote'}`}
                        onClick={() => handleToggleJob(job.id)}
                        title={job.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {job.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        {job.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>{job.deadline ? new Date(job.deadline).toLocaleDateString() : '—'}</td>
                    <td className="admin-actions-cell">
                      <button className="admin-btn-sm promote" onClick={() => openEditJob(job)} title="Edit">
                        <Edit3 size={14} />
                      </button>
                      <button
                        className="admin-btn-sm delete"
                        onClick={() => handleDeleteJob(job.id, job.title)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {jobs.length === 0 && (
                  <tr><td colSpan={7} className="admin-empty">No jobs found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalJobPages > 1 && (
            <Pagination current={jobPage} total={totalJobPages} onChange={setJobPage} />
          )}
        </div>
      )}

      {/* ═══ JOB MODAL ═══ */}
      {showJobModal && (
        <div className="admin-modal-overlay" onClick={() => setShowJobModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingJob ? 'Edit Job' : 'Create Job'}</h2>
              <button className="admin-modal-close" onClick={() => setShowJobModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleJobSubmit} className="admin-job-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text" required value={jobForm.title}
                    onChange={e => setJobForm({...jobForm, title: e.target.value})}
                    placeholder="e.g. Software Engineer"
                  />
                </div>
                <div className="form-group">
                  <label>Company *</label>
                  <input
                    type="text" required value={jobForm.company}
                    onChange={e => setJobForm({...jobForm, company: e.target.value})}
                    placeholder="e.g. TCS"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select value={jobForm.category} onChange={e => setJobForm({...jobForm, category: e.target.value})}>
                    <option value="fresher">Fresher</option>
                    <option value="off-campus">Off-Campus</option>
                    <option value="internship">Internship</option>
                    <option value="campus-drive">Campus Drive</option>
                    <option value="announcement">Announcement</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Job Type</label>
                  <select value={jobForm.job_type} onChange={e => setJobForm({...jobForm, job_type: e.target.value})}>
                    <option value="full-time">Full-Time</option>
                    <option value="part-time">Part-Time</option>
                    <option value="internship">Internship</option>
                    <option value="contract">Contract</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text" value={jobForm.location}
                    onChange={e => setJobForm({...jobForm, location: e.target.value})}
                    placeholder="e.g. Bangalore, India"
                  />
                </div>
                <div className="form-group">
                  <label>Salary Range</label>
                  <input
                    type="text" value={jobForm.salary_range}
                    onChange={e => setJobForm({...jobForm, salary_range: e.target.value})}
                    placeholder="e.g. ₹3-6 LPA"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={3} value={jobForm.description}
                  onChange={e => setJobForm({...jobForm, description: e.target.value})}
                  placeholder="Brief job description..."
                />
              </div>
              <div className="form-group">
                <label>{FORM_LABELS.requirements}</label>
                <input
                  type="text" value={jobForm.requirements}
                  onChange={e => setJobForm({...jobForm, requirements: e.target.value})}
                  placeholder="e.g. React, Node.js, SQL"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Apply Link *</label>
                  <input
                    type="url" required value={jobForm.apply_link}
                    onChange={e => setJobForm({...jobForm, apply_link: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
                <div className="form-group">
                  <label>Deadline</label>
                  <input
                    type="date" value={jobForm.deadline}
                    onChange={e => setJobForm({...jobForm, deadline: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text" value={jobForm.tags}
                  onChange={e => setJobForm({...jobForm, tags: e.target.value})}
                  placeholder="e.g. freshers, remote, startup"
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox" checked={jobForm.is_active}
                    onChange={e => setJobForm({...jobForm, is_active: e.target.checked})}
                  />
                  Active (visible to users)
                </label>
              </div>
              <div className="form-actions">
                <button type="button" className="admin-btn-cancel" onClick={() => setShowJobModal(false)}>Cancel</button>
                <button type="submit" className="admin-btn-primary">
                  {editingJob ? 'Update Job' : 'Create Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stat Card ───
function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="admin-stats-card">
      <div className="admin-stats-icon" style={{ background: `${color}22`, color }}>
        <Icon size={20} />
      </div>
      <div className="admin-stats-info">
        <span className="admin-stats-value">{value ?? '—'}</span>
        <span className="admin-stats-label">{label}</span>
      </div>
    </div>
  );
}

// ─── Pagination ───
function Pagination({ current, total, onChange }) {
  return (
    <div className="admin-pagination">
      <button
        className="admin-page-btn"
        disabled={current <= 1}
        onClick={() => onChange(current - 1)}
      >
        <ChevronLeft size={16} />
      </button>
      <span className="admin-page-info">
        Page {current} of {total}
      </span>
      <button
        className="admin-page-btn"
        disabled={current >= total}
        onClick={() => onChange(current + 1)}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
