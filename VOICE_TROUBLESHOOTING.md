# Voice Not Working - Troubleshooting Guide

## Quick Diagnosis Checklist

### 1. Check Backend Logs
```bash
cd backend
npm run dev
```

Look for these messages:
- ✅ `[Kokoro] Model ready ✓` - Local TTS working
- ⚠️ `[Kokoro] Init failed` - Kokoro unavailable, using fallback
- ✅ `[Kokoro] Generated X.Xs audio in Xms` - TTS successful
- ❌ `[voice/tts] Error:` - TTS failed

### 2. Check Environment Variables
```bash
# backend/.env must have:
GROQ_API_KEY=gsk_xxxxxxxxxxxxx  # Required for voice fallback
```

### 3. Test Voice Endpoint
```bash
# Test TTS endpoint
curl -X POST http://localhost:5000/api/voice/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world","persona":"friendly","gender":"female"}' \
  --output test-audio.wav

# Check if audio file was created
ls -lh test-audio.wav

# If you get JSON response with {"fallback":true}, voice is not working
```

---

## Common Issues & Solutions

### Issue #1: Missing GROQ_API_KEY ⚠️
**Symptom:** 
- Response: `{"fallback": true}`
- No audio generated

**Solution:**
```bash
# 1. Get API key from https://console.groq.com
# 2. Add to backend/.env:
GROQ_API_KEY=gsk_your_actual_key_here

# 3. Restart backend
npm run dev
```

---

### Issue #2: Kokoro Model Not Loading 🤖
**Symptom:**
- Console: `[Kokoro] Init failed`
- Falls back to Groq immediately

**Solution:**
```bash
cd backend

# Install required packages
npm install kokoro-js @huggingface/transformers

# Clear node_modules and reinstall (if needed)
rm -rf node_modules package-lock.json
npm install

# Restart backend
npm run dev
```

**Note:** Kokoro downloads ~82MB model on first run (takes ~2-5 seconds)

---

### Issue #3: Empty Audio Buffer 🔇
**Symptom:**
- Console: `[voice/tts] Empty audio buffer received`
- Response: `{"fallback": true}`

**Root Cause:** All TTS providers failed

**Solution:**
1. Check GROQ_API_KEY is valid
2. Check internet connection
3. Check Groq API status: https://status.groq.com
4. Try manual test:
```bash
curl -X POST http://localhost:5000/api/voice/providers
# Should show available providers
```

---

### Issue #4: Deepgram STT Not Working 🎤
**Symptom:**
- Speech-to-text returns empty transcript
- Falls back to browser recognition

**Solution:**
```bash
# Add to backend/.env:
DEEPGRAM_API_KEY=your_deepgram_key

# Get key from: https://console.deepgram.com
```

---

### Issue #5: CORS Issues 🌐
**Symptom:**
- Frontend: `CORS policy blocked`
- Audio request fails in browser

**Solution:**
```bash
# In backend/.env, ensure:
FRONTEND_URL=http://localhost:5173

# Or your actual frontend URL
```

---

## Provider Chain Explained

### TTS (Text-to-Speech)
```
1. Kokoro (local, free, fast) 
   ↓ fails
2. Groq Orpheus (cloud, requires GROQ_API_KEY)
   ↓ fails
3. Google Translate TTS (multilingual only)
   ↓ fails
4. Return {"fallback": true} → Frontend uses browser TTS
```

### STT (Speech-to-Text)
```
1. Deepgram Nova-2 (requires DEEPGRAM_API_KEY)
   ↓ fails
2. Groq Whisper (requires GROQ_API_KEY)
   ↓ fails
3. Return {"fallback": true} → Frontend uses browser recognition
```

---

## Testing Each Provider

### Test Kokoro (Local TTS)
```bash
# Check if kokoro-js is installed
npm list kokoro-js

# Expected: kokoro-js@X.X.X
# If not found: npm install kokoro-js
```

### Test Groq Orpheus (Cloud TTS)
```bash
# Test with curl
curl -X POST http://localhost:5000/api/voice/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Testing Groq","provider":"groq"}' \
  --output groq-test.wav

# Check response headers
curl -I -X POST http://localhost:5000/api/voice/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Test"}'

# Should see: X-TTS-Provider: kokoro or groq-orpheus
```

### Test Deepgram (STT)
```bash
# Check if key is set
echo $DEEPGRAM_API_KEY

# Test endpoint
curl http://localhost:5000/api/voice/providers

# Should show: "deepgram": true
```

---

## Debug Mode

Enable verbose logging:

```javascript
// backend/services/voiceService.js
// Uncomment console.log statements to see detailed flow

// Or set environment variable:
VOICE_DEBUG_LOGS=true
```

---

## Frontend Integration Check

### Check Frontend Code
```javascript
// Frontend should handle fallback gracefully:
const response = await fetch('/api/voice/tts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'Hello', persona: 'friendly' })
});

if (response.headers.get('content-type')?.includes('application/json')) {
  const json = await response.json();
  if (json.fallback) {
    // Use browser TTS as fallback
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }
} else {
  // Got audio buffer
  const audioBlob = await response.blob();
  const audio = new Audio(URL.createObjectURL(audioBlob));
  audio.play();
}
```

---

## Performance Benchmarks

| Provider | First Request | Subsequent | Quality | Cost |
|----------|--------------|------------|---------|------|
| Kokoro | ~2s (model load) | ~200ms | Good | Free |
| Groq Orpheus | ~800ms | ~600ms | Excellent | Free tier |
| Google TTS | ~400ms | ~300ms | Good | Free |
| Browser TTS | Instant | Instant | Varies | Free |

---

## Fixed Bugs

✅ **Empty audio buffer validation** - Now returns `{fallback: true}` instead of sending empty buffer
✅ **Duplicate buffer check** - Added validation in both `/tts` and `/tts-stream` endpoints

---

## Still Not Working?

1. **Check Node.js version:** Requires Node 18+
   ```bash
   node --version
   ```

2. **Check port availability:**
   ```bash
   lsof -i :5000  # macOS/Linux
   netstat -ano | findstr :5000  # Windows
   ```

3. **Check firewall:** Ensure port 5000 is not blocked

4. **Check backend health:**
   ```bash
   curl http://localhost:5000/health
   # Should return: {"status":"ok","message":"Server is running"}
   ```

5. **Check available providers:**
   ```bash
   curl http://localhost:5000/api/voice/providers
   ```

6. **Enable debug logs:**
   ```bash
   # In backend/.env
   VOICE_DEBUG_LOGS=true
   NODE_ENV=development
   ```

---

## Contact Support

If voice still doesn't work after following this guide:

1. Share backend logs (first 50 lines after startup)
2. Share output of: `curl http://localhost:5000/api/voice/providers`
3. Share environment (OS, Node version, npm version)
4. Share error messages from browser console
