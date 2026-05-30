/**
 * Integration Tests for AI/ML Career Guidance Features
 * 
 * Tests:
 * 1. Skill embeddings and semantic matching
 * 2. Demand forecasting
 * 3. Collaborative filtering for pathways
 * 4. NLP trend detection
 * 5. Resume-to-JD similarity matching
 */

import skillEmbeddings from '../services/aimlSkillEmbeddings.js';
import demandForecasting from '../services/aimlDemandForecasting.js';
import collaborativeFiltering from '../services/aimlCollaborativeFiltering.js';
import trendDetection from '../services/aimlTrendDetection.js';
import resumeMatcher from '../services/aimlResumeJdMatcher.js';

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

async function run() {
  console.log('🧪 Running AI/ML Career Guidance Integration Tests\n');

  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (err) {
      console.log(`❌ ${name}`);
      console.log(`   Error: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed out of ${tests.length} tests`);
  process.exit(failed > 0 ? 1 : 0);
}

// ============= SKILL EMBEDDINGS TESTS =============

test('Skill Embeddings: Similar skills have high similarity', async () => {
  const matches = await skillEmbeddings.findSimilarSkills('React', ['Vue', 'Angular', 'Python', 'Java'], 0.5);
  const vueMatch = matches.find(m => m.skill === 'Vue');
  if (!vueMatch || vueMatch.similarity < 0.7) {
    throw new Error(`Vue similarity too low: ${vueMatch?.similarity}`);
  }
});

test('Skill Embeddings: Compute semantic skill match', async () => {
  const userSkills = ['Python', 'JavaScript', 'React'];
  const jobSkills = ['Python', 'Node.js', 'Express', 'MongoDB'];
  const result = await skillEmbeddings.computeSemanticSkillMatch(userSkills, jobSkills);
  
  if (result.score < 30 || result.score > 100) {
    throw new Error(`Invalid score: ${result.score}`);
  }
  if (!Array.isArray(result.matches)) {
    throw new Error('Matches not an array');
  }
});

test('Skill Embeddings: Get skill recommendations', () => {
  const skills = ['Python', 'JavaScript'];
  const recommendations = skillEmbeddings.getSkillRecommendations(skills);
  
  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    throw new Error('No recommendations generated');
  }
  if (recommendations.includes('Python') || recommendations.includes('JavaScript')) {
    throw new Error('Recommendations include input skills');
  }
});

test('Skill Embeddings: Batch compute embeddings', async () => {
  const skills = ['React', 'Vue', 'Python'];
  const embeddings = await skillEmbeddings.batchComputeEmbeddings(skills);
  
  if (Object.keys(embeddings).length !== skills.length) {
    throw new Error('Not all skills embedded');
  }
  if (!embeddings['React'].vector || embeddings['React'].vector.length !== 100) {
    throw new Error('Invalid embedding vector');
  }
});

// ============= DEMAND FORECASTING TESTS =============

test('Demand Forecasting: Forecast role demand', async () => {
  const forecast = await demandForecasting.forecastRoleDemand('Software Developer', 4);
  
  if (forecast.error) {
    throw new Error(forecast.error);
  }
  if (!forecast.forecast || forecast.forecast.length !== 4) {
    throw new Error('Invalid forecast length');
  }
  if (forecast.forecast[0].predictedPostingCount <= 0) {
    throw new Error('Invalid posting count');
  }
});

test('Demand Forecasting: Forecast salary trends', async () => {
  const forecast = await demandForecasting.forecastSalaryTrend('Software Developer', 'US', 4);
  
  if (forecast.error) {
    throw new Error(forecast.error);
  }
  if (!forecast.forecast || forecast.forecast.length !== 4) {
    throw new Error('Invalid forecast length');
  }
  if (forecast.forecast[0].predictedSalaryMin <= 0) {
    throw new Error('Invalid salary prediction');
  }
});

test('Demand Forecasting: Detect emerging skills', async () => {
  const emerging = await demandForecasting.detectEmergingSkills(20);
  
  if (!Array.isArray(emerging)) {
    throw new Error('Emerging skills not an array');
  }
  // Should have some emerging skills even if synthetic
  if (emerging.length === 0) {
    console.warn('   Warning: No emerging skills detected');
  }
});

