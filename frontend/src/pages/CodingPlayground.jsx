import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
    ArrowLeft, Play, Terminal, Trash2, Copy, Check,
    Download, Upload, Clock, ChevronDown, Code2,
    Braces, Hash, FileCode, Layers, Sparkles, X,
    RotateCcw, Maximize2, Minimize2, Palette,
    Share2, Keyboard, ZoomIn, ZoomOut, History,
    Type, ChevronUp, Link2, TextCursorInput,
    PanelRightOpen, PanelRightClose, Settings, Info
} from 'lucide-react';
import { LANGUAGES, ALGORITHM_TEMPLATES } from '../data/dsaTemplates';
import { EDITOR_THEMES, registerAllThemes, getSavedTheme, saveTheme } from '../data/editorThemes';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
};

// ─── Default starter code per language ───
const DEFAULT_CODE = {
    python: `# 🐍 Python Playground
# Write any Python code here and experiment freely!

def hello():
    print("Hello from PrepLoop Playground!")
    
    # Try out data structures
    nums = [3, 1, 4, 1, 5, 9, 2, 6]
    print(f"Original: {nums}")
    print(f"Sorted:   {sorted(nums)}")
    print(f"Sum:      {sum(nums)}")

hello()
`,
    javascript: `// ⚡ JavaScript Playground
// Write any JavaScript code here and experiment freely!

function hello() {
  console.log("Hello from PrepLoop Playground!");
  
  // Try out data structures
  const nums = [3, 1, 4, 1, 5, 9, 2, 6];
  console.log("Original:", nums);
  console.log("Sorted:  ", [...nums].sort((a, b) => a - b));
  console.log("Sum:     ", nums.reduce((a, b) => a + b, 0));
}

hello();
`,
    cpp: `// ⚙️ C++ Playground
// Write any C++ code here and experiment freely!

#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>
using namespace std;

int main() {
    cout << "Hello from PrepLoop Playground!" << endl;
    
    // Try out data structures
    vector<int> nums = {3, 1, 4, 1, 5, 9, 2, 6};
    
    cout << "Original: ";
    for (int n : nums) cout << n << " ";
    cout << endl;
    
    sort(nums.begin(), nums.end());
    cout << "Sorted:   ";
    for (int n : nums) cout << n << " ";
    cout << endl;
    
    cout << "Sum:      " << accumulate(nums.begin(), nums.end(), 0) << endl;
    
    return 0;
}
`,
    java: `// ☕ Java Playground
// Write any Java code here and experiment freely!

import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from PrepLoop Playground!");
        
        // Try out data structures
        int[] nums = {3, 1, 4, 1, 5, 9, 2, 6};
        
        System.out.println("Original: " + Arrays.toString(nums));
        
        int[] sorted = nums.clone();
        Arrays.sort(sorted);
        System.out.println("Sorted:   " + Arrays.toString(sorted));
        
        int sum = IntStream.of(nums).sum();
        System.out.println("Sum:      " + sum);
    }
}
`,
    go: `// 🔷 Go Playground
// Write any Go code here and experiment freely!

package main

import (
    "fmt"
    "sort"
)

func main() {
    fmt.Println("Hello from PrepLoop Playground!")
    
    // Try out data structures
    nums := []int{3, 1, 4, 1, 5, 9, 2, 6}
    fmt.Println("Original:", nums)
    
    sorted := make([]int, len(nums))
    copy(sorted, nums)
    sort.Ints(sorted)
    fmt.Println("Sorted:  ", sorted)
    
    sum := 0
    for _, n := range nums {
        sum += n
    }
    fmt.Println("Sum:     ", sum)
}
`,
};

