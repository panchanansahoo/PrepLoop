import React, { Suspense, lazy } from 'react';

// Lazy-load InterviewResults to avoid loading 30KB on initial page load
// Only loaded after interview completes (summary phase)
const InterviewResultsAsync = lazy(() => 
  import('./InterviewResults').then(module => ({ 
    default: module.default 
  }))
);

/**
 * Lazy wrapper for InterviewResults component
 * Shows loading spinner while component is being loaded
 */
export function InterviewResultsLazy(props) {
  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-700 border-t-purple-500 mx-auto mb-4"></div>
            <p className="text-slate-400 text-lg">Loading results...</p>
          </div>
        </div>
      }
    >
      <InterviewResultsAsync {...props} />
    </Suspense>
  );
}

export default InterviewResultsLazy;
