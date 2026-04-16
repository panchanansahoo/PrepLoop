# TTS Timeout Troubleshooting Guide

## Issue: "TTS timeout, falling back to browser speech"

This happens when the TTS service takes longer than 30 seconds to respond.

## Quick Fixes

### 1. Check TTS Health
```bash
curl http://localhost:5000/api/voice/tts-health
```

Response shows provider stats:
```json
{
  "providers": {
    "tts": {
      "kokoro": true,
      "groq": true,
      "browser": true
    }
  },
  "stats": {
    "kokoro": {
      "successCount": 45,
      "failCount": 2,
      "avgLatency": 450,
      "lastFail": 0
    },
    "groq": {
      "successCount": 10,
      "failCount": 1,
      "avgLatency": 1200,
      "lastFail": 0
    }
  }
}
```

### 2. Verify Kokoro Installation
```bash
cd backend
node -e "import('kokoro-js').then(m => console.log('✓ Kokoro installed')).catch(() => console.log('✗ Kokoro missing'))"
```

If missing:
```bash
npm install kokoro-js
```

### 3. Check Groq API Key
```bash
# backend/.env
GROQ_API_KEY=your_groq_api_key
```

Test:
```bash
curl -X POST http://localhost:5000/api/voice/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world","persona":"friendly","gender":"female"}'
```

### 4. Reduce Text Length

The system auto-truncates to 250 chars, but you can reduce further:

**backend/services/voiceService.js:**
```javascript
const maxChars = 150; // Reduce from 250 for faster generation
```

### 5. Increase Timeout (Last Resort)

**frontend/src/hooks/useDeepgramVoice.js:**
```javascript
const TTS_TIMEOUT_MS = 45000; // Increase from 30s to 45s
```

## Root Causes

### Kokoro Slow on First Run
**Symptom:** First TTS takes 2-3 seconds, then fast
**Fix:** Preload on startup

**backend/index.js:**
```javascript
import voiceService from './services/voiceService.js';

// Preload Kokoro model at startup
voiceService.preloadKokoroTTS();
```

### CPU Overload
**Symptom:** Kokoro consistently slow (>2s)
**Fix:** Reduce concurrent requests or use Groq

**backend/services/voiceService.js:**
```javascript
// Skip Kokoro if under load
if (process.cpuUsage().user > 80) {
  console.log('[TTS] CPU high, skipping Kokoro');
  // Fall through to Groq
}
```

### Groq Rate Limit
**Symptom:** Groq fails with 429 errors
**Fix:** Add retry with exponential backoff (already implemented)

### Network Issues
**Symptom:** Both Kokoro and Groq timeout
**Fix:** Check internet connection and firewall

## Performance Tuning

### Optimal Settings

**For Speed (300-500ms):**
```javascript
// Use Kokoro only
const maxChars = 150;
const speed = 1.2; // Faster playback
```

**For Quality:**
```javascript
// Use Groq Orpheus
const maxChars = 300;
const speed = 1.0; // Natural pace
```

**For Reliability:**
```javascript
// Use all providers with cooldown
const TTS_TIMEOUT_MS = 30000;
const PROVIDER_COOLDOWN_MS = 60000;
```

## Monitoring

### Enable Debug Logs

**frontend:**
```javascript
localStorage.setItem('voiceDebug', 'true');
```

**backend:**
```javascript
// backend/services/voiceService.js
console.log('[TTS] Provider:', provider, 'Latency:', latency, 'ms');
```

### Check Analytics

```javascript
// In browser console
const analytics = dgVoice.getAnalytics();
console.log('TTS Fallbacks:', analytics.ttsFallbacks);
console.log('TTS Retries:', analytics.ttsRetries);
```

## Provider Cooldown System

The system automatically disables failing providers for 60 seconds:

```
Kokoro fails → Cooldown 60s → Try Groq
Groq fails → Cooldown 60s → Try Browser
After 60s → Retry Kokoro
```

This prevents cascading failures and ensures smooth experience.

## Expected Latencies

| Provider | First Call | Subsequent | Quality |
|----------|-----------|------------|---------|
| Kokoro | 2000ms | 300-500ms | High |
| Groq Orpheus | 1000-1500ms | 800-1200ms | Very High |
| Browser Speech | 100-300ms | 100-300ms | Medium |

## When to Use Browser Fallback

Browser speech is acceptable for:
- ✅ Short phrases (<50 chars)
- ✅ Non-critical feedback
- ✅ Emergency fallback

Avoid for:
- ❌ Long questions (>100 chars)
- ❌ Professional interviews
- ❌ Production demos

## Advanced: Custom TTS Provider

Add your own TTS provider:

**backend/services/voiceService.js:**
```javascript
async function customTTS(text, persona, gender) {
  const response = await fetch('https://your-tts-api.com/synthesize', {
    method: 'POST',
    body: JSON.stringify({ text, voice: gender }),
  });
  
  const audioBuffer = await response.arrayBuffer();
  return {
    audio: Buffer.from(audioBuffer),
    contentType: 'audio/mpeg',
    provider: 'custom',
  };
}

// Add to chain
export async function textToSpeech(text, ...) {
  // Try custom provider first
  try {
    const result = await customTTS(text, persona, gender);
    if (result) return result;
  } catch (err) {
    console.warn('[TTS] Custom failed:', err);
  }
  
  // Fall back to Kokoro...
}
```

## Support

If issues persist:
1. Check `/api/voice/tts-health` endpoint
2. Review browser console for errors
3. Check backend logs for TTS failures
4. Verify all environment variables are set
5. Test with minimal text: "Hello"

## Summary

**Quick Fix:** Restart backend to reload Kokoro model
**Best Practice:** Preload Kokoro on startup
**Fallback:** Browser speech always works
**Monitoring:** Use `/api/voice/tts-health` endpoint
