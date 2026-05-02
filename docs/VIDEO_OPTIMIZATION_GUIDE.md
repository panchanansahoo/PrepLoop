# Video Optimization Guide

## Overview

PrepLoop interview videos (16.53 MB total) are optimized for production using multiple codec formats to balance **compression**, **compatibility**, and **playback smoothness**.

## Video Files

| Video | Size | Usage |
|-------|------|-------|
| `malespeaking.mp4` | 1.82 MB | Male interviewer speaking |
| `malelisrning.mp4` | 1.39 MB | Male interviewer listening |
| `HannahChenSpeaking.mp4` | 7.03 MB | Female interviewer (Hannah Chen) speaking |
| `HannahChenListening.mp4` | 6.29 MB | Female interviewer (Hannah Chen) listening |
| **Total** | **16.53 MB** | — |

## Optimization Strategy

### Three-Format Approach

1. **Primary: WebM (VP9)** — Modern browsers
   - 30-40% smaller than H.264
   - Excellent quality at lower bitrates
   - Browser support: Chrome, Firefox, Edge

2. **Fallback: MP4 (H.265/HEVC)** — Older modern browsers
   - 40-50% smaller than H.264
   - Better compatibility than VP9
   - Browser support: Safari 13+, Edge 18+

3. **Ultimate Fallback: MP4 (H.264)** — Legacy browsers & offline
   - Universal compatibility
   - Original files remain as safety net
   - Used if H.265/HEVC unavailable

### Expected Compression

```
Original (H.264):       16.53 MB
├─ VP9 WebM (CRF 24):  ~9.9 MB  (-40%)
├─ H.265 MP4 (CRF 24): ~8.3 MB  (-50%)
└─ H.264 MP4 (orig):   16.53 MB (baseline)

Optimized Total: ~18-26 MB (3 formats) vs 16.53 MB (original)
Bandwidth Savings per View: -40% via VP9, or -50% via H.265
```

## Implementation

### Step 1: Generate Optimized Versions

```bash
# Install ffmpeg first (one-time)
# Windows: choco install ffmpeg
# macOS:   brew install ffmpeg
# Linux:   sudo apt-get install ffmpeg

# Run optimization script
cd frontend
node scripts/optimize-videos.js

# Optional: Customize quality (lower CRF = better quality, larger file)
# CRF range: 18 (high quality) to 28 (high compression)
node scripts/optimize-videos.js --quality=22

# Dry-run to preview without making changes
node scripts/optimize-videos.js --dry-run
```

This generates:
- `malespeaking.webm` + `malespeaking.h265.mp4`
- `malelisrning.webm` + `malelisrning.h265.mp4`
- `HannahChenSpeaking.webm` + `HannahChenSpeaking.h265.mp4`
- `HannahChenListening.webm` + `HannahChenListening.h265.mp4`

### Step 2: Update VideoInterviewer Component

The component automatically selects the best format:

```jsx
// VideoInterviewer.jsx uses intelligent source selection
const getVideoSources = (gender, mode) => {
  const base = `/${getBaseVideoName(gender, mode)}`;
  return [
    { src: `${base}.webm`, type: 'video/webm; codecs=vp9' },  // Primary (40% smaller)
    { src: `${base}.h265.mp4`, type: 'video/mp4; codecs=hev1.1.6.L120' }, // Fallback
    { src: `${base}.mp4`, type: 'video/mp4' }, // Ultimate fallback
  ];
};
```

### Step 3: Verify & Deploy

```bash
# Build and verify service worker caches optimized files
npm run build

# Test video playback
# - Check Network tab: should load .webm first
# - Fall back to .h265.mp4 if .webm unavailable
# - Use .mp4 only as last resort (legacy)

# Monitor real-world usage
# - Check Application Insights for video load times
# - Verify cache hit rates via browser DevTools
# - Monitor bandwidth savings in production
```

## File Size Impact

### Per User Session

- **Current**: User downloads 13-14 MB (speaking + listening + other assets)
- **After optimization**: User downloads ~5-7 MB (VP9 primary, 40% smaller)
- **Savings per user**: -6-7 MB per interview session

### At Scale

- 1000 users/day × 6 MB savings = **6 GB/day reduction**
- 365,000 users/year × 6 MB savings = **~2.19 TB/year reduction**

