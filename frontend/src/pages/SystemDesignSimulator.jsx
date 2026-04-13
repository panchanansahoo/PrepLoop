import React, { useState, useRef, useCallback, useMemo, useEffect, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import './SystemDesignSimulator.css';
import {
    ArrowLeft, Search, ChevronRight, ChevronDown, ChevronUp, Clock,
    Sparkles, Plus, Trash2, Zap, Check, X, RotateCcw, MousePointer,
    Link2, Eye, EyeOff, Lightbulb, Target, AlertTriangle, Star,
    Maximize2, Minimize2, ZoomIn, ZoomOut, Grid3X3, Undo2, Redo2,
    Layout, Settings2, Tag, Shield, Copy, Move,
    Globe, Smartphone, Cpu, Server, HardDrive, Database, Cloud,
    Wifi, Radio, Router, Layers, MessageSquare, Bell, Lock,
    BarChart3, Activity, MonitorCheck, Workflow, Container, Cog,
    Network, FileText, Archive, Gauge, GitBranch, Bot, BookOpen, Image,
    Play, Pause, Square, Flame, Skull, Unplug, TrendingUp, Brain, Timer,
    SkipForward, Wrench, DollarSign, CircleDot
} from 'lucide-react';

const ICON_MAP = {
    'web-client': Globe, 'mobile-client': Smartphone, 'iot-device': Cpu,
    'load-balancer': Network, 'api-gateway': Router, 'cdn': Cloud,
    'dns': Wifi, 'reverse-proxy': Layers,
    'app-server': Server, 'worker': Cog, 'serverless': Zap, 'scheduler': Clock,
    'sql-db': Database, 'nosql-db': HardDrive, 'object-storage': Archive,
    'data-warehouse': Container, 'graph-db': GitBranch, 'search-engine': Search,
    'redis-cache': Gauge, 'memcached': Activity, 'browser-cache': MonitorCheck,
    'message-queue': MessageSquare, 'kafka': Radio, 'pub-sub': Bell,
    'notification-svc': Bell, 'auth-svc': Lock, 'payment-svc': BarChart3,
    'search-svc': Search, 'media-svc': FileText, 'recommendation': Bot,
    'analytics': Activity, 'logging': FileText, 'health-check': MonitorCheck,
    'thumbnail-storage': Image, 'media-cache': Activity,
    'chat-service': MessageSquare, 'user-profile-svc': Smartphone, 'group-service': Network,
    'session-service': Lock, 'last-seen-svc': Activity, 'relay-service': Radio,
    'unread-messages': Bell, 'asset-service': FileText, 'auth-gateway': Shield,
    'group-db': Database, 'session-db': Database, 'status-db': Database,
    'storage-replica': HardDrive,
    'tweets-writer': FileText, 'timeline-service': Workflow, 'fanout-service': Radio,
    'earlybird': Search, 'storm-heron': Activity, 'zookeeper': Network, 'redis-cluster': Gauge,
};
function getIcon(componentId, size = 18) {
    const Icon = ICON_MAP[componentId];
    return Icon ? <Icon size={size} /> : <Server size={size} />;
}
import { SD_PROBLEMS, SD_COMPONENT_CATEGORIES, ALL_COMPONENTS } from '../data/systemDesignProblems';
import { buildAuthHeaders } from '../utils/authHeaders';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const GRID_SIZE = 20;
const PROTOCOLS = ['HTTP/REST', 'gRPC', 'WebSocket', 'TCP', 'AMQP', 'Kafka', 'Redis', 'SQL'];
const DIFF_COLORS = {
    Easy: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)', text: '#4ade80' },
    Medium: { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.25)', text: '#fbbf24' },
    Hard: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', text: '#f87171' },
};


const COMPONENT_CONFIGS = {
    'sql-db': [{ key: 'replicas', label: 'Read Replicas', type: 'number', min: 1, max: 10, default: 1 }, { key: 'sharding', label: 'Sharding', type: 'toggle', default: false }],
    'nosql-db': [{ key: 'replicas', label: 'Replicas', type: 'number', min: 1, max: 10, default: 3 }, { key: 'partitions', label: 'Partitions', type: 'number', min: 1, max: 100, default: 16 }],
    'redis-cache': [{ key: 'ttl', label: 'TTL (sec)', type: 'number', min: 1, max: 86400, default: 3600 }, { key: 'cluster', label: 'Cluster Mode', type: 'toggle', default: false }],
    'app-server': [{ key: 'instances', label: 'Instances', type: 'number', min: 1, max: 100, default: 3 }, { key: 'autoscale', label: 'Auto-Scale', type: 'toggle', default: true }],
    'load-balancer': [{ key: 'algorithm', label: 'Algorithm', type: 'select', options: ['Round Robin', 'Least Connections', 'IP Hash', 'Weighted'], default: 'Round Robin' }],
    'message-queue': [{ key: 'durability', label: 'Durable', type: 'toggle', default: true }, { key: 'retention', label: 'Retention (hrs)', type: 'number', min: 1, max: 168, default: 24 }],
    'kafka': [{ key: 'partitions', label: 'Partitions', type: 'number', min: 1, max: 100, default: 12 }, { key: 'replication', label: 'Replication Factor', type: 'number', min: 1, max: 5, default: 3 }],
    'worker': [{ key: 'concurrency', label: 'Concurrency', type: 'number', min: 1, max: 50, default: 5 }, { key: 'retries', label: 'Max Retries', type: 'number', min: 0, max: 10, default: 3 }],
    'cdn': [{ key: 'regions', label: 'Edge Regions', type: 'number', min: 1, max: 50, default: 12 }, { key: 'cacheTtl', label: 'Cache TTL (sec)', type: 'number', min: 60, max: 86400, default: 3600 }],
};

// ── Validation ──
function validateArchitecture(nodes, connections) {
    const warnings = [];
    const ids = new Set(nodes.map(n => n.componentId));
    const hasServer = ids.has('app-server') || ids.has('worker') || ids.has('serverless');
    const hasDB = ids.has('sql-db') || ids.has('nosql-db');
    const hasCache = ids.has('redis-cache') || ids.has('memcached');
    const hasLB = ids.has('load-balancer');
    const hasClient = ids.has('web-client') || ids.has('mobile-client');
    const hasStorage = ids.has('object-storage');
    const hasQueue = ids.has('message-queue') || ids.has('kafka') || ids.has('pub-sub');
    if (hasServer && !hasLB && nodes.filter(n => n.componentId === 'app-server').length > 1) warnings.push({ type: 'warning', msg: 'Multiple servers without a Load Balancer — single point of entry' });
    if (hasDB && !hasCache) warnings.push({ type: 'info', msg: 'Consider adding a cache layer in front of your database' });
    if (hasClient && !hasServer) warnings.push({ type: 'error', msg: 'Clients have no backend server to connect to' });
    if (hasServer && !hasDB && !hasStorage) warnings.push({ type: 'info', msg: 'No data persistence layer — where will data be stored?' });
    if (nodes.length > 3 && connections.length < 2) warnings.push({ type: 'warning', msg: 'Many components but few connections — wire them together' });
    if (!hasQueue && nodes.length > 6) warnings.push({ type: 'info', msg: 'Consider async messaging for decoupling at this scale' });
    const orphans = nodes.filter(n => !connections.some(c => c.from === n.id || c.to === n.id));
    if (orphans.length > 0 && nodes.length > 1) warnings.push({ type: 'warning', msg: `${orphans.length} component(s) not connected to anything` });
    return warnings;
}

// ── Auto-layout ──
function autoLayoutNodes(nodes, connections) {
    if (nodes.length === 0) return nodes;
    const adj = {};
    const inDeg = {};
    nodes.forEach(n => { adj[n.id] = []; inDeg[n.id] = 0; });
    connections.forEach(c => { if (adj[c.from]) { adj[c.from].push(c.to); inDeg[c.to] = (inDeg[c.to] || 0) + 1; } });
    // Topological layers
    const layers = []; const visited = new Set(); const queue = nodes.filter(n => (inDeg[n.id] || 0) === 0).map(n => n.id);
    if (queue.length === 0) queue.push(nodes[0].id);
    let safety = 0;
    while (queue.length > 0 && safety < 100) {
        const layer = [...queue]; layers.push(layer); queue.length = 0;
        layer.forEach(id => { visited.add(id); (adj[id] || []).forEach(next => { if (!visited.has(next)) { inDeg[next]--; if (inDeg[next] <= 0) queue.push(next); } }); });
        safety++;
    }
    // Add unvisited
    const unvisited = nodes.filter(n => !visited.has(n.id)).map(n => n.id);
    if (unvisited.length) layers.push(unvisited);
    const LAYER_GAP = 180, NODE_GAP = 170, START_X = 80, START_Y = 60;
    const positioned = {};
    layers.forEach((layer, li) => { layer.forEach((id, ni) => { positioned[id] = { x: START_X + li * LAYER_GAP, y: START_Y + ni * NODE_GAP }; }); });
    return nodes.map(n => ({ ...n, x: positioned[n.id]?.x ?? n.x, y: positioned[n.id]?.y ?? n.y }));
}

