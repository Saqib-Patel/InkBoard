import { useState } from 'react';
import {
  Pen, Highlighter, Eraser, Undo2, Redo2, Trash2, Download,
  Circle,
} from 'lucide-react';
import type { Tool, BrushSize } from '@/hooks/useCanvas';

const COLORS = [
  '#1a1a2e', '#e63946', '#457b9d', '#2a9d8f',
  '#e9c46a', '#7b2cbf', '#f4845f', '#f72585',
];

const SIZES: BrushSize[] = ['small', 'medium', 'large'];
const SIZE_PX = { small: 8, medium: 12, large: 18 };

interface ToolbarProps {
  tool: Tool;
  setTool: (t: Tool) => void;
  color: string;
  setColor: (c: string) => void;
  brushSize: BrushSize;
  setBrushSize: (s: BrushSize) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSave: () => void;
}

export default function Toolbar({
  tool, setTool, color, setColor,
  brushSize, setBrushSize,
  canUndo, canRedo,
  onUndo, onRedo, onClear, onSave,
}: ToolbarProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClear = () => {
    if (showClearConfirm) {
      onClear();
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 3000);
    }
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-3 py-2 rounded-2xl glass-toolbar select-none flex-wrap justify-center max-w-[95vw]">
      {/* Tools */}
      <div className="flex items-center gap-1 border-r border-border pr-2 mr-1">
        <button
          className={`tool-btn ${tool === 'pen' ? 'active' : ''}`}
          onClick={() => setTool('pen')}
          title="Pen"
        >
          <Pen size={18} />
        </button>
        <button
          className={`tool-btn ${tool === 'highlighter' ? 'active' : ''}`}
          onClick={() => setTool('highlighter')}
          title="Highlighter"
        >
          <Highlighter size={18} />
        </button>
        <button
          className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
          onClick={() => setTool('eraser')}
          title="Eraser"
        >
          <Eraser size={18} />
        </button>
      </div>

      {/* Colors */}
      <div className="flex items-center gap-1 border-r border-border pr-2 mr-1">
        {COLORS.map(c => (
          <button
            key={c}
            className="w-6 h-6 rounded-full transition-transform duration-150 hover:scale-110 border-2 cursor-pointer"
            style={{
              backgroundColor: c,
              borderColor: color === c ? 'hsl(var(--ring))' : 'transparent',
              transform: color === c ? 'scale(1.15)' : undefined,
            }}
            onClick={() => setColor(c)}
            title={c}
          />
        ))}
      </div>

      {/* Size */}
      <div className="flex items-center gap-1 border-r border-border pr-2 mr-1">
        {SIZES.map(s => (
          <button
            key={s}
            className={`tool-btn ${brushSize === s ? 'active' : ''}`}
            onClick={() => setBrushSize(s)}
            title={s}
          >
            <Circle size={SIZE_PX[s]} fill="currentColor" />
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button className="tool-btn" onClick={onUndo} disabled={!canUndo} title="Undo"
          style={{ opacity: canUndo ? 1 : 0.35 }}>
          <Undo2 size={18} />
        </button>
        <button className="tool-btn" onClick={onRedo} disabled={!canRedo} title="Redo"
          style={{ opacity: canRedo ? 1 : 0.35 }}>
          <Redo2 size={18} />
        </button>
        <button
          className={`tool-btn ${showClearConfirm ? 'active' : ''}`}
          onClick={handleClear}
          title={showClearConfirm ? 'Click again to confirm' : 'Clear canvas'}
        >
          <Trash2 size={18} />
        </button>
        <button className="tool-btn" onClick={onSave} title="Save as PNG">
          <Download size={18} />
        </button>
      </div>
    </div>
  );
}
