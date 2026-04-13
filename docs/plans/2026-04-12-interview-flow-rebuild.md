# Interview Flow Rebuild Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn the interview feature into a single, state-machine-driven interview engine with explicit session lifecycle, personalized grounding, adaptive follow-ups, scoring, telemetry, and a text-first voice-ready UX.

**Architecture:** Keep the Express routes thin and move interview behavior into dedicated services that own session state, prompts, retrieval, scoring, and observability. Make text the canonical flow first; only add voice once the same state and scoring pipeline are proven stable. The frontend should consume one contract and render the real interview experience from that contract, not duplicate business logic.

**Tech Stack:** Node.js ESM backend, Express, Groq, LlamaIndex for retrieval grounding, OpenTelemetry, React 18 + Vite, Vitest, backend smoke scripts, and a later Whisper or faster-whisper voice worker that reuses the same session state.

---

## Current Contract Snapshot

The current interview flow already exists, but the behavior is spread across multiple places:
- Backend entry points are in backend/routes/ai-features.js and backend/services/aiService.js.
- Current state is carried in interview_context with stagePlan, stage, stageLabel, turns, scores, adaptive updates, telemetry, and runtime metadata.
- Current stages are intake, warmup, technical, followup, challenge, and feedback.
- Question numbering is implicit: turns are incremented on each response, and the frontend mostly tracks questionIndex or questionCount locally.
- Follow-up responses already return interviewerMessage, feedback, clarifications, hints, encouragement, continueInterview, current_scores, adaptive_update, and telemetry.
- Grounding already exists in backend/services/ragInterviewGroundingService.js, but it is question-centric rather than a full interview context engine.
- The frontend currently has two interview paths: the legacy company-interview flow and the newer interview-suite hub.

The first implementation step is to freeze this contract, then extend it without breaking the current routes.

---

## Target Contract

The new interview engine should make these concepts explicit:
- Session lifecycle: created, intake, warmup, technical_round, followup, challenge, wrapup, feedback, completed.
- Question numbering: questionNumber increments only when the interviewer starts a new question; follow-up probes keep the same questionNumber and get a followUpNumber.
- Stage history: persist every stage transition with turn number, timestamp, and reason.
- Follow-up payloads: include answerQuality, missedConcepts, confidence, depth, branchReason, and nextAction so the backend can explain why it asked a specific follow-up.
- Scoring output: store per-answer and final-session scores for correctness, clarity, completeness, structure, and confidence.
- Final session summary: store strengths, gaps, examples of good answers, repeated misses, and recommended practice.

---

## Task 1: Freeze the current contract and add a safety net

**Files:**
- Modify: backend/routes/ai-features.js
- Modify: backend/services/aiService.js
- Modify: backend/scripts/testInterviewOrchestration.js
- Modify: backend/scripts/testInterviewGrounding.js
- Modify: backend/scripts/testInterviewTelemetry.js
- Modify: backend/scripts/smokeInterviewSuite.js
- Modify: frontend/src/api/aiService.js
- Modify: frontend/src/pages/AIInterviewPage.jsx
- Modify: frontend/src/pages/CompanyInterview.jsx
- Modify: frontend/src/pages/InterviewSuite.jsx
- Modify: docs/AI_INTERVIEW_WORKFLOW.md
- Modify: docs/AI_FEATURES_API.md
- Modify: docs/INTERVIEW_SUITE_API.md

**Step 1: Capture the current request and response shapes in docs.**
- Document the existing start, respond, complete, and session fetch payloads.
- Document the current stage plan and current follow-up response keys.
- Document the legacy company-interview flow separately so it does not get confused with the interview-suite contract.

**Step 2: Add or tighten backend assertions around the current contract.**
- Expand the existing orchestration and grounding scripts so they assert the live shape, not just that a route exists.
- Add checks for stage, stageLabel, current_scores, adaptive_update, telemetry, and continueInterview.

**Step 3: Add a frontend contract note where the interview API is called.**
- Centralize the interview API shape in frontend/src/api/aiService.js so the UI does not scatter payload assumptions.
- Make the current page components consume the same contract objects where possible.

