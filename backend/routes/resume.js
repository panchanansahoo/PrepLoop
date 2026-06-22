import express from 'express';
import Groq from 'groq-sdk';
import { createRequire } from 'module';
import { authenticateToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { aiCallWithRetry } from '../utils/aiClient.js';
import multer from 'multer';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

// Multer memory storage for resume uploads
const resumeUploader = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();

const groq = process.env.GROQ_API_KEY ? new Groq({
  apiKey: process.env.GROQ_API_KEY,
}) : null;

// ── Detailed AI Prompt for Accurate Resume Analysis ──
const RESUME_ANALYSIS_SYSTEM_PROMPT = `You are an elite ATS (Applicant Tracking System) expert and senior technical recruiter with 15+ years of experience reviewing resumes for Fortune 500 companies.

Your task is to perform a THOROUGH, ACCURATE, and BRUTALLY HONEST analysis of the resume provided. Do NOT inflate scores — be realistic.

## SCORING RUBRIC (each category 0-100):

### 1. FORMAT & STRUCTURE (20% of total)
- Clean, consistent formatting (no tables, columns, headers/footers that confuse ATS)
- Proper section headings: Contact, Summary, Experience, Education, Skills, Projects, Certifications
- Reverse chronological order for experience
- Bullet points (not paragraphs) for achievements
- Appropriate length (1 page for <5 yrs exp, 2 pages for 5-15 yrs)
- No images, graphics, special characters, or fancy formatting
- Consistent font, spacing, and date formats

### 2. CONTENT QUALITY (25% of total)
- Strong professional summary/objective (not generic)
- Each role has: Company, Title, Dates, Location, 3-6 bullet points
- Bullet points start with strong ACTION VERBS (Led, Built, Designed, Optimized, etc.)
- Achievements are SPECIFIC and QUANTIFIED (%, $, numbers, timeframes)
- Relevant certifications and education details
- Projects section with tech stack and impact described
- No spelling/grammar errors, no first-person pronouns

### 3. KEYWORD OPTIMIZATION (25% of total)
- Presence of industry-standard technical keywords
- Job-title relevant terminology
- Hard skills explicitly listed (programming languages, tools, frameworks)
- Soft skills demonstrated through achievements (not just listed)
- Missing critical keywords for the candidate's apparent target role

### 4. IMPACT & ACHIEVEMENTS (20% of total)
- Results-oriented bullet points (not task descriptions)
- Quantified outcomes (revenue, cost savings, efficiency, scale)
- Demonstrated progression/growth
- Leadership and ownership examples
- Problem → Action → Result (PAR) format used

### 5. ATS COMPATIBILITY (10% of total)
- Standard section headings that ATS systems recognize
- No complex formatting (tables, columns, text boxes)
- Contact info at the top (not in header/footer)
- Standard file format friendly
- Keywords match common job descriptions

## OVERALL ATS SCORE CALCULATION:
atsScore = (formatScore * 0.20) + (contentScore * 0.25) + (keywordScore * 0.25) + (impactScore * 0.20) + (atsCompatScore * 0.10)

## IMPORTANT RULES:
- A completely blank or gibberish resume = score 0-10
- A resume with just a name and some text = score 15-30
- A mediocre student resume with basic info = score 35-55
- A decent professional resume = score 55-75
- A well-optimized resume = score 75-90
- Near-perfect ATS-optimized resume = score 90-100
- Most resumes should score between 40-75. DO NOT default to 75.
- Be SPECIFIC in your feedback — reference actual content from the resume.

## SECTION-BY-SECTION ANALYSIS:
For each detected section, provide:
- sectionName: The name of the section
- score: 0-100 score for that section
- status: "strong" | "needs_work" | "missing" | "weak"
- feedback: Specific, actionable feedback referencing resume content

## RESPONSE FORMAT (strict JSON):
{
  "atsScore": <number 0-100>,
  "scoreBreakdown": {
    "format": { "score": <0-100>, "feedback": "<specific feedback>" },
    "content": { "score": <0-100>, "feedback": "<specific feedback>" },
    "keywords": { "score": <0-100>, "feedback": "<specific feedback>" },
    "impact": { "score": <0-100>, "feedback": "<specific feedback>" },
    "atsCompat": { "score": <0-100>, "feedback": "<specific feedback>" }
  },
  "sectionAnalysis": [
    { "sectionName": "Contact Information", "score": <0-100>, "status": "strong|needs_work|missing|weak", "feedback": "..." },
    { "sectionName": "Professional Summary", "score": <0-100>, "status": "...", "feedback": "..." },
    { "sectionName": "Work Experience", "score": <0-100>, "status": "...", "feedback": "..." },
    { "sectionName": "Education", "score": <0-100>, "status": "...", "feedback": "..." },
    { "sectionName": "Skills", "score": <0-100>, "status": "...", "feedback": "..." },
    { "sectionName": "Projects", "score": <0-100>, "status": "...", "feedback": "..." }
  ],
  "strengths": ["<specific strength referencing actual resume content>", ...],
  "weaknesses": ["<specific weakness referencing actual resume content>", ...],
  "suggestions": ["<actionable suggestion with priority and example>", ...],
  "keywordMatch": {
    "technical": ["<detected technical skill/tool>", ...],
    "soft": ["<detected soft skill>", ...],
    "missing": ["<important missing keyword for their target role>", ...],
    "industryFit": "<detected industry/role the resume targets>"
  },
  "interviewProfile": {
    "candidateHeadline": "<one-line summary: role + experience level + key strength>",
    "coreSkills": ["<top skill>", ...],
    "projectHighlights": ["<noteworthy project/achievement>", ...],
    "likelyQuestionAreas": ["<area an interviewer would probe>", ...],
    "summary": "<2-3 sentence interviewer briefing>"
  },
  "quickWins": ["<easy fix that would immediately boost the score>", ...]
}

Respond ONLY with valid JSON. No markdown, no explanation.`;

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

function buildStaticAnalysis(resumeText) {
  const text = String(resumeText || '').toLowerCase();
  const lines = text.split('\n').filter(l => l.trim());

  // Basic heuristic scoring for when AI is unavailable
  let formatScore = 40;
  let contentScore = 40;
  let keywordScore = 30;
  let impactScore = 30;
  let atsCompatScore = 50;

  // Check for common sections
  const hasContact = /email|phone|@|linkedin/i.test(text);
  const hasExperience = /experience|work history|employment/i.test(text);
  const hasEducation = /education|university|college|degree|bachelor|master/i.test(text);
  const hasSkills = /skills|technologies|proficiencies|tools/i.test(text);
  const hasProjects = /project|portfolio/i.test(text);
  const hasSummary = /summary|objective|profile|about/i.test(text);

  if (hasContact) formatScore += 10;
  if (hasExperience) { contentScore += 15; formatScore += 5; }
  if (hasEducation) { contentScore += 10; formatScore += 5; }
  if (hasSkills) { keywordScore += 15; formatScore += 5; }
  if (hasProjects) { contentScore += 10; impactScore += 10; }
  if (hasSummary) contentScore += 5;

  // Check for quantified achievements
  const numbers = (text.match(/\d+%|\$\d+|\d+ (users|customers|clients|projects|team)/gi) || []).length;
  impactScore += Math.min(numbers * 8, 30);

  // Check for action verbs
  const actionVerbs = ['led', 'built', 'designed', 'managed', 'developed', 'implemented', 'optimized', 'created', 'launched', 'improved'];
  const verbCount = actionVerbs.filter(v => text.includes(v)).length;
  contentScore += Math.min(verbCount * 5, 20);

  // Check for tech keywords
  const techKeywords = ['javascript', 'python', 'java', 'react', 'node', 'sql', 'aws', 'docker', 'git', 'api', 'html', 'css', 'typescript', 'mongodb', 'postgresql'];
  const foundTech = techKeywords.filter(k => text.includes(k));
  keywordScore += Math.min(foundTech.length * 5, 30);

  // Length check
  if (lines.length < 10) { formatScore -= 15; contentScore -= 10; }
  if (lines.length > 80) formatScore -= 5;

  // Cap scores
  formatScore = Math.min(Math.max(formatScore, 10), 95);
  contentScore = Math.min(Math.max(contentScore, 10), 95);
  keywordScore = Math.min(Math.max(keywordScore, 10), 95);
  impactScore = Math.min(Math.max(impactScore, 10), 95);
  atsCompatScore = Math.min(Math.max(atsCompatScore, 20), 95);

  const atsScore = Math.round(
    formatScore * 0.20 + contentScore * 0.25 + keywordScore * 0.25 +
    impactScore * 0.20 + atsCompatScore * 0.10
  );

  return {
    atsScore,
    scoreBreakdown: {
      format: { score: formatScore, feedback: 'AI analysis unavailable — basic structure check performed.' },
      content: { score: contentScore, feedback: 'AI analysis unavailable — basic content check performed.' },
      keywords: { score: keywordScore, feedback: 'AI analysis unavailable — basic keyword scan performed.' },
      impact: { score: impactScore, feedback: 'AI analysis unavailable — basic impact check performed.' },
      atsCompat: { score: atsCompatScore, feedback: 'AI analysis unavailable — basic compatibility check performed.' },
    },
    sectionAnalysis: [
      { sectionName: 'Contact Information', score: hasContact ? 70 : 20, status: hasContact ? 'strong' : 'missing', feedback: hasContact ? 'Contact information detected.' : 'No contact information found. Add email, phone, and LinkedIn.' },
      { sectionName: 'Professional Summary', score: hasSummary ? 60 : 15, status: hasSummary ? 'needs_work' : 'missing', feedback: hasSummary ? 'Summary section detected.' : 'No professional summary found. Add a 2-3 line summary.' },
      { sectionName: 'Work Experience', score: hasExperience ? 60 : 15, status: hasExperience ? 'needs_work' : 'missing', feedback: hasExperience ? 'Experience section detected.' : 'No work experience section found.' },
      { sectionName: 'Education', score: hasEducation ? 65 : 20, status: hasEducation ? 'strong' : 'missing', feedback: hasEducation ? 'Education section detected.' : 'No education section found.' },
      { sectionName: 'Skills', score: hasSkills ? 60 : 15, status: hasSkills ? 'needs_work' : 'missing', feedback: hasSkills ? 'Skills section detected.' : 'No skills section found. Add a dedicated skills section.' },
      { sectionName: 'Projects', score: hasProjects ? 60 : 20, status: hasProjects ? 'needs_work' : 'missing', feedback: hasProjects ? 'Projects section detected.' : 'No projects section found. Add 2-3 relevant projects.' },
    ],
    strengths: [
      hasContact ? 'Contact information is present' : null,
      hasExperience ? 'Work experience section included' : null,
      hasSkills ? 'Skills section present' : null,
      foundTech.length > 3 ? `Multiple technical skills detected: ${foundTech.slice(0, 5).join(', ')}` : null,
      numbers > 0 ? 'Some quantified achievements found' : null,
    ].filter(Boolean).slice(0, 4),
    weaknesses: [
      !hasContact ? 'Missing contact information' : null,
      !hasSummary ? 'No professional summary section' : null,
      !hasExperience ? 'No work experience section' : null,
      numbers < 3 ? 'Few or no quantified achievements — add numbers and metrics' : null,
      verbCount < 3 ? 'Lacks strong action verbs (led, built, optimized, etc.)' : null,
      lines.length < 15 ? 'Resume content appears too sparse' : null,
    ].filter(Boolean).slice(0, 5),
    suggestions: [
      'Run this analysis again when AI services are available for a comprehensive review',
      numbers < 3 ? 'Add quantified achievements: percentages, dollar amounts, team sizes, timelines' : null,
      verbCount < 3 ? 'Start each bullet point with a strong action verb (Led, Built, Designed, Optimized)' : null,
      !hasSummary ? 'Add a 2-3 line professional summary at the top' : null,
      foundTech.length < 5 ? 'Add more relevant technical keywords from job descriptions' : null,
    ].filter(Boolean),
    keywordMatch: {
      technical: foundTech.map(k => k.charAt(0).toUpperCase() + k.slice(1)),
      soft: ['Communication', 'Problem-solving'].filter(s => text.includes(s.toLowerCase())),
      missing: techKeywords.filter(k => !text.includes(k)).slice(0, 6).map(k => k.charAt(0).toUpperCase() + k.slice(1)),
      industryFit: 'Technology / Software Development'
    },
    quickWins: [
      'Add a professional summary section',
      'Quantify at least 3 achievements with numbers',
      'Include relevant keywords from job descriptions',
    ]
  };
}

router.post('/analyze', authenticateToken, resumeUploader.single('resume'), async (req, res) => {
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

    // Truncate extremely long resumes to avoid token limits
    const truncatedText = resumeText.length > 8000 ? resumeText.slice(0, 8000) + '\n[... truncated for analysis]' : resumeText;

    let analysisData;
    let resumeProfile;

    if (!groq) {
      analysisData = buildStaticAnalysis(resumeText);
      resumeProfile = buildFallbackResumeProfile(resumeText, analysisData);
    } else {
      try {
        const completion = await aiCallWithRetry({
          operation: () => groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: RESUME_ANALYSIS_SYSTEM_PROMPT },
              { role: 'user', content: `Analyze this resume thoroughly and accurately. Be honest about the score — most resumes score 40-70. Reference specific content from the resume in your feedback.\n\n---BEGIN RESUME---\n${truncatedText}\n---END RESUME---` }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,  // Lower temperature for more consistent, factual analysis
            max_tokens: 4096,
          }),
          timeoutMs: 30000,   // 30s timeout for thorough analysis
          maxRetries: 2,
          baseDelayMs: 500
        });

        let parsed;
        try {
          const rawContent = completion.choices?.[0]?.message?.content || '';
          parsed = JSON.parse(rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, ''));
        } catch {
          parsed = null;
        }
        if (!parsed) {
          analysisData = buildStaticAnalysis(resumeText);
          resumeProfile = buildFallbackResumeProfile(resumeText, analysisData);
          return res.json({ analysis: analysisData, resumeText, resumeProfile });
        }

        // Validate and sanitize the AI response
        analysisData = {
          atsScore: Math.min(Math.max(Math.round(Number(parsed.atsScore) || 0), 0), 100),
          scoreBreakdown: parsed.scoreBreakdown || null,
          sectionAnalysis: Array.isArray(parsed.sectionAnalysis) ? parsed.sectionAnalysis : [],
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths.filter(Boolean) : [],
          weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.filter(Boolean) : [],
          suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.filter(Boolean) : [],
          keywordMatch: {
            technical: Array.isArray(parsed.keywordMatch?.technical) ? parsed.keywordMatch.technical : [],
            soft: Array.isArray(parsed.keywordMatch?.soft) ? parsed.keywordMatch.soft : [],
            missing: Array.isArray(parsed.keywordMatch?.missing) ? parsed.keywordMatch.missing : [],
            industryFit: parsed.keywordMatch?.industryFit || 'General',
          },
          quickWins: Array.isArray(parsed.quickWins) ? parsed.quickWins.filter(Boolean) : [],
          interviewProfile: parsed.interviewProfile || null,
        };
      } catch (aiError) {
        console.warn('Resume AI analysis failed, using heuristic fallback:', aiError?.message || aiError);
        analysisData = buildStaticAnalysis(resumeText);
      }

      resumeProfile = analysisData.interviewProfile || buildFallbackResumeProfile(resumeText, analysisData);
    }

    // Fix #7: store truncated text to avoid storing huge PII blobs
    const storedText = resumeText.length > 8000 ? resumeText.slice(0, 8000) + '\n[truncated]' : resumeText;

    // Store in database
    const { data: analysis, error } = await supabaseAdmin
      .from('resume_analyses')
      .insert({
        user_id: req.user.id,
        resume_text: storedText,
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

// ── Resume Generation AI Prompt ──
const RESUME_GENERATION_PROMPT = `You are an expert resume writer and ATS optimization specialist. Your task is to take the user's raw information and produce a polished, ATS-optimized, professional resume.

## YOUR GOALS:
1. Rewrite the professional summary to be compelling, concise (2-3 lines), and naturally keyword-rich
2. Transform work experience into powerful bullet points using the PAR (Problem → Action → Result) format
3. Start every bullet point with a strong ACTION VERB (Led, Built, Designed, Spearheaded, Orchestrated, etc.)
4. Add quantified metrics where possible (%, $, numbers) — if the user didn't provide exact numbers, use realistic estimates with "~" prefix
5. Structure education properly with degree, institution, dates, and relevant coursework/honors
6. Organize skills into categories (Languages, Frameworks, Tools, Databases, etc.)
7. Add a Projects section if relevant info is present
8. Ensure the resume would score 80+ on ATS systems

## RESPONSE FORMAT (strict JSON):
{
  "fullName": "<name>",
  "email": "<email>",
  "phone": "<phone>",
  "location": "<city, state if mentioned or empty string>",
  "linkedin": "<if mentioned or empty string>",
  "portfolio": "<if mentioned or empty string>",
  "summary": "<2-3 line polished professional summary>",
  "experience": [
    {
      "title": "<job title>",
      "company": "<company name>",
      "location": "<location or 'Remote'>",
      "startDate": "<start date>",
      "endDate": "<end date or 'Present'>",
      "bullets": ["<strong action verb + achievement with metrics>", ...]
    }
  ],
  "education": [
    {
      "degree": "<degree name>",
      "institution": "<university/college>",
      "location": "<location>",
      "graduationDate": "<date>",
      "gpa": "<if mentioned>",
      "highlights": ["<relevant coursework, honors, activities>"]
    }
  ],
  "skills": {
    "languages": ["<programming languages>"],
    "frameworks": ["<frameworks & libraries>"],
    "tools": ["<tools, platforms, services>"],
    "databases": ["<databases>"],
    "other": ["<other skills like methodologies, soft skills>"]
  },
  "projects": [
    {
      "name": "<project name>",
      "tech": "<tech stack used>",
      "description": "<1-line description>",
      "bullets": ["<achievement/feature with impact>"]
    }
  ],
  "certifications": ["<cert name — issuer, date>"],
  "atsScore": <estimated ATS score 0-100>
}

## RULES:
- If a field has no relevant input, use an empty array or empty string
- Every experience bullet MUST start with a past-tense action verb
- Experience bullets should be 1-2 lines, not paragraphs
- Be creative with realistic metrics if the user gave vague descriptions
- Skills should be real, industry-standard technology names
- Response must be valid JSON only — no markdown, no explanation`;

router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { fullName, email, phone, location, linkedin, summary, experience, education, skills, projects, awards, template } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ error: 'Full name and email are required' });
    }

    // ── Build rawInput for AI prompt (from structured or legacy data) ──
    const formatEducation = (edu) => {
      if (Array.isArray(edu)) return edu.map(e => `${e.institution || ''} | ${e.degree || ''} | ${e.location || ''} | ${e.dates || ''} | GPA: ${e.gpa || ''} | Coursework: ${e.coursework || ''}`).join('\n');
      return edu || 'Not provided';
    };
    const formatExperience = (exp) => {
      if (Array.isArray(exp)) return exp.map(e => `${e.title || ''} at ${e.company || ''} | ${e.location || ''} | ${e.dates || ''}\n${e.bullets || ''}`).join('\n\n');
      return exp || 'Not provided';
    };
    const formatProjects = (proj) => {
      if (Array.isArray(proj)) return proj.map(p => `${p.name || ''} | ${p.tech || ''} | ${p.dates || ''}\n${p.bullets || ''}`).join('\n\n');
      return proj || 'Not provided';
    };
    const formatAwards = (a) => {
      if (Array.isArray(a)) return a.filter(x => x?.trim()).join('\n');
      return a || 'Not provided';
    };

    const rawInput = `
Full Name: ${fullName}
Email: ${email}
Phone: ${phone || 'Not provided'}
Location: ${location || 'Not provided'}
LinkedIn: ${linkedin || 'Not provided'}
Professional Summary: ${summary || 'Not provided'}
Education:
${formatEducation(education)}
Skills: ${skills || 'Not provided'}
Work Experience:
${formatExperience(experience)}
Projects:
${formatProjects(projects)}
Leadership & Awards:
${formatAwards(awards)}
    `.trim();

    // ── Skill categorization helper ──
    const categorizeSkills = (skillStr) => {
      const all = skillStr ? skillStr.split(/[,\n]/).map(s => s.trim()).filter(Boolean) : [];
      const dbKeywords = ['sql', 'mysql', 'postgresql', 'postgres', 'mongodb', 'oracle', 'redis', 'sqlite', 'dynamodb', 'cassandra', 'mariadb', 'firebase', 'supabase', 'microsoft sql server', 'nosql', 'ssrs', 'ssis'];
      const toolKeywords = ['git', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'jira', 'jenkins', 'ci/cd', 'linux', 'power bi', 'tableau', 'excel', 'microsoft excel', 'jupyter', 'vscode', 'postman', 'figma', 'slack', 'terraform', 'ansible', 'spss', 'looker', 'visio', 'alteryx', 'hadoop', 'google analytics', 'sas', 'sap', 'sharepoint', 'power automate', 'powerapps'];
      const fwKeywords = ['react', 'angular', 'vue', 'next', 'express', 'django', 'flask', 'spring', 'node', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit', 'bootstrap', 'tailwind', '.net', 'laravel', 'rails', 'spark'];
      const langs = [], fws = [], tools = [], dbs = [], other = [];
      for (const s of all) {
        const lower = s.toLowerCase();
        if (dbKeywords.some(k => lower.includes(k))) dbs.push(s);
        else if (toolKeywords.some(k => lower.includes(k))) tools.push(s);
        else if (fwKeywords.some(k => lower.includes(k))) fws.push(s);
        else langs.push(s);
      }
      return { languages: langs, frameworks: fws, tools, databases: dbs, other };
    };

    // ── Build structured entries from form data ──
    const buildEducation = () => {
      if (Array.isArray(education)) {
        return education.filter(e => e.institution || e.degree).map(e => ({
          institution: e.institution || '',
          degree: e.degree || '',
          location: e.location || '',
          graduationDate: e.dates || '',
          gpa: e.gpa || '',
          highlights: e.coursework ? e.coursework.split(',').map(c => c.trim()).filter(Boolean) : []
        }));
      }
      // Legacy string fallback
      if (!education) return [];
      return [{ degree: education.split('\n')[0]?.trim() || education, institution: '', location: '', graduationDate: '', gpa: '', highlights: [] }];
    };

    const buildExperience = () => {
      if (Array.isArray(experience)) {
        return experience.filter(e => e.company || e.title).map(e => {
          const dates = e.dates ? e.dates.split(/[–-]/).map(d => d.trim()) : ['', 'Present'];
          return {
            company: e.company || '',
            title: e.title || '',
            location: e.location || '',
            startDate: dates[0] || '',
            endDate: dates[1] || 'Present',
            bullets: e.bullets ? e.bullets.split('\n').map(b => b.trim().replace(/^[•\-*]\s*/, '')).filter(Boolean) : ['Contributed to team objectives and project deliverables']
          };
        });
      }
      // Legacy string fallback
      if (!experience) return [];
      return experience.split('\n').filter(l => l.trim()).map(line => ({
        title: line.trim(), company: '', location: '', startDate: '', endDate: 'Present',
        bullets: ['Contributed to team objectives and project deliverables']
      }));
    };

    const buildProjects = () => {
      if (Array.isArray(projects)) {
        return projects.filter(p => p.name).map(p => ({
          name: p.name || '',
          tech: p.tech || '',
          dates: p.dates || '',
          description: '',
          bullets: p.bullets ? p.bullets.split('\n').map(b => b.trim().replace(/^[•\-*]\s*/, '')).filter(Boolean) : []
        }));
      }
      return [];
    };

    const buildAwards = () => {
      if (Array.isArray(awards)) return awards.filter(a => a?.trim());
      return [];
    };

    let generatedResume;

    if (!groq) {
      // Static fallback when AI is unavailable
      generatedResume = {
        fullName,
        email,
        phone: phone || '',
        location: location || '',
        linkedin: linkedin || '',
        portfolio: '',
        summary: summary || `Results-driven professional with a strong foundation in technical skills and a passion for delivering high-quality solutions.`,
        education: buildEducation(),
        skills: categorizeSkills(skills),
        experience: buildExperience(),
        projects: buildProjects(),
        certifications: buildAwards(),
        atsScore: 65
      };
    } else {
      try {
        const completion = await aiCallWithRetry({
          operation: () => groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: RESUME_GENERATION_PROMPT },
              { role: 'user', content: `Generate a professional, ATS-optimized resume from this information:\n\n${rawInput}` }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.4,
            max_tokens: 4096,
          }),
          timeoutMs: 30000,
          maxRetries: 2,
          baseDelayMs: 500
        });

        try {
          const rawContent = completion.choices?.[0]?.message?.content || '';
          generatedResume = JSON.parse(rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, ''));
        } catch {
          generatedResume = null;
        }
        if (!generatedResume) {
          generatedResume = {
            fullName, email, phone: phone || '', location: location || '', linkedin: linkedin || '', portfolio: '',
            summary: summary || 'Motivated professional seeking to leverage skills and experience.',
            education: buildEducation(), skills: categorizeSkills(skills), experience: buildExperience(),
            projects: buildProjects(), certifications: buildAwards(), atsScore: 55
          };
        }
        // Ensure projects have dates if provided in form
        if (Array.isArray(projects) && generatedResume.projects) {
          generatedResume.projects.forEach((p, i) => {
            if (projects[i]?.dates && !p.dates) p.dates = projects[i].dates;
          });
        }
      } catch (aiError) {
        console.warn('Resume generation AI failed, using fallback:', aiError?.message);
        generatedResume = {
          fullName,
          email,
          phone: phone || '',
          location: location || '',
          linkedin: linkedin || '',
          portfolio: '',
          summary: summary || `Motivated professional seeking to leverage skills and experience to drive results.`,
          education: buildEducation(),
          skills: categorizeSkills(skills),
          experience: buildExperience(),
          projects: buildProjects(),
          certifications: buildAwards(),
          atsScore: 55
        };
      }
    }

    // Fix #15: store a plain-text summary instead of raw JSON so /latest can parse it
    try {
      const storedText = `Generated resume for ${fullName} <${email}>`;
      await supabaseAdmin
        .from('resume_analyses')
        .insert({
          user_id: req.user.id,
          resume_text: storedText,
          ats_score: generatedResume.atsScore || 70,
          strengths: ['AI-generated professional resume'],
          weaknesses: [],
          suggestions: ['Review and personalize the generated content'],
          keyword_match: generatedResume.skills || {}
        });
    } catch (dbErr) {
      console.warn('Failed to save generated resume to DB:', dbErr?.message);
    }

    res.json({
      resume: generatedResume,
      template: template || 'modern',
    });
  } catch (error) {
    console.error('Resume generation error:', error);
    res.status(500).json({ error: 'Failed to generate resume' });
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

    const keywordMatch = data.keyword_match || {};
    let resumeText = data.resume_text || '';
    
    // Check if resumeText is a raw JSON string from before Fix #15
    try {
      if (typeof resumeText === 'string' && resumeText.trim().startsWith('{')) {
        const parsed = JSON.parse(resumeText);
        
        // Reconstruct a text representation that extractHeadline/Summary can parse
        let reconstructed = [];
        if (parsed.fullName) reconstructed.push(`Generated resume for ${parsed.fullName}`);
        if (parsed.currentRole || parsed.title) reconstructed.push(parsed.currentRole || parsed.title);
        if (parsed.summary || parsed.bio) reconstructed.push(parsed.summary || parsed.bio);
        if (Array.isArray(parsed.experience)) {
          parsed.experience.forEach(e => {
            if (e.title) reconstructed.push(e.title);
          });
        }
        
        resumeText = reconstructed.join('\n') || `Generated resume for ${parsed.fullName || 'User'}`;
      }
    } catch (e) {
      // Ignore parse errors, treat as regular text
    }
    
    const coreSkills = [
      ...(Array.isArray(keywordMatch.technical) ? keywordMatch.technical : []),
      ...(Array.isArray(keywordMatch.soft) ? keywordMatch.soft : [])
    ].filter(Boolean).slice(0, 12);

    const resumeProfile = {
      candidateHeadline: extractHeadline(resumeText),
      coreSkills,
      projectHighlights: extractProjects(resumeText),
      likelyQuestionAreas: extractExperienceAreas(resumeText),
      summary: extractSummary(resumeText)
    };

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

function extractHeadline(text) {
  const lines = String(text).split('\n').map(l => l.trim()).filter(Boolean);
  const roleKeywords = /engineer|developer|analyst|designer|manager|consultant|architect|scientist/i;
  for (const line of lines.slice(0, 10)) {
    if (roleKeywords.test(line) && line.length > 10 && line.length < 100) return line;
  }
  return lines[0] || 'Professional';
}

function extractProjects(text) {
  const lines = String(text).split('\n').map(l => l.trim()).filter(Boolean);
  return lines.filter(l => /project|built|developed|created|designed/i.test(l) && l.length > 20).slice(0, 3);
}

function extractExperienceAreas(text) {
  const areas = [];
  if (/react|vue|angular/i.test(text)) areas.push('Frontend development');
  if (/node|express|django|flask/i.test(text)) areas.push('Backend development');
  if (/aws|azure|docker|kubernetes/i.test(text)) areas.push('Cloud & DevOps');
  if (/sql|database|mongodb/i.test(text)) areas.push('Database design');
  return areas.slice(0, 4);
}

function extractSummary(text) {
  const lines = String(text).split('\n').map(l => l.trim()).filter(Boolean);
  const summaryLine = lines.find(l => l.length > 50 && l.length < 300 && !/^[A-Z][a-z]+ [A-Z]/.test(l));
  return summaryLine || lines.slice(0, 3).join(' ').slice(0, 200);
}

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

router.post('/import-linkedin', authenticateToken, (req, res) => {
  try {
    const { linkedinUrl: _linkedinUrl, profileData } = req.body;

    if (!profileData) {
      return res.status(400).json({ error: 'Profile data is required' });
    }

    const extractedData = {
      fullName: profileData.name || profileData.fullName || '',
      currentRole: profileData.headline || profileData.title || '',
      bio: profileData.summary || profileData.about || '',
      skills: Array.isArray(profileData.skills) 
        ? profileData.skills.join(', ') 
        : (profileData.skills || ''),
      experience: Array.isArray(profileData.experience)
        ? profileData.experience.map(exp => 
            `${exp.title || ''} at ${exp.company || ''} (${exp.duration || ''})`
          ).join('; ')
        : (profileData.experience || ''),
      education: Array.isArray(profileData.education)
        ? profileData.education.map(edu => 
            `${edu.degree || ''} from ${edu.school || ''}`
          ).join('; ')
        : (profileData.education || '')
    };

    res.json({
      success: true,
      profileData: extractedData,
      message: 'LinkedIn data extracted successfully'
    });
  } catch (error) {
    console.error('LinkedIn import error:', error);
    res.status(500).json({ error: 'Failed to import LinkedIn data' });
  }
});

export default router;
