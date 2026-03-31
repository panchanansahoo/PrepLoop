import React, { useEffect, useRef, useState } from 'react';

const PAGE_HTML_PATH = '/advanced_learning_path_dsa_aptitude_sql_sysdesign.html';
const INJECTED_STYLE_ID = 'advanced-learning-path-style';
const INJECTED_SCRIPT_ATTR = 'data-advanced-learning-path-script';

function clearInjectedScripts(container) {
  if (!container) return;
  container.querySelectorAll(`[${INJECTED_SCRIPT_ATTR}]`).forEach((node) => node.remove());
}

function clearInjectedStyle() {
  const existing = document.getElementById(INJECTED_STYLE_ID);
  if (existing) existing.remove();
}

function mountAdvancedLearningPath(html, container) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const styleNodes = Array.from(doc.querySelectorAll('style'));
  const scriptNodes = Array.from(doc.querySelectorAll('script'));

  styleNodes.forEach((node) => node.remove());
  scriptNodes.forEach((node) => node.remove());

  clearInjectedStyle();
  clearInjectedScripts(container);

  if (styleNodes.length) {
    const style = document.createElement('style');
    style.id = INJECTED_STYLE_ID;
    style.textContent = styleNodes.map((s) => s.textContent || '').join('\n\n');
    document.head.appendChild(style);
  }

  container.innerHTML = doc.body ? doc.body.innerHTML : html;

  scriptNodes.forEach((sourceScript) => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.setAttribute(INJECTED_SCRIPT_ATTR, 'true');

    if (sourceScript.src) {
      script.src = sourceScript.src;
      script.async = false;
    } else {
      // Isolate globals to avoid re-declaration errors on remount.
      script.text = `(() => {\n${sourceScript.textContent || ''}\n})();`;
    }

    container.appendChild(script);
  });
}

export default function AdvancedLearningPathPage() {
  const containerRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function loadPage() {
      try {
        setStatus('loading');
        setErrorMessage('');

        const response = await fetch(PAGE_HTML_PATH, { cache: 'no-cache' });
        if (!response.ok) {
          throw new Error(`Failed to load advanced learning path (${response.status})`);
        }

        const html = await response.text();
        if (!active || !containerRef.current) return;

        mountAdvancedLearningPath(html, containerRef.current);
        setStatus('ready');
      } catch (error) {
        if (!active) return;
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load content');
      }
    }

    loadPage();

    return () => {
      active = false;
      clearInjectedStyle();
      clearInjectedScripts(containerRef.current);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

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

      <div
        ref={containerRef}
        style={{
          width: '100%',
          minHeight: 'calc(100vh - 32px)',
          border: '1px solid rgba(127,127,127,0.25)',
          borderRadius: '12px',
          background: 'transparent',
          overflow: 'hidden',
        }}
      />
    </div>
  );
}
