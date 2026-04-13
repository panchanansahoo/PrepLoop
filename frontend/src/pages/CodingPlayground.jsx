import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import {
    ArrowLeft, Play, Terminal, Trash2, Copy, Check,
    Download, Upload, Clock, ChevronDown, Code2,
    Braces, Hash, FileCode, Layers, Sparkles, X,
    RotateCcw, Maximize2, Minimize2, Palette,
    Share2, Keyboard, ZoomIn, ZoomOut, History,
    Type, Link2, Volume2,
    PanelRightOpen, Settings, Info,
    Bot, Send, MessageSquare, Eraser,
    ClipboardCheck, RefreshCw, FileCode2, AlertTriangle
} from 'lucide-react';
import { LANGUAGES, ALGORITHM_TEMPLATES } from '../data/dsaTemplates';
import { EDITOR_THEMES, registerAllThemes, getSavedTheme, saveTheme } from '../data/editorThemes';
import { buildAuthHeaders } from '../utils/authHeaders';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => buildAuthHeaders();

// Enhanced error parser with line number extraction
const parseErrorWithLineInfo = (errorText = '') => {
    const text = String(errorText || '').trim();
    // Try to extract line:col info from common compiler formats
    const lineMatch = text.match(/:?(\d+):\s*(\d+):?/); // "file.py:5:10" or ":5:10"
    const lineNum = lineMatch ? parseInt(lineMatch[1]) : null;
    const colNum = lineMatch ? parseInt(lineMatch[2]) : null;
    return { text, lineNum, colNum };
};

const getPlaygroundFriendlyError = (rawError = '', status = 0) => {
    const message = String(rawError || '').trim();
    const lower = message.toLowerCase();

    if (lower.includes('code must be a string') || lower.includes('code is required')) {
        return 'Write some code before running.';
    }

    if (lower.includes('language is required')) {
        return 'Select a language before running.';
    }

    if (lower.includes('is not supported')) {
        return 'This language is not supported by the executor yet.';
    }

    if (status >= 500) {
        return 'Server error while executing code. Please try again.';
    }

    return message || 'Execution failed. Please try again.';
};

const findBracketErrors = (source = '') => {
    const openToClose = { '(': ')', '[': ']', '{': '}' };
    const closeToOpen = { ')': '(', ']': '[', '}': '{' };
    const stack = [];
    const errors = [];
    const lines = source.split('\n');

    lines.forEach((lineText, lineIndex) => {
        for (let col = 0; col < lineText.length; col++) {
            const ch = lineText[col];
            if (openToClose[ch]) {
                stack.push({ ch, line: lineIndex + 1, col: col + 1 });
            } else if (closeToOpen[ch]) {
                const top = stack[stack.length - 1];
                if (!top || top.ch !== closeToOpen[ch]) {
                    errors.push({
                        line: lineIndex + 1,
                        col: col + 1,
                        message: `Unexpected '${ch}'`,
                        severity: 'error',
                    });
                    return;
                }
                stack.pop();
            }
            }
    });

    stack.forEach((item) => {
        errors.push({
            line: item.line,
            col: item.col,
            message: `Unclosed '${item.ch}'`,
            severity: 'error',
        });
    });

    return errors;
};

const findJavaScriptSyntaxErrors = (source = '') => {
    if (!source.trim()) return [];
    try {
        // eslint-disable-next-line no-new-func
        new Function(source);
        return [];
    } catch (err) {
        const raw = String(err?.stack || err?.message || 'Syntax error');
        const lineMatch = raw.match(/<anonymous>:(\d+):(\d+)/);
        const line = lineMatch ? Math.max(1, Number(lineMatch[1]) - 1) : 1;
        const col = lineMatch ? Math.max(1, Number(lineMatch[2])) : 1;
        return [{
            line,
            col,
            message: String(err?.message || 'Syntax error'),
            severity: 'error',
        }];
    }
};

const getRealtimeErrors = (source = '', language = '') => {
    const normalized = String(language || '').toLowerCase();
    const errors = findBracketErrors(source);
    if (normalized === 'javascript') {
        errors.push(...findJavaScriptSyntaxErrors(source));
    }
    if (normalized === 'python') {
        const lines = source.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const current = lines[i];
            const trimmed = current.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;

            if (/^\s*\t+\s+|^\s+\t+/.test(current)) {
                errors.push({ line: i + 1, col: 1, message: 'Mixed tabs and spaces indentation', severity: 'warning' });
            }

            if (trimmed.endsWith(':')) {
                let next = i + 1;
                while (next < lines.length && (!lines[next].trim() || lines[next].trim().startsWith('#'))) next++;
                if (next < lines.length) {
                    const currentIndent = current.match(/^\s*/)?.[0].length || 0;
                    const nextIndent = lines[next].match(/^\s*/)?.[0].length || 0;
                    if (nextIndent <= currentIndent) {
                        errors.push({
                            line: next + 1,
                            col: 1,
                            message: 'Expected indented block after ":"',
                            severity: 'error',
                        });
                    }
                }
            }
        }
    }
    return errors;
};

const mergeAndDedupeErrors = (...groups) => {
    const seen = new Set();
    const merged = [];
    for (const group of groups) {
        for (const error of group || []) {
            const line = error.line || 1;
            const col = error.col || 1;
            const message = String(error.message || 'Error').trim();
            // Remove only exact duplicates so unresolved errors stay visible.
            const key = `${line}:${col}:${error.severity || 'error'}:${message}`;
            if (seen.has(key)) continue;
            seen.add(key);
            merged.push({
                line,
                col,
                message,
                severity: error.severity || 'error',
            });
        }
    }
    return merged;
};

// ─── Default starter code per language ───
const DEFAULT_CODE = {
    python: `# Write your code here

def main():
    print("Hello, World!")


if __name__ == "__main__":
    main()
`,
    javascript: `// Write your code here

function main() {
  console.log("Hello, World!");
}

main();
`,
    c: `// Write your code here

#include <stdio.h>

int main(void) {
    printf("Hello, World!\\n");
    return 0;
}
`,
    cpp: `// Write your code here

#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}
`,
    java: `// Write your code here

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`,
    go: `// Write your code here

package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}
`,
};

const isLegacyPythonStarter = (value = '') => {
    return value.includes('Hello from PrepLoop Playground!') && value.includes('def hello():');
};

let prettierRuntimePromise = null;

const loadPrettierRuntime = async () => {
    if (prettierRuntimePromise) return prettierRuntimePromise;

    prettierRuntimePromise = Promise.all([
        import('prettier/standalone'),
        import('prettier/plugins/babel'),
        import('prettier/plugins/estree'),
    ]).then(([prettier, babelPlugin, estreePlugin]) => ({
        prettier: prettier.default || prettier,
        plugins: [
            babelPlugin.default || babelPlugin,
            estreePlugin.default || estreePlugin,
        ],
    }));

    return prettierRuntimePromise;
};

