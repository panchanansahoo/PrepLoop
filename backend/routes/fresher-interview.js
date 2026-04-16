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

const OOP_QUESTIONS = [
  "Can you explain the main OOP concepts (encapsulation, inheritance, polymorphism, abstraction) with a simple example?",
  "What are the four pillars of OOP (encapsulation, inheritance, polymorphism, abstraction)? Explain with simple examples.",
  "What is a class and what is an object? Give a real world example.",
  "What is the difference between an abstract class and an interface?",
  "What is method overloading and method overriding? Give examples.",
  "What is encapsulation? How do access modifiers help achieve it?",
  "What is inheritance?",
  "Explain SOLID design principles",
  "Explain the four main OOP concepts (encapsulation, inheritance, polymorphism, abstraction) with simple examples in Python."
];

const DSA_QUESTIONS = [
  "Write a simple program to count vowels in a string",
  "Write a program to print the Fibonacci series up to n",
  "Write a program to check if a number is even or odd",
  "Reverse a string",
  "Check if string is palindrome",
  "Find factorial of a number",
  "Prime number check",
  "Find maximum/minimum in array"
];

const OTHER_TECHNICAL_QUESTIONS = [
  "What is the difference between an array and a linked list? When would you use each?",
  "What is the difference between a stack and a queue? Can you give a real life example of each?",
  "What are the different types of loops in your preferred programming language, and when do you use them?",
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
  "What is a deadlock?",
  "What is Java? What are the main features of Java (platform independent, object oriented, etc.)?",
  "What is the difference between JDK, JRE, and JVM?",
  "Why is Java called platform independent?",
  "What is the purpose of the main method in Java?",
  "What is the difference between == and equals() when comparing strings in Java?",
  "What is a virtual function in C++/Java?",
  "What is Python, and what are some advantages of using it (interpreted, high level, portable, etc.)?",
  "What are the basic data types in Python (int, float, string, list, tuple, dict, set)? Give a small example of each.",
  "What is the difference between a list and a tuple in Python?",
  "What is the difference between a list and a dictionary? When would you use a dictionary?",
  "What is the difference between == and is in Python?",
  "What is a function in Python? How do you define and call a function?",
  "What is the difference between local and global variables in Python?"
];

const sessions = new Map();

router.post('/start', authenticateToken, async (req, res) => {
  try {
    const { interviewerName, role, company, roundName, roundType } = req.body;

    if (!roundType || !['hr', 'technical'].includes(roundType)) {
      return res.status(400).json({ error: 'roundType must be either "hr" or "technical"' });
    }

    const sessionId = `${req.user.id}-${Date.now()}`;
    
    sessions.set(sessionId, {
      userId: req.user.id,
      interviewerName: interviewerName || "NAME",
      role: role || "role with company",
      company: company || "our organisation",
      roundName: roundName || "round name",
      roundType,
      phase: 'intro',
      currentQuestionIndex: 0,
      askedQuestions: [FIXED_INTRO_QUESTIONS[0]],
      responses: [],
      startedAt: new Date().toISOString()
    });

    const greeting = `Good afternoon, my name is ${interviewerName || "NAME"}, I work as an ${role || "role with company"}, and I'll be conducting your ${roundName || "round name"} discussion today. We'll mainly talk about your background, your interests, and see how you fit with our organisation.`;

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

    // Phase 1: Intro (5 fixed questions)
    if (session.phase === 'intro' && session.currentQuestionIndex < 5) {
      const nextQuestion = FIXED_INTRO_QUESTIONS[session.currentQuestionIndex];
      session.askedQuestions.push(nextQuestion);
      
      return res.json({
        nextQuestion,
        phase: 'intro',
        questionNumber: session.currentQuestionIndex + 1,
        totalQuestions: 5
      });
    }

    // Transition from intro to selected round
    if (session.phase === 'intro' && session.currentQuestionIndex === 5) {
      if (session.roundType === 'hr') {
        session.phase = 'hr';
        const randomHR = HR_QUESTIONS[Math.floor(Math.random() * HR_QUESTIONS.length)];
        session.askedQuestions.push(randomHR);
        
        return res.json({
          nextQuestion: randomHR,
          phase: 'hr',
          questionNumber: 6,
          message: 'Moving to HR round questions'
        });
      } else {
        session.phase = 'technical';
        session.techCount = { dsa: 0, oop: 0, other: 0 };
        const dsaQ = DSA_QUESTIONS[Math.floor(Math.random() * DSA_QUESTIONS.length)];
        session.askedQuestions.push(dsaQ);
        session.techCount.dsa = 1;
        
        return res.json({
          nextQuestion: dsaQ,
          phase: 'technical',
          questionNumber: 6,
          category: 'dsa',
          message: 'Moving to technical round questions'
        });
      }
    }

    // Phase 2: HR Round
    if (session.phase === 'hr') {
      const availableHR = HR_QUESTIONS.filter(q => !session.askedQuestions.includes(q));
      
      if (availableHR.length > 0) {
        const randomHR = availableHR[Math.floor(Math.random() * availableHR.length)];
        session.askedQuestions.push(randomHR);
        
        return res.json({
          nextQuestion: randomHR,
          phase: 'hr',
          questionNumber: session.askedQuestions.length
        });
      } else {
        session.phase = 'complete';
        session.completedAt = new Date().toISOString();
        
        return res.json({
          complete: true,
          message: 'Interview completed successfully',
          summary: {
            totalQuestions: session.askedQuestions.length,
            roundType: 'hr'
          }
        });
      }
    }

    // Phase 3: Technical Round (1 DSA + 2 OOP + 3 random technical)
    if (session.phase === 'technical') {
      const totalTech = session.techCount.dsa + session.techCount.oop + session.techCount.other;
      
      // Need 2 OOP questions
      if (session.techCount.oop < 2) {
        const availableOOP = OOP_QUESTIONS.filter(q => !session.askedQuestions.includes(q));
        const oopQ = availableOOP[Math.floor(Math.random() * availableOOP.length)];
        session.askedQuestions.push(oopQ);
        session.techCount.oop++;
        
        return res.json({
          nextQuestion: oopQ,
          phase: 'technical',
          category: 'oop',
          questionNumber: session.askedQuestions.length
        });
      }
      
      // Need 3 more random technical questions
      if (session.techCount.other < 3) {
        const availableTech = OTHER_TECHNICAL_QUESTIONS.filter(q => !session.askedQuestions.includes(q));
        const techQ = availableTech[Math.floor(Math.random() * availableTech.length)];
        session.askedQuestions.push(techQ);
        session.techCount.other++;
        
        return res.json({
          nextQuestion: techQ,
          phase: 'technical',
          category: 'other',
          questionNumber: session.askedQuestions.length
        });
      }
      
      // All technical questions done
      session.phase = 'complete';
      session.completedAt = new Date().toISOString();
      
      return res.json({
        complete: true,
        message: 'Interview completed successfully',
        summary: {
          totalQuestions: session.askedQuestions.length,
          roundType: 'technical',
          technical: {
            dsa: session.techCount.dsa,
            oop: session.techCount.oop,
            other: session.techCount.other
          }
        }
      });
    }

    res.status(400).json({ error: 'Invalid phase' });
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
