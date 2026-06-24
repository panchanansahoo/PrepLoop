import { aiCallWithRetry } from '../utils/aiClient.js';
import crypto from 'crypto';

export const FRESHER_HR_FIXED = {
    Q1: 'Hey, welcome! Thanks for joining me today. So this will be a pretty relaxed conversation \u2014 I want to get to know you, your interests, and what motivates you. Let\'s kick things off \u2014 tell me a bit about yourself and your journey so far.',
    Q12: 'Do you have any questions for me about the role, the team, or our company?',
};

export const FRESHER_HR_TOPICS = {
    2: { topic: 'Role Interest & Motivation', prompt: 'Ask the candidate what attracted them to this role and to your company in particular. Focus on their genuine interest and alignment with company values.' },
    3: { topic: 'Project & Achievement', prompt: 'Ask the candidate to describe a project or achievement they\'re most proud of, and why. Push them to explain their specific contribution and impact.' },
    4: { topic: 'Problem-Solving & Challenges', prompt: 'Ask the candidate to describe a time when they faced a difficult problem or challenge and how they handled it. Focus on their approach, learning, and outcome.' },
    5: { topic: 'Teamwork & Collaboration', prompt: 'Ask the candidate to tell you about a time they had to work closely with someone whose working style was very different from theirs. Explore how they adapted and the result.' },
    6: { topic: 'Stress Management', prompt: 'Ask the candidate how they usually handle stress or pressure, for example during exams, deadlines, or multiple simultaneous tasks. Listen for their coping strategies and resilience.' },
    7: { topic: 'Strengths & Fit', prompt: 'Ask the candidate to share their key strengths and explain how they will help them succeed in this specific role. Encourage them to give concrete examples.' },
    8: { topic: 'Growth & Development', prompt: 'Ask the candidate what is one area they\'re actively trying to improve and what concrete steps they\'re taking to develop in that area. Look for self-awareness and commitment.' },
    9: { topic: 'Adaptability & Flexibility', prompt: 'Ask the candidate to imagine they are assigned to a technology or location they did not expect. How would they approach that situation? Explore their flexibility and positive attitude.' },
    10: { topic: 'Culture & Fit', prompt: 'Ask the candidate how they define a positive work environment and what aspects of our company culture (mission, values, team dynamics) appeal to them most. Probe their values alignment.' },
    11: { topic: 'Career Goals & Aspirations', prompt: 'Ask the candidate where they see themselves in 3-5 years and how this role fits into their career vision. Look for realistic ambition and alignment with company growth paths.' },
};

export const FRESHER_HR_CLOSINGS = {
    YES: 'Thank you for your thoughtful questions! We really appreciate your interest. We\'ll review our discussion and get back to you soon with next steps.',
    NO: 'Thank you so much for your time today! You\'ve given some really thoughtful answers. We\'ll review our discussion and be in touch soon. Best of luck!',
};

export const FRESHER_TECHNICAL_FIXED = {
    Q1: 'Hey, welcome! So today we\'re going to have a technical chat \u2014 we\'ll cover things like databases, OOP, web concepts, that kind of stuff. But first, I\'d love to hear a bit about you. Tell me about yourself and what technologies you\'ve been most interested in lately.',
    Q12: 'Do you have any questions for me about the role, the team, or our company?',
    Q13_YES: 'Thank you for your thoughtful questions! We really appreciate your interest. We\'ll review our discussion and get back to you soon with next steps.',
    Q13_NO: 'Thank you so much for your time today! You\'ve given some really thoughtful technical answers. We\'ll review our discussion and be in touch soon. Best of luck!',
};

export const FRESHER_TECHNICAL_TOPICS = {
    2: { topic: 'Resume & Projects', prompt: 'Ask the candidate to elaborate on a specific project from their resume. Focus on their role, the tech stack used, and what they learned. Keep it conversational and encouraging.' },
    3: { topic: 'Top Skill', prompt: 'Ask the candidate about the programming language or framework they are most confident in, and ask them to explain a concept they recently learned or used practically.' },
    4: { topic: 'OOP Fundamentals', prompt: 'Ask the candidate to explain one or two foundational OOP concepts (e.g., encapsulation, inheritance, polymorphism, or abstraction) with a real-world example they can think of.' },
    5: { topic: 'Interface vs Abstract Class', prompt: 'Ask the candidate to compare interfaces and abstract classes: What is the difference? When would they use one over the other? Keep the question clear and focused.' },
    6: { topic: 'Primary Key vs Foreign Key', prompt: 'Ask the candidate to explain the difference between primary keys and foreign keys in a database. Ask them to give a simple table example to illustrate.' },
    7: { topic: 'Database Normalization', prompt: 'Ask the candidate what database normalization is and why it matters. Ask them to describe one or two normal forms (1NF, 2NF, 3NF) they\'ve heard of.' },
    8: { topic: 'Language Strengths', prompt: 'Ask the candidate to explain a core concept or strength of their preferred programming language (e.g., memory management, type system, async model). Keep it practical.' },
    9: { topic: 'GET vs POST', prompt: 'Ask the candidate to explain the difference between HTTP GET and POST requests. Push them to mention when to use each and any security implications.' },
    10: { topic: 'Process vs Thread', prompt: 'Ask the candidate to compare processes and threads: What are the key differences? When would you use one over the other? Ask for a clear, straightforward answer.' },
    11: { topic: 'Data Structures', prompt: 'Ask the candidate to explain one fundamental data structure they are comfortable with (e.g., arrays, linked lists, stacks, queues, trees) and when they would use it in practice.' },
};