// ─── Code formatter utility ───
const formatCode = async (code, language) => {
    try {
        const normalized = String(language || '').toLowerCase();
        const lines = code.split('\n');

        if (normalized === 'javascript') {
            const runtime = await loadPrettierRuntime();
            return runtime.prettier.format(code, {
                parser: 'babel',
                plugins: runtime.plugins,
                semi: true,
                singleQuote: true,
                tabWidth: 2,
                printWidth: 100,
                trailingComma: 'es5',
            });
        }

        if (normalized === 'python') {
            const formatted = [];
            let indent = 0;
            for (const rawLine of lines) {
                const trimmed = rawLine.trim();
                if (!trimmed) {
                    formatted.push('');
                    continue;
                }
                if (/^(return|break|continue|pass|raise)\b/.test(trimmed) && indent > 0) {
                    formatted.push(`${'    '.repeat(indent)}${trimmed}`);
                } else {
                    formatted.push(`${'    '.repeat(Math.max(0, indent))}${trimmed}`);
                }
                if (trimmed.endsWith(':') && !trimmed.startsWith('#')) indent += 1;
            }
            return formatted.join('\n').replace(/[ \t]+$/gm, '');
        }

        const usesBraces = ['typescript', 'c', 'cpp', 'java'].includes(normalized);
        if (usesBraces) {
            let indent = 0;
            return lines.map((line) => {
                const trimmed = line.trim();
                if (!trimmed) return '';
                if (/^[}\])]/.test(trimmed)) indent = Math.max(0, indent - 1);
                const current = `${'    '.repeat(indent)}${trimmed.replace(/\s+$/g, '')}`;
                if (/[{[(]$/.test(trimmed) && !/^\s*\/\//.test(trimmed)) indent += 1;
                return current;
            }).join('\n');
        }

        return code.replace(/[ \t]+$/gm, '');
    } catch {
        return code;
    }
};

// ─── Quick snippet templates ───
const SNIPPETS = [
    {
        label: 'For Loop',
        icon: '🔁',
        code: {
            python: `for i in range(n):\n    pass`,
            javascript: `for (let i = 0; i < n; i++) {\n  \n}`,
            c: `for (int i = 0; i < n; i++) {\n    \n}`,
            cpp: `for (int i = 0; i < n; i++) {\n    \n}`,
            java: `for (int i = 0; i < n; i++) {\n    \n}`,
            go: `for i := 0; i < n; i++ {\n    \n}`,
        },
    },
    {
        label: 'HashMap',
        icon: '🗺️',
        code: {
            python: `from collections import defaultdict\nfreq = defaultdict(int)\nfor item in arr:\n    freq[item] += 1`,
            javascript: `const map = new Map();\nfor (const item of arr) {\n  map.set(item, (map.get(item) || 0) + 1);\n}`,
            c: `#include <stdio.h>\n\nint freq[1001] = {0};\nfor (int i = 0; i < n; i++) {\n    freq[arr[i]]++;\n}`,
            cpp: `unordered_map<int, int> freq;\nfor (int x : arr) {\n    freq[x]++;\n}`,
            java: `Map<Integer, Integer> freq = new HashMap<>();\nfor (int x : arr) {\n    freq.put(x, freq.getOrDefault(x, 0) + 1);\n}`,
            go: `freq := make(map[int]int)\nfor _, x := range arr {\n    freq[x]++\n}`,
        },
    },
    {
        label: 'Stack',
        icon: '📚',
        code: {
            python: `stack = []\nstack.append(item)  # push\ntop = stack.pop()   # pop\nif stack:           # not empty`,
            javascript: `const stack = [];\nstack.push(item);           // push\nconst top = stack.pop();    // pop\nif (stack.length > 0) {}    // not empty`,
            c: `#include <stdio.h>\n\nint stack[1000], top = -1;\nstack[++top] = item;   // push\nint v = stack[top--];  // pop\nif (top >= 0) {}`,
            cpp: `stack<int> st;\nst.push(item);     // push\nint top = st.top(); st.pop(); // pop\nif (!st.empty()) {} // not empty`,
            java: `Stack<Integer> stack = new Stack<>();\nstack.push(item);      // push\nint top = stack.pop(); // pop\nif (!stack.isEmpty()) {} // not empty`,
            go: `stack := []int{}\nstack = append(stack, item)       // push\ntop := stack[len(stack)-1]        // peek\nstack = stack[:len(stack)-1]      // pop`,
        },
    },
    {
        label: 'Queue',
        icon: '📬',
        code: {
            python: `from collections import deque\nqueue = deque()\nqueue.append(item)   # enqueue\nfront = queue.popleft()  # dequeue`,
            javascript: `const queue = [];\nqueue.push(item);           // enqueue\nconst front = queue.shift(); // dequeue`,
            c: `#include <stdio.h>\n\nint queue[1000], head = 0, tail = 0;\nqueue[tail++] = item;      // enqueue\nint front = queue[head++]; // dequeue`,
            cpp: `queue<int> q;\nq.push(item);      // enqueue\nint front = q.front(); q.pop(); // dequeue`,
            java: `Queue<Integer> queue = new LinkedList<>();\nqueue.offer(item);       // enqueue\nint front = queue.poll(); // dequeue`,
            go: `queue := []int{}\nqueue = append(queue, item) // enqueue\nfront := queue[0]           // peek\nqueue = queue[1:]           // dequeue`,
        },
    },
    {
        label: 'LinkedList',
        icon: '🔗',
        code: {
            python: `class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next`,
            javascript: `class ListNode {\n  constructor(val = 0, next = null) {\n    this.val = val;\n    this.next = next;\n  }\n}`,
            c: `typedef struct ListNode {\n    int val;\n    struct ListNode* next;\n} ListNode;`,
            cpp: `struct ListNode {\n    int val;\n    ListNode* next;\n    ListNode(int x) : val(x), next(nullptr) {}\n};`,
            java: `class ListNode {\n    int val;\n    ListNode next;\n    ListNode(int val) { this.val = val; }\n}`,
            go: `type ListNode struct {\n    Val  int\n    Next *ListNode\n}`,
        },
    },
    {
        label: 'TreeNode',
        icon: '🌳',
        code: {
            python: `class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right`,
            javascript: `class TreeNode {\n  constructor(val = 0, left = null, right = null) {\n    this.val = val;\n    this.left = left;\n    this.right = right;\n  }\n}`,
            c: `typedef struct TreeNode {\n    int val;\n    struct TreeNode* left;\n    struct TreeNode* right;\n} TreeNode;`,
            cpp: `struct TreeNode {\n    int val;\n    TreeNode* left;\n    TreeNode* right;\n    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n};`,
            java: `class TreeNode {\n    int val;\n    TreeNode left, right;\n    TreeNode(int val) { this.val = val; }\n}`,
            go: `type TreeNode struct {\n    Val   int\n    Left  *TreeNode\n    Right *TreeNode\n}`,
        },
    },
];

// ─── Timer formatter ───
function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ─── Simulated output generation ───
function simulateOutput(code, language) {
    const lines = [];
    const timestamp = new Date().toLocaleTimeString();
    lines.push({ type: 'info', text: `[${timestamp}] Running ${language}...` });

    // Extract print/console.log statements for simulated output
    const printPatterns = {
        python: /print\s*\(\s*(?:f?["'](.+?)["']|(.+?))\s*\)/g,
        javascript: /console\.log\s*\(\s*["'](.+?)["']\s*(?:,\s*(.+?))?\s*\)/g,
        c: /printf\s*\(\s*["'](.+?)["']/g,
        cpp: /cout\s*<<\s*["'](.+?)["']/g,
        java: /System\.out\.println\s*\(\s*["'](.+?)["']\s*\)/g,
        go: /fmt\.Println\s*\(\s*["'](.+?)["']\s*\)/g,
    };

    const pattern = printPatterns[language];
    if (pattern) {
        let match;
        while ((match = pattern.exec(code)) !== null) {
            lines.push({ type: 'output', text: match[1] || match[2] || match[0] });
        }
    }

    if (lines.length === 1) {
        lines.push({ type: 'output', text: '✓ Code compiled successfully' });
    }

    const runtime = (Math.random() * 50 + 10).toFixed(1);
    const memory = (Math.random() * 5 + 8).toFixed(1);
    lines.push({ type: 'info', text: `\n⏱ Runtime: ${runtime}ms  |  💾 Memory: ${memory}MB` });

    return lines;
}

export default function CodingPlayground() {
    const navigate = useNavigate();
    const editorRef = useRef(null);
    const supportedLanguageIds = LANGUAGES.map((l) => l.id);

    // Editor state
    const [language, setLanguage] = useState(() => {
        const savedLanguage = localStorage.getItem('playground-lang') || 'python';
        return supportedLanguageIds.includes(savedLanguage) ? savedLanguage : 'python';
    });
    const [code, setCode] = useState('');
    const [running, setRunning] = useState(false);
    const [consoleOutput, setConsoleOutput] = useState([]);
    const [copied, setCopied] = useState(false);

    // UI state
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [showSnippets, setShowSnippets] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [consoleHeight, setConsoleHeight] = useState(200);
    const [timer, setTimer] = useState(0);
    const [timerActive, setTimerActive] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [editorTheme, setEditorTheme] = useState(() => getSavedTheme('playground-editor-theme'));
    const [showThemeMenu, setShowThemeMenu] = useState(false);

    // ─── NEW FEATURE STATE ───
    const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem('pg-font-size')) || 14);
    const [execHistory, setExecHistory] = useState(() => {
        try { return JSON.parse(localStorage.getItem('pg-exec-history') || '[]'); } catch { return []; }
    });
    const [showHistory, setShowHistory] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
    const [shareCopied, setShareCopied] = useState(false);
    const [showSidebar] = useState(true);
    const [showMobileConsole, setShowMobileConsole] = useState(false);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const [isMobileView, setIsMobileView] = useState(() => window.innerWidth <= 768);
    const [sidebarTab, setSidebarTab] = useState('errors');
    const [liveErrors, setLiveErrors] = useState([]);
    const [liveLintPending, setLiveLintPending] = useState(false);
    const [voiceErrorsEnabled, setVoiceErrorsEnabled] = useState(() => localStorage.getItem('pg-voice-errors-enabled') === '1');
    const [voiceRate, setVoiceRate] = useState(() => {
        const raw = Number(localStorage.getItem('pg-voice-errors-rate'));
        if (Number.isFinite(raw) && raw >= 0.7 && raw <= 1.6) return raw;
        return 1;
    });
    const [voiceVolume, setVoiceVolume] = useState(() => {
        const raw = Number(localStorage.getItem('pg-voice-errors-volume'));
        if (Number.isFinite(raw) && raw >= 0 && raw <= 1) return raw;
        return 0.9;
    });
    const [voiceWarningsEnabled, setVoiceWarningsEnabled] = useState(() => localStorage.getItem('pg-voice-errors-warnings') === '1');
    const [attentionSoundEnabled, setAttentionSoundEnabled] = useState(() => {
        const saved = localStorage.getItem('pg-error-attention-sound-enabled');
        return saved === null ? true : saved === '1';
    });
    const [attentionSoundVolume, setAttentionSoundVolume] = useState(() => {
        const saved = Number(localStorage.getItem('pg-error-attention-sound-volume'));
        if (Number.isFinite(saved) && saved >= 0 && saved <= 1) return saved;
        return 0.55;
    });
    const [voiceName, setVoiceName] = useState(() => localStorage.getItem('pg-voice-errors-name') || '');
    const [voiceAnnouncementLang, setVoiceAnnouncementLang] = useState(() => {
        const saved = localStorage.getItem('pg-voice-errors-lang');
        return saved === 'hi' ? 'hi' : 'en';
    });
    const [voiceOptions, setVoiceOptions] = useState([]);
    const [voiceSupported, setVoiceSupported] = useState(false);
    const [showVoiceSettings, setShowVoiceSettings] = useState(false);
    const [showAdvancedVoiceSettings, setShowAdvancedVoiceSettings] = useState(false);
    const [runPhase, setRunPhase] = useState('idle');
    const [lastExecutionMeta, setLastExecutionMeta] = useState(null);
    const [consoleFilter, setConsoleFilter] = useState('all');

    // ─── AI ASSISTANT STATE ───
    const [aiMessages, setAiMessages] = useState([]);
    const [aiInput, setAiInput] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiCopied, setAiCopied] = useState(null);
    const [lastAiRequest, setLastAiRequest] = useState(null);
    const aiEndRef = useRef(null);

    // Console resize ref
    const draggingRef = useRef(null);
    const monacoRef = useRef(null);
    const rootRef = useRef(null);
    const consoleEndRef = useRef(null);
    const lintAbortRef = useRef(null);
    const prevErrorCountRef = useRef(0);
    const runPhaseTimeoutsRef = useRef([]);
    const runAbortRef = useRef(null);
    const runTokenRef = useRef(0);
    const lintRequestSeqRef = useRef(0);
    const voiceTimerRef = useRef(null);
    const voiceInitializedRef = useRef(false);
    const prevVoiceEnabledRef = useRef(voiceErrorsEnabled);
    const lastVoiceSignatureRef = useRef('');
    const voiceAudioRef = useRef(null);
    const voiceFetchAbortRef = useRef(null);
    const attentionAudioContextRef = useRef(null);
    const attentionTimerRef = useRef(null);
    const lastAttentionSignatureRef = useRef('');

    // ─── Load saved code or default ───
    useEffect(() => {
        const saved = localStorage.getItem(`playground-code-${language}`);
        if (saved) {
            if (language === 'python' && isLegacyPythonStarter(saved)) {
                const nextCode = DEFAULT_CODE.python || '';
                setCode(nextCode);
                localStorage.setItem(`playground-code-${language}`, nextCode);
                return;
            }
            setCode(saved);
            return;
        }

        setCode(DEFAULT_CODE[language] || '');
    }, [language]);

    // ─── Auto-save ───
    useEffect(() => {
        if (!code) return;
        const timeout = setTimeout(() => {
            localStorage.setItem(`playground-code-${language}`, code);
        }, 500);
        return () => clearTimeout(timeout);
    }, [code, language]);

    // ─── Timer ───
    useEffect(() => {
        if (!timerActive) return;
        const id = setInterval(() => setTimer(t => t + 1), 1000);
        return () => clearInterval(id);
    }, [timerActive]);

    // ─── Auto-scroll console ───
    useEffect(() => {
        consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [consoleOutput]);

    // ─── Language change ───
    const handleLanguageChange = (lang) => {
        setLanguage(lang);
        localStorage.setItem('playground-lang', lang);
        setShowLangMenu(false);
    };

    // ─── Run code ───
    const handleRun = useCallback(async () => {
        runAbortRef.current?.abort();
        runTokenRef.current += 1;
        const runToken = runTokenRef.current;
        const controller = new AbortController();
        runAbortRef.current = controller;

        runPhaseTimeoutsRef.current.forEach((id) => clearTimeout(id));
        runPhaseTimeoutsRef.current = [];
        setRunPhase('queued');
        setRunning(true);
        const timestamp = new Date().toLocaleTimeString();
        setConsoleOutput(prev => [...prev, { type: 'info', text: `[${timestamp}] Running ${language}...` }]);
        setLastExecutionMeta(null);

        runPhaseTimeoutsRef.current.push(setTimeout(() => setRunPhase('sending'), 80));
        runPhaseTimeoutsRef.current.push(setTimeout(() => setRunPhase('compiling'), 350));
        runPhaseTimeoutsRef.current.push(setTimeout(() => setRunPhase('executing'), 900));

        try {
            const res = await fetch(`${API_URL}/api/practice/execute`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ code, language }),
                signal: controller.signal,
            });

            if (runToken !== runTokenRef.current) return;
            const data = await res.json().catch(() => ({}));
            setRunPhase('processing');

            if (!res.ok) {
                const friendlyError = getPlaygroundFriendlyError(data?.error, res.status);
                setConsoleOutput(prev => [...prev, { type: 'error', text: friendlyError }]);

                const histEntry = {
                    id: Date.now(),
                    timestamp,
                    language,
                    codeSnippet: code.slice(0, 100),
                    outputPreview: friendlyError.slice(0, 80),
                    success: false,
                };
                setExecHistory(prev => {
                    const updated = [histEntry, ...prev].slice(0, 10);
                    localStorage.setItem('pg-exec-history', JSON.stringify(updated));
                    return updated;
                });
                return;
            }

            const outputText = (data.output || '').trim();
            const errorText = (data.error || '').trim();
            const outputLines = [];
            const compileMs = Number(data.compileTime || 0);
            const runMs = Number(data.runTime || 0);
            const totalMs = Number(data.executionTime || 0);
            const cacheHit = Boolean(data.cacheHit);
            setLastExecutionMeta({
                success: !!data.success,
                compileMs,
                runMs,
                totalMs,
                cacheHit,
                language,
                time: timestamp,
            });

            if (data.success && outputText) {
                outputText.split('\n').forEach(line => {
                    outputLines.push({ type: 'output', text: line });
                });
            } else if (!data.success && errorText) {
                errorText.split('\n').forEach(line => {
                    const errorInfo = parseErrorWithLineInfo(line);
                    let displayText = getPlaygroundFriendlyError(errorInfo.text, res.status);
                    if (errorInfo.lineNum) {
                        displayText = `📍 Line ${errorInfo.lineNum}${errorInfo.colNum ? `:${errorInfo.colNum}` : ''} — ${displayText}`;
                    }
                    outputLines.push({ type: 'error', text: displayText });
                });
            } else if (outputText) {
                outputText.split('\n').forEach(line => {
                    outputLines.push({ type: 'output', text: line });
                });
            } else {
                outputLines.push({ type: 'info', text: '(No output — use console.log() or print() to see results)' });
            }

            const runtime = totalMs ? `${Math.round(totalMs)}ms` : 'N/A';
            outputLines.push({ type: 'info', text: `\n⏱ Runtime: ${runtime}` });
            outputLines.push({
                type: 'info',
                text: `⚙ Compile: ${Math.round(compileMs)}ms${cacheHit ? ' (cache)' : ''}  |  ▶ Run: ${Math.round(runMs)}ms`,
            });
            setConsoleOutput(prev => [...prev, ...outputLines]);

            // Save to execution history
            const histEntry = {
                id: Date.now(),
                timestamp,
                language,
                codeSnippet: code.slice(0, 100),
                outputPreview: outputText.slice(0, 80) || errorText.slice(0, 80) || 'No output',
                success: data.success,
                runtimeMs: totalMs || 0,
            };
            setExecHistory(prev => {
                const updated = [histEntry, ...prev].slice(0, 10);
                localStorage.setItem('pg-exec-history', JSON.stringify(updated));
                return updated;
            });
        } catch (err) {
            if (err?.name === 'AbortError') {
                setConsoleOutput(prev => [...prev, { type: 'info', text: 'Execution cancelled by user.' }]);
            } else {
                setConsoleOutput(prev => [...prev, { type: 'error', text: `Network error: ${err.message}` }]);
            }
        } finally {
            setRunPhase('idle');
            runPhaseTimeoutsRef.current.forEach((id) => clearTimeout(id));
            runPhaseTimeoutsRef.current = [];
            if (runAbortRef.current === controller) runAbortRef.current = null;
            setRunning(false);
        }
    }, [code, language]);

    const handleCancelRun = useCallback(() => {
        if (!running) return;
        runAbortRef.current?.abort();
        runAbortRef.current = null;
        runTokenRef.current += 1;
        setRunPhase('idle');
        setRunning(false);
        setConsoleOutput(prev => [...prev, { type: 'info', text: 'Run stopped.' }]);
    }, [running]);

    // ─── Font size ───
    const handleFontSize = (delta) => {
        setFontSize(prev => {
            const next = Math.max(10, Math.min(24, prev + delta));
            localStorage.setItem('pg-font-size', next);
            return next;
        });
    };

    // ─── Format code ───
    const handleFormat = useCallback(async () => {
        const formatted = await formatCode(code, language);
        setCode(formatted);
        setConsoleOutput(prev => [...prev, { type: 'info', text: `✓ Code formatted (${language})` }]);
    }, [code, language]);

    // ─── Fullscreen ───
    const handleFullscreen = () => {
        if (!document.fullscreenElement) {
            rootRef.current?.requestFullscreen?.();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen?.();
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    // ─── Share code via URL ───
    const handleShare = () => {
        try {
            const encoded = btoa(encodeURIComponent(code));
            const url = `${window.location.origin}/playground?lang=${language}&code=${encoded}`;
            navigator.clipboard.writeText(url);
            setShareCopied(true);
            setTimeout(() => setShareCopied(false), 2500);
        } catch { /* code too long */ }
    };

    // Load shared code from URL on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const sharedCode = params.get('code');
        const sharedLang = params.get('lang');
        if (sharedCode) {
            try {
                const decoded = decodeURIComponent(atob(sharedCode));
                setCode(decoded);
                if (sharedLang && LANGUAGES.find(l => l.id === sharedLang)) {
                    setLanguage(sharedLang);
                    localStorage.setItem('playground-lang', sharedLang);
                }
            } catch { /* invalid share link */ }
        }
    }, []);

    // ─── Clear console ───
    const clearConsole = () => setConsoleOutput([]);

    // ─── Copy code ───
    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const fileInfo = {
            python: { ext: 'py', mime: 'text/x-python' },
            javascript: { ext: 'js', mime: 'text/javascript' },
            c: { ext: 'c', mime: 'text/x-c' },
            cpp: { ext: 'cpp', mime: 'text/x-c++src' },
            java: { ext: 'java', mime: 'text/x-java-source' },
            go: { ext: 'go', mime: 'text/x-go' },
        };
        const info = fileInfo[language] || { ext: 'txt', mime: 'text/plain' };
        const blob = new Blob([code], { type: info.mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `playground.${info.ext}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ─── Reset code ───
    const handleReset = () => {
        setCode(DEFAULT_CODE[language] || '');
        localStorage.removeItem(`playground-code-${language}`);
    };

    // ─── AI Assistant handler ───
    const handleAiAssist = useCallback(async (mode, customPrompt = '') => {
        if (aiLoading) return;
        const modeLabels = {
            explain: '✨ Explain this code',
            review: '🔍 Review this code',
            debug: '🐛 Debug this code',
            optimize: '⚡ Optimize this code',
            complexity: '📊 Analyze complexity',
            comment: '💬 Add comments',
        };
        const userMsg = mode === 'ask'
            ? customPrompt || 'Help me with this code'
            : modeLabels[mode] || customPrompt;

        setAiMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date().toLocaleTimeString() }]);
        setAiLoading(true);
        setAiInput('');
        setLastAiRequest({ mode, customPrompt });

        try {
            const res = await fetch(`${API_URL}/api/ai/playground-assist`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    code, language, mode, prompt: customPrompt,
                    history: aiMessages.slice(-6),
                }),
            });
            const data = await res.json();
            setAiMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response || data.error || 'No response received.',
                timestamp: new Date().toLocaleTimeString(),
            }]);
        } catch (err) {
            setAiMessages(prev => [...prev, {
                role: 'assistant',
                content: `⚠️ Error: ${err.message}`,
                timestamp: new Date().toLocaleTimeString(),
                isError: true,
            }]);
        } finally {
            setAiLoading(false);
        }
    }, [code, language, aiLoading, aiMessages]);

    // Copy AI message
    const handleAiCopy = (text, idx) => {
        navigator.clipboard.writeText(text);
        setAiCopied(idx);
        setTimeout(() => setAiCopied(null), 2000);
    };

    // Apply code from AI response to editor
    const handleAiApplyCode = (content) => {
        const codeMatch = content.match(/```[\w]*\n([\s\S]*?)```/);
        if (codeMatch) {
            setCode(codeMatch[1].trim());
        }
    };

    // Retry last AI request
    const handleAiRetry = () => {
        if (lastAiRequest) {
            // Remove last 2 messages (user + assistant)
            setAiMessages(prev => prev.slice(0, -2));
            setTimeout(() => handleAiAssist(lastAiRequest.mode, lastAiRequest.customPrompt), 100);
        }
    };

    // Auto-scroll AI chat
    useEffect(() => {
        aiEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [aiMessages, aiLoading]);

    // ─── Real-time local diagnostics (instant) ───
    useEffect(() => {
        if (!editorRef.current || !monacoRef.current) return;
        const editor = editorRef.current;
        const monaco = monacoRef.current;
        const model = editor.getModel();
        if (!model) return;

        const nextLocalErrors = getRealtimeErrors(code, language);
        setLiveErrors(nextLocalErrors);

        const markers = nextLocalErrors.map((error) => ({
            startLineNumber: error.line,
            startColumn: error.col,
            endLineNumber: error.line,
            endColumn: error.col + 1,
            message: error.message,
            severity: error.severity === 'warning' ? monaco.MarkerSeverity.Warning : monaco.MarkerSeverity.Error,
        }));

        monaco.editor.setModelMarkers(model, 'playground-live', markers);
    }, [code, language]);

    // ─── Server lint diagnostics (debounced) ───
    useEffect(() => {
        const serverLintSupportedLanguages = new Set(['python', 'javascript', 'c', 'cpp', 'java']);
        if (!serverLintSupportedLanguages.has(language) || !String(code || '').trim()) {
            lintAbortRef.current?.abort();
            setLiveLintPending(false);
            return;
        }

        if (!editorRef.current || !monacoRef.current) return;
        const editor = editorRef.current;
        const monaco = monacoRef.current;
        const model = editor.getModel();
        if (!model) return;

        lintAbortRef.current?.abort();
        const controller = new AbortController();
        lintAbortRef.current = controller;
        const requestSeq = lintRequestSeqRef.current + 1;
        lintRequestSeqRef.current = requestSeq;
        let pendingIndicatorTimer = null;

        const timer = setTimeout(() => {
            pendingIndicatorTimer = setTimeout(() => {
                if (!controller.signal.aborted && requestSeq === lintRequestSeqRef.current) {
                    setLiveLintPending(true);
                }
            }, 150);

            fetch(`${API_URL}/api/practice/lint`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ code, language }),
                signal: controller.signal,
            })
                .then((res) => res.json().catch(() => ({})))
                .then((data) => {
                    if (controller.signal.aborted || requestSeq !== lintRequestSeqRef.current) return;
                    const serverErrors = Array.isArray(data?.errors) ? data.errors : [];
                    const latestLocalErrors = getRealtimeErrors(code, language);
                    const mergedErrors = mergeAndDedupeErrors(latestLocalErrors, serverErrors);
                    setLiveErrors(mergedErrors);

                    const mergedMarkers = mergedErrors.map((error) => ({
                        startLineNumber: error.line,
                        startColumn: error.col,
                        endLineNumber: error.line,
                        endColumn: error.col + 1,
                        message: error.message,
                        severity: error.severity === 'warning' ? monaco.MarkerSeverity.Warning : monaco.MarkerSeverity.Error,
                    }));
                    monaco.editor.setModelMarkers(model, 'playground-live', mergedMarkers);
                })
                .catch(() => {
                    // Ignore lint network errors for realtime UX.
                })
                .finally(() => {
                    if (pendingIndicatorTimer) {
                        clearTimeout(pendingIndicatorTimer);
                        pendingIndicatorTimer = null;
                    }
                    if (!controller.signal.aborted && requestSeq === lintRequestSeqRef.current) {
                        setLiveLintPending(false);
                    }
                });
        }, 120);

        return () => {
            clearTimeout(timer);
            if (pendingIndicatorTimer) {
                clearTimeout(pendingIndicatorTimer);
                pendingIndicatorTimer = null;
            }
            setLiveLintPending(false);
            controller.abort();
        };
    }, [code, language]);

    useEffect(() => {
        const prevCount = prevErrorCountRef.current;
        if (liveErrors.length > 0 && prevCount === 0) {
            setSidebarTab('errors');
        }
        prevErrorCountRef.current = liveErrors.length;
    }, [liveErrors.length]);

    useEffect(() => {
        const supported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
        setVoiceSupported(supported);
    }, []);

    useEffect(() => {
        localStorage.setItem('pg-voice-errors-enabled', voiceErrorsEnabled ? '1' : '0');
    }, [voiceErrorsEnabled]);

    useEffect(() => {
        prevVoiceEnabledRef.current = voiceErrorsEnabled;
    }, [voiceErrorsEnabled, voiceSupported]);

    useEffect(() => {
        localStorage.setItem('pg-voice-errors-rate', String(voiceRate));
    }, [voiceRate]);

    useEffect(() => {
        localStorage.setItem('pg-voice-errors-volume', String(voiceVolume));
    }, [voiceVolume]);

    useEffect(() => {
        localStorage.setItem('pg-voice-errors-warnings', voiceWarningsEnabled ? '1' : '0');
    }, [voiceWarningsEnabled]);

    useEffect(() => {
        localStorage.setItem('pg-error-attention-sound-enabled', attentionSoundEnabled ? '1' : '0');
    }, [attentionSoundEnabled]);

    useEffect(() => {
        localStorage.setItem('pg-error-attention-sound-volume', String(attentionSoundVolume));
    }, [attentionSoundVolume]);

    useEffect(() => {
        localStorage.setItem('pg-voice-errors-name', voiceName);
    }, [voiceName]);

    useEffect(() => {
        localStorage.setItem('pg-voice-errors-lang', voiceAnnouncementLang);
    }, [voiceAnnouncementLang]);

    useEffect(() => {
        if (!voiceSupported || typeof window === 'undefined') return;

        const hydrateVoices = () => {
            const list = window.speechSynthesis.getVoices() || [];
            setVoiceOptions(list);
            if (!list.length) return;
            if (voiceName && list.some((voice) => voice.name === voiceName)) return;
            const preferred = list.find((voice) => /heera/i.test(voice.name))
                || list.find((voice) => /en/i.test(voice.lang))
                || list[0];
            if (preferred) setVoiceName(preferred.name);
        };

        hydrateVoices();
        window.speechSynthesis.addEventListener('voiceschanged', hydrateVoices);
        return () => {
            window.speechSynthesis.removeEventListener('voiceschanged', hydrateVoices);
        };
    }, [voiceName, voiceSupported]);

    const stopVoicePlayback = useCallback(() => {
        if (voiceTimerRef.current) {
            clearTimeout(voiceTimerRef.current);
            voiceTimerRef.current = null;
        }
        voiceFetchAbortRef.current?.abort();
        voiceFetchAbortRef.current = null;
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        if (voiceAudioRef.current) {
            try {
                voiceAudioRef.current.pause();
                const src = voiceAudioRef.current.src;
                if (src?.startsWith('blob:')) URL.revokeObjectURL(src);
            } catch {
                // Ignore cleanup errors.
            }
            voiceAudioRef.current = null;
        }
    }, []);

    const hasHindiVoice = useMemo(
        () => voiceOptions.some((voice) => /^hi(-|$)/i.test(voice.lang) || /hindi/i.test(voice.name)),
        [voiceOptions],
    );

    const speakViaCloud = useCallback(async (text, language) => {
        try {
            if (!text || !String(text).trim()) return false;

            voiceFetchAbortRef.current?.abort();
            const controller = new AbortController();
            voiceFetchAbortRef.current = controller;

            const response = await fetch(`${API_URL}/api/voice/tts`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    text: String(text).trim().slice(0, 550),
                    persona: 'friendly',
                    language: language || voiceAnnouncementLang,
                    provider: 'groq-orpheus'
                }),
                signal: controller.signal,
            });

            if (controller.signal.aborted) return false;
            const contentType = (response.headers.get('content-type') || '').toLowerCase();
            if (contentType.includes('application/json')) {
                await response.json().catch(() => ({}));
                return false;
            }

            const blob = await response.blob();
            if (!blob || blob.size < 128) return false;

            if (voiceAudioRef.current) {
                try {
                    const src = voiceAudioRef.current.src;
                    voiceAudioRef.current.pause();
                    if (src?.startsWith('blob:')) URL.revokeObjectURL(src);
                } catch {
                    // Ignore cleanup errors.
                }
            }

            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.volume = voiceVolume;
            audio.playbackRate = voiceRate;
            audio.onended = () => {
                URL.revokeObjectURL(url);
                if (voiceAudioRef.current === audio) voiceAudioRef.current = null;
            };
            audio.onerror = () => {
                URL.revokeObjectURL(url);
                if (voiceAudioRef.current === audio) voiceAudioRef.current = null;
            };

            voiceAudioRef.current = audio;
            await audio.play();
            return true;
        } catch {
            return false;
        }
    }, [voiceAnnouncementLang, voiceRate, voiceVolume]);

    const playVoiceAnnouncement = useCallback(async (announcement, language) => {
        const text = String(announcement || '').trim();
        if (!text) return false;

        if ((language === 'hi' || !language) && !hasHindiVoice) {
            const usedCloud = await speakViaCloud(text, language);
            if (usedCloud) return true;
        }

        if (typeof window === 'undefined' || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
            return false;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = language === 'hi' ? Math.min(voiceRate, 0.95) : voiceRate;
        utterance.volume = voiceVolume;
        utterance.pitch = language === 'hi' ? 0.98 : 1.08;
        utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';

        const selectedVoice = voiceOptions.find((voice) => voice.name === voiceName)
            || voiceOptions.find((voice) => {
                if (language === 'hi') return /^hi(-|$)/i.test(voice.lang) || /hindi/i.test(voice.name);
                return /^en(-|$)/i.test(voice.lang);
            });

        const friendlyBrowserVoice = voiceOptions.find((voice) => {
            const name = String(voice.name || '').toLowerCase();
            const lang = String(voice.lang || '').toLowerCase();
            if (language === 'hi') return /^hi(-|$)/i.test(lang) || /hindi/.test(name) || /india/.test(name);
            return /^en(-|$)/i.test(lang) && (/female|aria|samantha|victoria|zira|alloy|nova|luna|vega|rachel|susan|google uk english female|microsoft aria|microsoft jenny|natural/i.test(name) || voice.default);
        });

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        } else if (friendlyBrowserVoice) {
            utterance.voice = friendlyBrowserVoice;
        }

        if (voiceAudioRef.current) {
            try {
                voiceAudioRef.current.pause();
            } catch {
                // Ignore pause errors.
            }
        }

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        return true;
    }, [hasHindiVoice, speakViaCloud, voiceName, voiceOptions, voiceRate, voiceVolume]);

    const playAttentionPing = useCallback(() => {
        if (typeof window === 'undefined') return;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;

        const ensureCtx = () => {
            if (!attentionAudioContextRef.current) {
                attentionAudioContextRef.current = new AudioCtx();
            }
            return attentionAudioContextRef.current;
        };

        const ctx = ensureCtx();
        if (!ctx) return;

        const now = ctx.currentTime;
        const master = ctx.createGain();
        master.gain.setValueAtTime(Math.max(0, Math.min(1, attentionSoundVolume)) * 0.18, now);
        master.connect(ctx.destination);

        const scheduleTone = (startOffset, frequency, duration) => {
            const oscillator = ctx.createOscillator();
            const toneGain = ctx.createGain();
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(frequency, now + startOffset);
            toneGain.gain.setValueAtTime(0.0001, now + startOffset);
            toneGain.gain.exponentialRampToValueAtTime(1, now + startOffset + 0.01);
            toneGain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);
            oscillator.connect(toneGain);
            toneGain.connect(master);
            oscillator.start(now + startOffset);
            oscillator.stop(now + startOffset + duration + 0.02);
        };

        scheduleTone(0, 740, 0.12);
        scheduleTone(0.16, 988, 0.15);
    }, [attentionSoundVolume]);

    const toSpokenErrorMessage = useCallback((message, language) => {
        const isHindi = language === 'hi';

        const symbolName = (symbol) => {
            const names = {
                ':': isHindi ? 'कोलन' : 'colon',
                ';': isHindi ? 'सेमी कोलन' : 'semicolon',
                ',': isHindi ? 'कॉमा' : 'comma',
                '.': isHindi ? 'डॉट' : 'dot',
                '(': isHindi ? 'ओपन पैरेंथेसिस' : 'open parenthesis',
                ')': isHindi ? 'क्लोज पैरेंथेसिस' : 'close parenthesis',
                '[': isHindi ? 'ओपन ब्रैकेट' : 'open bracket',
                ']': isHindi ? 'क्लोज ब्रैकेट' : 'close bracket',
                '{': isHindi ? 'ओपन ब्रेस' : 'open brace',
                '}': isHindi ? 'क्लोज ब्रेस' : 'close brace',
            };
            return names[symbol] || symbol;
        };

        return String(message || '')
            .replace(/expected\s+['"`]?([:;,.(){}[\]])['"`]?/gi, (match, symbol) => {
                return `expected ${symbolName(symbol)}`;
            })
            .replace(/['"`]?([:;,.(){}[\]])['"`]?(\s+was\s+never\s+closed)/gi, (match, symbol, suffix) => {
                return `${symbolName(symbol)}${suffix}`;
            });
    }, []);

    const buildVoiceAnnouncement = useCallback((items, language) => {
        const prioritized = [...(items || [])].sort((a, b) => {
            if (a.severity !== b.severity) return a.severity === 'error' ? -1 : 1;
            if (a.line !== b.line) return a.line - b.line;
            return a.col - b.col;
        });

        if (prioritized.length === 0) return '';

        const isHindi = language === 'hi';
        const opener = isHindi
            ? 'दोस्ताना अपडेट: मुझे कुछ चीज़ें मिली हैं जिन्हें ठीक करना है।'
            : 'Friendly heads-up: I found a couple of things to fix.';
        const closer = isHindi
            ? 'आप बहुत अच्छा कर रहे हैं, छोटे-छोटे बदलाव से यह ठीक हो जाएगा।'
            : 'You are doing great, a few small tweaks should fix this.';

        const body = prioritized
            .map((error) => {
                const shortType = error.severity === 'warning'
                    ? (isHindi ? 'ध्यान दें' : 'Quick note')
                    : (isHindi ? 'ध्यान दें' : 'Heads up');
                const spokenMessage = toSpokenErrorMessage(error.message, language);
                if (isHindi) return `लाइन ${error.line}, कॉलम ${error.col}. ${shortType}: ${spokenMessage}`;
                return `Line ${error.line}, column ${error.col}. ${shortType}: ${spokenMessage}`;
            })
            .join(' ');

        return `${opener} ${body} ${closer}`.trim();
    }, [toSpokenErrorMessage]);

    const handleVoiceTest = useCallback(async () => {
        const sample = buildVoiceAnnouncement(
            liveErrors.length > 0
                ? liveErrors
                : [{ line: 1, col: 1, message: voiceAnnouncementLang === 'hi' ? 'लगता है यहाँ कोलन या ब्रैकेट मिस हो सकता है, एक बार चेक करें।' : 'Looks like a colon or bracket may be missing here, please take a quick look.', severity: 'error' }],
            voiceAnnouncementLang,
        ) || (
            voiceAnnouncementLang === 'hi'
                ? 'दोस्ताना वॉयस प्रीव्यू तैयार है।'
                : 'Friendly voice preview is ready.'
        );

        await playVoiceAnnouncement(sample, voiceAnnouncementLang);
    }, [buildVoiceAnnouncement, liveErrors, playVoiceAnnouncement, voiceAnnouncementLang]);

    useEffect(() => {
        if (!voiceSupported || !voiceErrorsEnabled) {
            stopVoicePlayback();
            return;
        }

        if (!voiceInitializedRef.current) {
            voiceInitializedRef.current = true;
            return;
        }

        const normalized = (liveErrors || []).map((error) => ({
            line: error.line || 1,
            col: error.col || 1,
            message: String(error.message || 'Error').trim(),
            severity: error.severity === 'warning' ? 'warning' : 'error',
        }));

        const announceable = voiceWarningsEnabled
            ? normalized
            : normalized.filter((error) => error.severity === 'error');

        if (announceable.length === 0) {
            lastVoiceSignatureRef.current = '';
            stopVoicePlayback();
            return;
        }

        const signature = JSON.stringify(announceable);
        if (signature === lastVoiceSignatureRef.current) return;
        lastVoiceSignatureRef.current = signature;

        if (voiceTimerRef.current) {
            clearTimeout(voiceTimerRef.current);
            voiceTimerRef.current = null;
        }

        voiceTimerRef.current = setTimeout(() => {
            const announcement = buildVoiceAnnouncement(announceable, voiceAnnouncementLang);
            if (!announcement) return;
            playVoiceAnnouncement(announcement, voiceAnnouncementLang);
        }, 420);

        return () => {
            if (voiceTimerRef.current) {
                clearTimeout(voiceTimerRef.current);
                voiceTimerRef.current = null;
            }
        };
    }, [
        liveErrors,
        voiceErrorsEnabled,
        stopVoicePlayback,
        buildVoiceAnnouncement,
        voiceAnnouncementLang,
        playVoiceAnnouncement,
        voiceName,
        voiceOptions,
        voiceRate,
        voiceSupported,
        voiceVolume,
        voiceWarningsEnabled,
    ]);

    useEffect(() => {
        if (!attentionSoundEnabled) {
            if (attentionTimerRef.current) {
                clearTimeout(attentionTimerRef.current);
                attentionTimerRef.current = null;
            }
            return;
        }

        const onlyErrors = (liveErrors || [])
            .filter((entry) => entry.severity !== 'warning')
            .map((entry) => ({
                line: entry.line || 1,
                col: entry.col || 1,
                message: String(entry.message || 'Error').trim(),
            }));

        if (!onlyErrors.length) {
            lastAttentionSignatureRef.current = '';
            if (attentionTimerRef.current) {
                clearTimeout(attentionTimerRef.current);
                attentionTimerRef.current = null;
            }
            return;
        }

        const signature = JSON.stringify(onlyErrors);
        if (signature === lastAttentionSignatureRef.current) return;
        lastAttentionSignatureRef.current = signature;

        if (attentionTimerRef.current) {
            clearTimeout(attentionTimerRef.current);
            attentionTimerRef.current = null;
        }

        attentionTimerRef.current = setTimeout(() => {
            playAttentionPing();
        }, 160);

        return () => {
            if (attentionTimerRef.current) {
                clearTimeout(attentionTimerRef.current);
                attentionTimerRef.current = null;
            }
        };
    }, [attentionSoundEnabled, liveErrors, playAttentionPing]);

    useEffect(() => {
        return () => {
            runPhaseTimeoutsRef.current.forEach((id) => clearTimeout(id));
            runAbortRef.current?.abort();
            lintAbortRef.current?.abort();
            stopVoicePlayback();
            if (attentionTimerRef.current) {
                clearTimeout(attentionTimerRef.current);
                attentionTimerRef.current = null;
            }
            if (attentionAudioContextRef.current) {
                attentionAudioContextRef.current.close().catch(() => {
                    // Ignore context close errors.
                });
                attentionAudioContextRef.current = null;
            }
            if (!editorRef.current || !monacoRef.current) return;
            const model = editorRef.current.getModel();
            if (model) {
                monacoRef.current.editor.setModelMarkers(model, 'playground-live', []);
            }
        };
    }, [stopVoicePlayback]);

    // ─── Insert snippet ───
    const insertSnippet = (snippetCode) => {
        if (editorRef.current) {
            const editor = editorRef.current;
            const position = editor.getPosition();
            editor.executeEdits('insert-snippet', [{
                range: {
                    startLineNumber: position.lineNumber,
                    startColumn: position.column,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column,
                },
                text: '\n' + snippetCode + '\n',
            }]);
            editor.focus();
        } else {
            setCode(prev => prev + '\n\n' + snippetCode);
        }
        setShowSnippets(false);
    };

    // ─── Insert algorithm template ───
    const insertTemplate = (template) => {
        const templateCode = template.templates[language] || template.templates.python || '';
        insertSnippet(templateCode);
        setShowTemplates(false);
    };

    // ─── Console resize ───
    const handleResizeMouseDown = (e) => {
        e.preventDefault();
        draggingRef.current = { startY: e.clientY, startHeight: consoleHeight };
        document.addEventListener('mousemove', handleResizeMouseMove);
        document.addEventListener('mouseup', handleResizeMouseUp);
    };

    const handleResizeMouseMove = useCallback((e) => {
        const d = draggingRef.current;
        if (!d) return;
        const dy = d.startY - e.clientY;
        setConsoleHeight(Math.max(80, Math.min(500, d.startHeight + dy)));
    }, []);

    const handleResizeMouseUp = useCallback(() => {
        draggingRef.current = null;
        document.removeEventListener('mousemove', handleResizeMouseMove);
        document.removeEventListener('mouseup', handleResizeMouseUp);
    }, [handleResizeMouseMove]);

    // ─── Keyboard shortcuts ───
    useEffect(() => {
        const handler = (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                handleRun();
            } else if (e.ctrlKey && e.key === '=') {
                e.preventDefault();
                handleFontSize(1);
            } else if (e.ctrlKey && e.key === '-') {
                e.preventDefault();
                handleFontSize(-1);
            } else if (e.key === 'F11') {
                e.preventDefault();
                handleFullscreen();
            } else if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                setShowShortcuts(s => !s);
            } else if (e.key === 'Escape' && running) {
                e.preventDefault();
                handleCancelRun();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleCancelRun, handleRun, running]);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobileView(mobile);
            if (!mobile) {
                setShowMobileConsole(false);
                setShowMobileSidebar(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!isMobileView) return;

        const shouldLock = showMobileConsole || showMobileSidebar || showLangMenu;
        document.body.style.overflow = shouldLock ? 'hidden' : '';

        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileView, showMobileConsole, showMobileSidebar, showLangMenu]);

    const toggleMobileConsole = () => {
        setShowMobileConsole((open) => {
            const next = !open;
            if (next) setShowMobileSidebar(false);
            return next;
        });
    };

    const toggleMobileSidebar = () => {
        setShowMobileSidebar((open) => {
            const next = !open;
            if (next) setShowMobileConsole(false);
            return next;
        });
    };

    const toggleMobileLangMenu = () => {
        setShowLangMenu((open) => {
            const next = !open;
            if (next) {
                setShowMobileConsole(false);
                setShowMobileSidebar(false);
            }
            return next;
        });
    };

    // ─── Monaco editor setup ───
    const handleBeforeMount = (monaco) => {
        registerAllThemes(monaco);
    };

    const handleEditorMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        editor.addAction({
            id: 'run-code',
            label: 'Run Code',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
            run: () => handleRun(),
        });

        // Track cursor position
        editor.onDidChangeCursorPosition((e) => {
            setCursorPos({ line: e.position.lineNumber, col: e.position.column });
        });
    };

    // ─── Theme change handler ───
    const handleThemeChange = (themeId) => {
        setEditorTheme(themeId);
        saveTheme(themeId, 'playground-editor-theme');
        if (monacoRef.current) {
            monacoRef.current.editor.setTheme(themeId);
        }
        setShowThemeMenu(false);
    };

    const focusErrorLine = (error) => {
        if (!editorRef.current || !error?.line) return;
        editorRef.current.revealLineInCenter(error.line);
        editorRef.current.setPosition({ lineNumber: error.line, column: error.col || 1 });
        editorRef.current.focus();
    };

    const sidebarTabs = useMemo(() => ([
        { id: 'errors', icon: <AlertTriangle size={16} />, label: `Errors${liveErrors.length ? ` (${liveErrors.length})` : ''}` },
        { id: 'ai', icon: <Bot size={16} />, label: 'AI' },
        { id: 'history', icon: <History size={16} />, label: 'History' },
        { id: 'shortcuts', icon: <Keyboard size={16} />, label: 'Keys' },
        { id: 'info', icon: <Info size={16} />, label: 'Info' },
    ]), [liveErrors.length]);

    const snippetItems = useMemo(() => SNIPPETS.map((s) => ({
        icon: s.icon,
        label: s.label,
        code: s.code[language] || s.code.python,
    })), [language]);

    const templateItems = useMemo(() => Object.entries(ALGORITHM_TEMPLATES).map(([key, tmpl]) => ({
        key,
        icon: tmpl.icon,
        name: tmpl.name,
        complexity: tmpl.complexity?.time || 'N/A',
        template: tmpl,
    })), []);

    const runPhaseLabel = useMemo(() => {
        if (!running) return 'Idle';
        return {
            queued: 'Queued',
            sending: 'Sending',
            compiling: 'Compiling',
            executing: 'Executing',
            processing: 'Processing',
        }[runPhase] || 'Running';
    }, [runPhase, running]);

    const filteredConsoleOutput = useMemo(() => {
        if (consoleFilter === 'all') return consoleOutput;
        return consoleOutput.filter((line) => line.type === consoleFilter);
    }, [consoleFilter, consoleOutput]);

    const isMobileOverlayOpen = isMobileView && (showMobileSidebar || showMobileConsole || showLangMenu);
    const isSidebarVisible = isMobileView ? showMobileSidebar : showSidebar;

    const consoleCounts = useMemo(() => ({
        all: consoleOutput.length,
        output: consoleOutput.filter((line) => line.type === 'output').length,
        error: consoleOutput.filter((line) => line.type === 'error').length,
        info: consoleOutput.filter((line) => line.type === 'info').length,
    }), [consoleOutput]);

    const langInfo = LANGUAGES.find(l => l.id === language) || LANGUAGES[0];

    return (
        <div className="pg-root" ref={rootRef}>
            {/* Mobile sidebar drawer overlay */}
            {isMobileOverlayOpen && (
                <div className="pg-mobile-overlay" onClick={() => { setShowMobileSidebar(false); setShowMobileConsole(false); setShowLangMenu(false); }} />
            )}
            {/* ─── Top Bar ─── */}
            <div className="pg-topbar">
                <div className="pg-topbar-left">
                    <button onClick={() => navigate('/dashboard')} className="pg-back-btn">
                        <ArrowLeft size={14} />
                        <span>Dashboard</span>
                    </button>

                    <div className="pg-title-group">
                        <div className="pg-title-icon">
                            <Terminal size={16} />
                        </div>
                        <h1 className="pg-title">Coding Playground</h1>
                    </div>
                </div>

                <div className="pg-topbar-center pg-topbar-tools">
                    {/* Language Selector */}
                    <div className="pg-lang-wrap">
                        <button className="pg-lang-btn" onClick={() => setShowLangMenu(s => !s)}>
                            <span>{langInfo.icon}</span>
                            <span>{langInfo.label}</span>
                            <ChevronDown size={12} />
                        </button>
                        {showLangMenu && (
                            <div className="pg-dropdown pg-lang-dropdown">
                                {LANGUAGES.map(l => (
                                    <button
                                        key={l.id}
                                        className={`pg-dropdown-item ${language === l.id ? 'active' : ''}`}
                                        onClick={() => handleLanguageChange(l.id)}
                                    >
                                        <span>{l.icon}</span>
                                        <span>{l.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Snippets */}
                    <div className="pg-snippet-wrap">
                        <button className="pg-toolbar-btn" onClick={() => { setShowSnippets(s => !s); setShowTemplates(false); }}>
                            <Braces size={14} />
                            <span>Snippets</span>
                        </button>
                        {showSnippets && (
                            <div className="pg-dropdown pg-snippets-dropdown">
                                <div className="pg-dropdown-header">Quick Snippets</div>
                                {snippetItems.map((s, i) => (
                                    <button
                                        key={i}
                                        className="pg-dropdown-item"
                                        onClick={() => insertSnippet(s.code)}
                                    >
                                        <span>{s.icon}</span>
                                        <span>{s.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Algorithm Templates */}
                    <div className="pg-template-wrap">
                        <button className="pg-toolbar-btn" onClick={() => { setShowTemplates(s => !s); setShowSnippets(false); }}>
                            <Sparkles size={14} />
                            <span>Templates</span>
                        </button>
                        {showTemplates && (
                            <div className="pg-dropdown pg-templates-dropdown">
                                <div className="pg-dropdown-header">Algorithm Templates</div>
                                {templateItems.map((tmpl) => (
                                    <button
                                        key={tmpl.key}
                                        className="pg-dropdown-item"
                                        onClick={() => insertTemplate(tmpl.template)}
                                    >
                                        <span>{tmpl.icon}</span>
                                        <span>{tmpl.name}</span>
                                        <span className="pg-complexity">{tmpl.complexity}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Theme Selector */}
                    <div className="pg-theme-wrap" style={{ position: 'relative' }}>
                        <button className="pg-toolbar-btn" onClick={() => { setShowThemeMenu(s => !s); setShowSnippets(false); setShowTemplates(false); }}>
                            <Palette size={14} />
                            <span>{EDITOR_THEMES.find(t => t.id === editorTheme)?.label || 'Theme'}</span>
                            <ChevronDown size={12} />
                        </button>
                        {showThemeMenu && (
                            <div className="pg-dropdown pg-theme-dropdown">
                                <div className="pg-dropdown-header">Editor Theme</div>
                                {EDITOR_THEMES.map(theme => (
                                    <button
                                        key={theme.id}
                                        className={`pg-dropdown-item ${editorTheme === theme.id ? 'active' : ''}`}
                                        onClick={() => handleThemeChange(theme.id)}
                                    >
                                        <span>{theme.icon}</span>
                                        <span style={{ flex: 1 }}>{theme.label}</span>
                                        <span style={{
                                            width: 14, height: 14, borderRadius: 4,
                                            background: theme.colors['editor.background'],
                                            border: '1px solid rgba(255,255,255,0.15)',
                                            flexShrink: 0, display: 'inline-block',
                                        }} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Centered Run Button */}
                <div className="pg-topbar-center pg-topbar-run">
                    <button className="pg-run-btn" onClick={handleRun} disabled={running} style={{ padding: '8px 24px', fontSize: '13px', borderRadius: '10px' }}>
                        <Play size={16} style={{ fill: 'currentColor' }} />
                        <span>{running ? `Running (${runPhaseLabel})...` : 'Run Code'}</span>
                        <kbd style={{ marginLeft: '8px' }}>Ctrl+&#x21b5;</kbd>
                    </button>
                    {running && (
                        <button className="pg-run-btn" onClick={handleCancelRun} style={{ marginLeft: '8px', padding: '8px 14px', fontSize: '12px', borderRadius: '10px', background: 'rgba(255,90,90,0.18)', border: '1px solid rgba(255,110,110,0.45)' }}>
                            <X size={14} />
                            <span>Stop</span>
                        </button>
                    )}
                </div>

                <div className="pg-topbar-right">
                    {/* Timer */}
                    <button
                        className={`pg-toolbar-btn ${timerActive ? 'pg-timer-active' : ''}`}
                        onClick={() => setTimerActive(p => !p)}
                    >
                        <Clock size={14} />
                        <span>{formatTime(timer)}</span>
                    </button>
                    {timer > 0 && (
                        <button className="pg-toolbar-btn-icon" onClick={() => { setTimer(0); setTimerActive(false); }} title="Reset timer">
                            <RotateCcw size={13} />
                        </button>
                    )}

                    {/* Actions */}
                    <div className="pg-toolbar-divider" />
                </div>
            </div>

            {/* Main Split: Editor + Sidebar */}
            <div className="pg-main-split">
                {/* Left: Editor + Console */}
                <div className="pg-editor-area">
                    <div className="pg-editor-wrapper" style={{ flex: 1 }}>
                        <Editor
                            height="100%"
                            language={langInfo.monacoId}
                            value={code}
                            onChange={val => setCode(val || '')}
                            beforeMount={handleBeforeMount}
                            onMount={handleEditorMount}
                            theme={editorTheme}
                            options={{
                                fontSize,
                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                fontLigatures: true,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                smoothScrolling: true,
                                cursorBlinking: 'smooth',
                                cursorSmoothCaretAnimation: 'on',
                                padding: { top: 16, bottom: 16 },
                                lineNumbers: 'on',
                                renderLineHighlight: 'all',
                                bracketPairColorization: { enabled: true },
                                guides: { bracketPairs: true, indentation: true },
                                autoClosingBrackets: 'always',
                                autoClosingQuotes: 'always',
                                folding: true,
                                wordWrap: 'on',
                                suggestOnTriggerCharacters: true,
                                tabSize: 4,
                                detectIndentation: true,
                            }}
                        />
                        <div className="pg-lang-badge">
                            <span>{langInfo.icon}</span> {langInfo.label}
                        </div>
                    </div>

                    {/* Console Panel */}
                    <div className={`pg-console ${showMobileConsole ? 'pg-console-mobile-open' : ''}`} style={{ height: consoleHeight }}>
                        <div className="pg-console-resize" onMouseDown={handleResizeMouseDown}>
                            <div className="pg-console-resize-bar" />
                        </div>
                        <div className="pg-console-header">
                            <div className="pg-console-title">
                                <Terminal size={13} />
                                <span>Console</span>
                                <span className="pg-console-count">{consoleOutput.length} lines</span>
                            </div>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                {[
                                    ['all', `All ${consoleCounts.all}`],
                                    ['output', `Out ${consoleCounts.output}`],
                                    ['error', `Err ${consoleCounts.error}`],
                                    ['info', `Info ${consoleCounts.info}`],
                                ].map(([key, label]) => (
                                    <button
                                        key={key}
                                        className={`pg-console-clear ${consoleFilter === key ? 'pg-active' : ''}`}
                                        onClick={() => setConsoleFilter(key)}
                                        style={{ padding: '2px 8px', borderRadius: '8px' }}
                                    >
                                        <span>{label}</span>
                                    </button>
                                ))}
                            </div>
                            <button className="pg-console-clear" onClick={clearConsole}>
                                <Trash2 size={12} /><span>Clear</span>
                            </button>
                        </div>
                        <div className="pg-console-body">
                            {filteredConsoleOutput.length === 0 ? (
                                <div className="pg-console-empty">
                                    <Terminal size={24} strokeWidth={1} />
                                    <p>Run your code to see output here</p>
                                    <kbd>Ctrl + Enter</kbd>
                                </div>
                            ) : (
                                filteredConsoleOutput.map((line, i) => (
                                    <div key={i} className={`pg-console-line pg-console-${line.type}`}>
                                        {line.type === 'info' && <span className="pg-console-prefix">›</span>}
                                        {line.type === 'output' && <span className="pg-console-prefix">»</span>}
                                        {line.type === 'error' && <span className="pg-console-prefix">✕</span>}
                                        <span>{line.text}</span>
                                    </div>
                                ))
                            )}
                            <div ref={consoleEndRef} />
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className={`pg-sidebar ${!isSidebarVisible ? 'pg-sidebar-collapsed' : ''} ${isSidebarVisible ? 'pg-sidebar-mobile-open' : ''}`}>
                    <div className="pg-sidebar-tabs" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center', width: '100%' }}>
                            {sidebarTabs.map(tab => (
                                <button
                                    key={tab.id}
                                    className={`pg-sidebar-tab ${sidebarTab === tab.id ? 'pg-sidebar-tab-active' : ''}`}
                                    onClick={() => setSidebarTab(tab.id)}
                                    title={tab.label}
                                >
                                    {tab.icon}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center', width: '100%' }}>
                            <div style={{ width: '20px', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
                            <button className="pg-sidebar-tab" onClick={handleShare} title="Share Code">
                                {shareCopied ? <Check size={16} /> : <Share2 size={16} />}
                            </button>
                            <button className="pg-sidebar-tab" onClick={handleCopy} title="Copy Code">
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                            <button className="pg-sidebar-tab" onClick={handleDownload} title="Download">
                                <Download size={16} />
                            </button>
                            <button className="pg-sidebar-tab" onClick={handleReset} title="Reset Code">
                                <RotateCcw size={16} />
                            </button>
                            <button className="pg-sidebar-tab" onClick={handleFormat} title="Format Code">
                                <Code2 size={16} />
                            </button>
                            <div style={{ width: '20px', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
                            <button className="pg-sidebar-tab" onClick={() => handleFontSize(1)} title="Zoom In (Ctrl+)">
                                <ZoomIn size={16} />
                            </button>
                            <button className="pg-sidebar-tab" onClick={() => handleFontSize(-1)} title="Zoom Out (Ctrl-)">
                                <ZoomOut size={16} />
                            </button>
                            <button className="pg-sidebar-tab" onClick={handleFullscreen} title={`Fullscreen (F11) - ${isFullscreen ? 'Exit' : 'Enter'}`}>
                                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="pg-sidebar-content">
                        {sidebarTab === 'errors' && (
                            <div className="pg-sidebar-section">
                                <div className="pg-sidebar-section-header">
                                    <AlertTriangle size={14} />
                                    <span>Live Errors</span>
                                    <span className="pg-sidebar-badge">{liveErrors.length}</span>
                                </div>
                                <div style={{ display: 'grid', gap: '10px', marginBottom: '10px', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.02)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                                        <button
                                            type="button"
                                            onClick={() => setShowVoiceSettings((value) => !value)}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent', color: 'inherit', padding: 0, cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                                        >
                                            <Volume2 size={12} />
                                            Friendly voice
                                            <ChevronDown size={12} style={{ transform: showVoiceSettings ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                                        </button>
                                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: voiceSupported ? 'pointer' : 'not-allowed', opacity: voiceSupported ? 1 : 0.55 }}>
                                            <span>On</span>
                                            <input
                                                type="checkbox"
                                                checked={voiceErrorsEnabled}
                                                disabled={!voiceSupported}
                                                onChange={(e) => setVoiceErrorsEnabled(e.target.checked)}
                                            />
                                        </label>
                                    </div>
                                    <div style={{ display: 'grid', gap: '8px', padding: '8px 10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.01)' }}>
                                        <label style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                                            <span>Attention sound</span>
                                            <input
                                                type="checkbox"
                                                checked={attentionSoundEnabled}
                                                onChange={(e) => setAttentionSoundEnabled(e.target.checked)}
                                            />
                                        </label>
                                        {attentionSoundEnabled && (
                                            <label style={{ display: 'grid', gap: '6px', fontSize: '12px' }}>
                                                <span>Alert loudness: {Math.round(attentionSoundVolume * 100)}%</span>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="1"
                                                    step="0.05"
                                                    value={attentionSoundVolume}
                                                    onChange={(e) => setAttentionSoundVolume(Number(e.target.value))}
                                                />
                                            </label>
                                        )}
                                        <button
                                            type="button"
                                            className="pg-btn"
                                            style={{ padding: '8px 12px', fontSize: '12px', justifySelf: 'start' }}
                                            onClick={playAttentionPing}
                                        >
                                            Test attention ping
                                        </button>
                                    </div>
                                    {!voiceSupported && (
                                        <div style={{ fontSize: '11px', opacity: 0.75 }}>
                                            Voice readout is not available in this browser/device.
                                        </div>
                                    )}
                                    {voiceSupported && voiceErrorsEnabled && (
                                        <div style={{ fontSize: '12px', color: 'rgba(248,250,252,0.82)' }}>
                                            Live errors are read aloud in a friendly voice while you type.
                                        </div>
                                    )}

                                    {showVoiceSettings && voiceSupported && (
                                        <div style={{ display: 'grid', gap: '10px', paddingTop: '4px' }}>
                                            <label style={{ display: 'grid', gap: '6px', fontSize: '12px' }}>
                                                <span>Choose language</span>
                                                <select
                                                    value={voiceAnnouncementLang}
                                                    onChange={(e) => setVoiceAnnouncementLang(e.target.value)}
                                                    style={{ width: '100%', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(15,23,42,0.95)', color: 'inherit', padding: '8px 10px' }}
                                                >
                                                    <option value="en">English</option>
                                                    <option value="hi">Hindi</option>
                                                </select>
                                            </label>

                                            <label style={{ display: 'grid', gap: '6px', fontSize: '12px' }}>
                                                <span>Choose voice</span>
                                                <select
                                                    value={voiceName}
                                                    onChange={(e) => setVoiceName(e.target.value)}
                                                    style={{ width: '100%', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(15,23,42,0.95)', color: 'inherit', padding: '8px 10px' }}
                                                >
                                                    {voiceOptions.length === 0 && <option value="">Default browser voice</option>}
                                                    {voiceOptions.map((voice) => (
                                                        <option key={voice.name} value={voice.name}>
                                                            {voice.name} {voice.lang ? `(${voice.lang})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>

                                            <div style={{ display: 'grid', gap: '8px' }}>
                                                <label style={{ display: 'grid', gap: '6px', fontSize: '12px' }}>
                                                    <span>Talk speed: {voiceRate.toFixed(1)}x</span>
                                                    <input
                                                        type="range"
                                                        min="0.7"
                                                        max="1.6"
                                                        step="0.1"
                                                        value={voiceRate}
                                                        onChange={(e) => setVoiceRate(Number(e.target.value))}
                                                    />
                                                </label>
                                                <label style={{ display: 'grid', gap: '6px', fontSize: '12px' }}>
                                                    <span>Sound level: {Math.round(voiceVolume * 100)}%</span>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="1"
                                                        step="0.05"
                                                        value={voiceVolume}
                                                        onChange={(e) => setVoiceVolume(Number(e.target.value))}
                                                    />
                                                </label>
                                            </div>

                                            <label style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', fontSize: '12px', cursor: 'pointer' }}>
                                                <span>Include warnings</span>
                                                <input
                                                    type="checkbox"
                                                    checked={voiceWarningsEnabled}
                                                    onChange={(e) => setVoiceWarningsEnabled(e.target.checked)}
                                                />
                                            </label>

                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                <button
                                                    type="button"
                                                    onClick={handleVoiceTest}
                                                    className="pg-btn"
                                                    style={{ padding: '8px 12px', fontSize: '12px' }}
                                                >
                                                    Try it
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={stopVoicePlayback}
                                                    className="pg-btn"
                                                    style={{ padding: '8px 12px', fontSize: '12px' }}
                                                >
                                                    Stop speaking
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowAdvancedVoiceSettings((value) => !value)}
                                                    className="pg-btn"
                                                    style={{ padding: '8px 12px', fontSize: '12px' }}
                                                >
                                                    More options
                                                </button>
                                            </div>

                                            {showAdvancedVoiceSettings && (
                                                <div style={{ display: 'grid', gap: '8px', padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '11px', lineHeight: 1.5, color: 'rgba(248,250,252,0.78)' }}>
                                                    <div>Selected language: {voiceAnnouncementLang === 'hi' ? 'Hindi' : 'English'}</div>
                                                    <div>Available voices: {voiceOptions.length}</div>
                                                    <div>{hasHindiVoice ? 'A Hindi voice is available in this browser.' : 'No Hindi voice was found, so the cloud voice may be used when needed.'}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {liveLintPending && (
                                    <div style={{ fontSize: '11px', opacity: 0.75, marginBottom: '8px' }}>
                                        Checking syntax...
                                    </div>
                                )}
                                <div className="pg-sidebar-scroll">
                                    {liveErrors.length === 0 ? (
                                        <div className="pg-sidebar-empty">
                                            <Check size={28} strokeWidth={1} />
                                            <p>No syntax issues detected</p>
                                            <span>Diagnostics update while you type</span>
                                        </div>
                                    ) : liveErrors.map((error, idx) => (
                                        <button
                                            key={`${error.line}-${error.col}-${idx}`}
                                            className="pg-history-entry pg-history-error"
                                            onClick={() => focusErrorLine(error)}
                                            style={{ textAlign: 'left', width: '100%', cursor: 'pointer' }}
                                        >
                                            <div className="pg-history-meta">
                                                <span>Line {error.line}:{error.col || 1}</span>
                                                <span className="pg-history-lang">syntax</span>
                                            </div>
                                            <div className="pg-history-preview">{error.message}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {sidebarTab === 'ai' && (
                            <div className="pg-sidebar-section pg-ai-section">
                                <div className="pg-sidebar-section-header">
                                    <Bot size={14} />
                                    <span>AI Assistant</span>
                                    {aiMessages.length > 0 && (
                                        <button className="pg-ai-clear-btn" onClick={() => { setAiMessages([]); setLastAiRequest(null); }} title="Clear chat">
                                            <Eraser size={12} />
                                        </button>
                                    )}
                                </div>

                                {/* Quick Action Chips */}
                                <div className="pg-ai-chips">
                                    {[
                                        { mode: 'explain', icon: '✨', label: 'Explain' },
                                        { mode: 'review', icon: '🔍', label: 'Review' },
                                        { mode: 'debug', icon: '🐛', label: 'Debug' },
                                        { mode: 'optimize', icon: '⚡', label: 'Optimize' },
                                        { mode: 'complexity', icon: '📊', label: 'Complexity' },
                                        { mode: 'comment', icon: '💬', label: 'Comment' },
                                    ].map(chip => (
                                        <button
                                            key={chip.mode}
                                            className="pg-ai-chip"
                                            onClick={() => handleAiAssist(chip.mode)}
                                            disabled={aiLoading || !code.trim()}
                                            title={!code.trim() ? 'Write some code first' : `${chip.label} your code`}
                                        >
                                            <span>{chip.icon}</span>
                                            <span>{chip.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Chat Messages */}
                                <div className="pg-ai-messages">
                                    {aiMessages.length === 0 && !aiLoading && (
                                        <div className="pg-ai-empty">
                                            <div className="pg-ai-empty-icon">
                                                <Sparkles size={24} strokeWidth={1.5} />
                                            </div>
                                            <p>AI Code Assistant</p>
                                            <span>Analyze, debug, optimize, and understand your code with AI</span>
                                            <div className="pg-ai-suggestions">
                                                {[
                                                    { icon: '✨', text: 'Explain this code logic', mode: 'explain' },
                                                    { icon: '🐛', text: 'Find bugs in my code', mode: 'debug' },
                                                    { icon: '⚡', text: 'Optimize for performance', mode: 'optimize' },
                                                ].map(s => (
                                                    <button
                                                        key={s.mode}
                                                        className="pg-ai-suggestion-btn"
                                                        onClick={() => handleAiAssist(s.mode)}
                                                        disabled={aiLoading || !code.trim()}
                                                    >
                                                        <span className="pg-ai-suggestion-icon">{s.icon}</span>
                                                        {s.text}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {aiMessages.map((msg, i) => (
                                        <div key={i} className={`pg-ai-msg pg-ai-msg-${msg.role}`}>
                                            <div className="pg-ai-msg-header">
                                                {msg.role === 'user' ? <MessageSquare size={11} /> : <Bot size={11} />}
                                                <span>{msg.role === 'user' ? 'You' : 'AI'}</span>
                                                <span className="pg-ai-msg-time">{msg.timestamp}</span>
                                            </div>
                                            <div className="pg-ai-msg-body">
                                                {msg.role === 'assistant' ? (
                                                    <ReactMarkdown
                                                        components={{
                                                            code({ node, inline, className, children, ...props }) {
                                                                return inline ? (
                                                                    <code className="pg-ai-inline-code" {...props}>{children}</code>
                                                                ) : (
                                                                    <pre className="pg-ai-code-block">
                                                                        <code className={className} {...props}>{String(children).replace(/\n$/, '')}</code>
                                                                    </pre>
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                ) : msg.content}
                                            </div>
                                            {/* Action buttons for AI messages */}
                                            {msg.role === 'assistant' && !msg.isError && (
                                                <div className="pg-ai-msg-actions">
                                                    <button
                                                        className="pg-ai-action-btn"
                                                        onClick={() => handleAiCopy(msg.content, i)}
                                                        title="Copy response"
                                                    >
                                                        {aiCopied === i ? <ClipboardCheck size={11} /> : <Copy size={11} />}
                                                        <span>{aiCopied === i ? 'Copied' : 'Copy'}</span>
                                                    </button>
                                                    {msg.content.includes('```') && (
                                                        <button
                                                            className="pg-ai-action-btn"
                                                            onClick={() => handleAiApplyCode(msg.content)}
                                                            title="Apply code to editor"
                                                        >
                                                            <FileCode2 size={11} />
                                                            <span>Apply</span>
                                                        </button>
                                                    )}
                                                    {i === aiMessages.length - 1 && (
                                                        <button
                                                            className="pg-ai-action-btn"
                                                            onClick={handleAiRetry}
                                                            title="Retry this request"
                                                        >
                                                            <RefreshCw size={11} />
                                                            <span>Retry</span>
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {aiLoading && (
                                        <div className="pg-ai-msg pg-ai-msg-assistant">
                                            <div className="pg-ai-msg-header">
                                                <Bot size={11} />
                                                <span>AI</span>
                                            </div>
                                            <div className="pg-ai-typing">
                                                <span></span><span></span><span></span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={aiEndRef} />
                                </div>

                                {/* Chat Input */}
                                <div className="pg-ai-input-area">
                                    <input
                                        className="pg-ai-input"
                                        value={aiInput}
                                        onChange={e => setAiInput(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && !e.shiftKey && aiInput.trim()) {
                                                e.preventDefault();
                                                handleAiAssist('ask', aiInput.trim());
                                            }
                                        }}
                                        placeholder="Ask about your code..."
                                        disabled={aiLoading}
                                    />
                                    <button
                                        className="pg-ai-send-btn"
                                        onClick={() => aiInput.trim() && handleAiAssist('ask', aiInput.trim())}
                                        disabled={aiLoading || !aiInput.trim()}
                                    >
                                        <Send size={14} />
                                    </button>
                                </div>
                                <div className="pg-ai-model-badge">
                                    <Sparkles size={9} /> Powered by Groq AI
                                </div>
                            </div>
                        )}

                        {sidebarTab === 'history' && (
                            <div className="pg-sidebar-section">
                                <div className="pg-sidebar-section-header">
                                    <History size={14} />
                                    <span>History</span>
                                    <span className="pg-sidebar-badge">{execHistory.length}</span>
                                </div>
                                <div className="pg-sidebar-scroll">
                                    {execHistory.length === 0 ? (
                                        <div className="pg-sidebar-empty">
                                            <History size={28} strokeWidth={1} />
                                            <p>No runs yet</p>
                                            <span>Click Run to start!</span>
                                        </div>
                                    ) : execHistory.map(entry => (
                                        <div key={entry.id} className={`pg-history-entry ${entry.success ? '' : 'pg-history-error'}`}>
                                            <div className="pg-history-meta">
                                                <span>{entry.timestamp}</span>
                                                <span className="pg-history-lang">{entry.language}</span>
                                                {typeof entry.runtimeMs === 'number' ? <span>{Math.round(entry.runtimeMs)}ms</span> : null}
                                                {entry.success ? <span style={{ color: '#4ade80' }}>✓</span> : <span style={{ color: '#f87171' }}>✗</span>}
                                            </div>
                                            <div className="pg-history-preview">{entry.outputPreview}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {sidebarTab === 'shortcuts' && (
                            <div className="pg-sidebar-section">
                                <div className="pg-sidebar-section-header">
                                    <Keyboard size={14} />
                                    <span>Shortcuts</span>
                                </div>
                                <div className="pg-sidebar-scroll">
                                    {[
                                        ['Ctrl+Enter', 'Run code'],
                                        ['Ctrl + =', 'Zoom in'],
                                        ['Ctrl + -', 'Zoom out'],
                                        ['Ctrl + /', 'Shortcuts'],
                                        ['Esc', 'Stop running code'],
                                        ['F11', 'Fullscreen'],
                                        ['Ctrl + D', 'Duplicate line'],
                                        ['Ctrl+Shift+K', 'Delete line'],
                                        ['Alt + ↑/↓', 'Move line'],
                                        ['Ctrl + [/]', 'Indent'],
                                    ].map(([key, action], i) => (
                                        <div key={i} className="pg-shortcut-row">
                                            <kbd>{key}</kbd>
                                            <span>{action}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {sidebarTab === 'info' && (
                            <div className="pg-sidebar-section">
                                <div className="pg-sidebar-section-header">
                                    <Info size={14} />
                                    <span>Code Info</span>
                                </div>
                                <div className="pg-sidebar-scroll">
                                    <div className="pg-info-grid">
                                        {[
                                            ['Language', `${langInfo.icon} ${langInfo.label}`],
                                            ['Cursor', `Ln ${cursorPos.line}, Col ${cursorPos.col}`],
                                            ['Lines', code.split('\n').length],
                                            ['Characters', code.length],
                                            ['Font Size', `${fontSize}px`],
                                            ['Encoding', 'UTF-8'],
                                            ['Theme', editorTheme],
                                            ['Total Runs', execHistory.length],
                                            ['Run Stage', runPhaseLabel],
                                            ['Last Total', lastExecutionMeta ? `${Math.round(lastExecutionMeta.totalMs)}ms` : 'N/A'],
                                            ['Last Compile', lastExecutionMeta ? `${Math.round(lastExecutionMeta.compileMs)}ms` : 'N/A'],
                                            ['Last Run', lastExecutionMeta ? `${Math.round(lastExecutionMeta.runMs)}ms` : 'N/A'],
                                            ['Compile Cache', lastExecutionMeta ? (lastExecutionMeta.cacheHit ? 'Hit' : 'Miss') : 'N/A'],
                                        ].map(([label, value], i) => (
                                            <div key={i} className="pg-info-item">
                                                <span className="pg-info-label">{label}</span>
                                                <span className="pg-info-value">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Action Bar */}
            <div className="pg-mobile-bar">
                <button className="pg-mobile-bar-btn" onClick={() => navigate('/dashboard')}>
                    <ArrowLeft size={18} />
                    <span>Back</span>
                </button>
                <button
                    className="pg-mobile-bar-btn pg-mobile-bar-lang"
                    onClick={toggleMobileLangMenu}
                >
                    <span>{langInfo.icon}</span>
                    <span>{langInfo.label}</span>
                    <ChevronDown size={12} />
                </button>
                <button
                    className={`pg-mobile-run-fab ${running ? 'pg-mobile-run-fab--running' : ''}`}
                    onClick={running ? handleCancelRun : handleRun}
                    title={running ? 'Stop' : 'Run Code'}
                >
                    {running ? <X size={20} /> : <Play size={20} style={{ fill: 'currentColor' }} />}
                </button>
                <button
                    className={`pg-mobile-bar-btn ${showMobileConsole ? 'pg-mobile-bar-active' : ''}`}
                    onClick={toggleMobileConsole}
                >
                    <Terminal size={18} />
                    <span>Console</span>
                </button>
                <button
                    className={`pg-mobile-bar-btn ${showMobileSidebar ? 'pg-mobile-bar-active' : ''}`}
                    onClick={toggleMobileSidebar}
                >
                    <PanelRightOpen size={18} />
                    <span>Panel</span>
                </button>
            </div>

            {isMobileView && showLangMenu && (
                <div className="pg-mobile-lang-sheet" role="dialog" aria-modal="true" aria-label="Select language">
                    <div className="pg-mobile-lang-sheet-header">
                        <span>Choose Language</span>
                        <button type="button" onClick={() => setShowLangMenu(false)}>
                            <X size={16} />
                        </button>
                    </div>
                    <div className="pg-mobile-lang-sheet-list">
                        {LANGUAGES.map((l) => (
                            <button
                                key={l.id}
                                className={`pg-mobile-lang-item ${language === l.id ? 'active' : ''}`}
                                onClick={() => {
                                    handleLanguageChange(l.id);
                                    setShowLangMenu(false);
                                }}
                            >
                                <span>{l.icon}</span>
                                <span>{l.label}</span>
                                {language === l.id ? <Check size={14} /> : null}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Status Bar */}
            <div className="pg-status-bar">
                <div className="pg-status-left">
                    <span className="pg-status-item">Ln {cursorPos.line}, Col {cursorPos.col}</span>
                    <span className="pg-status-item">{code.split('\n').length} lines</span>
                    <span className="pg-status-item">{code.length} chars</span>
                </div>
                <div className="pg-status-right">
                    <span className="pg-status-item">{langInfo.icon} {langInfo.label}</span>
                    <span className="pg-status-item">Stage: {runPhaseLabel}</span>
                    <span className="pg-status-item">Last: {lastExecutionMeta ? `${Math.round(lastExecutionMeta.totalMs)}ms` : 'N/A'}</span>
                    <span className="pg-status-item">Font: {fontSize}px</span>
                    <span className="pg-status-item">UTF-8</span>
                </div>
            </div>

            {/* Click-away listener for dropdowns */}
            {(showLangMenu || showSnippets || showTemplates || showThemeMenu) && (
                <div className="pg-overlay" onClick={() => { setShowLangMenu(false); setShowSnippets(false); setShowTemplates(false); setShowThemeMenu(false); }} />
            )}
        </div>
    );
}


