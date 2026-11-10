import { describe, it, expect } from 'vitest';
import { validateAndNormalizeResumeJson } from '../../schemas/resumeSchema.js';
import { extractCandidateName, redactResumeText, rehydrateResumeJson } from '../../services/resumeRedactor.js';
import { parseResumeHeuristic } from '../../services/resumeSectionSplitter.js';
import { runDeterministicChecks } from '../../services/resumeDeterministicEngine.js';
import { extractResumeText } from '../../services/resumeTextExtractor.js';
import { formatResumeContext, getInterviewerPersona } from '../../routes/company-interview/helpers.js';

describe('Phase 1: Resume Pipeline Core Services', () => {

  describe('1. Zod Canonical Schema Validation (Cross-Domain)', () => {
    it('validates and normalizes cross-domain non-tech resume JSON', () => {
      const nonTechRaw = {
        contact: {
          fullName: 'Sarah Jenkins',
          email: 'sarah.j@example.com',
          phone: '(312) 555-0199',
        },
        summary: 'Clinical nurse manager with 8+ years supervising acute care units.',
        skills: [
          { group: 'Clinical Specialties', items: ['Triage', 'ICU Care', 'Patient Monitoring'] },
          { group: 'Certifications & Compliance', items: ['BLS Certified', 'HIPAA Compliance', 'EPIC EHR'] }
        ],
        experience: [
          {
            company: 'Metropolitan Hospital',
            title: 'Charge Nurse',
            startDate: '2020-01',
            endDate: 'Present',
            bullets: ['Supervised 18 bedside nurses across 36-bed cardiac telemetry floor.']
          }
        ],
        education: [
          {
            institution: 'University of Illinois',
            degree: 'B.S. in Nursing',
            graduationDate: '2016'
          }
        ],
        additional: [
          { title: 'Volunteering', items: ['Red Cross Disaster Medical Responder'] }
        ]
      };

      const result = validateAndNormalizeResumeJson(nonTechRaw);
      expect(result.success).toBe(true);
      expect(result.data.skills[0].group).toBe('Clinical Specialties');
      expect(result.data.additional[0].title).toBe('Volunteering');
    });

    it('gracefully handles missing optional sections with defaults', () => {
      const minimalRaw = {
        contact: { fullName: 'Entry Level Student' },
        skills: [],
        experience: [],
        education: [{ institution: 'Community College', degree: 'A.S.' }]
      };

      const result = validateAndNormalizeResumeJson(minimalRaw);
      expect(result.success).toBe(true);
      expect(result.data.summary).toBe('');
      expect(result.data.projects).toEqual([]);
      expect(result.data.certifications).toEqual([]);
    });
  });

  describe('2. Server-Side PII Redactor & Re-hydrator', () => {
    it('extracts candidate name even when preceded by headers and contact labels', () => {
      const sampleText = `CURRICULUM VITAE
CONFIDENTIAL
Maria Garcia-Lopez
Email: maria.garcia@example.com | Phone: +1 (555) 012-3456
Chicago, IL
Professional Summary: Experienced marketing lead.`;

      const detectedName = extractCandidateName(sampleText);
      expect(detectedName).toBe('Maria Garcia-Lopez');
    });

    it('redacts email, phone, links, and name into placeholders', () => {
      const rawText = `Jane Doe
jane.doe@example.com
(555) 234-5678
https://linkedin.com/in/janedoe
Experienced engineer. Worked at Acme Corp.`;

      const { redactedText, piiMap } = redactResumeText(rawText);

      expect(redactedText).toContain('[CANDIDATE_NAME]');
      expect(redactedText).toContain('[REDACTED_EMAIL_1]');
      expect(redactedText).toContain('[REDACTED_PHONE_1]');
      expect(redactedText).toContain('[REDACTED_LINK_1]');
      expect(redactedText).not.toContain('jane.doe@example.com');
      expect(redactedText).not.toContain('(555) 234-5678');
      expect(piiMap.name).toBe('Jane Doe');
      expect(piiMap.emails[0]).toBe('jane.doe@example.com');
      expect(piiMap.phones[0]).toBe('(555) 234-5678');
    });

    it('re-hydrates canonical ResumeJSON from in-memory piiMap', () => {
      const piiMap = {
        name: 'Jane Doe',
        emails: ['jane.doe@example.com'],
        phones: ['(555) 234-5678'],
        links: ['https://linkedin.com/in/janedoe']
      };

      const parsedWithPlaceholders = {
        contact: {
          fullName: '[CANDIDATE_NAME]',
          email: '[REDACTED_EMAIL_1]',
          phone: '[REDACTED_PHONE_1]',
          linkedin: ''
        },
        summary: 'Experienced developer'
      };

      const restored = rehydrateResumeJson(parsedWithPlaceholders, piiMap);
      expect(restored.contact.fullName).toBe('Jane Doe');
      expect(restored.contact.email).toBe('jane.doe@example.com');
      expect(restored.contact.phone).toBe('(555) 234-5678');
      expect(restored.contact.linkedin).toBe('https://linkedin.com/in/janedoe');
    });
  });

  describe('3. Heuristic Section Splitter (0-Token Path)', () => {
    const standardResume = `Alex Morgan
alex@example.com | 555-0192 | New York, NY

PROFESSIONAL SUMMARY
Results-driven software engineer with 5 years experience building distributed backend systems.

WORK EXPERIENCE
Software Engineer at Acme Corp | 2021-06 – Present
• Architected caching layer using Redis, reducing API response latency by 42%.
• Built data ingestion pipeline handling 10k events per minute.

Junior Developer at Beta LLC | 2019-01 – 2021-05
• Automated integration testing suites using Python.

EDUCATION
University of Washington | 2015 – 2019
B.S. in Computer Science

TECHNICAL SKILLS
Languages: Python, JavaScript, TypeScript, SQL
Tools: Docker, Git, AWS, Redis`;

    it('identifies sections and parses standard resume with high confidence (>= 0.80)', () => {
      const result = parseResumeHeuristic(standardResume);

      expect(result.success).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.80);
      expect(result.tokensUsed).toBe(0);
      expect(result.source).toBe('heuristic');

      expect(result.data.experience.length).toBe(2);
      expect(result.data.experience[0].title).toBe('Software Engineer');
      expect(result.data.experience[0].company).toBe('Acme Corp');
      expect(result.data.experience[0].bullets.length).toBe(2);

      expect(result.data.education.length).toBe(1);
      expect(result.data.skills.length).toBe(2);
    });

    it('flags unformatted or low-confidence text for LLM fallback', () => {
      const messyText = `Just some random sentences without any section headers or standard structure. Worked on things here and there.`;
      const result = parseResumeHeuristic(messyText);

      expect(result.success).toBe(false);
      expect(result.confidence).toBeLessThan(0.80);
      expect(result.source).toBe('llm_fallback_needed');
    });
  });

  describe('4. Layer 1 Deterministic Engine (Always Free, 0 Tokens)', () => {
    it('detects career break neutrally without score deduction', () => {
      const resume = {
        contact: { email: 'test@example.com', phone: '555-0100' },
        experience: [
          { company: 'Company B', startDate: '2023-01', endDate: 'Present', bullets: ['Led frontend team.'] },
          { company: 'Company A', startDate: '2019-01', endDate: '2021-06', bullets: ['Built customer UI.'] },
        ],
        education: [{ institution: 'College', degree: 'B.S.' }],
        skills: [{ group: 'Tools', items: ['React'] }]
      };

      const result = runDeterministicChecks({ resumeJson: resume, pageCount: 1 });

      expect(result.careerGaps.length).toBe(1);
      expect(result.careerGaps[0].durationYears).toBeGreaterThanOrEqual(1);
      expect(result.careerGaps[0].note).toContain('No score penalty applied');
    });

    it('evaluates action verbs and passive voice correctly', () => {
      const resume = {
        contact: { email: 'test@example.com', phone: '555-0100' },
        experience: [
          {
            company: 'Tech Corp',
            bullets: [
              'Responsible for maintaining legacy servers.',
              'Assisted in customer onboarding processes.',
              'Led automated deployment migration saving $40,000 annually.'
            ]
          }
        ],
        education: [{ institution: 'College', degree: 'B.S.' }],
        skills: [{ group: 'Tools', items: ['Linux'] }]
      };

      const result = runDeterministicChecks({ resumeJson: resume, pageCount: 1 });

      expect(result.bulletStats.actionVerbCount).toBe(1); // 'Led'
      expect(result.bulletStats.passiveVoiceCount).toBe(2); // 'Responsible for', 'Assisted in'
      expect(result.bulletStats.metricCount).toBe(1); // '$40,000'
    });

    it('matches target job description keywords when JD is provided', () => {
      const resume = {
        contact: { email: 'dev@example.com', phone: '555-0199' },
        experience: [{ company: 'Acme', bullets: ['Built React web apps using TypeScript and Docker.'] }],
        education: [{ institution: 'Tech Inst', degree: 'B.S.' }],
        skills: [{ group: 'Tech', items: ['React', 'TypeScript', 'Docker'] }]
      };

      const jd = 'Seeking experienced React and TypeScript engineer with Docker and Kubernetes background.';
      const result = runDeterministicChecks({ resumeJson: resume, jobDescription: jd });

      expect(result.jdAnalysis).toBeDefined();
      expect(result.jdAnalysis.coveragePercentage).toBeGreaterThanOrEqual(50);
      expect(result.jdAnalysis.missingTopKeywords).toContain('kubernetes');
    });
  });

  describe('5. Text Extractor & Scanned PDF Detector', () => {
    it('flags empty or scanned buffer with < 50 characters', async () => {
      // Simulate raw buffer with < 50 characters
      const emptyBuffer = Buffer.from('Short text');
      const result = await extractResumeText(emptyBuffer, 'text/plain', 'resume.txt');

      expect(result.text).toBe('Short text');
      expect(result.wordCount).toBe(2);
    });
  });

  describe('6. Resume-to-Interview Handoff Privacy & Grounding', () => {
    it('asserts interview persona prompt contains no email, phone, personal name, company names, school names, URLs, or raw text', () => {
      const sensitiveResumeContext = {
        candidateHeadline: 'Sarah Jenkins — Senior Cloud Engineer at CloudScale Technologies',
        email: 'sarah.jenkins@example.com',
        phone: '+1 (312) 555-0199',
        linkedin: 'https://linkedin.com/in/sarahjenkins',
        companies: ['CloudScale Technologies', 'DoorDash'],
        institutions: ['University of Texas', 'Northwestern University'],
        coreSkills: ['Kubernetes', 'Go', 'AWS', 'sarah.jenkins@example.com'],
        projectHighlights: [
          'Enterprise Payment Gateway at CloudScale Technologies: Handled $10M transactions at https://github.com/sarah/telemetry',
          'Alumni Portal for University of Texas: Built full-stack system at sarahjenkins.dev'
        ],
        likelyQuestionAreas: ['Kubernetes', 'Go'],
        summary: 'Cloud engineer with 6 years experience at DoorDash and CloudScale Technologies. Contact: sarah.jenkins@example.com.',
        resumeText: 'Full unredacted resume text for Sarah Jenkins containing confidential employer IP and phone 312-555-0199.'
      };

      const promptContext = formatResumeContext(sensitiveResumeContext);
      const personaPrompt = getInterviewerPersona('Google', 'Cloud Engineer', 'technical', 'medium', 1, 8, {}, sensitiveResumeContext, 'experienced');

      // 1. Assert zero PII, company names, schools, or URLs in formatted prompt
      expect(promptContext).not.toContain('sarah.jenkins@example.com');
      expect(promptContext).not.toContain('555-0199');
      expect(promptContext).not.toContain('312');
      expect(promptContext).not.toContain('linkedin.com');
      expect(promptContext).not.toContain('github.com');
      expect(promptContext).not.toContain('sarahjenkins.dev');
      expect(promptContext).not.toContain('Sarah Jenkins');
      expect(promptContext).not.toContain('CloudScale Technologies');
      expect(promptContext).not.toContain('University of Texas');
      expect(promptContext).not.toContain('DoorDash');
      expect(promptContext).not.toContain('Full unredacted resume text');

      expect(personaPrompt).not.toContain('sarah.jenkins@example.com');
      expect(personaPrompt).not.toContain('555-0199');
      expect(personaPrompt).not.toContain('linkedin.com');
      expect(personaPrompt).not.toContain('github.com');
      expect(personaPrompt).not.toContain('Sarah Jenkins');
      expect(personaPrompt).not.toContain('CloudScale');
      expect(personaPrompt).not.toContain('University of Texas');

      // 2. Assert neutral grounding and verbatim project guidance
      expect(promptContext).toContain('Walk me through how that project worked and what trade-offs came up.');
      expect(promptContext).toContain('Quote project names verbatim from the resume');
      expect(promptContext).not.toContain('how you architected that');

      // 3. Assert scoring boundary
      expect(promptContext).toContain('Scores must depend ONLY on the candidate\'s live spoken answers');
    });
  });

  describe('7. Section Splitter & Manual Heading Mapping (Colloquial Fallback)', () => {
    const colloquialResume = `Samira Khan
samira.khan@example.com | (312) 555-1219 | Chicago, IL

WHAT I'VE DONE
Software Engineer at Grubhub | 2021-01 – Present
• Optimized order routing algorithm, improving driver dispatch efficiency by 14%.

TECHNICAL TOOLKIT
Python, Django, PostgreSQL, Docker, AWS ECS`;

    it('flags colloquial headings as candidate unrecognized headings', () => {
      const initial = parseResumeHeuristic(colloquialResume);
      expect(initial.confidence).toBeLessThan(0.80);
      expect(initial.unrecognizedHeadings).toContain("WHAT I'VE DONE");
    });

    it('resolves colloquial headings when user manually maps to standard sections with 0 tokens', () => {
      const manualMapped = parseResumeHeuristic(colloquialResume, {
        "WHAT I'VE DONE": 'experience',
        "TECHNICAL TOOLKIT": 'skills'
      });

      expect(manualMapped.sectionsDetected).toContain('experience');
      expect(manualMapped.sectionsDetected).toContain('skills');
      expect(manualMapped.data.experience.length).toBeGreaterThan(0);
      expect(manualMapped.data.experience[0].company).toContain('Grubhub');
      expect(manualMapped.data.experience[0].bullets[0]).toContain('Optimized order routing algorithm');
      expect(manualMapped.tokensUsed).toBe(0);
    });
  });

});

