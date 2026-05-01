# Bundle Size Management Guide

This document outlines the bundle size monitoring strategy for the Preploop frontend.

## Overview

The frontend build process includes automated bundle size checking to catch regressions and guide optimization efforts. The check runs automatically after every build and provides actionable recommendations.

## How It Works

### Automatic Check During Build

```bash
npm run build
# Runs: vite build && node scripts/checkBundleSize.js
```

The build will:
1. ✅ **Succeed with warnings** if chunks exceed soft limits
2. ❌ **Fail** if chunks exceed hard limits
3. ✅ **Succeed silently** if within all limits

### Manual Bundle Analysis

```bash
npm run build:check-only
# Runs: node scripts/checkBundleSize.js (without building)
```

## Size Limits

### Hard Limits (Build Fails)

| Metric | Limit | Reason |
|--------|-------|--------|
| Individual chunk (uncompressed) | 1,200 KB | Large chunks impact initial load |
| Individual chunk (gzipped) | 400 KB | Network transfer size for users |
| Total bundle (uncompressed) | 7,000 KB | App complexity baseline |
| Total bundle (gzipped) | 2,000 KB | Actual download size for typical users |

### Soft Limits (Warnings Only)

| Metric | Limit |
|--------|-------|
| Individual chunk (uncompressed) | 500 KB |
| Individual chunk (gzipped) | 150 KB |

## Current Status

**Total Bundle**: ~1,929 KB gzipped (6,832 KB raw)

### Chunks Exceeding Soft Limits

| Chunk | Size (gzip) | Reason |
|-------|-----------|--------|
| vendor-richtext | 348 KB | BlockNote, TipTap, ProseMirror for rich text editing |
| vendor-3d | 267 KB | Three.js, React Three Fiber for 3D visualization |
| vendor-prettier | 170 KB | Code formatting library (consider lazy-loading) |

## Guidelines

### When Adding Dependencies

**Before adding a new package, consider**:

1. **Bundle impact**: Use `npm ls` to check dependency tree
2. **Alternatives**: Look for lighter alternatives (e.g., `ms` instead of `date-fns`)
3. **Lazy loading**: Can the feature be loaded on-demand?

### Optimization Strategies

#### 1. Code Splitting (Recommended)
Keep chunks under 500 KB uncompressed by splitting features:

```jsx
// pages/RichTextEditor.jsx (lazy-load heavy editors)
import { lazy, Suspense } from 'react';
const Editor = lazy(() => import('../components/RichEditor'));

export function EditorPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <Editor />
    </Suspense>
  );
}
```

#### 2. Dynamic Imports
Load heavy libraries only when needed:

```js
// Avoid: import prettier from 'prettier'
// Instead:
async function formatCode(code) {
  const { format } = await import('prettier');
  return format(code, { parser: 'babel' });
}
```

#### 3. Tree-Shaking Verification
Ensure unused code is eliminated:

```bash
npm run build  # Check output size
# Look at vendor chunks in dist/assets/
# Verify unused modules aren't included
```

#### 4. Dependency Optimization

**Remove unused packages**:
```bash
npm prune --production
npm dedupe
```

**Replace heavy libraries**:
- `date-fns` → `date-fns/esm` (with tree-shaking)
- `lodash` → `lodash-es` (ESM version)
- `moment` → `date-fns` or `dayjs` (smaller alternatives)

## CI/CD Integration

The bundle size check runs automatically in CI/CD:

```bash
npm run build  # Fails if hard limits exceeded
```

### PR Requirements

- ❌ Cannot merge if bundle size exceeds hard limits
- ⚠️ Review recommended if exceeding soft limits
- ✅ Approved if within soft limits

## FAQ

### Why is vendor-richtext so large?

BlockNote and TipTap include:
- ProseMirror core (~150 KB)
- Rich text extensions (~100 KB)
- CSS and bundled dependencies (~100 KB)

**Mitigation**: Lazy-load the rich text editor on the page that needs it.

### Can we reduce vendor-3d size?

Three.js is inherently large (~500 KB raw). Current size (267 KB gzip) is reasonable.

**Alternatives**:
- Use Canvas-based 3D for simpler visualizations
- Load Three.js only on pages that need it

### What about the main bundle?

The main `index-*.js` bundle (~458 KB raw, ~84 KB gzip) includes:
- React + React Router
- Common utilities and context
- Global app initialization

**Optimization**: Ensure lazy-loaded routes don't include route-specific logic in main bundle.

## Monitoring

### Check bundle size trends

```bash
# After each optimization
npm run build:check-only
# Compare "TOTAL" gzipped size over time
```

### Identify problematic chunks

```bash
npm run build:check-only
# Chunks marked with ✗ or ⚠ need attention
```

## References

- [Vite Build Optimization](https://vitejs.dev/guide/build.html)
- [Web Vitals: Core Web Vitals](https://web.dev/vitals/)
- [Code Splitting Strategy](https://web.dev/code-splitting/)
- [Tree-Shaking in Rollup](https://rollupjs.org/guide/en/#tree-shaking)

## Running the Check

### Local development

```bash
npm run build:check-only
# Output: Detailed bundle analysis with recommendations
```

### In CI/CD pipeline

```bash
npm run build
# Build succeeds with warnings, or fails if hard limits exceeded
```

---

**Last Updated**: 2026-05-01  
**Maintainer**: Frontend Team
