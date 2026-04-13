# Real-Feel AI Voice Interview Pipeline Upgrade

Transform the interview from "chunked REST STT + sequential TTS" into a **seamless, natural-sounding conversation** with real-time streaming, smart silence handling, backchannel sounds, and interrupt support.

## User Review Required

> [!IMPORTANT]
> **Deepgram API Key Exposure**: Phase 1 requires sending the Deepgram API key to the frontend (via a token endpoint) so the browser can open a direct WebSocket to `wss://api.deepgram.com`. This is Deepgram's recommended pattern for web apps. The key is already rate-limited by Deepgram. If you prefer a backend WebSocket proxy instead (no key exposure, but more backend complexity), let me know.

> [!WARNING]
> **Breaking Change**: The `useDeepgramVoice` hook will be significantly rewritten. The REST chunk-based STT path (`POST /api/voice/stt-chunk`) will remain available for backward compatibility but won't be used for interviews anymore.

---

## Proposed Changes

### Phase 1: WebSocket Streaming STT (Core — Biggest Impact)

**Problem**: Each 250ms chunk is sent as a separate HTTP POST, losing context between chunks. Deepgram transcribes each chunk in isolation → fragmented words, high latency, no interim results.

**Solution**: Direct WebSocket connection to Deepgram from the browser with interim + final transcripts.

---

#### [MODIFY] [voiceService.js](file:///c:/Users/panch/Desktop/Preploop/backend/services/voiceService.js)
- Change `getDeepgramToken()` to **always return the key** when `DEEPGRAM_API_KEY` is set (remove `EXPOSE_DEEPGRAM_TOKEN` guard)
- The endpoint is already auth-protected (`authenticateToken` middleware)

#### [MODIFY] [useDeepgramVoice.js](file:///c:/Users/panch/Desktop/Preploop/frontend/src/hooks/useDeepgramVoice.js)
Major rewrite of the STT pipeline:
- **Replace** `MediaRecorder → fetch(STT_ENDPOINT)` with `MediaRecorder → WebSocket(wss://api.deepgram.com)`
- On `start()`:
  1. Fetch token from `GET /api/voice/deepgram-token`
  2. Open WebSocket: `wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&interim_results=true&utterance_end_ms=1200&vad_events=true&filler_words=true&endpointing=300`
  3. Stream `MediaRecorder` audio chunks directly into the WebSocket
  4. Receive real-time `transcript` messages with `is_final` + `speech_final` flags
  5. Use Deepgram's `UtteranceEnd` event as the primary "user stopped speaking" signal
- Accumulate interim transcripts for live UI display
- Accumulate final transcripts for answer submission
- **Smart auto-submit**: On `UtteranceEnd` event AND `finalTranscript.length >= MIN_ANSWER_LENGTH`, wait 800ms then submit
- Keep REST fallback path if WebSocket connection fails

---

### Phase 2: Smart Silence Detection & VAD

**Problem**: Fixed 1400ms timer ignores audio levels; user pausing to think triggers premature submission.

#### [MODIFY] [useDeepgramVoice.js](file:///c:/Users/panch/Desktop/Preploop/frontend/src/hooks/useDeepgramVoice.js) (continued)
- Use Deepgram `UtteranceEnd` (server-side VAD) as primary signal
- Add local audio RMS confirmation: only submit if `inputLevel < 0.05` (no voice energy)
- Adaptive silence: 
  - Short answers (<50 chars) → wait 2.5s before submit (allow user to continue)
  - Medium answers (50-200 chars) → wait 1.8s
  - Long answers (>200 chars) → wait 1.2s (user likely done)
- Reset silence timer whenever Deepgram sends new speech data

---

### Phase 3: Backchannel & Natural Conversational Pacing

**Problem**: The interviewer is silent while the user speaks (feels like talking to a wall). Transitions between speaking/listening are abrupt.

#### [MODIFY] [useDeepgramVoice.js](file:///c:/Users/panch/Desktop/Preploop/frontend/src/hooks/useDeepgramVoice.js) (continued)  
- **Backchannel playback**: After user speaks for >8 seconds continuously, play a random "mm-hmm" / "I see" clip (fetch from `GET /api/voice/backchannel-clips` on mount, cache as `Audio` objects)
- Spacing: at most once every 12 seconds, volume at 30% of normal TTS

#### [MODIFY] [AIInterviewPage.jsx](file:///c:/Users/panch/Desktop/Preploop/frontend/src/pages/AIInterviewPage.jsx)
- **Thinking indicator**: After receiving answer, show "thinking..." text + subtle animation for the thinking delay period
- **Proportional thinking delay**: `thinkDelay = min(2000, 600 + answerLength * 3)` — longer answers get more "thinking" time
- **Transitional phrases**: Before the next question, occasionally prepend natural transitions:
  - "That's interesting..." → next question
  - "Good point..." → next question  
  - "I appreciate you sharing that..." → next question

---

### Phase 4: Interrupt Support

**Problem**: User must wait for the entire AI response to finish before the mic activates. In real interviews, you can interrupt.

#### [MODIFY] [useDeepgramVoice.js](file:///c:/Users/panch/Desktop/Preploop/frontend/src/hooks/useDeepgramVoice.js) (continued)
- New `enableInterrupt` mode: while AI is speaking (`state === 'speaking'`), keep a low-power audio monitor running
- If `inputLevel > 0.15` for >400ms → call `interrupt()` to stop AI speech, then immediately switch to `listening` state
- Expose `interruptDetected` flag for UI feedback

#### [MODIFY] [AIInterviewPage.jsx](file:///c:/Users/panch/Desktop/Preploop/frontend/src/pages/AIInterviewPage.jsx)
- When interrupt detected, show brief "Go ahead..." text overlay
- Resume normal listening flow

---

### Phase 5: Enhanced Visual Feedback

#### [MODIFY] [VoiceWaveform.css](file:///c:/Users/panch/Desktop/Preploop/frontend/src/components/VoiceWaveform.css)
- Add `vw-speaking` state with pulsing glow animation
- Add `vw-processing` state with subtle wave
- Smoother transitions between states (CSS transitions on height)

#### [MODIFY] [VoiceWaveform.jsx](file:///c:/Users/panch/Desktop/Preploop/frontend/src/components/VoiceWaveform.jsx)
- Accept `state` prop ('idle' | 'listening' | 'speaking' | 'processing')
- Different color schemes per state
- Smooth animation interpolation

---

## Open Questions

> [!IMPORTANT]
> 1. **Deepgram Key Strategy**: Direct browser WebSocket (recommended, simpler) vs. backend WebSocket proxy (no key exposure, more complex)?
> 2. **Backchannel frequency**: Should the interviewer say "mm-hmm" every ~10-15s of user speech, or only when there are natural pauses?
> 3. **Interrupt sensitivity**: How aggressive should interrupt detection be? Conservative (>600ms of loud speech) or responsive (>300ms)?

## Verification Plan

### Automated Tests
- Unit tests for new WebSocket message parsing logic in `useDeepgramVoice`
- Unit tests for adaptive silence threshold calculation
- Verify backchannel clip loading and caching

### Manual Verification  
- **Live test**: Start an interview, speak a full answer, verify:
  - Transcript appears in real-time (word by word)
  - Answer auto-submits after natural pause
  - Interviewer responds with feedback + next question
  - Backchannel sounds play during long answers
  - User can interrupt the AI mid-sentence
- **Latency check**: Time from user stopping speech → AI starting to speak (target: <2s)
- **Browser test**: Chrome + Edge on Windows (WebSocket + MediaRecorder support)