// ── Snap ──
const snap = (v) => Math.round(v / GRID_SIZE) * GRID_SIZE;

// ── Edge-aware connection routing ──
const NODE_W = 140, NODE_H = 76;
function getEdgePoint(node, targetX, targetY) {
    const cx = node.x + NODE_W / 2, cy = node.y + NODE_H / 2;
    const dx = targetX - cx, dy = targetY - cy;
    const absDx = Math.abs(dx), absDy = Math.abs(dy);
    const hw = NODE_W / 2 + 4, hh = NODE_H / 2 + 4;
    if (absDx / hw > absDy / hh) {
        return dx > 0 ? { x: cx + hw, y: cy, side: 'right' } : { x: cx - hw, y: cy, side: 'left' };
    }
    return dy > 0 ? { x: cx, y: cy + hh, side: 'bottom' } : { x: cx, y: cy - hh, side: 'top' };
}
function smartBezier(fromNode, toNode) {
    const fromCenter = { x: fromNode.x + NODE_W / 2, y: fromNode.y + NODE_H / 2 };
    const toCenter = { x: toNode.x + NODE_W / 2, y: toNode.y + NODE_H / 2 };
    const start = getEdgePoint(fromNode, toCenter.x, toCenter.y);
    const end = getEdgePoint(toNode, fromCenter.x, fromCenter.y);
    const dist = Math.hypot(end.x - start.x, end.y - start.y);
    const tension = Math.min(dist * 0.4, 120);
    const cp1 = { x: start.x, y: start.y }, cp2 = { x: end.x, y: end.y };
    if (start.side === 'right') { cp1.x += tension; } else if (start.side === 'left') { cp1.x -= tension; }
    else if (start.side === 'bottom') { cp1.y += tension; } else { cp1.y -= tension; }
    if (end.side === 'right') { cp2.x += tension; } else if (end.side === 'left') { cp2.x -= tension; }
    else if (end.side === 'bottom') { cp2.y += tension; } else { cp2.y -= tension; }
    return { path: `M${start.x},${start.y} C${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${end.x},${end.y}`, start, end, mid: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 } };
}
function simpleBezier(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const t = Math.min(Math.hypot(dx, dy) * 0.4, 120);
    if (Math.abs(dx) > Math.abs(dy)) return `M${x1},${y1} C${x1 + t},${y1} ${x2 - t},${y2} ${x2},${y2}`;
    return `M${x1},${y1} C${x1},${y1 + (dy > 0 ? t : -t)} ${x2},${y2 - (dy > 0 ? t : -t)} ${x2},${y2}`;
}

// ── History reducer ──
function historyReducer(state, action) {
    switch (action.type) {
        case 'PUSH': {
            const past = state.history.slice(0, state.index + 1);
            past.push(action.snapshot);
            return { history: past, index: past.length - 1 };
        }
        case 'UNDO': return state.index > 0 ? { ...state, index: state.index - 1 } : state;
        case 'REDO': return state.index < state.history.length - 1 ? { ...state, index: state.index + 1 } : state;
        default: return state;
    }
}

// ═══════════════════════════════════════════
//  PROBLEM CATALOG
// ═══════════════════════════════════════════
function ProblemCatalog({ onSelect }) {
    const [search, setSearch] = useState('');
    const [diffFilter, setDiffFilter] = useState('all');
    const filtered = useMemo(() => SD_PROBLEMS.filter(p => {
        const ms = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
        const md = diffFilter === 'all' || p.difficulty === diffFilter;
        return ms && md;
    }), [search, diffFilter]);

    return (
        <div className="sd-sim-catalog">
            <div className="sd-sim-hero">
                <div className="sd-sim-hero-glow" />
                <div className="sd-sim-hero-content">
                    <div className="sd-sim-badge"><Sparkles size={14} /><span>Interactive Simulator</span></div>
                    <h1 className="sd-sim-title">System Design <span className="text-gradient-anim">Simulator</span></h1>
                    <p className="sd-sim-subtitle">Drag-and-drop architecture components, draw connections, configure services, and get AI-powered feedback on your designs.</p>
                </div>
            </div>
            <div className="sd-sim-controls">
                <div className="sd-sim-search-wrap">
                    <Search size={16} className="sd-sim-search-icon" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search design problems..." className="sd-sim-search-input" />
                    {search && <span className="sd-sim-search-count">{filtered.length} found</span>}
                </div>
                <div className="sd-sim-diff-filters">
                    {['all', 'Easy', 'Medium', 'Hard'].map(d => (
                        <button key={d} onClick={() => setDiffFilter(d)} className={`sd-sim-diff-pill ${diffFilter === d ? 'active' : ''}`} data-difficulty={d}>{d === 'all' ? 'All' : d}</button>
                    ))}
                </div>
            </div>
            <div className="sd-sim-grid">
                {filtered.map((p, i) => {
                    const dc = DIFF_COLORS[p.difficulty];
                    return (
                        <button key={p.id} className="sd-sim-card" onClick={() => onSelect(p)} style={{ '--card-delay': `${i * 50}ms` }}>
                            <span className="sd-sim-card-diff" style={{ background: dc.bg, border: `1px solid ${dc.border}`, color: dc.text }}>{p.difficulty}</span>
                            <div className="sd-sim-card-body">
                                <span className="sd-sim-card-icon">{p.icon}</span>
                                <h3 className="sd-sim-card-name">{p.title}</h3>
                                <p className="sd-sim-card-desc">{p.description}</p>
                            </div>
                            <div className="sd-sim-card-footer">
                                <span className="sd-sim-card-time"><Clock size={10} /> {p.estimatedTime}</span>
                                <span className="sd-sim-card-action">Start Design <ChevronRight size={12} /></span>
                            </div>
                            <div className="sd-sim-card-glow" />
                        </button>
                    );
                })}
            </div>
            {filtered.length === 0 && <div className="sd-sim-empty"><Search size={48} strokeWidth={1} /><h3>No problems found</h3><p>Try a different search or filter</p></div>}
        </div>
    );
}

// ═══════════════════════════════════════════
//  DESIGN CANVAS
// ═══════════════════════════════════════════
let nodeIdCounter = Date.now();