export const FRESHER_INTERVIEW_TOTAL_QUESTIONS = 13;

export function getFresherTechnicalQuestion(qNum) {
    if (qNum === 1) return FRESHER_TECHNICAL_FIXED.Q1;
    if (qNum === 12) return FRESHER_TECHNICAL_FIXED.Q12;
    return null;
}

export function getFresherTechnicalAIPrompt(qNum) {
    return FRESHER_TECHNICAL_TOPICS[qNum];
}

export function getFresherHRQuestion(qNum) {
    if (qNum === 1) return FRESHER_HR_FIXED.Q1;
    if (qNum === 12) return FRESHER_HR_FIXED.Q12;
    return null;
}

export function getFresherHRAIPrompt(qNum) {
    return FRESHER_HR_TOPICS[qNum];
}

export function getFresherHRClosing(hasQuestions) {
    return hasQuestions ? FRESHER_HR_CLOSINGS.YES : FRESHER_HR_CLOSINGS.NO;
}

export function buildHrResponseSnippet(candidateQuestion = '', company = '') {
    const q = String(candidateQuestion || '').trim();
    if (!q) {
        return `That's a great question! In ${company}, we look for learning agility, ownership, and clear communication during the early months.`;
    }
    if (/team|culture|work environment|manager/i.test(q)) {
        return `That's a great question! The team culture is collaborative and feedback-driven, and new hires receive strong mentorship from peers and leads.`;
    }
    if (/growth|learn|career|promotion|roadmap/i.test(q)) {
        return `That's a great question! We set clear growth goals, run regular feedback check-ins, and provide opportunities to take increasing ownership.`;
    }
    if (/tech|stack|project|role|responsibilit/i.test(q)) {
        return `That's a great question! The role involves shipping real features end-to-end, collaborating closely with engineers, and learning production best practices.`;
    }
    return `That's a great question! We value curiosity, structured problem-solving, and communication, and we support freshers with onboarding and guidance.`;
}

