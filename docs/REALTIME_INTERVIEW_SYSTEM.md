# Real-Time AI Interview System

## Overview

The Real-Time AI Interview System provides a smooth, professional interview experience with:

- **Real-time voice processing** using Deepgram WebSocket STT + Kokoro/Groq TTS
- **Live video streaming** with WebRTC for both interviewer and candidate
- **Intelligent answer detection** with adaptive silence thresholds
- **Smooth transitions** between speaking, listening, and processing states
- **Live transcription overlay** with word-by-word animation
- **WebSocket-based backend** for instant feedback and question generation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ VideoInterviewer │  │ LiveTranscription│                │
│  │   Component      │  │    Component     │                │
│  └────────┬─────────┘  └────────┬─────────┘                │
│           │                      │                           │
│  ┌────────▼──────────────────────▼─────────┐                │
│  │   useRealtimeInterview Hook              │                │
│  │  (Orchestrates voice + video + state)    │                │
│  └────────┬──────────────────────┬──────────┘                │
│           │                      │                           │
│  ┌────────▼─────────┐   ┌───────▼──────────┐               │
│  │ useDeepgramVoice │   │ useWebRTCVideo   │               │
│  │  (STT + TTS)     │   │  (Camera)        │               │
│  └────────┬─────────┘   └──────────────────┘               │
│           │                                                  │
└───────────┼──────────────────────────────────────────────────┘
            │
            │ WebSocket (voice) + HTTP (TTS/STT)
            │
┌───────────▼──────────────────────────────────────────────────┐
│                     Backend (Node.js)                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────┐                │
│  │  RealtimeInterviewService (WebSocket)    │                │
│  │  - Instant answer processing             │                │
│  │  - Live feedback generation              │                │
│  │  - Question streaming                    │                │
│  └────────┬─────────────────────────────────┘                │
│           │                                                  │
│  ┌────────▼─────────┐   ┌──────────────────┐               │
│  │  VoiceService    │   │  Groq AI         │               │
│  │  (Kokoro TTS)    │   │  (LLM)           │               │
│  └──────────────────┘   └──────────────────┘               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### Frontend

#### 1. `useRealtimeInterview` Hook
**Location:** `frontend/src/hooks/useRealtimeInterview.js`

Main orchestrator that coordinates:
- Voice recording and transcription
- Video streaming
- Answer submission logic
- State management

**Usage:**
```javascript
const interview = useRealtimeInterview({
  onAnswer: (text) => console.log('Answer:', text),
  onTranscriptUpdate: (partial) => console.log('Live:', partial),
  getAuthHeaders: () => ({ Authorization: 'Bearer token' }),
  interviewType: 'technical',
  personaGender: 'female',
  currentQuestion: 'Tell me about yourself',
});

// Start listening
await interview.startListening();

// Speak question
await interview.speak('What is your experience with React?');

// Stop listening
interview.stopListening();
```

#### 2. `VideoInterviewer` Component
**Location:** `frontend/src/components/VideoInterviewer.jsx`

Advanced AI interviewer video with:
- Smooth state transitions (listening → speaking → thinking)
- Lip-sync visualization
- Speaking ring animations
- Emotion-based styling

**Props:**
```javascript
<VideoInterviewer
  name="Hannah Chen"
  role="Senior Software Engineer"
  company="Google"
  gender="female"
  state="speaking" // listening | speaking | thinking
  audioLevel={0.5}
  onVideoReady={(mode) => console.log('Video ready:', mode)}
/>
```

#### 3. `LiveTranscription` Component
**Location:** `frontend/src/components/LiveTranscription.jsx`

Real-time transcription overlay with:
- Word-by-word animation
- Interim text highlighting
- Speaker identification
- Live cursor indicator

**Props:**
```javascript
<LiveTranscription
  text="This is the final transcript"
  interimText="and this is being typed"
  speaker="candidate" // interviewer | candidate
  interviewerName="Hannah Chen"
  isLive={true}
  maxLength={200}
/>
```

#### 4. `useWebRTCVideo` Hook
**Location:** `frontend/src/hooks/useWebRTCVideo.js`

WebRTC video streaming with:
- Camera device enumeration
- Quality control (HD/SD/Low)
- Device switching
- Auto-start support

**Usage:**
```javascript
const video = useWebRTCVideo({
  quality: 'sd',
  autoStart: true,
});

// Start camera
await video.start();

// Switch camera
await video.switchCamera(deviceId);

// Stop camera
video.stop();
```

### Backend

#### 1. `RealtimeInterviewService`
**Location:** `backend/services/realtimeInterviewService.js`

WebSocket service for real-time interview processing:
- Instant answer evaluation
- Live feedback generation
- Question streaming
- Session management

**WebSocket Protocol:**

**Client → Server:**
```json
{
  "type": "start",
  "company": "Google",
  "role": "Software Engineer",
  "stage": "Technical",
  "experienceLevel": "experienced"
}

{
  "type": "answer",
  "answer": "I have 5 years of experience...",
  "code": "function example() { ... }",
  "language": "javascript"
}

{
  "type": "transcript",
  "text": "I think that...",
  "isFinal": false
}
```

**Server → Client:**
```json
{
  "type": "connected",
  "sessionId": "session_123",
  "timestamp": 1234567890
}

{
  "type": "question",
  "question": "Tell me about your experience with React",
  "questionIndex": 1,
  "timestamp": 1234567890
}

{
  "type": "feedback",
  "feedback": "Great answer! You demonstrated...",
  "score": 85,
  "strengths": ["Clear communication", "Good examples"],
  "improvements": ["Add more technical depth"],
  "timestamp": 1234567890
}

{
  "type": "processing",
  "timestamp": 1234567890
}
```

