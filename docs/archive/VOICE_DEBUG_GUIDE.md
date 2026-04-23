# Voice System Debugging Guide

## Quick Test Steps

### 1. Test Voice System Independently
Open `http://localhost:5173/voice-test.html` in your browser and run each test:

- **Test Microphone**: Verifies browser can access your mic
- **Test TTS**: Verifies AI voice output works
- **Test STT**: Records 5 seconds and transcribes it

### 2. Check Browser Console
Open Developer Tools (F12) → Console tab and look for these messages:

**When clicking the microphone button, you should see:**
```
[useDeepgramVoice] Starting voice recording...
[useDeepgramVoice] Requesting microphone access...
[useDeepgramVoice] ✓ Microphone access granted
[useDeepgramVoice] Connecting to Deepgram WebSocket...
[useDeepgramVoice] ✓ Deepgram WebSocket connected
[useDeepgramVoice] ✓ Recording started (chunk interval: 250ms)
```

**If you see errors:**
- `NotAllowedError` → You denied microphone permission
- `NotFoundError` → No microphone detected
- `Access token required` → Authentication issue
- `WebSocket closed` → Deepgram connection failed

### 3. Check Microphone Indicator
When recording, you should see:
- Microphone button shows "Listening..."
- A small badge showing "WS" (WebSocket) or "REST" (fallback)
- Green waveform bars moving when you speak

### 4. Check Network Tab
Open Developer Tools (F12) → Network tab:

**Look for these requests:**
- `GET /api/voice/deepgram-token` → Should return `{"available":true,"token":"..."}`
- `POST /api/voice/tts-stream` → Should return audio/wav (150KB+)
- `POST /api/voice/stt-chunk` → Should return `{"transcript":"...","confidence":0.9}`

## Common Issues & Fixes

### Issue 1: "Microphone access denied"
**Fix:** 
1. Click the 🔒 icon in browser address bar
2. Set Microphone to "Allow"
3. Refresh the page

### Issue 2: No audio from AI
**Symptoms:** AI text appears but no voice
**Fix:**
1. Check browser console for TTS errors
2. Verify backend is running: `curl http://localhost:5000/health`
3. Test TTS directly: `curl -X POST http://localhost:5000/api/voice/tts -H "Content-Type: application/json" -d '{"text":"test","persona":"friendly","gender":"female"}' --output test.wav`
4. Check if test.wav file was created and has size > 100KB

### Issue 3: User voice not transcribed
**Symptoms:** Microphone shows "Listening..." but no transcript appears
**Fix:**
1. Check console for WebSocket connection status
2. If you see "REST" badge instead of "WS", Deepgram WebSocket failed
3. Verify DEEPGRAM_API_KEY in backend/.env
4. Check if you're logged in (authentication required for Deepgram token)

### Issue 4: "Access token required"
**Fix:**
1. Make sure you're logged in to the app
2. Check browser console for auth errors
3. Verify `getAuthHeaders` is passed to `useDeepgramVoice` hook

### Issue 5: WebSocket connection fails
**Symptoms:** Console shows "WebSocket closed" or "Failed (using REST fallback)"
**Fix:**
1. Verify DEEPGRAM_API_KEY is valid: Check https://console.deepgram.com/
2. Check if Deepgram API is accessible: `curl https://api.deepgram.com/v1/listen -H "Authorization: Token YOUR_KEY"`
3. REST fallback should still work (slower but functional)

## Backend Verification

### Check Environment Variables
```bash
cd backend
node -e "import('./config/env.js').then(() => { console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'Present' : 'Missing'); console.log('DEEPGRAM_API_KEY:', process.env.DEEPGRAM_API_KEY ? 'Present' : 'Missing'); });"
```

### Test TTS Endpoint
```bash
curl -X POST http://localhost:5000/api/voice/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world","persona":"friendly","gender":"female"}' \
  --output test.wav
```
Should create test.wav file ~150KB

### Test STT Endpoint (requires audio file)
```bash
# Record a test file first, then:
curl -X POST http://localhost:5000/api/voice/stt-chunk \
  -F "audio=@test.webm" \
  -F "mimeType=audio/webm"
```
Should return: `{"transcript":"...","confidence":0.9}`

## Architecture Overview

### Voice Input Flow (STT)
1. User clicks mic button → `toggleMic()` → `dgVoice.start()`
2. Browser requests microphone permission
3. MediaRecorder captures audio in 250ms chunks
4. **Primary path**: Chunks sent to Deepgram WebSocket → Real-time transcription
5. **Fallback path**: If WebSocket fails, chunks sent to `/api/voice/stt-chunk` (REST)
6. Transcript appears in UI as user speaks

### Voice Output Flow (TTS)
1. AI generates response text
2. Frontend calls `dgVoice.speak(text)`
3. POST to `/api/voice/tts-stream` with text
4. **Backend chain**: Kokoro (local) → Groq Orpheus → Google TTS → Browser fallback
5. Audio blob returned and played via HTML5 Audio element

## Debug Mode

Enable verbose logging:
```javascript
// In browser console:
localStorage.setItem('voiceDebug', 'true');
// Reload page
```

This will show detailed logs for every voice request/response.

## Performance Benchmarks

**Expected latencies:**
- Microphone start: 100-300ms
- WebSocket connect: 200-500ms
- TTS (Kokoro): 1-2 seconds for 20 words
- STT (Deepgram WS): Real-time (< 100ms delay)
- STT (REST fallback): 500-1000ms per chunk

## Still Not Working?

1. **Restart backend**: `cd backend && npm run dev`
2. **Restart frontend**: `cd frontend && npm run dev`
3. **Clear browser cache**: Ctrl+Shift+Delete → Clear cache
4. **Try different browser**: Chrome/Edge work best
5. **Check firewall**: Ensure WebSocket connections allowed
6. **Share console logs**: Copy all errors from browser console and share them

## Contact

If none of these fixes work, share:
1. Browser console logs (all errors)
2. Network tab screenshot showing failed requests
3. Backend terminal output
4. Results from voice-test.html page