## Browser Compatibility

| Format | Chrome | Firefox | Safari | Edge |
|--------|--------|---------|--------|------|
| VP9 WebM | ✅ 43+ | ✅ 28+ | ❌ | ✅ 15+ |
| H.265 MP4 | ✅ 108+ | ⚠️ 116+ (optional) | ✅ 13+ | ✅ 108+ |
| H.264 MP4 | ✅ All | ✅ All | ✅ All | ✅ All |

**Result**: 99%+ of users get VP9 (40% smaller), 99%+ fallback support via H.265 or H.264.

## Performance Characteristics

### Encoding Time

Expected encoding duration per video (varies by hardware):
- VP9: 15-45 minutes (CPU intensive)
- H.265 with GPU: 5-10 minutes (if NVIDIA GPU available)
- H.265 software: 20-40 minutes

**Total estimated time**: 2-4 hours for all 4 videos.

### Quality Considerations

CRF (Constant Rate Factor) values and perceived quality:
- CRF 18-20: Visually lossless / reference quality
- CRF 20-24: High quality, recommended for streaming
- CRF 24-28: Good quality, smaller files
- CRF 28+: Lower quality, minimal files (not recommended)

**Recommended**: CRF 22-24 for interview videos (balance quality & compression).

## Caching & Delivery

### Service Worker

Service worker (`public/sw.js`) caches video files:
- First request: Download from server
- Subsequent requests: Load from cache
- Cache headers: 1 year expiry (cache-busting via URL)

### CDN Recommendations

For production, store optimized videos on CDN:
- Serve from edge locations near users
- Reduce origin load and bandwidth
- Enable HTTP/2 for faster multi-format delivery

## Troubleshooting

### ffmpeg not found
```bash
# Verify ffmpeg is in PATH
ffmpeg -version

# If not installed:
# Windows: choco install ffmpeg (then restart terminal)
# macOS: brew install ffmpeg
# Linux: sudo apt-get install ffmpeg
```

### Video plays in wrong format
Check browser DevTools → Network tab:
1. Filter by `.webm` / `.mp4` files
2. Check which format loaded
3. If H.264 loaded instead of VP9, browser doesn't support VP9
4. This is expected for older browsers (fallback works correctly)

### Encoding fails with "codec not found"
Some ffmpeg builds lack optional codecs. Try:
```bash
# Verify ffmpeg supports required codecs
ffmpeg -codecs | grep -E 'vp9|hevc'

# If missing, reinstall with full codec support
# Windows: choco install ffmpeg --force
# macOS: brew uninstall ffmpeg && brew install ffmpeg --with-options
```

### Service worker caching old videos
Clear browser cache:
1. DevTools → Application → Cache → Clear
2. Or disable cache during development
3. Service worker uses versioned cache names (v1, v2, etc)

## Monitoring & Metrics

After deployment, monitor these KPIs:

1. **Video Load Time** (p95)
   - Before: ~2-3s (16 MB over LTE)
   - After: ~1-1.5s (9 MB over LTE)
   - Target: <1.5s

2. **Bandwidth Per Session**
   - Before: 14-16 MB
   - After: 6-8 MB
   - Savings: 50-60%

3. **Cache Hit Rate**
   - Goal: >80% on return visits
   - Monitor via Service Worker logging

4. **Fallback Format Usage**
   - VP9: 85-90% of sessions
   - H.265: 5-10% of sessions
   - H.264: 1-5% of sessions

## Future Improvements

1. **Adaptive Bitrate Streaming** (HLS/DASH)
   - Stream based on network speed
   - Requires server-side implementation

2. **AV1 Codec Support**
   - 30% smaller than VP9
   - Encoding very slow (not yet practical)
   - Monitor adoption for future use

3. **Hardware Acceleration**
   - Use GPU encoding (ffmpeg hevc_nvenc)
   - 5x faster than software encoding

## References

- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [VP9 Codec Guide](https://developers.google.com/media/vp9)
- [HEVC/H.265 Specification](https://en.wikipedia.org/wiki/High_Efficiency_Video_Coding)
- [Can I Use Video Format Support](https://caniuse.com/video)
- [Service Worker Caching Strategies](https://developers.google.com/web/tools/workbox/modules/workbox-strategies)
