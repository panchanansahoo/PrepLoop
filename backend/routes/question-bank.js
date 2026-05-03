import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── In-memory cache ───
let questionCache = null;
let companyStats = null;
let lastCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Load questions from Supabase (cached)
 */
async function loadQuestions() {
  if (questionCache && Date.now() - lastCacheTime < CACHE_TTL) {
    return questionCache;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('company_questions')
      .select('id, question, company, position, job_title, year, subject, difficulty, model_answer, hint, approach')
      .order('company')
      .limit(5000);

    if (error) throw error;
    questionCache = data || [];
    lastCacheTime = Date.now();

    // Build stats
    const stats = {};
    for (const q of questionCache) {
      const c = q.company || 'Unknown';
      if (!stats[c]) stats[c] = { count: 0, subjects: new Set() };
      stats[c].count++;
      if (q.subject) stats[c].subjects.add(q.subject);
    }

    companyStats = Object.entries(stats).map(([company, data]) => ({
      company,
      count: data.count,
      subjects: [...data.subjects],
    })).sort((a, b) => b.count - a.count);

    return questionCache;
  } catch (err) {
    console.error('Failed to load questions from DB:', err.message);
    // Fallback to CSV if DB is empty
    return loadFromCSVFallback();
  }
}

/**
 * Fallback: load questions directly from CSV files
 */
function loadFromCSVFallback() {
  if (questionCache && questionCache.length > 0) return questionCache;

  const csvDir = path.resolve(__dirname, '../../Company_Interview');
  if (!fs.existsSync(csvDir)) {
    questionCache = [];
    companyStats = [];
    return questionCache;
  }

  const questions = [];
  const csvFiles = fs.readdirSync(csvDir).filter(f => f.endsWith('.csv'));

  for (const file of csvFiles) {
    try {
      const content = fs.readFileSync(path.join(csvDir, file), 'utf-8');
      const lines = content.split('\n').filter(l => l.trim());
      if (lines.length < 2) continue;

      // Parse header
      const headers = parseCSVRow(lines[0]);
      const questionIdx = headers.findIndex(h => /^question$/i.test(h.trim()));
      const companyIdx = headers.findIndex(h => /^company$/i.test(h.trim()));
      const subjectIdx = headers.findIndex(h => /^subject$/i.test(h.trim()));
      const positionIdx = headers.findIndex(h => /^position$/i.test(h.trim()));
      const yearIdx = headers.findIndex(h => /^year$/i.test(h.trim()));
      const answerIdx = headers.findIndex(h => /model.?answer/i.test(h.trim()));
      const hintIdx = headers.findIndex(h => /hint/i.test(h.trim()));

      if (questionIdx === -1) continue;

      // Extract company from filename if not in columns
      const fileCompany = file.replace(/_Technical_ans\.csv|_ans\.csv|\.csv/gi, '').replace(/_/g, ' ');

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVRow(lines[i]);
        const question = cols[questionIdx]?.trim();
        if (!question || question.length < 10) continue;

        questions.push({
          id: `csv-${file}-${i}`,
          question,
          company: (companyIdx >= 0 ? cols[companyIdx]?.trim() : fileCompany) || fileCompany,
          subject: subjectIdx >= 0 ? cols[subjectIdx]?.trim() || 'General CS' : 'General CS',
          position: positionIdx >= 0 ? cols[positionIdx]?.trim() || '' : '',
          year: yearIdx >= 0 ? parseInt(cols[yearIdx]) || null : null,
          model_answer: answerIdx >= 0 ? cols[answerIdx]?.trim() || '' : '',
          hint: hintIdx >= 0 ? cols[hintIdx]?.trim() || '' : '',
          difficulty: 'Medium',
        });
      }
    } catch (err) {
      console.warn(`Failed to parse CSV ${file}:`, err.message);
    }
  }

  questionCache = questions;
  lastCacheTime = Date.now();

  // Build stats
  const stats = {};
  for (const q of questions) {
    const c = q.company || 'Unknown';
    if (!stats[c]) stats[c] = { count: 0, subjects: new Set() };
    stats[c].count++;
    if (q.subject) stats[c].subjects.add(q.subject);
  }

  companyStats = Object.entries(stats).map(([company, data]) => ({
    company,
    count: data.count,
    subjects: [...data.subjects],
  })).sort((a, b) => b.count - a.count);

  console.log(`✅ Question Bank CSV fallback loaded: ${questions.length} questions from ${csvFiles.length} files`);
  return questionCache;
}

/**
 * Simple CSV row parser that handles quoted fields
 */
function parseCSVRow(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// ─── Search endpoint ───
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { q = '', company = '', topic = '', difficulty = '', page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));

    const questions = await loadQuestions();
    let filtered = [...questions];

    // Text search
    if (q.trim()) {
      const searchTerms = q.toLowerCase().split(/\s+/);
      filtered = filtered.filter(item => {
        const text = `${item.question} ${item.company} ${item.subject} ${item.model_answer}`.toLowerCase();
        return searchTerms.every(term => text.includes(term));
      });
    }

    // Company filter
    if (company.trim()) {
      const c = company.toLowerCase();
      filtered = filtered.filter(item =>
        item.company?.toLowerCase().includes(c)
      );
    }

    // Topic/subject filter
    if (topic.trim()) {
      const t = topic.toLowerCase();
      filtered = filtered.filter(item =>
        item.subject?.toLowerCase().includes(t)
      );
    }

    // Difficulty filter
    if (difficulty.trim()) {
      filtered = filtered.filter(item =>
        item.difficulty?.toLowerCase() === difficulty.toLowerCase()
      );
    }

    const total = filtered.length;
    const start = (pageNum - 1) * limitNum;
    const results = filtered.slice(start, start + limitNum);

    res.json({
      results,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      hasMore: start + limitNum < total,
    });
  } catch (err) {
    console.error('Question bank search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ─── Companies list ───
router.get('/companies', optionalAuth, async (req, res) => {
  try {
    await loadQuestions();
    res.json({ companies: companyStats || [] });
  } catch (err) {
    console.error('Companies list error:', err);
    res.status(500).json({ error: 'Failed to load companies' });
  }
});

// ─── Stats ───
router.get('/stats', optionalAuth, async (req, res) => {
  try {
    const questions = await loadQuestions();
    const subjects = [...new Set(questions.map(q => q.subject).filter(Boolean))];
    const companies = [...new Set(questions.map(q => q.company).filter(Boolean))];
    const years = [...new Set(questions.map(q => q.year).filter(Boolean))].sort((a, b) => b - a);

    res.json({
      totalQuestions: questions.length,
      totalCompanies: companies.length,
      subjects,
      companies: companies.sort(),
      years,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

export default router;
