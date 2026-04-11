import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Coins, Gift, History, Loader2, Sparkles } from 'lucide-react';
import { useCoins } from '../context/CoinContext';
import { Link } from 'react-router-dom';

export default function CoinDisplay() {
  const {
    coins,
    redeemOptions,
    history,
    historyLoading,
    fetchCoinHistory,
    redeemCoins,
  } = useCoins();
  const [animate, setAnimate] = useState(false);
  const [prevCoins, setPrevCoins] = useState(coins);
  const [open, setOpen] = useState(false);
  const [redeemState, setRedeemState] = useState({ loadingId: '', message: '', error: '' });
  const rootRef = useRef(null);

  const recentHistory = useMemo(() => history.slice(0, 6), [history]);

  useEffect(() => {
    if (coins > prevCoins && prevCoins !== 0) {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 800);
    }
    setPrevCoins(coins);
  }, [coins]);

  useEffect(() => {
    if (!open) return undefined;

    fetchCoinHistory({ page: 1, limit: 12 });

    const handleOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open, fetchCoinHistory]);

  const handleRedeem = async (option) => {
    setRedeemState({ loadingId: option.id, message: '', error: '' });
    const result = await redeemCoins({ optionId: option.id, quantity: 1 });

    if (result?.success) {
      setRedeemState({
        loadingId: '',
        message: `${option.title} redeemed for ${option.coinCost} coins.`,
        error: '',
      });
      fetchCoinHistory({ page: 1, limit: 12 });
      return;
    }

    setRedeemState({
      loadingId: '',
      message: '',
      error: result?.error || 'Redeem failed. Try again.',
    });
  };

  const getHistoryLabel = (item) => {
    const displayType = item?.displayType || item?.type;
    if (displayType === 'earn') return 'Earn';
    if (displayType === 'redeem') return 'Redeem';
    return 'Spend';
  };

  const getHistoryAmountPrefix = (item) => {
    const displayType = item?.displayType || item?.type;
    return displayType === 'earn' ? '+' : '-';
  };

  return (
    <div ref={rootRef} className="coin-display-wrap">
      <button
        type="button"
        className={`coin-display ${animate ? 'coin-earned' : ''}`}
        title={`${coins} coins`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Coins size={16} className="coin-icon" />
        <span className="coin-count">{coins}</span>
        {animate && <span className="coin-sparkle">+</span>}
      </button>

      {open && (
        <div className="coin-panel">
          <div className="coin-panel-header">
            <div>
              <h4>Coin Center</h4>
              <p>Earn, redeem, and track usage</p>
            </div>
            <span className="coin-panel-balance">
              <Coins size={14} /> {coins}
            </span>
          </div>

          <div className="coin-section">
            <div className="coin-section-title">
              <Sparkles size={14} /> Earn
            </div>
            <div className="coin-earn-tips">
              <span>Solve coding problems for +5 coin first-solve rewards.</span>
              <span>Visit daily to claim streak bonus coins.</span>
            </div>
            <div className="coin-links">
              <Link to="/problems" onClick={() => setOpen(false)}>Solve Problems</Link>
              <Link to="/wallet" onClick={() => setOpen(false)}>Open Wallet</Link>
            </div>
          </div>

          <div className="coin-section">
            <div className="coin-section-title">
              <Gift size={14} /> Redeem
            </div>
            <div className="coin-redeem-list">
              {redeemOptions.length === 0 && <p className="coin-empty">No redeem options available.</p>}
              {redeemOptions.map((option) => {
                const canRedeem = coins >= option.coinCost;
                const redeeming = redeemState.loadingId === option.id;

                return (
                  <div className="coin-redeem-item" key={option.id}>
                    <div className="coin-redeem-meta">
                      <strong>{option.title}</strong>
                      <span>{option.description}</span>
                    </div>
                    <button
                      type="button"
                      disabled={!canRedeem || redeeming}
                      onClick={() => handleRedeem(option)}
                      className="coin-redeem-btn"
                    >
                      {redeeming ? <Loader2 size={12} className="spin" /> : <Coins size={12} />}
                      {option.coinCost}
                    </button>
                  </div>
                );
              })}
            </div>
            {redeemState.message && <p className="coin-msg ok">{redeemState.message}</p>}
            {redeemState.error && <p className="coin-msg err">{redeemState.error}</p>}
          </div>

          <div className="coin-section">
            <div className="coin-section-title">
              <History size={14} /> Recent History
            </div>
            {historyLoading ? (
              <div className="coin-history-loading">
                <Loader2 size={14} className="spin" /> Loading...
              </div>
            ) : recentHistory.length === 0 ? (
              <p className="coin-empty">No transactions yet.</p>
            ) : (
              <ul className="coin-history-list">
                {recentHistory.map((item) => (
                  <li key={item.id} className="coin-history-item">
                    <div>
                      <strong>{getHistoryLabel(item)}</strong>
                      <span>{item.description || 'Coin transaction'}</span>
                    </div>
                    <div className="coin-history-right">
                      <b>{getHistoryAmountPrefix(item)}{item.amount}</b>
                      <small>{new Date(item.created_at).toLocaleDateString()}</small>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <style>{`
        .coin-display-wrap {
          position: relative;
        }
        .coin-display {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(251, 191, 36, 0.08);
          border: 1px solid rgba(251, 191, 36, 0.15);
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          border: 1px solid rgba(251, 191, 36, 0.15);
        }
        .coin-display:hover {
          background: rgba(251, 191, 36, 0.12);
          border-color: rgba(251, 191, 36, 0.25);
        }
        .coin-icon {
          color: #fbbf24;
          flex-shrink: 0;
        }
        .coin-count {
          font-size: 13px;
          font-weight: 600;
          color: #fbbf24;
          min-width: 16px;
          text-align: center;
        }
        .coin-display.coin-earned {
          animation: coinBounce 0.6s ease;
          border-color: rgba(251, 191, 36, 0.4);
          box-shadow: 0 0 12px rgba(251, 191, 36, 0.2);
        }
        @keyframes coinBounce {
          0% { transform: scale(1); }
          30% { transform: scale(1.15); }
          60% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        .coin-sparkle {
          position: absolute;
          top: -8px;
          right: -4px;
          color: #fbbf24;
          font-size: 14px;
          font-weight: 700;
          animation: coinSparkle 0.8s ease forwards;
          pointer-events: none;
        }
        @keyframes coinSparkle {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-16px) scale(1.3); }
        }
        .coin-panel {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 360px;
          max-height: min(72vh, 560px);
          overflow: auto;
          border-radius: 16px;
          border: 1px solid rgba(251, 191, 36, 0.18);
          background: var(--bg-secondary, #121218);
          box-shadow: 0 18px 42px rgba(0, 0, 0, 0.35);
          padding: 14px;
          z-index: 1300;
        }
        .coin-panel-header {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          margin-bottom: 12px;
        }
        .coin-panel-header h4 {
          margin: 0;
          font-size: 14px;
          color: var(--text-primary, #fff);
        }
        .coin-panel-header p {
          margin: 2px 0 0;
          color: var(--text-secondary, #9ca3af);
          font-size: 12px;
        }
        .coin-panel-balance {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #fbbf24;
          font-weight: 700;
          font-size: 12px;
          background: rgba(251, 191, 36, 0.12);
          padding: 6px 10px;
          border-radius: 999px;
        }
        .coin-section {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 12px;
          margin-top: 12px;
        }
        .coin-section-title {
          display: flex;
          gap: 6px;
          align-items: center;
          color: var(--text-primary, #fff);
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .coin-earn-tips {
          display: grid;
          gap: 4px;
          font-size: 12px;
          color: var(--text-secondary, #9ca3af);
        }
        .coin-links {
          display: flex;
          gap: 10px;
          margin-top: 8px;
        }
        .coin-links a {
          color: #fbbf24;
          font-size: 12px;
          text-decoration: none;
          font-weight: 600;
        }
        .coin-links a:hover {
          text-decoration: underline;
        }
        .coin-redeem-list {
          display: grid;
          gap: 8px;
        }
        .coin-redeem-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.02);
        }
        .coin-redeem-meta {
          display: grid;
          gap: 2px;
          min-width: 0;
        }
        .coin-redeem-meta strong {
          color: var(--text-primary, #fff);
          font-size: 12px;
        }
        .coin-redeem-meta span {
          color: var(--text-secondary, #9ca3af);
          font-size: 11px;
          line-height: 1.3;
        }
        .coin-redeem-btn {
          border: 1px solid rgba(251, 191, 36, 0.35);
          background: rgba(251, 191, 36, 0.12);
          color: #fbbf24;
          border-radius: 10px;
          padding: 6px 10px;
          font-size: 11px;
          font-weight: 700;
          display: inline-flex;
          gap: 4px;
          align-items: center;
          cursor: pointer;
          min-width: 62px;
          justify-content: center;
        }
        .coin-redeem-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .coin-msg {
          margin: 8px 0 0;
          font-size: 11px;
        }
        .coin-msg.ok {
          color: #10b981;
        }
        .coin-msg.err {
          color: #ef4444;
        }
        .coin-empty {
          margin: 0;
          font-size: 12px;
          color: var(--text-secondary, #9ca3af);
        }
        .coin-history-loading {
          display: inline-flex;
          gap: 6px;
          align-items: center;
          color: var(--text-secondary, #9ca3af);
          font-size: 12px;
        }
        .coin-history-list {
          margin: 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 8px;
        }
        .coin-history-item {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 8px;
        }
        .coin-history-item strong {
          display: block;
          font-size: 12px;
          color: var(--text-primary, #fff);
        }
        .coin-history-item span {
          display: block;
          max-width: 210px;
          font-size: 11px;
          color: var(--text-secondary, #9ca3af);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .coin-history-right {
          text-align: right;
          display: grid;
          gap: 2px;
        }
        .coin-history-right b {
          font-size: 12px;
          color: #fbbf24;
        }
        .coin-history-right small {
          font-size: 10px;
          color: var(--text-secondary, #9ca3af);
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 900px) {
          .coin-panel {
            right: -36px;
            width: min(92vw, 360px);
          }
        }
      `}</style>
    </div>
  );
}
