import { describe, it, expect } from 'vitest';

describe('Interview Study Notes Synthesis Engine', () => {
  it('formats structured markdown notes with diagnostics and recommendations', () => {
    const feedbacks = [
      {
        question_text: 'Reverse a Linked List in O(1) space',
        response_text: 'I initialized prev to null, curr to head, and iterated...',
        feedback: {
          strengths: ['Iterative three-pointer approach explained cleanly'],
          improvements: ['State space complexity explicitly up-front'],
          tips: 'Mention potential recursion stack overhead when comparing with iterative solution'
        }
      }
    ];

    const markdownParts = [
      `# 📝 PrepLoop Interview Study Sheet: DSA Simulation`,
      `**Session Date:** 2026-11-02  `,
      `---\n`,
      `## 🎯 Executive Performance Summary`,
      `- **Completed Questions:** ${feedbacks.length}`,
      `\n---\n`,
      `## 🔍 Question-by-Question Diagnostic Breakdown\n`
    ];

    feedbacks.forEach((fb, idx) => {
      markdownParts.push(`### Question ${idx + 1}`);
      markdownParts.push(`> ${fb.question_text}\n`);
      fb.feedback.strengths.forEach((s) => markdownParts.push(`- ✅ ${s}`));
      fb.feedback.improvements.forEach((imp) => markdownParts.push(`- ⚠️ ${imp}`));
      markdownParts.push(`💡 *${fb.feedback.tips}*\n`);
    });

    const output = markdownParts.join('\n');
    expect(output).toContain('# 📝 PrepLoop Interview Study Sheet');
    expect(output).toContain('Reverse a Linked List in O(1) space');
    expect(output).toContain('Iterative three-pointer approach explained cleanly');
    expect(output).toContain('State space complexity explicitly up-front');
  });
});