test('Demand Forecasting: Get market insights', async () => {
  const insights = await demandForecasting.getMarketInsights('Software Developer', 'San Francisco');
  
  if (insights.error) {
    throw new Error(insights.error);
  }
  if (!insights.demandOutlook || !insights.salaryOutlook) {
    throw new Error('Missing demand or salary outlook');
  }
});

// ============= NLP TREND DETECTION TESTS =============

test('NLP Trend Detection: Extract skills from text', () => {
  const text = 'We are looking for a Senior Python developer with React experience and AWS deployment knowledge';
  const skills = trendDetection.extractSkillsFromText(text);
  
  if (!skills.includes('Python') || !skills.includes('React') || !skills.includes('AWS')) {
    throw new Error(`Missing expected skills. Got: ${skills.join(', ')}`);
  }
});

test('NLP Trend Detection: Analyze job description', () => {
  const description = 'Seeking a full-stack developer with expertise in Node.js, MongoDB, and JavaScript';
  const analysis = trendDetection.analyzeJobDescription(description);
  
  if (!analysis.skillsFound || analysis.skillsFound.length === 0) {
    throw new Error('No skills found in analysis');
  }
  if (!analysis.categories) {
    throw new Error('Missing skill categories');
  }
});

test('NLP Trend Detection: Calculate skill trend', () => {
  const historicalData = [10, 12, 15, 18, 22, 27, 33, 40]; // Growing trend
  const trend = trendDetection.calculateSkillTrend(historicalData);
  
  if (trend.trend !== 'emerging' && trend.trend !== 'growing') {
    throw new Error(`Expected growing trend, got: ${trend.trend}`);
  }
  if (trend.growthRate <= 0) {
    throw new Error(`Expected positive growth rate, got: ${trend.growthRate}`);
  }
});

test('NLP Trend Detection: Detect emerging skills from jobs', async () => {
  const jobs = [
    { id: 1, title: 'ML Engineer', description: 'LangChain, YOLO v8, transformers' },
    { id: 2, title: 'Backend Dev', description: 'Python, FastAPI, LangChain' },
  ];
  const result = await trendDetection.detectEmergingSkillsFromJobs(jobs);
  
  if (result.error) {
    throw new Error(result.error);
  }
  if (!result.allSkills || result.allSkills.length === 0) {
    throw new Error('No skills detected');
  }
});

// ============= COLLABORATIVE FILTERING TESTS =============

test('Collaborative Filtering: Find similar users', async () => {
  const userProfile = {
    id: 'user1',
    skills: ['Python', 'JavaScript'],
    location: 'San Francisco',
    qualification: 'B.Tech',
    designation: 'Software Developer',
  };
  
  const similar = await collaborativeFiltering.findSimilarUsers(userProfile, 5);
  // Result might be empty if no other users in DB, but should return array
  if (!Array.isArray(similar)) {
    throw new Error('Similar users not an array');
  }
});

test('Collaborative Filtering: Record pathway interaction', async () => {
  const result = await collaborativeFiltering.recordPathwayInteraction('user1', 1, {
    score: 85,
    completed: true,
    jobLanded: true,
    placementTimeDays: 30,
  });
  
  // Result may fail if tables don't exist, but should return success/error object
  if (!Object.prototype.hasOwnProperty.call(result, 'success')) {
    throw new Error('Missing success property');
  }
});

// ============= RESUME-TO-JD SIMILARITY TESTS =============

test('Resume-to-JD Similarity: Compute basic similarity', async () => {
  const resume = 'Senior Software Engineer with 5 years Python and JavaScript experience. AWS certified.';
  const jd = 'Senior developer needed with 4+ years Python, JavaScript, and AWS expertise';
  
  const similarity = await resumeMatcher.computeResumeSimilarity(resume, jd);
  
  if (similarity.score < 40 || similarity.score > 100) {
    throw new Error(`Invalid similarity score: ${similarity.score}`);
  }
  if (similarity.recommendation !== 'strong_match' && similarity.recommendation !== 'moderate_match') {
    throw new Error(`Unexpected recommendation: ${similarity.recommendation}`);
  }
});