// ─── Simulation Constants ───
const SIM_NODE_CAPACITY = {
    'load-balancer': 5000, 'api-gateway': 4000, 'cdn': 15000, 'dns': 20000, 'reverse-proxy': 5000,
    'app-server': 800, 'worker': 400, 'serverless': 2000, 'scheduler': 300,
    'sql-db': 500, 'nosql-db': 2000, 'object-storage': 3000, 'data-warehouse': 200, 'graph-db': 600, 'search-engine': 1500,
    'redis-cache': 10000, 'memcached': 8000, 'browser-cache': 5000,
    'message-queue': 3000, 'kafka': 8000, 'pub-sub': 5000,
    'notification-svc': 1200, 'auth-svc': 1000, 'payment-svc': 400, 'search-svc': 1500, 'media-svc': 800, 'recommendation': 600,
    'analytics': 2000, 'logging': 5000, 'health-check': 1000,
};
const SIM_BASE_LATENCY = {
    'load-balancer': 2, 'api-gateway': 5, 'cdn': 8, 'dns': 1, 'reverse-proxy': 3,
    'app-server': 45, 'worker': 120, 'serverless': 60, 'scheduler': 30,
    'sql-db': 15, 'nosql-db': 8, 'object-storage': 25, 'data-warehouse': 200, 'graph-db': 20, 'search-engine': 12,
    'redis-cache': 1, 'memcached': 1, 'browser-cache': 0,
    'message-queue': 5, 'kafka': 3, 'pub-sub': 4,
    'notification-svc': 30, 'auth-svc': 25, 'payment-svc': 80, 'search-svc': 18, 'media-svc': 50, 'recommendation': 90,
    'analytics': 10, 'logging': 5, 'health-check': 2,
};
const SIM_NODE_COST = {
    'load-balancer': 25, 'api-gateway': 30, 'cdn': 40, 'dns': 5, 'reverse-proxy': 20,
    'app-server': 120, 'worker': 80, 'serverless': 15, 'scheduler': 10,
    'sql-db': 150, 'nosql-db': 100, 'object-storage': 30, 'data-warehouse': 300, 'graph-db': 200, 'search-engine': 180,
    'redis-cache': 60, 'memcached': 50, 'browser-cache': 0,
    'message-queue': 40, 'kafka': 90, 'pub-sub': 35,
    'notification-svc': 20, 'auth-svc': 25, 'payment-svc': 45, 'search-svc': 60, 'media-svc': 50, 'recommendation': 70,
    'analytics': 35, 'logging': 20, 'health-check': 5,
};
const CHAOS_TYPES = [
    { id: 'server-crash', label: 'Server Crash', shortLabel: 'Crash', desc: 'Kills a random server', icon: <Skull size={13} />, color: '#ef4444' },
    { id: 'latency-spike', label: 'Latency Spike', shortLabel: 'Latency', desc: 'Slows all responses 4×', icon: <Timer size={13} />, color: '#f59e0b' },
    { id: 'disk-failure', label: 'Disk Failure', shortLabel: 'Disk', desc: 'Corrupts database I/O', icon: <HardDrive size={13} />, color: '#8b5cf6' },
    { id: 'network-split', label: 'Network Partition', shortLabel: 'Network', desc: 'Splits network in half', icon: <Unplug size={13} />, color: '#06b6d4' },
    { id: 'traffic-spike', label: 'Traffic Spike', shortLabel: 'Traffic', desc: 'Floods system with 3× load', icon: <TrendingUp size={13} />, color: '#f97316' },
    { id: 'memory-leak', label: 'Memory Leak', shortLabel: 'Memory', desc: 'OOM kills a random node', icon: <Brain size={13} />, color: '#ec4899' },
];
function getSimNodeMetrics(node, traffic, configs, chaosEvents, chaosTargets) {
    const cap = SIM_NODE_CAPACITY[node.componentId] || 500;
    const base = SIM_BASE_LATENCY[node.componentId] || 30;
    const rps = Math.min(traffic, cap) + (Math.random() - 0.5) * 20;
    let latency = base + (traffic / cap) * base * 0.5 + (Math.random() - 0.5) * 5;
    let errorRate = traffic > cap * 0.9 ? ((traffic - cap * 0.9) / (cap * 0.1)) * 5 : 0;
    if (chaosEvents.has('latency-spike')) latency *= 4;
    if (chaosEvents.has('disk-failure') && ['sql-db','nosql-db','object-storage','data-warehouse'].includes(node.componentId)) { latency *= 6; errorRate += 15; }
    if (chaosEvents.has('network-split')) { latency *= 2; errorRate += 8; }
    if (chaosTargets.has(node.id)) { errorRate = 100; latency = 0; }
    const isDown = chaosTargets.has(node.id);
    // Health score 0-100: higher is better
    const utilization = Math.min(traffic / cap, 1.5);
    const latencyRatio = base > 0 ? latency / (base * 5) : 0; // breach at 5× base, not 3×
    let health = 100;
    if (isDown) health = 0;
    else {
        health -= Math.min(utilization * 30, 40); // capacity penalty
        health -= Math.min(latencyRatio * 30, 40); // latency penalty
        health -= Math.min(errorRate * 0.8, 30); // error penalty
        health = Math.max(0, Math.min(100, health));
    }
    let status = 'healthy';
    if (isDown) status = 'down';
    else if (health < 25) status = 'critical';
    else if (health < 55) status = 'degraded';
    else if (health < 80) status = 'warning';
    return { rps: Math.max(0, rps), latency: Math.max(0, latency), errorRate: Math.min(100, Math.max(0, errorRate)), status, health: Math.round(health) };
}

