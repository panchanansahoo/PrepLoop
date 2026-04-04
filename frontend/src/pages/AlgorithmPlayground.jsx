import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    Play, Pause, SkipForward, SkipBack, RotateCcw,
    ChevronRight, ChevronLeft, Zap, Clock, Cpu,
    FastForward, Rewind, Settings2, Info, Search,
    ArrowLeft, Filter, Sparkles, Maximize2, ChevronDown,
    Lightbulb, BookOpen, Keyboard, HardDrive
} from 'lucide-react';
import { ALGORITHMS, generateSteps } from '../data/algorithmVisualizations';
import { ALGORITHM_CODES } from '../data/algorithmCodes';
import { ALGORITHM_CODES_MULTI, CODE_LANGUAGES } from '../data/algorithmCodesMulti';
import ArrayVisualizer from '../components/visualizer/ArrayVisualizer';
import GraphVisualizer from '../components/visualizer/GraphVisualizer';
import CodePanel from '../components/visualizer/CodePanel';

const SPEED_OPTIONS = [
    { label: '0.5×', value: 1200 },
    { label: '1×', value: 600 },
    { label: '1.5×', value: 400 },
    { label: '2×', value: 300 },
    { label: '4×', value: 150 },
];

// ─── Category metadata for catalog view ───
const CATEGORIES = [
    { id: 'sorting', label: 'Sorting', icon: '📊', gradient: 'linear-gradient(135deg, #f472b6, #ec4899)' },
    { id: 'array', label: 'Array', icon: '📋', gradient: 'linear-gradient(135deg, #60a5fa, #3b82f6)' },
    { id: 'string', label: 'String', icon: '🔤', gradient: 'linear-gradient(135deg, #22d3ee, #06b6d4)' },
    { id: 'hash-table', label: 'Hash Table', icon: '🗃️', gradient: 'linear-gradient(135deg, #fb923c, #f97316)' },
    { id: 'searching', label: 'Binary Search', icon: '🔍', gradient: 'linear-gradient(135deg, #60a5fa, #3b82f6)' },
    { id: 'two-pointers', label: 'Two Pointers', icon: '↔️', gradient: 'linear-gradient(135deg, #60a5fa, #818cf8)' },
    { id: 'sliding-window', label: 'Sliding Window', icon: '🪟', gradient: 'linear-gradient(135deg, #34d399, #10b981)' },
    { id: 'prefix-sum', label: 'Prefix Sum', icon: '➕', gradient: 'linear-gradient(135deg, #a78bfa, #8b5cf6)' },
    { id: 'kadanes', label: "Kadane's Algorithm", icon: '📈', gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b)' },
    { id: 'matrix', label: 'Matrix', icon: '🔲', gradient: 'linear-gradient(135deg, #818cf8, #6366f1)' },
    { id: 'stack', label: 'Stack', icon: '📚', gradient: 'linear-gradient(135deg, #f97316, #ea580c)' },
    { id: 'queue', label: 'Queue', icon: '📬', gradient: 'linear-gradient(135deg, #22d3ee, #0891b2)' },
    { id: 'intervals', label: 'Intervals', icon: '🔗', gradient: 'linear-gradient(135deg, #f472b6, #e879f9)' },
    { id: 'graph', label: 'Graph', icon: '🕸️', gradient: 'linear-gradient(135deg, #22d3ee, #06b6d4)' },
    { id: 'backtracking', label: 'Backtracking', icon: '🌳', gradient: 'linear-gradient(135deg, #c084fc, #a855f7)' },
    { id: 'greedy', label: 'Greedy', icon: '🏆', gradient: 'linear-gradient(135deg, #4ade80, #22c55e)' },
    { id: 'dp', label: 'Dynamic Programming', icon: '🧬', gradient: 'linear-gradient(135deg, #22d3ee, #ef4444)' },
    { id: 'bit-manipulation', label: 'Bit Manipulation', icon: '💻', gradient: 'linear-gradient(135deg, #e879f9, #d946ef)' },
];

const DIFFICULTY_COLORS = {
    Easy: { bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.25)', text: '#4ade80' },
    Medium: { bg: 'rgba(251, 191, 36, 0.12)', border: 'rgba(251, 191, 36, 0.25)', text: '#fbbf24' },
    Hard: { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.25)', text: '#f87171' },
};

