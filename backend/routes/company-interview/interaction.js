import express from 'express';
import _Groq from 'groq-sdk';
import _multer from 'multer';
import _fs from 'fs';
import _path from 'path';
import _os from 'os';
import _crypto from 'crypto';
import { optionalAuth, _authenticateToken } from '../../middleware/auth.js';
import { _supabaseAdmin } from '../../db/supabaseClient.js';
import { aiCallWithRetry } from '../../utils/aiClient.js';
import { _getRandomQuestionSet, _getFilteredQuestions, _getQuestionCount } from '../../services/companyQuestionService.js';
import { _buildInitialVoiceTelemetry, buildVoiceTelemetrySnapshot } from '../../utils/voiceTelemetry.js';
import { buildAnswerFeedbackPrompt, normalizeInterviewFeedback } from '../../utils/interviewFeedback.js';
import { evaluateFresherAnswer } from '../../services/interviewAnswerEvaluator.js';
import { groq, _safeDeleteUploadFile, _MAX_HISTORY_TURNS, truncateConversationHistory, deterministicScore, deterministicPick, safeJsonParse, _UPLOAD_DIR, _upload, _COMPANY_CATEGORIES, _getCompanyCategory, _PERSONA_PROFILES, _DEFAULT_ADVANCED_OPTIONS, _INTERVIEW_RUNTIME_MODES, normalizeInterviewRuntimeMode, buildInterviewRuntime, _STAGE_ALIASES, resolveInterviewStage, resolveResumeInterviewModeForExperience, normalizeAdvancedOptions, _formatResumeContext, FRESHER_INTERVIEW_TOTAL_QUESTIONS, HR_CLOSING_MESSAGE, _STATIC_INTERVIEW_QUESTIONS, _STATIC_INTERVIEW_CLOSINGS, FRESHER_HR_FIXED, _FRESHER_HR_TOPICS, FRESHER_HR_CLOSINGS, FRESHER_TECHNICAL_FIXED, _FRESHER_TECHNICAL_TOPICS, getStaticInterviewQuestions, getStaticInterviewQuestion, getStaticInterviewClosing, _getFresherTechnicalQuestion, getFresherTechnicalAIPrompt, _getFresherHRQuestion, _getFresherHRAIPrompt, getFresherHRClosing, _INTERVIEWER_NAMES, _pickFallbackInterviewerName, _getResumeProjectPrompt, _getTopSkillPrompt, buildHrResponseSnippet, _getFresherScriptedQuestion, _getFresherQuestionTopic, _getFresherFallbackQuestion, isFinalNoAnswer, getInterviewerPersona, _getCompanyChallengeProfile, getAdaptiveDifficultyPrompt, buildInterviewMemoryPrompt, buildFocusSignal, generateFresherHRQuestion, generateFresherTechnicalQuestion, generateFresherScriptedQuestion } from './helpers.js';

const router = express.Router();

