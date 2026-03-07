import { useState } from 'react';
import {
  Pen, Highlighter, Eraser, Undo2, Redo2, Trash2, Download,
  Circle, Type, Square, ArrowUpRight, FileDown, Pointer,
} from 'lucide-react';
import type { Tool, BrushSize } from '@/hooks/useCanvas';

const COLORS = [
  '#1a1a2e', '#e63946', '#457b9d', '#2a9d8f',
  '#e9c46a', '#7b2cbf', '#f4845f', '#f72585',
];

const GRADIENT_PRESETS = [
  { label: 'Sunset', colors: ['#e63946', '#f4845f'] },
  { label: 'Ocean', colors: ['#457b9d', '#2a9d8f'] },
  { label: 'Berry', colors: ['#7b2cbf', '#f72585'] },
];

const SIZES: BrushSize[] = ['small', 'medium', 'large'];
const SIZE_PX = { small: 6, medium: 10, large: 16 };
const SIZE_VALUES = { small: 3, medium: 6, large: 12 };

const TOOLS: { key: Tool; icon: typeof Pen; label: string; shortcut: string }[] = [
  { key: 'pen', icon: Pen, label: 'Pen', shortcut: 'P' },
  { key: 'highlighter', icon: Highlighter, label: 'Highlight', shortcut: 'H' },
  { key: 'eraser', icon: Eraser, label: 'Eraser', shortcut: 'E' },
  { key: 'text', icon: Type, label: 'Text', shortcut: 'T' },
  { key: 'rectangle', icon: Square, label: 'Rectangle', shortcut: 'R' },
  { key: 'circle', icon: Circle, label: 'Circle', shortcut: 'C' },
  { key: 'arrow', icon: ArrowUpRight, label: 'Arrow', shortcut: 'A' },
  { key: 'laser', icon: Pointer, label: 'Laser', shortcut: 'L' },
];

interface ToolbarProps {
  tool: Tool;
  setTool: (t: Tool) => void;
  color: string;
  setColor: (c: string) => void;
  brushSize: BrushSize;
  setBrushSize: (s: BrushSize) => void;
  customSize: number;
  setCustomSize: (s: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSavePng: () => void;
  onSavePdf: () => void;
}

export default function Toolbar({
  tool, setTool, color, setColor,
  brushSize, setBrushSize, customSize, setCustomSize,
  canUndo, canRedo,
  onUndo, onRedo, onClear, onSavePng, onSavePdf,
}: ToolbarProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const handleClear = () => {
    if (showClearConfirm) {
      onClear();
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 3000);
    }
  };

  const handleSizePreset = (s: BrushSize) => {
    setBrushSize(s);
    setCustomSize(SIZE_VALUES[s]);
  };

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 animate-fade-in">
      {/* Main toolbar row */}
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl glass-toolbar select-none flex-wrap justify-center max-w-[96vw]">
        {/* Drawing Tools */}
        <div className="flex items-center gap-0.5">
          {TOOLS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                className={`tool-btn ${tool === t.key ? 'active' : ''}`}
                onClick={() => setTool(t.key)}
              >
                <Icon size={20} />
                <span className="tooltip-label">{t.label} ({t.shortcut})</span>
              </button>
            );
          })}
        </div>

        <div className="toolbar-divider" />

        {/* Colors */}
        <div className="flex items-center gap-1">
          {COLORS.map(c => (
            <button
              key={c}
              className={`color-swatch ${color === c ? 'selected' : ''}`}
              style={{ backgroundColor: c, borderColor: color === c ? undefined : 'transparent' }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>

        <div className="toolbar-divider" />

        {/* Gradient presets */}
        <div className="flex items-center gap-1">
          {GRADIENT_PRESETS.map(g => (
            <button
              key={g.label}
              className={`color-swatch`}
              style={{
                background: `linear-gradient(135deg, ${g.colors[0]}, ${g.colors[1]})`,
                borderColor: 'transparent',
              }}
              onClick={() => setColor(g.colors[0])}
              title={g.label}
            />
          ))}
        </div>

        <div className="toolbar-divider" />

        {/* Size presets */}
        <div className="flex items-center gap-0.5">
          {SIZES.map(s => (
            <button
              key={s}
              className={`tool-btn ${brushSize === s ? 'active' : ''}`}
              onClick={() => handleSizePreset(s)}
            >
              <Circle size={SIZE_PX[s]} fill="currentColor" />
              <span className="tooltip-label">{s}</span>
            </button>
          ))}
        </div>

        <div className="toolbar-divider" />

        {/* Actions */}
        <div className="flex items-center gap-0.5">
          <button className="tool-btn" onClick={onUndo} disabled={!canUndo}
            style={{ opacity: canUndo ? 1 : 0.35 }}>
            <Undo2 size={20} />
            <span className="tooltip-label">Undo (Ctrl+Z)</span>
          </button>
          <button className="tool-btn" onClick={onRedo} disabled={!canRedo}
            style={{ opacity: canRedo ? 1 : 0.35 }}>
            <Redo2 size={20} />
            <span className="tooltip-label">Redo (Ctrl+Y)</span>
          </button>
          <button
            className={`tool-btn ${showClearConfirm ? 'active' : ''}`}
            onClick={handleClear}
          >
            <Trash2 size={20} />
            <span className="tooltip-label">{showClearConfirm ? 'Confirm?' : 'Clear'}</span>
          </button>

          {/* Export dropdown */}
          <div className="relative">
            <button className="tool-btn" onClick={() => setShowExport(!showExport)}>
              <Download size={20} />
              <span className="tooltip-label">Export</span>
            </button>
            {showExport && (
              <div className="absolute top-full mt-2 right-0 glass-toolbar rounded-xl p-1.5 flex flex-col gap-1 min-w-[120px] animate-scale-in">
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors text-foreground"
                  onClick={() => { onSavePng(); setShowExport(false); }}
                >
                  <Download size={14} /> PNG
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors text-foreground"
                  onClick={() => { onSavePdf(); setShowExport(false); }}
                >
                  <FileDown size={14} /> PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Size slider row */}
      <div className="flex items-center gap-3 px-4 py-1.5 rounded-xl glass-toolbar">
        <span className="text-xs font-medium text-muted-foreground w-10">
          {customSize}px
        </span>
        <input
          type="range"
          min={1}
          max={20}
          value={customSize}
          onChange={e => setCustomSize(Number(e.target.value))}
          className="w-32 h-1.5 rounded-full appearance-none cursor-pointer accent-primary"
          style={{
            background: `linear-gradient(to right, hsl(var(--tool-active)) ${((customSize - 1) / 19) * 100}%, hsl(var(--border)) ${((customSize - 1) / 19) * 100}%)`,
          }}
        />
        <div
          className="rounded-full"
          style={{
            width: customSize,
            height: customSize,
            backgroundColor: color,
            minWidth: 4,
            minHeight: 4,
          }}
        />
      </div>
    </div>
  );
}
