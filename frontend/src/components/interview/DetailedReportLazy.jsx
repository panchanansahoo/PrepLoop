import React, { Suspense, lazy } from 'react';

// Lazy-load DetailedReport to avoid loading 50KB on initial page load
// Only loaded after interview completes (summary phase)
const DetailedReportAsync = lazy(() => 
  import('../components/interview/DetailedReport').then(module => ({ 
    default: module.default 
  }))
);

/**
 * Lazy wrapper for DetailedReport component
 * Shows loading spinner while component is being loaded
 */
export function DetailedReportLazy(props) {
  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-700 border-t-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-400 text-lg">Generating detailed analysis...</p>
          </div>
        </div>
      }
    >
      <DetailedReportAsync {...props} />
    </Suspense>
  );
}

export default DetailedReportLazy;
