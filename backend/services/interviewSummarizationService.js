import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('InterviewSummarizationService');

export class InterviewSummarizationService {
  /**
   * Estimate the number of tokens in a given text.
   * A rough heuristic is ~4 characters per token for English text.
   * @param {string} text - The text to estimate
   * @returns {number} Estimated token count
   */
  static estimateTokens(text) {
    if (!text) return 0;
    // Basic heuristic: 1 token ≈ 4 chars
    return Math.ceil(text.length / 4);
  }

  /**
   * Summarize an interview transcript to fit within a token budget.
   * Preserves the most recent turns while summarizing older context.
   * @param {Array} transcript - Array of transcript entries
   * @param {number} maxTokens - Maximum allowed tokens (default 4000)
   * @returns {string} The formatted and potentially summarized transcript
   */
  static summarizeTranscript(transcript, maxTokens = 4000) {
    if (!transcript || transcript.length === 0) return '';
    if (transcript.length <= 4) {
      return this._formatTurns(transcript);
    }

    const maxLength = maxTokens * 4; // Approx 4 chars per token

    // Identify key moments in the older conversation
    const recentTurns = transcript.slice(-4);
    const olderTurns = transcript.slice(0, -4);

    const keyMoments = olderTurns.filter(item => {
      const text = (item.content || item.text || '').toLowerCase();
      return item.role === 'interviewer' || 
             text.includes('complexity') ||
             text.includes('trade-off') ||
             text.includes('tradeoff') ||
             text.includes('edge case');
    });

    // Limit the total character count while preserving key information
    const summary = [];
    let charCount = this.estimateTokens(this._formatTurns(recentTurns)) * 4;
    
    for (const item of [...keyMoments].reverse()) {
      const textLen = (item.content || item.text || '').length;
      if (charCount + textLen > maxLength) {
        break;
      }
      summary.unshift(item);
      charCount += textLen;
    }

    let olderText = '';
    if (summary.length > 0) {
      olderText = `[--- SUMMARIZED OLDER CONTEXT ---]\n${this._formatTurns(summary)}\n[--- END SUMMARIZED CONTEXT ---]`;
    }

    const recentText = this._formatTurns(recentTurns);
    return olderText ? `${olderText}\n\n${recentText}`.trim() : recentText.trim();
  }

  /**
   * Helper to format an array of turns into text
   * @param {Array} turns - Array of transcript entries
   * @returns {string} Formatted text
   * @private
   */
  static _formatTurns(turns) {
    return turns.map(turn => {
      const role = turn.role === 'interviewer' ? 'Interviewer' : 'Candidate';
      return `${role}: ${turn.content || turn.text}`;
    }).join('\n\n');
  }
}

export default InterviewSummarizationService;
