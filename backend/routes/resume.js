import express from 'express';
import multer from 'multer';
import Groq from 'groq-sdk';
import pdf from 'pdf-parse';
import { authenticateToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../db/supabaseClient.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const groq = process.env.GROQ_API_KEY ? new Groq({
  apiKey: process.env.GROQ_API_KEY,
}) : null;

function buildFallbackResumeProfile(resumeText, analysisData = {}) {
  const lines = String(resumeText || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const projectHighlights = lines
    .filter(line => /project|intern|built|developed|implemented|designed|created/i.test(line))
    .slice(0, 3);

  const coreSkills = [
    ...(analysisData?.keywordMatch?.technical || []),
    ...(analysisData?.keywordMatch?.soft || []),
  ].slice(0, 8);

  return {
    candidateHeadline: lines[0] || 'Student candidate with project-based experience',
    coreSkills,
    projectHighlights,
    likelyQuestionAreas: [
      'projects mentioned on the resume',
      'technical choices and trade-offs',
      'ownership and collaboration examples',
    ],
    summary: `Focus on the candidate's listed projects, skills, and measurable outcomes. ${projectHighlights[0] || ''}`.trim(),
  };
}

router.post('/analyze', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    let resumeText = req.body.resumeText;
    
    if (req.file) {
      if (req.file.mimetype === 'application/pdf') {
        const data = await pdf(req.file.buffer);
        resumeText = data.text;
      } else {
        resumeText = req.file.buffer.toString('utf-8');
      }
    }

    if (!resumeText) {
      return res.status(400).json({ error: 'Resume text is required' });
    }

    let analysisData;
    let resumeProfile;

    if (!groq) {
      analysisData = {
        atsScore: 75,
        strengths: [
          'Clear work experience section',
          'Relevant technical skills listed',
          'Quantifiable achievements included'
        ],
        weaknesses: [
          'Missing action verbs in some bullet points',
          'Could include more keywords relevant to target roles',
          'Summary section could be more impactful'
        ],
        suggestions: [
          'Add more industry-specific keywords',
          'Use stronger action verbs like "architected", "implemented", "optimized"',
          'Include metrics and numbers to demonstrate impact',
          'Ensure consistent formatting throughout'
        ],
        keywordMatch: {
          technical: ['Python', 'JavaScript', 'React', 'Node.js'],
          soft: ['Leadership', 'Communication', 'Problem-solving'],
          missing: ['Cloud computing', 'CI/CD', 'Agile']
        }
      };
      resumeProfile = buildFallbackResumeProfile(resumeText, analysisData);
    } else {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are an expert resume analyst and ATS specialist. 
            Analyze the resume and provide:
            1. ATS score (0-100)
            2. Strengths (array of strings)
            3. Weaknesses (array of strings)
            4. Specific suggestions for improvement (array of strings)
            5. Keyword analysis (object with technical, soft, and missing keywords)
            6. Interview-ready candidate profile for a mock interviewer
            
            Format as JSON with fields: atsScore, strengths, weaknesses, suggestions, keywordMatch, interviewProfile.
            interviewProfile must include: candidateHeadline, coreSkills (array), projectHighlights (array), likelyQuestionAreas (array), summary.
            Keep interviewProfile concise and useful for generating personalized interview questions.
            Respond ONLY with valid JSON.`
          },
          {
            role: 'user',
            content: `Analyze this resume:\n\n${resumeText}`
          }
        ],
        response_format: { type: 'json_object' }
      });

      analysisData = JSON.parse(completion.choices[0].message.content);
      resumeProfile = analysisData.interviewProfile || buildFallbackResumeProfile(resumeText, analysisData);
    }

    const { data: analysis, error } = await supabaseAdmin
      .from('resume_analyses')
      .insert({
        user_id: req.user.id,
        resume_text: resumeText,
        ats_score: analysisData.atsScore,
        strengths: analysisData.strengths,
        weaknesses: analysisData.weaknesses,
        suggestions: analysisData.suggestions,
        keyword_match: analysisData.keywordMatch
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      analysis: analysisData,
      id: analysis.id,
      resumeText,
      resumeProfile
    });
  } catch (error) {
    console.error('Resume analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze resume' });
  }
});

router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('resume_analyses')
      .select('id, ats_score, analyzed_at')
      .eq('user_id', req.user.id)
      .order('analyzed_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    res.json({ analyses: data || [] });
  } catch (error) {
    console.error('Error fetching resume history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

router.get('/latest', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('resume_analyses')
      .select('*')
      .eq('user_id', req.user.id)
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'No saved resume found' });
    }

    const resumeProfile = buildFallbackResumeProfile(data.resume_text, {
      keywordMatch: data.keyword_match,
    });

    res.json({
      analysis: data,
      resumeText: data.resume_text,
      resumeProfile,
    });
  } catch (error) {
    console.error('Error fetching latest resume:', error);
    res.status(500).json({ error: 'Failed to fetch latest resume' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabaseAdmin
      .from('resume_analyses')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json({ analysis: data });
  } catch (error) {
    console.error('Error fetching analysis:', error);
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

export default router;
