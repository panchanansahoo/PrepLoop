import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

const PAGE_HTML_PATH = '/advanced_learning_path_dsa_aptitude_sql_sysdesign.html';

export default function AdvancedLearningPathPage() {
  const [status, setStatus] = useState('ready');
  const [errorMessage, setErrorMessage] = useState('');
  const { theme } = useTheme();
  const iframeRef = useRef(null);

  useEffect(() => {
    setStatus('ready');
  }, []);

  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'THEME_CHANGE', theme }, '*');
    }
  }, [theme]);

  return (
    <div style={{ minHeight: '100vh', padding: '16px' }}>
      {status === 'loading' && (
        <div
          style={{
            marginBottom: '12px',
            fontSize: '14px',
            color: 'var(--color-text-secondary, #64748B)',
          }}
        >
          Loading advanced learning path...
        </div>
      )}

      {status === 'error' && (
        <div
          style={{
            marginBottom: '12px',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(220, 38, 38, 0.35)',
            background: 'rgba(220, 38, 38, 0.08)',
            color: 'rgb(185, 28, 28)',
            fontSize: '13px',
          }}
        >
          {errorMessage}
        </div>
      )}

      {status !== 'error' && (
        <iframe
          ref={iframeRef}
          src={`${PAGE_HTML_PATH}?theme=${theme}`}
          title="Advanced Learning Path"
          onLoad={() => {
            setStatus('ready');
            setErrorMessage('');
          }}
          onError={() => {
            setStatus('error');
            setErrorMessage('Failed to load advanced learning path content');
          }}
          style={{
            width: '100%',
            minHeight: 'calc(100vh - 32px)',
            border: '1px solid rgba(127,127,127,0.25)',
            borderRadius: '12px',
            background: 'transparent',
          }}
        />
      )}
    </div>
  );
}
