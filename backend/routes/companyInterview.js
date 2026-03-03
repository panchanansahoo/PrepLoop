import express from 'express';
import Groq from 'groq-sdk';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { getRandomQuestionSet, getFilteredQuestions, getQuestionCount } from '../services/companyQuestionService.js';

const router = express.Router();
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// Multer config for STT audio uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename: (req, file, cb) => cb(null, `stt_${Date.now()}${path.extname(file.originalname) || '.webm'}`)
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, file.mimetype.startsWith('audio/'));
  }
});

// ─── Company Category Classification ───
const COMPANY_CATEGORIES = {
  big4: ['deloitte', 'kpmg', 'ey', 'pwc'],
  faang: ['google', 'amazon', 'meta', 'microsoft', 'apple', 'netflix'],
  indian_it: ['tcs', 'infosys', 'wipro', 'hcl', 'techmahindra', 'cognizant'],
  startup: ['flipkart', 'paytm', 'swiggy', 'zomato', 'razorpay', 'cred', 'meesho'],
};

function getCompanyCategory(company) {
  const id = company.toLowerCase();
  for (const [cat, list] of Object.entries(COMPANY_CATEGORIES)) {
    if (list.some(c => id.includes(c))) return cat;
  }
  return 'general';
}

// ─── Distinct Interviewer Personas ───
const PERSONA_PROFILES = {
  big4: {
    name: 'Senior Partner',
    style: 'Formal & Structured',
    description: 'You speak like a senior consulting partner — formal but warm, structured, and analytical. You use frameworks (MECE, issue trees) and expect structured answers.',
    followUpStyle: 'Ask structured follow-ups using consulting frameworks. Challenge assumptions with data questions.',
    challengeMode: 'When an answer lacks structure, say: "I appreciate the direction, but can you structure that more systematically?"',
  },
  faang: {
    name: 'Staff Engineer',
    style: 'Technical & Deep',
    description: 'You speak like a staff engineer at a top tech company — technically rigorous, direct but friendly. You expect deep technical depth and system-level thinking.',
    followUpStyle: 'Dive deep into implementation details. Ask about time/space complexity, alternatives, and what happens at 10x scale.',
    challengeMode: 'When an answer is surface-level, say: "Good start, but go deeper. What about edge cases? What are the trade-offs?"',
  },
  startup: {
    name: 'CTO / Co-founder',
    style: 'Conversational & Product-minded',
    description: 'You speak like a startup CTO — casual, direct, product-focused. You care about speed, product thinking, and cultural fit.',
    followUpStyle: 'Ask about practical implementation, MVP approach, user impact, and prioritization.',
    challengeMode: 'When an answer is too theoretical, say: "Cool idea, but how would you actually ship this? What\'s your MVP?"',
  },
  indian_it: {
    name: 'Technical Lead',
    style: 'Professional & Fundamentals-focused',
    description: 'You speak like a technical lead at a large IT services company — professional, focused on fundamentals and problem-solving.',
    followUpStyle: 'Test foundational knowledge with follow-ups on CS fundamentals. Ask to compare approaches.',
    challengeMode: 'When an answer misses fundamentals, say: "That\'s partially correct. What are the underlying principles at play here?"',
  },
  general: {
    name: 'Hiring Manager',
    style: 'Balanced & Professional',
    description: 'You speak like an experienced hiring manager — balanced between technical and behavioral assessment.',
    followUpStyle: 'Mix of technical depth and behavioral probing. Ask about real experiences and problem-solving.',
    challengeMode: 'When an answer needs improvement, say: "Good effort. Can you think of a scenario where your approach might not work?"',
  },
};

