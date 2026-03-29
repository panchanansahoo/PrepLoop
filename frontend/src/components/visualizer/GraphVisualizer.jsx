import { useMemo } from 'react';

const NODE_RADIUS = 22;

const DARK_COLORS = {
  unvisited: 'rgba(255,255,255,0.12)',
  visiting: '#fbbf24',
  visited: '#22c55e',
  current: '#8b5cf6',
  exploring: '#22d3ee',
  edgeDefault: 'rgba(255,255,255,0.1)',
  edgeActive: '#8b5cf670',
};

const LIGHT_COLORS = {
  unvisited: '#d1d5db',
  visiting: '#fbbf24',
  visited: '#22c55e',
  current: '#8b5cf6',
  exploring: '#22d3ee',
  edgeDefault: '#e5e7eb',
  edgeActive: '#8b5cf670',
};

export default function GraphVisualizer({ step }) {
  const nodes = step?.nodes || [];
  const edges = step?.edges || [];
  const visited = step?.visited || [];
  const current = step?.current;
  const exploring = step?.exploring;
  const queue = step?.queue;
  const order = step?.order || [];
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const C = isLight ? LIGHT_COLORS : DARK_COLORS;

  // Force-layout positions (pre-computed for default 7-node graph)
  const positions = useMemo(() => {
    const n = nodes.length;
    if (n <= 7) {
      // Aesthetic hand-tuned positions for 7-node graph
      const layouts = {
        7: [
          { x: 350, y: 60 },   // 0 (root)
          { x: 200, y: 160 },  // 1
          { x: 500, y: 160 },  // 2
          { x: 120, y: 280 },  // 3
          { x: 280, y: 280 },  // 4
          { x: 420, y: 280 },  // 5
          { x: 580, y: 280 },  // 6
        ],
      };
      if (layouts[n]) return layouts[n];
    }
    // Circular fallback
    const cx = 350, cy = 180, r = 140;
    return nodes.map((_, i) => ({
      x: cx + r * Math.cos((2 * Math.PI * i) / n - Math.PI / 2),
      y: cy + r * Math.sin((2 * Math.PI * i) / n - Math.PI / 2),
    }));
  }, [nodes]);

  if (!step || !nodes.length) return null;

  const getNodeColor = (node) => {
    if (node === current) return C.current;
    if (node === exploring) return C.exploring;
    if (visited.includes(node)) return C.visited;
    return C.unvisited;
  };

  const getNodeGlow = (node) => {
    if (node === current) return `0 0 20px ${C.current}80`;
    if (node === exploring) return `0 0 16px ${C.exploring}60`;
    return 'none';
  };

  const isEdgeActive = (u, v) => {
    if (current !== null && exploring !== undefined) {
      return (u === current && v === exploring) || (v === current && u === exploring);
    }
    return false;
  };

  return (
    <div className="gv-container">
      {/* Graph SVG */}
      <svg width="700" height="360" viewBox="0 0 700 360" style={{ maxWidth: '100%' }}>
        {/* Edges */}
        {edges.map(([u, v], i) => {
          const p1 = positions[u];
          const p2 = positions[v];
          if (!p1 || !p2) return null;
          const active = isEdgeActive(u, v);
          return (
            <line key={i}
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke={active ? C.exploring : (visited.includes(u) && visited.includes(v)) ? C.edgeActive : C.edgeDefault}
              strokeWidth={active ? 3 : 2}
              strokeLinecap="round"
              style={{ transition: 'all 0.3s ease' }}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node, i) => {
          const pos = positions[i];
          if (!pos) return null;
          const color = getNodeColor(node);
          const isActive = node === current || node === exploring;
          return (
            <g key={node} style={{ transition: 'all 0.3s ease' }}>
              {/* Glow ring */}
              {isActive && (
                <circle cx={pos.x} cy={pos.y} r={NODE_RADIUS + 6}
                  fill="none" stroke={color} strokeWidth={2} opacity={0.3}
                  style={{ animation: 'pulse 1.5s ease infinite' }}
                />
              )}
              {/* Node circle */}
              <circle cx={pos.x} cy={pos.y} r={NODE_RADIUS}
                fill={`${color}25`}
                stroke={color}
                strokeWidth={2.5}
                style={{ filter: isActive ? `drop-shadow(0 0 8px ${color}80)` : 'none', transition: 'all 0.3s ease' }}
              />
              {/* Node label */}
              <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="central"
                className="gv-node-label"
                data-state={isActive ? 'active' : visited.includes(node) ? 'visited' : 'default'}
                fontSize={14} fontWeight={700} fontFamily="system-ui"
              >{node}</text>
              {/* Visit order badge */}
              {order.includes(node) && (
                <g>
                  <circle cx={pos.x + NODE_RADIUS - 2} cy={pos.y - NODE_RADIUS + 2} r={9}
                    className="gv-order-badge-bg"
                    stroke={C.visited} strokeWidth={1.5}
                  />
                  <text x={pos.x + NODE_RADIUS - 2} y={pos.y - NODE_RADIUS + 3} textAnchor="middle" dominantBaseline="central"
                    fill={C.visited} fontSize={8} fontWeight={800} fontFamily="system-ui"
                  >{order.indexOf(node) + 1}</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Queue / Stack indicator */}
      {queue && (
        <div className="gv-info-bar">
          <span className="gv-info-label">Queue:</span>
          <div className="gv-info-items">
            {queue.length === 0 ? (
              <span className="gv-info-empty">empty</span>
            ) : queue.map((node, i) => (
              <span key={i} className="gv-info-chip gv-info-chip-purple">{node}</span>
            ))}
          </div>
        </div>
      )}

      {/* Traversal order */}
      {order.length > 0 && (
        <div className="gv-info-bar">
          <span className="gv-info-label">Order:</span>
          <div className="gv-info-items">
            {order.map((node, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="gv-info-chip gv-info-chip-green">{node}</span>
                {i < order.length - 1 && <span className="gv-info-arrow">→</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="gv-legend">
        <LegendItem color={C.unvisited} label="Unvisited" />
        <LegendItem color={C.current} label="Current" />
        <LegendItem color={C.exploring} label="Exploring" />
        <LegendItem color={C.visited} label="Visited" />
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
      `}</style>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="gv-legend-item">
      <div className="gv-legend-dot" style={{ background: `${color}40`, border: `2px solid ${color}` }} />
      <span>{label}</span>
    </div>
  );
}
