import Groq from 'groq-sdk';

/**
 * Safely initialize Groq client only if API key is available
 * Returns null if GROQ_API_KEY is not set (e.g., in test environments)
 */
export function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

/**
 * Check if Groq is configured
 */
export function isGroqConfigured() {
  return !!process.env.GROQ_API_KEY;
}
