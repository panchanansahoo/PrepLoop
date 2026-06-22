import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Code2, X, Play, RotateCcw, Loader2, CheckCircle } from 'lucide-react';
import './CodeEditorPanel.css';

const LANGUAGES = [
    { id: 'python', label: 'Python', icon: '🐍' },
    { id: 'javascript', label: 'JavaScript', icon: '🟨' },
    { id: 'java', label: 'Java', icon: '☕' },
    { id: 'cpp', label: 'C++', icon: '⚙️' },
    { id: 'go', label: 'Go', icon: '🔵' },
    { id: 'typescript', label: 'TypeScript', icon: '🔷' },
];

const BOILERPLATE = {
    python: `# Write your solution here\ndef solution():\n    pass\n\n# Test your solution\nif __name__ == "__main__":\n    print(solution())\n`,
    javascript: `// Write your solution here\nfunction solution() {\n    \n}\n\n// Test your solution\nconsole.log(solution());\n`,
    java: `// Write your solution here\nclass Solution {\n    public static void main(String[] args) {\n        \n    }\n}\n`,
    cpp: `// Write your solution here\n#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n`,
    go: `// Write your solution here\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println()\n}\n`,
    typescript: `// Write your solution here\nfunction solution(): void {\n    \n}\n\n// Test\nsolution();\n`,
};

export default function CodeEditorPanel({
    isOpen,
    onClose,
    code,
    onCodeChange,
    language,
    onLanguageChange,
    codeFeedback,
    onSubmitCode,
    loading
}) {
    const [lineCount, setLineCount] = useState(1);
    const activeTemplate = BOILERPLATE[language] || BOILERPLATE.python;

    useEffect(() => {
        if (isOpen && !code) {
            onCodeChange(activeTemplate);
        }
    }, [activeTemplate, code, isOpen, onCodeChange]);

    useEffect(() => {
        setLineCount(code ? code.split('\n').length : 1);
    }, [code]);

    const handleEditorMount = (editor) => {
        const model = editor.getModel();
        if (model) {
            setLineCount(model.getLineCount());
        }
    };

    const handleReset = () => {
        onCodeChange(activeTemplate);
    };

    const handleLanguageChange = (newLang) => {
        onLanguageChange(newLang);
        if (!code || code.trim() === '' || code === activeTemplate) {
            onCodeChange(BOILERPLATE[newLang] || BOILERPLATE.python);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="code-editor-panel">
            {/* Header */}
            <div className="code-editor-header">
                <h3><Code2 size={14} /> Code Editor</h3>
                <div className="code-editor-controls">
                    <select
                        className="code-lang-select"
                        value={language}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                    >
                        {LANGUAGES.map(lang => (
                            <option key={lang.id} value={lang.id}>
                                {lang.icon} {lang.label}
                            </option>
                        ))}
                    </select>
                    <button className="code-close-btn" onClick={onClose} title="Close Editor">
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Editor */}
            <div className="code-editor-body">
                <Editor
                    height="100%"
                    language={language === 'cpp' ? 'cpp' : language}
                    value={code}
                    onChange={(value) => onCodeChange(value || '')}
                    onMount={handleEditorMount}
                    theme="vs-dark"
                    options={{
                        fontSize: 13,
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        lineNumbers: 'on',
                        wordWrap: 'on',
                        tabSize: 4,
                        automaticLayout: true,
                        padding: { top: 10 },
                        suggestOnTriggerCharacters: true,
                        bracketPairColorization: { enabled: true },
                        smoothScrolling: true,
                        cursorBlinking: 'smooth',
                        cursorSmoothCaretAnimation: 'on',
                    }}
                />
            </div>

            {/* Code Feedback (if available) */}
            {codeFeedback && (
                <div className="code-feedback">
                    <h4><CheckCircle size={12} /> Code Review</h4>
                    <div className="code-feedback-grid">
                        <div className="code-metric">
                            <div className="code-metric-label">Correctness</div>
                            <div className={`code-metric-value ${codeFeedback.correctness}`}>
                                {codeFeedback.correctness === 'pass' ? '✅ Pass' : codeFeedback.correctness === 'partial' ? '⚠️ Partial' : '❌ Fail'}
                            </div>
                        </div>
                        <div className="code-metric">
                            <div className="code-metric-label">Time</div>
                            <div className="code-metric-value">{codeFeedback.timeComplexity || 'N/A'}</div>
                        </div>
                        <div className="code-metric">
                            <div className="code-metric-label">Space</div>
                            <div className="code-metric-value">{codeFeedback.spaceComplexity || 'N/A'}</div>
                        </div>
                        <div className="code-metric">
                            <div className="code-metric-label">Quality</div>
                            <div className={`code-metric-value ${codeFeedback.quality >= 7 ? 'good' : codeFeedback.quality >= 4 ? 'ok' : 'poor'}`}>
                                {codeFeedback.quality}/10
                            </div>
                        </div>
                    </div>
                    {codeFeedback.issues && codeFeedback.issues.length > 0 && (
                        <ul className="code-issues">
                            {codeFeedback.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                        </ul>
                    )}
                    {codeFeedback.optimizedApproach && (
                        <p style={{ fontSize: 11, color: '#8b5cf6', marginTop: 6 }}>
                            💡 {codeFeedback.optimizedApproach}
                        </p>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className="code-editor-footer">
                <span className="code-line-count">{lineCount} lines</span>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="code-close-btn" onClick={handleReset} title="Reset to template">
                        <RotateCcw size={12} />
                    </button>
                    <button
                        className="code-submit-btn"
                        onClick={onSubmitCode}
                        disabled={loading || !code?.trim()}
                    >
                        {loading ? <Loader2 size={12} className="spinning" /> : <Play size={12} />}
                        Submit Code
                    </button>
                </div>
            </div>
        </div>
    );
}
