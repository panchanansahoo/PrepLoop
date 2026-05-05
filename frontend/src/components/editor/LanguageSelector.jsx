import React, { useState, useEffect } from 'react';
import { API_URL } from '../../utils/runtimeConfig';

/**
 * LanguageSelector - Displays available programming languages
 * 
 * Features:
 * - Fetches supported languages from backend
 * - Shows language with icon and name
 * - Compact dropdown/list view
 * - Tracks which are compiled vs interpreted
 */
export function LanguageSelector({ selectedLanguage, onLanguageChange, disabled = false }) {
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await fetch(`${API_URL}/api/dsa/supported-languages`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Failed to fetch languages');
        const data = await response.json();
        setLanguages(data.languages || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching languages:', err);
        setError(err.message);
        // Fallback to default languages
        setLanguages([
          { id: 'python', name: 'Python 3', icon: '🐍' },
          { id: 'javascript', name: 'JavaScript', icon: '📜' },
          { id: 'cpp', name: 'C++', icon: '⚙️' },
          { id: 'java', name: 'Java', icon: '☕' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading languages...</div>;
  }

  const currentLanguage = languages.find(l => l.id === selectedLanguage);

  return (
    <div className="language-selector">
      <select
        value={selectedLanguage}
        onChange={(e) => onLanguageChange(e.target.value)}
        disabled={disabled}
        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
        title="Select programming language"
      >
        {languages.map(lang => (
          <option key={lang.id} value={lang.id}>
            {lang.icon} {lang.name}
          </option>
        ))}
      </select>
      {error && <div className="text-xs text-yellow-600 mt-1">⚠️ {error}</div>}
    </div>
  );
}

/**
 * LanguageGrid - Display languages as a visual grid
 */
export function LanguageGrid({ selectedLanguage, onLanguageChange, disabled = false }) {
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await fetch(`${API_URL}/api/dsa/supported-languages`);
        if (!response.ok) throw new Error('Failed to fetch languages');
        const data = await response.json();
        setLanguages(data.languages || []);
      } catch (err) {
        console.error('Error fetching languages:', err);
        setLanguages([
          { id: 'python', name: 'Python 3', icon: '🐍' },
          { id: 'javascript', name: 'JavaScript', icon: '📜' },
          { id: 'cpp', name: 'C++', icon: '⚙️' },
          { id: 'java', name: 'Java', icon: '☕' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading languages...</div>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {languages.map(lang => (
        <button
          key={lang.id}
          onClick={() => onLanguageChange(lang.id)}
          disabled={disabled}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedLanguage === lang.id
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          title={lang.name}
        >
          <span className="mr-1">{lang.icon}</span>
          {lang.name.split(' ')[0]}
        </button>
      ))}
    </div>
  );
}

/**
 * LanguageInfo - Show detailed info about current language
 */
export function LanguageInfo({ language }) {
  const [languages, setLanguages] = useState([]);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await fetch(`${API_URL}/api/dsa/supported-languages`);
        const data = await response.json();
        setLanguages(data.languages || []);
      } catch (err) {
        console.error('Error fetching languages:', err);
      }
    };

    fetchLanguages();
  }, []);

  const currentLang = languages.find(l => l.id === language);
  if (!currentLang) return null;

  return (
    <div className="text-xs text-gray-600 flex items-center gap-1">
      <span>{currentLang.icon}</span>
      <span>{currentLang.name}</span>
    </div>
  );
}

export default LanguageSelector;
