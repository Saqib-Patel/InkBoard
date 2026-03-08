import { useState, useRef, useEffect } from 'react';
import {
  Pen, Highlighter, Eraser, Undo2, Redo2, Trash2, Download,
  Circle, Type, Square, ArrowUpRight, FileDown, Pointer, MousePointer,
  Triangle, Pipette, FileCode, StickyNote, Move, Copy,
} from 'lucide-react';
import type { Tool, BrushSize } from '@/hooks/useFabricCanvas';

const COLORS = [
  '#1a1a2e', '#e63946', '#457b9d', '#2a9d8f', '#e9c46a',
  '#7b2cbf', '#f4845f', '#f72585', '#264653', '#ffffff',
];

const SIZES: BrushSize[] = ['small', 'medium', 'large'];
const SIZE_PX = { small: 6, medium: 10, large: 16 };
const SIZE_VALUES = { small: 3, medium: 6, large: 12 };

const TOOLS: { key: Tool; icon: typeof Pen; label: string; shortcut: string }[] = [
  { key: 'select', icon: MousePointer, label: 'Select', shortcut: 'S' },
  { key: 'pen', icon: Pen, label: 'Pen', shortcut: 'P' },
  { key: 'highlighter', icon: Highlighter, label: 'Highlight', shortcut: 'H' },
  { key: 'eraser', icon: Eraser, label: 'Eraser', shortcut: 'E' },
  { key: 'text', icon: Type, label: 'Text', shortcut: 'T' },
  { key: 'rectangle', icon: Square, label: 'Rectangle', shortcut: 'R' },
  { key: 'circle', icon: Circle, label: 'Circle', shortcut: 'C' },
  { key: 'triangle', icon: Triangle, label: 'Triangle', shortcut: 'V' },
  { key: 'arrow', icon: ArrowUpRight, label: 'Arrow', shortcut: 'A' },
  { key: 'laser', icon: Pointer, label: 'Laser', shortcut: 'L' },
  { key: 'sticky', icon: StickyNote, label: 'Sticky Note', shortcut: 'N' },
  { key: 'pan', icon: Move, label: 'Pan', shortcut: 'Space' },
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
  opacity: number;
  setOpacity: (v: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSavePng: () => void;
  onSavePdf: () => void;
  onSaveSvg: () => void;
}

const RECENT_COLORS_KEY = 'notesapp_recent_colors';

function getRecentColors(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_COLORS_KEY) || '[]');
  } catch { return []; }
}

function addRecentColor(c: string) {
  const recent = getRecentColors().filter(r => r !== c);
  recent.unshift(c);
  localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(recent.slice(0, 5)));
}

