import React, { Suspense } from 'react';

// Lazy load Monaco Editor only when needed
const MonacoEditor = React.lazy(() => import('@monaco-editor/react'));

/**
 * MonacoWrapper - Lazy-loads Monaco Editor with fallback
 * Prevents bundling 2.5MB editor code unless the page uses it
 * 
 * Usage:
 *   <MonacoWrapper
 *     language="javascript"
 *     value={code}
 *     onChange={(value) => setCode(value)}
 *     height="400px"
 *   />
 */
export function MonacoWrapper(props) {
  return (
    <Suspense fallback={<EditorFallback />}>
      <MonacoEditor {...props} />
    </Suspense>
  );
}

/**
 * Fallback UI shown while Monaco loads (2-3 seconds on first visit)
 */
function EditorFallback() {
  return (
    <div className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-4 flex items-center justify-center" style={{ height: '400px' }}>
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin">
          <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <p className="text-sm text-zinc-400">Loading code editor...</p>
      </div>
    </div>
  );
}

export default MonacoWrapper;
