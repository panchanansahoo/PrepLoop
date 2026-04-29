import React, { memo, useRef, useState, useCallback, useEffect } from 'react';
import {
  Pencil, Square, Circle, Type, Eraser, Undo2, Redo2,
  Trash2, Download, MousePointer,
} from 'lucide-react';

const TOOLS = [
  { id: 'select', icon: MousePointer, label: 'Select' },
  { id: 'pen', icon: Pencil, label: 'Draw' },
  { id: 'rect', icon: Square, label: 'Rectangle' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'eraser', icon: Eraser, label: 'Eraser' },
];

const COLORS = [
  '#ffffff', '#ef4444', '#f59e0b', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4',
];

const STROKE_WIDTHS = [2, 4, 6, 8];

/**
 * DesignCanvas — A lightweight freehand drawing canvas for system design
 * interviews. Supports pen, shapes, text, and eraser with undo/redo.
 *
 * Props:
 *  - onCanvasChange: (dataUrl: string) => void — Called when canvas changes
 */
function DesignCanvas({ onCanvasChange }) {
  const canvasRef = useRef(null);
  const [activeTool, setActiveTool] = useState('pen');
  const [activeColor, setActiveColor] = useState('#ffffff');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const startPosRef = useRef(null);
  const snapshotRef = useRef(null);

  // Initialize canvas with dark background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save initial state
    const initial = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([initial]);
    setHistoryIdx(0);
  }, []);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;

      // Save current image
      const ctx = canvas.getContext('2d');
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);

      canvas.width = rect.width;
      canvas.height = rect.height;
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.putImageData(img, 0, 0);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

    setHistory(prev => {
      const trimmed = prev.slice(0, historyIdx + 1);
      const next = [...trimmed, snapshot];
      // Limit history to 50 entries
      if (next.length > 50) next.shift();
      return next;
    });
    setHistoryIdx(prev => Math.min(prev + 1, 49));

    // Notify parent
    if (onCanvasChange) {
      onCanvasChange(canvas.toDataURL('image/png'));
    }
  }, [historyIdx, onCanvasChange]);

  const undo = useCallback(() => {
    if (historyIdx <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const newIdx = historyIdx - 1;
    ctx.putImageData(history[newIdx], 0, 0);
    setHistoryIdx(newIdx);
  }, [historyIdx, history]);

  const redo = useCallback(() => {
    if (historyIdx >= history.length - 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const newIdx = historyIdx + 1;
    ctx.putImageData(history[newIdx], 0, 0);
    setHistoryIdx(newIdx);
  }, [historyIdx, history]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  }, [saveToHistory]);

  const downloadCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'system-design.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  const getPos = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);

    setIsDrawing(true);
    startPosRef.current = pos;

    if (activeTool === 'pen' || activeTool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.strokeStyle = activeTool === 'eraser' ? '#1a1a2e' : activeColor;
      ctx.lineWidth = activeTool === 'eraser' ? strokeWidth * 3 : strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    if (activeTool === 'rect' || activeTool === 'circle') {
      snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    if (activeTool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        ctx.fillStyle = activeColor;
        ctx.font = `${strokeWidth * 4}px 'Inter', sans-serif`;
        ctx.fillText(text, pos.x, pos.y);
        saveToHistory();
      }
      setIsDrawing(false);
    }
  }, [activeTool, activeColor, strokeWidth, getPos, saveToHistory]);

  const handlePointerMove = useCallback((e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);

    if (activeTool === 'pen' || activeTool === 'eraser') {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }

    if (activeTool === 'rect' && snapshotRef.current) {
      ctx.putImageData(snapshotRef.current, 0, 0);
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = strokeWidth;
      const w = pos.x - startPosRef.current.x;
      const h = pos.y - startPosRef.current.y;
      ctx.strokeRect(startPosRef.current.x, startPosRef.current.y, w, h);
    }

    if (activeTool === 'circle' && snapshotRef.current) {
      ctx.putImageData(snapshotRef.current, 0, 0);
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = strokeWidth;
      const rx = Math.abs(pos.x - startPosRef.current.x);
      const ry = Math.abs(pos.y - startPosRef.current.y);
      ctx.beginPath();
      ctx.ellipse(
        startPosRef.current.x, startPosRef.current.y,
        rx, ry, 0, 0, Math.PI * 2
      );
      ctx.stroke();
    }
  }, [isDrawing, activeTool, activeColor, strokeWidth, getPos]);

  const handlePointerUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveToHistory();
  }, [isDrawing, saveToHistory]);

  return (
    <div className="design-canvas-wrapper">
      {/* Toolbar */}
      <div className="design-toolbar">
        <div className="design-toolbar-tools">
          {TOOLS.map(tool => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                className={`design-tool-btn ${activeTool === tool.id ? 'active' : ''}`}
                onClick={() => setActiveTool(tool.id)}
                title={tool.label}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>

        <div className="design-toolbar-divider" />

        {/* Colors */}
        <div className="design-toolbar-colors">
          {COLORS.map(color => (
            <button
              key={color}
              className={`design-color-btn ${activeColor === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => setActiveColor(color)}
              title={color}
            />
          ))}
        </div>

        <div className="design-toolbar-divider" />

        {/* Stroke width */}
        <div className="design-toolbar-widths">
          {STROKE_WIDTHS.map(w => (
            <button
              key={w}
              className={`design-width-btn ${strokeWidth === w ? 'active' : ''}`}
              onClick={() => setStrokeWidth(w)}
              title={`${w}px`}
            >
              <div className="design-width-dot" style={{ width: w + 4, height: w + 4 }} />
            </button>
          ))}
        </div>

        <div className="design-toolbar-divider" />

        {/* Actions */}
        <div className="design-toolbar-actions">
          <button className="design-tool-btn" onClick={undo} title="Undo" disabled={historyIdx <= 0}>
            <Undo2 size={16} />
          </button>
          <button className="design-tool-btn" onClick={redo} title="Redo" disabled={historyIdx >= history.length - 1}>
            <Redo2 size={16} />
          </button>
          <button className="design-tool-btn" onClick={clearCanvas} title="Clear">
            <Trash2 size={16} />
          </button>
          <button className="design-tool-btn" onClick={downloadCanvas} title="Download">
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="design-canvas-el"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        style={{ cursor: activeTool === 'eraser' ? 'crosshair' : activeTool === 'pen' ? 'crosshair' : 'default' }}
      />
    </div>
  );
}

export default memo(DesignCanvas);
