/**
 * Career Analytics API Route
 * 
 * Exposes AI/ML-driven insights including:
 * - Semantic skill matching with embeddings
 * - Demand forecasting and market trends
 * - Personalized pathway recommendations
 * - Skill trend detection
 * - Resume-to-JD similarity matching
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { expensiveFeatureLimiter } from '../middleware/apiRateLimiter.js';
import skillEmbeddings from '../services/aimlSkillEmbeddings.js';
import demandForecasting from '../services/aimlDemandForecasting.js';
import collaborativeFiltering from '../services/aimlCollaborativeFiltering.js';
import trendDetection from '../services/aimlTrendDetection.js';
import resumeMatcher from '../services/aimlResumeJdMatcher.js';
import { InterviewAnalyticsService } from '../services/interviewAnalyticsService.js';
import { supabaseAdmin } from '../db/supabaseClient.js';

const router = express.Router();

/**
 * GET /api/career/insights
 * Get comprehensive AI/ML-driven career insights for a user
 */
router.get('/insights', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Get user's job search history
    const { data: jobs } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .limit(100);

    // Get AI/ML insights in parallel
    const insights = await Promise.all([
      // Skill embeddings - semantic matches
      skillEmbeddings.computeSemanticSkillMatch(
        profile.skills || [],
        (jobs || []).flatMap(j => trendDetection.extractSkillsFromText(j.description || j.title))
      ),
      
      // Demand forecasting - market trends
      demandForecasting.getMarketInsights(
        profile.designation || 'Software Developer',
        profile.location
      ),
      
      // Emerging skills detection
      trendDetection.detectEmergingSkillsFromJobs(jobs || []),
      
      // Skill recommendations
      Promise.resolve(skillEmbeddings.getSkillRecommendations(profile.skills || [])),
    ]);

    const [semanticMatches, marketInsights, emergingSkills, skillRecs] = insights;

    res.json({
      timestamp: new Date().toISOString(),
      userId,
      insights: {
        semanticSkillMatching: {
          score: semanticMatches.score,
          matches: semanticMatches.matches,
          coverage: semanticMatches.coverage,
          recommendation: semanticMatches.score >= 70 
            ? 'Strong skill alignment with market demand' 
            : semanticMatches.score >= 50
            ? 'Moderate skill alignment - consider learning recommended skills'
            : 'Limited skill alignment - upskilling recommended',
        },
        marketOutlook: marketInsights.error ? null : {
          demandTrend: marketInsights.demandOutlook?.trend,
          salaryProjection: marketInsights.salaryOutlook?.salaryMaxTrend,
          emergingSkills: marketInsights.emergingSkillsForRole,
        },
        emergingSkills: emergingSkills.error ? null : emergingSkills.emergingSkills?.slice(0, 10),
        recommendedSkillsToLearn: skillRecs.slice(0, 5),
      },
    });
  } catch (err) {
    console.error('Error in /career/insights:', err);
    res.status(500).json({ error: 'Failed to load career insights' });
  }
});

/**
 * GET /api/career/skill-semantic-matches
 * Get semantically similar skills using embeddings
 */
router.get('/skill-semantic-matches', expensiveFeatureLimiter, authenticateToken, async (req, res) => {
  try {
    const { skill, candidates } = req.query;
    if (!skill || !candidates) {
      return res.status(400).json({ error: 'Missing skill or candidates parameter' });
    }
    if (String(skill).length > 200) {
      return res.status(400).json({ error: 'Skill is too long' });
    }

    const candidateList = typeof candidates === 'string' 
      ? candidates.split(',') 
      : candidates;
    if (!Array.isArray(candidateList) || candidateList.length > 100 ||
        candidateList.some((candidate) => String(candidate).length > 200)) {
      return res.status(400).json({ error: 'Too many or oversized candidate skills' });
    }

    const matches = await skillEmbeddings.findSimilarSkills(skill, candidateList, 0.5);

    res.json({
      userSkill: skill,
      matches: matches.map(m => ({
        skill: m.skill,
        similarity: Math.round(m.similarity * 100),
        matched: m.matched,
      })),
    });
  } catch (err) {
    console.error('Error in /career/skill-semantic-matches:', err);
    res.status(500).json({ error: 'Failed to find skill semantic matches' });
  }
});

/**
 * GET /api/career/demand-forecast
 * Get demand forecasting for a specific role
 */
router.get('/demand-forecast', expensiveFeatureLimiter, authenticateToken, async (req, res) => {
  try {
    const { role, location } = req.query;
    if (!role) {
      return res.status(400).json({ error: 'Role parameter required' });
    }
    if (String(role).length > 200 || (location && String(location).length > 200)) {
      return res.status(400).json({ error: 'Role or location is too long' });
    }

    const forecast = await demandForecasting.forecastRoleDemand(role, 4);
    const salary = await demandForecasting.forecastSalaryTrend(role, location, 4);

    res.json({
      role,
      location: location || 'global',
      timestamp: new Date().toISOString(),
      demandForecast: forecast,
      salaryForecast: salary,
    });
  } catch (err) {
    console.error('Error in /career/demand-forecast:', err);
    res.status(500).json({ error: 'Failed to fetch demand forecast' });
  }
});