function DesignCanvas({ problem, onBack }) {
    const [nodes, setNodes] = useState([]);
    const [connections, setConnections] = useState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedConn, setSelectedConn] = useState(null);
    const [connectingFrom, setConnectingFrom] = useState(null);
    const [dragNode, setDragNode] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [showHints, setShowHints] = useState(false);
    const [paletteCollapsed, setPaletteCollapsed] = useState(false);
    const [openCategories, setOpenCategories] = useState({ clients: true, networking: true, compute: true });
    const [feedback, setFeedback] = useState(null);
    const [loadingFeedback, setLoadingFeedback] = useState(false);
    const [showRequirements, setShowRequirements] = useState(true);
    const [showValidation, setShowValidation] = useState(true);
    const [snapEnabled, setSnapEnabled] = useState(true);
    const [viewTransform, setViewTransform] = useState({ x: 0, y: 0, scale: 1 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [connLabelEditing, setConnLabelEditing] = useState(null);
    const [nodeConfigs, setNodeConfigs] = useState({});
    const [editingLabel, setEditingLabel] = useState(null);
    const [editLabelText, setEditLabelText] = useState('');
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const canvasRef = useRef(null);
    const wrapperRef = useRef(null);

    // Simulation state
    const [simRunning, setSimRunning] = useState(false);
    const [simPaused, setSimPaused] = useState(false);
    const [simSpeed, setSimSpeed] = useState(1);
    const [simTraffic, setSimTraffic] = useState(200);
    const [simMetrics, setSimMetrics] = useState({ rps: 0, avgLatency: 0, errorRate: 0, cost: 0 });
    const [simNodeStatus, setSimNodeStatus] = useState({});
    const [simChaosEvents, setSimChaosEvents] = useState(new Set());
    const [simChaosTargets, setSimChaosTargets] = useState(new Set());
    const [simPackets, setSimPackets] = useState([]);
    const [simElapsed, setSimElapsed] = useState(0);
    const simTickRef = useRef(null);
    const packetIdRef = useRef(0);

    // Simulation engine
    useEffect(() => {
        if (!simRunning || simPaused) { if (simTickRef.current) clearInterval(simTickRef.current); simTickRef.current = null; return; }
        const tickMs = Math.round(200 / simSpeed);
        simTickRef.current = setInterval(() => {
            setSimElapsed(p => p + 0.2);
            const effectiveTraffic = simTraffic * (simChaosEvents.has('traffic-spike') ? 3 : 1);
            // Update per-node status
            const statusMap = {};
            let totalLatency = 0, totalErr = 0, totalCost = 0;
            const nonClientNodes = nodes.filter(n => !['web-client','mobile-client','iot-device'].includes(n.componentId));
            nonClientNodes.forEach(n => {
                const m = getSimNodeMetrics(n, effectiveTraffic, nodeConfigs, simChaosEvents, simChaosTargets);
                statusMap[n.id] = m;
                totalLatency += m.latency;
                totalErr += m.errorRate;
                totalCost += SIM_NODE_COST[n.componentId] || 10;
            });
            setSimNodeStatus(statusMap);
            const avg = nonClientNodes.length > 0 ? totalLatency / nonClientNodes.length : 0;
            const avgErr = nonClientNodes.length > 0 ? totalErr / nonClientNodes.length : 0;
            setSimMetrics({ rps: Math.round(effectiveTraffic), avgLatency: Math.round(avg), errorRate: Math.round(avgErr * 10) / 10, cost: Math.round(totalCost) });
            // Spawn packets on connections
            if (connections.length > 0 && Math.random() < 0.4 * simSpeed) {
                const connIdx = Math.floor(Math.random() * connections.length);
                const c = connections[connIdx];
                const hasError = avgErr > 10 && Math.random() < avgErr / 100;
                setSimPackets(prev => [...prev.filter(p => p.progress < 1), { id: packetIdRef.current++, connId: c.id, progress: 0, isError: hasError }]);
            }
            // Move existing packets
            setSimPackets(prev => prev.map(p => ({ ...p, progress: p.progress + 0.05 * simSpeed })).filter(p => p.progress < 1.1));
        }, tickMs);
        return () => { if (simTickRef.current) clearInterval(simTickRef.current); };
    }, [simRunning, simPaused, simSpeed, simTraffic, nodes, connections, nodeConfigs, simChaosEvents, simChaosTargets]);

    const stopSimulation = useCallback(() => {
        setSimRunning(false); setSimPaused(false); setSimNodeStatus({}); setSimPackets([]); setSimElapsed(0);
        setSimChaosEvents(new Set()); setSimChaosTargets(new Set()); setSimMetrics({ rps: 0, avgLatency: 0, errorRate: 0, cost: 0 });
    }, []);

    const triggerChaos = useCallback((chaosId) => {
        setSimChaosEvents(prev => { const n = new Set(prev); if (n.has(chaosId)) { n.delete(chaosId); return n; } n.add(chaosId); return n; });
        if (chaosId === 'server-crash') {
            const compute = nodes.filter(n => ['app-server','worker','serverless','scheduler'].includes(n.componentId));
            if (compute.length > 0) { const t = compute[Math.floor(Math.random() * compute.length)]; setSimChaosTargets(prev => { const n = new Set(prev); n.add(t.id); return n; }); }
        }
        if (chaosId === 'memory-leak') {
            const ncs = nodes.filter(n => !['web-client','mobile-client','iot-device'].includes(n.componentId));
            if (ncs.length > 0) { const t = ncs[Math.floor(Math.random() * ncs.length)]; setSimChaosTargets(prev => { const n = new Set(prev); n.add(t.id); return n; }); }
        }
        if (chaosId === 'traffic-spike') { setTimeout(() => { setSimChaosEvents(prev => { const n = new Set(prev); n.delete('traffic-spike'); return n; }); }, 10000); }
    }, [nodes]);

    const fixNode = useCallback((nodeId) => {
        setSimChaosTargets(prev => { const n = new Set(prev); n.delete(nodeId); return n; });
    }, []);

    // History
    const [hist, dispatchHist] = useReducer(historyReducer, { history: [{ nodes: [], connections: [] }], index: 0 });
    const pushHistory = useCallback((n, c) => { dispatchHist({ type: 'PUSH', snapshot: { nodes: n, connections: c } }); }, []);

    const undo = useCallback(() => {
        dispatchHist({ type: 'UNDO' });
        const s = hist.history[Math.max(0, hist.index - 1)];
        if (s) { setNodes(s.nodes); setConnections(s.connections); }
    }, [hist]);

    const redo = useCallback(() => {
        dispatchHist({ type: 'REDO' });
        const s = hist.history[Math.min(hist.history.length - 1, hist.index + 1)];
        if (s) { setNodes(s.nodes); setConnections(s.connections); }
    }, [hist]);

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e) => {
            if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
            if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
            if (e.key === 'Delete' && selectedNode) {
                deleteNode(selectedNode);
            }
            if (e.key === 'Escape') { setConnectingFrom(null); setSelectedNode(null); setSelectedConn(null); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [undo, redo, selectedNode]);

    const findOpenPosition = useCallback((existingNodes) => {
        const W = 160, H = 96, PAD = 20;
        const rect = canvasRef.current?.getBoundingClientRect();
        const cx = rect ? (rect.width / 2 - viewTransform.x) / viewTransform.scale : 400;
        const cy = rect ? (rect.height / 2 - viewTransform.y) / viewTransform.scale : 250;
        if (existingNodes.length === 0) return { x: cx - W / 2, y: cy - H / 2 };
        for (let ring = 0; ring < 20; ring++) {
            const radius = ring * (W + PAD);
            const count = ring === 0 ? 1 : Math.max(4, ring * 4);
            for (let i = 0; i < count; i++) {
                const angle = (2 * Math.PI * i) / count;
                const tx = cx + Math.cos(angle) * radius - W / 2;
                const ty = cy + Math.sin(angle) * radius - H / 2;
                const overlaps = existingNodes.some(n => Math.abs(n.x - tx) < W + PAD && Math.abs(n.y - ty) < H + PAD);
                if (!overlaps) return { x: snapEnabled ? snap(tx) : tx, y: snapEnabled ? snap(ty) : ty };
            }
        }
        return { x: cx + Math.random() * 300, y: cy + Math.random() * 200 };
    }, [viewTransform, snapEnabled]);

    const addNode = useCallback((component, dropX, dropY) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        let x, y;
        if (dropX !== undefined && dropY !== undefined && rect) {
            x = (dropX - rect.left - viewTransform.x) / viewTransform.scale;
            y = (dropY - rect.top - viewTransform.y) / viewTransform.scale;
            if (snapEnabled) { x = snap(x); y = snap(y); }
            x = Math.max(10, x - 70); y = Math.max(10, y - 35);
        } else {
            const pos = findOpenPosition(nodes);
            x = Math.max(10, pos.x); y = Math.max(10, pos.y);
        }
        const newNode = { id: `n-${nodeIdCounter++}`, componentId: component.id, label: component.label, icon: component.icon, color: component.categoryColor, category: component.category, x, y };
        const updated = [...nodes, newNode];
        setNodes(updated);
        pushHistory(updated, connections);
    }, [nodes, connections, viewTransform, snapEnabled, findOpenPosition, pushHistory]);

    const deleteNode = useCallback((nodeId) => {
        const un = nodes.filter(n => n.id !== nodeId);
        const uc = connections.filter(c => c.from !== nodeId && c.to !== nodeId);
        setNodes(un); setConnections(uc);
        if (selectedNode === nodeId) setSelectedNode(null);
        pushHistory(un, uc);
    }, [nodes, connections, selectedNode, pushHistory]);

    const duplicateNode = useCallback((nodeId) => {
        const orig = nodes.find(n => n.id === nodeId);
        if (!orig) return;
        const dup = { ...orig, id: `n-${nodeIdCounter++}`, x: orig.x + 30, y: orig.y + 30 };
        const updated = [...nodes, dup];
        setNodes(updated);
        pushHistory(updated, connections);
    }, [nodes, connections, pushHistory]);

    // Drag & drop from palette
    const handleDragOver = useCallback((e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }, []);
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;
        const comp = JSON.parse(data);
        addNode(comp, e.clientX, e.clientY);
    }, [addNode]);

    // Node drag on canvas
    const handleNodeMouseDown = (e, nodeId) => {
        if (connectingFrom) return;
        e.stopPropagation();
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left - viewTransform.x) / viewTransform.scale;
        const mouseY = (e.clientY - rect.top - viewTransform.y) / viewTransform.scale;
        setDragNode(nodeId);
        setDragOffset({ x: mouseX - node.x, y: mouseY - node.y });
        setSelectedNode(nodeId);
    };

    const handleCanvasMouseMove = useCallback((e) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
            setMousePos({ x: (e.clientX - rect.left - viewTransform.x) / viewTransform.scale, y: (e.clientY - rect.top - viewTransform.y) / viewTransform.scale });
        }
        if (isPanning) {
            setViewTransform(v => ({ ...v, x: v.x + (e.clientX - panStart.x), y: v.y + (e.clientY - panStart.y) }));
            setPanStart({ x: e.clientX, y: e.clientY });
            return;
        }
        if (!dragNode) return;
        let x = (e.clientX - rect.left - viewTransform.x) / viewTransform.scale - dragOffset.x;
        let y = (e.clientY - rect.top - viewTransform.y) / viewTransform.scale - dragOffset.y;
        if (snapEnabled) { x = snap(x); y = snap(y); }
        x = Math.max(0, x); y = Math.max(0, y);
        setNodes(prev => prev.map(n => n.id === dragNode ? { ...n, x, y } : n));
    }, [dragNode, dragOffset, viewTransform, snapEnabled, isPanning, panStart]);

    const handleCanvasMouseUp = useCallback(() => {
        if (dragNode) { pushHistory(nodes, connections); }
        setDragNode(null);
        setIsPanning(false);
    }, [dragNode, nodes, connections, pushHistory]);

    // Pan
    const handleCanvasMouseDown = useCallback((e) => {
        if (e.button === 0 || e.button === 1) {
            e.preventDefault();
            setIsPanning(true);
            setPanStart({ x: e.clientX, y: e.clientY });
        }
    }, []);

    // Zoom
    const handleWheel = useCallback((e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setViewTransform(v => {
            const newScale = Math.min(3, Math.max(0.2, v.scale * delta));
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return { ...v, scale: newScale };
            const mx = e.clientX - rect.left, my = e.clientY - rect.top;
            return { scale: newScale, x: mx - (mx - v.x) * (newScale / v.scale), y: my - (my - v.y) * (newScale / v.scale) };
        });
    }, []);

    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;
        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, [handleWheel]);

    // Connections
    const handleNodeClick = useCallback((e, nodeId) => {
        e.stopPropagation();
        if (connectingFrom) {
            if (connectingFrom !== nodeId) {
                const exists = connections.some(c => (c.from === connectingFrom && c.to === nodeId) || (c.from === nodeId && c.to === connectingFrom));
                if (!exists) {
                    const uc = [...connections, { id: `c-${Date.now()}`, from: connectingFrom, to: nodeId, label: '' }];
                    setConnections(uc);
                    pushHistory(nodes, uc);
                }
            }
            setConnectingFrom(null);
        } else {
            setSelectedNode(nodeId);
            setSelectedConn(null);
        }
    }, [connectingFrom, connections, nodes, pushHistory]);

    const deleteConnection = useCallback((connId) => {
        const uc = connections.filter(c => c.id !== connId);
        setConnections(uc);
        pushHistory(nodes, uc);
    }, [connections, nodes, pushHistory]);

    const setConnectionLabel = useCallback((connId, label) => {
        setConnections(prev => prev.map(c => c.id === connId ? { ...c, label } : c));
    }, []);

    const clearCanvas = () => { setNodes([]); setConnections([]); setSelectedNode(null); setConnectingFrom(null); setFeedback(null); pushHistory([], []); };

    const loadReference = useCallback(() => {
        if (!problem.referenceArchitecture) return;
        const refNodes = problem.referenceArchitecture.nodes.map(n => ({ ...n }));
        const refConns = problem.referenceArchitecture.connections.map((c, i) => ({ id: `ref-c-${Date.now()}-${i}`, from: c.from, to: c.to, label: c.label || '' }));
        setNodes(refNodes);
        setConnections(refConns);
        setSelectedNode(null);
        setConnectingFrom(null);
        setFeedback(null);
        pushHistory(refNodes, refConns);
        setViewTransform({ x: 0, y: 0, scale: 1 });
    }, [problem, pushHistory]);

    const doAutoLayout = () => {
        const laid = autoLayoutNodes(nodes, connections);
        setNodes(laid);
        pushHistory(laid, connections);
    };

    const toggleCategory = (catId) => { setOpenCategories(prev => ({ ...prev, [catId]: !prev[catId] })); };

    const getNodeCenter = (node) => ({ x: node.x + 70, y: node.y + 38 });

    const updateConfig = (nodeId, key, value) => {
        setNodeConfigs(prev => ({ ...prev, [nodeId]: { ...(prev[nodeId] || {}), [key]: value } }));
    };

    // Coverage & validation
    const coverage = useMemo(() => {
        const placed = new Set(nodes.map(n => n.componentId));
        const exp = problem.expectedComponents || [];
        const matched = exp.filter(id => placed.has(id));
        return { matched: matched.length, total: exp.length, pct: exp.length > 0 ? Math.round((matched.length / exp.length) * 100) : 0 };
    }, [nodes, problem]);

    const warnings = useMemo(() => validateArchitecture(nodes, connections), [nodes, connections]);

    // Submit
    const submitDesign = async () => {
        if (nodes.length < 3) return;
        setLoadingFeedback(true);
        try {
            const designDesc = nodes.map(n => { const cfg = nodeConfigs[n.id]; const cfgStr = cfg ? ` (${Object.entries(cfg).map(([k, v]) => `${k}: ${v}`).join(', ')})` : ''; return `${n.label}${cfgStr}`; }).join(', ');
            const connDesc = connections.map(c => { const f = nodes.find(n => n.id === c.from); const t = nodes.find(n => n.id === c.to); return f && t ? `${f.label} →${c.label ? ' [' + c.label + ']' : ''} ${t.label}` : ''; }).filter(Boolean).join('; ');
            const res = await fetch(`${API}/system-design/feedback`, {
                method: 'POST',
                headers: buildAuthHeaders(),
                body: JSON.stringify({ topicId: 1, design: `Problem: ${problem.title}\nComponents: ${designDesc}\nConnections: ${connDesc}\nRequirements: ${problem.requirements.functional.join(', ')}`, components: nodes.map(n => n.label) }),
            });
            const data = await res.json();
            setFeedback(data.feedback || data);
        } catch {
            setFeedback({ strengths: ['Design submitted'], improvements: ['AI service unreachable — try again'], score: 70, detailedFeedback: 'Review your design against the requirements and hints.' });
        }
        setLoadingFeedback(false);
    };

    const selectedNodeData = nodes.find(n => n.id === selectedNode);
    const configDefs = selectedNodeData ? COMPONENT_CONFIGS[selectedNodeData.componentId] : null;

    return (
        <div className="sd-sim-canvas-page" onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp}>
            {/* Top Bar */}
            <div className="sd-sim-topbar">
                <button onClick={onBack} className="sd-sim-back-btn"><ArrowLeft size={16} /><span>Back</span></button>
                <div className="sd-sim-topbar-center">
                    <span className="sd-sim-topbar-icon">{problem.icon}</span>
                    <h1 className="sd-sim-topbar-title">{problem.title}</h1>
                    <span className="sd-sim-topbar-diff" style={{ background: DIFF_COLORS[problem.difficulty].bg, border: `1px solid ${DIFF_COLORS[problem.difficulty].border}`, color: DIFF_COLORS[problem.difficulty].text }}>{problem.difficulty}</span>
                </div>
                <div className="sd-sim-topbar-actions">
                    <div className="sd-sim-toolbar-group">
                        <button onClick={undo} className="sd-sim-tb" title="Undo (Ctrl+Z)" disabled={hist.index <= 0}><Undo2 size={14} /></button>
                        <button onClick={redo} className="sd-sim-tb" title="Redo (Ctrl+Y)" disabled={hist.index >= hist.history.length - 1}><Redo2 size={14} /></button>
                    </div>
                    <div className="sd-sim-toolbar-group">
                        <button onClick={() => setSnapEnabled(p => !p)} className={`sd-sim-tb ${snapEnabled ? 'active' : ''}`} title="Snap to Grid"><Grid3X3 size={14} /></button>
                        <button onClick={doAutoLayout} className="sd-sim-tb" title="Auto Layout"><Layout size={14} /></button>
                    </div>
                    <div className="sd-sim-toolbar-group">
                        <button onClick={() => setViewTransform(v => ({ ...v, scale: Math.min(3, v.scale * 1.2) }))} className="sd-sim-tb" title="Zoom In"><ZoomIn size={14} /></button>
                        <span className="sd-sim-zoom-label">{Math.round(viewTransform.scale * 100)}%</span>
                        <button onClick={() => setViewTransform(v => ({ ...v, scale: Math.max(0.2, v.scale * 0.8) }))} className="sd-sim-tb" title="Zoom Out"><ZoomOut size={14} /></button>
                        <button onClick={() => setViewTransform({ x: 0, y: 0, scale: 1 })} className="sd-sim-tb" title="Reset View"><Maximize2 size={14} /></button>
                    </div>
                    {problem.referenceArchitecture && (
                        <button onClick={loadReference} className="sd-sim-topbar-btn sd-sim-ref-btn"><BookOpen size={14} /> Load Reference</button>
                    )}
                    <button onClick={clearCanvas} className="sd-sim-topbar-btn"><RotateCcw size={14} /> Clear</button>
                    {!simRunning ? (
                        <button onClick={() => { if (nodes.length >= 2) setSimRunning(true); }} className="sd-sim-simulate-btn" disabled={nodes.length < 2}><Play size={14} /> Simulate</button>
                    ) : (
                        <button onClick={stopSimulation} className="sd-sim-stop-sim-btn"><Square size={14} /> Stop</button>
                    )}
                    <button onClick={submitDesign} className="sd-sim-submit-btn" disabled={nodes.length < 3 || loadingFeedback}>
                        {loadingFeedback ? <><span className="sd-sim-spinner" /> Analyzing...</> : <><Zap size={14} /> Get AI Feedback</>}
                    </button>
                </div>
            </div>

            {/* Simulation Metrics Bar */}
            {simRunning && (
                <div className="sd-sim-metrics-bar">
                    <div className="sd-sim-metrics-left">
                        <div className="sd-sim-metric-chip">
                            <Activity size={12} />
                            <span className="sd-sim-metric-chip-val" style={{ color: simMetrics.rps > 2000 ? '#f87171' : simMetrics.rps > 800 ? '#fbbf24' : '#34d399' }}>{simMetrics.rps.toLocaleString()}</span>
                            <span className="sd-sim-metric-chip-unit">req/s</span>
                        </div>
                        <div className="sd-sim-metric-chip">
                            <Timer size={12} />
                            <span className="sd-sim-metric-chip-val" style={{ color: simMetrics.avgLatency > 200 ? '#f87171' : simMetrics.avgLatency > 50 ? '#fbbf24' : '#34d399' }}>{simMetrics.avgLatency}</span>
                            <span className="sd-sim-metric-chip-unit">ms</span>
                        </div>
                        <div className="sd-sim-metric-chip">
                            <AlertTriangle size={12} />
                            <span className="sd-sim-metric-chip-val" style={{ color: simMetrics.errorRate > 5 ? '#f87171' : simMetrics.errorRate > 1 ? '#fbbf24' : '#34d399' }}>{simMetrics.errorRate}</span>
                            <span className="sd-sim-metric-chip-unit">% err</span>
                        </div>
                        <div className="sd-sim-metric-chip">
                            <DollarSign size={12} />
                            <span className="sd-sim-metric-chip-val" style={{ color: '#60a5fa' }}>${simMetrics.cost}</span>
                            <span className="sd-sim-metric-chip-unit">/mo</span>
                        </div>
                    </div>
                    <div className="sd-sim-metrics-right">
                        {simChaosEvents.size > 0 && (
                            <div className="sd-sim-active-chaos-tag">
                                <Zap size={11} /> {simChaosEvents.size} active
                            </div>
                        )}
                        <div className="sd-sim-metric-elapsed">
                            <Clock size={12} />
                            <span>{Math.floor(simElapsed / 60)}:{String(Math.floor(simElapsed) % 60).padStart(2, '0')}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="sd-sim-workspace">
                {/* Left: Palette */}
                <div className={`sd-sim-palette ${paletteCollapsed ? 'collapsed' : ''}`}>
                    <div className="sd-sim-palette-header">
                        {!paletteCollapsed && <span className="sd-sim-palette-title">Components</span>}
                        <button onClick={() => setPaletteCollapsed(p => !p)} className="sd-sim-palette-toggle">{paletteCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}</button>
                    </div>
                    {!paletteCollapsed && (
                        <div className="sd-sim-palette-list">
                            {SD_COMPONENT_CATEGORIES.map(cat => (
                                <div key={cat.id} className="sd-sim-palette-cat">
                                    <button className="sd-sim-palette-cat-header" onClick={() => toggleCategory(cat.id)}>
                                        <span style={{ color: cat.color, fontWeight: 600, fontSize: 12 }}>{cat.label}</span>
                                        {openCategories[cat.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    </button>
                                    {openCategories[cat.id] && (
                                        <div className="sd-sim-palette-items">
                                            {cat.components.map(comp => (
                                                <div key={comp.id} className="sd-sim-palette-item"
                                                    draggable
                                                    onDragStart={(e) => {
                                                        e.dataTransfer.setData('application/json', JSON.stringify({ ...comp, categoryColor: cat.color, category: cat.id }));
                                                        e.dataTransfer.effectAllowed = 'copy';
                                                    }}
                                                    onClick={() => addNode({ ...comp, categoryColor: cat.color, category: cat.id })}
                                                    title={comp.desc}
                                                >
                                                    <span className="sd-sim-palette-item-icon" style={{ color: cat.color }}>{getIcon(comp.id, 15)}</span>
                                                    <span className="sd-sim-palette-item-label">{comp.label}</span>
                                                    <Plus size={12} className="sd-sim-palette-item-add" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Center: Canvas */}
                <div className="sd-sim-canvas-area" ref={wrapperRef}
                    onDragOver={handleDragOver} onDrop={handleDrop}
                    onMouseDown={(e) => { if (!e.target.closest('.sd-sim-node')) { handleCanvasMouseDown(e); setSelectedNode(null); setSelectedConn(null); setConnectingFrom(null); } }}
                >
                    {connectingFrom && (
                        <div className="sd-sim-connect-indicator"><Link2 size={14} /> Click a component to connect <button onClick={() => setConnectingFrom(null)} className="sd-sim-connect-cancel"><X size={12} /></button></div>
                    )}

                    <div className="sd-sim-canvas-transform" ref={canvasRef}
                        style={{ transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})`, transformOrigin: '0 0' }}
                    >
                        {/* Grid */}
                        <svg className="sd-sim-grid-bg" width="4000" height="4000" style={{ position: 'absolute', top: -2000, left: -2000 }}>
                            <defs>
                                <pattern id="sd-grid-small" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
                                    <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
                                </pattern>
                                <pattern id="sd-grid-large" width={GRID_SIZE * 5} height={GRID_SIZE * 5} patternUnits="userSpaceOnUse">
                                    <rect width={GRID_SIZE * 5} height={GRID_SIZE * 5} fill="url(#sd-grid-small)" />
                                    <path d={`M ${GRID_SIZE * 5} 0 L 0 0 0 ${GRID_SIZE * 5}`} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                </pattern>
                            </defs>
                            <rect fill="url(#sd-grid-large)" width="4000" height="4000" />
                        </svg>

                        {/* Connections */}
                        <svg className="sd-sim-connections-svg" width="100%" height="100%" style={{ position: 'absolute', inset: 0, zIndex: 10, overflow: 'visible' }}>
                            <defs>
                                <marker id="sd-arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
                                    <path d="M0,0 L10,4 L0,8 L2,4 Z" fill="rgba(16,185,129,0.7)" />
                                </marker>
                                <marker id="sd-arrow-sel" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
                                    <path d="M0,0 L10,4 L0,8 L2,4 Z" fill="#60a5fa" />
                                </marker>
                                <filter id="sd-glow">
                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                </filter>
                            </defs>
                            {connections.map(conn => {
                                const fromNode = nodes.find(n => n.id === conn.from);
                                const toNode = nodes.find(n => n.id === conn.to);
                                if (!fromNode || !toNode) return null;
                                const { path: d, mid } = smartBezier(fromNode, toNode);
                                const isSel = selectedConn === conn.id;
                                return (
                                    <g key={conn.id} onClick={(e) => { e.stopPropagation(); setSelectedConn(conn.id); setSelectedNode(null); }} style={{ cursor: 'pointer' }}>
                                        {/* Hit area */}
                                        <path d={d} fill="none" stroke="transparent" strokeWidth="24" />
                                        {/* Glow */}
                                        {isSel && <path d={d} fill="none" stroke="rgba(96,165,250,0.2)" strokeWidth="8" filter="url(#sd-glow)" />}
                                        {/* Main line */}
                                        <path d={d} fill="none"
                                            stroke={isSel ? 'rgba(96,165,250,0.8)' : 'rgba(16,185,129,0.45)'}
                                            strokeWidth={isSel ? 2.5 : 2}
                                            markerEnd={isSel ? 'url(#sd-arrow-sel)' : 'url(#sd-arrow)'}
                                            className="sd-sim-conn-path"
                                        />
                                        {/* Flow animation */}
                                        <path d={d} fill="none" stroke={isSel ? 'rgba(96,165,250,0.6)' : 'rgba(16,185,129,0.5)'}
                                            strokeWidth="2" strokeDasharray="4 12" className="sd-sim-conn-flow" />
                                        {/* Label */}
                                        {conn.label && (() => {
                                            const lw = Math.max(56, conn.label.length * 7 + 20);
                                            return (
                                                <g>
                                                    <rect x={mid.x - lw / 2} y={mid.y - 11} width={lw} height="22" rx="6"
                                                        fill="rgba(5,5,7,0.92)" stroke={isSel ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.15)'} strokeWidth="1" />
                                                    <text x={mid.x} y={mid.y + 4} textAnchor="middle" fill={isSel ? '#60a5fa' : 'rgba(255,255,255,0.65)'} fontSize="9.5" fontWeight="600" fontFamily="Inter, sans-serif">{conn.label}</text>
                                                </g>
                                            );
                                        })()}
                                        {isSel && !conn.label && (
                                            <text x={mid.x} y={mid.y - 10} textAnchor="middle" fill="rgba(96,165,250,0.5)" fontSize="9" fontFamily="Inter, sans-serif">click to label</text>
                                        )}
                                    </g>
                                );
                            })}
                            {/* Live preview line while connecting */}
                            {connectingFrom && (() => {
                                const srcNode = nodes.find(n => n.id === connectingFrom);
                                if (!srcNode) return null;
                                const edge = getEdgePoint(srcNode, mousePos.x, mousePos.y);
                                return <path d={simpleBezier(edge.x, edge.y, mousePos.x, mousePos.y)} fill="none" stroke="rgba(96,165,250,0.5)" strokeWidth="2" strokeDasharray="6 6" className="sd-sim-conn-preview" />;
                            })()}
                            {/* Simulation Packets */}
                            {simRunning && simPackets.map(pkt => {
                                const conn = connections.find(c => c.id === pkt.connId);
                                if (!conn) return null;
                                const fromNode = nodes.find(n => n.id === conn.from);
                                const toNode = nodes.find(n => n.id === conn.to);
                                if (!fromNode || !toNode) return null;
                                const t = pkt.progress;
                                const sx = fromNode.x + 70, sy = fromNode.y + 38;
                                const ex = toNode.x + 70, ey = toNode.y + 38;
                                const cx = sx + (ex - sx) * t, cy = sy + (ey - sy) * t;
                                return (
                                    <circle key={pkt.id} cx={cx} cy={cy} r="4"
                                        fill={pkt.isError ? '#ef4444' : '#10b981'}
                                        opacity={0.9}
                                        className="sd-sim-packet"
                                    />
                                );
                            })}
                        </svg>

                        {/* Nodes */}
                        {nodes.map(node => {
                            const isSel = selectedNode === node.id;
                            const isConn = connectingFrom === node.id;
                            return (
                                <div key={node.id}
                                    className={`sd-sim-node ${isSel ? 'selected' : ''} ${isConn ? 'connecting' : ''}`}
                                    style={{ left: node.x, top: node.y, '--node-color': node.color }}
                                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                                    onClick={(e) => handleNodeClick(e, node.id)}
                                >
                                    <div className="sd-sim-node-color-bar" style={{ background: node.color }} />
                                    <div className="sd-sim-node-icon" style={{ color: node.color }}>{getIcon(node.componentId, 20)}</div>
                                    {editingLabel === node.id ? (
                                        <input className="sd-sim-node-edit-input" autoFocus value={editLabelText}
                                            onChange={e => setEditLabelText(e.target.value)}
                                            onBlur={() => { if (editLabelText.trim()) setNodes(prev => prev.map(n => n.id === node.id ? { ...n, label: editLabelText.trim() } : n)); setEditingLabel(null); }}
                                            onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditingLabel(null); }}
                                            onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}
                                        />
                                    ) : (
                                        <div className="sd-sim-node-label" onDoubleClick={(e) => { e.stopPropagation(); setEditingLabel(node.id); setEditLabelText(node.label); }}>{node.label}</div>
                                    )}
                                    {nodeConfigs[node.id] && Object.keys(nodeConfigs[node.id]).length > 0 && (
                                        <div className="sd-sim-node-config-badge"><Settings2 size={8} /></div>
                                    )}
                                    {isSel && !connectingFrom && (
                                        <div className="sd-sim-node-actions">
                                            <button onClick={(e) => { e.stopPropagation(); setConnectingFrom(node.id); }} className="sd-sim-node-action-btn connect" title="Connect"><Link2 size={11} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); duplicateNode(node.id); }} className="sd-sim-node-action-btn duplicate" title="Duplicate"><Copy size={11} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }} className="sd-sim-node-action-btn delete" title="Delete"><Trash2 size={11} /></button>
                                        </div>
                                    )}
                                    {/* Simulation status badge */}
                                    {simRunning && simNodeStatus[node.id] && (
                                        <div className={`sd-sim-node-status-badge sd-sim-status-${simNodeStatus[node.id].status}`}
                                            title={`${Math.round(simNodeStatus[node.id].latency)}ms latency · ${Math.round(simNodeStatus[node.id].rps)} req/s · ${Math.round(simNodeStatus[node.id].errorRate)}% errors`}
                                        >
                                            <div className="sd-sim-health-bar-wrap">
                                                <div className="sd-sim-health-bar" style={{ width: `${simNodeStatus[node.id].health}%` }} />
                                            </div>
                                            <span className="sd-sim-status-label">
                                                {simNodeStatus[node.id].status === 'healthy' ? '✓ Healthy' :
                                                 simNodeStatus[node.id].status === 'warning' ? '⚠ Stressed' :
                                                 simNodeStatus[node.id].status === 'degraded' ? '⚠ Degraded' :
                                                 simNodeStatus[node.id].status === 'critical' ? '✕ Critical' : '✕ Down'}
                                            </span>
                                            {(simNodeStatus[node.id].status === 'critical' || simNodeStatus[node.id].status === 'down') && (
                                                <button className="sd-sim-fix-btn" onClick={(e) => { e.stopPropagation(); fixNode(node.id); }}>
                                                    <Wrench size={10} /> Fix
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {nodes.length === 0 && (
                            <div className="sd-sim-canvas-empty">
                                <Move size={36} strokeWidth={1.2} />
                                <h3>Drag components here</h3>
                                <p>Drag from palette or click to add • Click blank area to pan • Scroll to zoom</p>
                            </div>
                        )}
                    </div>

                    {/* Mini-map */}
                    {nodes.length > 0 && (
                        <div className="sd-sim-minimap">
                            <svg width="100%" height="100%" viewBox={`${Math.min(...nodes.map(n => n.x)) - 40} ${Math.min(...nodes.map(n => n.y)) - 40} ${Math.max(300, Math.max(...nodes.map(n => n.x)) - Math.min(...nodes.map(n => n.x)) + 200)} ${Math.max(200, Math.max(...nodes.map(n => n.y)) - Math.min(...nodes.map(n => n.y)) + 120)}`}>
                                {connections.map(c => {
                                    const f = nodes.find(n => n.id === c.from);
                                    const t = nodes.find(n => n.id === c.to);
                                    return f && t ? <line key={c.id} x1={f.x + 70} y1={f.y + 38} x2={t.x + 70} y2={t.y + 38} stroke="rgba(16,185,129,0.4)" strokeWidth="3" /> : null;
                                })}
                                {nodes.map(n => <rect key={n.id} x={n.x} y={n.y} width="140" height="76" rx="8" fill={n.color + '33'} stroke={n.color} strokeWidth="2" />)}
                            </svg>
                        </div>
                    )}

                    {/* Simulation Control Bar */}
                    {simRunning && (
                        <div className="sd-sim-control-bar">
                            <div className="sd-sim-ctrl-section">
                                <button onClick={() => setSimPaused(p => !p)} className={`sd-sim-ctrl-btn sd-sim-play-btn ${simPaused ? 'paused' : ''}`} title={simPaused ? 'Resume' : 'Pause'}>
                                    {simPaused ? <Play size={15} /> : <Pause size={15} />}
                                </button>
                                <div className="sd-sim-speed-btns">
                                    {[1, 2, 5].map(s => (
                                        <button key={s} onClick={() => setSimSpeed(s)} className={`sd-sim-speed-btn ${simSpeed === s ? 'active' : ''}`}>{s}×</button>
                                    ))}
                                </div>
                            </div>
                            <div className="sd-sim-ctrl-divider" />
                            <div className="sd-sim-ctrl-section sd-sim-traffic-section">
                                <span className="sd-sim-section-label"><Activity size={11} /> Traffic</span>
                                <input type="range" min="0" max="1000" step="10" value={simTraffic}
                                    onChange={e => setSimTraffic(Number(e.target.value))}
                                    onMouseDown={e => e.stopPropagation()}
                                    onTouchStart={e => e.stopPropagation()}
                                    className="sd-sim-traffic-slider" />
                                <span className="sd-sim-traffic-val">{simTraffic} rps</span>
                            </div>
                            <div className="sd-sim-ctrl-divider" />
                            <div className="sd-sim-ctrl-section sd-sim-chaos-section">
                                <span className="sd-sim-section-label sd-sim-chaos-title"><Zap size={11} /> Inject Fault</span>
                                <div className="sd-sim-chaos-grid">
                                    {CHAOS_TYPES.map(ch => (
                                        <button key={ch.id}
                                            onClick={() => triggerChaos(ch.id)}
                                            className={`sd-sim-chaos-btn ${simChaosEvents.has(ch.id) ? 'active' : ''}`}
                                            title={`${ch.label}: ${ch.desc}`}
                                            style={{ '--chaos-color': ch.color }}
                                        >
                                            {ch.icon}
                                            <span className="sd-sim-chaos-btn-label">{ch.shortLabel}</span>
                                        </button>
                                    ))}
                                </div>
                                {simChaosEvents.size > 0 && (
                                    <button onClick={() => { setSimChaosEvents(new Set()); setSimChaosTargets(new Set()); }} className="sd-sim-reset-chaos-btn" title="Reset All Faults">
                                        <RotateCcw size={11} /> Reset
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel */}
                <div className="sd-sim-right-panel">
                    {feedback ? (
                        <FeedbackPanel feedback={feedback} onClose={() => setFeedback(null)} />
                    ) : (
                        <>
                            {/* Component Config */}
                            {selectedNodeData && configDefs && (
                                <div className="sd-sim-section sd-sim-config-section">
                                    <div className="sd-sim-section-header" style={{ cursor: 'default' }}>
                                        <Settings2 size={14} /> <span>{selectedNodeData.label} Config</span>
                                    </div>
                                    <div className="sd-sim-section-body">
                                        {configDefs.map(cfg => {
                                            const val = nodeConfigs[selectedNode]?.[cfg.key] ?? cfg.default;
                                            return (
                                                <div key={cfg.key} className="sd-sim-config-field">
                                                    <label>{cfg.label}</label>
                                                    {cfg.type === 'number' && <input type="number" min={cfg.min} max={cfg.max} value={val} onChange={e => updateConfig(selectedNode, cfg.key, parseInt(e.target.value) || cfg.default)} className="sd-sim-config-input" />}
                                                    {cfg.type === 'toggle' && <button onClick={() => updateConfig(selectedNode, cfg.key, !val)} className={`sd-sim-config-toggle ${val ? 'on' : ''}`}>{val ? 'ON' : 'OFF'}</button>}
                                                    {cfg.type === 'select' && <select value={val} onChange={e => updateConfig(selectedNode, cfg.key, e.target.value)} className="sd-sim-config-input">{cfg.options.map(o => <option key={o} value={o}>{o}</option>)}</select>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Connection Label */}
                            {selectedConn && (
                                <div className="sd-sim-section">
                                    <div className="sd-sim-section-header" style={{ cursor: 'default' }}><Tag size={14} /> <span>Connection Label</span></div>
                                    <div className="sd-sim-section-body">
                                        <div className="sd-sim-protocol-grid">
                                            {PROTOCOLS.map(p => (
                                                <button key={p} className={`sd-sim-protocol-btn ${connections.find(c => c.id === selectedConn)?.label === p ? 'active' : ''}`}
                                                    onClick={() => setConnectionLabel(selectedConn, connections.find(c => c.id === selectedConn)?.label === p ? '' : p)}
                                                >{p}</button>
                                            ))}
                                        </div>
                                        <div className="sd-sim-conn-text-input-wrap">
                                            <input
                                                type="text"
                                                className="sd-sim-conn-text-input"
                                                placeholder="Custom label…"
                                                value={connections.find(c => c.id === selectedConn)?.label || ''}
                                                onChange={e => setConnectionLabel(selectedConn, e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                                            />
                                        </div>
                                        <button onClick={() => deleteConnection(selectedConn)} className="sd-sim-delete-conn-btn"><Trash2 size={12} /> Delete Connection</button>
                                    </div>
                                </div>
                            )}

                            {/* Validation */}
                            {warnings.length > 0 && (
                                <div className="sd-sim-section">
                                    <button className="sd-sim-section-header" onClick={() => setShowValidation(p => !p)}>
                                        <Shield size={14} /> <span>Validation ({warnings.length})</span>
                                        {showValidation ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>
                                    {showValidation && (
                                        <div className="sd-sim-section-body sd-sim-warnings">
                                            {warnings.map((w, i) => (
                                                <div key={i} className={`sd-sim-warning-item ${w.type}`}>
                                                    <AlertTriangle size={12} /> <span>{w.msg}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Requirements */}
                            <div className="sd-sim-section">
                                <button className="sd-sim-section-header" onClick={() => setShowRequirements(p => !p)}>
                                    <Target size={14} /> <span>Requirements</span>
                                    {showRequirements ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                                {showRequirements && (
                                    <div className="sd-sim-section-body">
                                        <div className="sd-sim-req-group">
                                            <span className="sd-sim-req-label">Functional</span>
                                            {problem.requirements.functional.map((r, i) => <div key={i} className="sd-sim-req-item"><span className="sd-sim-req-dot" style={{ color: '#34d399' }}>•</span><span>{r}</span></div>)}
                                        </div>
                                        <div className="sd-sim-req-group" style={{ marginTop: 10 }}>
                                            <span className="sd-sim-req-label">Non-Functional</span>
                                            {problem.requirements.nonFunctional.map((r, i) => <div key={i} className="sd-sim-req-item"><span className="sd-sim-req-dot" style={{ color: '#fbbf24' }}>•</span><span>{r}</span></div>)}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Coverage */}
                            <div className="sd-sim-section">
                                <div className="sd-sim-section-header" style={{ cursor: 'default' }}><Star size={14} /> <span>Coverage</span>
                                    <span className="sd-sim-coverage-pct" style={{ color: coverage.pct >= 80 ? '#34d399' : coverage.pct >= 50 ? '#fbbf24' : '#f87171' }}>{coverage.pct}%</span>
                                </div>
                                <div className="sd-sim-coverage-bar"><div className="sd-sim-coverage-fill" style={{ width: `${coverage.pct}%`, background: coverage.pct >= 80 ? '#34d399' : coverage.pct >= 50 ? '#fbbf24' : '#f87171' }} /></div>
                                <div className="sd-sim-coverage-text">{coverage.matched}/{coverage.total} expected components</div>
                            </div>

                            {/* Stats */}
                            <div className="sd-sim-stats">
                                <div className="sd-sim-stat"><span className="sd-sim-stat-num">{nodes.length}</span><span className="sd-sim-stat-label">Components</span></div>
                                <div className="sd-sim-stat"><span className="sd-sim-stat-num">{connections.length}</span><span className="sd-sim-stat-label">Connections</span></div>
                            </div>

                            {/* Hints */}
                            <div className="sd-sim-section">
                                <button className="sd-sim-section-header" onClick={() => setShowHints(p => !p)}><Lightbulb size={14} /> <span>Hints</span>{showHints ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                                {showHints && (
                                    <div className="sd-sim-section-body sd-sim-hints">
                                        {problem.hints.map((h, i) => <div key={i} className="sd-sim-hint-item"><span className="sd-sim-hint-num">{i + 1}</span><span>{h}</span></div>)}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════
//  FEEDBACK PANEL
// ═══════════════════════════════════════════
function FeedbackPanel({ feedback, onClose }) {
    const score = feedback?.score || 0;
    const scoreColor = score >= 80 ? '#34d399' : score >= 60 ? '#fbbf24' : '#f87171';
    return (
        <div className="sd-sim-feedback">
            <div className="sd-sim-feedback-header"><h3>AI Feedback</h3><button onClick={onClose} className="sd-sim-feedback-close"><X size={16} /></button></div>
            <div className="sd-sim-score-ring">
                <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke={scoreColor} strokeWidth="6"
                        strokeDasharray={`${2 * Math.PI * 42}`} strokeDashoffset={`${2 * Math.PI * 42 * (1 - score / 100)}`}
                        strokeLinecap="round" style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 1s ease' }} />
                    <text x="50" y="46" textAnchor="middle" fill="white" fontSize="22" fontWeight="700">{score}</text>
                    <text x="50" y="62" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10">/100</text>
                </svg>
            </div>
            {feedback?.strengths?.length > 0 && (
                <div className="sd-sim-feedback-section"><h4 style={{ color: '#34d399' }}>✓ Strengths</h4>
                    {feedback.strengths.map((s, i) => <div key={i} className="sd-sim-feedback-item strength"><Check size={12} /> <span>{s}</span></div>)}
                </div>
            )}
            {feedback?.improvements?.length > 0 && (
                <div className="sd-sim-feedback-section"><h4 style={{ color: '#fbbf24' }}>⚡ Improvements</h4>
                    {feedback.improvements.map((s, i) => <div key={i} className="sd-sim-feedback-item improvement"><AlertTriangle size={12} /> <span>{s}</span></div>)}
                </div>
            )}
            {feedback?.detailedFeedback && <div className="sd-sim-feedback-detail"><p>{feedback.detailedFeedback}</p></div>}
            <button onClick={onClose} className="sd-sim-feedback-back-btn"><ArrowLeft size={14} /> Back to Design</button>
        </div>
    );
}

// ═══════════════════════════════════════════
//  MAIN EXPORT
// ═══════════════════════════════════════════
export default function SystemDesignSimulator() {
    const [selectedProblem, setSelectedProblem] = useState(null);
    if (selectedProblem) return <DesignCanvas problem={selectedProblem} onBack={() => setSelectedProblem(null)} />;
    return <ProblemCatalog onSelect={setSelectedProblem} />;
}
