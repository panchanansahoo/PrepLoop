import React, { useState, useEffect } from 'react';
import { Users, Calendar, Clock, Star, MessageCircle, ChevronRight, Plus, Search, Filter, Send, Award } from 'lucide-react';
import { buildAuthHeaders } from '../utils/authHeaders';
import { buildApiUrl } from '../utils/safeApiUrl';
import { useTheme } from '../context/ThemeContext';

const API_URL = import.meta.env.VITE_API_URL || '';
const api = (path) => buildApiUrl(path, { rawBaseUrl: API_URL, apiPrefix: '/api' });

const TOPICS = ['DSA', 'System Design', 'Behavioral', 'HR', 'SQL', 'Frontend', 'Backend'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

function CreateSlotModal({ onClose, onCreate }) {
  const [topic, setTopic] = useState('DSA');
  const [difficulty, setDifficulty] = useState('medium');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(45);

  const handleCreate = () => {
    if (!date || !time) return;
    const scheduledAt = new Date(`${date}T${time}`).toISOString();
    onCreate({ topic, difficulty, scheduledAt, durationMinutes: duration });
  };

  return (
    <div className="pm-modal-overlay" onClick={onClose}>
      <div className="pm-modal" onClick={e => e.stopPropagation()}>
        <h2>Schedule a Mock Interview</h2>
        <p className="pm-modal-sub">Create a slot and wait for a partner to join</p>
        <div className="pm-form">
          <label>Topic</label>
          <select value={topic} onChange={e => setTopic(e.target.value)} className="pm-select">{TOPICS.map(t => <option key={t} value={t}>{t}</option>)}</select>
          <label>Difficulty</label>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="pm-select">{DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}</select>
          <label>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="pm-input" min={new Date().toISOString().split('T')[0]} />
          <label>Time</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} className="pm-input" />
          <label>Duration (minutes)</label>
          <select value={duration} onChange={e => setDuration(Number(e.target.value))} className="pm-select">
            <option value={30}>30 min</option><option value={45}>45 min</option><option value={60}>60 min</option>
          </select>
        </div>
        <div className="pm-modal-actions">
          <button className="pm-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="pm-btn-primary" onClick={handleCreate} disabled={!date || !time}><Plus size={16} /> Create Slot</button>
        </div>
      </div>
    </div>
  );
}

function FeedbackModal({ slot, onClose, onSubmit }) {
  const [scores, setScores] = useState({ communication: 70, technical: 70, problemSolving: 70, overall: 70 });
  const [comments, setComments] = useState('');
  const toUserId = slot.isOwn ? slot.matched_user_id : slot.user_id;
  const role = slot.isOwn ? 'interviewer' : 'interviewee';

  return (
    <div className="pm-modal-overlay" onClick={onClose}>
      <div className="pm-modal" onClick={e => e.stopPropagation()}>
        <h2>Rate Your Partner</h2>
        <p className="pm-modal-sub">Provide feedback for your {role === 'interviewer' ? 'interviewee' : 'interviewer'}</p>
        <div className="pm-form">
          {['communication', 'technical', 'problemSolving', 'overall'].map(key => (
            <div key={key} className="pm-score-row">
              <label>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</label>
              <input type="range" min="0" max="100" value={scores[key]} onChange={e => setScores(p => ({ ...p, [key]: Number(e.target.value) }))} />
              <span className="pm-score-val">{scores[key]}</span>
            </div>
          ))}
          <label>Comments</label>
          <textarea value={comments} onChange={e => setComments(e.target.value)} className="pm-textarea" placeholder="What went well? Areas for improvement?" />
        </div>
        <div className="pm-modal-actions">
          <button className="pm-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="pm-btn-primary" onClick={() => onSubmit({ slotId: slot.id, toUserId, role, communicationScore: scores.communication, technicalScore: scores.technical, problemSolvingScore: scores.problemSolving, overallScore: scores.overall, comments })}><Send size={16} /> Submit</button>
        </div>
      </div>
    </div>
  );
}

