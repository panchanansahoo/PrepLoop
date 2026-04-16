import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const FIXED_INTRO_QUESTIONS = [
  "To begin with, could you introduce yourself and walk me through your background?",
  "Can you tell me about a project or achievement that you're most proud of, and why?",
  "Describe a time when you faced a difficult problem or challenge. How did you handle it?",
  "What programming languages do you know/use regularly?",
  "Have you used object-oriented design in a project?"
];

const HR_QUESTIONS = [
  "What attracted you to this role and to our company in particular?",
  "Tell me about a time you had to work closely with someone whose working style was very different from yours.",
  "How do you usually handle stress or pressure, for example during exams, deadlines, or multiple tasks?",
  "What are your key strengths, and how will they help you succeed in this role?",
  "What is one area you're actively trying to improve, and what are you doing about it?",
  "Imagine you are assigned to a technology or location you did not expect. How would you approach that situation?",
  "How do you motivate your team during difficult times?",
  "What are your salary expectations?",
  "Are you willing to work overtime/unsociable hours?",
  "What do you know about our company?",
  "Describe a time you failed. How did you handle it?",
  "Why should we hire you?",
  "Why do you want to join our company?",
  "Are you willing to relocate?",
  "Where do you see yourself in 5 years?",
  "What are your strengths/weaknesses?",
  "Can you handle tight deadlines?"
];

const TECHNICAL_QUESTIONS = {
  core: [
    "Can you explain the main OOP concepts (encapsulation, inheritance, polymorphism, abstraction) with a simple example?",
    "What is the difference between an array and a linked list? When would you use each?",
    "What is the difference between a stack and a queue? Can you give a real life example of each?",
    "What are the different types of loops in your preferred programming language, and when do you use them?",
    "Can you write or dry run a simple program to reverse a string or check if a number is a palindrome?"
  ],
  dbms: [
    "What is a primary key and a foreign key? Why are they important in a database design?",
    "What is normalization? Why do we use it in databases?",
    "What is the difference between process and thread? Can you give an example?",
    "Which SDLC models do you know? Can you briefly compare Waterfall and Agile?",
    "Can you explain what an HTTP request is and the difference between GET and POST?",
    "What is Agile methodology? Benefits & drawbacks",
    "Explain SQL vs NoSQL databases",
    "What are ACID properties?",
    "How would you optimize a slow SQL query?",
    "What is multithreading vs multiprocessing?",
    "What is a deadlock?"
  ],
  java: [
    "What is Java? What are the main features of Java (platform independent, object oriented, etc.)?",
    "What is the difference between JDK, JRE, and JVM?",
    "Why is Java called platform independent?",
    "What is the purpose of the main method in Java?",
    "What is the difference between == and equals() when comparing strings in Java?",
    "What are the four pillars of OOP (encapsulation, inheritance, polymorphism, abstraction)? Explain with simple examples.",
    "What is a class and what is an object in Java? Give a real world example.",
    "What is the difference between an abstract class and an interface in Java?",
    "What is method overloading and method overriding? Give examples.",
    "What is encapsulation? How do access modifiers (private, public, protected, default) help achieve it in Java?",
    "What is a virtual function in C++/Java?",
    "What is inheritance?",
    "Explain SOLID design principles"
  ],
  python: [
    "What is Python, and what are some advantages of using it (interpreted, high level, portable, etc.)?",
    "What are the basic data types in Python (int, float, string, list, tuple, dict, set)? Give a small example of each.",
    "What is the difference between a list and a tuple in Python?",
    "What is the difference between a list and a dictionary? When would you use a dictionary?",
    "What is the difference between == and is in Python?",
    "What is a function in Python? How do you define and call a function?",
    "What is the difference between local and global variables in Python?",
    "What is a class and what is an object in Python? Give a real world example.",
    "Explain the four main OOP concepts (encapsulation, inheritance, polymorphism, abstraction) with simple examples in Python."
  ],
  dsa: [
    "Write a simple program to count vowels in a string",
    "Write a program to print the Fibonacci series up to n",
    "Write a program to check if a number is even or odd",
    "Reverse a string",
    "Check if string is palindrome",
    "Find factorial of a number",
    "Prime number check",
    "Find maximum/minimum in array"
  ]
};