export function isFinalNoAnswer(userAnswer = '') {
    const normalized = String(userAnswer || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (!normalized) return false;
    const directNoPatterns = [
        'no', 'nope', 'nah', 'none', 'nothing', 'no questions',
        'no more questions', 'not really', 'thats all', 'that is all',
        'all good', 'no thats all', 'no that is all', 'no thanks', 'no thank you'
    ];
    if (directNoPatterns.some((pattern) => normalized === pattern)) return true;
    if (normalized.startsWith('no ') || normalized.startsWith('nah ') || normalized.startsWith('nope ')) return true;
    return /\b(no|none|nothing|no questions|no more questions|not really|that(?: is|'s)? all)\b/.test(normalized);
}

export async function generateFresherHRQuestion(qNum, resumeContext = null, groqInjection = null) {
    if (qNum === 1) return FRESHER_HR_FIXED.Q1;
    if (qNum === 12) return FRESHER_HR_FIXED.Q12;
    if (qNum === 13) return null;
    if (qNum < 2 || qNum > 11) return null;

    const topicData = FRESHER_HR_TOPICS[qNum];
    if (!topicData) return null;

    try {
        const groq = groqInjection;
        if (!groq) return null;
        const resumeContext_ = resumeContext || {};
        const contextStr = resumeContext_.summary ? `Candidate context: ${resumeContext_.summary}. ` : '';
        const systemPrompt = `You are a friendly HR interviewer conducting a fresher-level HR interview. ${topicData.prompt}`;
        const userPrompt = `${contextStr}Generate a single, clear HR behavioral interview question for Q${qNum} on the topic: ${topicData.topic}. The question should be appropriate for a fresher (recent grad) and encourage them to share a real example or anecdote. Return ONLY the question, no numbering or explanation.`;

        const completion = await aiCallWithRetry({
            operation: () => groq.chat.completions.create({
                model: 'llama-3.1-8b-instant',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.7,
                max_tokens: 150,
            }),
        });
        return completion?.choices?.[0]?.message?.content?.trim() || null;
    } catch (err) {
        console.error(`Error generating fresher-HR Q${qNum}:`, err.message);
        return null;
    }
}

export async function generateFresherTechnicalQuestion(qNum, resumeContext = null, groqInjection = null) {
    if (qNum === 1) return FRESHER_TECHNICAL_FIXED.Q1;
    if (qNum === 12) return FRESHER_TECHNICAL_FIXED.Q12;
    if (qNum === 13) return null;
    if (qNum < 2 || qNum > 11) return null;

    const topicData = FRESHER_TECHNICAL_TOPICS[qNum];
    if (!topicData) return null;

    try {
        const groq = groqInjection;
        if (!groq) return null;
        const resumeContext_ = resumeContext || {};
        const contextStr = resumeContext_.summary ? `Candidate context: ${resumeContext_.summary}. ` : '';
        const systemPrompt = `You are a friendly technical interviewer conducting a fresher-level interview. ${topicData.prompt}`;
        const userPrompt = `${contextStr}Generate a single, clear technical interview question for Q${qNum} on the topic: ${topicData.topic}. The question should be appropriate for a fresher (recent grad). Return ONLY the question, no numbering or explanation.`;

        const completion = await aiCallWithRetry({
            operation: () => groq.chat.completions.create({
                model: 'llama-3.1-8b-instant',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.7,
                max_tokens: 150,
            }),
        });
        return completion?.choices?.[0]?.message?.content?.trim() || null;
    } catch (err) {
        console.error(`Error generating fresher-technical Q${qNum}:`, err.message);
        return null;
    }
}

export function getFresherQuestionTopic(questionNumber) {
    const topics = {
        2: 'Resume project deep-dive',
        3: 'Top technical skill from resume',
        4: 'OOP fundamentals with examples',
        5: 'Interface vs abstract class',
        6: 'Primary key vs foreign key',
        7: 'Database normalization',
        8: 'Preferred language strengths',
        9: 'HTTP GET vs POST',
        10: 'Process vs thread',
        11: 'Fundamental data structures',
    };
    return topics[questionNumber] || '';
}

export function getFresherScriptedQuestion(questionNumber, company, resumeContext, userAnswer = '') {
    const questions = {
        2: 'Tell me about one project from your resume that you are most proud of. What problem were you solving, and what was your specific contribution?',
        3: 'Which technical skill mentioned in your resume are you most confident in, and where have you applied it practically?',
        4: 'Can you explain the four main OOP principles with one real example from your projects?',
        5: 'How would you compare an interface and an abstract class, and when would you pick one over the other?',
        6: 'In SQL, how do a primary key and a foreign key differ in practice?',
        7: 'Why is database normalization useful, and what problem does it solve in table design?',
        8: 'Which programming language do you prefer for problem solving, and what makes it strong for you?',
        9: 'How do GET and POST differ in HTTP, and when would you use each one?',
        10: 'Can you explain process vs thread with a practical example from what you have learned?',
        11: 'Can you explain one fundamental data structure you are comfortable with and when you would use it?',
        12: 'Do you have any questions for me about the role, team, or company?',
    };
    if (questions[questionNumber]) return questions[questionNumber];
    if (questionNumber === 13) {
        const snippet = buildHrResponseSnippet(userAnswer, company);
        return `${snippet} Are there any other questions you have before we wrap up?`;
    }
    return '';
}

export function getFresherFallbackQuestion(questionNumber, company, resumeContext, userAnswer = '') {
    const fallbacks = {
        2: 'Tell me about one project from your resume that you are most proud of. What problem were you solving, and what was your specific contribution?',
        3: 'Which technical skill from your resume are you most comfortable talking about, and how have you used it in practice?',
        4: 'Can you explain OOP principles using one of your own projects as an example?',
        5: 'How would you distinguish an interface from an abstract class in a real codebase?',
        6: 'How do primary keys and foreign keys work together in SQL when you design tables?',
        7: 'Why do developers normalize databases, and what problem does it help solve?',
        8: 'What programming language do you prefer, and why does it help you solve problems well?',
        9: 'How do GET and POST differ in HTTP, and when would you choose one over the other?',
        10: 'Can you explain process vs thread with a simple practical example from what you know?',
        11: 'Can you explain one data structure you are comfortable with and when you would use it?',
        12: 'Do you have any questions for me about the role, team, or company?',
    };
    if (fallbacks[questionNumber]) return fallbacks[questionNumber];
    if (questionNumber === 13) {
        const snippet = buildHrResponseSnippet(userAnswer, company);
        return `${snippet} Are there any other questions you have before we wrap up?`;
    }
    return '';
}

export async function generateFresherScriptedQuestion(questionNumber, company, resumeContext, userAnswer = '', groqInjection = null) {
    const topic = getFresherQuestionTopic(questionNumber);
    if (!topic) return getFresherScriptedQuestion(questionNumber, company, resumeContext, userAnswer);

    try {
        const groq = groqInjection;
        if (!groq) {
            return getFresherFallbackQuestion(questionNumber, company, resumeContext, userAnswer);
        }

        const resumePrompt = formatResumeContextSimple(resumeContext);
        const topicAngles = {
            2: ['Ask about the most impactful project and the candidate\'s exact role.', 'Focus on what problem the project solved and how it was built.', 'Ask for the architecture/implementation story behind one resume project.'],
            3: ['Ask how the skill was used in a real project or assignment.', 'Ask why they consider it their strongest skill and how they proved it.', 'Ask for one example where that skill helped them solve a problem.'],
            4: ['Ask for the four principles and one example from their own work.', 'Ask them to explain OOP using a simple project scenario.', 'Ask how OOP helps them organize code in practice.'],
            5: ['Ask for the core difference and one practical use case for each.', 'Ask when they would choose one over the other in a project.', 'Ask them to compare both using a coding example.'],
            6: ['Ask what each key does in a database table design.', 'Ask how primary and foreign keys help relate tables.', 'Ask for a practical example of using both keys together.'],
            7: ['Ask why normalization matters for data consistency.', 'Ask what issue normalization solves in a database schema.', 'Ask how they would explain normalization in simple terms.'],
            8: ['Ask which language they prefer and why it fits their problem-solving style.', 'Ask what makes their preferred language practical for coding tasks.', 'Ask how they would describe the strengths of their favorite language.'],
            9: ['Ask the difference between GET and POST with a real API example.', 'Ask when they would choose GET over POST and why.', 'Ask how request semantics differ between GET and POST.'],
            10: ['Ask for a practical example that shows process vs thread.', 'Ask how a process and a thread differ in execution and memory.', 'Ask why the distinction matters in real systems.'],
            11: ['Ask them to explain one data structure they know well and when to use it.', 'Ask how they would choose between different data structures for a problem.', 'Ask for a practical example where they used a specific data structure.'],
        };
        const chosenAngleList = topicAngles[questionNumber] || [];
        const chosenAngle = chosenAngleList.length > 0
            ? chosenAngleList[crypto.randomInt(chosenAngleList.length)]
            : 'Ask the topic naturally and keep it fresher-friendly.';

        const userPrompt = `
Generate the next fresher interview question for question ${questionNumber} of 12 at ${company}.
Topic: ${topic}
Angle to use this run: ${chosenAngle}
${resumePrompt}
Requirements:
- Keep the question to 1-2 sentences max.
- Use the angle above, but paraphrase it naturally.
- For resume-based topics, ask about the candidate's resume/project/skill.
- For fundamentals topics, ask a clear fresher-friendly question.
- Return ONLY JSON: {"question":"..."}`;

        const completion = await aiCallWithRetry({
            operation: () => groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: 'You generate concise, realistic fresher interview questions. Return only JSON.' },
                    { role: 'user', content: userPrompt },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.9,
            }),
            timeoutMs: 10000,
            maxRetries: 1,
            baseDelayMs: 200,
        });

        const parsed = safeJsonParseLocal(completion.choices?.[0]?.message?.content || '{}');
        const question = String(parsed?.question || '').trim();
        if (question) return question;
    } catch { }

    return getFresherFallbackQuestion(questionNumber, company, resumeContext, userAnswer);
}

function safeJsonParseLocal(text) {
    try { return JSON.parse(text); } catch {
        const fenced = text?.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (fenced?.[1]) { try { return JSON.parse(fenced[1].trim()); } catch { } }
        return null;
    }
}

function formatResumeContextSimple(resumeContext) {
    if (!resumeContext || typeof resumeContext !== 'object') return '';
    const headline = String(resumeContext.candidateHeadline || '').trim();
    const summary = String(resumeContext.summary || '').trim();
    const coreSkills = Array.isArray(resumeContext.coreSkills) ? resumeContext.coreSkills.slice(0, 8) : [];
    const projectHighlights = Array.isArray(resumeContext.projectHighlights) ? resumeContext.projectHighlights.slice(0, 4) : [];
    if (!headline && !summary && coreSkills.length === 0 && projectHighlights.length === 0) return '';
    return `
## Candidate Resume Context
- Headline: ${headline || 'Not provided'}
- Summary: ${summary || 'Not provided'}
- Core skills: ${coreSkills.length > 0 ? coreSkills.join(', ') : 'Not provided'}
- Project highlights: ${projectHighlights.length > 0 ? projectHighlights.join(' | ') : 'Not provided'}`;
}