// ─── Enhanced Interviewer Persona System ───
const getInterviewerPersona = (company, role, stage, difficulty, questionNumber, totalQuestions) => {
  const category = getCompanyCategory(company);
  const persona = PERSONA_PROFILES[category] || PERSONA_PROFILES.general;

  return `
You are a senior interviewer at ${company} conducting a ${stage} round interview for a ${role} position.
Difficulty level: ${difficulty}. This is question ${questionNumber} of ${totalQuestions}.

## IMPORTANT — Candidate Context
The candidate is most likely a STUDENT or RECENT GRADUATE preparing for campus placements or their first job.
- They may have LIMITED or NO professional work experience.
- Their experience comes from: college projects, hackathons, internships, coursework, open-source contributions, personal side projects, competitive programming, or academic research.
- They might be nervous — this could be one of their first mock interviews.
- Frame questions around their LEARNING journey, not their professional career.
- NEVER assume they have had a full-time job before. Use "project" or "experience" instead of "at work" or "in production".

## Your Interviewer Profile
- **Role**: ${persona.name} at ${company}
- **Style**: ${persona.style}
- **Personality**: ${persona.description}

## Engagement Rules - STRICT
- **BE EXTREMELY CONVERSATIONAL AND HUMAN.** Speak like a friendly senior on a video call, not a corporate robot.
- **LIMIT RESPONSES TO 1-3 SENTENCES MAX.** Brevity is critical. Do not give long monologues.
- **SOUND INTELLIGENT AND INSIGHTFUL.** Your questions should demonstrate deep domain expertise. Reference real-world engineering practices, industry trends, and practical scenarios from companies like ${company}.
- **ASK SMART FOLLOW-UPS.** Don't accept surface-level answers. Probe with incisive questions: "What would happen if the load doubled?", "How would you handle the failure case?", "What's the trade-off between these two approaches?"
- **SHOW INTELLECTUAL CURIOSITY.** React with genuine interest: "Oh interesting, so you're saying...", "That's a clever approach — have you considered...", "I like that thinking. What about..."
- Be SUPPORTIVE and ENCOURAGING — treat this like a mentorship conversation, not an interrogation.
- React naturally, referencing SPECIFIC things the candidate said. Say things like "Smart approach!", "That's a great insight", "Ah, I see where you're going with this", or "Nice, that's exactly how we'd think about it at ${company}."
- If the candidate seems nervous or gives a short answer, gently encourage them: "No worries, take your time" or "That's a great start — what if I give you a specific scenario to think through?"
- NEVER use robotic transition phrases like "Moving on to my next question" or "Thank you for that detailed answer."
- ${persona.followUpStyle}
- ${persona.challengeMode}
- When the candidate does well: show genuine, brief enthusiasm that acknowledges their insight ("That's a really mature understanding of the trade-offs!").
- When they struggle: be kind and supportive, guide them with smart hints. Say things like "Think about what data structure gives you O(1) lookups" or "Consider the CAP theorem here."
- Build on previous answers — create a flowing, intellectually stimulating conversation.

## Interview Flow
${questionNumber === 1 ? `- OPENING: Greet warmly like a friendly senior. Say something like: "Hey! Welcome, I'm [Name] from ${company}. Don't stress — this is all about learning. Let's have a fun conversation!" Then ask your first question immediately.` : ''}
${questionNumber === totalQuestions ? `- FINAL QUESTION: Signal this casually and warmly: "Awesome, just one last question and we're done — you're doing great!"` : ''}
${questionNumber > 1 && questionNumber < totalQuestions ? `- Transition naturally from the previous answer. Keep it feeling like an ongoing chat.` : ''}

## Stage-Specific Guidelines — FOLLOW STRICTLY
${stage === 'Technical' ? `- Ask general technical knowledge questions: OOP concepts, databases, networking, OS, design patterns, language fundamentals
- Frame questions around what they've LEARNED: "What did you learn about [topic] in your coursework?" or "Have you used [concept] in any project?"
- ${category === 'faang' ? 'Probe for understanding of fundamentals, then gradually go deeper.' : ''}
- ${category === 'big4' ? 'Focus on problem-solving approach and structured thinking.' : ''}
- ${category === 'indian_it' ? 'Test core CS fundamentals: OOPS, DBMS, OS, SQL, networking — the kind asked in campus placements.' : ''}
- DO NOT ask behavioral or HR-style questions` : ''}
${stage === 'DSA / Coding' ? `- Ask DATA STRUCTURES AND ALGORITHMS coding problems ONLY
- Present a coding problem with clear constraints (input size, expected complexity)
- Topics: arrays, strings, linked lists, trees, graphs, DP, sorting, searching, recursion, greedy
- Ask about time/space complexity
- ${category === 'faang' ? 'Leetcode medium-to-hard. Expect optimal Big-O. Ask about edge cases.' : ''}
- ${category === 'indian_it' ? 'Leetcode easy-to-medium. Basic DS: arrays, strings, stacks, queues, trees.' : ''}
- ${category === 'startup' ? 'Practical coding. Focus on clean code and working solutions.' : ''}
- If student is stuck, offer a gentle hint like "What data structure comes to mind for fast lookups?"
- DO NOT ask behavioral, HR, or system design questions. ONLY coding/algorithm problems.` : ''}
${stage === 'System Design' ? `- Ask system design questions relevant to ${company}'s domain
- Start with requirements, then high-level architecture, then deep dive
- Keep in mind the candidate is a student — start simple and build up
- Probe trade-offs, scaling ideas, database choices
- ${category === 'faang' ? 'Component design, data models, API design. Guide them if they get stuck.' : ''}
- ${category === 'startup' ? 'MVP design, practical architecture, iteration speed.' : ''}
- DO NOT ask coding/DSA or behavioral questions. ONLY system design.` : ''}
${stage === 'HR' ? `- Ask ONLY culture-fit, motivation, and personal questions appropriate for a STUDENT/FRESHER
- Examples: "Tell me about yourself — what are you studying and what excites you about tech?", "Why ${company}?", "Where do you see yourself in 3-5 years?", "What kind of work environment do you thrive in?"
- Ask about: college life, favorite subjects, career aspirations, what they want to learn, hobbies, extracurriculars
- DO NOT ask about salary expectations, current role, or reasons for leaving — they're students!
- ${category === 'big4' ? 'Assess communication skills, curiosity, and willingness to learn.' : ''}
- ${category === 'startup' ? 'Ownership mentality, learning agility, passion for building things.' : ''}
- Be warm, conversational, and genuinely interested in them as a person
- ⚠️ DO NOT ask ANY technical, coding, DSA, or system design questions. STRICTLY HR.` : ''}
${stage === 'Behavioral' ? `- Ask ONLY behavioral/situational questions using STAR method, but framed for STUDENTS
- Examples: "Tell me about a challenging group project in college", "Describe a hackathon or competition you participated in", "Tell me about a time you had to learn something new very quickly for a deadline"
- ${category === 'faang' ? 'Ownership, taking initiative, learning from failure — framed around academic/project experiences.' : ''}
- ${category === 'big4' ? 'Teamwork, communication, handling pressure during exams or project deadlines.' : ''}
- Probe for specifics: "What was YOUR role in the team?", "What did you learn from that?"
- ⚠️ DO NOT ask technical, coding, or DSA questions. STRICTLY behavioral.` : ''}
${stage === 'OA' ? `- Simulate online assessment: coding/aptitude problems
- Clear problem statements with input/output examples
- Focus on problem-solving, logic, code correctness` : ''}
${stage === 'Managerial' ? `- For students: focus on leadership in college activities, event organization, team coordination
- Decision-making, prioritization in academic/project settings
- Mix of behavioral and high-level technical judgment` : ''}
`;
};

