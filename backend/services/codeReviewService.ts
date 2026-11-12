import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('code-review-service');

export interface SecurityFinding {
  line: number;
  category: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
}

export interface CodeImprovement {
  line: number;
  severity: 'high' | 'medium' | 'low';
  issue: string;
  suggestion: string;
}

export interface ProjectCodeReviewResult {
  interviewReadinessScore: number;
  summary: string;
  codeQuality: {
    naming: number;
    structure: number;
    complexity: number;
  };
  securityFindings: SecurityFinding[];
  improvements: CodeImprovement[];
  source: 'gemini' | 'static-analyzer';
  analyzedTarget: string;
}

export function parseGithubRepoUrl(rawUrl: string): { owner: string; repo: string } | null {
  try {
    const parsed = new URL(String(rawUrl || '').trim());
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'github.com') {
      return null;
    }
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    const owner = parts[0].replace(/[^a-zA-Z0-9._-]/g, '');
    const repo = parts[1].replace(/\.git$/i, '').replace(/[^a-zA-Z0-9._-]/g, '');
    if (!owner || !repo) return null;
    return { owner, repo };
  } catch {
    return null;
  }
}

export function runStaticCodeAnalysis(code: string): Omit<ProjectCodeReviewResult, 'source' | 'analyzedTarget'> {
  const lines = String(code || '').split(/\r?\n/);
  const securityFindings: SecurityFinding[] = [];
  const improvements: CodeImprovement[] = [];

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    const trimmed = lineText.trim();

    if (/SELECT\s+.*(\$\{|\+\s*[a-zA-Z_])/i.test(trimmed) || /query\s*\(\s*`[^`]*\$\{/.test(trimmed)) {
      securityFindings.push({
        line: lineNum,
        category: 'SQL Injection',
        severity: 'high',
        message: 'Possible string-interpolated SQL query detected. Use parameterized queries.',
      });
    }

    if (/dangerouslySetInnerHTML|\.innerHTML\s*=|document\.write\s*\(/.test(trimmed)) {
      securityFindings.push({
        line: lineNum,
        category: 'XSS',
        severity: 'high',
        message: 'Potential Cross-Site Scripting (XSS) sink detected. Sanitize HTML with DOMPurify.',
      });
    }

    if (/(api_key|apikey|secret|password|token)\s*[:=]\s*['"][A-Za-z0-9_\-]{8,}['"]/i.test(trimmed)) {
      securityFindings.push({
        line: lineNum,
        category: 'Hardcoded Secret',
        severity: 'high',
        message: 'Hardcoded credential/secret literal found. Move to environment variables.',
      });
    }

    if (/\beval\s*\(|new\s+Function\s*\(/.test(trimmed)) {
      securityFindings.push({
        line: lineNum,
        category: 'Code Injection',
        severity: 'high',
        message: 'Dynamic code execution via eval/Function is unsafe.',
      });
    }

    if (/\bvar\s+/.test(trimmed)) {
      improvements.push({
        line: lineNum,
        severity: 'low',
        issue: 'Legacy `var` declaration',
        suggestion: 'Prefer `const` or `let` for predictable block scoping.',
      });
    }

    if (/console\.(log|debug)\(/.test(trimmed)) {
      improvements.push({
        line: lineNum,
        severity: 'low',
        issue: 'Debug console statement in source',
        suggestion: 'Replace raw console calls with a structured logger or remove before production.',
      });
    }

    if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(trimmed)) {
      improvements.push({
        line: lineNum,
        severity: 'medium',
        issue: 'Empty catch block swallows errors silently',
        suggestion: 'Log the error context or rethrow a domain error.',
      });
    }
  });

  if (lines.length > 80 && !/function\s+|=>|class\s+/.test(code)) {
    improvements.push({
      line: 1,
      severity: 'medium',
      issue: 'Monolithic script without modular functions',
      suggestion: 'Break logic into small, single-responsibility functions for readability and testability.',
    });
  }

  const securityPenalty = securityFindings.length * 14;
  const qualityPenalty = Math.min(25, improvements.length * 4);
  const baseScore = lines.length >= 5 ? 88 : 74;
  const interviewReadinessScore = Math.max(20, Math.min(98, baseScore - securityPenalty - qualityPenalty));

  const naming = Math.max(40, 90 - improvements.filter((i) => i.issue.includes('var')).length * 6);
  const structure = Math.max(40, 88 - (lines.length > 120 ? 10 : 0) - improvements.length * 3);
  const complexity = Math.max(40, 86 - Math.min(20, Math.floor(lines.length / 20) * 3));

  const summary =
    securityFindings.length > 0
      ? `Found ${securityFindings.length} security finding(s) and ${improvements.length} code quality improvement(s). Fixing the security issues first will make this project interview-ready.`
      : improvements.length > 0
        ? `Clean security posture with ${improvements.length} maintainability improvement(s) identified.`
        : 'Strong, clean code structure with no obvious security vulnerabilities detected.';

  return {
    interviewReadinessScore,
    summary,
    codeQuality: { naming, structure, complexity },
    securityFindings,
    improvements,
  };
}

export async function reviewRealProject({
  repoUrl,
  code,
  language = 'javascript',
}: {
  repoUrl?: string;
  code?: string;
  language?: string;
}): Promise<ProjectCodeReviewResult> {
  let codeToAnalyze = String(code || '').trim();
  let analyzedTarget = 'Pasted Snippet';

  if (repoUrl) {
    const parsed = parseGithubRepoUrl(repoUrl);
    if (!parsed) {
      throw new Error('Invalid GitHub repository URL. Expected https://github.com/owner/repo');
    }
    analyzedTarget = `${parsed.owner}/${parsed.repo}`;

    if (!codeToAnalyze) {
      try {
        const res = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/contents`, {
          signal: AbortSignal.timeout(6000),
          headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'PrepLoop-CodeReview/1.0' },
        });
        if (res.ok) {
          const items = (await res.json()) as Array<{ name: string; type: string; download_url?: string }>;
          const candidate = items.find(
            (i) => i.type === 'file' && /\.(ts|tsx|js|jsx|py|go|java)$/i.test(i.name) && i.download_url
          );
          if (
            candidate?.download_url &&
            (candidate.download_url.startsWith('https://raw.githubusercontent.com/') ||
              candidate.download_url.startsWith('https://github.com/'))
          ) {
            const fileRes = await fetch(candidate.download_url, { signal: AbortSignal.timeout(6000) });
            if (fileRes.ok) {
              codeToAnalyze = (await fileRes.text()).slice(0, 12000);
              analyzedTarget = `${parsed.owner}/${parsed.repo}/${candidate.name}`;
            }
          }
        }
      } catch (err: any) {
        logger.warn('GitHub repo fetch failed; falling back to metadata review', {
          repo: analyzedTarget,
          error: err.message,
        });
      }
      if (!codeToAnalyze) {
        codeToAnalyze = `// Repository: ${analyzedTarget}\n// Could not fetch source file contents (private or rate-limited).`;
      }
    }
  }

  if (!codeToAnalyze) {
    throw new Error('Either repoUrl or code is required');
  }

  const staticResult = runStaticCodeAnalysis(codeToAnalyze);

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (apiKey && process.env.NODE_ENV !== 'test') {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Review this ${language} code for an engineering interview portfolio. Return JSON with fields: interviewReadinessScore (0-100), summary, codeQuality ({naming, structure, complexity} 0-100), securityFindings ([{line, category, severity, message}]), improvements ([{line, severity, issue, suggestion}]).\n\nCode:\n${codeToAnalyze.slice(0, 8000)}`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
      const parsed = JSON.parse(response.text || '{}');
      if (typeof parsed.interviewReadinessScore === 'number' && parsed.summary) {
        return {
          interviewReadinessScore: Math.max(0, Math.min(100, parsed.interviewReadinessScore)),
          summary: String(parsed.summary),
          codeQuality: parsed.codeQuality || staticResult.codeQuality,
          securityFindings: Array.isArray(parsed.securityFindings)
            ? parsed.securityFindings
            : staticResult.securityFindings,
          improvements: Array.isArray(parsed.improvements)
            ? parsed.improvements
            : staticResult.improvements,
          source: 'gemini',
          analyzedTarget,
        };
      }
    } catch (aiErr: any) {
      logger.warn('Gemini project code review failed, using static analyzer', { error: aiErr.message });
    }
  }

  return {
    ...staticResult,
    source: 'static-analyzer',
    analyzedTarget,
  };
}
