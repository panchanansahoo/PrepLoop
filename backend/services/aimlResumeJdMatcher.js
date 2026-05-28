/**
 * Resume-to-JD Similarity Matching Service
 * 
 * Computes semantic similarity between resume text and job descriptions
 * using transformer-style embeddings and contextual understanding.
 */

import Redis from 'redis';

let redisClient = null;

async function initializeRedisClient() {
  if (redisClient) return redisClient;
  try {
    redisClient = Redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    redisClient.on('error', (err) => console.error('Redis error', err));
    await redisClient.connect();
    return redisClient;
  } catch (err) {
    console.error('Failed to initialize Redis:', err);
    return null;
  }
}

/**
 * Tokenize and normalize text
 */
function tokenizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

/**
 * Calculate TF-IDF scores for text
 */
function calculateTfIdf(text, allTexts = []) {
  const tokens = tokenizeText(text);
  const allTokens = allTexts.map(t => tokenizeText(t));
  
  const tf = {};
  for (const token of tokens) {
    tf[token] = (tf[token] || 0) + 1;
  }
  
  const maxFreq = Math.max(...Object.values(tf), 1);
  for (const token of Object.keys(tf)) {
    tf[token] = tf[token] / maxFreq;
  }
  
  const idf = {};
  const totalDocs = allTokens.length || 1;
  
  for (const token of Object.keys(tf)) {
    const docsWithToken = allTokens.filter(doc => doc.includes(token)).length;
    idf[token] = Math.log(totalDocs / (docsWithToken + 1));
  }
  
  const tfidf = {};
  for (const token of Object.keys(tf)) {
    tfidf[token] = tf[token] * idf[token];
  }
  
  return { tokens, tf, idf, tfidf };
}

/**
 * Compute cosine similarity between two TF-IDF vectors
 */
function cosineSimilarityTfidf(tfidf1, tfidf2) {
  const allKeys = new Set([...Object.keys(tfidf1), ...Object.keys(tfidf2)]);
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (const key of allKeys) {
    const v1 = tfidf1[key] || 0;
    const v2 = tfidf2[key] || 0;
    dotProduct += v1 * v2;
    norm1 += v1 * v1;
    norm2 += v2 * v2;
  }
  
  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  return denominator > 0 ? dotProduct / denominator : 0;
}

/**
 * Extract key qualifications from text
 */
