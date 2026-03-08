import { useState } from 'react';
import { Settings, X, Moon, Sun, Grid3X3, RotateCcw, Info } from 'lucide-react';

export type GridStyle = 'plain' | 'grid' | 'dots' | 'lines';

interface SettingsPanelProps {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  gridStyle: GridStyle;
  setGridStyle: (v: GridStyle) => void;
  autoSaveInterval: number;
  setAutoSaveInterval: (v: number) => void;
  onResetCanvas: () => void;
}

const GRID_OPTIONS: { value: GridStyle; label: string }[] = [
  { value: 'plain', label: 'Plain' },
  { value: 'grid', label: 'Grid' },
  { value: 'dots', label: 'Dots' },
  { value: 'lines', label: 'Lines' },
];

export default function SettingsPanel({
  darkMode, setDarkMode, gridStyle, setGridStyle,
  autoSaveInterval, setAutoSaveInterval, onResetCanvas,
}: SettingsPanelProps) {
  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleReset = () => {
    if (confirmReset) {
      onResetCanvas();
      setConfirmReset(false);
      setOpen(false);
    } else {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
    }
  };

  return (
    <>
      <button
        className="page-nav-btn"
        onClick={() => setOpen(true)}
        title="Settings"
        aria-label="Open settings"
      >
        <Settings size={16} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center animate-fade-in" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 welcome-overlay" />
          <div
            className="relative welcome-card rounded-2xl p-6 max-w-sm w-full mx-4 animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 tool-btn !min-w-[32px] !min-h-[32px]"
              aria-label="Close settings"
            >
              <X size={18} />
            </button>

            <h2 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
              <Settings size={20} /> Settings
            </h2>

            {/* Dark Mode */}
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                {darkMode ? <Moon size={16} /> : <Sun size={16} />}
                Dark Mode
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${darkMode ? 'bg-primary' : 'bg-muted'}`}
                aria-label="Toggle dark mode"
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background shadow transition-transform duration-200 ${darkMode ? 'translate-x-5' : ''}`} />
              </button>
            </div>

            {/* Grid Style */}
            <div className="py-3 border-b border-border">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <Grid3X3 size={16} /> Background Style
              </div>
              <div className="flex gap-1.5">
                {GRID_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setGridStyle(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                      gridStyle === opt.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-save interval */}
            <div className="py-3 border-b border-border">
              <div className="text-sm font-medium text-foreground mb-2">Auto-save interval</div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={5}
                  max={120}
                  step={5}
                  value={autoSaveInterval}
                  onChange={e => setAutoSaveInterval(Number(e.target.value))}
                  className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-primary"
                  style={{
                    background: `linear-gradient(to right, hsl(var(--tool-active)) ${((autoSaveInterval - 5) / 115) * 100}%, hsl(var(--border)) ${((autoSaveInterval - 5) / 115) * 100}%)`,
                  }}
                />
                <span className="text-xs font-mono text-muted-foreground w-10 text-right">{autoSaveInterval}s</span>
              </div>
            </div>

            {/* Reset */}
            <div className="py-3 border-b border-border">
              <button
                onClick={handleReset}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  confirmReset
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-muted text-foreground hover:bg-accent'
                }`}
              >
                <RotateCcw size={14} />
                {confirmReset ? 'Confirm Reset?' : 'Reset Canvas'}
              </button>
            </div>

            {/* About */}
            <div className="pt-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                <Info size={16} /> About
              </div>
              <p className="text-xs text-muted-foreground">
                NoteCanvas v1.0.0 — A modern canvas for notes, drawing, and annotations.
                Built with React, Fabric.js, and Tailwind CSS.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