## Voice Pipeline

### Speech-to-Text (STT)

**Primary:** Deepgram WebSocket (Nova-2 model)
- Real-time streaming transcription
- Interim results for live display
- Utterance end detection
- Filler word detection

**Fallback:** Deepgram REST API
- Chunk-based processing
- Used when WebSocket fails

### Text-to-Speech (TTS)

**Chain:** Kokoro (local) → Groq Orpheus → Browser SpeechSynthesis

1. **Kokoro TTS** (Primary)
   - Local ONNX model
   - Zero cost
   - ~300ms latency
   - High-quality voices

2. **Groq Orpheus** (Fallback)
   - Cloud-based
   - Natural voices
   - Automatic chunking for long text

3. **Browser SpeechSynthesis** (Last resort)
   - Built-in browser API
   - Always available
   - Lower quality

## Answer Detection Logic

### Intelligent Silence Detection

The system uses a two-tier silence detection:

1. **After Speech Silence** (5 seconds)
   - Triggered after user stops speaking
   - Gives time for user to continue

2. **Total Silence** (10 seconds)
   - Triggered if user never speaks
   - Prevents hanging on mic issues

### Adaptive Thresholds

Silence duration adapts based on answer length:
- **Short answers** (<50 chars): 2.5s silence
- **Medium answers** (50-200 chars): 1.8s silence
- **Long answers** (>200 chars): 1.2s silence

### Safety Mechanisms

- **Max answer duration:** 2 minutes per question
- **Min answer length:** 10 characters
- **Auto-skip on repeated silence:** 3 consecutive silent questions

## Video Synchronization

### State Management

The interviewer video has three states:
1. **Listening** - Attentive, nodding video
2. **Speaking** - Animated, talking video
3. **Thinking** - Neutral, processing video

### Smooth Transitions

- Videos preload in background
- Crossfade between states (400ms)
- Playback position preserved
- No flicker or lag

### Visual Indicators

- **Speaking ring:** Animated border during speech
- **Lip-sync bars:** Audio-reactive visualization
- **State badge:** Current state indicator
- **Emotion styling:** Filter effects based on mood

## Performance Optimizations

### 1. TTS Pre-fetching
```javascript
// Pre-fetch next question audio while user is speaking
voice.prefetch(nextQuestion);
```

### 2. Video Preloading
```javascript
// Both videos load in parallel
<video preload="auto" />
```

### 3. WebSocket Reuse
```javascript
// Keep WebSocket alive across questions
// Reduces latency from ~500ms to ~50ms
```

### 4. Chunk Streaming
```javascript
// MediaRecorder sends 250ms chunks
// Enables real-time transcription
recorder.start(250);
```

## Integration Guide

### 1. Install Dependencies

```bash
npm install ws groq-sdk kokoro-js
```

### 2. Backend Setup

```javascript
// backend/index.js
import realtimeInterviewService from './services/realtimeInterviewService.js';

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize WebSocket service
  realtimeInterviewService.initialize(server);
});
```

### 3. Frontend Setup

```javascript
// pages/AIInterviewPage.jsx
import { useRealtimeInterview } from '../hooks/useRealtimeInterview';
import VideoInterviewer from '../components/VideoInterviewer';
import LiveTranscription from '../components/LiveTranscription';

function AIInterviewPage() {
  const interview = useRealtimeInterview({
    onAnswer: handleAnswer,
    onTranscriptUpdate: setTranscript,
    getAuthHeaders,
    interviewType: 'technical',
    personaGender: 'female',
    currentQuestion,
  });

  return (
    <div>
      <VideoInterviewer
        name="Hannah Chen"
        role="Senior Software Engineer"
        company="Google"
        gender="female"
        state={interview.state}
        audioLevel={interview.outputLevel}
      />
      
      <LiveTranscription
        text={interview.transcript}
        interimText={interview.interimText}
        speaker={interview.state === 'listening' ? 'candidate' : 'interviewer'}
        interviewerName="Hannah Chen"
        isLive={interview.state === 'listening'}
      />
    </div>
  );
}
```

## Environment Variables

```env
# Required
GROQ_API_KEY=your_groq_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key

# Optional (for enhanced features)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Troubleshooting

### Issue: Microphone not working
**Solution:** Check browser permissions and HTTPS requirement

### Issue: Video not loading
**Solution:** Ensure video files exist in `/public` directory

### Issue: WebSocket connection fails
**Solution:** Check CORS settings and WebSocket path

### Issue: TTS fallback to browser speech
**Solution:** Verify Kokoro model installation and Groq API key

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| WebRTC Video | ✅ | ✅ | ✅ | ✅ |
| WebSocket | ✅ | ✅ | ✅ | ✅ |
| MediaRecorder | ✅ | ✅ | ✅ | ✅ |
| Deepgram STT | ✅ | ✅ | ✅ | ✅ |
| Kokoro TTS | ✅ | ✅ | ⚠️ | ✅ |

⚠️ = Fallback to browser speech

## Performance Metrics

- **Voice latency:** 50-150ms (WebSocket) / 200-500ms (REST)
- **TTS latency:** 300-500ms (Kokoro) / 800-1200ms (Groq)
- **Video transition:** 400ms smooth crossfade
- **Transcription accuracy:** 95%+ (Deepgram Nova-2)
- **Answer detection:** 1-3s after speech ends

## Future Enhancements

1. **Emotion detection** from voice tone
2. **Facial expression analysis** from video
3. **Real-time code execution** in editor
4. **Multi-language support** for international candidates
5. **Screen sharing** for system design questions
6. **Recording and playback** of full interview sessions

## License

MIT License - See LICENSE file for details