// ─── Follow-up with realistic interviewer behavior ───
router.post('/follow-up', optionalAuth, async (req, res) => {
  const requestStartTime = Date.now();
  const { company, role, stage: rawStage, interviewMode, interviewRuntimeMode, interviewType, difficulty, previousQuestion, userAnswer, conversationHistory, questionNumber = 2, totalQuestions = 8, lastScore, averageScore, cumulativeScores, code, codeLanguage, useRealQuestions = false, questionBankIds, currentQuestionId, advancedOptions, resumeContext, experienceLevel = 'fresher' } = req.body;
  const stage = resolveInterviewStage(rawStage, interviewMode, interviewType);
  const resolvedRuntimeMode = normalizeInterviewRuntimeMode(interviewRuntimeMode);
  const runtime = buildInterviewRuntime(resolvedRuntimeMode);

  // Fix #8: Declare safeQuestionNumber BEFORE buildCanonicalFollowUpPayload so the
  // closure can reference it without a ReferenceError (const is not hoisted).
  const parsedQuestionNumber = Number(questionNumber);
  const safeQuestionNumber = Number.isFinite(parsedQuestionNumber) && parsedQuestionNumber >= 1
    ? Math.floor(parsedQuestionNumber)
    : 2;
  const parsedTotalQuestions = Number(totalQuestions);
  const safeTotalQuestions = Number.isFinite(parsedTotalQuestions) && parsedTotalQuestions >= 1
    ? Math.floor(parsedTotalQuestions)
    : 8;

  const buildCanonicalFollowUpPayload = (payload = {}) => {
    const turn = Number(payload?.questionMeta?.sequence);
    return {
      ...payload,
      mode: resolvedRuntimeMode,
      status: payload.complete ? 'completed' : 'in_progress',
      turn: Number.isFinite(turn) ? turn : null,
      nextQuestion: payload.nextQuestion || payload.followUpQuestion || null,
      telemetry: payload.telemetry || buildVoiceTelemetrySnapshot({
        previousTelemetry: req.body?.telemetry || {},
        turnNumber: Number.isFinite(turn) ? turn : safeQuestionNumber,
        previousStage: req.body?.previousStage || req.body?.telemetry?.currentStage || stage,
        nextStage: stage,
        responseLatencyMs: Date.now() - requestStartTime,
        mode: resolvedRuntimeMode,
      }),
    };
  };
  const withRuntime = (payload) => ({
    ...buildCanonicalFollowUpPayload(payload),
    interviewRuntimeMode: resolvedRuntimeMode,
    runtime,
  });
  const normalizedAdvanced = resolveResumeInterviewModeForExperience(
    normalizeAdvancedOptions(advancedOptions),
    experienceLevel,
    resumeContext
  );
  const fresherScriptMode = normalizedAdvanced.resumeInterviewMode === 'fresher-hr-tech';
  const personalizedQuestionSource = resumeContext ? 'resume' : 'ai';
  const isFresherTechnical = fresherScriptMode && stage === 'Technical';
  const isFresherHR = fresherScriptMode && stage === 'HR';
  const staticQuestions = getStaticInterviewQuestions(stage);

  // Fresher-HR Hybrid Mode: Q1 fixed, Q2-Q11 AI-generated (different each interview), Q12 wrap-up, Q13 closing
    if (isFresherHR) {
      const qNum = safeQuestionNumber;
      const isQ12 = qNum === 12;
      const isQ13 = qNum === 13;
      const isQ2To11 = qNum >= 2 && qNum <= 11;
      const isQ1 = qNum === 1;
      const isLastQuestion = qNum > 13;

      const feedbackOptions = [
        'That\'s great to hear! Thank you for sharing that.',
        'I appreciate your openness and clear example there.',
        'That shows real self-awareness and growth mindset.',
        'Wonderful! You gave a thoughtful and genuine answer.',
        'Excellent! You\'ve demonstrated great interpersonal awareness.',
        'That\'s really thoughtful. I like how you framed that.',
      ];
      const feedbackMessage = deterministicPick(feedbackOptions, qNum);

      let followUpQuestion = '';
      let closingRemark = undefined;
      let isComplete = false;

      if (isLastQuestion) {
        isComplete = true;
        closingRemark = FRESHER_HR_CLOSINGS.NO;
      } else if (isQ13) {
        // Q13: Check if candidate had questions; if yes, provide closing; if no, show default closing
        const hasQuestions = userAnswer && userAnswer.toLowerCase().includes('yes');
        closingRemark = getFresherHRClosing(hasQuestions);
        isComplete = true;
      } else if (isQ12) {
        // Q12: Ask fixed wrap-up question
        followUpQuestion = FRESHER_HR_FIXED.Q12 || 'Do you have any questions for me about the role, the team, or our company?';
      } else if (isQ1) {
        // Safety fallback: if caller sends qNum=1, return opening question
        const aiQuestion = await generateFresherHRQuestion(1, resumeContext);
        followUpQuestion = aiQuestion || 'Let\'s start with a behavioral question.';
      } else if (isQ2To11) {
        // Q2-Q11: Generate the exact next question requested by qNum
        const aiQuestion = await generateFresherHRQuestion(qNum, resumeContext);
        followUpQuestion = aiQuestion || 'Let\'s continue to the next question.';
      } else {
        // Should not reach here
        followUpQuestion = 'Do you have any questions for me?';
      }

      const nextQNumForMeta = isComplete ? null : qNum;
      const isNextQuestionAIGenerated = nextQNumForMeta !== null && nextQNumForMeta >= 2 && nextQNumForMeta <= 11;

      const evaluated = evaluateFresherAnswer(userAnswer, 'HR', code);

      return res.json(withRuntime({
        feedback: feedbackMessage,
        followUpQuestion: isComplete ? '' : followUpQuestion,
        closingRemark: isComplete ? closingRemark : undefined,
        complete: isComplete,
        score: evaluated.score,
        strengths: evaluated.strengths,
        improvements: evaluated.improvements,
        interviewerReaction: isComplete ? 'encouraging' : 'probing',
        thinkTime: 20,
        hint: 'Answer naturally and relate your response to your experience and values.',
        difficultyLevel: 'medium',
        adaptiveNote: `Fresher-HR Q${Math.min(qNum, 13)} of 13 (AI-generated behavioral sequence).`,
        questionSource: 'fresher-hr-dynamic',
        questionMeta: {
          id: nextQNumForMeta === null ? null : `fresher-hr-q-${nextQNumForMeta}`,
          track: 'fresher-hr',
          sequence: nextQNumForMeta,
          isAIGenerated: isNextQuestionAIGenerated,
        },
      }));
    }
  // Fresher-Technical Hybrid Mode: Q1 fixed, Q2-Q11 AI-generated, Q12-Q13 fixed
  if (isFresherTechnical) {
    const qNum = safeQuestionNumber;
    const isQ12 = qNum === 12;
    const isQ13 = qNum === 13;
    const isQ2To11 = qNum >= 2 && qNum <= 11;
    const isLastQuestion = qNum > FRESHER_INTERVIEW_TOTAL_QUESTIONS;

    const feedbackOptions = [
      'That\'s a solid approach! I like how you explained that.',
      'Good thinking! I can see you have hands-on experience.',
      'I appreciate the detail there. Let\'s explore a bit more.',
      'Nice! You covered the key points clearly.',
      'Excellent! You have a practical understanding.'
    ];
    const feedbackMessage = deterministicPick(feedbackOptions, qNum);

    let followUpQuestion = '';
    let closingRemark = undefined;
    let isComplete = false;

    if (isLastQuestion) {
      isComplete = true;
      closingRemark = FRESHER_TECHNICAL_FIXED.Q13_NO; // Default: no follow-up questions
    } else if (isQ13) {
      // Q13: Check if candidate had questions; if yes, provide closing; if no, show default closing
      const hasQuestions = userAnswer && userAnswer.toLowerCase().includes('yes');
      closingRemark = hasQuestions ? FRESHER_TECHNICAL_FIXED.Q13_YES : FRESHER_TECHNICAL_FIXED.Q13_NO;
      isComplete = true;
    } else if (isQ12) {
      // Q12: Ask fixed wrap-up question
      followUpQuestion = FRESHER_TECHNICAL_FIXED.Q12;
    } else if (isQ2To11) {
      // Q2-Q11: Generate the exact next question requested by qNum
      followUpQuestion = await generateFresherTechnicalQuestion(qNum, resumeContext);
      if (!followUpQuestion) {
        // Fallback if AI generation fails
        const topicData = getFresherTechnicalAIPrompt(qNum);
        followUpQuestion = `Let's move on to the next topic: ${topicData?.topic}. Can you tell me more about this?`;
      }
    } else {
      // Should not reach here
      followUpQuestion = FRESHER_TECHNICAL_FIXED.Q12;
    }

    const nextQNumForMeta = isComplete ? null : qNum;
    const evaluated = evaluateFresherAnswer(userAnswer, 'Technical', code);

    return res.json(withRuntime({
      feedback: feedbackMessage,
      followUpQuestion: isComplete ? '' : followUpQuestion,
      closingRemark: isComplete ? closingRemark : undefined,
      complete: isComplete,
      score: evaluated.score,
      strengths: evaluated.strengths,
      improvements: evaluated.improvements,
      interviewerReaction: isComplete ? 'encouraging' : 'probing',
      thinkTime: 20,
      hint: 'Explain your reasoning step by step, then mention trade-offs or real-world use cases.',
      difficultyLevel: 'medium',
      adaptiveNote: `Fresher-Technical Q${qNum} of ${FRESHER_INTERVIEW_TOTAL_QUESTIONS} (Hybrid: ${isQ2To11 ? 'AI-generated' : isQ12 ? 'wrap-up' : isQ13 ? 'conclusion' : 'fixed'}).`,
      questionSource: 'fresher-technical-hybrid',
      questionMeta: {
        id: nextQNumForMeta === null ? null : `fresher-technical-q-${nextQNumForMeta}`,
        track: 'fresher-technical',
        sequence: nextQNumForMeta,
        isAIGenerated: nextQNumForMeta !== null && nextQNumForMeta >= 2 && nextQNumForMeta <= 11,
      },
    }));
  }

  if (staticQuestions.length > 0) {
    const nextQuestion = getStaticInterviewQuestion(stage, safeQuestionNumber);
    const isLastQuestion = safeQuestionNumber > staticQuestions.length;
    const safeQuestionIdx = Math.min(Math.max(safeQuestionNumber - 1, 0), staticQuestions.length - 1);
    const resolvedNextQuestion = isLastQuestion
      ? ''
      : (nextQuestion || staticQuestions[safeQuestionIdx] || '');

    return res.json(withRuntime({
      feedback: stage === 'HR'
        ? 'That was a thoughtful response. Let us continue the discussion with the next HR question.'
        : 'Good response. Let us continue with the next technical question.',
      followUpQuestion: resolvedNextQuestion,
      closingRemark: isLastQuestion ? getStaticInterviewClosing(stage) : undefined,
      complete: isLastQuestion,
      score: stage === 'HR' ? 78 : 80,
      strengths: stage === 'HR'
        ? ['Clear communication', 'Relevant examples']
        : ['Structured thinking', 'Technical clarity'],
      improvements: stage === 'HR'
        ? ['Add one concrete example', 'Keep answers concise and outcome-focused']
        : ['Mention complexity clearly', 'Call out edge cases earlier'],
      interviewerReaction: isLastQuestion ? 'encouraging' : 'probing',
      thinkTime: 20,
      hint: stage === 'HR'
        ? 'Answer naturally and relate your response to your experience.'
        : 'Explain your reasoning step by step, then mention trade-offs.',
      difficultyLevel: 'medium',
      adaptiveNote: `Scripted ${String(stage).toLowerCase()} sequence question ${Math.min(safeQuestionNumber, staticQuestions.length)} of ${staticQuestions.length}.`,
      questionSource: 'scripted',
      questionMeta: { id: `${String(stage).toLowerCase()}-q-${Math.min(safeQuestionNumber, staticQuestions.length)}`, track: String(stage).toLowerCase(), sequence: Math.min(safeQuestionNumber, staticQuestions.length) },
    }));
  }
  
  // Fresher topics mapping
  const getFresherTopic = (qNum) => {
    switch (qNum) {
      case 2: return "Resume & Experience: Ask them to elaborate on a project listed in their resume (or a general past project if no resume).";
      case 3: return "Technical Skills: Ask them about a specific language or framework they are confident in, and how they used it practically.";
      case 4: return "Object-Oriented Programming (OOP) Core: Ask them to explain a foundational OOP concept (like the 4 pillars) with a real-world example.";
      case 5: return "OOP Applied: Ask them to compare two OOP concepts (like Interface vs Abstract Class) and when to use each.";
      case 6: return "SQL / Databases: Ask them about foundational SQL concepts (like JOINs or Normalization).";
      case 7: return "Database Design: Ask them about Primary/Foreign Keys, Indexes, or typical database performance optimization.";
      case 8: return "Programming Language / Core: Ask them to explain a core programming language concept (e.g., pass-by-value vs pass-by-reference).";
      case 9: return "OS Fundamentals: Ask an operating system fundamental (like Process vs Thread or Memory Management).";
      case 10: return "Networking / Web: Ask about REST APIs, HTTP methods, or the client-server request cycle.";
      case 11: return "Data Structures: Ask about a fundamental data structure (arrays, linked lists, stacks, queues, trees) and when to use it.";
      case 12: return "Wrap Up: Ask if they have any questions for you about the company, team, or the role.";
      case 13: return "Conclusion: Warmly answer the candidate's questions and strictly conclude the interview.";
      default: return "Technical Deep Dive";
    }
  };

  // If using real questions, get the next question from the bank
  let nextRealQuestion = null;
  let realQuestionMeta = null;
  if (useRealQuestions && questionBankIds && questionBankIds.length > 0) {
    const nextIdx = safeQuestionNumber - 1; // questionNumber is 1-indexed, and we want the next one
    if (nextIdx < questionBankIds.length) {
      const { getQuestionById } = await import('../services/companyQuestionService.js');
      nextRealQuestion = await getQuestionById(questionBankIds[nextIdx]);
      if (nextRealQuestion) {
        realQuestionMeta = { id: nextRealQuestion.id, tags: nextRealQuestion.tags, difficulty: nextRealQuestion.difficulty, frequencyScore: nextRealQuestion.frequencyScore };
      }
    }
  }

  // Get reference answer for current question if available
  let referenceAnswer = null;
  if (useRealQuestions && currentQuestionId) {
    const { getQuestionById: getQ } = await import('../services/companyQuestionService.js');
    const currentQ = await getQ(currentQuestionId);
    if (currentQ?.answer) referenceAnswer = currentQ.answer;
  }

  try {
    if (!groq) {
      const reactions = [
        "That's a solid approach! I like how you structured that.",
        "Interesting perspective. Let me dig a bit deeper.",
        "Good thinking! I can see you've worked through problems like this before.",
        "I appreciate the detail there. Let's explore a different angle.",
        "Nice! You covered the key points well.",
        "Great answer! I can tell you have hands-on experience with this.",
        "I like your thought process. Let me push you a bit further."
      ];
      // Diverse follow-ups per stage — rotates based on questionNumber
      const stageQuestions = {
        'Technical': [
          'Can you explain the difference between an abstract class and an interface? When would you pick one over the other?',
          'How does garbage collection work in your preferred language? What are the different algorithms?',
          'What is the difference between concurrency and parallelism? Can you give a real-world example?',
          'Explain how a hash map works internally. What happens during a collision?',
          'What are SOLID principles? Can you walk me through each one with a quick example?',
          'How would you debug a production issue where the application is running slow but CPU usage is normal?',
          'What is the CAP theorem? How does it apply to database selection?',
          'Explain the event loop in Node.js. How does it handle asynchronous operations?',
        ],
        'DSA / Coding': [
          'Given a linked list, how would you detect if it has a cycle? Walk me through your approach.',
          'How would you find the kth largest element in an unsorted array? What data structure helps here?',
          'Explain how you would serialize and deserialize a binary tree. What traversal order would you use?',
          'Given a string of parentheses, how would you check if they are balanced? What about multiple types?',
          'How would you merge two sorted arrays in-place? Think about doing it without extra space.',
          'Describe how you would implement an LRU cache. What data structures would you combine?',
          'How would you find the longest increasing subsequence in an array? Discuss both approaches.',
          'Given a matrix of 0s and 1s, how would you count the number of islands?',
        ],
        'System Design': [
          'How would you design a real-time chat application like WhatsApp? Think about message delivery guarantees.',
          'Walk me through designing a news feed system like Instagram. How would you handle ranking?',
          'How would you design a rate limiter for an API? What algorithms could you use?',
          'Design a notification system that handles millions of users. How do you handle delivery at scale?',
          'How would you design a key-value store like Redis? What about persistence and replication?',
          'Walk me through designing a search autocomplete system. How would you optimize for latency?',
          'How would you design a video streaming platform? Think about CDN and adaptive bitrate.',
          'Design a parking lot system. Start with the object model, then think about scaling.',
        ],
        'Behavioral': [
          'Tell me about a time you worked on a challenging group project in college. How did you handle disagreements?',
          'Describe a hackathon, competition, or event you participated in. What was your role?',
          'Can you share an example where you had to learn something completely new under a tight deadline?',
          'Tell me about a project that didn\'t go as planned. What did you learn from it?',
          'Describe a time when you had to balance multiple assignments or deadlines. How did you prioritize?',
          'Share an experience where you helped a classmate or junior understand something difficult.',
          'Tell me about a time you took initiative on something — maybe a club, project, or side hustle.',
          'Describe how you handled a situation where you were unsure how to approach a problem or assignment.',
        ],
        'HR': [
          'What motivates you to pursue a career in tech? What gets you excited about building things?',
          'Where do you see yourself in 3 to 5 years? How does this role fit into that vision?',
          'What made you choose your branch or field of study? Do you enjoy it?',
          'What kind of work environment do you think you\'d thrive in? Do you prefer working solo or in teams?',
          'Tell me about a value or principle that guides how you work and learn.',
          'What are you most proud of from your time in college — could be academic or extracurricular!',
          'How would your friends or classmates describe you in three words?',
          'What questions do you have for me about the team, the role, or what it\'s like to work at this company?',
        ],
        'Managerial': [
          'Have you ever had to coordinate or lead a team? Maybe a college project, club, or event?',
          'Tell me about a time you had to convince your team to go with your idea. How did you handle it?',
          'How do you keep yourself and your team motivated during a stressful period, like exams or a project deadline?',
          'If you had to organize a technical event or workshop, how would you plan it?',
          'How would you handle a situation where a team member isn\'t contributing fairly in a group project?',
          'What is your approach to managing your time when you have multiple deadlines?',
          'Do you enjoy mentoring juniors? Tell me about a time you helped someone learn something.',
          'Tell me about a tough decision you made — maybe about choosing between two projects, events, or even career options.',
        ],
        'OA': [
          'Given an array of integers, find the contiguous subarray with the maximum sum. Explain your approach.',
          'How would you determine if a string is a valid palindrome, considering only alphanumeric characters?',
          'Write an algorithm to find all permutations of a given string. What is the time complexity?',
          'Given two sorted arrays, find the median of the combined array in O(log n) time.',
          'How would you implement a stack that supports getMin() in O(1) time?',
          'Given a 2D grid, find the shortest path from top-left to bottom-right. What algorithm would you use?',
          'Design an algorithm to rotate a matrix 90 degrees clockwise in-place.',
          'How would you detect a duplicate in an array of n+1 integers where each integer is between 1 and n?',
        ],
      };
      const questions = stageQuestions[stage] || stageQuestions['Technical'];
      const qIdx = ((safeQuestionNumber || 1) - 1) % questions.length;
      const isLast = safeQuestionNumber > safeTotalQuestions;

      return res.json(withRuntime({
        feedback: deterministicPick(reactions, safeQuestionNumber),
        followUpQuestion: isLast ? '' : (nextRealQuestion ? nextRealQuestion.question : questions[qIdx]),
        closingRemark: isLast ? `Thank you so much for your time today! You've given some really thoughtful answers. We'll be in touch soon with next steps. Best of luck!` : undefined,
        score: deterministicScore(65, 25, safeQuestionNumber + (userAnswer?.length || 0)),
        strengths: [
          deterministicPick(['Clear communication', 'Structured thinking', 'Good examples'], safeQuestionNumber),
          deterministicPick(['Technical depth', 'Problem-solving mindset', 'Practical approach'], safeQuestionNumber + 1)
        ],
        improvements: [
          deterministicPick(['Add more specific metrics', 'Consider edge cases', 'Discuss trade-offs'], safeQuestionNumber),
          deterministicPick(['Mention real-world experience', 'Think about scalability', 'Explore alternatives'], safeQuestionNumber + 1)
        ],
        interviewerReaction: deterministicPick(['encouraging', 'impressed', 'probing', 'neutral'], safeQuestionNumber),
        thinkTime: deterministicScore(30, 30, safeQuestionNumber),
        hint: deterministicPick(['Think about time vs space trade-offs', 'Consider the edge cases first', 'Try working through a small example', 'What would happen at scale?'], safeQuestionNumber),
        questionSource: nextRealQuestion ? 'database' : personalizedQuestionSource,
        questionMeta: realQuestionMeta || null,
      }));
    }

    const effectiveTotalQuestions = fresherScriptMode ? FRESHER_INTERVIEW_TOTAL_QUESTIONS : safeTotalQuestions;
    const isLastQuestion = safeQuestionNumber > effectiveTotalQuestions;

    if (fresherScriptMode) {
      const evaluated = evaluateFresherAnswer(userAnswer, stage, code);

      if (isLastQuestion) {
        const shouldClose = isFinalNoAnswer(userAnswer);

        if (!shouldClose) {
          const loopQuestion = `${buildHrResponseSnippet(userAnswer, company)} Do you have any other questions before we close today?`;

          return res.json(withRuntime({
            feedback: 'Good question. You are thinking in the right direction, and I appreciate your curiosity.',
            followUpQuestion: loopQuestion,
            closingRemark: '',
            complete: false,
            score: evaluated.score,
            strengths: evaluated.strengths,
            improvements: evaluated.improvements,
            interviewerReaction: 'encouraging',
            thinkTime: 20,
            hint: 'A concise, role-focused question is usually strongest at this stage.',
            difficultyLevel: 'medium',
            adaptiveNote: 'Scripted fresher flow waiting for explicit final "No" before closing.',
            questionSource: 'ai-scripted',
            questionMeta: { id: 'fresher-q-12-loop', track: 'fresher-hr-tech', sequence: 12 },
          }));
        }

        return res.json(withRuntime({
          feedback: 'Thank you for sharing your responses. You communicated clearly and handled the discussion with good composure.',
          followUpQuestion: '',
          closingRemark: HR_CLOSING_MESSAGE,
          complete: true,
          score: evaluated.score,
          strengths: evaluated.strengths,
          improvements: evaluated.improvements,
          interviewerReaction: 'encouraging',
          thinkTime: 0,
          hint: '',
          difficultyLevel: 'medium',
          adaptiveNote: 'Scripted fresher HR + fundamentals sequence complete.',
          questionSource: 'ai-scripted',
          questionMeta: { id: `fresher-q-${effectiveTotalQuestions + 1}`, track: 'fresher-hr-tech', sequence: effectiveTotalQuestions + 1 },
        }));
      }

      const nextQuestion = await generateFresherScriptedQuestion(safeQuestionNumber, company, resumeContext, userAnswer);

      return res.json(withRuntime({
        feedback: 'Good response. Your points were clear; adding one concrete result would make it stronger.',
        followUpQuestion: nextQuestion,
        complete: false,
        score: evaluated.score,
        strengths: evaluated.strengths,
        improvements: evaluated.improvements,
        interviewerReaction: safeQuestionNumber >= 11 ? 'encouraging' : 'probing',
        thinkTime: safeQuestionNumber >= 11 ? 20 : 35,
        hint: safeQuestionNumber >= 11 ? 'Ask about team structure, growth path, or first-90-day expectations.' : 'Use a simple structure: context, action, result.',
        difficultyLevel: 'medium',
        adaptiveNote: `Scripted fresher sequence question ${safeQuestionNumber} of ${effectiveTotalQuestions}.`,
        questionSource: 'ai-scripted',
        questionMeta: { id: `fresher-q-${safeQuestionNumber}`, track: 'fresher-hr-tech', sequence: safeQuestionNumber },
      }));
    }

    const focusSignal = buildFocusSignal(previousQuestion, userAnswer);

    // Build code review context if code was submitted
    const codeContext = code ? `

## Code Submitted by Candidate
Language: ${codeLanguage || 'unknown'}
\`\`\`
${code}
\`\`\`
Evaluate this code as part of your response:
- Correctness: does it solve the problem?
- Time complexity (Big-O)
- Space complexity
- Code quality, readability, edge case handling
- Suggest an optimized version if applicable
Include your evaluation in "codeFeedback" in the JSON response.` : '';

    const adaptivePrompt = getAdaptiveDifficultyPrompt(lastScore, averageScore, cumulativeScores, company, stage);
    const memoryPrompt = buildInterviewMemoryPrompt(conversationHistory, previousQuestion, userAnswer);
    const feedbackPrompt = buildAnswerFeedbackPrompt();

    const focusPrompt = `

  ## Candidate Response Focus Signal
  - Signal: ${focusSignal.label}
  - Guidance: ${focusSignal.note}

  If signal is "over-verbose" or "possibly-off-topic":
  - Start with a polite redirect phrase like "Let me pause you there" or "Let's narrow that down".
  - Ask one specific question tied directly to the original prompt.

  If signal is "under-answered" or "empty":
  - Ask one simpler anchor question.
  - Offer one short cue, then stop talking.
  `;

    // Build reference answer context if using real questions
    const referenceContext = referenceAnswer ? `

## Reference Answer (for your evaluation only, DO NOT reveal this to the candidate):
"${referenceAnswer.substring(0, 500)}"
Use this as a benchmark to evaluate the candidate's answer. Score higher if they cover the key points from the reference.` : '';

    // Build real question injection if available
    let realQuestionInstruction = '';
    
    if (fresherScriptMode && !isLastQuestion) {
      const topic = getFresherTopic(safeQuestionNumber);
      realQuestionInstruction = `

## CRITICAL: Fresher Interview Sequence
You are currently on Question ${safeQuestionNumber} of 12.
For this turn, you MUST evaluate the candidate's last answer and provide feedback.
Then, generating your next question, YOU MUST ASK A QUESTION STRICTLY ABOUT THIS TOPIC: "${topic}".
Do NOT ask a generic follow-up. Transition naturally to this new topic. Keep the question clear and suitable for a fresher level.`;
    } else if (nextRealQuestion && !isLastQuestion) {
      realQuestionInstruction = `

## IMPORTANT: Use This Exact Question as Your Follow-Up
You MUST use this question as your follow-up (present it naturally, in your own words, but keep the core question intact):
"${nextRealQuestion.question}"
Do NOT generate a different question. Transitions should be natural.`;
    }

    const messages = [
      {
        role: 'system',
        content: getInterviewerPersona(company, role, stage, difficulty, safeQuestionNumber, effectiveTotalQuestions, normalizedAdvanced, resumeContext, experienceLevel) + adaptivePrompt + memoryPrompt + codeContext + referenceContext + realQuestionInstruction + `

The candidate just answered a question. You must:
1. React naturally to their answer (say something like "Makes sense", "Got it")
2. Give extremely brief, actionable feedback internally (do not speak the "feedback" block aloud)
3. ${isLastQuestion ? 'This is the LAST answer. Provide a short, warm closing compliment.' : 'Ask a follow-up that digs deeper OR moves to a new topic naturally. Keep the spoken "followUpQuestion" to 1-2 sentences MAX.'}
4. Provide score, strengths, improvements
5. Include a subtle hint for the next question
6. Suggest think time in seconds

IMPORTANT: The "followUpQuestion" and "closingRemark" must sound like a real human speaking on a Zoom call. No robotic transitions. Keep it under 3 sentences.
NATURAL SPEECH CONSTRAINTS:
- No generic filler like "Great question" or "Moving to the next question".
- Do not mention being AI.
- Keep tone professional but conversational.
- Use one focused question, not a list.
- Avoid repeating the candidate's full answer back.
- Avoid meta prompts such as "walk me through your approach step by step" unless the stage is explicitly DSA/Coding or System Design.
- Do not repeat the exact same follow-up wording twice in a row.
- For fresher Technical interviews, vary the angle across project, coursework, internship, fundamentals, and trade-offs instead of asking for the same concrete example repeatedly.
- Prefer concrete, topic-specific follow-ups tied to the current stage (e.g., OOP/DBMS/OS/networking for Technical; STAR context for Behavioral).
` + focusPrompt + feedbackPrompt + `

Respond as JSON:
{
  "feedback": "Internal evaluation of their answer (2 sentences)",
  "followUpQuestion": "${isLastQuestion ? 'empty string since this is the last question' : 'Your spoken next question (natural, casual, max 2 sentences)'}",
  ${isLastQuestion ? '"closingRemark": "A warm, natural spoken closing thanking them (max 2 sentences)",' : ''}
  "score": 0-100,
  "strengths": ["specific things done well"],
  "improvements": ["specific things to improve"],
  "interviewerReaction": "encouraging|impressed|probing|neutral|challenging",
  "thinkTime": 30-90,
  "hint": "A gentle nudge if stuck (1 sentence)",
  "difficultyLevel": "easy|medium|hard",
  "adaptiveNote": "Brief explanation of difficulty adjustment"${code ? ',\n  "codeFeedback": {"correctness": "pass|fail|partial", "timeComplexity": "O(...)", "spaceComplexity": "O(...)", "quality": 0-10, "issues": ["issue1"], "optimizedApproach": "brief suggestion"}' : ''}
}`
      },
      ...truncateConversationHistory(conversationHistory || []).map(h => ({
        role: h.role === 'interviewer' ? 'assistant' : 'user',
        content: h.content
      })),
      { role: 'assistant', content: previousQuestion },
      { role: 'user', content: code ? `${userAnswer}\n\n[Code submitted in ${codeLanguage || 'unknown'}]:\n${code}` : userAnswer }
    ];

    const completion = await aiCallWithRetry({
      operation: () =>
        groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages,
          response_format: { type: 'json_object' },
          temperature: 0.75
        }),
      timeoutMs: 12000,
      maxRetries: 2,
      baseDelayMs: 250,
    });

    const rawContent = completion.choices[0].message.content;
    const result = safeJsonParse(rawContent);
    if (!result) {
      console.error('Follow-up JSON parse failed, raw:', rawContent?.substring(0, 300));
      throw new Error('AI returned malformed JSON');
    }
    const normalizedResult = normalizeInterviewFeedback(result, {
      stage,
      question: previousQuestion,
      answer: userAnswer,
    });
    res.json(withRuntime({
      ...normalizedResult,
      interviewerReaction: result.interviewerReaction || 'neutral',
      thinkTime: result.thinkTime || 45,
      hint: normalizedResult.hint || 'Try breaking the problem into smaller parts',
      difficultyLevel: result.difficultyLevel || 'medium',
      adaptiveNote: result.adaptiveNote || null,
      codeFeedback: result.codeFeedback || null,
      questionSource: fresherScriptMode ? 'ai-scripted' : (nextRealQuestion ? 'database' : personalizedQuestionSource),
      questionMeta: fresherScriptMode ? { id: `fresher-q-${safeQuestionNumber}`, track: 'fresher-hr-tech', sequence: safeQuestionNumber } : (realQuestionMeta || null),
      referenceAnswer: referenceAnswer || null,
    }));
  } catch (error) {
    console.error('Follow-up error:', error.message?.substring(0, 200));
    // Graceful fallback — contextual follow-up
    const technicalFallbackQuestions = experienceLevel === 'fresher'
      ? [
          'Can you connect that to a class project, internship, or side project you worked on?',
          'Can you give one concrete example from something you built or studied?',
          'Can you walk me through a specific project or coursework example that shows that in practice?',
        ]
      : [
          'Can you walk me through your approach step by step, including trade-offs?',
          'What alternative would you consider, and why?',
          'How would you apply that in a real system or team setting?',
        ];
    const pickTechnicalFallbackQuestion = (seed = 0) => {
      const index = Math.abs(seed) % technicalFallbackQuestions.length;
      return technicalFallbackQuestions[index];
    };
    const fallbackFollowUps = {
      'HR': 'That\'s interesting! Can you tell me about your career goals? Where do you see yourself in a few years after starting your career?',
      'Behavioral': 'Good insight. Can you give me another example where you showed leadership or took initiative — maybe in a college project or extracurricular?',
      'DSA / Coding': 'Nice approach. Now, can you think of a way to optimize that solution? What would the time and space complexity be?',
      'System Design': 'Good thinking. How would your design handle 10x the current traffic? What would you scale first?',
      'Technical': pickTechnicalFallbackQuestion(questionNumber),
      'OA': 'Good. Here\'s a follow-up: what if the input size was 10 million? How would you optimize?',
      'Managerial': 'Great example. How did you handle any disagreements within the team during that project?',
    };
    const defaultFallbackByExperience = experienceLevel === 'fresher'
      ? pickTechnicalFallbackQuestion(questionNumber)
      : 'Good answer. Can you compare one alternative approach and explain the trade-off?';
    const fallbackFeedback = normalizeInterviewFeedback({
      feedback: 'That answer is a good start, but it needs one concrete example and a clearer takeaway.',
      strengths: [],
      improvements: [],
      hint: 'Add one real example and finish with the result or lesson learned.',
    }, {
      stage,
      question: previousQuestion,
      answer: userAnswer,
    });
    res.json(withRuntime({
      ...fallbackFeedback,
      followUpQuestion: fallbackFollowUps[stage] || defaultFallbackByExperience,
      score: deterministicScore(72, 15, safeQuestionNumber + (userAnswer?.length || 0)),
      interviewerReaction: 'encouraging',
      thinkTime: 45,
    }));
  }
});