// ─── Start Interview ───
router.post('/start', optionalAuth, async (req, res) => {
  const { company, role, stage, difficulty, totalQuestions = 8, useRealQuestions = false } = req.body;

  // If useRealQuestions, pre-load a question set from the company bank
  let questionBank = [];
  let questionSource = 'ai';
  if (useRealQuestions) {
    questionBank = getRandomQuestionSet(company, role, stage, difficulty, totalQuestions);
    if (questionBank.length > 0) {
      questionSource = 'database';
      console.log(`📋 Loaded ${questionBank.length} real questions for ${company} (${stage}/${role}/${difficulty})`);
    } else {
      console.log(`⚠️ No real questions found for ${company} ${stage}/${role}/${difficulty}, falling back to AI`);
    }
  }

  try {
    // If we have real questions, use the first one with AI-generated greeting
    if (questionSource === 'database' && questionBank.length > 0) {
      const firstQ = questionBank[0];
      const greeting = `Hi! Welcome to your ${stage} interview at ${company}. I'm excited to get started! Here's your first question:`;
      const questionText = `${greeting}\n\n${firstQ.question}`;

      // If groq is available, generate a natural greeting wrapping the real question
      if (groq) {
        try {
          const completion = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
              {
                role: 'system',
                content: `You are a friendly interviewer at ${company}. Greet the candidate warmly in 1 sentence, then naturally ask this exact interview question (do NOT change the question content, just present it conversationally):\n\n"${firstQ.question}"\n\nRespond as JSON:\n{\n  "question": "Your greeting + the question asked naturally",\n  "tips": ["Tip 1", "Tip 2"],\n  "thinkTime": 30,\n  "interviewerReaction": "greeting"\n}`
              }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7
          });
          const result = JSON.parse(completion.choices[0].message.content);
          return res.json({
            ...result,
            context: { company, role, stage, difficulty, totalQuestions },
            thinkTime: result.thinkTime || 30,
            interviewerReaction: 'greeting',
            questionSource: 'database',
            questionMeta: { id: firstQ.id, tags: firstQ.tags, difficulty: firstQ.difficulty, frequencyScore: firstQ.frequencyScore },
            questionBank: questionBank.map(q => q.id), // Send IDs so frontend can track which questions to request
          });
        } catch (e) {
          // Fall through to use raw question
        }
      }

      return res.json({
        question: questionText,
        context: { company, role, stage, difficulty, totalQuestions },
        tips: firstQ.hints?.length > 0 ? firstQ.hints : ['Take a moment to collect your thoughts', 'Structure your answer clearly'],
        interviewerReaction: 'greeting',
        thinkTime: 30,
        questionSource: 'database',
        questionMeta: { id: firstQ.id, tags: firstQ.tags, difficulty: firstQ.difficulty, frequencyScore: firstQ.frequencyScore },
        questionBank: questionBank.map(q => q.id),
      });
    }

    if (!groq) {
      // Stage-specific fallback questions
      const fallbackQuestions = {
        'HR': `Hey! Welcome to your HR interview at ${company}. I'm really excited to get to know you! Let's start simple — tell me a bit about yourself, what you're studying, and what excites you about this ${role} role at ${company}?`,
        'Behavioral': `Hey! Welcome to your behavioral interview. I'd love to hear about your experiences. Can you tell me about a challenging project or assignment you worked on — maybe in college or during an internship?`,
        'DSA / Coding': `Hey! Welcome to your coding round. Let's start with a classic problem — given an array of integers, can you walk me through how you'd find two numbers that add up to a target sum? Think about both approach and time complexity.`,
        'System Design': `Hey! Welcome to your system design round at ${company}. Let's start with something fun — how would you design a URL shortening service like bit.ly? Don't worry about getting it perfect, just think out loud!`,
        'Technical': `Hey! Welcome to your technical interview. Let's start — can you explain the difference between a process and a thread? You might have covered this in your OS course!`,
        'OA': `Welcome to your online assessment simulation. Here's your first problem: Given a string, find the length of the longest substring without repeating characters. Take your time to think about your approach.`,
        'Managerial': `Hey! Welcome to the managerial round. I'd like to understand how you work with others. Can you tell me about a time you led or coordinated a team project — maybe in college or a hackathon?`,
      };
      return res.json({
        question: fallbackQuestions[stage] || `Hey! Great to have you here for this ${stage} interview at ${company}. Let's start easy — tell me about a project you've worked on that you're proud of!`,
        context: { company, role, stage, difficulty, totalQuestions },
        tips: ['Take a moment to collect your thoughts', 'Structure your answer: context → approach → result'],
        interviewerReaction: 'greeting',
        thinkTime: 30,
        questionSource: 'ai',
      });
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: getInterviewerPersona(company, role, stage, difficulty, 1, totalQuestions) + `

Respond as JSON:
{
  "question": "Your opening greeting + first question (Extremely natural, max 2-3 sentences total)",
  "tips": ["Tip 1", "Tip 2"],
  "thinkTime": 30,
  "interviewerReaction": "greeting"
}`
        },
        { role: 'user', content: `Start the ${stage} interview for ${role} at ${company}. Greet warmly first.` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8
    });

    const result = JSON.parse(completion.choices[0].message.content);
    res.json({
      ...result,
      context: { company, role, stage, difficulty, totalQuestions },
      thinkTime: result.thinkTime || 30,
      interviewerReaction: result.interviewerReaction || 'greeting',
      questionSource: 'ai',
    });
  } catch (error) {
    console.error('Interview start error:', error.message?.substring(0, 200));
    // Graceful fallback — serve stage-specific opening question
    const fallbackQuestions = {
      'HR': `Hey! Welcome to your HR interview at ${company}. I'm really excited to get to know you! Tell me about yourself — what are you studying and what excites you about this ${role} role at ${company}?`,
      'Behavioral': `Hey! Welcome to your behavioral round. I'd love to hear about your experiences. Tell me about a challenging project or assignment you worked on and how you handled it.`,
      'DSA / Coding': `Hey! Welcome to your coding round. Let's start — given an array of integers, how would you find two numbers that add up to a target sum? Walk me through your approach and time complexity.`,
      'System Design': `Hey! Welcome to your system design interview at ${company}. How would you design a URL shortening service? Think about key components and storage — don't worry about getting it perfect!`,
      'Technical': `Hey! Welcome to your technical interview. Let's start — can you explain the difference between a process and a thread? You might remember this from your OS class!`,
      'OA': `Welcome to your online assessment. Your first problem: Given a string, find the length of the longest substring without repeating characters. Take your time to think carefully!`,
      'Managerial': `Hey! Welcome to the managerial round. Tell me about a time you led or coordinated a group project in college. How did you handle it?`,
    };
    res.json({
      question: fallbackQuestions[stage] || `Hey! Great to have you here for this ${stage} interview at ${company}. Tell me about a project you've worked on that you're proud of!`,
      context: { company, role, stage, difficulty, totalQuestions },
      tips: ['Take a moment to collect your thoughts', 'Structure your answer clearly'],
      interviewerReaction: 'greeting',
      thinkTime: 30,
      questionSource: 'ai',
    });
  }
});

