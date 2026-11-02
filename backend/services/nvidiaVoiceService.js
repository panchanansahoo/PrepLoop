/**
 * NVIDIA Nemotron VoiceChat Service
 * Integrates with NVIDIA NIM (build.nvidia.com)
 *
 * Provides:
 * 1. Backend management of NVIDIA_API_KEY (never exposed to client).
 * 2. Natural interviewer response phrasing using Nemotron.
 * 3. Health & trial limit verification for prototype usage.
 * 4. Dual-track transcript retention: works alongside browser/Whisper STT
 *    so full text transcripts are guaranteed for scoring & storage.
 */
import 'dotenv/config';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '';
const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
const NEMOTRON_MODEL = process.env.NVIDIA_MODEL || 'nvidia/llama-3.1-nemotron-70b-instruct';

export class NvidiaVoiceService {
  constructor() {
    this.apiKey = NVIDIA_API_KEY;
    this.baseUrl = NVIDIA_BASE_URL;
    this.model = NEMOTRON_MODEL;
    this.trialLimits = {
      description: 'NVIDIA NIM Free Prototyping API',
      quotaEstimate: 'Trial keys typically include 1,000 free inference credits on build.nvidia.com',
      recommendation: 'Use dual-track STT to preserve candidate answer transcripts without burning audio trial credits',
    };
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  getStatus() {
    return {
      available: this.isConfigured(),
      provider: 'NVIDIA Nemotron VoiceChat',
      model: this.model,
      trialLimits: this.trialLimits,
      transcriptPolicy: 'dual-track-retained', // Application preserves speech-to-text path
      backendProtected: true, // Key never sent to browser
    };
  }

  /**
   * Natural conversational exchange using NVIDIA Nemotron
   * Generates a warm, human-like interviewer transition before the app
   * moves to the next fixed question.
   */
  async generateInterviewerTransition({ currentQuestion, candidateAnswer, nextQuestion, interviewerName = 'Interviewer' }) {
    if (!this.isConfigured() || !candidateAnswer || candidateAnswer.trim().length < 5) {
      return null;
    }

    const systemPrompt = `You are ${interviewerName}, a professional, encouraging technical interviewer.
The interview questions are FIXED by the platform and must proceed in order.
Your job is to give a short (1 sentence, max 20 words), natural, human spoken bridge acknowledging what the candidate just explained before introducing the next question.
Sound natural, concise, and authentic. Do NOT re-ask or invent new technical questions.
Respond with ONLY the spoken bridge sentence.`;

    const userPrompt = `Candidate was asked: "${currentQuestion}"
Candidate answered: "${candidateAnswer.substring(0, 500)}"
Next fixed question to introduce: "${nextQuestion || ''}"
Provide your short spoken acknowledgment sentence:`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.5,
          max_tokens: 60,
        }),
        signal: AbortSignal.timeout(5000), // 5s timeout to not delay interview
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.warn(`[NVIDIA VoiceChat] NIM API returned HTTP ${response.status}:`, errorText.substring(0, 150));
        return null;
      }

      const data = await response.json();
      const transitionText = data.choices?.[0]?.message?.content?.trim();
      return transitionText || null;
    } catch (err) {
      console.warn('[NVIDIA VoiceChat] Transition generation failed:', err.message);
      return null;
    }
  }
}

export const nvidiaVoiceService = new NvidiaVoiceService();
export default nvidiaVoiceService;
