/**
 * Error Diagnostics for Code Execution
 * Provides detailed error information including stack traces and error categorization
 */

/**
 * Parse and categorize execution errors
 * @param {string} stderr - Standard error output
 * @param {string} stdout - Standard output
 * @param {string} language - Programming language
 * @returns {Object} { category, message, details, stackTrace }
 */
export function parseExecutionError(stderr = '', stdout = '', language = 'javascript') {
  if (!stderr && !stdout) {
    return {
      category: 'unknown',
      message: 'Execution completed but no output captured',
      details: 'The program ran without producing output or errors',
      stackTrace: [],
    };
  }

  const fullOutput = stderr || stdout;

  // JavaScript/Node.js error patterns
  if (language === 'javascript' || language === 'typescript') {
    if (fullOutput.includes('ReferenceError')) {
      const match = fullOutput.match(/ReferenceError:\s*(.+?)(?:\n|$)/);
      return {
        category: 'reference_error',
        message: match ? match[1] : 'Undefined variable or function',
        details: extractStackTrace(fullOutput),
        stackTrace: extractJavaScriptStackLines(fullOutput),
      };
    }

    if (fullOutput.includes('TypeError')) {
      const match = fullOutput.match(/TypeError:\s*(.+?)(?:\n|$)/);
      return {
        category: 'type_error',
        message: match ? match[1] : 'Type mismatch or invalid operation',
        details: extractStackTrace(fullOutput),
        stackTrace: extractJavaScriptStackLines(fullOutput),
      };
    }

    if (fullOutput.includes('SyntaxError')) {
      const match = fullOutput.match(/SyntaxError:\s*(.+?)(?:\n|$)/);
      return {
        category: 'syntax_error',
        message: match ? match[1] : 'Code has syntax errors',
        details: extractStackTrace(fullOutput),
        stackTrace: extractJavaScriptStackLines(fullOutput),
      };
    }

    if (fullOutput.includes('Error')) {
      const match = fullOutput.match(/Error:\s*(.+?)(?:\n|$)/);
      return {
        category: 'runtime_error',
        message: match ? match[1] : 'Runtime error occurred',
        details: extractStackTrace(fullOutput),
        stackTrace: extractJavaScriptStackLines(fullOutput),
      };
    }
  }

  // Python error patterns
  if (language === 'python') {
    if (fullOutput.includes('NameError')) {
      const match = fullOutput.match(/NameError:\s*(.+?)(?:\n|$)/);
      return {
        category: 'name_error',
        message: match ? match[1] : 'Undefined variable name',
        details: extractStackTrace(fullOutput),
        stackTrace: extractPythonStackLines(fullOutput),
      };
    }

    if (fullOutput.includes('TypeError')) {
      const match = fullOutput.match(/TypeError:\s*(.+?)(?:\n|$)/);
      return {
        category: 'type_error',
        message: match ? match[1] : 'Type mismatch',
        details: extractStackTrace(fullOutput),
        stackTrace: extractPythonStackLines(fullOutput),
      };
    }

    if (fullOutput.includes('ValueError')) {
      const match = fullOutput.match(/ValueError:\s*(.+?)(?:\n|$)/);
      return {
        category: 'value_error',
        message: match ? match[1] : 'Invalid value',
        details: extractStackTrace(fullOutput),
        stackTrace: extractPythonStackLines(fullOutput),
      };
    }

    if (fullOutput.includes('SyntaxError')) {
      const match = fullOutput.match(/SyntaxError:\s*(.+?)(?:\n|$)/);
      return {
        category: 'syntax_error',
        message: match ? match[1] : 'Python syntax error',
        details: extractStackTrace(fullOutput),
        stackTrace: extractPythonStackLines(fullOutput),
      };
    }

    if (fullOutput.includes('IndexError')) {
      return {
        category: 'index_error',
        message: 'List/array index out of range',
        details: extractStackTrace(fullOutput),
        stackTrace: extractPythonStackLines(fullOutput),
      };
    }

    if (fullOutput.includes('KeyError')) {
      return {
        category: 'key_error',
        message: 'Dictionary key not found',
        details: extractStackTrace(fullOutput),
        stackTrace: extractPythonStackLines(fullOutput),
      };
    }

    if (fullOutput.includes('Traceback')) {
      return {
        category: 'runtime_error',
        message: 'Python runtime error (see stack trace)',
        details: extractStackTrace(fullOutput),
        stackTrace: extractPythonStackLines(fullOutput),
      };
    }
  }

  // C/C++ error patterns
  if (language === 'c' || language === 'cpp') {
    if (fullOutput.includes('compilation terminated') || fullOutput.includes('error:')) {
      const match = fullOutput.match(/error:\s*(.+?)(?:\n|$)/);
      return {
        category: 'compilation_error',
        message: match ? match[1] : 'Compilation failed',
        details: extractStackTrace(fullOutput),
        stackTrace: extractCppStackLines(fullOutput),
      };
    }

    if (fullOutput.includes('Segmentation fault')) {
      return {
        category: 'segmentation_fault',
        message: 'Segmentation fault (memory access violation)',
        details: 'Your code tried to access invalid memory',
        stackTrace: [],
      };
    }

    if (fullOutput.includes('undefined reference')) {
      const match = fullOutput.match(/undefined reference to `(.+?)'/);
      return {
        category: 'linker_error',
        message: `Undefined reference: ${match ? match[1] : 'function or variable'}`,
        details: 'Function or variable not defined or not linked',
        stackTrace: [],
      };
    }
  }

  // Java error patterns
  if (language === 'java') {
    if (fullOutput.includes('CompileError') || fullOutput.includes('error:')) {
      const match = fullOutput.match(/error:\s*(.+?)(?:\n|$)/);
      return {
        category: 'compilation_error',
        message: match ? match[1] : 'Java compilation failed',
        details: extractStackTrace(fullOutput),
        stackTrace: extractJavaStackLines(fullOutput),
      };
    }

    if (fullOutput.includes('NullPointerException')) {
      return {
        category: 'null_pointer_exception',
        message: 'Null pointer exception',
        details: 'Tried to call method on null object',
        stackTrace: extractJavaStackLines(fullOutput),
      };
    }

    if (fullOutput.includes('Exception')) {
      const match = fullOutput.match(/(\w+Exception):\s*(.+?)(?:\n|$)/);
      return {
        category: match ? match[1].toLowerCase() : 'runtime_error',
        message: match ? match[2] : 'Java runtime error',
        details: extractStackTrace(fullOutput),
        stackTrace: extractJavaStackLines(fullOutput),
      };
    }
  }

  // Generic error handling
  return {
    category: 'generic_error',
    message: fullOutput.split('\n')[0] || 'Unknown error',
    details: fullOutput.substring(0, 500),
    stackTrace: [],
  };
}

/**
 * Extract stack trace from error output
 * @param {string} output - Full error output
 * @returns {string} Stack trace portion (first 1000 chars)
 */
function extractStackTrace(output) {
  const traceStart = output.indexOf('at ') || output.indexOf('File');
  if (traceStart === -1) {
    return output.substring(0, 1000);
  }
  return output.substring(traceStart, traceStart + 1000);
}

/**
 * Extract JavaScript/Node.js stack lines
 * @param {string} output - Error output
 * @returns {Array} Array of stack frames
 */
function extractJavaScriptStackLines(output) {
  const lines = output.split('\n');
  const stackLines = [];

  for (const line of lines) {
    if (line.includes('at ') && (line.includes('(') || line.includes(':'))){
      stackLines.push(line.trim());
    }
  }

  return stackLines.slice(0, 10); // Limit to first 10 frames
}

/**
 * Extract Python stack lines
 * @param {string} output - Error output
 * @returns {Array} Array of stack frames
 */
function extractPythonStackLines(output) {
  const lines = output.split('\n');
  const stackLines = [];
  let inTraceback = false;

  for (const line of lines) {
    if (line.includes('Traceback')) {
      inTraceback = true;
      continue;
    }

    if (inTraceback && (line.includes('File') || line.includes('=>'))) {
      stackLines.push(line.trim());
    }

    // Stop when we hit the actual error message
    if (line && !line.startsWith(' ') && inTraceback && stackLines.length > 0) {
      break;
    }
  }

  return stackLines;
}

/**
 * Extract C/C++ compiler error lines
 * @param {string} output - Compiler output
 * @returns {Array} Array of error locations
 */
function extractCppStackLines(output) {
  const lines = output.split('\n');
  const errorLines = [];

  for (const line of lines) {
    if (line.includes('error:') || line.includes('warning:')) {
      errorLines.push(line.trim());
    }
  }

  return errorLines.slice(0, 10);
}

/**
 * Extract Java compiler/runtime stack lines
 * @param {string} output - Java output
 * @returns {Array} Array of stack frames
 */
function extractJavaStackLines(output) {
  const lines = output.split('\n');
  const stackLines = [];

  for (const line of lines) {
    if (line.includes('\tat ') || line.includes('Exception') || line.includes('error:')) {
      stackLines.push(line.trim());
    }
  }

  return stackLines.slice(0, 10);
}

/**
 * Format error diagnostics for display
 * @param {Object} diagnostics - From parseExecutionError()
 * @returns {string} Formatted error message
 */
export function formatErrorDiagnostics(diagnostics) {
  let output = '';

  if (diagnostics.category) {
    output += `❌ ${diagnostics.category.replace(/_/g, ' ').toUpperCase()}\n`;
  }

  if (diagnostics.message) {
    output += `Message: ${diagnostics.message}\n`;
  }

  if (diagnostics.details) {
    output += `Details: ${diagnostics.details}\n`;
  }

  if (diagnostics.stackTrace && diagnostics.stackTrace.length > 0) {
    output += `\nStack Trace:\n`;
    for (const frame of diagnostics.stackTrace) {
      output += `  ${frame}\n`;
    }
  }

  return output;
}
