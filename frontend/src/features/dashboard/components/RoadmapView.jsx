import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowUpRight,
    BookOpen,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Compass,
    GitBranch,
    Minus,
    Plus,
    ScanSearch,
    Search,
} from 'lucide-react';
import ReactFlow, {
    Handle,
    Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useTheme } from '../../../context/ThemeContext';
import useRoadmapProgress from '../../../hooks/useRoadmapProgress';
import './roadmap-view.css';

const ROOT_COLORS = {
    array: '#4f46e5',
    string: '#ec4899',
    'hash-map': '#06b6d4',
    stack: '#14b8a6',
    'queue-deque': '#f59e0b',
    'linked-list': '#eab308',
    trees: '#f43f5e',
    recursion: '#8b5cf6',
    heap: '#10b981',
    graphs: '#a855f7',
    trie: '#fb7185',
    dp: '#94a3b8',
    greedy: '#d946ef',
    'bit-manipulation': '#3b82f6',
    'sorting-algorithms': '#64748b',
    'range-structures': '#22c55e',
};

const GUIDE_ALIASES = {
    'array-sliding-window': ['sliding-window'],
    'string-sliding-window': ['sliding-window'],
    'array-two-pointer': ['two-pointers-converging', 'two-pointers'],
    'string-two-pointers': ['two-pointers'],
    'prefix-based': ['prefix-sum', 'arrays-hashing'],
    'prefix-sum': ['prefix-sum'],
    'hash-map': ['arrays-hashing'],
    'stack-monotonic': ['monotonic-stack'],
    'nearest-element': ['monotonic-stack'],
    'pointer-techniques': ['fast-slow-pointers'],
    'tree-traversal': ['dfs-graph-tree', 'bfs-grid-graph'],
    backtracking: ['backtracking'],
    exploration: ['backtracking'],
    'graph-traversal': ['bfs-grid-graph', 'dfs-graph-tree'],
    'graph-topological-sort': ['topological-sort'],
    'shortest-path': ['shortest-path'],
    'union-find-detect': ['union-find'],
    'top-k': ['heap-top-k'],
    'greedy-heap': ['two-heaps', 'heap-top-k'],
    'interval-greedy': ['merge-intervals', 'greedy'],
    'scheduling-greedy': ['greedy'],
    'resource-allocation': ['greedy'],
    trie: ['trie'],
    'trie-prefix': ['trie'],
    'bit-core': ['bit-manipulation'],
    'bit-usage': ['bit-manipulation'],
    'dp-core': ['dp-1d', 'dp-2d'],
    'dp-pattern': ['dp-strings', 'dp-2d', 'dp-1d'],
    'dp-transition': ['dp-2d', 'dp-1d'],
    'dp-optimization': ['dp-1d', 'dp-2d'],
    'dp-advanced': ['dp-2d'],
    greedy: ['greedy'],
};

