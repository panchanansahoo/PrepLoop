export function getThinkingDelayMs(text = '') {
    const length = String(text || '').trim().length;
    return Math.min(2000, 600 + length * 3);
}