// ─── Get a hint for current question ───
router.post('/hint', optionalAuth, async (req, res) => {
  const { company, role, stage, currentQuestion, conversationHistory } = req.body;

  try {
    if (!groq) {
      return res.json({
        hint: "Try breaking this down step by step. What's the simplest version you could solve first?",
        approach: "Consider starting with a brute force solution, then optimize.",
        keyTopics: ["Time complexity", "Space-time tradeoff", "Edge cases"]
      });
    }

    const completion = await aiCallWithRetry({
      operation: () =>
        groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are a helpful interviewer at ${company}. The candidate is stuck on a ${stage} question for ${role}. 
Give a gentle nudge WITHOUT giving away the answer.

Respond as JSON:
{
  "hint": "A gentle nudge (1-2 sentences)",
  "approach": "Suggested approach without the full answer",
  "keyTopics": ["Topic 1", "Topic 2", "Topic 3"]
}`
            },
            ...(conversationHistory || []).slice(-4).map(h => ({
              role: h.role === 'interviewer' ? 'assistant' : 'user',
              content: String(h.content || '').substring(0, 500)
            })),
            { role: 'user', content: `I'm stuck on: "${currentQuestion}". Can you give me a hint?` }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7
        }),
      timeoutMs: 12000,
      maxRetries: 2,
      baseDelayMs: 250,
    });

    const result = safeJsonParse(completion.choices?.[0]?.message?.content || '');
    if (!result) throw new Error('Failed to parse hint response');
    res.json(result);
  } catch (error) {
    console.error('Hint error:', error.message);
    res.status(500).json({ error: 'Failed to generate hint' });
  }
});


