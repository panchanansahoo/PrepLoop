import React, { useState, useEffect } from 'react';
import { Coins } from 'lucide-react';
import { useCoins } from '../context/CoinContext';

export default function CoinDisplay() {
  const { coins } = useCoins();
  const [animate, setAnimate] = useState(false);
  const [prevCoins, setPrevCoins] = useState(coins);

  useEffect(() => {
    if (coins > prevCoins && prevCoins !== 0) {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 800);
    }
    setPrevCoins(coins);
  }, [coins]);

  return (
    <>
      <div className={`coin-display ${animate ? 'coin-earned' : ''}`} title={`${coins} coins`}>
        <Coins size={16} className="coin-icon" />
        <span className="coin-count">{coins}</span>
        {animate && <span className="coin-sparkle">+</span>}
      </div>

      <style>{`
        .coin-display {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(251, 191, 36, 0.08);
          border: 1px solid rgba(251, 191, 36, 0.15);
          border-radius: 20px;
          cursor: default;
          transition: all 0.3s ease;
          position: relative;
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
      `}</style>
    </>
  );
}