function normalizeValue(value = '') {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function collectUniqueGuides(nodes, set = new Map()) {
    nodes.forEach((node) => {
        if (node.guide) {
            set.set(node.guide.id, node.guide);
        }
        if (node.children.length) {
            collectUniqueGuides(node.children, set);
        }
    });
    return set;
}

function highlightText(text, query) {
    if (!query) return text;

    const safeQuery = query.trim();
    if (!safeQuery) return text;

    const lowerText = text.toLowerCase();
    const lowerQuery = safeQuery.toLowerCase();
    const parts = [];
    let cursor = 0;

    while (cursor < text.length) {
        const matchIndex = lowerText.indexOf(lowerQuery, cursor);
        if (matchIndex === -1) {
            parts.push(text.slice(cursor));
            break;
        }

        if (matchIndex > cursor) {
            parts.push(text.slice(cursor, matchIndex));
        }

        parts.push(
            <mark key={`${text}-${matchIndex}`} className="roadmap-highlight">
                {text.slice(matchIndex, matchIndex + safeQuery.length)}
            </mark>
        );
        cursor = matchIndex + safeQuery.length;
    }

    return parts;
}

function createPatternIndexes(patterns) {
    const safePatterns = Array.isArray(patterns) ? patterns : [];
    const byId = new Map();
    const bySlug = new Map();

    safePatterns.forEach((pattern) => {
        byId.set(pattern.id, pattern);
        bySlug.set(normalizeValue(pattern.id), pattern);
        bySlug.set(normalizeValue(pattern.name), pattern);
        bySlug.set(normalizeValue(pattern.category), pattern);
    });

    return { byId, bySlug };
}

function createTopicProgressIndex(topics = []) {
    const byName = new Map();
    const bySlug = new Map();

    topics.forEach((topic) => {
        if (!topic?.name) {
            return;
        }

        byName.set(topic.name, topic);
        bySlug.set(normalizeValue(topic.name), topic);
    });

    return { byName, bySlug };
}

function collectExpandableNodeIds(nodes = [], set = new Set()) {
    nodes.forEach((node) => {
        if (node?.children?.length) {
            set.add(node.id);
            collectExpandableNodeIds(node.children, set);
        }
    });

    return set;
}

function resolveGuide(node, patternIndexes, topicProgressIndex, guideProgressById) {
    const aliasCandidates = GUIDE_ALIASES[node.id] || [];
    const candidates = [
        ...aliasCandidates,
        node.id,
        node.label,
        node.category,
        `${node.label} ${node.category || ''}`.trim(),
    ].filter(Boolean);

    const matchedPattern = candidates
        .map((candidate) => patternIndexes.byId.get(candidate) || patternIndexes.bySlug.get(normalizeValue(candidate)))
        .find(Boolean);

    if (!matchedPattern) {
        return null;
    }

    const dashboardTopic =
        topicProgressIndex.byName.get(matchedPattern.name) ||
        topicProgressIndex.bySlug.get(normalizeValue(matchedPattern.name)) ||
        topicProgressIndex.bySlug.get(normalizeValue(matchedPattern.id));

    const problems = matchedPattern.problems || [];
    const fallbackSolved = problems.filter((problem) => problem.status === 'solved' || problem.completed || problem.user_status === 'solved').length;
    const localGuideProgress = guideProgressById.get(matchedPattern.id);
    const solved = typeof dashboardTopic?.solved === 'number'
        ? dashboardTopic.solved
        : typeof localGuideProgress?.solvedCount === 'number'
            ? localGuideProgress.solvedCount
            : fallbackSolved;
    const total = typeof dashboardTopic?.total === 'number'
        ? dashboardTopic.total
        : typeof localGuideProgress?.totalCount === 'number'
            ? localGuideProgress.totalCount
            : problems.length;
    const isComplete = typeof localGuideProgress?.isComplete === 'boolean'
        ? localGuideProgress.isComplete
        : total > 0 && solved >= total;

    return {
        id: matchedPattern.id,
        name: matchedPattern.name,
        difficulty: matchedPattern.difficulty,
        category: matchedPattern.category,
        generated: matchedPattern.generated,
        problemCount: total,
        solvedCount: solved,
        progressPercent: total > 0 ? Math.round((solved / total) * 100) : 0,
        isComplete,
        route: `/patterns/${matchedPattern.id}`,
    };
}

function enhanceNode(node, patternIndexes, topicProgressIndex, guideProgressById, color, depth = 0) {
    const children = (node.children || []).map((child) => enhanceNode(child, patternIndexes, topicProgressIndex, guideProgressById, color, depth + 1));
    const guide = resolveGuide(node, patternIndexes, topicProgressIndex, guideProgressById);

    return {
        ...node,
        color,
        depth,
        guide,
        children,
        totalNodes: 1 + children.reduce((sum, child) => sum + child.totalNodes, 0),
        descendantGuideCount: (guide ? 1 : 0) + children.reduce((sum, child) => sum + child.descendantGuideCount, 0),
    };
}

function filterNode(node, query) {
    if (!query) return node;

    const lowerQuery = query.toLowerCase();
    const selfMatches = [
        node.label,
        node.category,
        node.guide?.name,
        node.guide?.category,
    ].filter(Boolean).some((value) => value.toLowerCase().includes(lowerQuery));

    const filteredChildren = node.children
        .map((child) => filterNode(child, query))
        .filter(Boolean);

    if (!selfMatches && filteredChildren.length === 0) {
        return null;
    }

    return {
        ...node,
        isMatch: selfMatches,
        children: filteredChildren,
    };
}

function estimateNodeWidth(label, depth) {
    const base = depth === 1 ? 120 : 76;
    const perChar = depth === 1 ? 7.6 : 6.6;
    const max = depth === 1 ? 212 : 168;
    return Math.max(base, Math.min(max, base + label.length * perChar));
}

function createMindmapLayout(roots, collapsedNodeIds = new Set(), forceExpand = false) {
    const siblingGap = 18;
    const rootGap = 24;
    const depthGap = 152;
    const originX = 228;
    const startY = 74;
    const positions = [];
    const edges = [];
    const measurements = new Map();

    const measureNode = (node, depth) => {
        const width = estimateNodeWidth(node.label, depth);
        const height = depth === 1 ? 36 : 28;
        const isCollapsed = !forceExpand && collapsedNodeIds.has(node.id);
        const visibleChildren = isCollapsed ? [] : node.children;
        const childHeights = visibleChildren.map((child) => measureNode(child, depth + 1));
        const childrenHeight = childHeights.length
            ? childHeights.reduce((sum, current) => sum + current, 0) + siblingGap * (childHeights.length - 1)
            : 0;
        const subtreeHeight = Math.max(height, childrenHeight);

        measurements.set(node.id, {
            width,
            height,
            subtreeHeight,
            isCollapsed,
            hasChildren: node.children.length > 0,
            visibleChildren,
        });

        return subtreeHeight;
    };

    const placeNode = (node, depth, branchColor, topY, parentId = null) => {
        const measurement = measurements.get(node.id);
        const x = originX + (depth - 1) * depthGap;
        const y = topY + (measurement.subtreeHeight - measurement.height) / 2;

        const id = node.id;
        positions.push({
            id,
            label: node.label,
            x,
            y,
            width: measurement.width,
            height: measurement.height,
            depth,
            branchColor,
            guide: node.guide,
            isMatch: node.isMatch,
            hasChildren: measurement.hasChildren,
            isCollapsed: measurement.isCollapsed,
            guideText: node.guide
                ? `${node.guide.problemCount} problems${node.guide.solvedCount ? ` • ${node.guide.solvedCount} solved` : ''}`
                : '',
        });

        if (parentId) {
            edges.push({ from: parentId, to: id, color: branchColor, depth });
        }

        if (measurement.visibleChildren.length) {
            let childTopY = topY;
            measurement.visibleChildren.forEach((child) => {
                placeNode(child, depth + 1, branchColor, childTopY, node.id);
                childTopY += measurements.get(child.id).subtreeHeight + siblingGap;
            });
        }

        return id;
    };

    let currentY = startY;
    roots.forEach((root, index) => {
        const subtreeHeight = measureNode(root, 1);
        placeNode(root, 1, root.color, currentY, 'dsa-root');
        if (index < roots.length - 1) {
            currentY += subtreeHeight + rootGap;
        }
    });

    const minY = positions.length ? Math.min(...positions.map((item) => item.y)) : startY;
    const maxY = positions.length ? Math.max(...positions.map((item) => item.y + item.height)) : startY + 400;
    const maxX = positions.length ? Math.max(...positions.map((item) => item.x + item.width)) : originX + 760;
    const rootY = (minY + maxY) / 2 - 21;

    positions.push({
        id: 'dsa-root',
        label: 'DSA Patterns',
        x: 46,
        y: rootY,
        width: 128,
        height: 42,
        depth: 0,
        branchColor: '#ffffff',
        isRoot: true,
    });

    return {
        nodes: positions,
        edges,
        width: maxX + 160,
        height: maxY + 108,
    };
}

function buildEdgePath(fromNode, toNode) {
    const startX = fromNode.x + fromNode.width;
    const startY = fromNode.y + fromNode.height / 2;
    const endX = toNode.x;
    const endY = toNode.y + toNode.height / 2;
    const delta = Math.max(44, (endX - startX) * 0.46);
    return `M ${startX} ${startY} C ${startX + delta} ${startY}, ${endX - delta} ${endY}, ${endX} ${endY}`;
}

function MindMapRootNode({ data }) {
    return (
        <div className="rf-roadmap-root">
            <Handle type="source" position={Position.Right} className="rf-roadmap-handle" />
            {data.label}
        </div>
    );
}

function MindMapTextNode({ data }) {
    const labelContent = (
        <span className={`rf-roadmap-label depth-${data.depth}`}>
            {highlightText(data.label, data.query)}
        </span>
    );

    return (
        <div
            className={`rf-roadmap-node depth-${data.depth} ${data.guide ? 'has-guide' : ''} ${data.guide?.isComplete ? 'is-complete' : ''} ${data.isMatch || !data.query ? 'is-visible' : 'is-muted'}`}
            style={{ '--branch-color': data.color }}
        >
            <Handle type="target" position={Position.Left} className="rf-roadmap-handle" />
            <div className="rf-roadmap-text">
                {data.hasChildren ? (
                    <button
                        type="button"
                        className="rf-roadmap-toggle"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                            event.stopPropagation();
                            data.onToggle?.(data.id);
                        }}
                        aria-expanded={!data.isCollapsed}
                        aria-label={`${data.isCollapsed ? 'Expand' : 'Collapse'} ${data.label}`}
                    >
                        <span className="rf-roadmap-toggle-icon" aria-hidden="true">
                            {data.isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                        </span>
                        {labelContent}
                    </button>
                ) : data.guide ? (
                    <Link
                        to={data.guide.route}
                        className="rf-roadmap-link"
                        onMouseDown={(event) => event.stopPropagation()}
                        onPointerDown={(event) => event.stopPropagation()}
                    >
                        {labelContent}
                    </Link>
                ) : (
                    <div className="rf-roadmap-link">{labelContent}</div>
                )}

                {data.guide ? (
                    <div className="rf-roadmap-guide-actions">
                        {data.guide.isComplete ? (
                            <span className="rf-roadmap-complete-badge" aria-label={`${data.guide.name} completed`}>
                                <CheckCircle2 size={12} />
                            </span>
                        ) : null}
                        <Link
                            to={data.guide.route}
                            className="rf-roadmap-guide-link"
                            aria-label={`Open ${data.guide.name}`}
                            onMouseDown={(event) => event.stopPropagation()}
                            onPointerDown={(event) => event.stopPropagation()}
                        >
                            <ArrowUpRight size={12} />
                        </Link>
                    </div>
                ) : null}
            </div>
            <Handle type="source" position={Position.Right} className="rf-roadmap-handle" />
        </div>
    );
}

