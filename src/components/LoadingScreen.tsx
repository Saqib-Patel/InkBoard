import { useState, useEffect } from 'react';
import { PenTool } from 'lucide-react';

export default function LoadingScreen({ onFinish }: { onFinish: () => void }) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setFadeOut(true);
          setTimeout(onFinish, 500);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 120);
    return () => clearInterval(interval);
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        {/* Logo */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <PenTool size={28} className="text-primary-foreground" />
          </div>
          <div className="absolute inset-0 w-16 h-16 rounded-2xl bg-primary/30 animate-ping" />
        </div>

        {/* Brand */}
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">InkBoard</h1>
          <p className="text-xs text-muted-foreground mt-1">Draw, Annotate & Create</p>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-150 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      <span className="absolute bottom-6 text-[10px] text-muted-foreground/50">
        by Mohammed Saqib
      </span>
    </div>
  );
}
