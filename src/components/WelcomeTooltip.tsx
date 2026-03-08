import { useState, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';

const WELCOME_KEY = 'notesapp_welcome_shown';

export default function WelcomeTooltip() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(WELCOME_KEY)) {
      setShow(true);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(WELCOME_KEY, '1');
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] welcome-overlay flex items-center justify-center animate-fade-in" onClick={dismiss}>
      <div
        className="welcome-card rounded-2xl p-8 max-w-md mx-4 relative animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={dismiss} className="absolute top-4 right-4 tool-btn !min-w-[32px] !min-h-[32px]">
          <X size={18} />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'hsl(var(--tool-active))' }}>
            <Sparkles size={20} className="text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Welcome to InkBoard</h2>
        </div>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          A modern note-taking canvas for educators and students. Draw, annotate, and create beautiful notes.
        </p>
        <div className="space-y-2 text-sm">
          <h3 className="font-semibold text-foreground">Keyboard Shortcuts</h3>
          <div className="grid grid-cols-2 gap-1.5 text-muted-foreground">
            {[
              ['P', 'Pen tool'],
              ['H', 'Highlighter'],
              ['E', 'Eraser'],
              ['T', 'Text tool'],
              ['R', 'Rectangle'],
              ['C', 'Circle'],
              ['A', 'Arrow'],
              ['Ctrl+Z', 'Undo'],
              ['Ctrl+Y', 'Redo'],
              ['G', 'Toggle grid'],
              ['F', 'Fullscreen'],
            ].map(([key, desc]) => (
              <div key={key} className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 rounded text-xs font-mono font-semibold bg-muted text-foreground">{key}</kbd>
                <span>{desc}</span>
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={dismiss}
          className="mt-6 w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-200"
          style={{ background: 'hsl(var(--tool-active))', color: 'hsl(var(--tool-active-foreground))' }}
        >
          Start Drawing
        </button>
      </div>
    </div>
  );
}