/**
 * GET /api/career/skill-trends
 * Get emerging and declining skill trends
 */
router.get('/skill-trends', expensiveFeatureLimiter, authenticateToken, async (req, res) => {
  try {
    const { threshold } = req.query;
    const emergingSkills = await demandForecasting.detectEmergingSkills(
      parseInt(threshold) || 20
    );

    res.json({
      timestamp: new Date().toISOString(),
      threshold: parseInt(threshold) || 20,
      emergingSkills: emergingSkills.slice(0, 20),
      statistics: {
        total: emergingSkills.length,
        highGrowth: emergingSkills.filter(s => s.growthRate > 50).length,
      },
    });
  } catch (err) {
    console.error('Error in /career/skill-trends:', err);
    res.status(500).json({ error: 'Failed to fetch skill trends' });
  }
});

/**
 * GET /api/career/recommended-pathways
 * Get personalized pathway recommendations
 */
router.get('/recommended-pathways', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    // Get user's pathway interactions
    const { data: interactions } = await supabaseAdmin
      .from('career_user_pathway_interactions')
      .select('*')
      .eq('user_id', userId);

    // Get hybrid recommendations
    const recommendations = await collaborativeFiltering.getHybridPathwayRecommendations(
      profile,
      interactions || [],
      10
    );

    res.json({
      userId,
      recommendations: {
        method: recommendations.method,
        pathways: recommendations.pathways,
        sources: recommendations.sources,
      },
    });
  } catch (err) {
    console.error('Error in /career/recommended-pathways:', err);
    res.status(500).json({ error: 'Failed to fetch recommended pathways' });
  }
});

/**
 * POST /api/career/resume-match
 * Match resume against job description
 */
router.post('/resume-match', expensiveFeatureLimiter, authenticateToken, async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    if (!resumeText || !jobDescription) {
      return res.status(400).json({ error: 'Missing resumeText or jobDescription' });
    }
    if (typeof resumeText !== 'string' || typeof jobDescription !== 'string' ||
        resumeText.length > 100000 || jobDescription.length > 100000) {
      return res.status(400).json({ error: 'Resume or job description is too long' });
    }

    const similarity = await resumeMatcher.computeResumeSimilarity(resumeText, jobDescription);

    res.json({
      timestamp: new Date().toISOString(),
      ...similarity,
    });
  } catch (err) {
    console.error('Error in /career/resume-match:', err);
    res.status(500).json({ error: 'Failed to calculate resume match' });
  }
});

/**
 * POST /api/career/batch-resume-match
 * Match resume against multiple job descriptions
 */
router.post('/batch-resume-match', expensiveFeatureLimiter, authenticateToken, async (req, res) => {
  try {
    const { resumeText, jobs } = req.body;
    if (!resumeText || !jobs || !Array.isArray(jobs)) {
      return res.status(400).json({ error: 'Missing or invalid resumeText or jobs' });
    }
    if (typeof resumeText !== 'string' || resumeText.length > 100000 ||
        jobs.length === 0 || jobs.length > 20) {
      return res.status(400).json({ error: 'Resume or jobs payload is too large' });
    }

    const ranked = await resumeMatcher.rankJobsByResumeMatch(resumeText, jobs, 20);

    res.json({
      timestamp: new Date().toISOString(),
      ...ranked,
    });
  } catch (err) {
    console.error('Error in /career/batch-resume-match:', err);
    res.status(500).json({ error: 'Failed to process batch resume match' });
  }
});

/**
 * GET /api/career/resume-insights
 * Get insights about a resume text
 */
router.post('/resume-insights', expensiveFeatureLimiter, authenticateToken, (req, res) => {
  try {
    const { resumeText } = req.body;
    if (!resumeText) {
      return res.status(400).json({ error: 'Missing resumeText' });
    }
    if (typeof resumeText !== 'string' || resumeText.length > 100000) {
      return res.status(400).json({ error: 'Resume text is too long' });
    }

    const insights = resumeMatcher.getResumeInsights(resumeText);

    res.json({
      timestamp: new Date().toISOString(),
      insights,
    });
  } catch (err) {
    console.error('Error in /career/resume-insights:', err);
    res.status(500).json({ error: 'Failed to fetch resume insights' });
  }
});

/**
 * GET /api/career/trending-skills
 * Get trending skills from job market analysis
 */
