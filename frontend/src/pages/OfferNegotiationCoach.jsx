import React, { useState, useEffect } from 'react';
import { DollarSign, Send, RotateCcw, History, Lightbulb, ChevronRight, Trophy, Target, MessageCircle, TrendingUp } from 'lucide-react';
import { buildAuthHeaders } from '../utils/authHeaders';
import { buildApiUrl } from '../utils/safeApiUrl';
import { useTheme } from '../context/ThemeContext';

const API_URL = import.meta.env.VITE_API_URL || '';
const api = (path) => buildApiUrl(path, { rawBaseUrl: API_URL, apiPrefix: '/api' });

function ScenarioSelector({ scenarios, onSelect }) {
  return (
    <div className="nc-scenarios">
      <h2 className="nc-scenarios-title">Choose a Negotiation Scenario</h2>
      <p className="nc-scenarios-sub">Select a scenario to practice with the AI recruiter</p>
      <div className="nc-scenario-grid">
        {scenarios.map(s => (
          <div key={s.id} className="nc-scenario-card" onClick={() => onSelect(s)}>
            <div className={`nc-scenario-diff ${s.difficulty}`}>{s.difficulty}</div>
            <h3>{s.name}</h3>
            <p>{s.description}</p>
            <ChevronRight size={16} className="nc-scenario-arrow" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatView({ sessionId, messages, onSend, loading, status, score, feedback }) {
  const [input, setInput] = useState('');
  const chatRef = React.useRef(null);

  useEffect(() => { chatRef.current?.scrollTo(0, chatRef.current.scrollHeight); }, [messages]);

  const send = () => { if (input.trim() && !loading) { onSend(input); setInput(''); } };

  return (
    <div className="nc-chat">
      <div className="nc-chat-messages" ref={chatRef}>
        {messages.map((m, i) => (
          <div key={i} className={`nc-msg nc-msg-${m.role}`}>
            <div className="nc-msg-avatar">{m.role === 'user' ? '👤' : '🏢'}</div>
            <div className="nc-msg-content">
              <span className="nc-msg-role">{m.role === 'user' ? 'You' : 'Recruiter'}</span>
              <p>{m.content}</p>
            </div>
          </div>
        ))}
        {loading && <div className="nc-msg nc-msg-assistant"><div className="nc-msg-avatar">🏢</div><div className="nc-msg-content"><div className="nc-typing"><span /><span /><span /></div></div></div>}
      </div>

      {status === 'completed' && score !== null && (
        <div className="nc-result">
          <div className="nc-result-score"><Trophy size={24} /><span>{score}/100</span></div>
          {feedback && <p className="nc-result-feedback">{feedback}</p>}
        </div>
      )}

      {status !== 'completed' && (
        <div className="nc-chat-input">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Type your negotiation response..." disabled={loading} />
          <button onClick={send} disabled={loading || !input.trim()} className="nc-send-btn"><Send size={18} /></button>
        </div>
      )}
    </div>
  );
}

function TipsPanel({ tips }) {
  return (
    <div className="nc-tips">
      <h3><Lightbulb size={16} /> Negotiation Tips</h3>
      {tips.map((t, i) => (
        <div key={i} className="nc-tip">
          <span className="nc-tip-icon">{t.icon}</span>
          <div><strong>{t.category}</strong><p>{t.tip}</p></div>
        </div>
      ))}
    </div>
  );
}

export default function OfferNegotiationCoach() {
  const { theme } = useTheme();
  const [scenarios, setScenarios] = useState([]);
  const [tips, setTips] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('idle');
  const [score, setScore] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('practice');
  const [companyName, setCompanyName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [baseOffer, setBaseOffer] = useState('');

  useEffect(() => {
    fetch(api('/negotiation/scenarios')).then(r => r.json()).then(setScenarios).catch(console.error);
    fetch(api('/negotiation/tips')).then(r => r.json()).then(setTips).catch(console.error);
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const r = await fetch(api('/negotiation/history'), { headers: buildAuthHeaders() });
      if (r.ok) setHistory(await r.json());
    } catch (e) { console.error(e); }
  };

  const startScenario = async (scenario) => {
    setLoading(true);
    try {
      const r = await fetch(api('/negotiation/simulate'), {
        method: 'POST', headers: buildAuthHeaders(),
        body: JSON.stringify({
          scenario: scenario.id,
          companyName: companyName || 'Tech Corp',
          roleTitle: roleTitle || 'Software Engineer',
          baseOffer: parseInt(baseOffer) || 120000,
        }),
      });
      const data = await r.json();
      setSessionId(data.sessionId);
      setMessages(data.messages || []);
      setStatus(data.status);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const sendMessage = async (message) => {
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: message, timestamp: new Date().toISOString() }]);
    try {
      const r = await fetch(api('/negotiation/simulate'), {
        method: 'POST', headers: buildAuthHeaders(),
        body: JSON.stringify({ sessionId, message }),
      });
      const data = await r.json();
      setMessages(data.messages || []);
      setStatus(data.status);
      if (data.score !== null && data.score !== undefined) { setScore(data.score); setFeedback(data.feedback); fetchHistory(); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const reset = () => { setSessionId(null); setMessages([]); setStatus('idle'); setScore(null); setFeedback(null); };

  return (
    <div className="nc-container">
      <div className="nc-header">
        <div className="nc-header-left">
          <div className="nc-icon-wrap"><DollarSign size={24} /></div>
          <div><h1 className="nc-title">Offer Negotiation Coach</h1><p className="nc-subtitle">Practice salary negotiations with AI recruiters</p></div>
        </div>
        <div className="nc-header-actions">
          {sessionId && <button className="nc-reset-btn" onClick={reset}><RotateCcw size={16} /> New Session</button>}
        </div>
      </div>

      <div className="nc-tabs">
        <button className={`nc-tab ${tab === 'practice' ? 'active' : ''}`} onClick={() => setTab('practice')}><MessageCircle size={16} /> Practice</button>
        <button className={`nc-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => { setTab('history'); fetchHistory(); }}><History size={16} /> History ({history.length})</button>
        <button className={`nc-tab ${tab === 'tips' ? 'active' : ''}`} onClick={() => setTab('tips')}><Lightbulb size={16} /> Tips</button>
      </div>

      {tab === 'tips' && <TipsPanel tips={tips} />}

      {tab === 'history' && (
        <div className="nc-history">
          {history.length === 0 ? <div className="nc-empty"><History size={48} /><h3>No Sessions Yet</h3><p>Start a negotiation scenario to practice</p></div> : history.map(h => (
            <div key={h.id} className="nc-history-item">
              <div className="nc-hi-left"><span className="nc-hi-scenario">{h.scenario}</span><span className="nc-hi-company">{h.company_name} — {h.role_title}</span></div>
              <div className="nc-hi-right">
                {h.score !== null && <span className="nc-hi-score">{h.score}/100</span>}
                <span className={`nc-hi-status ${h.status}`}>{h.status}</span>
                <span className="nc-hi-date">{new Date(h.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'practice' && (
        <div className="nc-practice">
          {!sessionId ? (
            <>
              <div className="nc-setup">
                <h3>Customize Your Scenario</h3>
                <div className="nc-setup-fields">
                  <input placeholder="Company name (e.g. Google)" value={companyName} onChange={e => setCompanyName(e.target.value)} className="nc-setup-input" />
                  <input placeholder="Role (e.g. Senior SWE)" value={roleTitle} onChange={e => setRoleTitle(e.target.value)} className="nc-setup-input" />
                  <input placeholder="Base offer ($)" type="number" value={baseOffer} onChange={e => setBaseOffer(e.target.value)} className="nc-setup-input" />
                </div>
              </div>
              <ScenarioSelector scenarios={scenarios} onSelect={startScenario} />
            </>
          ) : (
            <div className="nc-active-session">
              <ChatView sessionId={sessionId} messages={messages} onSend={sendMessage} loading={loading} status={status} score={score} feedback={feedback} />
              {tips.length > 0 && (
                <div className="nc-sidebar-tips">
                  <h4><Lightbulb size={14} /> Quick Tips</h4>
                  {tips.slice(0, 4).map((t, i) => <div key={i} className="nc-mini-tip"><span>{t.icon}</span><span>{t.category}: {t.tip.slice(0, 60)}...</span></div>)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
