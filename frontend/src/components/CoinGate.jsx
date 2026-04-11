import React, { useState } from 'react';
import { Coins, Lock, ArrowRight } from 'lucide-react';
import { useCoins } from '../context/CoinContext';
import { Link } from 'react-router-dom';

/**
 * CoinGate — wraps AI actions to require coin balance.
 * Usage: <CoinGate cost={5} onProceed={handleAIQuery}>Ask AI</CoinGate>
 */
export default function CoinGate({ cost = 5, onProceed, children, description = 'AI Assistant Query' }) {
  const { coins, spendCoins } = useCoins();
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleClick = async () => {
    if (coins < cost) {
      setShowModal(true);
      return;
    }

    setProcessing(true);
    const result = await spendCoins(cost, description);
    setProcessing(false);

    if (result?.success) {
      onProceed?.();
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={processing}
        className="coin-gate-trigger"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        {children}
        <span className="coin-gate-cost">
          <Coins size={12} /> {cost}
        </span>
      </button>

      {showModal && (
        <div className="coin-gate-overlay" onClick={() => setShowModal(false)}>
          <div className="coin-gate-modal" onClick={e => e.stopPropagation()}>
            <div className="coin-gate-modal-icon">
              <Lock size={28} />
            </div>
            <h3>Not Enough Coins</h3>
            <p>
              You need <strong>{cost} coins</strong> for this action.
              <br />You currently have <strong>{coins} coins</strong>.
            </p>
            <div className="coin-gate-modal-tip">
              <Coins size={14} />
              <span>Earn coins by solving problems (+5 each) and daily streaks!</span>
            </div>
            <div className="coin-gate-modal-actions">
              <Link to="/problems" className="btn btn-primary" onClick={() => setShowModal(false)}>
                Solve Problems <ArrowRight size={14} />
              </Link>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .coin-gate-cost {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 10px;
          background: rgba(251, 191, 36, 0.12);
          color: #fbbf24;
          font-weight: 600;
        }
        .coin-gate-overlay {
          position: fixed;
          inset: 0;
          z-index: 10001;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .coin-gate-modal {
          background: var(--bg-secondary, #0f0f13);
          border: 1px solid var(--border, rgba(255,255,255,0.1));
          border-radius: 20px;
          padding: 32px;
          max-width: 400px;
          width: 90%;
          text-align: center;
          animation: modalPop 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .coin-gate-modal-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        .coin-gate-modal h3 {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary, #fff);
          margin: 0 0 8px;
        }
        .coin-gate-modal p {
          font-size: 14px;
          color: var(--text-secondary, #888);
          margin: 0 0 20px;
          line-height: 1.5;
        }
        .coin-gate-modal-tip {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #fbbf24;
          background: rgba(251, 191, 36, 0.08);
          border: 1px solid rgba(251, 191, 36, 0.15);
          border-radius: 10px;
          padding: 10px 14px;
          margin-bottom: 20px;
        }
        .coin-gate-modal-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
        }
        .coin-gate-modal-actions .btn {
          font-size: 13px;
          padding: 8px 18px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
      `}</style>
    </>
  );
}