const FIXED_TECHNICAL_INTRO = TECHNICAL_QUESTIONS.core;

// In-memory session store (use Redis in production)
const sessions = new Map();

router.post('/start', authenticateToken, async (req, res) => {
  try {
    const { interviewerName, role, company, roundName } = req.body;

    const sessionId = `${req.user.id}-${Date.now()}`;
    
    sessions.set(sessionId, {
      userId: req.user.id,
      interviewerName: interviewerName || "NAME",
      role: role || "role with company",
      company: company || "our organisation",
      roundName: roundName || "round name",
      phase: 'intro',
      currentQuestionIndex: 0,
      askedQuestions: [],
      responses: [],
      startedAt: new Date().toISOString()
    });

    const greeting = `Good afternoon, my name is "${interviewerName || "NAME"}", I work as an "${role || "role with company"}", and I'll be conducting your "${roundName || "round name"}" discussion today. We'll mainly talk about your background, your interests, and see how you fit with our organisation.`;

    res.json({
      sessionId,
      greeting,
      firstQuestion: FIXED_INTRO_QUESTIONS[0],
      phase: 'intro',
      questionNumber: 1,
      totalQuestions: 5
    });
  } catch (error) {
    console.error('Error starting fresher interview:', error);
    res.status(500).json({ error: 'Failed to start interview' });
  }
});

