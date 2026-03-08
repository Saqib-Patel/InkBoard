import { useState, useEffect, useRef } from 'react';
import { Map } from 'lucide-react';

interface MinimapProps {
  getDataUrl: () => string;
  zoom: number;
}

export default function Minimap({ getDataUrl, zoom }: MinimapProps) {
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!open) return;
    const update = () => setSrc(getDataUrl());
    update();
    intervalRef.current = setInterval(update, 1500);
    return () => clearInterval(intervalRef.current);
  }, [open, getDataUrl]);

  return (
    <div className="fixed bottom-14 right-4 z-40">
      <button
        className="page-nav-btn mb-1.5"
        onClick={() => setOpen(!open)}
        title="Toggle minimap"
        aria-label="Toggle minimap"
      >
        <Map size={16} />
      </button>
      {open && src && (
        <div className="glass-toolbar rounded-xl overflow-hidden animate-scale-in"
          style={{ width: 200, height: 140 }}
        >
          <img src={src} alt="Canvas minimap" className="w-full h-full object-contain" />
          <div className="absolute bottom-1 right-1.5 text-[9px] font-mono text-muted-foreground bg-background/70 px-1 rounded">
            {Math.round(zoom * 100)}%
          </div>
        </div>
      )}
    </div>
  );
}
