/**
 * NLP-based Skill Trend Detection Service
 * 
 * Scans job descriptions to extract skills and detect emerging/declining trends.
 * Uses frequency analysis to identify skills trending up or down QoQ.
 */

import { supabase, supabaseAdmin as _supabaseAdmin } from '../db/supabaseClient.js';

/**
 * Common skill keywords for extraction
 */
const SKILL_KEYWORDS = {
  'programming': ['python', 'javascript', 'java', 'c++', 'go', 'rust', 'typescript', 'scala', 'kotlin', 'php', 'c#', 'ruby', 'perl', 'swift', 'r', 'matlab', 'objective-c', 'groovy'],
  'web': ['react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt', 'express', 'django', 'flask', 'fastapi', 'spring', 'asp.net', 'node.js', 'html', 'css', 'webpack', 'vite'],
  'database': ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'cassandra', 'dynamodb', 'firestore', 'oracle', 'sqlite', 'mariadb', 'couchdb', 'neo4j'],
  'devops': ['docker', 'kubernetes', 'jenkins', 'gitlab', 'github', 'circleci', 'travis', 'terraform', 'ansible', 'vagrant', 'aws', 'azure', 'gcp', 'heroku', 'digitalocean', 'linux'],
  'ml_ai': ['machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn', 'keras', 'llm', 'nlp', 'computer vision', 'cv', 'transformers', 'bert', 'gpt', 'langchain', 'huggingface', 'openai', 'anthropic'],
  'data': ['pandas', 'numpy', 'spark', 'hadoop', 'hive', 'pig', 'etl', 'data pipeline', 'data warehouse', 'analytics', 'tableau', 'powerbi', 'dbt', 'airflow'],
  'mobile': ['ios', 'android', 'react native', 'flutter', 'xamarin', 'swift', 'kotlin'],
  'other': ['git', 'agile', 'scrum', 'jira', 'slack', 'rest api', 'graphql', 'microservices', 'cloud native', 'serverless', 'lambda'],
};

/**
 * Extract skills from job description text
 */
export function extractSkillsFromText(text) {
  if (!text) return [];
  
  const lowerText = text.toLowerCase();
  const extractedSkills = new Set();
  
  // Search for each skill keyword
  for (const [_category, skills] of Object.entries(SKILL_KEYWORDS)) {
    for (const skill of skills) {
      // Match whole words or hyphenated terms
      const patterns = [
        new RegExp(`\\b${skill}\\b`, 'gi'),
        new RegExp(`\\b${skill.replace(/\s+/g, '[-\\s]+')}\\b`, 'gi'),
      ];
      
      for (const pattern of patterns) {
        if (pattern.test(lowerText)) {
          // Normalize skill name
          const normalized = skill.charAt(0).toUpperCase() + skill.slice(1);
          extractedSkills.add(normalized);
        }
      }
    }
  }
  
  return Array.from(extractedSkills);
}

/**
 * Analyze job description for skill mentions
 */
export function analyzeJobDescription(jobDescription) {
  const skills = extractSkillsFromText(jobDescription);
  
  return {
    text: jobDescription,
    skillsFound: skills,
    skillCount: skills.length,
    categories: categorizeSkills(skills),
    keywords: extractKeywords(jobDescription, 20),
  };
}

/**
 * Categorize skills by type
 */
function categorizeSkills(skills) {
  const categorized = {
    programming: [],
    web: [],
    database: [],
    devops: [],
    ml_ai: [],
    data: [],
    mobile: [],
    other: [],
  };
  
  for (const skill of skills) {
    const lower = skill.toLowerCase();
    for (const [category, keywords] of Object.entries(SKILL_KEYWORDS)) {
      if (keywords.includes(lower)) {
        categorized[category].push(skill);
        break;
      }
    }
  }
  
  return categorized;
}

/**
 * Extract top keywords from text
 */
function extractKeywords(text, limit = 20) {
  if (!text) return [];
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3);
  
  const stopWords = new Set(['the', 'and', 'for', 'with', 'from', 'that', 'this', 'will', 'have', 'your', 'role', 'position', 'job', 'work', 'team', 'skills', 'experience', 'required', 'must', 'should', 'need', 'able', 'about', 'also', 'plus', 'nice', 'knowledge']);
  
  const wordFreq = {};
  for (const word of words) {
    if (!stopWords.has(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  }
  
  return Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, freq]) => ({ word, frequency: freq }));
}

/**
 * Track skill mention frequency
 */
export function trackSkillFrequency(jobs = []) {
  const skillFrequency = {};
  const skillAppearances = {};
  
  for (const job of jobs) {
    const description = job.description || job.title || '';
    const skills = extractSkillsFromText(description);
    
    for (const skill of skills) {
      if (!skillFrequency[skill]) {
        skillFrequency[skill] = 0;
        skillAppearances[skill] = [];
      }
      skillFrequency[skill]++;
      skillAppearances[skill].push({
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
      });
    }
  }
  
  return {
    skillFrequency,
    skillAppearances,
    totalJobs: jobs.length,
    uniqueSkills: Object.keys(skillFrequency).length,
  };
}