router.post('/answer', authenticateToken, async (req, res) => {
  try {
    const { sessionId, answer } = req.body;

    if (!sessionId || !sessions.has(sessionId)) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessions.get(sessionId);

    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    session.responses.push({
      question: session.askedQuestions[session.askedQuestions.length - 1],
      answer,
      timestamp: new Date().toISOString()
    });

    session.currentQuestionIndex++;

    // Intro phase (5 fixed questions)
    if (session.phase === 'intro') {
      if (session.currentQuestionIndex < FIXED_INTRO_QUESTIONS.length) {
        const nextQuestion = FIXED_INTRO_QUESTIONS[session.currentQuestionIndex];
        session.askedQuestions.push(nextQuestion);
        
        return res.json({
          nextQuestion,
          phase: 'intro',
          questionNumber: session.currentQuestionIndex + 1,
          totalQuestions: 5
        });
      } else {
        // Move to HR phase
        session.phase = 'hr';
        session.currentQuestionIndex = 0;
        
        const randomHR = HR_QUESTIONS[Math.floor(Math.random() * HR_QUESTIONS.length)];
        session.askedQuestions.push(randomHR);
        
        return res.json({
          nextQuestion: randomHR,
          phase: 'hr',
          questionNumber: 1,
          message: 'Moving to HR round questions'
        });
      }
    }

    // HR phase (random questions)
    if (session.phase === 'hr') {
      const availableHR = HR_QUESTIONS.filter(q => !session.askedQuestions.includes(q));
      
      if (availableHR.length > 0 && session.currentQuestionIndex < 5) {
        const randomHR = availableHR[Math.floor(Math.random() * availableHR.length)];
        session.askedQuestions.push(randomHR);
        session.currentQuestionIndex++;
        
        return res.json({
          nextQuestion: randomHR,
          phase: 'hr',
          questionNumber: session.currentQuestionIndex
        });
      } else {
        // Move to technical phase
        session.phase = 'technical';
        session.currentQuestionIndex = 0;
        
        const firstTech = FIXED_TECHNICAL_INTRO[0];
        session.askedQuestions.push(firstTech);
        
        return res.json({
          nextQuestion: firstTech,
          phase: 'technical',
          questionNumber: 1,
          totalQuestions: 5,
          message: 'Moving to technical round questions'
        });
      }
    }

    // Technical phase (5 fixed + random with constraints)
    if (session.phase === 'technical') {
      // First 5 are fixed
      if (session.currentQuestionIndex < FIXED_TECHNICAL_INTRO.length) {
        const nextTech = FIXED_TECHNICAL_INTRO[session.currentQuestionIndex];
        session.askedQuestions.push(nextTech);
        session.currentQuestionIndex++;
        
        return res.json({
          nextQuestion: nextTech,
          phase: 'technical',
          questionNumber: session.currentQuestionIndex,
          totalQuestions: 5
        });
      } else {
        // Random technical: must have 1 DSA + 2 OOP
        if (!session.technicalRandomCount) {
          session.technicalRandomCount = { dsa: 0, oop: 0, other: 0 };
        }

        let nextQuestion;
        let category;

        // Ensure 1 DSA question
        if (session.technicalRandomCount.dsa === 0) {
          const availableDSA = TECHNICAL_QUESTIONS.dsa.filter(q => !session.askedQuestions.includes(q));
          nextQuestion = availableDSA[Math.floor(Math.random() * availableDSA.length)];
          category = 'dsa';
          session.technicalRandomCount.dsa++;
        }
        // Ensure 2 OOP questions
        else if (session.technicalRandomCount.oop < 2) {
          const oopQuestions = [...TECHNICAL_QUESTIONS.java, ...TECHNICAL_QUESTIONS.python]
            .filter(q => q.toLowerCase().includes('oop') || q.toLowerCase().includes('object') || 
                         q.toLowerCase().includes('class') || q.toLowerCase().includes('inheritance') ||
                         q.toLowerCase().includes('polymorphism') || q.toLowerCase().includes('encapsulation'));
          const availableOOP = oopQuestions.filter(q => !session.askedQuestions.includes(q));
          nextQuestion = availableOOP[Math.floor(Math.random() * availableOOP.length)];
          category = 'oop';
          session.technicalRandomCount.oop++;
        }
        // Other random technical
        else {
          const allTech = [...TECHNICAL_QUESTIONS.dbms, ...TECHNICAL_QUESTIONS.java, ...TECHNICAL_QUESTIONS.python];
          const availableTech = allTech.filter(q => !session.askedQuestions.includes(q));
          nextQuestion = availableTech[Math.floor(Math.random() * availableTech.length)];
          category = 'other';
          session.technicalRandomCount.other++;
        }

        session.askedQuestions.push(nextQuestion);
        session.currentQuestionIndex++;

        const totalTechnical = session.technicalRandomCount.dsa + session.technicalRandomCount.oop + session.technicalRandomCount.other;

        if (totalTechnical >= 3) {
          // Interview complete
          session.phase = 'complete';
          session.completedAt = new Date().toISOString();
          
          return res.json({
            complete: true,
            message: 'Interview completed successfully',
            summary: {
              totalQuestions: session.askedQuestions.length,
              phases: {
                intro: 5,
                hr: session.responses.filter((_, i) => i >= 5 && i < 10).length,
                technical: session.responses.filter((_, i) => i >= 10).length
              }
            }
          });
        }

        return res.json({
          nextQuestion,
          phase: 'technical-random',
          category,
          questionNumber: 5 + totalTechnical
        });
      }
    }

    res.json({ error: 'Invalid phase' });
  } catch (error) {
    console.error('Error processing answer:', error);
    res.status(500).json({ error: 'Failed to process answer' });
  }
});

router.get('/session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessions.has(sessionId)) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessions.get(sessionId);

    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({
      session: {
        phase: session.phase,
        currentQuestionIndex: session.currentQuestionIndex,
        totalResponses: session.responses.length,
        startedAt: session.startedAt,
        completedAt: session.completedAt
      }
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

export default router;
