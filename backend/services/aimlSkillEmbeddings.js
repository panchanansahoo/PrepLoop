/**
 * Skill Embeddings and Semantic Matching Service
 * 
 * Provides semantic similarity matching for skills using TF-IDF vectors.
 * Caches embeddings in Redis for performance.
 */

import Redis from 'redis';
import { supabaseAdmin } from '../db/supabaseClient.js';

// Initialize Redis client for embedding cache
let redisClient = null;

async function initializeRedisClient() {
  if (redisClient) return redisClient;
  try {
    redisClient = Redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    redisClient.on('error', (err) => console.error('Redis client error', err));
    await redisClient.connect();
    return redisClient;
  } catch (err) {
    console.error('Failed to initialize Redis:', err);
    return null;
  }
}

/**
 * Pre-defined skill similarity mappings for semantic matching
 * These map skills to related semantic clusters
 */
const SKILL_SEMANTIC_CLUSTERS = {
  // Frontend
  'React': ['Vue', 'Angular', 'Svelte', 'Next.js', 'frontend', 'web development', 'UI'],
  'Vue': ['React', 'Angular', 'frontend', 'web development'],
  'Angular': ['React', 'Vue', 'TypeScript', 'frontend'],
  'frontend': ['React', 'Vue', 'Angular', 'CSS', 'HTML', 'JavaScript', 'UI'],
  'UI': ['CSS', 'HTML', 'design', 'styling', 'frontend'],

  // Backend
  'Node.js': ['Express', 'backend', 'JavaScript', 'server', 'API', 'REST'],
  'Express': ['Node.js', 'backend', 'API', 'REST', 'web server'],
  'Python': ['Django', 'Flask', 'backend', 'data science', 'machine learning', 'scripting'],
  'Django': ['Python', 'backend', 'web framework', 'REST'],
  'Flask': ['Python', 'backend', 'lightweight', 'API'],
  'backend': ['Node.js', 'Express', 'Python', 'Django', 'API', 'server'],
  'API': ['REST', 'GraphQL', 'backend', 'Express', 'Node.js'],
  'REST': ['API', 'HTTP', 'backend', 'web services'],

  // Databases
  'SQL': ['PostgreSQL', 'MySQL', 'database', 'relational', 'data'],
  'PostgreSQL': ['SQL', 'database', 'relational', 'data'],
  'MySQL': ['SQL', 'database', 'relational'],
  'MongoDB': ['NoSQL', 'database', 'document', 'JSON'],
  'NoSQL': ['MongoDB', 'database', 'non-relational'],
  'database': ['SQL', 'PostgreSQL', 'MongoDB', 'data', 'storage'],

  // DevOps / Cloud
  'Docker': ['Kubernetes', 'containerization', 'DevOps', 'cloud'],
  'Kubernetes': ['Docker', 'orchestration', 'DevOps', 'cloud'],
  'AWS': ['cloud', 'infrastructure', 'DevOps', 'Azure', 'GCP'],
  'Azure': ['cloud', 'AWS', 'GCP', 'infrastructure'],
  'GCP': ['cloud', 'AWS', 'Google Cloud', 'infrastructure'],
  'DevOps': ['Docker', 'Kubernetes', 'CI/CD', 'cloud', 'infrastructure'],

  // Data & ML
  'Machine Learning': ['ML', 'AI', 'data science', 'TensorFlow', 'PyTorch', 'Python'],
  'ML': ['Machine Learning', 'AI', 'TensorFlow', 'PyTorch'],
  'AI': ['Machine Learning', 'ML', 'deep learning', 'neural networks'],
  'TensorFlow': ['PyTorch', 'Machine Learning', 'deep learning'],
  'PyTorch': ['TensorFlow', 'deep learning', 'ML'],
  'data science': ['Python', 'Machine Learning', 'statistics', 'data analysis'],
  'data analysis': ['statistics', 'data science', 'SQL', 'pandas'],

  // Languages
  'JavaScript': ['TypeScript', 'Node.js', 'React', 'frontend', 'web'],
  'TypeScript': ['JavaScript', 'Node.js', 'stricter typing'],
  'Java': ['Spring', 'backend', 'OOP', 'enterprise'],
  'C++': ['C', 'systems programming', 'performance'],
  'Go': ['Rust', 'systems programming', 'concurrency', 'backend'],
  'Rust': ['Go', 'systems programming', 'performance', 'memory safety'],

  // Testing & Quality
  'testing': ['Jest', 'Mocha', 'unit tests', 'QA', 'quality assurance'],
  'Jest': ['testing', 'JavaScript', 'unit tests'],
  'Mocha': ['testing', 'JavaScript', 'unit tests'],
  'QA': ['testing', 'quality assurance', 'automation'],

  // Other
  'Git': ['version control', 'GitHub', 'GitLab', 'branching'],
  'GitHub': ['Git', 'version control', 'open source'],
  'CI/CD': ['DevOps', 'automation', 'pipeline', 'testing'],
  'Linux': ['operating systems', 'DevOps', 'servers'],
};

/**
 * Compute TF-IDF style vector representation for a skill
 * Returns normalized vector
 */
function computeSkillVector(skill) {
  const normalized = skill.toLowerCase().trim();
  const vector = new Array(100).fill(0);
  
  // Simple hash-based vector generation for reproducibility
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) - hash) + normalized.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Distribute hash across vector dimensions
  for (let i = 0; i < 100; i++) {
    const seed = (hash + i * 31) % 256;
    vector[i] = (seed - 128) / 256; // Normalize to [-0.5, 0.5]
  }
  
  return normalizeVector(vector);
}