/**
 * Calculate skill trend for a specific skill across time periods
 */
export function calculateSkillTrend(historicalData) {
  if (!historicalData || historicalData.length < 2) {
    return { trend: 'insufficient_data', growthRate: 0 };
  }
  
  // Assume historicalData is sorted by time
  const recentPeriods = historicalData.slice(-4);
  const olderPeriods = historicalData.slice(0, Math.max(1, historicalData.length - 4));
  
  const recentAvg = recentPeriods.reduce((a, b) => a + b, 0) / recentPeriods.length;
  const olderAvg = olderPeriods.reduce((a, b) => a + b, 0) / olderPeriods.length;
  
  const growthRate = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
  
  let trend = 'stable';
  if (growthRate > 20) trend = 'emerging';
  else if (growthRate > 10) trend = 'growing';
  else if (growthRate < -20) trend = 'declining';
  else if (growthRate < -10) trend = 'falling';
  
  return {
    trend,
    growthRate: Math.round(growthRate * 10) / 10,
    recentAverage: Math.round(recentAvg),
    olderAverage: Math.round(olderAvg),
  };
}

/**
 * Detect emerging skills across all jobs
 */
export async function detectEmergingSkillsFromJobs(jobs = []) {
  try {
    if (jobs.length === 0) {
      // Fetch recent jobs if not provided
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, description, company')
        .order('created_at', { ascending: false })
        .limit(500);
      
      if (error) throw error;
      jobs = data || [];
    }
    
    const frequency = await trackSkillFrequency(jobs);
    
    // Calculate trend for each skill
    const skillTrends = [];
    
    for (const [skill, count] of Object.entries(frequency.skillFrequency)) {
      const trend = {
        skill,
        frequency: count,
        frequencyPercentage: Math.round((count / jobs.length) * 100 * 10) / 10,
        appearances: frequency.skillAppearances[skill],
      };
      skillTrends.push(trend);
    }
    
    // Sort by frequency
    skillTrends.sort((a, b) => b.frequency - a.frequency);
    
    // Categorize as emerging (new), popular (top 20%), or niche
    const topSkills = skillTrends.slice(0, Math.ceil(skillTrends.length * 0.2));
    const popular = topSkills.filter(s => s.frequencyPercentage > 5);
    const emerging = skillTrends.filter(s => s.frequencyPercentage < 3 && s.frequencyPercentage > 0.5);
    
    return {
      timestamp: new Date().toISOString(),
      totalJobsAnalyzed: jobs.length,
      allSkills: skillTrends,
      popularSkills: popular,
      emergingSkills: emerging.slice(0, 20),
      statistics: {
        uniqueSkills: frequency.uniqueSkills,
        averageSkillsPerJob: Math.round((Object.values(frequency.skillFrequency).reduce((a, b) => a + b, 0) / jobs.length) * 10) / 10,
      },
    };
  } catch (err) {
    console.error('Error detecting emerging skills:', err);
    return { error: err.message };
  }
}

/**
 * Store skill trend data in database
 */
export async function storeSkillTrendData(skillName, quarter, frequency, trend) {
  try {
    const { data, error } = await supabase
      .from('career_market_signals')
      .upsert({
        skill_name: skillName,
        quarter,
        skill_mentions: frequency,
        trend_direction: trend,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: ['skill_name', 'quarter'],
      });
    
    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Error storing skill trend:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get trending skills for a specific quarter
 */
export async function getTrendingSkillsForQuarter(quarter) {
  try {
    const { data, error } = await supabase
      .from('career_market_signals')
      .select('skill_name, skill_mentions, trend_direction')
      .eq('quarter', quarter)
      .order('skill_mentions', { ascending: false })
      .limit(30);
    
    if (error) throw error;
    
    return {
      quarter,
      skills: data || [],
      emerging: (data || []).filter(s => s.trend_direction === 'emerging'),
      declining: (data || []).filter(s => s.trend_direction === 'declining'),
    };
  } catch (err) {
    console.error('Error fetching trending skills:', err);
    return { error: err.message };
  }
}

/**
 * Get skills trend comparison between quarters
 */
export async function compareSkillTrends(skill, quarters = []) {
  try {
    const { data, error } = await supabase
      .from('career_market_signals')
      .select('quarter, skill_mentions')
      .eq('skill_name', skill)
      .in('quarter', quarters)
      .order('quarter', { ascending: true });
    
    if (error) throw error;
    
    const trend = calculateSkillTrend((data || []).map(d => d.skill_mentions));
    
    return {
      skill,
      quarters: (data || []).map(d => ({
        quarter: d.quarter,
        mentions: d.skill_mentions,
      })),
      trend,
    };
  } catch (err) {
    console.error('Error comparing skill trends:', err);
    return { error: err.message };
  }
}

export default {
  extractSkillsFromText,
  analyzeJobDescription,
  trackSkillFrequency,
  calculateSkillTrend,
  detectEmergingSkillsFromJobs,
  storeSkillTrendData,
  getTrendingSkillsForQuarter,
  compareSkillTrends,
};
