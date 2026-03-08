import { useState, useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

const SHORTCUTS = [
  ['P', 'Pen tool'],
  ['H', 'Highlighter'],
  ['E', 'Eraser'],
  ['T', 'Text tool'],
  ['S', 'Select tool'],
  ['R', 'Rectangle'],
  ['C', 'Circle'],
  ['A', 'Arrow'],
  ['L', 'Laser pointer'],
  ['G', 'Toggle grid'],
  ['F', 'Fullscreen'],
  ['?', 'Shortcut help'],
  ['Ctrl+Z', 'Undo'],
  ['Ctrl+Shift+Z', 'Redo'],
  ['Ctrl+S', 'Save'],
  ['Ctrl+A', 'Select all'],
  ['Delete', 'Delete selected'],
  ['Ctrl+]', 'Next page'],
  ['Ctrl+[', 'Previous page'],
  ['Ctrl+=', 'Zoom in'],
  ['Ctrl+-', 'Zoom out'],
  ['Ctrl+0', 'Reset zoom'],
];

export default function KeyboardCheatsheet() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '?' && !(e.target as HTMLElement).matches('input, textarea')) {
        setShow(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center animate-fade-in" onClick={() => setShow(false)}>
      <div className="absolute inset-0 welcome-overlay" />
      <div
        className="relative welcome-card rounded-2xl p-6 max-w-md w-full mx-4 animate-scale-in max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => setShow(false)}
          className="absolute top-4 right-4 tool-btn !min-w-[32px] !min-h-[32px]"
          aria-label="Close shortcuts"
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Keyboard size={20} /> Keyboard Shortcuts
        </h2>

        <div className="grid grid-cols-2 gap-1.5 text-sm">
          {SHORTCUTS.map(([key, desc]) => (
            <div key={key} className="flex items-center gap-2 py-1">
              <kbd className="px-1.5 py-0.5 rounded text-xs font-mono font-semibold bg-muted text-foreground min-w-[2rem] text-center">
                {key}
              </kbd>
              <span className="text-muted-foreground">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