// ─── Adaptive Difficulty Engine ───
function getAdaptiveDifficultyPrompt(lastScore, averageScore, cumulativeScores) {
  if (!lastScore && !averageScore) return '';

  const trend = cumulativeScores && cumulativeScores.length >= 2
    ? (cumulativeScores[cumulativeScores.length - 1] - cumulativeScores[cumulativeScores.length - 2])
    : 0;

  let adaptiveInstruction = '\n## Adaptive Difficulty (IMPORTANT)\n';

  if (averageScore >= 80 || lastScore >= 85) {
    adaptiveInstruction += `The candidate is performing EXCELLENTLY (last: ${lastScore}/100, avg: ${averageScore}/100, trend: ${trend > 0 ? 'improving' : 'stable'}).
- INCREASE difficulty significantly. Ask harder, more nuanced questions.
- Probe for edge cases, system-level thinking, and trade-off analysis.
- Challenge assumptions. Push for optimal solutions.
- Set "difficultyLevel": "hard", "adaptiveNote": brief explanation of why you're increasing difficulty.`;
  } else if (averageScore >= 60 || lastScore >= 60) {
    adaptiveInstruction += `The candidate is performing MODERATELY (last: ${lastScore}/100, avg: ${averageScore}/100, trend: ${trend > 0 ? 'improving' : trend < 0 ? 'declining' : 'stable'}).
- Keep difficulty STEADY at current level.
- Ask clarifying follow-ups that test depth on the same topic.
- If trend is improving, slightly increase complexity.
- Set "difficultyLevel": "medium", "adaptiveNote": brief explanation.`;
  } else {
    adaptiveInstruction += `The candidate is STRUGGLING (last: ${lastScore}/100, avg: ${averageScore}/100).
- DECREASE difficulty. Ask simpler, more foundational questions.
- Give a gentle hint or framework before asking.
- Build confidence — acknowledge what they got right before probing further.
- Set "difficultyLevel": "easy", "adaptiveNote": brief explanation of how you're adjusting.`;
  }

  return adaptiveInstruction;
}

// ─── Follow-up with realistic interviewer behavior ───
router.post('/follow-up', optionalAuth, async (req, res) => {
  const { company, role, stage, difficulty, previousQuestion, userAnswer, conversationHistory, questionNumber = 2, totalQuestions = 8, lastScore, averageScore, cumulativeScores, code, codeLanguage, useRealQuestions = false, questionBankIds, currentQuestionId } = req.body;

  // If using real questions, get the next question from the bank
  let nextRealQuestion = null;
  let realQuestionMeta = null;
  if (useRealQuestions && questionBankIds && questionBankIds.length > 0) {
    const nextIdx = questionNumber - 1; // questionNumber is 1-indexed, and we want the next one
    if (nextIdx < questionBankIds.length) {
      const { getQuestionById } = await import('../services/companyQuestionService.js');
      nextRealQuestion = getQuestionById(questionBankIds[nextIdx]);
      if (nextRealQuestion) {
        realQuestionMeta = { id: nextRealQuestion.id, tags: nextRealQuestion.tags, difficulty: nextRealQuestion.difficulty, frequencyScore: nextRealQuestion.frequencyScore };
      }
    }
  }

  // Get reference answer for current question if available
  let referenceAnswer = null;
  if (useRealQuestions && currentQuestionId) {
    const { getQuestionById: getQ } = await import('../services/companyQuestionService.js');
    const currentQ = getQ(currentQuestionId);
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
      const qIdx = ((questionNumber || 1) - 1) % questions.length;
      const isLast = questionNumber >= totalQuestions;

      return res.json({
        feedback: reactions[Math.floor(Math.random() * reactions.length)],
        followUpQuestion: isLast ? '' : (nextRealQuestion ? nextRealQuestion.question : questions[qIdx]),
        closingRemark: isLast ? `Thank you so much for your time today! You've given some really thoughtful answers. We'll be in touch soon with next steps. Best of luck!` : undefined,
        score: 65 + Math.floor(Math.random() * 25),
        strengths: [
          ['Clear communication', 'Structured thinking', 'Good examples'][Math.floor(Math.random() * 3)],
          ['Technical depth', 'Problem-solving mindset', 'Practical approach'][Math.floor(Math.random() * 3)]
        ],
        improvements: [
          ['Add more specific metrics', 'Consider edge cases', 'Discuss trade-offs'][Math.floor(Math.random() * 3)],
          ['Mention real-world experience', 'Think about scalability', 'Explore alternatives'][Math.floor(Math.random() * 3)]
        ],
        interviewerReaction: ['encouraging', 'impressed', 'probing', 'neutral'][Math.floor(Math.random() * 4)],
        thinkTime: 30 + Math.floor(Math.random() * 30),
        hint: ['Think about time vs space trade-offs', 'Consider the edge cases first', 'Try working through a small example', 'What would happen at scale?'][Math.floor(Math.random() * 4)],
        questionSource: nextRealQuestion ? 'database' : 'ai',
        questionMeta: realQuestionMeta || null,
      });
    }

    const isLastQuestion = questionNumber >= totalQuestions;

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

    const adaptivePrompt = getAdaptiveDifficultyPrompt(lastScore, averageScore, cumulativeScores);

    // Build reference answer context if using real questions
    const referenceContext = referenceAnswer ? `

## Reference Answer (for your evaluation only, DO NOT reveal this to the candidate):
"${referenceAnswer.substring(0, 500)}"
Use this as a benchmark to evaluate the candidate's answer. Score higher if they cover the key points from the reference.` : '';

    // Build real question injection if available
    const realQuestionInstruction = (nextRealQuestion && !isLastQuestion) ? `

## IMPORTANT: Use This Exact Question as Your Follow-Up
You MUST use this question as your follow-up (present it naturally, in your own words, but keep the core question intact):
"${nextRealQuestion.question}"
Do NOT generate a different question. Transitions should be natural.` : '';

    const messages = [
      {
        role: 'system',
        content: getInterviewerPersona(company, role, stage, difficulty, questionNumber, totalQuestions) + adaptivePrompt + codeContext + referenceContext + realQuestionInstruction + `

The candidate just answered a question. You must:
1. React naturally to their answer (say something like "Makes sense", "Got it")
2. Give extremely brief, actionable feedback internally (do not speak the "feedback" block aloud)
3. ${isLastQuestion ? 'This is the LAST answer. Provide a short, warm closing compliment.' : 'Ask a follow-up that digs deeper OR moves to a new topic naturally. Keep the spoken "followUpQuestion" to 1-2 sentences MAX.'}
4. Provide score, strengths, improvements
5. Include a subtle hint for the next question
6. Suggest think time in seconds

IMPORTANT: The "followUpQuestion" and "closingRemark" must sound like a real human speaking on a Zoom call. No robotic transitions. Keep it under 3 sentences.

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
      ...(conversationHistory || []).map(h => ({
        role: h.role === 'interviewer' ? 'assistant' : 'user',
        content: h.content
      })),
      { role: 'assistant', content: previousQuestion },
      { role: 'user', content: code ? `${userAnswer}\n\n[Code submitted in ${codeLanguage || 'unknown'}]:\n${code}` : userAnswer }
    ];

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.75
    });

    const result = JSON.parse(completion.choices[0].message.content);
    res.json({
      ...result,
      interviewerReaction: result.interviewerReaction || 'neutral',
      thinkTime: result.thinkTime || 45,
      hint: result.hint || 'Try breaking the problem into smaller parts',
      difficultyLevel: result.difficultyLevel || 'medium',
      adaptiveNote: result.adaptiveNote || null,
      codeFeedback: result.codeFeedback || null,
      questionSource: nextRealQuestion ? 'database' : 'ai',
      questionMeta: realQuestionMeta || null,
      referenceAnswer: referenceAnswer || null,
    });
  } catch (error) {
    console.error('Follow-up error:', error.message?.substring(0, 200));
    // Graceful fallback — contextual follow-up
    const fallbackFollowUps = {
      'HR': 'That\'s interesting! Can you tell me about your career goals? Where do you see yourself in a few years after starting your career?',
      'Behavioral': 'Good insight. Can you give me another example where you showed leadership or took initiative — maybe in a college project or extracurricular?',
      'DSA / Coding': 'Nice approach. Now, can you think of a way to optimize that solution? What would the time and space complexity be?',
      'System Design': 'Good thinking. How would your design handle 10x the current traffic? What would you scale first?',
      'Technical': 'Solid answer. Can you explain how this concept applies in a distributed systems context?',
      'OA': 'Good. Here\'s a follow-up: what if the input size was 10 million? How would you optimize?',
      'Managerial': 'Great example. How did you handle any disagreements within the team during that project?',
    };
    res.json({
      feedback: 'That\'s a thoughtful response! I can see you\'ve given this real thought.',
      followUpQuestion: fallbackFollowUps[stage] || 'Can you walk me through how you would optimize that solution? What trade-offs would you consider?',
      score: 72 + Math.floor(Math.random() * 15),
      strengths: ['Clear communication', 'Structured thinking'],
      improvements: ['Add more specific examples', 'Consider edge cases'],
      interviewerReaction: 'encouraging',
      thinkTime: 45,
      hint: 'Try breaking the problem into smaller parts'
    });
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

    const completion = await groq.chat.completions.create({
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
          content: h.content
        })),
        { role: 'user', content: `I'm stuck on: "${currentQuestion}". Can you give me a hint?` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    });

    const result = JSON.parse(completion.choices[0].message.content);
    res.json(result);
  } catch (error) {
    console.error('Hint error:', error.message);
    res.status(500).json({ error: 'Failed to generate hint' });
  }
});

// ─── Real-time nudge for AICopilot NudgeBar ───
router.post('/nudge', optionalAuth, async (req, res) => {
  const { currentQuestion, partialAnswer, stage, company, role } = req.body;

  try {
    if (!groq || !partialAnswer || partialAnswer.length < 20) {
      return res.json({ nudge: null });
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant', // Fast model for sub-200ms response
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
    });

    const result = JSON.parse(completion.choices[0].message.content);
    res.json(result);
  } catch (error) {
    console.error('Nudge error:', error.message?.substring(0, 100));
    res.json({ nudge: null });
  }
});