// ─── Quick snippet templates ───
const SNIPPETS = [
    {
        label: 'For Loop',
        icon: '🔁',
        code: {
            python: `for i in range(n):\n    pass`,
            javascript: `for (let i = 0; i < n; i++) {\n  \n}`,
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

    // Editor state
    const [language, setLanguage] = useState(() =>
        localStorage.getItem('playground-lang') || 'python'
    );
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
    const [stdinInput, setStdinInput] = useState('');
    const [showStdin, setShowStdin] = useState(false);
    const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem('pg-font-size')) || 14);
    const [execHistory, setExecHistory] = useState(() => {
        try { return JSON.parse(localStorage.getItem('pg-exec-history') || '[]'); } catch { return []; }
    });
    const [showHistory, setShowHistory] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
    const [shareCopied, setShareCopied] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);
    const [sidebarTab, setSidebarTab] = useState('input');

    // Console resize ref
    const draggingRef = useRef(null);
    const monacoRef = useRef(null);
    const rootRef = useRef(null);
    const consoleEndRef = useRef(null);

    // ─── Load saved code or default ───
    useEffect(() => {
        const saved = localStorage.getItem(`playground-code-${language}`);
        setCode(saved || DEFAULT_CODE[language] || '');
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
        setRunning(true);
        const timestamp = new Date().toLocaleTimeString();
        setConsoleOutput(prev => [...prev, { type: 'info', text: `[${timestamp}] Running ${language}...` }]);

        try {
            const res = await fetch(`${API_URL}/api/practice/execute`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ code, language, input: stdinInput }),
            });
            const data = await res.json();
            const outputText = (data.output || '').trim();
            const errorText = (data.error || '').trim();
            const outputLines = [];

            if (data.success && outputText) {
                outputText.split('\n').forEach(line => {
                    outputLines.push({ type: 'output', text: line });
                });
            } else if (!data.success && errorText) {
                errorText.split('\n').forEach(line => {
                    outputLines.push({ type: 'error', text: line });
                });
            } else if (outputText) {
                outputText.split('\n').forEach(line => {
                    outputLines.push({ type: 'output', text: line });
                });
            } else {
                outputLines.push({ type: 'info', text: '(No output — use console.log() or print() to see results)' });
            }

            const runtime = data.executionTime ? `${Math.round(data.executionTime)}ms` : 'N/A';
            outputLines.push({ type: 'info', text: `\n⏱ Runtime: ${runtime}` });
            setConsoleOutput(prev => [...prev, ...outputLines]);

            // Save to execution history
            const histEntry = {
                id: Date.now(),
                timestamp,
                language,
                codeSnippet: code.slice(0, 100),
                outputPreview: outputText.slice(0, 80) || errorText.slice(0, 80) || 'No output',
                success: data.success,
            };
            setExecHistory(prev => {
                const updated = [histEntry, ...prev].slice(0, 10);
                localStorage.setItem('pg-exec-history', JSON.stringify(updated));
                return updated;
            });
        } catch (err) {
            setConsoleOutput(prev => [...prev, { type: 'error', text: `Network error: ${err.message}` }]);
        } finally {
            setRunning(false);
        }
    }, [code, language, stdinInput]);

    // ─── Font size ───
    const handleFontSize = (delta) => {
        setFontSize(prev => {
            const next = Math.max(10, Math.min(24, prev + delta));
            localStorage.setItem('pg-font-size', next);
            return next;
        });
    };

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
            } else if (e.ctrlKey && e.key === 'i') {
                e.preventDefault();
                setShowStdin(s => !s);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleRun]);

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

    const langInfo = LANGUAGES.find(l => l.id === language) || LANGUAGES[0];

    return (
        <div className="pg-root" ref={rootRef}>
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

                <div className="pg-topbar-center">
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
                                {SNIPPETS.map((s, i) => (
                                    <button
                                        key={i}
                                        className="pg-dropdown-item"
                                        onClick={() => insertSnippet(s.code[language] || s.code.python)}
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
                                {Object.entries(ALGORITHM_TEMPLATES).map(([key, tmpl]) => (
                                    <button
                                        key={key}
                                        className="pg-dropdown-item"
                                        onClick={() => insertTemplate(tmpl)}
                                    >
                                        <span>{tmpl.icon}</span>
                                        <span>{tmpl.name}</span>
                                        <span className="pg-complexity">{tmpl.complexity.time}</span>
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
                <div className="pg-topbar-center">
                    <button className="pg-run-btn" onClick={handleRun} disabled={running} style={{ padding: '8px 24px', fontSize: '13px', borderRadius: '10px' }}>
                        <Play size={16} style={{ fill: 'currentColor' }} />
                        <span>{running ? 'Running...' : 'Run Code'}</span>
                        <kbd style={{ marginLeft: '8px' }}>Ctrl+&#x21b5;</kbd>
                    </button>
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
                    <button className={`pg-toolbar-btn-icon ${showSidebar ? 'pg-active' : ''}`} onClick={() => setShowSidebar(s => !s)} title="Toggle sidebar">
                        {showSidebar ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
                    </button>
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
                    <div className="pg-console" style={{ height: consoleHeight }}>
                        <div className="pg-console-resize" onMouseDown={handleResizeMouseDown}>
                            <div className="pg-console-resize-bar" />
                        </div>
                        <div className="pg-console-header">
                            <div className="pg-console-title">
                                <Terminal size={13} />
                                <span>Console</span>
                                <span className="pg-console-count">{consoleOutput.length} lines</span>
                            </div>
                            <button className="pg-console-clear" onClick={clearConsole}>
                                <Trash2 size={12} /><span>Clear</span>
                            </button>
                        </div>
                        <div className="pg-console-body">
                            {consoleOutput.length === 0 ? (
                                <div className="pg-console-empty">
                                    <Terminal size={24} strokeWidth={1} />
                                    <p>Run your code to see output here</p>
                                    <kbd>Ctrl + Enter</kbd>
                                </div>
                            ) : (
                                consoleOutput.map((line, i) => (
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
                <div className={`pg-sidebar ${!showSidebar ? 'pg-sidebar-collapsed' : ''}`}>
                    <div className="pg-sidebar-tabs" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center', width: '100%' }}>
                            {[
                                { id: 'input', icon: <TextCursorInput size={16} />, label: 'Input' },
                                { id: 'history', icon: <History size={16} />, label: 'History' },
                                { id: 'shortcuts', icon: <Keyboard size={16} />, label: 'Keys' },
                                { id: 'info', icon: <Info size={16} />, label: 'Info' },
                            ].map(tab => (
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
                        {sidebarTab === 'input' && (
                            <div className="pg-sidebar-section">
                                <div className="pg-sidebar-section-header">
                                    <TextCursorInput size={14} />
                                    <span>Input (stdin)</span>
                                </div>
                                <textarea
                                    className="pg-stdin-input pg-sidebar-textarea"
                                    value={stdinInput}
                                    onChange={e => setStdinInput(e.target.value)}
                                    placeholder={"Enter input for your program...\nEach line = one input\n\nPython: input()\nC++: cin >> x\nJava: Scanner"}
                                    spellCheck={false}
                                />
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
                                        ['Ctrl + I', 'Input panel'],
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

            {/* Status Bar */}
            <div className="pg-status-bar">
                <div className="pg-status-left">
                    <span className="pg-status-item">Ln {cursorPos.line}, Col {cursorPos.col}</span>
                    <span className="pg-status-item">{code.split('\n').length} lines</span>
                    <span className="pg-status-item">{code.length} chars</span>
                </div>
                <div className="pg-status-right">
                    <span className="pg-status-item">{langInfo.icon} {langInfo.label}</span>
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

