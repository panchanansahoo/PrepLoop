import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Coins,
  Filter,
  Gift,
  History,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Clock3,
  Crown,
} from 'lucide-react';
import { useCoins } from '../context/CoinContext';
import { buildAuthHeaders } from '../utils/authHeaders';
import { authFetch } from '../utils/authFetch';

const API_URL = import.meta.env.VITE_API_URL || '';
const FILTERS = [
  { key: 'all', label: 'All activity' },
  { key: 'earn', label: 'Earned' },
  { key: 'spend', label: 'Spent' },
  { key: 'redeem', label: 'Redeemed' },
];

const formatDateTime = (value) => {
  if (!value) return 'Just now';
  const date = new Date(value);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const normalizeType = (item) => item?.displayType || item?.type || 'spend';

export default function CoinWallet() {
  const { coins, redeemOptions, redeemCoins, refreshBalance, fetchRedeemOptions } = useCoins();
  const [ledger, setLedger] = useState([]);
  const [summary, setSummary] = useState({ totalEarned: 0, totalSpent: 0, totalRedeemed: 0 });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('spend');
  const [search, setSearch] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [redeemBusyId, setRedeemBusyId] = useState('');
  const [redeemFeedback, setRedeemFeedback] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchRedeemOptions();
  }, [fetchRedeemOptions]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchDraft.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchDraft]);

  useEffect(() => {
    let cancelled = false;

    const loadLedger = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          detailed: '1',
          page: String(page),
          limit: '12',
        });

        if (filter !== 'all') params.set('type', filter);
        if (search) params.set('q', search);

        const res = await authFetch(`${API_URL}/api/coins/history?${params.toString()}`);

        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setLedger([]);
          setHasMore(false);
          setSummary({ totalEarned: 0, totalSpent: 0, totalRedeemed: 0 });
          return;
        }

        const items = Array.isArray(data) ? data : data.items || [];
        setLedger(page === 1 ? items : (prev) => prev.concat(items));
        setSummary(data?.summary || { totalEarned: 0, totalSpent: 0, totalRedeemed: 0 });
        setHasMore(Boolean(data?.hasMore));
      } catch (error) {
        if (!cancelled) {
          setLedger([]);
          setHasMore(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadLedger();
    return () => {
      cancelled = true;
    };
  }, [filter, page, search]);

  const totals = useMemo(() => ([
    { label: 'Balance', value: coins, icon: Coins, tone: 'balance' },
    { label: 'Earned', value: summary.totalEarned, icon: TrendingUp, tone: 'earn' },
    { label: 'Spent', value: summary.totalSpent, icon: Clock3, tone: 'spend' },
    { label: 'Redeemed', value: summary.totalRedeemed, icon: Gift, tone: 'redeem' },
  ]), [coins, summary]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshBalance(),
      ]);
      setPage(1);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRedeem = async (option) => {
    setRedeemBusyId(option.id);
    setRedeemFeedback({ type: '', text: '' });

    const result = await redeemCoins({ optionId: option.id, quantity: 1 });
    if (result?.success) {
      setRedeemFeedback({ type: 'success', text: `${option.title} redeemed successfully.` });
      await Promise.all([refreshBalance()]);
      setPage(1);
    } else {
      setRedeemFeedback({ type: 'error', text: result?.error || 'Redeem failed. Try again.' });
    }

    setRedeemBusyId('');
  };

  return (
    <div className="coin-wallet">
      <div className="coin-wallet-bg" />
      <div className="coin-wallet-grid" />

      <div className="coin-wallet-shell">
        <div className="coin-wallet-header">
          <div className="coin-wallet-titleblock">
            <Link to="/dashboard" className="coin-wallet-back">
              <ArrowLeft size={14} /> Back to dashboard
            </Link>
            <div className="coin-wallet-kicker">
              <Sparkles size={14} /> Coin Wallet
            </div>
            <h1>Spend history from the live ledger.</h1>
            <p>
              Real transaction data pulled from the database. No mock history, no client-side approximation.
            </p>
          </div>

          <div className="coin-wallet-hero-card">
            <div className="coin-wallet-hero-balance">
              <Coins size={18} />
              <span>{coins}</span>
            </div>
            <div className="coin-wallet-hero-sub">Current balance</div>
            <div className="coin-wallet-hero-actions">
              <button className="coin-wallet-ghost-btn" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />}
                Refresh
              </button>
              <Link className="coin-wallet-primary-btn" to="/problems">
                Earn coins
              </Link>
            </div>
          </div>
        </div>

        <section className="coin-wallet-stats">
          {totals.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className={`coin-wallet-stat ${item.tone}`}>
                <div className="coin-wallet-stat-icon"><Icon size={15} /></div>
                <div className="coin-wallet-stat-label">{item.label}</div>
                <div className="coin-wallet-stat-value">{item.value.toLocaleString()}</div>
              </div>
            );
          })}
        </section>

        <section className="coin-wallet-main">
          <div className="coin-wallet-panel coin-wallet-ledger-panel">
            <div className="coin-wallet-panel-head">
              <div>
                <h2>{filter === 'spend' ? 'Spend history' : 'Ledger'}</h2>
                <p>{filter === 'spend' ? 'Real spend rows loaded from coin_transactions.' : 'Filter by transaction type and search descriptions.'}</p>
              </div>
              <div className="coin-wallet-controls">
                <div className="coin-wallet-search">
                  <Search size={14} />
                  <input
                    value={searchDraft}
                    onChange={(e) => setSearchDraft(e.target.value)}
                    placeholder="Search history"
                  />
                </div>
                <div className="coin-wallet-filter">
                  <Filter size={14} />
                  <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
                    {FILTERS.map((item) => (
                      <option key={item.key} value={item.key}>{item.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="coin-wallet-ledger-list">
              {loading && ledger.length === 0 ? (
                <div className="coin-wallet-empty">
                  <Loader2 size={18} className="spin" /> Loading history...
                </div>
              ) : ledger.length === 0 ? (
                <div className="coin-wallet-empty">
                  <History size={18} /> No transactions match the current filters.
                </div>
              ) : (
                ledger.map((item) => {
                  const type = normalizeType(item);
                  const isEarn = type === 'earn';
                  const isRedeem = type === 'redeem';
                  const amountPrefix = isEarn ? '+' : '-';
                  const tone = isEarn ? 'earn' : isRedeem ? 'redeem' : 'spend';

                  return (
                    <div key={item.id} className={`coin-wallet-entry ${tone}`}>
                      <div className="coin-wallet-entry-icon">
                        {isEarn ? <TrendingUp size={15} /> : isRedeem ? <Gift size={15} /> : <Clock3 size={15} />}
                      </div>
                      <div className="coin-wallet-entry-body">
                        <strong>{item.description || 'Coin transaction'}</strong>
                        <span>{formatDateTime(item.created_at)}</span>
                      </div>
                      <div className="coin-wallet-entry-meta">
                        <div className="coin-wallet-entry-amount">{amountPrefix}{item.amount}</div>
                        <div className="coin-wallet-entry-type">{isEarn ? 'Earn' : isRedeem ? 'Redeem' : 'Spend'}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {hasMore && (
              <button className="coin-wallet-loadmore" onClick={() => setPage((prev) => prev + 1)} disabled={loading}>
                {loading ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />} Load more
              </button>
            )}
          </div>

          <aside className="coin-wallet-sidebar">
            <div className="coin-wallet-panel">
              <div className="coin-wallet-panel-head compact">
                <div>
                  <h2>Redeem</h2>
                  <p>Spend coins on in-app perks.</p>
                </div>
                <Gift size={18} />
              </div>

              <div className="coin-wallet-redeem-list">
                {redeemOptions.map((option) => {
                  const canRedeem = coins >= option.coinCost;
                  const busy = redeemBusyId === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      className="coin-wallet-redeem-card"
                      disabled={!canRedeem || busy}
                      onClick={() => handleRedeem(option)}
                    >
                      <div className="coin-wallet-redeem-top">
                        <strong>{option.title}</strong>
                        <span>{option.coinCost} coins</span>
                      </div>
                      <p>{option.description}</p>
                      <div className="coin-wallet-redeem-foot">
                        {busy ? <Loader2 size={13} className="spin" /> : <Crown size={13} />}
                        {canRedeem ? 'Redeem now' : 'Need more coins'}
                      </div>
                    </button>
                  );
                })}
              </div>

              {redeemFeedback.text && (
                <div className={`coin-wallet-feedback ${redeemFeedback.type}`}>
                  <CheckCircle2 size={14} />
                  <span>{redeemFeedback.text}</span>
                </div>
              )}
            </div>

            <div className="coin-wallet-panel coin-wallet-tips-panel">
              <div className="coin-wallet-panel-head compact">
                <div>
                  <h2>Earn faster</h2>
                  <p>High-signal actions that increase your balance.</p>
                </div>
              </div>

              <div className="coin-wallet-tips">
                <div>
                  <strong>Problem solves</strong>
                  <span>First-time problem completions are the strongest earn source.</span>
                </div>
                <div>
                  <strong>Streak bonuses</strong>
                  <span>Daily activity compounds into bonus coins automatically.</span>
                </div>
                <div>
                  <strong>AI flows</strong>
                  <span>Use coins to unlock interview sessions when needed.</span>
                </div>
              </div>

              <Link to="/problems" className="coin-wallet-secondary-link">
                Browse problems
              </Link>
            </div>
          </aside>
        </section>
      </div>

      <style>{`
        .coin-wallet {
          position: relative;
          min-height: 100vh;
          padding: 28px 20px 48px;
          overflow: hidden;
          color: var(--text-primary, #fff);
        }
        .coin-wallet-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 12% 8%, rgba(251, 191, 36, 0.22), transparent 28%),
            radial-gradient(circle at 88% 18%, rgba(217, 119, 6, 0.16), transparent 24%),
            linear-gradient(180deg, rgba(15, 18, 28, 0.92), rgba(9, 10, 16, 1));
          pointer-events: none;
        }
        .coin-wallet-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 72px 72px;
          mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
          pointer-events: none;
        }
        .coin-wallet-shell {
          position: relative;
          max-width: 1200px;
          margin: 0 auto;
        }
        .coin-wallet-header {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.8fr);
          gap: 20px;
          align-items: stretch;
          margin-bottom: 18px;
        }
        .coin-wallet-titleblock,
        .coin-wallet-hero-card,
        .coin-wallet-panel,
        .coin-wallet-stat {
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(8, 10, 16, 0.72);
          backdrop-filter: blur(14px);
          box-shadow: 0 20px 44px rgba(0, 0, 0, 0.28);
        }
        .coin-wallet-titleblock {
          border-radius: 28px;
          padding: 28px;
          position: relative;
          overflow: hidden;
        }
        .coin-wallet-titleblock::after {
          content: '';
          position: absolute;
          inset: auto -24px -36px auto;
          width: 180px;
          height: 180px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(251, 191, 36, 0.32), transparent 65%);
          pointer-events: none;
        }
        .coin-wallet-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary, #9ca3af);
          text-decoration: none;
          font-size: 13px;
          margin-bottom: 18px;
        }
        .coin-wallet-back:hover {
          color: #fbbf24;
        }
        .coin-wallet-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #fbbf24;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .coin-wallet-titleblock h1 {
          margin: 0;
          font-size: clamp(2rem, 3.2vw, 4.2rem);
          line-height: 0.96;
          letter-spacing: -0.05em;
          max-width: 11ch;
        }
        .coin-wallet-titleblock p {
          margin: 18px 0 0;
          max-width: 60ch;
          color: var(--text-secondary, #a1a1aa);
          font-size: 15px;
          line-height: 1.7;
        }
        .coin-wallet-hero-card {
          border-radius: 28px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 18px;
        }
        .coin-wallet-hero-balance {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 2.8rem;
          font-weight: 800;
          color: #fbbf24;
          letter-spacing: -0.05em;
        }
        .coin-wallet-hero-sub {
          color: var(--text-secondary, #9ca3af);
          font-size: 13px;
        }
        .coin-wallet-hero-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .coin-wallet-primary-btn,
        .coin-wallet-ghost-btn,
        .coin-wallet-secondary-link,
        .coin-wallet-loadmore {
          border-radius: 14px;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }
        .coin-wallet-primary-btn,
        .coin-wallet-loadmore {
          color: #111827;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          border: none;
          cursor: pointer;
        }
        .coin-wallet-ghost-btn,
        .coin-wallet-secondary-link {
          color: #fbbf24;
          background: rgba(251, 191, 36, 0.08);
          border: 1px solid rgba(251, 191, 36, 0.24);
        }
        .coin-wallet-primary-btn:hover,
        .coin-wallet-ghost-btn:hover,
        .coin-wallet-secondary-link:hover,
        .coin-wallet-loadmore:hover {
          transform: translateY(-1px);
        }
        .coin-wallet-ghost-btn:disabled,
        .coin-wallet-loadmore:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .coin-wallet-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 18px;
        }
        .coin-wallet-stat {
          border-radius: 20px;
          padding: 18px;
        }
        .coin-wallet-stat-icon {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          margin-bottom: 12px;
        }
        .coin-wallet-stat.balance .coin-wallet-stat-icon {
          background: rgba(251, 191, 36, 0.12);
          color: #fbbf24;
        }
        .coin-wallet-stat.earn .coin-wallet-stat-icon {
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
        }
        .coin-wallet-stat.spend .coin-wallet-stat-icon {
          background: rgba(148, 163, 184, 0.12);
          color: #cbd5e1;
        }
        .coin-wallet-stat.redeem .coin-wallet-stat-icon {
          background: rgba(59, 130, 246, 0.12);
          color: #60a5fa;
        }
        .coin-wallet-stat-label {
          font-size: 12px;
          color: var(--text-secondary, #9ca3af);
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }
        .coin-wallet-stat-value {
          margin-top: 6px;
          font-size: 1.8rem;
          font-weight: 800;
          letter-spacing: -0.04em;
        }
        .coin-wallet-main {
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) minmax(300px, 0.75fr);
          gap: 18px;
          align-items: start;
        }
        .coin-wallet-panel {
          border-radius: 24px;
          padding: 18px;
        }
        .coin-wallet-panel-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 14px;
        }
        .coin-wallet-panel-head.compact {
          margin-bottom: 16px;
        }
        .coin-wallet-panel-head h2 {
          margin: 0;
          font-size: 1.1rem;
          letter-spacing: -0.03em;
        }
        .coin-wallet-panel-head p {
          margin: 4px 0 0;
          color: var(--text-secondary, #9ca3af);
          font-size: 13px;
          line-height: 1.5;
        }
        .coin-wallet-controls {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 10px;
        }
        .coin-wallet-search,
        .coin-wallet-filter {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
          padding: 0 10px;
          min-height: 40px;
        }
        .coin-wallet-search input,
        .coin-wallet-filter select {
          background: transparent;
          border: none;
          color: inherit;
          outline: none;
          font: inherit;
          min-width: 0;
        }
        .coin-wallet-search input {
          width: 180px;
        }
        .coin-wallet-filter select {
          cursor: pointer;
        }
        .coin-wallet-ledger-list {
          display: grid;
          gap: 10px;
        }
        .coin-wallet-entry {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
          padding: 14px;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
        }
        .coin-wallet-entry-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: grid;
          place-items: center;
        }
        .coin-wallet-entry.earn .coin-wallet-entry-icon {
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
        }
        .coin-wallet-entry.spend .coin-wallet-entry-icon {
          background: rgba(148, 163, 184, 0.12);
          color: #cbd5e1;
        }
        .coin-wallet-entry.redeem .coin-wallet-entry-icon {
          background: rgba(59, 130, 246, 0.12);
          color: #60a5fa;
        }
        .coin-wallet-entry-body strong {
          display: block;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .coin-wallet-entry-body span {
          color: var(--text-secondary, #9ca3af);
          font-size: 12px;
        }
        .coin-wallet-entry-meta {
          text-align: right;
        }
        .coin-wallet-entry-amount {
          font-size: 16px;
          font-weight: 800;
          color: #fbbf24;
          letter-spacing: -0.03em;
        }
        .coin-wallet-entry-type {
          color: var(--text-secondary, #9ca3af);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-top: 2px;
        }
        .coin-wallet-empty {
          min-height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: var(--text-secondary, #9ca3af);
          border: 1px dashed rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.02);
          text-align: center;
          padding: 24px;
        }
        .coin-wallet-loadmore {
          margin-top: 14px;
          width: 100%;
        }
        .coin-wallet-sidebar {
          display: grid;
          gap: 18px;
        }
        .coin-wallet-redeem-list {
          display: grid;
          gap: 10px;
        }
        .coin-wallet-redeem-card {
          text-align: left;
          width: 100%;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
          padding: 14px;
          cursor: pointer;
          color: inherit;
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }
        .coin-wallet-redeem-card:hover:not(:disabled) {
          transform: translateY(-1px);
          border-color: rgba(251, 191, 36, 0.22);
          background: rgba(251, 191, 36, 0.05);
        }
        .coin-wallet-redeem-card:disabled {
          cursor: not-allowed;
          opacity: 0.62;
        }
        .coin-wallet-redeem-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 8px;
        }
        .coin-wallet-redeem-top strong {
          font-size: 14px;
        }
        .coin-wallet-redeem-top span {
          color: #fbbf24;
          font-weight: 800;
          font-size: 12px;
          white-space: nowrap;
        }
        .coin-wallet-redeem-card p {
          margin: 0;
          color: var(--text-secondary, #9ca3af);
          font-size: 12px;
          line-height: 1.6;
        }
        .coin-wallet-redeem-foot {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
          font-size: 12px;
          color: #fbbf24;
          font-weight: 700;
        }
        .coin-wallet-feedback {
          margin-top: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          padding: 10px 12px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .coin-wallet-feedback.success {
          color: #10b981;
          background: rgba(16, 185, 129, 0.08);
        }
        .coin-wallet-feedback.error {
          color: #f87171;
          background: rgba(248, 113, 113, 0.08);
        }
        .coin-wallet-tips {
          display: grid;
          gap: 10px;
        }
        .coin-wallet-tips > div {
          padding: 12px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .coin-wallet-tips strong {
          display: block;
          margin-bottom: 4px;
          font-size: 13px;
        }
        .coin-wallet-tips span {
          color: var(--text-secondary, #9ca3af);
          font-size: 12px;
          line-height: 1.6;
        }
        .coin-wallet-secondary-link {
          margin-top: 12px;
          width: 100%;
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 1024px) {
          .coin-wallet-header,
          .coin-wallet-main,
          .coin-wallet-stats {
            grid-template-columns: 1fr 1fr;
          }
          .coin-wallet-main {
            grid-template-columns: 1fr;
          }
          .coin-wallet-sidebar {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 760px) {
          .coin-wallet {
            padding: 18px 14px 36px;
          }
          .coin-wallet-header,
          .coin-wallet-stats,
          .coin-wallet-sidebar {
            grid-template-columns: 1fr;
          }
          .coin-wallet-titleblock,
          .coin-wallet-hero-card,
          .coin-wallet-panel,
          .coin-wallet-stat {
            border-radius: 22px;
          }
          .coin-wallet-search input {
            width: 140px;
          }
          .coin-wallet-entry {
            grid-template-columns: auto minmax(0, 1fr);
          }
          .coin-wallet-entry-meta {
            grid-column: 2;
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
}