router.get('/trending-skills', expensiveFeatureLimiter, authenticateToken, async (req, res) => {
  try {
    const { data: jobs } = await supabaseAdmin
      .from('jobs')
      .select('id, title, description, company')
      .order('created_at', { ascending: false })
      .limit(500);

    const trends = await trendDetection.detectEmergingSkillsFromJobs(jobs || []);

    res.json({
      timestamp: new Date().toISOString(),
      ...trends,
    });
  } catch (err) {
    console.error('Error in /career/trending-skills:', err);
    res.status(500).json({ error: 'Failed to fetch trending skills' });
  }
});

/**
 * POST /api/career/pathway-interaction
 * Record user interaction with a pathway
 */
router.post('/pathway-interaction', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { pathwayId, engagementSignal } = req.body;
    if (!pathwayId || !engagementSignal) {
      return res.status(400).json({ error: 'Missing pathwayId or engagementSignal' });
    }

    const result = await collaborativeFiltering.recordPathwayInteraction(
      userId,
      pathwayId,
      engagementSignal
    );

    if (result.success) {
      res.json({ success: true, message: 'Interaction recorded' });
    } else {
      res.status(500).json({ error: 'Failed to record pathway interaction' });
    }
  } catch (err) {
    console.error('Error in /career/pathway-interaction:', err);
    res.status(500).json({ error: 'Failed to record pathway interaction' });
  }
});

/**
 * GET /api/career/roadmap
 * POST /api/career/roadmap
 * Generate dynamic 4-week AI Career Roadmap based on historical interview performance
 */
router.post('/roadmap', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const rawRole = req.body?.targetRole;
    const rawCompany = req.body?.targetCompany;
    const sanitizedOptions = {
      ...(req.body && typeof req.body === 'object' ? req.body : {}),
      targetRole: typeof rawRole === 'string' ? rawRole.trim().slice(0, 100) : undefined,
      targetCompany: typeof rawCompany === 'string' ? rawCompany.trim().slice(0, 100) : undefined,
    };

    const roadmap = await InterviewAnalyticsService.generatePersonalizedRoadmap(userId, sanitizedOptions);
    res.json({ success: true, roadmap });
  } catch (err) {
    console.error('Error generating career roadmap:', err);
    res.status(500).json({ error: 'Failed to generate career roadmap' });
  }
});

router.get('/roadmap', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const rawRole = req.query?.targetRole;
    const rawCompany = req.query?.targetCompany;
    const sanitizedOptions = {
      ...(req.query && typeof req.query === 'object' ? req.query : {}),
      targetRole: typeof rawRole === 'string' ? rawRole.trim().slice(0, 100) : undefined,
      targetCompany: typeof rawCompany === 'string' ? rawCompany.trim().slice(0, 100) : undefined,
    };

    const roadmap = await InterviewAnalyticsService.generatePersonalizedRoadmap(userId, sanitizedOptions);
    res.json({ success: true, roadmap });
  } catch (err) {
    console.error('Error fetching career roadmap:', err);
    res.status(500).json({ error: 'Failed to fetch career roadmap' });
  }
});

/**
 * POST /api/career/jd-prep-plan
 * Matches JD with user skills/resume and generates targeted practice schedule & questions
 */
router.post('/jd-prep-plan', expensiveFeatureLimiter, authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { jobDescription, targetRole = 'Software Engineer', company = 'Target Company' } = req.body;

    if (!jobDescription || typeof jobDescription !== 'string') {
      return res.status(400).json({ error: 'jobDescription is required' });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('skills, experience_summary, bio')
      .eq('id', userId)
      .maybeSingle();

    const userText = [
      Array.isArray(profile?.skills) ? profile.skills.join(', ') : (profile?.skills || ''),
      profile?.experience_summary || '',
      profile?.bio || ''
    ].join(' ');

    const matchResult = await resumeMatcher.matchResumeToJd(userText || 'Software Developer', jobDescription);

    const prepPlan = {
      targetRole,
      company,
      overallFitScore: matchResult.similarityScore || 72,
      keywordMatches: matchResult.topMatchingKeywords || [],
      missingCompetencies: matchResult.missingKeywords || [],
      tailoredQuestions: [
        `How have you applied ${matchResult.topMatchingKeywords?.[0] || 'core technologies'} in previous high-scale projects?`,
        `Walk me through an architectural challenge you solved that relates to ${targetRole} requirements.`,
        `How would you ramp up on ${matchResult.missingKeywords?.[0] || 'emerging tooling'} within your first 30 days at ${company}?`
      ],
      recommendedModules: [
        { name: 'System Design Scaling', track: 'system-design' },
        { name: 'Advanced DSA Problem Patterns', track: 'dsa' },
        { name: `${company} Mock Interview Simulation`, track: 'company-prep' }
      ]
    };

    res.json({ success: true, prepPlan });
  } catch (err) {
    console.error('Error in /career/jd-prep-plan:', err);
    res.status(500).json({ error: 'Failed to generate JD prep plan' });
  }
});

export default router;
