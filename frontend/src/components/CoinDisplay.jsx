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
          padding: 6px 14px;
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%);
          border: 1px solid rgba(251, 191, 36, 0.3);
          border-radius: 99px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }
        .coin-display:hover {
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.25) 0%, rgba(245, 158, 11, 0.1) 100%);
          border-color: rgba(251, 191, 36, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(251, 191, 36, 0.25);
        }
        .coin-icon {
          color: #fbbf24;
          flex-shrink: 0;
          filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.6));
        }
        .coin-count {
          font-size: 13px;
          font-weight: 700;
          color: #fbbf24;
          min-width: 16px;
          text-align: center;
          text-shadow: 0 0 10px rgba(251, 191, 36, 0.4);
        }
        .coin-display.coin-earned {
          animation: coinBounce 0.6s ease;
          border-color: rgba(251, 191, 36, 0.6);
          box-shadow: 0 0 15px rgba(251, 191, 36, 0.4);
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
          font-size: 16px;
          font-weight: 800;
          animation: coinSparkle 0.8s ease forwards;
          pointer-events: none;
          text-shadow: 0 0 8px #fbbf24;
        }
        @keyframes coinSparkle {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-16px) scale(1.4); }
        }
        .coin-panel {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: 380px;
          max-height: min(72vh, 560px);
          overflow: auto;
          border-radius: 20px;
          border: 1px solid rgba(251, 191, 36, 0.25);
          background: rgba(18, 18, 24, 0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
          padding: 16px;
          z-index: 1300;
          animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
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
          font-size: 15px;
          font-weight: 700;
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
          font-weight: 800;
          font-size: 14px;
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.05) 100%);
          border: 1px solid rgba(251, 191, 36, 0.3);
          box-shadow: inset 0 0 8px rgba(251, 191, 36, 0.2);
          padding: 8px 12px;
          border-radius: 999px;
        }
        .coin-section {
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 16px;
          margin-top: 16px;
        }
        .coin-section-title {
          display: flex;
          gap: 6px;
          align-items: center;
          color: #fbbf24;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 10px;
          letter-spacing: 0.03em;
        }
        .coin-earn-tips {
          display: grid;
          gap: 6px;
          font-size: 12px;
          color: var(--text-secondary, #9ca3af);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 10px;
          border-radius: 12px;
        }
        .coin-links {
          display: flex;
          gap: 12px;
          margin-top: 10px;
        }
        .coin-links a {
          color: #fbbf24;
          font-size: 12px;
          text-decoration: none;
          font-weight: 600;
          background: rgba(251, 191, 36, 0.1);
          padding: 4px 10px;
          border-radius: 6px;
          transition: all 0.2s;
        }
        .coin-links a:hover {
          background: rgba(251, 191, 36, 0.2);
          transform: translateY(-1px);
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
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 14px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.015);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .coin-redeem-item:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(251, 191, 36, 0.3);
          transform: translateX(2px);
        }
        .coin-redeem-meta {
          display: grid;
          gap: 3px;
          min-width: 0;
        }
        .coin-redeem-meta strong {
          color: var(--text-primary, #fff);
          font-size: 13px;
          font-weight: 600;
        }
        .coin-redeem-meta span {
          color: var(--text-secondary, #9ca3af);
          font-size: 11px;
          line-height: 1.4;
        }
        .coin-redeem-btn {
          border: none;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
          color: white;
          border-radius: 12px;
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 700;
          display: inline-flex;
          gap: 6px;
          align-items: center;
          cursor: pointer;
          min-width: 68px;
          justify-content: center;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .coin-redeem-btn:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
        }
        .coin-redeem-btn:disabled {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.4);
          box-shadow: none;
          cursor: not-allowed;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .coin-msg {
          margin: 10px 0 0;
          font-size: 12px;
          padding: 8px;
          border-radius: 8px;
          text-align: center;
        }
        .coin-msg.ok {
          color: #10b981;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .coin-msg.err {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .coin-empty {
          margin: 0;
          font-size: 12px;
          color: var(--text-secondary, #9ca3af);
          text-align: center;
          padding: 10px;
        }
        .coin-history-loading {
          display: flex;
          justify-content: center;
          gap: 6px;
          align-items: center;
          color: var(--text-secondary, #9ca3af);
          font-size: 12px;
          padding: 16px;
        }
        .coin-history-list {
          margin: 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 6px;
        }
        .coin-history-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          border: 1px solid transparent;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          padding: 10px 6px;
          transition: background 0.2s ease;
        }
        .coin-history-item:last-child {
          border-bottom: none;
        }
        .coin-history-item:hover {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
        }
        .coin-history-item strong {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary, #fff);
          margin-bottom: 2px;
        }
        .coin-history-item span {
          display: block;
          max-width: 200px;
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
          font-size: 13px;
          font-weight: 700;
          color: #fbbf24;
          text-shadow: 0 0 8px rgba(251, 191, 36, 0.2);
        }
        .coin-history-right small {
          font-size: 10px;
          color: var(--text-secondary, #6b7280);
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