export default function PeerMockInterview() {
  const { theme } = useTheme();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showFeedback, setShowFeedback] = useState(null);
  const [filterTopic, setFilterTopic] = useState('');
  const [feedback, setFeedback] = useState([]);
  const [tab, setTab] = useState('browse');

  useEffect(() => { fetchSlots(); fetchFeedback(); }, []);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const r = await fetch(api('/peer-interview/slots'), { headers: buildAuthHeaders() });
      if (r.ok) setSlots(await r.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchFeedback = async () => {
    try {
      const r = await fetch(api('/peer-interview/my-feedback'), { headers: buildAuthHeaders() });
      if (r.ok) setFeedback(await r.json());
    } catch (e) { console.error(e); }
  };

  const createSlot = async (data) => {
    try {
      const r = await fetch(api('/peer-interview/slots'), { method: 'POST', headers: buildAuthHeaders(), body: JSON.stringify(data) });
      if (r.ok) { setShowCreate(false); fetchSlots(); }
    } catch (e) { console.error(e); }
  };

  const matchSlot = async (slotId) => {
    try {
      const r = await fetch(api('/peer-interview/match'), { method: 'POST', headers: buildAuthHeaders(), body: JSON.stringify({ slotId }) });
      if (r.ok) fetchSlots();
    } catch (e) { console.error(e); }
  };

  const submitFeedback = async (data) => {
    try {
      const r = await fetch(api('/peer-interview/feedback'), { method: 'POST', headers: buildAuthHeaders(), body: JSON.stringify(data) });
      if (r.ok) { setShowFeedback(null); fetchSlots(); fetchFeedback(); }
    } catch (e) { console.error(e); }
  };

  const filtered = filterTopic ? slots.filter(s => s.topic === filterTopic) : slots;

  return (
    <div className="pm-container">
      <div className="pm-header">
        <div className="pm-header-left">
          <div className="pm-icon-wrap"><Users size={24} /></div>
          <div><h1 className="pm-title">Peer Mock Interviews</h1><p className="pm-subtitle">Practice with real partners — interview & get interviewed</p></div>
        </div>
        <button className="pm-create-btn" onClick={() => setShowCreate(true)}><Plus size={18} /> Schedule Interview</button>
      </div>

      <div className="pm-tabs">
        {['browse', 'my-slots', 'feedback'].map(t => (
          <button key={t} className={`pm-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'browse' ? <><Search size={16} /> Browse</> : t === 'my-slots' ? <><Calendar size={16} /> My Slots</> : <><Award size={16} /> Feedback</>}
          </button>
        ))}
      </div>

      {tab !== 'feedback' && (
        <div className="pm-filters">
          <select value={filterTopic} onChange={e => setFilterTopic(e.target.value)} className="pm-filter-select">
            <option value="">All Topics</option>
            {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      )}

      {tab === 'feedback' ? (
        <div className="pm-feedback-list">
          {feedback.length === 0 ? <div className="pm-empty"><Award size={48} /><h3>No Feedback Yet</h3><p>Complete interviews to receive peer feedback</p></div> : feedback.map(f => (
            <div key={f.id} className="pm-feedback-card">
              <div className="pm-fb-scores">
                <span>Communication: {f.communication_score}</span>
                <span>Technical: {f.technical_score}</span>
                <span>Problem Solving: {f.problem_solving_score}</span>
                <span className="pm-fb-overall">Overall: {f.overall_score}</span>
              </div>
              {f.comments && <p className="pm-fb-comments">{f.comments}</p>}
              <span className="pm-fb-date">{new Date(f.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="pm-slots-grid">
          {loading ? <div className="pm-loading"><div className="cr-spinner" /></div> :
          (tab === 'my-slots' ? filtered.filter(s => s.isOwn) : filtered.filter(s => !s.isOwn || s.status !== 'open')).length === 0 ? (
            <div className="pm-empty"><Calendar size={48} /><h3>{tab === 'my-slots' ? 'No Slots Created' : 'No Available Slots'}</h3><p>{tab === 'my-slots' ? 'Create your first interview slot' : 'Check back later or create one yourself'}</p></div>
          ) : (tab === 'my-slots' ? filtered.filter(s => s.isOwn) : filtered).map(slot => (
            <div key={slot.id} className={`pm-slot-card pm-status-${slot.status}`}>
              <div className="pm-slot-header">
                <span className="pm-slot-topic">{slot.topic}</span>
                <span className={`pm-slot-diff pm-diff-${slot.difficulty}`}>{slot.difficulty}</span>
              </div>
              <div className="pm-slot-time">
                <Calendar size={14} /> {new Date(slot.scheduled_at).toLocaleDateString()}
                <Clock size={14} /> {new Date(slot.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                <span>{slot.duration_minutes} min</span>
              </div>
              <div className="pm-slot-people">
                {slot.creator && <span>👤 {slot.creator.name}</span>}
                {slot.partner && <span>🤝 {slot.partner.name}</span>}
              </div>
              <div className="pm-slot-status">
                <span className={`pm-status-badge ${slot.status}`}>{slot.status}</span>
              </div>
              <div className="pm-slot-actions">
                {slot.status === 'open' && !slot.isOwn && <button className="pm-btn-primary" onClick={() => matchSlot(slot.id)}>Join Interview</button>}
                {slot.status === 'matched' && <button className="pm-btn-secondary" onClick={() => setShowFeedback(slot)}>Give Feedback</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateSlotModal onClose={() => setShowCreate(false)} onCreate={createSlot} />}
      {showFeedback && <FeedbackModal slot={showFeedback} onClose={() => setShowFeedback(null)} onSubmit={submitFeedback} />}
    </div>
  );
}
