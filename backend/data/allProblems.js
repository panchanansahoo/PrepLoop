// Complete 425 DSA Problems Dataset
import { dsaProblems } from './dsaProblems.js';
import { extendedDsaProblems } from './dsaProblemsExtended.js';

// Combine both datasets
export const all425Problems = [...dsaProblems, ...extendedDsaProblems];

// Get all unique patterns
export const getAllPatterns = () => {
  return [...new Set(all425Problems.map(p => p.pattern))].sort();
};

// Get all unique companies
export const getAllCompanies = () => {
  const companies = new Set();
  all425Problems.forEach(p => {
    p.companies?.forEach(c => companies.add(c));
  });
  return [...companies].sort();
};

// Get problems by pattern
export const getProblemsByPattern = (pattern) => {
  return all425Problems.filter(p => p.pattern === pattern);
};

// Get problems by difficulty
export const getProblemsByDifficulty = (difficulty) => {
  return all425Problems.filter(p => p.difficulty === difficulty);
};

// Get problems by company
export const getProblemsByCompany = (company) => {
  return all425Problems.filter(p => p.companies?.includes(company));
};

// Get statistics
export const getStatistics = () => {
  const patterns = {};
  const difficulties = { Easy: 0, Medium: 0, Hard: 0 };
  
  all425Problems.forEach(p => {
    // Count by pattern
    patterns[p.pattern] = (patterns[p.pattern] || 0) + 1;
    
    // Count by difficulty
    difficulties[p.difficulty]++;
  });
  
  return {
    total: all425Problems.length,
    patterns,
    difficulties,
    companies: getAllCompanies().length
  };
};

export default all425Problems;
