# CSS Bloat Audit — PrepLoop Frontend

**Audit Date:** May 29, 2026

## Summary
The frontend has **636KB+ of CSS** across the top 10 files. Significant portions are unused.

## Audit Results

| File | Size | Total Classes | Unused* | Waste % |
|------|------|--------------|---------|---------|
| AIInterviewPage.css | 115.6KB | 448 | 369 | 82% |
| Home.css | 102.2KB | 294 | 252 | 86% |
| App.css | 71.6KB | 260 | 255** | 98%** |
| LearningPath.css | 56.2KB | — | — | TBD |
| AlgorithmPlayground.css | 55KB | — | — | TBD |
| SystemDesignSimulator.css | 53KB | — | — | TBD |
| CompanyInterview.css | 50.9KB | 190 | 112 | 59% |
| CodingPlayground.css | 49.5KB | 120 | 21 | 18% |
| JobUpdates.css | 43.1KB | — | — | TBD |
| Profile.css | 38.6KB | — | — | TBD |

*\*Unused = not referenced in the matching JSX file*
*\*\*App.css classes are used across many files — 98% is a false positive. Real usage requires project-wide scan.*

## Methodology
Class names were extracted via regex from CSS files and cross-referenced against the matching JSX file content. This catches direct class usage but may miss:
- Classes applied via string interpolation
- Classes used in child components
- Pseudo-classes/pseudo-elements
- CSS animation names
- Media query variants

## Recommendations

### Quick Wins
1. **AIInterviewPage.css** — Appears to have massive dead code from prior refactors. Safe to audit and purge section by section.
2. **Home.css** — Many classes from older layout approaches may be dead.
3. **CompanyInterview.css** — 59% unused, moderate cleanup opportunity.

### Long-term
1. Consider CSS Modules or CSS-in-JS to scope styles per component
2. Add PurgeCSS to the Vite build pipeline for production bundles
3. Establish naming conventions (BEM) to make auditing easier

### ⚠️ Warning
Do NOT blindly delete "unused" classes without testing. Some classes may be:
- Dynamically generated (`className={\`prefix-\${variant}\`}`)
- Used by child components imported into the page
- Referenced in Markdown rendering or dangerouslySetInnerHTML