export default function Toolbar({
  tool, setTool, color, setColor,
  brushSize, setBrushSize, customSize, setCustomSize,
  opacity, setOpacity,
  canUndo, canRedo,
  onUndo, onRedo, onClear, onSavePng, onSavePdf, onSaveSvg,
}: ToolbarProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [hexInput, setHexInput] = useState(color);
  const [recentColors, setRecentColors] = useState<string[]>(getRecentColors());
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setHexInput(color); }, [color]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    };
    if (showColorPicker) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showColorPicker]);

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

  const handleColorSelect = (c: string) => {
    setColor(c);
    addRecentColor(c);
    setRecentColors(getRecentColors());
  };

  const handleHexSubmit = () => {
    if (/^#[0-9a-fA-F]{3,8}$/.test(hexInput)) {
      handleColorSelect(hexInput);
    }
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
                aria-label={`${t.label} tool (${t.shortcut})`}
                aria-pressed={tool === t.key}
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
              onClick={() => handleColorSelect(c)}
              aria-label={`Color ${c}`}
            />
          ))}
          {/* Custom color picker toggle */}
          <div className="relative" ref={colorPickerRef}>
            <button
              className="color-swatch flex items-center justify-center"
              style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)', borderColor: 'transparent' }}
              onClick={() => setShowColorPicker(!showColorPicker)}
              aria-label="Custom color picker"
            />
            {showColorPicker && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 glass-toolbar rounded-xl p-3 flex flex-col gap-2 min-w-[180px] animate-scale-in z-50">
                <input
                  type="color"
                  value={color}
                  onChange={e => handleColorSelect(e.target.value)}
                  className="w-full h-8 rounded cursor-pointer border-0"
                />
                <div className="flex items-center gap-1.5">
                  <Pipette size={14} className="text-muted-foreground" />
                  <input
                    type="text"
                    value={hexInput}
                    onChange={e => setHexInput(e.target.value)}
                    onBlur={handleHexSubmit}
                    onKeyDown={e => e.key === 'Enter' && handleHexSubmit()}
                    className="flex-1 px-2 py-1 rounded-lg text-xs font-mono bg-muted text-foreground border border-border"
                    placeholder="#000000"
                  />
                </div>
                {recentColors.length > 0 && (
                  <div>
                    <span className="text-[10px] text-muted-foreground font-medium">Recent</span>
                    <div className="flex gap-1 mt-1">
                      {recentColors.map((c, i) => (
                        <button
                          key={i}
                          className="w-5 h-5 rounded-full border border-border cursor-pointer hover:scale-110 transition-transform"
                          style={{ backgroundColor: c }}
                          onClick={() => handleColorSelect(c)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="toolbar-divider" />

        {/* Size presets */}
        <div className="flex items-center gap-0.5">
          {SIZES.map(s => (
            <button
              key={s}
              className={`tool-btn ${brushSize === s ? 'active' : ''}`}
              onClick={() => handleSizePreset(s)}
              aria-label={`Brush size ${s}`}
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
            style={{ opacity: canUndo ? 1 : 0.35 }} aria-label="Undo">
            <Undo2 size={20} />
            <span className="tooltip-label">Undo (Ctrl+Z)</span>
          </button>
          <button className="tool-btn" onClick={onRedo} disabled={!canRedo}
            style={{ opacity: canRedo ? 1 : 0.35 }} aria-label="Redo">
            <Redo2 size={20} />
            <span className="tooltip-label">Redo (Ctrl+Shift+Z)</span>
          </button>
          <button
            className={`tool-btn ${showClearConfirm ? 'active' : ''}`}
            onClick={handleClear}
            aria-label="Clear canvas"
          >
            <Trash2 size={20} />
            <span className="tooltip-label">{showClearConfirm ? 'Confirm?' : 'Clear'}</span>
          </button>

          {/* Export dropdown */}
          <div className="relative">
            <button className="tool-btn" onClick={() => setShowExport(!showExport)} aria-label="Export">
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
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors text-foreground"
                  onClick={() => { onSaveSvg(); setShowExport(false); }}
                >
                  <FileCode size={14} /> SVG
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Size + opacity slider row */}
      <div className="flex items-center gap-4 px-4 py-1.5 rounded-xl glass-toolbar">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-muted-foreground">Size</span>
          <span className="text-xs font-mono text-muted-foreground w-8">{customSize}px</span>
          <input
            type="range" min={1} max={50} value={customSize}
            onChange={e => setCustomSize(Number(e.target.value))}
            className="w-24 h-1.5 rounded-full appearance-none cursor-pointer accent-primary"
            style={{
              background: `linear-gradient(to right, hsl(var(--tool-active)) ${((customSize - 1) / 49) * 100}%, hsl(var(--border)) ${((customSize - 1) / 49) * 100}%)`,
            }}
            aria-label="Brush size"
          />
        </div>
        <div className="toolbar-divider" />
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-muted-foreground">Opacity</span>
          <span className="text-xs font-mono text-muted-foreground w-8">{Math.round(opacity * 100)}%</span>
          <input
            type="range" min={10} max={100} value={Math.round(opacity * 100)}
            onChange={e => setOpacity(Number(e.target.value) / 100)}
            className="w-24 h-1.5 rounded-full appearance-none cursor-pointer accent-primary"
            style={{
              background: `linear-gradient(to right, hsl(var(--tool-active)) ${((opacity * 100 - 10) / 90) * 100}%, hsl(var(--border)) ${((opacity * 100 - 10) / 90) * 100}%)`,
            }}
            aria-label="Opacity"
          />
        </div>
        <div
          className="rounded-full border border-border"
          style={{
            width: Math.max(customSize, 4),
            height: Math.max(customSize, 4),
            backgroundColor: color,
            opacity: opacity,
            minWidth: 4, minHeight: 4,
          }}
        />
      </div>
    </div>
  );
}
