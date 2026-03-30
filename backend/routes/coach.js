import express from 'express';
import Groq from 'groq-sdk';
import { authenticateToken } from '../middleware/auth.js';
import { aiCallWithRetry } from '../utils/aiClient.js';

const router = express.Router();
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const getSystemPrompt = (mode) => {
  const basePrompt = "You are an expert AI Technical Coach on CareerLoop. Your goal is to help users master software engineering concepts through the Socratic method. Do not just give answers; ask guiding questions to help the user derive the solution. Be concise, encouraging, and technically precise.";
  
  const prompts = {
    general: `${basePrompt} You can assist with DSA, System Design, and Career advice.`,
    dsa: `${basePrompt} Focus on Data Structures and Algorithms. When asked about a problem, ask about time/space complexity, edge cases, and potential approaches before providing code. Use pseudocode to explain logic first.`,
    system_design: `${basePrompt} Focus on System Design. Guide the user through requirements gathering, capacity estimation, API design, and database schema design. Use standard terminology (Load Balancer, Sharding, CAP theorem).`,
    career: `${basePrompt} Focus on Career advice. Help with resume tips, negotiation strategies, and behavioral interview prep (STAR method).`
  };
  return prompts[mode] || prompts.general;
};

const getMockResponse = (message, mode) => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('dynamic programming') || lowerMessage.includes('dp')) {
    return {
      response: `Dynamic Programming is a powerful technique for optimization. To help you understand it better, let me ask:
      
1. Can you identify overlapping subproblems in this scenario?
2. Does the problem have an optimal substructure?

Thinking about the Fibonacci sequence is a great start. How would you optimize a naive recursive Fibonacci function?`,
      suggestions: ["Memoization vs Tabulation", "Explain Fibonacci DP", "Knapsack Problem"],
      resources: [{ title: "DP Patterns", url: "/dsa-patterns" }]
    };
  }
  
  // ... (Keep existing mock logic or expand)
  
  return {
    response: "I'm your AI Coach. I can help you with DSA, System Design, or Career advice. What concept are you struggling with right now?",
    suggestions: ["Explain recursion", "System Design basics", "Mock Interview tips"]
  };
};

router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, mode, history } = req.body;
    
    // Context management
    const messages = [
      { role: 'system', content: getSystemPrompt(mode) },
      ...(history || []).slice(-10).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ];

    if (groq) {
      const completion = await aiCallWithRetry({
        operation: () => groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature: 0.6,
          max_tokens: 1024
        }),
        timeoutMs: 12000,
        maxRetries: 2,
        baseDelayMs: 250,
      });
      
      const responseContent = completion.choices[0].message.content;
      
      // Simple heuristic for suggestions (in production, we'd ask the AI to generate these as structured JSON)
      res.json({
        response: responseContent,
        suggestions: ["Give me an example", "Explain with code", "Test my understanding"], 
        resources: []
      });
    } else {
       // Fallback to mock
       const mock = getMockResponse(message, mode);
       res.json(mock);
    }
  } catch (error) {
    console.error('Error in coach chat:', error.message || error);
    const mock = getMockResponse(req.body?.message || '', req.body?.mode);
    res.json({
      ...mock,
      degraded: true,
    });
  }
});

export default router;