test('Resume-to-JD Similarity: Extract resume insights', () => {
  const resume = `
    John Doe
    Senior Software Engineer
    10 years experience
    Bachelor of Science in Computer Science
    AWS Certified, CISSP, PMP
    Skills: Python, Java, Docker, Kubernetes
  `;
  
  const insights = resumeMatcher.getResumeInsights(resume);
  
  if (insights.textLength === 0 || insights.tokenCount === 0) {
    throw new Error('Invalid text analysis');
  }
});

test('Resume-to-JD Similarity: Batch compute for multiple jobs', async () => {
  const resume = 'Python and JavaScript developer with React experience';
  const jobs = [
    { id: 1, title: 'Frontend Dev', description: 'React, JavaScript' },
    { id: 2, title: 'Backend Dev', description: 'Python, Django' },
  ];
  
  const results = await resumeMatcher.batchComputeResumeSimilarity(resume, jobs);
  
  if (!Array.isArray(results) || results.length !== jobs.length) {
    throw new Error('Invalid batch results');
  }
  if (!results[0].jobTitle) {
    throw new Error('Missing job information in results');
  }
});

test('Resume-to-JD Similarity: Rank jobs by resume match', async () => {
  const resume = 'Experienced full-stack developer: Python, JavaScript, React, Node.js';
  const jobs = [
    { id: 1, title: 'Full-stack Dev', description: 'Python, JavaScript, React, Node.js required' },
    { id: 2, title: 'DevOps Engineer', description: 'Docker, Kubernetes, AWS, Linux' },
    { id: 3, title: 'Frontend Dev', description: 'React, Vue, Angular required' },
  ];
  
  const ranking = await resumeMatcher.rankJobsByResumeMatch(resume, jobs, 10);
  
  if (!ranking.matches || ranking.matches.length === 0) {
    throw new Error('No matches returned');
  }
  if (ranking.matches[0].jobTitle !== 'Full-stack Dev') {
    throw new Error('Top match should be Full-stack Dev');
  }
});

// ============= INTEGRATION TEST =============

test('Full Integration: Career insights pipeline', async () => {
  const userProfile = {
    id: 'user_integration_test',
    skills: ['Python', 'JavaScript', 'React'],
    location: 'US',
    qualification: 'B.Tech',
    designation: 'Full-stack Developer',
  };
  
  const jobs = [
    {
      id: 1,
      title: 'Senior Full-stack Engineer',
      description: 'We need Python, JavaScript, React expertise. AWS and Docker knowledge preferred.',
      company: 'TechCorp',
    },
  ];
  
  // 1. Semantic skill matching
  const jobSkills = trendDetection.extractSkillsFromText(jobs[0].description);
  const semanticMatch = await skillEmbeddings.computeSemanticSkillMatch(userProfile.skills, jobSkills);
  
  if (semanticMatch.score <= 0) {
    throw new Error('Semantic matching failed');
  }
  
  // 2. Resume matching
  const resume = `${userProfile.designation} with Python, JavaScript, React experience`;
  const resumeMatch = await resumeMatcher.computeResumeSimilarity(resume, jobs[0].description);
  
  if (resumeMatch.score <= 0) {
    throw new Error('Resume matching failed');
  }
  
  // 3. Demand insights
  const demandInsights = await demandForecasting.getMarketInsights(userProfile.designation, userProfile.location);
  
  if (demandInsights.error) {
    throw new Error('Demand forecasting failed');
  }
  
  // 4. Verify combined score logic
  const combinedScore = (semanticMatch.score * 0.4 + resumeMatch.score * 0.3 + 30) / 1; // Simplified
  if (combinedScore <= 0 || combinedScore > 100) {
    throw new Error(`Invalid combined score: ${combinedScore}`);
  }
});

// Run all tests
run().catch(err => {
  console.error('❌ Test suite error:', err);
  process.exit(1);
});