// ─── Rephrase Interview Question ───
router.post('/rephrase', optionalAuth, async (req, res) => {
  const { question, company, stage } = req.body;

  try {
    if (!groq || !question) {
      return res.status(400).json({ error: 'Missing requirements for rephrase' });
    }

    const completion = await aiCallWithRetry({
      operation: () =>
        groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are an interviewer from ${company} conducting a ${stage} interview.
The candidate is struggling to answer the current question or is silent.
Rephrase the question to be simpler, more direct, and easier to understand.
Do not change the core topic, just make it more approachable.

Output ONLY a JSON object with this shape:
{
  "rephrased": "The simpler version of the question"
}`
            },
            { role: 'user', content: `Original question: "${question}"` }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 200,
        }),
      timeoutMs: 8000,
      maxRetries: 2,
      baseDelayMs: 250,
    });

    const result = safeJsonParse(completion.choices?.[0]?.message?.content || '');
    if (!result) throw new Error('Failed to parse rephrase response');
    res.json(result);
  } catch (error) {
    console.error('Rephrase error:', error.message);
    res.status(500).json({ error: 'Failed to rephrase question' });
  }
});


// ─── Real-time nudge for AICopilot NudgeBar ───
router.post('/nudge', optionalAuth, async (req, res) => {
  const { currentQuestion, partialAnswer, stage, company, role: _role } = req.body;

  try {
    if (!groq || !partialAnswer || partialAnswer.length < 20) {
      return res.json({ nudge: null });
    }

    const completion = await aiCallWithRetry({
      operation: () =>
        groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `You are a real-time interview coach. Based on the candidate's partial answer to a ${stage} question at ${company}, give ONE brief coaching tip (max 15 words). Focus on what they should add or fix RIGHT NOW.
Respond as JSON: { "nudge": "your tip", "type": "structure|depth|confidence|filler|pace" }`
            },
            {
              role: 'user',
              content: `Question: ${currentQuestion}\nPartial answer so far: ${partialAnswer.substring(0, 500)}`
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 60
        }),
      timeoutMs: 12000,
      maxRetries: 2,
      baseDelayMs: 250,
    });

    const result = safeJsonParse(completion.choices?.[0]?.message?.content || '');
    if (!result) throw new Error('Failed to parse nudge response');
    res.json(result);
  } catch (error) {
    console.error('Nudge error:', error.message?.substring(0, 100));
    res.json({ nudge: null });
  }
});


// ─── AI Copilot suggestions ───
router.post('/copilot-suggest', optionalAuth, async (req, res) => {
  const { company, role, stage, currentQuestion, partialAnswer, jobDescription } = req.body;

  try {
    if (!groq) {
      return res.json({
        starPrompts: { situation: "Provide context", task: "Describe your goal", action: "Explain steps taken", result: "Share impact" },
        keywords: ["leadership", "metrics", "scaling"],
        gapIndicators: ["Add more specific numbers"],
        strengthIndicators: ["Good problem definition"],
        structureSuggestion: "Start with the problem, then your approach, then results.",
        followUpPredictions: ["Can you elaborate on the negative impacts?"]
      });
    }

    const completion = await aiCallWithRetry({
      operation: () =>
        groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are an expert AI interview copilot helping a candidate in a ${stage} interview at ${company} for ${role}.
The candidate is currently answering this question: "${currentQuestion}".
Their partial answer so far: "${partialAnswer || '(Not started yet)'}".
Job Description context: "${jobDescription || 'Standard software engineering role'}".

Analyze their answer in real-time and provide brief, punchy suggestions to guide them.

Respond strictly in this JSON format:
{
  "starPrompts": {
    "situation": "Brief prompt to establish context (e.g. 'Set the scene with X')",
    "task": "Brief prompt for the challenge",
    "action": "Brief prompt for their specific actions",
    "result": "Brief prompt to share metrics/outcomes"
  },
  "keywords": ["keyword1", "keyword2", "technology3"],
  "gapIndicators": ["Missing metric for X", "Clarify your specific role"],
  "strengthIndicators": ["Clear problem statement", "Good use of tech stack"],
  "structureSuggestion": "1 short sentence suggesting how to structure the rest of the answer.",
  "followUpPredictions": ["Potential follow-up 1", "Potential follow-up 2"]
}`
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.6
        }),
      timeoutMs: 12000,
      maxRetries: 2,
      baseDelayMs: 250,
    });

    const result = safeJsonParse(completion.choices?.[0]?.message?.content || '');
    if (!result) throw new Error('Failed to parse copilot response');
    res.json(result);
  } catch (error) {
    console.error('Copilot suggest error:', error.message);
    res.status(500).json({ error: 'Failed to generate copilot suggestions' });
  }
});


export default router;