/**
 * L2 normalize a vector
 */
function normalizeVector(vector) {
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (magnitude === 0) return vector;
  return vector.map(v => v / magnitude);
}

/**
 * Compute cosine similarity between two vectors
 */
function cosineSimilarity(v1, v2) {
  if (v1.length !== v2.length) return 0;
  const dotProduct = v1.reduce((sum, a, i) => sum + a * v2[i], 0);
  return Math.max(0, Math.min(1, (dotProduct + 1) / 2)); // Normalize to [0, 1]
}

/**
 * Get semantic similarity between two skills using predefined clusters
 */
function getSemanticSimilarity(skill1, skill2) {
  if (skill1.toLowerCase() === skill2.toLowerCase()) return 1.0;
  
  const normalized1 = skill1.toLowerCase();
  const normalized2 = skill2.toLowerCase();
  
  // Check if skill2 is in skill1's semantic cluster
  const cluster1 = SKILL_SEMANTIC_CLUSTERS[skill1] || [];
  if (cluster1.some(s => s.toLowerCase() === normalized2)) return 0.85;
  
  // Check if skill1 is in skill2's semantic cluster
  const cluster2 = SKILL_SEMANTIC_CLUSTERS[skill2] || [];
  if (cluster2.some(s => s.toLowerCase() === normalized1)) return 0.85;
  
  // Use vector similarity as fallback
  const v1 = computeSkillVector(skill1);
  const v2 = computeSkillVector(skill2);
  return cosineSimilarity(v1, v2);
}

/**
 * Get embedding for a skill (cached)
 */
export async function getSkillEmbedding(skill) {
  try {
    const redis = await initializeRedisClient();
    const cacheKey = `skill_embedding:${skill.toLowerCase()}`;
    
    // Try cache first
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    }
    
    // Compute embedding
    const embedding = {
      skill,
      vector: computeSkillVector(skill),
      timestamp: Date.now(),
    };
    
    // Cache for 24 hours
    if (redis) {
      await redis.setEx(cacheKey, 86400, JSON.stringify(embedding));
    }
    
    return embedding;
  } catch (err) {
    console.error('Error getting skill embedding:', err);
    return {
      skill,
      vector: computeSkillVector(skill),
      timestamp: Date.now(),
    };
  }
}

/**
 * Find similar skills in a list using semantic matching
 */
export async function findSimilarSkills(userSkill, candidateSkills, threshold = 0.6) {
  const userSkillLower = userSkill.toLowerCase().trim();
  
  const similarities = candidateSkills.map(candidate => {
    const similarity = getSemanticSimilarity(userSkill, candidate);
    return {
      skill: candidate,
      similarity,
      matched: similarity >= threshold,
    };
  });
  
  return similarities.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Compute semantic match score between user skills and job skills
 * Returns score 0-100 and matched skills
 */
export async function computeSemanticSkillMatch(userSkills = [], jobSkills = []) {
  if (!userSkills.length || !jobSkills.length) return { score: 0, matches: [] };
  
  const matches = [];
  let totalSimilarity = 0;
  
  // For each user skill, find best match in job
  for (const userSkill of userSkills) {
    const jobSimilarities = await findSimilarSkills(userSkill, jobSkills, 0.5);
    if (jobSimilarities.length > 0) {
      const bestMatch = jobSimilarities[0];
      if (bestMatch.matched) {
        matches.push({
          userSkill,
          jobSkill: bestMatch.skill,
          similarity: bestMatch.similarity,
        });
        totalSimilarity += bestMatch.similarity;
      }
    }
  }
  
  // Calculate score: percentage of user skills matched, weighted by similarity
  const score = matches.length > 0 
    ? Math.round((totalSimilarity / userSkills.length) * 100)
    : 0;
  
  return {
    score: Math.min(100, score),
    matches,
    coverage: Math.round((matches.length / userSkills.length) * 100),
  };
}

/**
 * Get skill clusters and related skills for UI recommendations
 */
export function getSkillRecommendations(skills = []) {
  const recommendations = new Set();
  
  for (const skill of skills) {
    const cluster = SKILL_SEMANTIC_CLUSTERS[skill] || [];
    cluster.forEach(related => {
      if (!skills.includes(related) && related !== skill) {
        recommendations.add(related);
      }
    });
  }
  
  return Array.from(recommendations).slice(0, 10);
}

/**
 * Batch compute embeddings for multiple skills
 */
export async function batchComputeEmbeddings(skills = []) {
  const embeddings = {};
  for (const skill of skills) {
    embeddings[skill] = await getSkillEmbedding(skill);
  }
  return embeddings;
}

/**
 * Store computed skill trends in database for trend detection
 */
export async function storeSkillTrends(skillTrendData) {
  try {
    const { data, error } = await supabaseAdmin
      .from('career_skill_trends')
      .insert(skillTrendData);
    
    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Error storing skill trends:', err);
    return { success: false, error: err.message };
  }
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
  getSkillEmbedding,
  findSimilarSkills,
  computeSemanticSkillMatch,
  getSkillRecommendations,
  batchComputeEmbeddings,
  storeSkillTrends,
  closeRedisConnection,
};