**Step 4: Verify the baseline.**
- Run: npm run test:interview:orchestration --prefix backend
- Run: npm run test:interview:grounding --prefix backend
- Run: npm run test:interview:telemetry --prefix backend
- Run: npm run smoke:interview-suite:local --prefix backend
- Run: npm run lint --prefix frontend
- Run: npm run build --prefix frontend

**Exit criteria:** The current behavior is fully documented and protected by a minimal safety net before refactoring starts.

---

## Task 2: Extract the interview state machine into a dedicated service

**Files:**
- Create: backend/services/interviewStateMachine.js
- Modify: backend/services/aiService.js
- Modify: backend/services/interviewOrchestrator.js
- Modify: backend/routes/ai-features.js
- Modify: backend/scripts/testInterviewOrchestration.js

**Step 1: Write the state machine behavior first.**
- Define the canonical stages and their transition rules.
- Make the stage machine accept the current session state, current turn, answer quality, and missing concepts.
- Make it return the next stage, stage label, question number behavior, and transition reason.

**Step 2: Keep the old route responses stable while the internals move.**
- Update aiService.js to delegate stage decisions to the new state machine without changing the response contract yet.
- Preserve the existing route payload keys until later tasks intentionally evolve them.

**Step 3: Add tests for the state machine in isolation.**
- Cover intake to warmup, warmup to technical, technical to followup, followup to challenge, challenge to wrapup, and wrapup to feedback.
- Cover the case where a weak answer keeps the session in followup rather than advancing.

**Step 4: Verify the extraction.**
- Run: npm run test:interview:orchestration --prefix backend
- Run: npm run lint --prefix backend

**Exit criteria:** Stage progression is deterministic and lives in a single service instead of being embedded in the interview engine.

---

## Task 3: Extract Groq prompt and orchestration logic into dedicated interview services

**Files:**
- Create: backend/services/interviewPromptService.js
- Create: backend/services/interviewConversationService.js
- Modify: backend/services/aiService.js
- Modify: backend/routes/ai-features.js
- Modify: backend/scripts/testInterviewOrchestration.js

**Step 1: Split prompt construction from transport and session mutation.**
- Build one service that assembles the prompt, style constraints, stage directive, and retrieved context.
- Build one service that handles the Groq call, parses JSON safely, and applies fallback behavior when the model fails.

**Step 2: Make tone and difficulty explicit inputs.**
- Pass session stage, interview type, difficulty, interview mode, and observed answer quality into the prompt builder.
- Ensure the service can deliberately control tone, brevity, pressure, and follow-up style.

**Step 3: Add deterministic fallbacks.**
- If Groq returns malformed JSON, generate a safe fallback follow-up from the service.
- If the prompt service cannot build a stage-specific prompt, fall back to a simpler question rather than failing the session.

**Step 4: Verify prompt behavior.**
- Run: npm run test:interview:orchestration --prefix backend
- Run: npm run test --prefix backend

**Exit criteria:** Prompt assembly and model execution are isolated from the rest of the interview session logic.

---

## Task 4: Add retrieval grounding with LlamaIndex

**Files:**
- Create: backend/services/interviewGroundingService.js
- Modify: backend/services/ragInterviewGroundingService.js
- Modify: backend/services/aiService.js
- Modify: backend/services/companyQuestionService.js
- Modify: backend/scripts/testInterviewGrounding.js
- Modify: backend/package.json

**Step 1: Define the grounding sources.**
- Resume context.
- Job description or role context.
- Company-specific knowledge or question bank context.
- Optional user history context from past interviews.

**Step 2: Build a retrieval service around LlamaIndex.**
- Index the allowed sources once per session or once per document change.
- Cache retrieval results by sessionId, company, role, interview type, and stage.
- Return grounded snippets, not just raw questions, so the prompt can personalize its behavior.

**Step 3: Keep the service explainable.**
- Return retrieval time, source type, hit count, and which documents influenced the final prompt.
- Keep a no-context fallback path so the session can still continue if retrieval fails.