const nodeTypes = {
    roadmapRoot: MindMapRootNode,
    roadmapText: MindMapTextNode,
};

function createFlowGraph(layout, query, onToggleNode) {
    const nodes = layout.nodes.map((node) => ({
        id: node.id,
        type: node.isRoot ? 'roadmapRoot' : 'roadmapText',
        position: { x: node.x, y: node.y },
        draggable: false,
        selectable: false,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
            label: node.label,
            depth: node.depth,
            color: node.branchColor,
            guide: node.guide,
            isMatch: node.isMatch,
            hasChildren: node.hasChildren,
            isCollapsed: node.isCollapsed,
            id: node.id,
            onToggle: onToggleNode,
            query,
        },
    }));

    const edges = layout.edges.map((edge) => ({
        id: `${edge.from}-${edge.to}`,
        source: edge.from,
        target: edge.to,
        type: 'default',
        selectable: false,
        focusable: false,
        animated: false,
        style: {
            stroke: edge.color,
            strokeWidth: edge.depth === 1 ? 3.2 : edge.depth === 2 ? 2.5 : 1.9,
            opacity: 0.95,
        },
    }));

    return { nodes, edges };
}

export default function RoadmapView({
    hierarchy = [],
    patterns = [],
    topics = [],
    sourceUrl,
    mode = 'full',
    trackKey = 'dsa',
    kicker = 'Roadmap',
    title = 'Track the map, not just the totals',
    subtitle = '',
    ctaPath = '/roadmap',
    searchPlaceholder = 'Search roadmap',
}) {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const [query, setQuery] = useState('');
    const [flowInstance, setFlowInstance] = useState(null);
    const defaultCollapsedNodeIds = useMemo(() => collectExpandableNodeIds(hierarchy), [hierarchy]);
    const defaultCollapsedNodeIdsKey = useMemo(
        () => Array.from(defaultCollapsedNodeIds).sort().join('|'),
        [defaultCollapsedNodeIds]
    );
    const [collapsedNodeIds, setCollapsedNodeIds] = useState(() => new Set(defaultCollapsedNodeIds));

    const patternIndexes = useMemo(() => createPatternIndexes(patterns), [patterns]);
    const topicProgressIndex = useMemo(() => createTopicProgressIndex(topics), [topics]);
    const { guideProgressById, completedGuideCount } = useRoadmapProgress(trackKey, patterns);
    const isCompact = mode === 'compact';

    const enrichedRoots = useMemo(
        () =>
            hierarchy.map((root, index) =>
                enhanceNode(
                    root,
                    patternIndexes,
                    topicProgressIndex,
                    guideProgressById,
                    ROOT_COLORS[root.id] || Object.values(ROOT_COLORS)[index % Object.values(ROOT_COLORS).length]
                )
            ),
        [guideProgressById, hierarchy, patternIndexes, topicProgressIndex]
    );

    const filteredRoots = useMemo(
        () => enrichedRoots.map((root) => filterNode(root, query)).filter(Boolean),
        [enrichedRoots, query]
    );
    const handleToggleNode = useCallback((nodeId) => {
        setCollapsedNodeIds((current) => {
            const next = new Set(current);
            if (next.has(nodeId)) {
                next.delete(nodeId);
            } else {
                next.add(nodeId);
            }
            return next;
        });
    }, []);

    useEffect(() => {
        setCollapsedNodeIds(new Set(defaultCollapsedNodeIds));
    }, [defaultCollapsedNodeIds, defaultCollapsedNodeIdsKey]);

    const uniqueGuides = useMemo(() => collectUniqueGuides(enrichedRoots), [enrichedRoots]);
    const totalProblems = Array.from(uniqueGuides.values()).reduce((sum, guide) => sum + guide.problemCount, 0);
    const solvedProblems = Array.from(uniqueGuides.values()).reduce((sum, guide) => sum + guide.solvedCount, 0);
    const clickableLeaves = Array.from(uniqueGuides.values()).filter((guide) => guide.generated).length;
    const topCompactRoots = enrichedRoots
        .map((root) => {
            const rootGuides = Array.from(collectUniqueGuides([root]).values());
            const rootSolved = rootGuides.reduce((sum, guide) => sum + guide.solvedCount, 0);
            const rootTotal = rootGuides.reduce((sum, guide) => sum + guide.problemCount, 0);
            return {
                ...root,
                solvedCount: rootSolved,
                problemCount: rootTotal,
                progressPercent: rootTotal > 0 ? Math.round((rootSolved / rootTotal) * 100) : 0,
            };
        })
        .sort((left, right) => right.problemCount - left.problemCount)
        .slice(0, 6);
    const mindmapLayout = useMemo(
        () => createMindmapLayout(filteredRoots, collapsedNodeIds, Boolean(query.trim())),
        [collapsedNodeIds, filteredRoots, query]
    );
    const flowGraph = useMemo(
        () => createFlowGraph(mindmapLayout, query, handleToggleNode),
        [handleToggleNode, mindmapLayout, query]
    );

    useEffect(() => {
        if (!isCompact && flowInstance) {
            flowInstance.fitView({ padding: query.trim() ? 0.12 : 0.08, duration: 320 });
        }
    }, [filteredRoots.length, flowInstance, isCompact, query]);

    if (isCompact) {
        return (
            <div className={`roadmap-compact ${isLight ? 'light' : 'dark'}`}>
                <div className="roadmap-compact-header">
                    <div>
                        <div className="roadmap-compact-kicker">{kicker}</div>
                        <div className="roadmap-compact-title">{title}</div>
                    </div>
                    <Link to={ctaPath} className="roadmap-compact-link">
                        Open
                        <ArrowUpRight size={14} />
                    </Link>
                </div>

                <div className="roadmap-compact-summary">
                    <div className="roadmap-compact-metric">
                        <Compass size={16} />
                        <div>
                            <strong>{enrichedRoots.length}</strong>
                            <span>Tracks</span>
                        </div>
                    </div>
                    <div className="roadmap-compact-metric">
                        <BookOpen size={16} />
                        <div>
                            <strong>{solvedProblems}/{totalProblems}</strong>
                            <span>Solved</span>
                        </div>
                    </div>
                    <div className="roadmap-compact-metric">
                        <GitBranch size={16} />
                        <div>
                            <strong>{completedGuideCount}/{uniqueGuides.size}</strong>
                            <span>Guides done</span>
                        </div>
                    </div>
                </div>

                <div className="roadmap-compact-roots">
                    {topCompactRoots.map((root) => (
                        <div
                            key={root.id}
                            className="roadmap-compact-root"
                            style={{ '--roadmap-accent': root.color }}
                        >
                            <div className="roadmap-compact-root-top">
                                <div>
                                    <div className="roadmap-compact-root-name">{root.label}</div>
                                    <div className="roadmap-compact-root-meta">
                                        {root.children.length} branches • {root.problemCount} problems
                                    </div>
                                </div>
                                <span className="roadmap-compact-root-pill">{root.progressPercent}%</span>
                            </div>
                            <div className="roadmap-compact-bar">
                                <div
                                    className="roadmap-compact-bar-fill"
                                    style={{ width: `${root.progressPercent}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="roadmap-compact-footer">
                    <span>{clickableLeaves} generated leaf guides plus curated core guides</span>
                    <Link to={ctaPath} className="roadmap-compact-footer-link">
                        Explore full roadmap
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="roadmap-mindmap-page">
            <div className="roadmap-mindmap-shell">
                <div className="roadmap-mindmap-canvas">
                    <div className="roadmap-canvas-atmosphere" aria-hidden="true">
                        <span className="roadmap-canvas-glow roadmap-canvas-glow-a" />
                        <span className="roadmap-canvas-glow roadmap-canvas-glow-b" />
                        <span className="roadmap-canvas-grid" />
                    </div>

                    <div className="roadmap-floating road-map-floating-top">
                        <div className="roadmap-mindmap-controls">
                            <button
                                type="button"
                                className="roadmap-control-btn"
                                onClick={() => flowInstance?.zoomIn({ duration: 180 })}
                                aria-label="Zoom in"
                            >
                                <Plus size={14} />
                                <span>In</span>
                            </button>
                            <button
                                type="button"
                                className="roadmap-control-btn"
                                onClick={() => flowInstance?.zoomOut({ duration: 180 })}
                                aria-label="Zoom out"
                            >
                                <Minus size={14} />
                                <span>Out</span>
                            </button>
                            <button
                                type="button"
                                className="roadmap-control-btn roadmap-control-btn-wide"
                                onClick={() => flowInstance?.fitView({ padding: 0.14, duration: 260 })}
                            >
                                <ScanSearch size={14} />
                                Fit
                            </button>
                        </div>
                    </div>

                    {filteredRoots.length === 0 ? (
                        <div className="roadmap-empty-state">
                            <Search size={20} />
                            <div>
                                <strong>No roadmap matches found.</strong>
                                <span>Try a broader term like `graph`, `window`, or `dp`.</span>
                            </div>
                        </div>
                    ) : (
                        <ReactFlow
                            nodes={flowGraph.nodes}
                            edges={flowGraph.edges}
                            nodeTypes={nodeTypes}
                            onInit={setFlowInstance}
                            onNodeClick={(_, node) => {
                                if (node?.data?.hasChildren) {
                                    handleToggleNode(node.id);
                            }
                        }}
                        fitView
                        fitViewOptions={{ padding: 0.08 }}
                        proOptions={{ hideAttribution: true }}
                        nodesDraggable={false}
                        nodesConnectable={false}
                            elementsSelectable={false}
                            panOnDrag
                        panOnScroll
                        zoomOnScroll
                        zoomOnPinch
                        zoomOnDoubleClick={false}
                        minZoom={0.45}
                        maxZoom={2.2}
                        defaultEdgeOptions={{ type: 'bezier' }}
                        className="roadmap-reactflow"
                        >
                        </ReactFlow>
                    )}
                </div>
            </div>
        </div>
    );
}