// ─── Evaluate overall interview session ───
router.post('/evaluate', optionalAuth, async (req, res) => {
  const { company, role, stage, conversation } = req.body;

  try {
    if (!groq) {
      return res.json({
        overallScore: 78,
        summary: 'Solid performance with room for improvement in technical depth.',
        strengths: ['Good communication', 'Structured responses', 'Clear problem-solving'],
        improvements: ['Add more technical detail', 'Use specific metrics', 'Consider edge cases'],
        recommendation: 'Practice more system design questions for this role.',
        verdictEmoji: '👍',
        verdict: 'Would Advance',
        detailedBreakdown: { technicalSkills: 75, communication: 82, problemSolving: 78, cultureFit: 80 },
        suggestedTopics: [
          { topic: 'Hash Maps & Hash Tables', priority: 'high', reason: 'Strengthen your data structure fundamentals' },
          { topic: 'System Design Basics', priority: 'medium', reason: 'Practice designing scalable systems' },
          { topic: 'STAR Method for Behavioral', priority: 'medium', reason: 'Structure your behavioral answers better' }
        ],
        practiceQuestions: [
          'Implement an LRU Cache using a hash map and doubly linked list.',
          'Design a URL shortening service like bit.ly. Discuss database choices and scaling.',
          'Tell me about a time you failed and what you learned from it. Use the STAR method.',
          'Explain the difference between TCP and UDP. When would you use each?',
          'How would you find the kth largest element in an unsorted array?'
        ],
        studyPlan: [
          { day: 'Day 1-2', focus: 'Data Structures', tasks: ['Arrays & Strings problems', 'Hash Map implementations', 'Linked List operations'] },
          { day: 'Day 3-4', focus: 'Algorithms', tasks: ['Sorting & Searching', 'Two Pointer technique', 'Sliding Window problems'] },
          { day: 'Day 5', focus: 'System Design', tasks: ['Read system design primer', 'Practice 1 design question', 'Study CAP theorem'] },
          { day: 'Day 6', focus: 'Behavioral', tasks: ['Prepare 5 STAR stories', 'Practice mock answers aloud', 'Research company values'] },
          { day: 'Day 7', focus: 'Mock Interview', tasks: ['Full mock interview practice', 'Review weak areas', 'Refine communication'] }
        ]
      });
    }

    const conversationText = conversation
      .filter(c => c.role !== 'feedback')
      .map(c => `${c.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${c.content}`)
      .join('\n');

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are the interview panel at ${company} evaluating a ${stage} interview for ${role}.
The candidate is most likely a STUDENT or RECENT GRADUATE — evaluate them fairly for their experience level.
Be honest but constructive and encouraging. Reference SPECIFIC things the candidate said.
Celebrate what they did well, and frame improvements as growth opportunities, not failures.

IMPORTANT: Based on the candidate's ACTUAL answers and weak areas, provide highly specific, actionable improvement suggestions.
- suggestedTopics: Pick 3-5 specific technical/behavioral topics they should study based on WHERE they struggled
- practiceQuestions: Generate 5 realistic practice questions targeting their weak spots
- studyPlan: Create a practical 7-day study plan with daily focus areas and specific tasks

Respond as JSON:
{
  "overallScore": 0-100,
  "summary": "2-3 sentence evaluation referencing specific things they said",
  "strengths": ["Specific Strength 1", "Specific Strength 2", "Specific Strength 3"],
  "improvements": ["Specific Area 1", "Specific Area 2", "Specific Area 3"],
  "recommendation": "One practical recommendation",
  "verdict": "Strong Hire / Would Advance / Borderline / Would Not Advance",
  "verdictEmoji": "🌟 or 👍 or 🤔 or 👎",
  "detailedBreakdown": { "technicalSkills": 0-100, "communication": 0-100, "problemSolving": 0-100, "cultureFit": 0-100 },
  "suggestedTopics": [
    { "topic": "Specific Topic Name", "priority": "high|medium|low", "reason": "Why they should study this based on their answers" }
  ],
  "practiceQuestions": [
    "Practice question 1 targeting a weak area",
    "Practice question 2 targeting another weak area",
    "Practice question 3",
    "Practice question 4",
    "Practice question 5"
  ],
  "studyPlan": [
    { "day": "Day 1-2", "focus": "Focus Area", "tasks": ["Task 1", "Task 2", "Task 3"] },
    { "day": "Day 3-4", "focus": "Focus Area", "tasks": ["Task 1", "Task 2", "Task 3"] },
    { "day": "Day 5", "focus": "Focus Area", "tasks": ["Task 1", "Task 2"] },
    { "day": "Day 6", "focus": "Focus Area", "tasks": ["Task 1", "Task 2"] },
    { "day": "Day 7", "focus": "Review & Practice", "tasks": ["Task 1", "Task 2"] }
  ]
}`
        },
        { role: 'user', content: conversationText }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6
    });

    const result = JSON.parse(completion.choices[0].message.content);
    res.json(result);
  } catch (error) {
    console.error('Evaluation error:', error.message);
    res.status(500).json({ error: 'Failed to evaluate interview' });
  }
});

// ─── Detailed per-question report ───
router.post('/detailed-report', optionalAuth, async (req, res) => {
  const { company, role, stage, conversation, sessionScores, speechHistory } = req.body;

  try {
    // Extract Q&A pairs from conversation
    const qaPairs = [];
    let currentQ = null;
    for (const msg of (conversation || [])) {
      if (msg.role === 'interviewer' && !currentQ) {
        currentQ = { question: msg.content, questionSource: msg.questionSource, questionMeta: msg.questionMeta };
      } else if (msg.role === 'candidate' && currentQ) {
        qaPairs.push({ ...currentQ, answer: msg.content, timestamp: msg.timestamp });
        currentQ = null;
      } else if (msg.role === 'interviewer' && currentQ) {
        // New question without an answer to the previous one
        currentQ = { question: msg.content, questionSource: msg.questionSource, questionMeta: msg.questionMeta };
      } else if (msg.role === 'feedback' && qaPairs.length > 0) {
        // Attach feedback score to the last Q&A pair
        qaPairs[qaPairs.length - 1].inlineScore = msg.score;
        qaPairs[qaPairs.length - 1].strengths = msg.strengths;
        qaPairs[qaPairs.length - 1].improvements = msg.improvements;
      }
    }

    if (!groq) {
      // Fallback: generate a basic report from collected data
      const questionBreakdown = qaPairs.map((qa, i) => ({
        questionNumber: i + 1,
        question: qa.question?.substring(0, 200),
        candidateAnswer: qa.answer?.substring(0, 300),
        score: qa.inlineScore || (sessionScores?.[i] || 70),
        category: stage?.toLowerCase() || 'technical',
        feedback: 'Good response with room for improvement.',
        strengths: qa.strengths || ['Clear communication'],
        improvements: qa.improvements || ['Add more specifics'],
        idealAnswerPoints: ['Cover key concepts', 'Use specific examples', 'Discuss trade-offs'],
      }));

      return res.json({
        overallScore: sessionScores?.length > 0 ? Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length) : 72,
        summary: `Completed ${qaPairs.length} questions in ${stage} round at ${company}.`,
        verdict: 'Would Advance',
        verdictEmoji: '👍',
        questionBreakdown,
        categoryScores: { technicalSkills: 75, communication: 80, problemSolving: 72, cultureFit: 78 },
        speechAnalysis: speechHistory?.length > 0 ? {
          overallWPM: Math.round(speechHistory.reduce((a, s) => a + (s.wpm || 0), 0) / speechHistory.length),
          totalFillers: speechHistory.reduce((a, s) => a + (s.totalFillers || 0), 0),
          clarityTrend: speechHistory.map(s => s.clarityScore || 80),
          confidenceTrend: speechHistory.map(s => s.confidenceScore || 75),
        } : null,
        recommendations: [
          { area: 'Practice', action: `Review ${stage} questions for ${company}`, resources: ['/company-prep'] },
          { area: 'Communication', action: 'Focus on structuring answers with STAR method', resources: ['/learning-path'] },
        ],
        companyFitScore: 76,
        companyFitNotes: `Shows potential alignment with ${company}'s values.`,
      });
    }

    // Build Q&A summary for AI analysis
    const qaText = qaPairs.map((qa, i) =>
      `Q${i + 1}: ${qa.question?.substring(0, 300)}\nA${i + 1}: ${qa.answer?.substring(0, 500)}\nInline Score: ${qa.inlineScore || 'N/A'}`
    ).join('\n\n');

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a senior interviewing panel at ${company} creating a DETAILED post-interview report for a ${stage} interview for ${role}.
Analyze EACH question-answer pair individually. Be specific — reference actual content from answers.