**Step 4: Verify retrieval grounding.**
- Run: npm run test:interview:grounding --prefix backend
- Run: npm run smoke:interview-suite:local --prefix backend

**Exit criteria:** The interview engine can ground questions in resume, job, and company context instead of relying on generic prompts.

---

## Task 5: Implement adaptive follow-up rules and scoring

**Files:**
- Create: backend/services/interviewScoringService.js
- Create: backend/services/interviewFollowUpRules.js
- Modify: backend/services/aiService.js
- Modify: backend/services/interviewOrchestrator.js
- Modify: backend/routes/ai-features.js
- Modify: backend/scripts/testInterviewTelemetry.js

**Step 1: Define the scoring rubric.**
- correctness
- clarity
- completeness
- structure
- confidence

**Step 2: Define rule-based follow-up branches.**
- High-quality answer: ask a deeper or more open-ended challenge.
- Missed concept: ask a targeted corrective follow-up.
- Low confidence: ask the candidate to restate or justify the answer.
- Shallow answer: probe for examples, trade-offs, or edge cases.
- Strong depth but weak clarity: ask for a cleaner explanation rather than a harder algorithm.

**Step 3: Store both turn-level and final-session scoring.**
- Persist answer-level scores on each turn.
- Aggregate into a session-level summary when the interview completes.
- Include strengths, weaknesses, and recommended practice areas.

**Step 4: Verify the adaptive path.**
- Run: npm run test:interview:telemetry --prefix backend
- Run: npm run test:interview:orchestration --prefix backend

**Exit criteria:** Follow-ups are explainable, repeatable, and driven by answer quality rather than model guesswork alone.

---

## Task 6: Instrument the interview flow with OpenTelemetry

**Files:**
- Create: backend/services/interviewTelemetryService.js
- Create: backend/utils/telemetry.js
- Modify: backend/services/aiService.js
- Modify: backend/services/interviewGroundingService.js
- Modify: backend/services/interviewConversationService.js
- Modify: backend/routes/ai-features.js
- Modify: backend/package.json

**Step 1: Add spans around each major hop.**
- Session start
- Retrieval grounding
- Prompt building
- Model call
- Response parsing
- Scoring
- Session completion

**Step 2: Record explainable attributes.**
- sessionId
- stage
- questionNumber
- model name
- grounding hit count
- retrieval latency
- model latency
- fallback triggered yes or no
- follow-up branch reason

**Step 3: Preserve session-level summaries.**
- Emit a compact telemetry snapshot into the session context.
- Keep the backend route response useful for debugging without exposing sensitive internals.

**Step 4: Verify observability data is flowing.**
- Run: npm run test:interview:telemetry --prefix backend
- Run: npm run smoke:interview-suite:local --prefix backend

**Exit criteria:** The interview path can be traced end-to-end with latency and decision data visible for debugging.

---

## Task 7: Add a voice path only after the text flow is stable

**Files:**
- Modify: backend/services/aiService.js
- Create: backend/services/interviewVoiceAdapter.js
- Modify: backend/routes/voice.js or the existing voice route module if that is already the owner
- Modify: existing voice worker entry point
- Modify: frontend/src/hooks/useRealtimeInterview.js
- Modify: frontend/src/pages/AIInterviewPage.jsx
- Modify: frontend/src/pages/CompanyInterview.jsx

**Step 1: Keep voice as an adapter, not a new interview engine.**
- Reuse the same interview session state and scoring pipeline.
- Make speech-to-text feed the same respond endpoint that text uses.
- Make text-to-speech consume the same interviewerMessage output.

**Step 2: Choose the speech engine implementation.**
- Use Whisper or faster-whisper in the voice worker, not inside the core interview logic.
- Keep the backend session and prompt behavior unchanged when voice is added.

**Step 3: Gate voice behind text-readiness.**
- Do not ship the voice path until the text session lifecycle, grounding, scoring, and telemetry are already passing.
- Use the same final session summary so voice and text produce the same results.

**Step 4: Verify the voice adapter separately.**
- Add a smoke test or manual script for STT and TTS integration once the core flow is stable.
- Keep the text route tests green before enabling voice entry points.

