import assert from 'node:assert/strict';
import { normalizeInterviewLimits, verifyInterviewInviteeEmail, generateInterviewToken, isValidInterviewToken } from '../utils/privateInterviewAccess.js';
import nvidiaVoiceService from '../services/nvidiaVoiceService.js';

console.log('🧪 Starting NVIDIA VoiceChat and Private Interview Access tests...\n');

// 1. Test normalizeInterviewLimits with email allowlist
const normalizedEmpty = normalizeInterviewLimits({});
assert.deepEqual(normalizedEmpty.allowedEmails, []);

const normalizedLimits = normalizeInterviewLimits({
  allowedEmails: [' Alice@Example.com ', 'BOB@work.co', ''],
});
assert.deepEqual(normalizedLimits.allowedEmails, ['alice@example.com', 'bob@work.co']);
console.log('✅ normalizeInterviewLimits properly formats and lowercases email allowlists');

// 2. Test verifyInterviewInviteeEmail
const emptyAllowlistResult = verifyInterviewInviteeEmail('anyone@test.com', []);
assert.equal(emptyAllowlistResult, true);

const matchResult = verifyInterviewInviteeEmail('ALICE@example.com', ['alice@example.com', 'bob@work.co']);
assert.equal(matchResult, true);

const missingEmailResult = verifyInterviewInviteeEmail(null, ['alice@example.com']);
assert.equal(missingEmailResult, false);

const blockedResult = verifyInterviewInviteeEmail('eve@intruder.com', ['alice@example.com']);
assert.equal(blockedResult, false);
console.log('✅ verifyInterviewInviteeEmail enforces access permissions accurately');

// 3. Test nvidiaVoiceService status
const status = nvidiaVoiceService.getStatus();
assert.equal(typeof status.available, 'boolean');
assert.equal(status.provider, 'NVIDIA Nemotron VoiceChat');
assert.equal(status.model, 'nvidia/llama-3.1-nemotron-70b-instruct');
assert.equal(status.transcriptPolicy, 'dual-track-retained');
assert.equal(status.backendProtected, true);
console.log('✅ nvidiaVoiceService reports configuration and security status correctly');

// 4. Test generateInterviewerTransition without configured API key (fallback path)
const originalApiKey = nvidiaVoiceService.apiKey;
nvidiaVoiceService.apiKey = '';

const transitionResult = await nvidiaVoiceService.generateInterviewerTransition({
  currentQuestion: 'What is React fiber?',
  candidateAnswer: 'It is a reconciliation engine that allows incremental rendering.',
  nextQuestion: 'Explain virtual DOM diffing.',
});

assert.equal(transitionResult, null, 'Unconfigured service should return null gracefully to allow fallback');
console.log('✅ nvidiaVoiceService graceful fallback operates as expected');

// Restore key
nvidiaVoiceService.apiKey = originalApiKey;

// 5. Test candidate token generation and token link validation
const token = generateInterviewToken();
assert.equal(typeof token, 'string');
assert.equal(token.length, 36, 'UUID token must be 36 characters');
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
assert.equal(uuidRegex.test(token), true, 'generateInterviewToken must return standard RFC 4122 v4 UUID');

assert.equal(isValidInterviewToken(token), true);
assert.equal(isValidInterviewToken('40247bbf-cace-43da-8a0e-87fe703b9f7f'), true);
assert.equal(isValidInterviewToken('legacy-share-code'), true);
assert.equal(isValidInterviewToken(''), false);
assert.equal(isValidInterviewToken('123'), false, 'Tokens under 5 characters should be invalid');

const sampleCandidateUrl = `https://preploop.com/app?token=${token}`;
const parsedUrl = new URL(sampleCandidateUrl);
assert.equal(parsedUrl.pathname, '/app');
assert.equal(parsedUrl.searchParams.get('token'), token);
console.log('✅ Candidate assessment token generation (/app?token=<uuid>) operates accurately');

console.log('\n🎉 All NVIDIA VoiceChat & Private Interview Access tests passed successfully!');
