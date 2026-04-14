import express from 'express';
import Groq from 'groq-sdk';
import { authenticateToken } from '../middleware/auth.js';
import { aiCallWithRetry } from '../utils/aiClient.js';

const router = express.Router();

const groq = process.env.GROQ_API_KEY ? new Groq({
  apiKey: process.env.GROQ_API_KEY,
}) : null;

const systemDesignTopics = [
  {
    id: 1,
    title: 'Design Twitter',
    difficulty: 'Hard',
    description: 'Design a simplified version of Twitter with features like posting tweets, following users, and viewing timeline.',
    keyComponents: ['Load Balancer', 'Application Servers', 'Database', 'Cache', 'CDN', 'Message Queue'],
    estimations: 'Assume 500M users, 200M DAU, 100M tweets per day'
  },
  {
    id: 2,
    title: 'Design URL Shortener',
    difficulty: 'Medium',
    description: 'Design a URL shortening service like bit.ly that converts long URLs to short URLs and redirects users.',
    keyComponents: ['Load Balancer', 'API Gateway', 'Database', 'Cache'],
    estimations: 'Assume 100M URLs shortened per month, 1B redirects per month'
  },
  {
    id: 3,
    title: 'Design Netflix',
    difficulty: 'Hard',
    description: 'Design a video streaming platform with features like video upload, encoding, streaming, and recommendations.',
    keyComponents: ['CDN', 'Video Storage', 'Encoding Service', 'Recommendation Engine', 'User Database'],
    estimations: 'Assume 200M users, 10M concurrent streams'
  },
  {
    id: 4,
    title: 'Design Uber',
    difficulty: 'Hard',
    description: 'Design a ride-sharing platform with real-time location tracking, matching riders with drivers.',
    keyComponents: ['Location Service', 'Matching Service', 'Payment Gateway', 'Real-time Database'],
    estimations: 'Assume 10M daily active riders, 1M daily active drivers'
  }
];

router.get('/topics', async (req, res) => {
  res.json({ topics: systemDesignTopics });
});

router.get('/topics/:id', async (req, res) => {
  const { id } = req.params;
  const topic = systemDesignTopics.find(t => t.id === parseInt(id));
  
  if (!topic) {
    return res.status(404).json({ error: 'Topic not found' });
  }
  
  res.json({ topic });
});

router.post('/feedback', authenticateToken, async (req, res) => {
  const { topicId, design, components } = req.body;

  try {
    const topic = systemDesignTopics.find(t => t.id === parseInt(topicId));
    
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    if (!groq) {
      return res.json({
        feedback: {
          strengths: [
            'Good choice of components',
            'Considered scalability'
          ],
          improvements: [
            'Consider adding caching layer',
            'Think about database replication'
          ],
          score: 80,
          detailedFeedback: 'Overall solid design. Consider adding more details about how components communicate.'
        }
      });
    }

    const completion = await aiCallWithRetry({
      operation: () => groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a senior system design architect. Evaluate system design solutions and provide constructive feedback.
            Consider: scalability, reliability, maintainability, performance, cost-effectiveness.
            Format response as JSON with: strengths (array), improvements (array), score (0-100), detailedFeedback (string)`
          },
          {
            role: 'user',
            content: `Topic: ${topic.title}\nDescription: ${topic.description}\n\nUser's Design:\n${design}\n\nComponents used: ${components.join(', ')}\n\nProvide feedback.`
          }
        ],
        response_format: { type: 'json_object' }
      }),
      timeoutMs: 12000,
      maxRetries: 2,
      baseDelayMs: 250
    });

    let feedback;
    try {
      const raw = completion.choices?.[0]?.message?.content || '';
      feedback = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, ''));
    } catch {
      feedback = { strengths: ['Design submitted'], improvements: ['Try again for detailed analysis'], score: 70, detailedFeedback: 'AI analysis temporarily unavailable.' };
    }
    res.json({ feedback });
  } catch (error) {
    console.error('System design feedback error:', error);
    res.status(500).json({ error: 'Failed to generate feedback' });
  }
});

router.post('/diagram-explain', authenticateToken, async (req, res) => {
  const { diagram, components } = req.body;

  try {
    if (!groq) {
      return res.json({
        explanation: 'Your system design includes key components for scalability and reliability. Consider adding monitoring and logging systems.'
      });
    }

    const completion = await aiCallWithRetry({
      operation: () => groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a system design expert. Explain system architecture diagrams clearly, highlighting data flow and component interactions.'
          },
          {
            role: 'user',
            content: `Explain this system design:\nComponents: ${components.join(', ')}\nDiagram description: ${diagram}`
          }
        ]
      }),
      timeoutMs: 12000,
      maxRetries: 2,
      baseDelayMs: 250
    });

    res.json({
      explanation: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('Diagram explanation error:', error);
    res.status(500).json({ error: 'Failed to explain diagram' });
  }
});

export default router;
