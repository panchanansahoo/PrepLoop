import { useState, useEffect } from 'react';
import { 
  Key, 
  Webhook, 
  Copy, 
  Check, 
  Trash2, 
  Plus, 
  Send, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle, 
  Code2,
  Terminal,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { authFetch } from '../utils/authFetch';
import './Dashboard.css';

export default function DeveloperPortalPage() {
  const [activeTab, setActiveTab] = useState('keys'); // 'keys' | 'webhooks' | 'questionSets' | 'docs'
  const [apiKeys, setApiKeys] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [questionSets, setQuestionSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null);

  // New key modal state
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState(['interviews:read']);
  const [generatedRawKey, setGeneratedRawKey] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // New webhook modal state
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [webhookEvents, setWebhookEvents] = useState(['interview.completed']);
  const [testingWebhookId, setTestingWebhookId] = useState(null);

  // New question bank modal state
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [qSetTitle, setQSetTitle] = useState('');
  const [qSetCompany, setQSetCompany] = useState('');
  const [qSetRole, setQSetRole] = useState('Software Engineer');
  const [qSetQuestions, setQSetQuestions] = useState([
    { question: '', difficulty: 'medium', category: 'Technical' },
  ]);
  const [submittingQSet, setSubmittingQSet] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [keysRes, hooksRes] = await Promise.all([
        authFetch('/api/employer/api-keys').catch(() => ({ ok: false })),
        authFetch('/api/employer/webhooks').catch(() => ({ ok: false })),
      ]);

      if (keysRes?.ok) {
        const data = await keysRes.json();
        setApiKeys(data.apiKeys || []);
      }
      if (hooksRes?.ok) {
        const data = await hooksRes.json();
        setWebhooks(data.webhooks || []);
      }
      try {
        const qRes = await authFetch('/api/employer/question-banks');
        if (qRes?.ok) {
          const data = await qRes.json();
          setQuestionSets(data.questionSets || []);
        }
      } catch (_) {}
    } catch (err) {
      console.error('Failed to load developer portal data', err);
    } finally {
      setLoading(false);
    }
  };

  const notify = (type, message) => {
    setStatusMessage({ type, message });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleCreateApiKey = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      const res = await authFetch('/api/employer/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName.trim(),
          scopes: newKeyScopes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create API key');
      }

      const data = await res.json();
      setGeneratedRawKey(data.apiKey.key);
      setApiKeys((prev) => [data.apiKey, ...prev]);
      notify('success', 'API key generated successfully!');
    } catch (err) {
      notify('error', err.message);
    }
  };

  const handleRevokeApiKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to revoke this API key? This action is immediate and cannot be undone.')) {
      return;
    }

    try {
      const res = await authFetch(`/api/employer/api-keys/${keyId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to revoke API key');

      setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
      notify('success', 'API key revoked.');
    } catch (err) {
      notify('error', err.message);
    }
  };

  const handleCreateWebhook = async (e) => {
    e.preventDefault();
    if (!webhookUrl.trim()) return;

    try {
      const res = await authFetch('/api/employer/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: webhookUrl.trim(),
          secret: webhookSecret.trim() || undefined,
          events: webhookEvents,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to register webhook');
      }

      const data = await res.json();
      setWebhooks((prev) => [data.webhook, ...prev]);
      setShowWebhookModal(false);
      setWebhookUrl('');
      setWebhookSecret('');
      notify('success', 'Webhook endpoint registered successfully!');
    } catch (err) {
      notify('error', err.message);
    }
  };

  const handleDeleteWebhook = async (webhookId) => {
    if (!window.confirm('Are you sure you want to delete this webhook subscription?')) {
      return;
    }

    try {
      const res = await authFetch(`/api/employer/webhooks/${webhookId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete webhook');

      setWebhooks((prev) => prev.filter((w) => w.id !== webhookId));
      notify('success', 'Webhook subscription removed.');
    } catch (err) {
      notify('error', err.message);
    }
  };

  const handleTestWebhook = async (webhookId) => {
    setTestingWebhookId(webhookId);
    try {
      const res = await authFetch(`/api/employer/webhooks/${webhookId}/test`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to trigger test webhook');

      notify('success', `Test event dispatched! Delivery ID: ${data.deliveryId}`);
    } catch (err) {
      notify('error', `Test delivery failed: ${err.message}`);
    } finally {
      setTestingWebhookId(null);
    }
  };

  const handleCreateQuestionBank = async (e) => {
    e.preventDefault();
    if (!qSetTitle.trim()) {
      notify('error', 'Question bank title is required');
      return;
    }
    const validQuestions = qSetQuestions.filter((q) => q.question.trim().length > 0);
    if (validQuestions.length === 0) {
      notify('error', 'At least one valid question is required');
      return;
    }
    setSubmittingQSet(true);
    try {
      const res = await authFetch('/api/employer/question-banks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: qSetTitle.trim(),
          companyName: qSetCompany.trim() || 'Enterprise Partner',
          role: qSetRole.trim() || 'Software Engineer',
          questions: validQuestions,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        notify('success', 'Corporate question bank published successfully');
        setShowQuestionModal(false);
        setQSetTitle('');
        setQSetCompany('');
        setQSetQuestions([{ question: '', difficulty: 'medium', category: 'Technical' }]);
        fetchData();
      } else {
        notify('error', data.error || 'Failed to create question bank');
      }
    } catch (err) {
      notify('error', err.message || 'Network error');
    } finally {
      setSubmittingQSet(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="account-page developer-portal" style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Top Banner / Hero */}
      <div className="account-hero" style={{ marginBottom: '2rem' }}>
        <div className="account-hero-copy">
          <p className="account-kicker" style={{ color: 'var(--color-primary, #6366f1)', fontWeight: 600 }}>Developer Platform</p>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.25rem 0 0.75rem' }}>Platform API & Webhooks</h1>
          <p style={{ color: 'var(--text-secondary, #94a3b8)', maxWidth: '640px' }}>
            Integrate candidate mock interview reports, automated scoring telemetry, and live practice events directly into your ATS, Slack channels, or custom microservices.
          </p>
          <div className="account-chip-row" style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <span className="account-chip" style={{ background: 'var(--bg-secondary, #1e293b)', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
              <Key size={13} style={{ display: 'inline', marginRight: '4px' }} /> {apiKeys.length} Active Keys
            </span>
            <span className="account-chip" style={{ background: 'var(--bg-secondary, #1e293b)', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
              <Webhook size={13} style={{ display: 'inline', marginRight: '4px' }} /> {webhooks.length} Webhook Endpoints
            </span>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div
          role="status"
          style={{
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: statusMessage.type === 'success' ? '#10b981' : '#ef4444',
            border: `1px solid ${statusMessage.type === 'success' ? '#10b98140' : '#ef444440'}`,
          }}
        >
          {statusMessage.type === 'success' ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
          <span>{statusMessage.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color, #334155)', marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('keys')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.75rem 1rem',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '1rem',
            color: activeTab === 'keys' ? 'var(--color-primary, #6366f1)' : 'var(--text-secondary, #94a3b8)',
            borderBottom: activeTab === 'keys' ? '2px solid var(--color-primary, #6366f1)' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Key size={16} /> API Keys
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('webhooks')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.75rem 1rem',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '1rem',
            color: activeTab === 'webhooks' ? 'var(--color-primary, #6366f1)' : 'var(--text-secondary, #94a3b8)',
            borderBottom: activeTab === 'webhooks' ? '2px solid var(--color-primary, #6366f1)' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Webhook size={16} /> Webhooks
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('questionSets')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.75rem 1rem',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '1rem',
            color: activeTab === 'questionSets' ? 'var(--color-primary, #6366f1)' : 'var(--text-secondary, #94a3b8)',
            borderBottom: activeTab === 'questionSets' ? '2px solid var(--color-primary, #6366f1)' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <BookOpen size={16} /> Question Sets
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('docs')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.75rem 1rem',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '1rem',
            color: activeTab === 'docs' ? 'var(--color-primary, #6366f1)' : 'var(--text-secondary, #94a3b8)',
            borderBottom: activeTab === 'docs' ? '2px solid var(--color-primary, #6366f1)' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Code2 size={16} /> Documentation & Snippets
        </button>
      </div>

      {/* Tab 1: API Keys */}
      {activeTab === 'keys' && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Active API Keys</h2>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary, #94a3b8)', fontSize: '0.9rem' }}>
                Authenticate external server-to-server requests using the Bearer scheme.
              </p>
            </div>
            <button
              onClick={() => {
                setShowKeyModal(true);
                setGeneratedRawKey(null);
                setNewKeyName('');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                background: 'var(--color-primary, #6366f1)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <Plus size={16} /> Generate New Key
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary, #94a3b8)' }}>Loading keys...</div>
          ) : apiKeys.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-secondary, #1e293b)', borderRadius: '12px' }}>
              <Key size={36} style={{ color: 'var(--text-secondary, #94a3b8)', margin: '0 auto 1rem' }} />
              <h3 style={{ margin: '0 0 0.5rem' }}>No API Keys Created Yet</h3>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                Create your first platform API key to authenticate automated requests and integrate mock assessment results.
              </p>
              <button
                onClick={() => setShowKeyModal(true)}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  background: 'var(--color-primary, #6366f1)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Create API Key
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {apiKeys.map((k) => (
                <div
                  key={k.id}
                  style={{
                    background: 'var(--bg-secondary, #1e293b)',
                    padding: '1.25rem',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid var(--border-color, #334155)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                      <strong style={{ fontSize: '1.05rem' }}>{k.name}</strong>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          background: 'rgba(0,0,0,0.3)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          color: '#e2e8f0',
                        }}
                      >
                        {k.prefix}...
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      {(k.scopes || []).map((s) => (
                        <span
                          key={s}
                          style={{
                            background: 'rgba(99, 102, 241, 0.15)',
                            color: 'var(--color-primary, #818cf8)',
                            fontSize: '0.75rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            fontWeight: 500,
                          }}
                        >
                          {s}
                        </span>
                      ))}
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', marginLeft: '0.5rem' }}>
                        Created {new Date(k.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevokeApiKey(k.id)}
                    title="Revoke API Key"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.85rem',
                    }}
                  >
                    <Trash2 size={14} /> Revoke
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Create Key Modal */}
          {showKeyModal && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '1rem',
              }}
            >
              <div
                style={{
                  background: 'var(--bg-primary, #0f172a)',
                  border: '1px solid var(--border-color, #334155)',
                  borderRadius: '12px',
                  width: '100%',
                  maxWidth: '520px',
                  padding: '2rem',
                }}
              >
                {!generatedRawKey ? (
                  <form onSubmit={handleCreateApiKey}>
                    <h3 style={{ margin: '0 0 0.5rem' }}>Create API Key</h3>
                    <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                      Choose a descriptive name and configure the permissions for this key.
                    </p>

                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Key Label / Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ATS Greenfield Pipeline"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        background: 'var(--bg-secondary, #1e293b)',
                        border: '1px solid var(--border-color, #334155)',
                        borderRadius: '6px',
                        color: '#fff',
                        marginBottom: '1.25rem',
                      }}
                    />

                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                      Access Scopes
                    </label>
                    <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1.5rem' }}>
                      {[
                        { id: 'interviews:read', label: 'interviews:read (Read candidate mock interview transcripts)' },
                        { id: 'candidates:export', label: 'candidates:export (Export candidates and scores)' },
                        { id: 'interviews:write', label: 'interviews:write (Create interview rooms programmatically)' },
                      ].map((sc) => (
                        <label key={sc.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={newKeyScopes.includes(sc.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewKeyScopes([...newKeyScopes, sc.id]);
                              } else {
                                setNewKeyScopes(newKeyScopes.filter((x) => x !== sc.id));
                              }
                            }}
                          />
                          {sc.label}
                        </label>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => setShowKeyModal(false)}
                        style={{
                          padding: '0.6rem 1rem',
                          background: 'none',
                          border: '1px solid var(--border-color, #334155)',
                          borderRadius: '6px',
                          color: 'var(--text-secondary, #94a3b8)',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!newKeyName.trim()}
                        style={{
                          padding: '0.6rem 1.25rem',
                          background: 'var(--color-primary, #6366f1)',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#fff',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Generate Key
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', marginBottom: '0.5rem' }}>
                      <ShieldCheck size={24} />
                      <h3 style={{ margin: 0 }}>API Key Successfully Generated</h3>
                    </div>
                    <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                      Please copy this key now and store it in a secure location. For your security, it will not be displayed again.
                    </p>

                    <div
                      style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid #10b98150',
                        borderRadius: '8px',
                        padding: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '1.5rem',
                      }}
                    >
                      <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', wordBreak: 'break-all', color: '#34d399' }}>
                        {generatedRawKey}
                      </span>
                      <button
                        onClick={() => copyToClipboard(generatedRawKey)}
                        style={{
                          background: copiedKey ? '#10b981' : 'var(--color-primary, #6366f1)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.5rem 0.75rem',
                          marginLeft: '0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {copiedKey ? <Check size={14} /> : <Copy size={14} />}
                        {copiedKey ? 'Copied!' : 'Copy'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => {
                          setShowKeyModal(false);
                          setGeneratedRawKey(null);
                        }}
                        style={{
                          padding: '0.6rem 1.25rem',
                          background: 'var(--color-primary, #6366f1)',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#fff',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Webhooks */}
      {activeTab === 'webhooks' && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Webhook Subscriptions</h2>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary, #94a3b8)', fontSize: '0.9rem' }}>
                Receive real-time event notifications with HMAC-SHA256 signature verification.
              </p>
            </div>
            <button
              onClick={() => setShowWebhookModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                background: 'var(--color-primary, #6366f1)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <Plus size={16} /> Add Webhook
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary, #94a3b8)' }}>Loading webhooks...</div>
          ) : webhooks.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-secondary, #1e293b)', borderRadius: '12px' }}>
              <Webhook size={36} style={{ color: 'var(--text-secondary, #94a3b8)', margin: '0 auto 1rem' }} />
              <h3 style={{ margin: '0 0 0.5rem' }}>No Webhooks Configured</h3>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                Register a secure HTTPS destination URL to receive interview completions and candidate telemetry events.
              </p>
              <button
                onClick={() => setShowWebhookModal(true)}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  background: 'var(--color-primary, #6366f1)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Add Endpoint
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {webhooks.map((w) => (
                <div
                  key={w.id}
                  style={{
                    background: 'var(--bg-secondary, #1e293b)',
                    padding: '1.25rem',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid var(--border-color, #334155)',
                  }}
                >
                  <div style={{ maxWidth: '70%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                      <strong style={{ fontSize: '1rem', wordBreak: 'break-all' }}>{w.target_url || w.targetUrl}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      {(w.events || []).map((e) => (
                        <span
                          key={e}
                          style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            fontSize: '0.75rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            fontWeight: 500,
                          }}
                        >
                          {e}
                        </span>
                      ))}
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', marginLeft: '0.5rem' }}>
                        Added {new Date(w.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleTestWebhook(w.id)}
                      disabled={testingWebhookId === w.id}
                      style={{
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: 'var(--color-primary, #818cf8)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                      }}
                    >
                      {testingWebhookId === w.id ? <RefreshCw size={14} className="spin" /> : <Send size={14} />}
                      {testingWebhookId === w.id ? 'Sending...' : 'Send Test Ping'}
                    </button>

                    <button
                      onClick={() => handleDeleteWebhook(w.id)}
                      title="Delete webhook"
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '0.85rem',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Webhook Modal */}
          {showWebhookModal && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '1rem',
              }}
            >
              <div
                style={{
                  background: 'var(--bg-primary, #0f172a)',
                  border: '1px solid var(--border-color, #334155)',
                  borderRadius: '12px',
                  width: '100%',
                  maxWidth: '520px',
                  padding: '2rem',
                }}
              >
                <form onSubmit={handleCreateWebhook}>
                  <h3 style={{ margin: '0 0 0.5rem' }}>Register Webhook Endpoint</h3>
                  <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                    We will send an HTTP POST request to this endpoint whenever designated events occur.
                  </p>

                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Destination URL (HTTPS recommended)
                  </label>
                  <input
                    type="url"
                    placeholder="https://api.yourcompany.com/webhooks/preploop"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: 'var(--bg-secondary, #1e293b)',
                      border: '1px solid var(--border-color, #334155)',
                      borderRadius: '6px',
                      color: '#fff',
                      marginBottom: '1.25rem',
                    }}
                  />

                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Signing Secret (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="whsec_xxxxxxxx"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: 'var(--bg-secondary, #1e293b)',
                      border: '1px solid var(--border-color, #334155)',
                      borderRadius: '6px',
                      color: '#fff',
                      marginBottom: '1.25rem',
                    }}
                  />

                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Subscribed Events
                  </label>
                  <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {[
                      { id: 'interview.completed', label: 'interview.completed (Mock interview finished with score)' },
                      { id: 'candidate.scored', label: 'candidate.scored (Rubric evaluation generated)' },
                      { id: 'challenge.solved', label: 'challenge.solved (Community challenge solved)' },
                    ].map((ev) => (
                      <label key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={webhookEvents.includes(ev.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setWebhookEvents([...webhookEvents, ev.id]);
                            } else {
                              setWebhookEvents(webhookEvents.filter((x) => x !== ev.id));
                            }
                          }}
                        />
                        {ev.label}
                      </label>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowWebhookModal(false)}
                      style={{
                        padding: '0.6rem 1rem',
                        background: 'none',
                        border: '1px solid var(--border-color, #334155)',
                        borderRadius: '6px',
                        color: 'var(--text-secondary, #94a3b8)',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!webhookUrl.trim()}
                      style={{
                        padding: '0.6rem 1.25rem',
                        background: 'var(--color-primary, #6366f1)',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#fff',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Save Webhook
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Tab 3: Question Sets */}
      {activeTab === 'questionSets' && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Corporate Question Sets</h2>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary, #94a3b8)', fontSize: '0.9rem' }}>
                Curate custom interview question banks, technical challenges, and tailored rubrics for your hiring pipeline.
              </p>
            </div>
            <button
              onClick={() => setShowQuestionModal(true)}
              style={{
                background: 'var(--color-primary, #6366f1)',
                color: '#fff',
                border: 'none',
                padding: '0.6rem 1.1rem',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Plus size={16} /> New Question Bank
            </button>
          </div>

          {questionSets.length === 0 ? (
            <div
              style={{
                background: 'var(--bg-secondary, #1e293b)',
                borderRadius: '12px',
                border: '1px dashed var(--border-color, #334155)',
                padding: '3rem 1.5rem',
                textAlign: 'center',
              }}
            >
              <BookOpen size={40} color="var(--text-secondary, #64748b)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>No Custom Question Banks Yet</h3>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
                Define standardized coding assessments, architecture prompts, or behavioral questions mapped to specific engineering levels.
              </p>
              <button
                onClick={() => setShowQuestionModal(true)}
                style={{
                  background: 'var(--color-primary, #6366f1)',
                  color: '#fff',
                  border: 'none',
                  padding: '0.6rem 1.25rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Create First Question Bank
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {questionSets.map((qs, index) => (
                <div
                  key={qs.id || index}
                  style={{
                    background: 'var(--bg-secondary, #1e293b)',
                    border: '1px solid var(--border-color, #334155)',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{qs.title}</h3>
                      <span
                        style={{
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: 'var(--color-primary, #818cf8)',
                          fontSize: '0.75rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontWeight: 600,
                        }}
                      >
                        {qs.company_name || 'Enterprise'}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>
                      Role: <strong style={{ color: '#e2e8f0' }}>{qs.target_role || 'General Engineering'}</strong>
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)' }}>
                      <span style={{ background: 'rgba(0,0,0,0.25)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        {(qs.questions || []).length} Question{((qs.questions || []).length === 1 ? '' : 's')}
                      </span>
                    </div>
                  </div>
                  {qs.questions && qs.questions.length > 0 && (
                    <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <p style={{ margin: '0 0 0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)' }}>Sample Prompt:</p>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        &ldquo;{typeof qs.questions[0] === 'string' ? qs.questions[0] : (qs.questions[0]?.question || 'Technical Problem')}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Create Question Bank Modal */}
          {showQuestionModal && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '1rem',
              }}
            >
              <div
                style={{
                  background: 'var(--bg-primary, #0f172a)',
                  border: '1px solid var(--border-color, #334155)',
                  borderRadius: '12px',
                  width: '100%',
                  maxWidth: '580px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  padding: '2rem',
                }}
              >
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>Create Question Bank</h3>
                <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.9rem', margin: '0 0 1.5rem' }}>
                  Define questions and evaluation rubrics for interviewers to draw from.
                </p>

                <form onSubmit={handleCreateQuestionBank}>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                      Question Bank Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Backend Core Systems"
                      value={qSetTitle}
                      onChange={(e) => setQSetTitle(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.8rem',
                        background: 'var(--bg-secondary, #1e293b)',
                        border: '1px solid var(--border-color, #334155)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                        Company / Team
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Acme Corp"
                        value={qSetCompany}
                        onChange={(e) => setQSetCompany(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.6rem 0.8rem',
                          background: 'var(--bg-secondary, #1e293b)',
                          border: '1px solid var(--border-color, #334155)',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '0.9rem',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                        Target Role
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Backend Engineer"
                        value={qSetRole}
                        onChange={(e) => setQSetRole(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.6rem 0.8rem',
                          background: 'var(--bg-secondary, #1e293b)',
                          border: '1px solid var(--border-color, #334155)',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '0.9rem',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Questions ({qSetQuestions.length})</label>
                      <button
                        type="button"
                        onClick={() =>
                          setQSetQuestions((prev) => [
                            ...prev,
                            { question: '', difficulty: 'medium', category: 'Technical' },
                          ])
                        }
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-primary, #818cf8)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <Plus size={14} /> Add Question
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {qSetQuestions.map((q, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: 'var(--bg-secondary, #1e293b)',
                            border: '1px solid var(--border-color, #334155)',
                            borderRadius: '8px',
                            padding: '0.75rem',
                          }}
                        >
                          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <input
                              type="text"
                              placeholder={`Question ${idx + 1} prompt / problem description`}
                              value={q.question}
                              onChange={(e) => {
                                const val = e.target.value;
                                setQSetQuestions((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, question: val } : item))
                                );
                              }}
                              style={{
                                flex: 1,
                                padding: '0.5rem 0.65rem',
                                background: '#090d16',
                                border: '1px solid var(--border-color, #334155)',
                                borderRadius: '4px',
                                color: '#fff',
                                fontSize: '0.85rem',
                              }}
                            />
                            {qSetQuestions.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setQSetQuestions((prev) => prev.filter((_, i) => i !== idx))
                                }
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  padding: '0.4rem',
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <select
                              value={q.difficulty}
                              onChange={(e) => {
                                const val = e.target.value;
                                setQSetQuestions((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, difficulty: val } : item))
                                );
                              }}
                              style={{
                                background: '#090d16',
                                border: '1px solid var(--border-color, #334155)',
                                borderRadius: '4px',
                                color: '#cbd5e1',
                                fontSize: '0.8rem',
                                padding: '0.25rem 0.5rem',
                              }}
                            >
                              <option value="easy">Easy</option>
                              <option value="medium">Medium</option>
                              <option value="hard">Hard</option>
                            </select>
                            <select
                              value={q.category}
                              onChange={(e) => {
                                const val = e.target.value;
                                setQSetQuestions((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, category: val } : item))
                                );
                              }}
                              style={{
                                background: '#090d16',
                                border: '1px solid var(--border-color, #334155)',
                                borderRadius: '4px',
                                color: '#cbd5e1',
                                fontSize: '0.8rem',
                                padding: '0.25rem 0.5rem',
                              }}
                            >
                              <option value="Technical">Technical</option>
                              <option value="System Design">System Design</option>
                              <option value="Behavioral">Behavioral</option>
                              <option value="Live Coding">Live Coding</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowQuestionModal(false)}
                      style={{
                        padding: '0.6rem 1rem',
                        background: 'none',
                        border: '1px solid var(--border-color, #334155)',
                        borderRadius: '6px',
                        color: 'var(--text-secondary, #94a3b8)',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingQSet || !qSetTitle.trim()}
                      style={{
                        padding: '0.6rem 1.25rem',
                        background: 'var(--color-primary, #6366f1)',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#fff',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {submittingQSet ? 'Publishing...' : 'Publish Question Bank'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Tab 4: Documentation & Code Snippets */}
      {activeTab === 'docs' && (
        <section style={{ display: 'grid', gap: '1.5rem' }}>
          <div
            style={{
              background: 'var(--bg-secondary, #1e293b)',
              padding: '1.5rem',
              borderRadius: '10px',
              border: '1px solid var(--border-color, #334155)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Terminal size={20} color="var(--color-primary, #6366f1)" />
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Quickstart: Authenticating API Requests</h3>
              </div>
              <a
                href="/docs/api-spec.html"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: 'var(--color-primary, #818cf8)',
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                OpenAPI Specification <ExternalLink size={14} />
              </a>
            </div>

            <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.9rem', margin: '0 0 1rem' }}>
              Pass your API key in the standard <code>Authorization</code> header using the Bearer token scheme:
            </p>

            <pre
              style={{
                background: '#090d16',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                color: '#e2e8f0',
                overflowX: 'auto',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
{`# Retrieve candidate screening reports
curl -X GET "https://api.preploop.com/api/employer/candidates" \\
  -H "Authorization: Bearer pl_live_xxxxxxxxxxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json"`}
            </pre>
          </div>

          <div
            style={{
              background: 'var(--bg-secondary, #1e293b)',
              padding: '1.5rem',
              borderRadius: '10px',
              border: '1px solid var(--border-color, #334155)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <ShieldCheck size={20} color="#10b981" />
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Verifying Webhook Signatures (Node.js)</h3>
            </div>
            <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.9rem', margin: '0 0 1rem' }}>
              PrepLoop signs outgoing webhook payloads with HMAC-SHA256 in the <code>X-PrepLoop-Signature</code> header.
            </p>

            <pre
              style={{
                background: '#090d16',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                color: '#e2e8f0',
                overflowX: 'auto',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
{`const crypto = require('crypto');

function verifyPrepLoopWebhook(rawPayload, signatureHeader, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawPayload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signatureHeader)
  );
}`}
            </pre>
          </div>
        </section>
      )}
    </div>
  );
}

