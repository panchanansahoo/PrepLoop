const PARSERS = {
  python(text) {
    const result = { lines: [], type: null, message: text };
    const tracebackMatch = text.match(/Traceback \(most recent call last\):/);
    if (!tracebackMatch) {
      const syntaxMatch = text.match(/File ".*?", line (\d+).*?\n(.*?)\n(\w+Error|SyntaxError):\s*(.*)/s);
      if (syntaxMatch) {
        result.lines.push({ line: parseInt(syntaxMatch[1]), column: 1, message: syntaxMatch[4].trim(), type: syntaxMatch[3] });
        result.type = 'compile-error';
        result.message = syntaxMatch[4].trim();
      }
      return result;
    }
    const lineMatches = [...text.matchAll(/File ".*?", line (\d+).*?\n(.*?)$/gm)];
    const errorMatch = text.match(/(\w+Error|SyntaxError):\s*(.*)/);
    for (const m of lineMatches) {
      result.lines.push({ line: parseInt(m[1]), column: 1, message: m[2]?.trim() || '', type: 'trace' });
    }
    if (errorMatch) {
      result.type = 'runtime-error';
      result.message = errorMatch[2]?.trim() || errorMatch[1];
    }
    return result;
  },

  javascript(text) {
    const result = { lines: [], type: null, message: text };
    const lineMatches = [...text.matchAll(/at\s+(?:\S+\s+)?\(?(?:.*?):(\d+):(\d+)\)?/g)];
    for (const m of lineMatches) {
      result.lines.push({ line: parseInt(m[1]), column: parseInt(m[2]) || 1, message: '', type: 'trace' });
    }
    const errorMatch = text.match(/(\w+Error|SyntaxError):\s*(.*)/);
    if (errorMatch) {
      result.type = 'runtime-error';
      result.message = errorMatch[2]?.trim() || errorMatch[1];
    }
    return result;
  },

  cpp(text) {
    const result = { lines: [], type: null, message: text };
    const errorMatches = [...text.matchAll(/(?:solution|c\d+)?\.(?:cpp|c):(\d+):(\d+)?:\s*(error|warning):\s*(.*)/gi)];
    for (const m of errorMatches) {
      result.lines.push({
        line: parseInt(m[1]),
        column: m[2] ? parseInt(m[2]) : 1,
        message: m[4]?.trim() || '',
        type: m[3]?.toLowerCase() === 'warning' ? 'warning' : 'error',
      });
      result.type = 'compile-error';
    }
    return result;
  },

  java(text) {
    const result = { lines: [], type: null, message: text };
    const errorMatches = [...text.matchAll(/(\w+\.java):(\d+):\s*(error|warning):\s*(.*)/gi)];
    for (const m of errorMatches) {
      result.lines.push({ line: parseInt(m[2]), column: 1, message: m[4]?.trim() || '', type: 'error' });
      result.type = 'compile-error';
    }
    return result;
  },

  go(text) {
    const result = { lines: [], type: null, message: text };
    const errorMatches = [...text.matchAll(/(?:\.\/)?(?:solution\.go|main\.go):(\d+):(\d+)?:\s*(.*)/gi)];
    for (const m of errorMatches) {
      result.lines.push({
        line: parseInt(m[1]),
        column: m[2] ? parseInt(m[2]) : 1,
        message: m[3]?.trim() || '',
        type: 'error',
      });
      result.type = 'compile-error';
    }
    return result;
  },
};

export function parseExecutionError(raw, language) {
  const normalized = (language || 'python').toLowerCase();
  const parser = PARSERS[normalized] || PARSERS.python;
  try {
    return parser(String(raw || ''));
  } catch {
    return { lines: [], type: 'unknown', message: String(raw || '') };
  }
}

export function buildErrorMarkers(parsed, _language) {
  const markers = [];
  for (const line of parsed.lines) {
    if (line.type === 'error' || line.type === 'trace') {
      markers.push({
        severity: line.type === 'warning' ? 4 : 8,
        startLineNumber: line.line,
        endLineNumber: line.line,
        startColumn: line.column || 1,
        endColumn: 1000,
        message: line.message || parsed.message,
      });
    }
  }
  return markers;
}

export function classifyErrorType(raw, _language) {
  const text = String(raw || '').toLowerCase();
  if (text.includes('time limit') || text.includes('tle') || text.includes('timeout')) return 'tle';
  if (text.includes('memory limit') || text.includes('mle') || text.includes('out of memory')) return 'mle';
  if (text.includes('traceback') || text.includes('runtimeerror') || text.includes('exception')) return 'runtime';
  if (text.includes('syntaxerror') || text.includes('compile') || text.includes('referenceerror') || text.includes('typeerror')) return 'compile';
  if (text.includes('wrong answer') || text.includes('assertion')) return 'wrong-answer';
  if (text.includes('network') || text.includes('fetch') || text.includes('connection')) return 'network';
  return 'internal';
}
