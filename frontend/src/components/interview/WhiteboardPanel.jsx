import { useRef, useState, useEffect, useCallback, memo } from 'react';
import {
  Pen,
  Eraser,
  Square,
  Minus,
  RotateCcw,
  Trash2,
  Download,
  Palette,
} from 'lucide-react';

const COLORS = [
  '#f8fafc', // white
  '#818cf8', // indigo
  '#38bdf8', // sky
  '#4ade80', // green
  '#facc15', // yellow
  '#f87171', // red
];

const STROKE_WIDTHS = [2, 4, 8];

/**
 * WhiteboardPanel — System Design Visual Architecture Canvas
 *
 * Provides a low-latency HTML5 drawing surface for system design diagrams:
 * - Freehand pen & eraser
 * - Rectangle & straight line drawing tools
 * - Undo stack & clear
 * - Canvas snapshot export for interview context submission
 */
function WhiteboardPanel({ onSnapshotChange, stage = 'System Design' }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const isDrawingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const snapshotImageRef = useRef(null);
  const historyRef = useRef([]);

  const [tool, setTool] = useState('pen'); // 'pen' | 'eraser' | 'rect' | 'line'
  const [color, setColor] = useState('#818cf8');
  const [strokeWidth, setStrokeWidth] = useState(3);

  // Resize canvas to fill container while keeping content
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);

    if (width === 0 || height === 0) return;

    // Save existing drawing data
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Restore previous drawing
    if (tempCanvas.width > 0 && tempCanvas.height > 0) {
      ctx.drawImage(tempCanvas, 0, 0, width, height);
    } else {
      // Draw dark architectural background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    const handleResize = () => resizeCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [resizeCanvas]);

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      historyRef.current.push(dataUrl);
      if (historyRef.current.length > 20) historyRef.current.shift();
      onSnapshotChange?.(dataUrl);
    } catch {
      // Ignore security errors
    }
  }, [onSnapshotChange]);

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    const coords = getCanvasCoordinates(e);
    isDrawingRef.current = true;
    startPosRef.current = coords;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (tool === 'rect' || tool === 'line') {
      // Save canvas snapshot for shape preview
      snapshotImageRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } else {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    }
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const coords = getCanvasCoordinates(e);

    ctx.lineWidth = strokeWidth;

    if (tool === 'eraser') {
      ctx.strokeStyle = '#0f172a'; // Background color
      ctx.lineWidth = strokeWidth * 3;
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    } else if (tool === 'pen') {
      ctx.strokeStyle = color;
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    } else if (tool === 'rect') {
      if (snapshotImageRef.current) {
        ctx.putImageData(snapshotImageRef.current, 0, 0);
      }
      ctx.strokeStyle = color;
      const w = coords.x - startPosRef.current.x;
      const h = coords.y - startPosRef.current.y;
      ctx.strokeRect(startPosRef.current.x, startPosRef.current.y, w, h);
    } else if (tool === 'line') {
      if (snapshotImageRef.current) {
        ctx.putImageData(snapshotImageRef.current, 0, 0);
      }
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(startPosRef.current.x, startPosRef.current.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    snapshotImageRef.current = null;
    saveState();
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, rect.width, rect.height);
    saveState();
  };

  const handleUndo = () => {
    if (historyRef.current.length <= 1) {
      handleClear();
      return;
    }
    historyRef.current.pop(); // Remove current
    const previous = historyRef.current[historyRef.current.length - 1];
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
      onSnapshotChange?.(previous);
    };
    img.src = previous;
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `system-design-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="ai-whiteboard-panel" ref={containerRef} style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      background: '#0f172a',
      borderRadius: '8px',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Whiteboard Toolbar */}
      <div className="ai-whiteboard-toolbar" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        background: 'rgba(15, 23, 42, 0.95)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            className={`ai-wb-btn ${tool === 'pen' ? 'is-active' : ''}`}
            onClick={() => setTool('pen')}
            title="Pen"
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              border: tool === 'pen' ? '1px solid #818cf8' : '1px solid transparent',
              background: tool === 'pen' ? 'rgba(129, 140, 248, 0.2)' : 'transparent',
              color: tool === 'pen' ? '#818cf8' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Pen size={14} />
          </button>
          <button
            type="button"
            className={`ai-wb-btn ${tool === 'rect' ? 'is-active' : ''}`}
            onClick={() => setTool('rect')}
            title="Box / Component"
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              border: tool === 'rect' ? '1px solid #818cf8' : '1px solid transparent',
              background: tool === 'rect' ? 'rgba(129, 140, 248, 0.2)' : 'transparent',
              color: tool === 'rect' ? '#818cf8' : '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <Square size={14} />
          </button>
          <button
            type="button"
            className={`ai-wb-btn ${tool === 'line' ? 'is-active' : ''}`}
            onClick={() => setTool('line')}
            title="Connector Line"
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              border: tool === 'line' ? '1px solid #818cf8' : '1px solid transparent',
              background: tool === 'line' ? 'rgba(129, 140, 248, 0.2)' : 'transparent',
              color: tool === 'line' ? '#818cf8' : '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <Minus size={14} />
          </button>
          <button
            type="button"
            className={`ai-wb-btn ${tool === 'eraser' ? 'is-active' : ''}`}
            onClick={() => setTool('eraser')}
            title="Eraser"
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              border: tool === 'eraser' ? '1px solid #818cf8' : '1px solid transparent',
              background: tool === 'eraser' ? 'rgba(129, 140, 248, 0.2)' : 'transparent',
              color: tool === 'eraser' ? '#818cf8' : '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <Eraser size={14} />
          </button>
        </div>

        {/* Colors & Size */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setColor(c);
                if (tool === 'eraser') setTool('pen');
              }}
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: c,
                border: color === c && tool !== 'eraser' ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer',
                transform: color === c && tool !== 'eraser' ? 'scale(1.15)' : 'none',
                transition: 'transform 0.15s ease'
              }}
              title={c}
            />
          ))}
          <select
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            style={{
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              color: '#e2e8f0',
              borderRadius: '4px',
              fontSize: '11px',
              padding: '2px 4px',
              marginLeft: '4px',
              cursor: 'pointer'
            }}
          >
            <option value={2}>Thin</option>
            <option value={4}>Medium</option>
            <option value={8}>Thick</option>
          </select>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            onClick={handleUndo}
            title="Undo"
            style={{
              padding: '5px 8px',
              borderRadius: '4px',
              border: 'none',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={13} />
          </button>
          <button
            type="button"
            onClick={handleClear}
            title="Clear Canvas"
            style={{
              padding: '5px 8px',
              borderRadius: '4px',
              border: 'none',
              background: 'transparent',
              color: '#ef4444',
              cursor: 'pointer'
            }}
          >
            <Trash2 size={13} />
          </button>
          <button
            type="button"
            onClick={handleDownload}
            title="Export PNG"
            style={{
              padding: '5px 8px',
              borderRadius: '4px',
              border: 'none',
              background: 'transparent',
              color: '#38bdf8',
              cursor: 'pointer'
            }}
          >
            <Download size={13} />
          </button>
        </div>
      </div>

      {/* HTML5 Canvas Surface */}
      <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{
            cursor: tool === 'eraser' ? 'crosshair' : 'default',
            touchAction: 'none',
            display: 'block',
            width: '100%',
            height: '100%',
          }}
        />
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '12px',
          fontSize: '10px',
          color: 'rgba(148, 163, 184, 0.5)',
          pointerEvents: 'none'
        }}>
          System Design Architecture Whiteboard
        </div>
      </div>
    </div>
  );
}

export default memo(WhiteboardPanel);