// ═══════════════════════════════════════════
//  CATALOG VIEW — AlgoMaster-style grid
// ═══════════════════════════════════════════
function CatalogView({ onSelectAlgorithm }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState('all');
    const [hoveredCard, setHoveredCard] = useState(null);

    // Group algorithms by category
    const groupedAlgorithms = useMemo(() => {
        const groups = {};
        ALGORITHMS.forEach(algo => {
            if (!groups[algo.category]) groups[algo.category] = [];
            groups[algo.category].push(algo);
        });
        return groups;
    }, []);

    // Filter algorithms
    const filteredCategories = useMemo(() => {
        return CATEGORIES.map(cat => {
            const algos = (groupedAlgorithms[cat.id] || []).filter(algo => {
                const matchesSearch = searchQuery === '' ||
                    algo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    algo.description.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesDifficulty = difficultyFilter === 'all' || algo.difficulty === difficultyFilter;
                return matchesSearch && matchesDifficulty;
            });
            return { ...cat, algorithms: algos };
        }).filter(cat => cat.algorithms.length > 0);
    }, [groupedAlgorithms, searchQuery, difficultyFilter]);

    const totalAlgorithms = ALGORITHMS.length;
    const shownAlgorithms = filteredCategories.reduce((sum, cat) => sum + cat.algorithms.length, 0);

    return (
        <div className="algo-catalog">
            {/* Hero Header */}
            <div className="algo-catalog-hero">
                <div className="algo-catalog-hero-glow" />
                <div className="algo-catalog-hero-content">
                    <div className="algo-catalog-badge">
                        <Sparkles size={14} />
                        <span>Interactive Visualizations</span>
                    </div>
                    <h1 className="algo-catalog-title">
                        DSA <span className="text-gradient-anim">Animations</span>
                    </h1>
                    <p className="algo-catalog-subtitle">
                        Step through {totalAlgorithms} algorithms with interactive visualizations.
                        Watch every comparison, swap, and traversal come alive.
                    </p>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="algo-catalog-controls">
                <div className="algo-search-wrapper">
                    <Search size={16} className="algo-search-icon" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search algorithms..."
                        className="algo-search-input"
                    />
                    {searchQuery && (
                        <span className="algo-search-count">{shownAlgorithms} found</span>
                    )}
                </div>
                <div className="algo-diff-filters">
                    {['all', 'Easy', 'Medium', 'Hard'].map(d => (
                        <button
                            key={d}
                            onClick={() => setDifficultyFilter(d)}
                            className={`algo-diff-pill ${difficultyFilter === d ? 'active' : ''}`}
                            data-difficulty={d}
                        >
                            {d === 'all' ? 'All' : d}
                        </button>
                    ))}
                </div>
            </div>

            {/* Category Sections */}
            <div className="algo-catalog-sections">
                {filteredCategories.map((cat, catIdx) => (
                    <div key={cat.id} className="algo-cat-section" style={{ animationDelay: `${catIdx * 60}ms` }}>
                        {/* Category Header */}
                        <div className="algo-cat-header">
                            <div className="algo-cat-icon" style={{ background: cat.gradient }}>
                                <span>{cat.icon}</span>
                            </div>
                            <div>
                                <h2 className="algo-cat-title">{cat.label}</h2>
                                <span className="algo-cat-count">{cat.algorithms.length} animation{cat.algorithms.length !== 1 ? 's' : ''}</span>
                            </div>
                        </div>

                        {/* Algorithm Cards Grid */}
                        <div className="algo-cards-grid">
                            {cat.algorithms.map((algo, idx) => {
                                const dc = DIFFICULTY_COLORS[algo.difficulty] || DIFFICULTY_COLORS.Easy;
                                const isHovered = hoveredCard === algo.id;
                                return (
                                    <button
                                        key={algo.id}
                                        className={`algo-card ${isHovered ? 'hovered' : ''}`}
                                        onClick={() => onSelectAlgorithm(algo)}
                                        onMouseEnter={() => setHoveredCard(algo.id)}
                                        onMouseLeave={() => setHoveredCard(null)}
                                        style={{
                                            '--card-color': algo.color,
                                            '--card-delay': `${(catIdx * 4 + idx) * 40}ms`,
                                        }}
                                    >
                                        {/* Difficulty badge */}
                                        <span className="algo-card-diff" style={{
                                            background: dc.bg,
                                            border: `1px solid ${dc.border}`,
                                            color: dc.text,
                                        }}>
                                            {algo.difficulty}
                                        </span>

                                        {/* Card content */}
                                        <div className="algo-card-body">
                                            <div className="algo-card-icon-wrap">
                                                <span className="algo-card-icon">{algo.icon}</span>
                                            </div>
                                            <h3 className="algo-card-name">{algo.name}</h3>
                                            <p className="algo-card-desc">{algo.description}</p>
                                        </div>

                                        {/* Bottom bar */}
                                        <div className="algo-card-footer">
                                            <span className="algo-card-complexity">
                                                <Clock size={10} /> {algo.complexity.time}
                                            </span>
                                            <span className="algo-card-action">
                                                Visualize <ChevronRight size={12} />
                                            </span>
                                        </div>

                                        {/* Hover glow */}
                                        <div className="algo-card-glow" style={{ background: algo.color }} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {filteredCategories.length === 0 && (
                    <div className="algo-empty">
                        <Search size={48} strokeWidth={1} />
                        <h3>No algorithms found</h3>
                        <p>Try a different search query or filter</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════
//  VISUALIZER VIEW — AlgoMaster split-screen
// ═══════════════════════════════════════════
function VisualizerView({ algorithm, onBack }) {
    const [selectedAlgo, setSelectedAlgo] = useState(algorithm);
    const [steps, setSteps] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1); // index into SPEED_OPTIONS, default 1×
    const [customInput, setCustomInput] = useState('');
    const [searchTarget, setSearchTarget] = useState('');
    const [inputMode, setInputMode] = useState('preset1'); // preset1, preset2, custom
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('javascript');
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [showAlgoInfo, setShowAlgoInfo] = useState(false);
    const intervalRef = useRef(null);

    const regenerateSteps = useCallback(() => {
        setIsPlaying(false);
        setCurrentStep(0);
        const algo = selectedAlgo;
        let input, extra = {};

        if (algo.category === 'graph' || algo.id === 'topological-sort') {
            input = algo.defaultGraph;
            extra.start = 0;
        } else if (algo.id === 'union-find') {
            input = algo.defaultGraph;
        } else if (algo.id === 'dp-fibonacci') {
            input = null;
            extra.dpN = algo.dpN || 8;
        } else if (algo.id === 'dp-knapsack') {
            input = algo.knapsackData;
        } else if (algo.id === 'greedy' || algo.id === 'merge-intervals') {
            input = algo.defaultInput;
        } else {
            if (inputMode === 'custom' && customInput.trim()) {
                input = customInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
            } else {
                input = [...algo.defaultInput];
            }
            if (algo.id.includes('search') || algo.id === 'two-pointers') {
                extra.target = searchTarget ? parseInt(searchTarget) : algo.searchTarget;
            }
            if (algo.id === 'sliding-window') {
                extra.windowSize = algo.windowSize || 3;
            }
        }
        const newSteps = generateSteps(algo.id, input, extra);
        setSteps(newSteps);
    }, [selectedAlgo, customInput, searchTarget, inputMode]);

    useEffect(() => { regenerateSteps(); }, [selectedAlgo]);

    useEffect(() => {
        if (isPlaying && currentStep < steps.length - 1) {
            intervalRef.current = setTimeout(() => {
                setCurrentStep(s => s + 1);
            }, SPEED_OPTIONS[speed].value);
        } else if (currentStep >= steps.length - 1) {
            setIsPlaying(false);
        }
        return () => clearTimeout(intervalRef.current);
    }, [isPlaying, currentStep, speed, steps.length]);

    const stepForward = () => setCurrentStep(s => Math.min(s + 1, steps.length - 1));
    const stepBack = () => setCurrentStep(s => Math.max(s - 1, 0));
    const reset = () => { setIsPlaying(false); setCurrentStep(0); };
    const togglePlay = () => {
        if (currentStep >= steps.length - 1) { setCurrentStep(0); }
        setIsPlaying(p => !p);
    };

    // ─── Keyboard shortcuts ───
    useEffect(() => {
        const handler = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            switch (e.key) {
                case ' ':
                case 'k': e.preventDefault(); togglePlay(); break;
                case 'ArrowRight':
                case 'l': e.preventDefault(); stepForward(); break;
                case 'ArrowLeft':
                case 'j': e.preventDefault(); stepBack(); break;
                case 'r': e.preventDefault(); reset(); break;
                case 'ArrowUp': e.preventDefault(); setSpeed(s => Math.min(s + 1, SPEED_OPTIONS.length - 1)); break;
                case 'ArrowDown': e.preventDefault(); setSpeed(s => Math.max(s - 1, 0)); break;
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [steps.length, currentStep, isPlaying]);

    const currentFrame = steps[currentStep] || {};
    const progress = steps.length > 1 ? (currentStep / (steps.length - 1)) * 100 : 0;
    const isGraphAlgo = selectedAlgo.category === 'graph' || selectedAlgo.id === 'topological-sort';
    const isSearchAlgo = selectedAlgo.id.includes('search') || selectedAlgo.id === 'two-pointers';
    const hasDefaultInput = selectedAlgo.defaultInput && !Array.isArray(selectedAlgo.defaultInput?.[0]);
    const multiCode = ALGORITHM_CODES_MULTI[selectedAlgo.id];
    const codeData = ALGORITHM_CODES[selectedAlgo.id];
    const currentCode = multiCode?.[selectedLanguage] || multiCode?.javascript || codeData?.code || '';
    const activeLine = (multiCode?.stepToLine || codeData?.stepToLine)?.(currentFrame) ?? -1;
    const currentLangInfo = CODE_LANGUAGES.find(l => l.id === selectedLanguage) || CODE_LANGUAGES[0];

    // Determine step phase type for message styling
    const getStepPhase = () => {
        if (!currentFrame.message) return 'idle';
        if (currentFrame.message.includes('✅') || currentFrame.message.includes('Found')) return 'success';
        if (currentFrame.message.includes('❌')) return 'failure';
        if (currentFrame.swapping) return 'swap';
        if (currentFrame.comparing) return 'compare';
        return 'info';
    };
    const stepPhase = getStepPhase();

    return (
        <div className="viz-page">
            {/* ─── Top Bar ─── */}
            <div className="viz-topbar">
                <button onClick={onBack} className="viz-back-btn">
                    <ArrowLeft size={16} />
                    <span>Back</span>
                </button>
                <div className="viz-topbar-center">
                    <span className="viz-algo-icon">{selectedAlgo.icon}</span>
                    <h1 className="viz-title">{selectedAlgo.name}</h1>
                </div>
                <div className="viz-topbar-meta">
                    <span className="viz-meta-pill" title="Time Complexity">
                        <Clock size={10} /> {selectedAlgo.complexity.time}
                    </span>
                    <span className="viz-meta-pill" title="Space Complexity">
                        <HardDrive size={10} /> {selectedAlgo.complexity.space}
                    </span>
                    <button className="viz-info-toggle" onClick={() => setShowAlgoInfo(s => !s)} title="Algorithm Info">
                        <Lightbulb size={14} />
                    </button>
                </div>
            </div>

            {/* ─── Algorithm Info Panel ─── */}
            {showAlgoInfo && (
                <div className="viz-info-panel">
                    <div className="viz-info-panel-inner">
                        <BookOpen size={16} />
                        <p>{selectedAlgo.description}</p>
                    </div>
                    <div className="viz-info-shortcuts">
                        <Keyboard size={12} />
                        <span><kbd>Space</kbd> Play/Pause</span>
                        <span><kbd>←</kbd><kbd>→</kbd> Step</span>
                        <span><kbd>↑</kbd><kbd>↓</kbd> Speed</span>
                        <span><kbd>R</kbd> Reset</span>
                    </div>
                </div>
            )}

            {/* ─── Split Screen Content ─── */}
            <div className="viz-split">
                {/* LEFT: Code Panel */}
                <div className="viz-code-side">
                    {(multiCode || codeData) ? (
                        <div className="viz-code-panel">
                            <div className="viz-code-header">
                                <div className="viz-code-dots">
                                    <span className="dot red" />
                                    <span className="dot yellow" />
                                    <span className="dot green" />
                                </div>
                                <div className="viz-lang-selector">
                                    <button className="viz-lang-btn" onClick={() => setShowLangMenu(s => !s)}>
                                        <span className="viz-lang-icon">{currentLangInfo.icon}</span>
                                        <span>{currentLangInfo.label}</span>
                                        <ChevronDown size={12} />
                                    </button>
                                    {showLangMenu && (
                                        <div className="viz-lang-menu">
                                            {CODE_LANGUAGES.map(lang => (
                                                <button
                                                    key={lang.id}
                                                    className={`viz-lang-option ${selectedLanguage === lang.id ? 'active' : ''}`}
                                                    onClick={() => { setSelectedLanguage(lang.id); setShowLangMenu(false); }}
                                                >
                                                    <span className="viz-lang-icon">{lang.icon}</span>
                                                    {lang.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="viz-code-body">
                                {currentCode.split('\n').map((line, i) => {
                                    const lineNum = i + 1;
                                    const isActive = lineNum === activeLine;
                                    return (
                                        <div key={i} className={`viz-code-line ${isActive ? 'active' : ''}`}>
                                            <span className="viz-line-num">{lineNum}</span>
                                            <span className="viz-line-text">
                                                <CodeLine text={line} />
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="viz-code-panel viz-no-code">
                            <div className="viz-code-header">
                                <div className="viz-code-dots">
                                    <span className="dot red" />
                                    <span className="dot yellow" />
                                    <span className="dot green" />
                                </div>
                            </div>
                            <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                                <p>Code panel not available for this algorithm</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT: Animation Area */}
                <div className="viz-anim-side">
                    {/* Input selector (presets) */}
                    {hasDefaultInput && (
                        <div className="viz-input-bar">
                            <button
                                className={`viz-input-tab ${inputMode === 'preset1' ? 'active' : ''}`}
                                onClick={() => { setInputMode('preset1'); setCustomInput(''); }}
                            >
                                Input 1
                            </button>
                            <button
                                className={`viz-input-tab ${inputMode === 'custom' ? 'active' : ''}`}
                                onClick={() => setInputMode('custom')}
                            >
                                Custom
                            </button>
                            {inputMode === 'custom' && (
                                <div className="viz-custom-input">
                                    <input
                                        value={customInput}
                                        onChange={e => setCustomInput(e.target.value)}
                                        placeholder={selectedAlgo.defaultInput?.join(', ')}
                                        className="viz-input-field"
                                    />
                                    {isSearchAlgo && selectedAlgo.searchTarget !== undefined && (
                                        <input
                                            value={searchTarget}
                                            onChange={e => setSearchTarget(e.target.value)}
                                            placeholder={`Target: ${selectedAlgo.searchTarget}`}
                                            className="viz-input-field"
                                        />
                                    )}
                                    <button onClick={regenerateSteps} className="viz-apply-btn">Apply</button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Animation Canvas */}
                    <div className="viz-canvas">
                        <div className="viz-canvas-inner">
                            {isGraphAlgo ? (
                                <GraphVisualizer step={currentFrame} />
                            ) : currentFrame.array ? (
                                <ArrayVisualizer step={currentFrame} algorithmId={selectedAlgo.id} />
                            ) : (
                                <div className="viz-special-render">
                                    <div style={{ fontSize: 48, marginBottom: 16 }}>{selectedAlgo.icon}</div>
                                    <p className="viz-message">
                                        {currentFrame.message || 'Press Play to start visualization'}
                                    </p>
                                    {/* DP Table */}
                                    {currentFrame.dpTable && (
                                        <div className="viz-dp-table">
                                            <table>
                                                <tbody>
                                                    {currentFrame.dpTable.map?.((row, i) => (
                                                        <tr key={i}>
                                                            {(Array.isArray(row) ? row : [row]).map((cell, j) => (
                                                                <td key={j} className={
                                                                    currentFrame.currentItem === i && currentFrame.currentWeight === j ? 'dp-active' : ''
                                                                }>{cell}</td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                    {/* Subsets result */}
                                    {currentFrame.result && (
                                        <div className="viz-subsets">
                                            {currentFrame.result.map((subset, i) => (
                                                <span key={i} className="viz-subset-chip">[{subset.join(',')}]</span>
                                            ))}
                                        </div>
                                    )}
                                    {/* Union-Find parent display */}
                                    {currentFrame.parent && (
                                        <div className="viz-uf-nodes">
                                            {currentFrame.nodes.map((node, i) => (
                                                <div key={i} className="viz-uf-node">
                                                    <div className={`viz-uf-circle ${currentFrame.highlights?.includes(node) ? 'highlighted' : ''}`}>
                                                        {node}
                                                    </div>
                                                    <div className="viz-uf-parent">p={currentFrame.parent[i]}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {/* Bit manipulation */}
                                    {currentFrame.binary && (
                                        <div className="viz-bits">
                                            {currentFrame.binary.split('').map((bit, i) => (
                                                <span key={i} className={`viz-bit ${bit === '1' ? 'on' : ''}`}>{bit}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ─── Watch Window (debugger-style) ─── */}
                    {(() => {
                        const SKIP_KEYS = new Set([
                            'array', 'highlights', 'sorted', 'message', 'comparing', 'swapping',
                            'nodes', 'edges', 'intervals', 'result', 'current', 'ranges',
                            'dpTable', 'weights', 'values', 'eliminated', 'checked',
                            'exploring', 'skipped', 'action', 'sets', 'binary',
                            'partitionBoundary', 'prefix',
                        ]);
                        let vars = currentFrame.variables;
                        if (!vars || Object.keys(vars).length === 0) {
                            vars = {};
                            for (const [k, v] of Object.entries(currentFrame)) {
                                if (SKIP_KEYS.has(k)) continue;
                                if (typeof v === 'number') vars[k] = v;
                                else if (typeof v === 'boolean') vars[k] = v;
                                else if (typeof v === 'string' && v.length < 30) vars[k] = v;
                                else if (Array.isArray(v) && v.length <= 12 && v.every(x => typeof x === 'number' || typeof x === 'string'))
                                    vars[k] = `[${v.join(', ')}]`;
                            }
                        }
                        const entries = vars ? Object.entries(vars) : [];
                        if (entries.length === 0) return null;

                        const getTypeClass = (v) => {
                            if (typeof v === 'number') return 'watch-num';
                            if (typeof v === 'boolean') return 'watch-bool';
                            if (typeof v === 'string' && v.startsWith('[')) return 'watch-arr';
                            return 'watch-str';
                        };

                        return (
                            <div className="watch-window">
                                <div className="watch-header">
                                    <Cpu size={11} />
                                    <span>Watch</span>
                                    <span className="watch-count">{entries.length}</span>
                                </div>
                                <div className="watch-body">
                                    {entries.map(([k, v]) => (
                                        <div key={k} className="watch-row">
                                            <span className="watch-name">{k}</span>
                                            <span className={`watch-value ${getTypeClass(v)}`}>
                                                {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}

                    {/* ─── Step Explanation Panel ─── */}
                    <div className={`viz-step-msg viz-step-${stepPhase}`}>
                        <span className="viz-step-num">{currentStep}</span>
                        <div className="viz-step-content">
                            <span className="viz-step-text">
                                {currentFrame.message || '▶️ Press Play or use Arrow Keys to step through the algorithm'}
                            </span>
                            {currentStep === 0 && steps.length > 1 && (
                                <span className="viz-step-hint">
                                    💡 Tip: Use <kbd>Space</kbd> to play and <kbd>←</kbd> <kbd>→</kbd> to step through
                                </span>
                            )}
                        </div>
                        <span className="viz-step-progress">
                            {Math.round(progress)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* ─── Bottom Playback Controls ─── */}
            <div className="viz-controls">
                <div className="viz-controls-inner">
                    {/* Left: play / step buttons */}
                    <div className="viz-ctrl-group">
                        <button onClick={stepBack} className="viz-ctrl-btn" disabled={currentStep === 0} title="Previous Step">
                            <SkipBack size={16} />
                        </button>
                        <button onClick={togglePlay} className="viz-ctrl-play" title={isPlaying ? 'Pause' : 'Play'}>
                            {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: 2 }} />}
                        </button>
                        <button onClick={stepForward} className="viz-ctrl-btn" disabled={currentStep >= steps.length - 1} title="Next Step">
                            <SkipForward size={16} />
                        </button>
                        <button onClick={reset} className="viz-ctrl-btn" title="Reset">
                            <RotateCcw size={14} />
                        </button>
                    </div>

                    {/* Center: progress bar */}
                    <div className="viz-progress-wrap" onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pct = (e.clientX - rect.left) / rect.width;
                        setCurrentStep(Math.round(pct * (steps.length - 1)));
                    }}>
                        <div className="viz-progress-track">
                            <div className="viz-progress-fill" style={{ width: `${progress}%` }} />
                            <div className="viz-progress-thumb" style={{ left: `${progress}%` }} />
                        </div>
                    </div>

                    {/* Right: step counter + speed */}
                    <div className="viz-ctrl-group viz-ctrl-right">
                        <span className="viz-step-counter">
                            {currentStep} / {Math.max(0, steps.length - 1)}
                        </span>
                        <div className="viz-speed-wrap">
                            <button
                                className="viz-speed-btn"
                                onClick={() => setShowSpeedMenu(s => !s)}
                            >
                                {SPEED_OPTIONS[speed].label} <ChevronDown size={12} />
                            </button>
                            {showSpeedMenu && (
                                <div className="viz-speed-menu">
                                    {SPEED_OPTIONS.map((opt, i) => (
                                        <button
                                            key={i}
                                            className={`viz-speed-option ${speed === i ? 'active' : ''}`}
                                            onClick={() => { setSpeed(i); setShowSpeedMenu(false); }}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Simple Syntax Highlighter for Code Lines ───
const KW = new Set(['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'new', 'true', 'false', 'null', 'undefined', 'break', 'continue', 'switch', 'case', 'default', 'do', 'try', 'catch', 'finally', 'throw', 'async', 'await', 'yield']);
const FN = new Set(['Array', 'Math', 'console', 'log', 'push', 'pop', 'shift', 'unshift', 'slice', 'splice', 'sort', 'filter', 'map', 'reduce', 'forEach', 'indexOf', 'includes', 'length', 'swap', 'min', 'max', 'abs', 'floor', 'ceil']);

function CodeLine({ text }) {
    if (!text.trim()) return <span>{text || ' '}</span>;

    // Simple tokenizer
    const tokens = [];
    let remaining = text;
    const patterns = [
        { regex: /^(\/\/.*)/, cls: 'tok-comment' },
        { regex: /^("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/, cls: 'tok-string' },
        { regex: /^(\b\d+\.?\d*\b)/, cls: 'tok-number' },
        { regex: /^([+\-*/%=<>!&|^~?:]+)/, cls: 'tok-operator' },
        { regex: /^([()[\]{}])/, cls: 'tok-bracket' },
        { regex: /^(\s+)/, cls: '' },
        { regex: /^(\w+)/, cls: 'tok-ident' },
        { regex: /^(.)/, cls: '' },
    ];

    while (remaining.length > 0) {
        let matched = false;
        for (const { regex, cls } of patterns) {
            const m = remaining.match(regex);
            if (m) {
                let finalCls = cls;
                if (cls === 'tok-ident') {
                    if (KW.has(m[1])) finalCls = 'tok-keyword';
                    else if (FN.has(m[1])) finalCls = 'tok-fn';
                    else finalCls = 'tok-text';
                }
                tokens.push({ text: m[1], cls: finalCls });
                remaining = remaining.slice(m[1].length);
                matched = true;
                break;
            }
        }
        if (!matched) {
            tokens.push({ text: remaining[0], cls: '' });
            remaining = remaining.slice(1);
        }
    }

    return (
        <>
            {tokens.map((t, i) => (
                t.cls ? <span key={i} className={t.cls}>{t.text}</span> : t.text
            ))}
        </>
    );
}

// ═══════════════════════════════════════════
//  MAIN COMPONENT — toggle between modes
// ═══════════════════════════════════════════
export default function AlgorithmPlayground() {
    const [selectedAlgo, setSelectedAlgo] = useState(null);

    if (selectedAlgo) {
        return <VisualizerView algorithm={selectedAlgo} onBack={() => setSelectedAlgo(null)} />;
    }

    return <CatalogView onSelectAlgorithm={setSelectedAlgo} />;
}