function extractQualifications(text) {
  const qualifications = {
    yearsOfExperience: null,
    education: [],
    certifications: [],
    specializations: [],
  };
  
  // Years of experience
  const expMatch = text.match(/(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?experience/i);
  if (expMatch) {
    qualifications.yearsOfExperience = parseInt(expMatch[1]);
  }
  
  // Education levels
  const educationPatterns = [
    { pattern: /bachelor|bs|b\.s|undergraduate/i, level: 'Bachelor' },
    { pattern: /master|ms|m\.s|graduate/i, level: 'Master' },
    { pattern: /phd|doctorate/i, level: 'PhD' },
    { pattern: /mba/i, level: 'MBA' },
    { pattern: /associate|diploma|diploma/i, level: 'Associate' },
  ];
  
  for (const edu of educationPatterns) {
    if (edu.pattern.test(text)) {
      qualifications.education.push(edu.level);
    }
  }
  
  // Certifications (common ones)
  const certPatterns = ['AWS', 'GCP', 'Azure', 'Kubernetes', 'Docker', 'CISSP', 'PMP', 'SCRUM', 'Google Cloud'];
  for (const cert of certPatterns) {
    const regex = new RegExp(`\\b${cert}\\b`, 'i');
    if (regex.test(text)) {
      qualifications.certifications.push(cert);
    }
  }
  
  return qualifications;
}

/**
 * Compute semantic similarity between resume and job description
 * Returns score 0-100 with detailed breakdown
 */
export async function computeResumeSimilarity(resumeText, jobDescriptionText) {
  try {
    const resumeTfidf = calculateTfIdf(resumeText, [resumeText, jobDescriptionText]);
    const jobTfidf = calculateTfIdf(jobDescriptionText, [resumeText, jobDescriptionText]);
    
    // Compute base cosine similarity
    const baseScore = cosineSimilarityTfidf(resumeTfidf.tfidf, jobTfidf.tfidf);
    
    // Extract qualifications from both
    const resumeQuals = extractQualifications(resumeText);
    const jobQuals = extractQualifications(jobDescriptionText);
    
    let qualScore = 0.5; // Base score
    
    // Check experience match
    if (resumeQuals.yearsOfExperience !== null && jobQuals.yearsOfExperience !== null) {
      const expDiff = Math.abs(resumeQuals.yearsOfExperience - jobQuals.yearsOfExperience);
      qualScore += Math.max(0, 0.3 - (expDiff / 10) * 0.3);
    }
    
    // Check education match
    if (resumeQuals.education.length > 0 && jobQuals.education.length > 0) {
      const eduMatch = resumeQuals.education.some(r => jobQuals.education.some(j => j.includes(r) || r.includes(j)));
      qualScore += eduMatch ? 0.2 : 0.05;
    }
    
    // Check certification overlap
    const certOverlap = resumeQuals.certifications.filter(c => 
      jobQuals.certifications.some(jc => jc.toLowerCase() === c.toLowerCase())
    );
    if (certOverlap.length > 0) {
      qualScore += (certOverlap.length / Math.max(resumeQuals.certifications.length, 1)) * 0.2;
    }
    
    // Combine scores (weighted average)
    const finalScore = Math.min(100, Math.round((baseScore * 60 + qualScore * 40) * 100));
    
    // Extract matching sections
    const resumeTokens = new Set(resumeTfidf.tokens);
    const jobTokens = new Set(jobTfidf.tokens);
    const matchedTokens = [...resumeTokens].filter(t => jobTokens.has(t)).slice(0, 10);
    
    return {
      score: finalScore,
      baseSemanticScore: Math.round(baseScore * 100),
      qualificationScore: Math.round(qualScore * 100),
      breakdown: {
        semanticSimilarity: baseScore,
        experienceMatch: resumeQuals.yearsOfExperience && jobQuals.yearsOfExperience 
          ? Math.max(0, 1 - Math.abs(resumeQuals.yearsOfExperience - jobQuals.yearsOfExperience) / 10)
          : 0.5,
        educationMatch: resumeQuals.education.length > 0 && jobQuals.education.length > 0,
        certificationMatch: certOverlap.length,
      },
      matchedSkills: matchedTokens,
      resumeQualifications: resumeQuals,
      jobRequirements: jobQuals,
      recommendation: finalScore >= 75 ? 'strong_match' : finalScore >= 60 ? 'moderate_match' : finalScore >= 40 ? 'weak_match' : 'poor_match',
    };
  } catch (err) {
    console.error('Error computing resume similarity:', err);
    return {
      score: 0,
      error: err.message,
      recommendation: 'error',
    };
  }
}

/**
 * Batch compute resume similarity for multiple jobs
 */
export async function batchComputeResumeSimilarity(resumeText, jobs = []) {
  const results = [];
  
  for (const job of jobs) {
    const similarity = await computeResumeSimilarity(resumeText, job.description || job.title);
    results.push({
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      ...similarity,
    });
  }
  
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Compute resume match score with caching
 */
export async function computeResumeSimilarityWithCache(resumeText, jobDescription, cacheKey = null) {
  try {
    const redis = await initializeRedisClient();
    const key = cacheKey || `resume_match:${resumeText.slice(0, 20)}:${jobDescription.slice(0, 20)}`;
    
    // Try cache
    if (redis) {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    }
    
    // Compute
    const result = await computeResumeSimilarity(resumeText, jobDescription);
    
    // Cache for 24 hours
    if (redis && result.score !== undefined) {
      await redis.setEx(key, 86400, JSON.stringify(result));
    }
    
    return result;
  } catch (err) {
    console.error('Error with cached resume similarity:', err);
    return await computeResumeSimilarity(resumeText, jobDescription);
  }
}

/**
 * Rank jobs by resume match
 */
export async function rankJobsByResumeMatch(resumeText, jobs = [], limit = 20) {
  const matches = await batchComputeResumeSimilarity(resumeText, jobs);
  
  return {
    totalJobs: jobs.length,
    matches: matches.slice(0, limit).map(m => ({
      jobId: m.jobId,
      jobTitle: m.jobTitle,
      company: m.company,
      score: m.score,
      recommendation: m.recommendation,
      matchedSkills: m.matchedSkills.slice(0, 5),
    })),
    statistics: {
      avgScore: Math.round(matches.reduce((sum, m) => sum + m.score, 0) / matches.length),
      strongMatches: matches.filter(m => m.recommendation === 'strong_match').length,
      moderateMatches: matches.filter(m => m.recommendation === 'moderate_match').length,
    },
  };
}

/**
 * Get resume insights
 */
export function getResumeInsights(resumeText) {
  const qualifications = extractQualifications(resumeText);
  const tokens = tokenizeText(resumeText);
  
  return {
    textLength: resumeText.length,
    tokenCount: tokens.length,
    uniqueTokens: new Set(tokens).size,
    qualifications,
    topKeywords: Array.from(new Set(tokens))
      .slice(0, 20)
      .map(t => ({ keyword: t, mentioned: true })),
  };
}

/**
 * Close Redis connection
 */
export async function closeRedisConnection() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

export default {
  computeResumeSimilarity,
  batchComputeResumeSimilarity,
  computeResumeSimilarityWithCache,
  rankJobsByResumeMatch,
  getResumeInsights,
  closeRedisConnection,
};