**Exit criteria:** Voice becomes a thin transport layer on top of the same canonical interview engine.

---

## Task 8: Rework the frontend into a realistic interview experience

**Files:**
- Modify: frontend/src/pages/InterviewSuite.jsx
- Modify: frontend/src/pages/AIInterviewPage.jsx
- Modify: frontend/src/pages/CompanyInterview.jsx
- Modify: frontend/src/components/InterviewSession.jsx
- Modify: frontend/src/components/ModernInterviewContainer.jsx
- Modify: frontend/src/api/aiService.js
- Modify: frontend/src/pages/aiInterviewRuntime.test.js
- Add: frontend/src/pages/__tests__/interviewFlow.test.jsx or a nearby Vitest test file

**Step 1: Make the UI render the backend state machine.**
- Show explicit stage progress, not just question count.
- Show questionNumber, follow-up count, and transition messaging.
- Show a visible timer or pressure indicator when the challenge stage begins.

**Step 2: Present interviewer behavior more realistically.**
- Render interviewer prompts and follow-ups separately from feedback.
- Make the UI reflect when the engine is probing, challenging, or wrapping up.
- Show a clear end-of-session feedback report with strengths, gaps, and next steps.

**Step 3: Keep the frontend contract thin.**
- Move interview API calls into the shared frontend API service.
- Avoid duplicating scoring or stage logic in the page components.

**Step 4: Add frontend verification.**
- Add a Vitest test for the interview state display and final report rendering.
- Prefer role-based queries and visible text assertions.

**Step 5: Verify the UI flow.**
- Run: npm run lint --prefix frontend
- Run: npm run test --prefix frontend
- Run: npm run build --prefix frontend

**Exit criteria:** The user sees a staged, believable interview session instead of a generic chat UI.

---

## Task 9: Finalize docs, smoke tests, and rollout checks

**Files:**
- Modify: docs/AI_INTERVIEW_WORKFLOW.md
- Modify: docs/AI_FEATURES_API.md
- Modify: docs/INTERVIEW_SUITE_API.md
- Modify: backend/scripts/smokeInterviewSuite.js
- Modify: backend/scripts/runInterviewSuiteSmokeLocal.js
- Modify: backend/scripts/testStartup.js
- Modify: backend/scripts/testInterviewOrchestration.js
- Modify: backend/scripts/testInterviewGrounding.js
- Modify: backend/scripts/testInterviewTelemetry.js

**Step 1: Update the docs to describe the new contract.**
- Stage machine and lifecycle.
- Question numbering and follow-up behavior.
- Scoring model and final summary.
- Retrieval grounding and telemetry fields.
- Voice behavior and its dependency on the text flow.

**Step 2: Update smoke scripts for the new response shapes.**
- Verify start, respond, complete, and session fetch payloads.
- Verify stage labels and final summary fields.
- Verify that grounding and scoring metadata are present.

**Step 3: Run the final gate sequence.**
- Run: npm run test --prefix backend
- Run: npm run lint --prefix backend
- Run: npm run smoke:interview-suite:local --prefix backend
- Run: npm run lint --prefix frontend
- Run: npm run test --prefix frontend
- Run: npm run build --prefix frontend

**Exit criteria:** The interview flow is documented, testable, observable, and ready for a staged rollout.

---

## Recommended Execution Order

1. Freeze the current contract and add safety net tests.
2. Extract the state machine.
3. Extract Groq prompt and orchestration services.
4. Add retrieval grounding with LlamaIndex.
5. Add adaptive follow-up and scoring.
6. Add OpenTelemetry instrumentation.
7. Only then add the voice adapter.
8. Rebuild the frontend to match the new session contract.
9. Finish with docs and smoke verification.

## Practical Risk Notes

- Do not change the frontend to expect a new contract before the backend emits it.
- Do not add voice code until the text path is stable and testable.
- Do not let the prompt service directly mutate session state; keep that in the conversation service.
- Do not hide retrieval failures; expose them in telemetry and use a fallback question path.
- Do not keep scoring in the page layer; the backend must remain the source of truth.
