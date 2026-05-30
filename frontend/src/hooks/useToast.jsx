import { useState, useCallback } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((options) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    
    // Support string as argument or object
    const toastConfig = typeof options === 'string' 
      ? { title: options, status: 'info', duration: 3000 } 
      : { status: 'info', duration: 3000, ...options };
      
    setToasts((prev) => [...prev, { id, ...toastConfig }]);

    if (toastConfig.duration) {
      setTimeout(() => {
        removeToast(id);
      }, toastConfig.duration);
    }
    
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, toast, removeToast };
}

export function ToastContainer({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          padding: '12px 16px',
          background: t.status === 'error' ? '#ef4444' : t.status === 'success' ? '#10b981' : t.status === 'warning' ? '#f59e0b' : '#3b82f6',
          color: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          minWidth: '250px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          animation: 'slideIn 0.2s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <strong style={{ fontSize: '14px', marginRight: '16px' }}>{t.title}</strong>
            <button 
              onClick={() => removeToast(t.id)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '0', fontSize: '18px', lineHeight: '14px' }}
            >
              ×
            </button>
          </div>
          {t.description && <span style={{ fontSize: '13px', opacity: 0.9 }}>{t.description}</span>}
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
