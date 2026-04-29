/**
 * Accessibility Utilities (WCAG 2.1 AA)
 *
 * Focus trapping, screen reader announcements, keyboard navigation helpers.
 */
import { useEffect, useRef, useCallback } from 'react';

/**
 * useFocusTrap — Traps keyboard focus within a container (for modals/dialogs).
 */
export function useFocusTrap(isActive = true) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusable = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    first?.focus();

    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return containerRef;
}

/**
 * useAnnounce — Screen reader live region announcer.
 */
export function useAnnounce() {
  const regionRef = useRef(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!document.getElementById('sr-announcer')) {
      const el = document.createElement('div');
      el.id = 'sr-announcer';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('aria-atomic', 'true');
      Object.assign(el.style, { position:'absolute',width:'1px',height:'1px',padding:0,margin:'-1px',overflow:'hidden',clip:'rect(0,0,0,0)',whiteSpace:'nowrap',borderWidth:0 });
      document.body.appendChild(el);
      regionRef.current = el;
    } else {
      regionRef.current = document.getElementById('sr-announcer');
    }
  }, []);

  return useCallback((message, priority = 'polite') => {
    if (!regionRef.current) return;
    regionRef.current.setAttribute('aria-live', priority);
    regionRef.current.textContent = '';
    requestAnimationFrame(() => { regionRef.current.textContent = message; });
  }, []);
}

/**
 * SkipToContent — Skip navigation link for keyboard users.
 */
export function SkipToContent({ targetId = 'main-content', label = 'Skip to main content' }) {
  return (
    <a
      href={`#${targetId}`}
      style={{
        position:'absolute',left:'-9999px',top:'auto',width:'1px',height:'1px',overflow:'hidden',
        zIndex:9999,padding:'12px 24px',background:'#6366f1',color:'#fff',borderRadius:'0 0 8px 0',
        fontSize:14,fontWeight:500,textDecoration:'none',
      }}
      onFocus={(e) => { e.target.style.left = '0'; e.target.style.width = 'auto'; e.target.style.height = 'auto'; }}
      onBlur={(e) => { e.target.style.left = '-9999px'; e.target.style.width = '1px'; e.target.style.height = '1px'; }}
    >
      {label}
    </a>
  );
}

export default { useFocusTrap, useAnnounce, SkipToContent };
