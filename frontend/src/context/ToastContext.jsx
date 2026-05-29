import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

const TOAST_LIMIT = 5;
let toastIdCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  }, []);

  const showToast = useCallback(({ type = 'info', title, description, duration = 5000 }) => {
    const id = `toast-${++toastIdCounter}`;

    setToasts((prev) => {
      const next = [...prev, { id, type, title, description, createdAt: Date.now() }];
      // Evict oldest if over limit
      if (next.length > TOAST_LIMIT) {
        const evicted = next.shift();
        if (timersRef.current[evicted.id]) {
          clearTimeout(timersRef.current[evicted.id]);
          delete timersRef.current[evicted.id];
        }
      }
      return next;
    });

    if (duration > 0) {
      timersRef.current[id] = setTimeout(() => removeToast(id), duration);
    }

    return id;
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <ToastOverlay toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useGlobalToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useGlobalToast must be used within ToastProvider');
  return ctx;
}

// --- Toast Overlay UI ---

const TOAST_COLORS = {
  success: { bg: 'rgba(16, 185, 129, 0.95)', border: '#10b981', icon: '✓' },
  error: { bg: 'rgba(239, 68, 68, 0.95)', border: '#ef4444', icon: '✕' },
  warning: { bg: 'rgba(245, 158, 11, 0.95)', border: '#f59e0b', icon: '⚠' },
  info: { bg: 'rgba(59, 130, 246, 0.95)', border: '#3b82f6', icon: 'ℹ' },
};

function ToastOverlay({ toasts, removeToast }) {
  if (!toasts.length) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '10px',
        maxWidth: '420px',
        width: '100%',
        pointerEvents: 'none',
      }}
    >
      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes toastSlideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `}</style>
      {toasts.map((t) => {
        const colors = TOAST_COLORS[t.type] || TOAST_COLORS.info;
        return (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            aria-live={t.type === 'error' ? 'assertive' : 'polite'}
            style={{
              background: colors.bg,
              backdropFilter: 'blur(12px)',
              borderLeft: `4px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '14px 16px',
              color: 'white',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              animation: 'toastSlideIn 0.3s ease-out',
              pointerEvents: 'auto',
              fontFamily: "'Inter', 'Segoe UI', sans-serif",
            }}
          >
            <span style={{ fontSize: '18px', lineHeight: '24px', flexShrink: 0 }}>
              {colors.icon}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '14px', lineHeight: '20px' }}>
                {t.title}
              </div>
              {t.description && (
                <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '4px', lineHeight: '18px' }}>
                  {t.description}
                </div>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              aria-label="Dismiss notification"
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                padding: '0 0 0 8px',
                fontSize: '18px',
                lineHeight: '20px',
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default ToastContext;