Respond as JSON:
{
  "overallScore": 0-100,
  "summary": "3-4 sentence comprehensive evaluation",
  "verdict": "Strong Hire / Would Advance / Borderline / Would Not Advance",
  "verdictEmoji": "🌟 or 👍 or 🤔 or 👎",
  "questionBreakdown": [
    {
      "questionNumber": 1,
      "question": "The question asked",
      "score": 0-100,
      "category": "technical|behavioral|system-design|hr|coding",
      "feedback": "2-3 sentence specific feedback on THIS answer",
      "strengths": ["Specific strength 1", "Specific strength 2"],
      "improvements": ["Specific improvement 1"],
      "idealAnswerPoints": ["Key point they should have covered", "Another key point"]
    }
  ],
  "categoryScores": { "technicalSkills": 0-100, "communication": 0-100, "problemSolving": 0-100, "cultureFit": 0-100 },
  "recommendations": [
    { "area": "Area name", "action": "Specific actionable recommendation" }
  ],
  "companyFitScore": 0-100,
  "companyFitNotes": "1-2 sentences on company-specific fit"
}`
        },
        { role: 'user', content: `Analyze this interview:\n\n${qaText}` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5
    });

    const result = JSON.parse(completion.choices[0].message.content);

    // Merge speech analysis data if available
    if (speechHistory?.length > 0) {
      result.speechAnalysis = {
        overallWPM: Math.round(speechHistory.reduce((a, s) => a + (s.wpm || 0), 0) / speechHistory.length),
        totalFillers: speechHistory.reduce((a, s) => a + (s.totalFillers || 0), 0),
        clarityTrend: speechHistory.map(s => s.clarityScore || 80),
        confidenceTrend: speechHistory.map(s => s.confidenceScore || 75),
      };
    }

    // Attach candidate answers to the breakdown for display
    if (result.questionBreakdown) {
      result.questionBreakdown.forEach((q, i) => {
        if (qaPairs[i]) {
          q.candidateAnswer = qaPairs[i].answer?.substring(0, 500);
          q.questionSource = qaPairs[i].questionSource;
          q.questionMeta = qaPairs[i].questionMeta;
        }
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Detailed report error:', error.message);
    res.status(500).json({ error: 'Failed to generate detailed report' });
  }
});

// ─── Analyze speech for pace, fillers, clarity ───
router.post('/speech-feedback', optionalAuth, async (req, res) => {
  const { transcript, duration } = req.body;

  try {
    const words = transcript.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const wpm = duration > 0 ? Math.round((wordCount / duration) * 60) : 0;

    const fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'so', 'right', 'i mean', 'kind of', 'sort of'];
    const fillerCount = {};
    let totalFillers = 0;
    const lowerTranscript = transcript.toLowerCase();
    fillerWords.forEach(fw => {
      const regex = new RegExp(`\\b${fw}\\b`, 'gi');
      const matches = lowerTranscript.match(regex);
      if (matches && matches.length > 0) {
        fillerCount[fw] = matches.length;
        totalFillers += matches.length;
      }
    });

    const fillerRate = wordCount > 0 ? (totalFillers / wordCount * 100).toFixed(1) : 0;

    let paceAssessment = 'Good';
    if (wpm < 100) paceAssessment = 'Too slow — try to speak more confidently';
    else if (wpm > 180) paceAssessment = 'Too fast — slow down for clarity';
    else if (wpm >= 130 && wpm <= 160) paceAssessment = 'Excellent pace!';

    let clarityScore = 85;
    if (totalFillers > 5) clarityScore -= totalFillers * 2;
    if (wpm < 90 || wpm > 190) clarityScore -= 10;
    clarityScore = Math.max(0, Math.min(100, clarityScore));

    const avgWordLength = words.length > 0 ? words.reduce((a, w) => a + w.length, 0) / words.length : 0;
    let confidenceScore = 70;
    if (wpm >= 120 && wpm <= 170) confidenceScore += 10;
    if (totalFillers <= 2) confidenceScore += 10;
    if (avgWordLength > 4.5) confidenceScore += 5;
    if (wordCount > 50) confidenceScore += 5;
    confidenceScore = Math.min(100, confidenceScore);

    res.json({
      wordCount, wpm, paceAssessment, fillerCount, totalFillers,
      fillerRate: `${fillerRate}%`, clarityScore, confidenceScore,
      tips: [
        totalFillers > 3 ? `Reduce filler words (found ${totalFillers}: ${Object.keys(fillerCount).join(', ')})` : 'Great job minimizing filler words!',
        wpm < 120 ? 'Speak a bit faster to maintain engagement' : wpm > 170 ? 'Slow down slightly' : 'Your pace is great!',
        'Pause briefly between key points for emphasis',
        confidenceScore < 70 ? 'Try to sound more assertive' : 'Good confidence level!'
      ]
    });
  } catch (error) {
    console.error('Speech feedback error:', error.message);
    res.status(500).json({ error: 'Failed to analyze speech' });
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

    const completion = await groq.chat.completions.create({
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
    });

    const result = JSON.parse(completion.choices[0].message.content);
    res.json(result);
  } catch (error) {
    console.error('Copilot suggest error:', error.message);
    res.status(500).json({ error: 'Failed to generate copilot suggestions' });
  }
});

// ─── Text-to-Speech (Orpheus TTS) ───
router.post('/tts', optionalAuth, async (req, res) => {
  const { text, persona } = req.body;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Text is required' });
  }

  // Voice selection based on interviewer persona
  const voiceMap = {
    friendly: 'diana',
    analytical: 'tara',
    formal: 'charlie',
    casual: 'leo',
    default: 'diana'
  };
  const selectedVoice = voiceMap[persona] || voiceMap.default;

  try {
    if (!groq) {
      return res.status(503).json({ error: 'AI service unavailable', fallback: true });
    }

    if (text.length > 1500) {
      return res.status(413).json({ error: 'Text too long for TTS', fallback: true });
    }

    // Primary: Orpheus with persona-selected voice
    const response = await groq.audio.speech.create({
      model: 'canopylabs/orpheus-v1-english',
      input: text,
      voice: selectedVoice,
      response_format: 'wav',
    });

    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.length < 100) {
      return res.status(500).json({ error: 'TTS returned empty audio', fallback: true });
    }

    res.set({
      'Content-Type': 'audio/wav',
      'Content-Length': buffer.length,
      'Cache-Control': 'no-cache',
    });
    res.send(buffer);
  } catch (error) {
    console.error('Orpheus TTS error:', error.message?.substring(0, 200));

    // Fallback: try PlayAI
    try {
      const response = await groq.audio.speech.create({
        model: 'playai-tts',
        input: text,
        voice: 'Arista-PlayAI',
        response_format: 'wav',
      });
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length > 100) {
        res.set({ 'Content-Type': 'audio/wav', 'Content-Length': buffer.length, 'Cache-Control': 'no-cache' });
        return res.send(buffer);
      }
    } catch (fallbackErr) {
      console.error('PlayAI fallback failed:', fallbackErr.message?.substring(0, 200));
    }

    res.status(500).json({ error: 'TTS failed', fallback: true });
  }
});

// ─── Speech-to-Text (Whisper) ───
router.post('/stt', optionalAuth, upload.single('audio'), async (req, res) => {
  const filePath = req.file?.path;

  try {
    if (!groq) {
      if (filePath) fs.unlinkSync(filePath);
      return res.status(503).json({ error: 'AI service unavailable' });
    }

    if (!filePath) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const transcription = await groq.audio.transcriptions.create({
      model: 'whisper-large-v3-turbo',
      file: fs.createReadStream(filePath),
      response_format: 'json',
    });

    // Clean up temp file
    try { fs.unlinkSync(filePath); } catch { }

    res.json({
      text: transcription.text || '',
      language: transcription.language || 'en',
    });
  } catch (error) {
    console.error('STT error:', error.message);
    try { if (filePath) fs.unlinkSync(filePath); } catch { }
    res.status(500).json({ error: 'STT failed' });
  }
});

// ─── Save Interview Session ───
router.post('/save-session', optionalAuth, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(200).json({ message: 'Guest session not saved' });

  const {
    type = 'single', company, role, stage, difficulty,
    conversation, scores, overallScore, summaryData,
    speechMetrics, emotionData, proctoringViolations,
    rounds, completedAt
  } = req.body;

  try {
    const { data, error } = await supabaseAdmin
      .from('interview_sessions')
      .insert({
        user_id: userId,
        session_type: type,
        company,
        role,
        stage: type === 'multi-round' ? 'Multi-Round' : stage,
        difficulty,
        conversation: conversation || [],
        scores: scores || [],
        overall_score: overallScore || 0,
        summary_data: summaryData || {},
        speech_metrics: speechMetrics || null,
        emotion_data: emotionData || null,
        proctoring_violations: proctoringViolations || [],
        rounds: rounds || null,
        completed_at: completedAt || new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, sessionId: data.id });
  } catch (error) {
    console.error('Save session error:', error.message);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

// ─── List User's Interview Sessions ───
router.get('/sessions', authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const { limit = 20, offset = 0, company, stage } = req.query;

  try {
    let query = supabaseAdmin
      .from('interview_sessions')
      .select('id, session_type, company, role, stage, difficulty, overall_score, completed_at, created_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (company) query = query.eq('company', company);
    if (stage) query = query.eq('stage', stage);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('List sessions error:', error.message);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// ─── Get Session Detail ───
router.get('/sessions/:id', authenticateToken, async (req, res) => {
  const userId = req.user?.id;

  try {
    const { data, error } = await supabaseAdmin
      .from('interview_sessions')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Session not found' });
    res.json(data);
  } catch (error) {
    console.error('Get session error:', error.message);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// ─── Analytics Aggregation ───
router.get('/analytics', authenticateToken, async (req, res) => {
  const userId = req.user?.id;

  try {
    const { data: sessions, error } = await supabaseAdmin
      .from('interview_sessions')
      .select('overall_score, company, stage, difficulty, completed_at, scores, speech_metrics, emotion_data, proctoring_violations')
      .eq('user_id', userId)
      .order('completed_at', { ascending: true });

    if (error) throw error;

    const totalSessions = sessions?.length || 0;
    if (totalSessions === 0) {
      return res.json({
        totalSessions: 0, averageScore: 0, scoreTrend: [],
        companyBreakdown: {}, stageBreakdown: {}, recentImprovement: 0
      });
    }

    const scores = sessions.map(s => s.overall_score || 0);
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    // Score trend over time
    const scoreTrend = sessions.map(s => ({
      date: s.completed_at,
      score: s.overall_score || 0,
      company: s.company,
      stage: s.stage
    }));

    // Breakdown by company
    const companyBreakdown = {};
    sessions.forEach(s => {
      if (!companyBreakdown[s.company]) companyBreakdown[s.company] = { count: 0, totalScore: 0 };
      companyBreakdown[s.company].count++;
      companyBreakdown[s.company].totalScore += s.overall_score || 0;
    });
    Object.keys(companyBreakdown).forEach(k => {
      companyBreakdown[k].avgScore = Math.round(companyBreakdown[k].totalScore / companyBreakdown[k].count);
    });

    // Breakdown by stage
    const stageBreakdown = {};
    sessions.forEach(s => {
      if (!stageBreakdown[s.stage]) stageBreakdown[s.stage] = { count: 0, totalScore: 0 };
      stageBreakdown[s.stage].count++;
      stageBreakdown[s.stage].totalScore += s.overall_score || 0;
    });
    Object.keys(stageBreakdown).forEach(k => {
      stageBreakdown[k].avgScore = Math.round(stageBreakdown[k].totalScore / stageBreakdown[k].count);
    });

    // Recent improvement (last 5 vs first 5)
    const first5 = scores.slice(0, Math.min(5, scores.length));
    const last5 = scores.slice(Math.max(0, scores.length - 5));
    const recentImprovement = Math.round(
      (last5.reduce((a, b) => a + b, 0) / last5.length) -
      (first5.reduce((a, b) => a + b, 0) / first5.length)
    );

    res.json({
      totalSessions,
      averageScore,
      scoreTrend,
      companyBreakdown,
      stageBreakdown,
      recentImprovement
    });
  } catch (error) {
    console.error('Analytics error:', error.message);
    res.status(500).json({ error: 'Failed to compute analytics' });
  }
});

export default router;
