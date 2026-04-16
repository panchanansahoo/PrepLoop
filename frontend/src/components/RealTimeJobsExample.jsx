import React, { useState } from 'react';
import { useRealTimeJobs } from '../hooks/useRealTimeJobs';

export default function RealTimeJobsExample() {
  const [query, setQuery] = useState('software developer');
  const [searchInput, setSearchInput] = useState('software developer');
  
  const { 
    jobs, 
    loading, 
    error, 
    lastUpdate, 
    refresh,
    isConnected 
  } = useRealTimeJobs(query, {
    enabled: true,
    pollInterval: 300000, // 5 minutes
    useWebSocket: false // Set to true if WebSocket is configured
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(searchInput);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Real-Time Job Updates</h1>
          <div className="flex items-center gap-2">
            {lastUpdate && (
              <span className="text-sm text-gray-600">
                Last updated: {new Date(lastUpdate).toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={refresh}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search jobs (e.g., react developer, data analyst)"
            className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Search
          </button>
        </form>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          Error: {error}
        </div>
      )}

      {loading && jobs.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading jobs...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{jobs.length} jobs found</span>
            {isConnected && (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Live updates active
              </span>
            )}
          </div>

          {jobs.map((job) => (
            <div
              key={job.id}
              className="p-6 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {job.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {job.company}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {job.location}
                    </span>
                    {job.salary_range && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {job.salary_range}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 mb-3">{job.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {job.category}
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      {job.type}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                      {job.source}
                    </span>
                  </div>
                </div>
                <a
                  href={job.apply_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap"
                >
                  Apply Now
                </a>
              </div>
            </div>
          ))}

          {jobs.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              No jobs found. Try a different search query.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
