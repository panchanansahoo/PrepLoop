# AI Interview Voice Pipeline — Bug Audit & Improvement Plan

## Audit Scope

Full-stack audit of the AI interview simulation, covering:
- [AIInterviewPage.jsx](file:///c:/Users/panch/Desktop/Preploop/frontend/src/pages/AIInterviewPage.jsx) — Orchestrator (3147 lines)
- [useDeepgramVoice.js](file:///c:/Users/panch/Desktop/Preploop/frontend/src/hooks/useDeepgramVoice.js) — Voice pipeline (930 lines)
- [useVoiceInterview.js](file:///c:/Users/panch/Desktop/Preploop/frontend/src/hooks/useVoiceInterview.js) — Legacy hook (309 lines)
- [aiInterviewTiming.js](file:///c:/Users/panch/Desktop/Preploop/frontend/src/pages/aiInterviewTiming.js) — Timing utilities (117 lines)
- [voice.js](file:///c:/Users/panch/Desktop/Preploop/backend/routes/voice.js) — Backend voice routes (286 lines)

---

## Bugs Found

### Bug 1 — Resource Leak: WebSocket + Mic left open after interview ends ⚠️

**File**: [AIInterviewPage.jsx#L1427-1438](file:///c:/Users/panch/Desktop/Preploop/frontend/src/pages/AIInterviewPage.jsx#L1427-L1438)

`endInterview()` stops the recorder and interrupts TTS, but does **not** close the Deepgram WebSocket or release the mic stream. After the interview ends, the user enters the `summary` phase and will never use voice again — yet the WebSocket stays open consuming bandwidth/connections, and the browser mic indicator remains lit.

```diff
 const endInterview = () => {
     clearInterval(timerRef.current);
     clearInterval(questionTimerRef.current);
     if (silenceStageTimerRef.current) clearTimeout(silenceStageTimerRef.current);
     stopVoiceRecording();
     speakSequenceCancelledRef.current = true;
     dgVoice.interrupt();
     if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current = null; }
     if ('speechSynthesis' in window) window.speechSynthesis.cancel();
     setAiSpeaking(false);
+    // Release WebSocket + mic stream — no longer needed after interview
+    dgVoice.stop();
+    voice.cleanup();
     setPhase('summary');
 };
```

---

### Bug 2 — Stale `endInterview` reference in auto-end useEffect

**File**: [AIInterviewPage.jsx#L728-737](file:///c:/Users/panch/Desktop/Preploop/frontend/src/pages/AIInterviewPage.jsx#L728-L737)

The global timer auto-end effect calls `endInterview()` but does not include it in the dependency array. Since `endInterview` is a plain function (not `useCallback`), it's re-created every render, meaning the effect captures a stale version.

**Fix**: Wrap `endInterview` in `useCallback` and add it to the effect deps, or extract the cleanup logic into a ref.

---

### Bug 3 — Overlapping auto-submit sources can queue duplicate sends

Three independent systems can trigger `sendAnswerRef.current()`:

| Source | When | File |
|---|---|---|
| Deepgram `scheduleAutoSubmit` | UtteranceEnd + silence | useDeepgramVoice.js:315 |
| Page silence cascade (15s) | No transcript detected | AIInterviewPage.jsx:1411 |
| Per-question timer expiry | Time budget exceeded | AIInterviewPage.jsx:721 |

While `isSendingRef` guards prevent concurrent execution, the **per-question timer doesn't clear Deepgram's silence timers**, and vice versa. This can cause:
- Timer fires → `sendAnswer(true)` runs → resets state → Deepgram's `submitAnswer` fires a moment later with stale transcript → `onAnswer` is called with empty text → `sendAnswer` silently bails (answer < 10 chars), but a wasted api call may occur.

**Fix**: Each submission path should call `dgVoice.stop()` to cancel all pending silence timers before proceeding.

---

### Bug 4 — Legacy `useVoiceInterview` hook instantiated but unused

**File**: [AIInterviewPage.jsx#L295-307](file:///c:/Users/panch/Desktop/Preploop/frontend/src/pages/AIInterviewPage.jsx#L295-L307)

`classicVoice` allocates a `SpeechRecognition` instance, creates timers, and attaches event handlers — **none of which are ever activated** because `startVoiceRecording` is overridden to call `dgVoice.start()`. This wastes memory and adds confusion. Only `setTranscript`, `ttsAudioRef`, `isSendingRef`, and `isListeningRef` from classicVoice are actually used.

**Fix**: Extract the 4 needed refs/setters into standalone `useRef`/`useState` calls and remove the `useVoiceInterview` import entirely.

---

### Bug 5 — `speak()` doesn't reset `setOutputAudioEl` on normal completion

**File**: [useDeepgramVoice.js#L816-823](file:///c:/Users/panch/Desktop/Preploop/frontend/src/hooks/useDeepgramVoice.js#L816-L823)

After audio playback completes (`onended`), the URL is revoked but `setOutputAudioEl(null)` is never called. The visualizer continues referencing the stale `Audio` element. Compare with `interrupt()` at line 635 which correctly calls `setOutputAudioEl(null)`.

```diff
 await new Promise((resolve) => {
     audioRef.current.onended  = resolve;
     audioRef.current.onerror  = resolve;
     controller.signal.addEventListener('abort', resolve, { once: true });
 });
 URL.revokeObjectURL(url);
+setOutputAudioEl(null);
```

---

## Improvements

### P0 — Critical (fix before production)

| # | Description | Impact |
|---|---|---|
| I1 | **Close WebSocket + release mic in endInterview** (Bug 1 fix) | Prevents mic indicator staying lit |
| I2 | **Add cross-timer cancellation** (Bug 3 fix) — when any submit path fires, cancel all others | Prevents ghost submits |
| I3 | **Remove legacy `useVoiceInterview`** (Bug 4 fix) | Reduces bundle size ~8KB, removes dead code paths |

---

### P1 — High Priority (stability)

| # | Description | Impact |
|---|---|---|
| I4 | **WebSocket reconnection with exponential backoff** — currently fails silently to REST fallback, no retry | Prevents degraded STT quality when WebSocket drops momentarily |
| I5 | **Transcript accumulation cap** — `finalTextRef` grows unbounded during long answers | Memory safety for 30+ minute interviews |
| I6 | **Connection health indicator** — show visual indicator when WebSocket is in fallback (REST) mode | User awareness of degraded quality |
| I7 | **Wrap `endInterview` in `useCallback`** (Bug 2 fix) | Correctness for global timer auto-end |

---

### P2 — Medium Priority (UX polish)

| # | Description | Impact |
|---|---|---|
| I8 | **Per-question countdown warning** — show "30 seconds remaining" toast before auto-skip | Better UX for timed questions |
| I9 | **Persist conversation to localStorage** — recover on accidental refresh | Data resilience |
| I10 | **Pre-warm TTS on page mount** — the warm-up fetch currently fires on first `start()` call; move to `useEffect([], ...)` | Faster first-question audio |
| I11 | **Fix `setOutputAudioEl(null)` after playback** (Bug 5 fix) | Clean visualizer state |
| I12 | **Add error retry for TTS fetch** — 1 retry with 500ms delay before falling back to browser speechSynthesis | Fewer unnecessary fallbacks |

---

### P3 — Polish (nice-to-have)

| # | Description | Impact |
|---|---|---|
| I13 | **Accessibility**: Add `aria-labels` to mic/camera/speaker toggle buttons | Screen reader support |
| I14 | **Analytics**: Track WebSocket drop rate, TTS fallback rate, avg silence-to-submit latency | Production monitoring |
| I15 | **Optimize re-renders**: Memoize `inputBars`/`outputBars` arrays from visualizer hook | Fewer unnecessary re-renders |

---

## User Review Required

> [!IMPORTANT]
> **Bug 4 (remove legacy `useVoiceInterview`)** is the largest refactor. It requires extracting 4 primitives (`setTranscript`, `ttsAudioRef`, `isSendingRef`, `isListeningRef`) into standalone hooks and updating all references. This is safe but touches many lines.

> [!WARNING]
> **I9 (localStorage persistence)** adds complexity around serializing conversation state. If the interview was mid-question when the page refreshed, the backend session context is lost. This improvement should be scoped carefully.

## Proposed Execution Order

```
Phase 1 (Bugs):  Bug 1 → Bug 5 → Bug 2 → Bug 3
Phase 2 (P0):    I1 → I2 → I3
Phase 3 (P1):    I4 → I5 → I7
Phase 4 (P2):    I8 → I10 → I11 → I12
```

## Verification Plan

### Automated Tests
- `npm test` after each change
- Add unit tests for `scheduleAutoSubmit` timer cancellation logic
- Add unit test for `endInterview` resource cleanup

### Manual Verification
- Run a full 6-question interview with male voice → verify WebSocket closes on summary
- Run a full 12-question fresher interview → verify global timer triggers endInterview
- Test mid-answer page refresh → verify no console errors
- Toggle male/female voice mid-lobby → verify correct voice plays
