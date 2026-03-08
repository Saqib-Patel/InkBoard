import { useEffect, useRef, useState, useCallback } from 'react';

interface CanvasScrollbarsProps {
  zoom: number;
  viewportTransform: number[] | null;
  onPan: (deltaX: number, deltaY: number) => void;
}

const CANVAS_VIRTUAL_SIZE = 5000;
const SCROLLBAR_MIN = 40;

const CanvasScrollbars = ({ zoom, viewportTransform, onPan }: CanvasScrollbarsProps) => {
  const [hovered, setHovered] = useState<'h' | 'v' | null>(null);
  const dragging = useRef<{ axis: 'h' | 'v'; startPos: number; startOffset: number } | null>(null);

  const panX = viewportTransform?.[4] ?? 0;
  const panY = viewportTransform?.[5] ?? 0;

  const totalW = CANVAS_VIRTUAL_SIZE * zoom;
  const totalH = CANVAS_VIRTUAL_SIZE * zoom;
  const viewW = window.innerWidth;
  const viewH = window.innerHeight;

  // Thumb sizes (proportion of viewport to total)
  const thumbW = Math.max(SCROLLBAR_MIN, (viewW / totalW) * viewW);
  const thumbH = Math.max(SCROLLBAR_MIN, (viewH / totalH) * viewH);

  // Thumb positions (map panX/Y to scrollbar track)
  const maxPanX = totalW - viewW;
  const maxPanY = totalH - viewH;
  const trackW = viewW - 120; // leave room for corners
  const trackH = viewH - 120;

  const thumbLeft = maxPanX > 0 ? ((-panX + CANVAS_VIRTUAL_SIZE * zoom * 0.3) / maxPanX) * (trackW - thumbW) : 0;
  const thumbTop = maxPanY > 0 ? ((-panY + CANVAS_VIRTUAL_SIZE * zoom * 0.3) / maxPanY) * (trackH - thumbH) : 0;

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const handleMouseDown = useCallback((axis: 'h' | 'v', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = {
      axis,
      startPos: axis === 'h' ? e.clientX : e.clientY,
      startOffset: axis === 'h' ? panX : panY,
    };

    const handleMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const d = dragging.current;
      const delta = (d.axis === 'h' ? ev.clientX : ev.clientY) - d.startPos;
      const track = d.axis === 'h' ? trackW - thumbW : trackH - thumbH;
      const maxP = d.axis === 'h' ? maxPanX : maxPanY;
      const panDelta = (delta / track) * maxP;
      if (d.axis === 'h') {
        onPan(-panDelta - d.startOffset + panX, 0);
      } else {
        onPan(0, -panDelta - d.startOffset + panY);
      }
    };

    const handleUp = () => {
      dragging.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [panX, panY, maxPanX, maxPanY, trackW, trackH, thumbW, thumbH, onPan]);

  return (
    <>
      {/* Horizontal scrollbar */}
      <div
        className="fixed bottom-12 left-16 z-40 h-2 rounded-full transition-opacity duration-200"
        style={{
          width: trackW,
          opacity: hovered === 'h' || dragging.current?.axis === 'h' ? 0.7 : 0.3,
          backgroundColor: 'hsl(var(--muted))',
        }}
        onMouseEnter={() => setHovered('h')}
        onMouseLeave={() => setHovered(null)}
      >
        <div
          className="absolute top-0 h-full rounded-full cursor-pointer transition-colors"
          style={{
            width: thumbW,
            left: clamp(thumbLeft, 0, trackW - thumbW),
            backgroundColor: hovered === 'h' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
          }}
          onMouseDown={(e) => handleMouseDown('h', e)}
        />
      </div>

      {/* Vertical scrollbar */}
      <div
        className="fixed right-2 top-16 z-40 w-2 rounded-full transition-opacity duration-200"
        style={{
          height: trackH,
          opacity: hovered === 'v' || dragging.current?.axis === 'v' ? 0.7 : 0.3,
          backgroundColor: 'hsl(var(--muted))',
        }}
        onMouseEnter={() => setHovered('v')}
        onMouseLeave={() => setHovered(null)}
      >
        <div
          className="absolute left-0 w-full rounded-full cursor-pointer transition-colors"
          style={{
            height: thumbH,
            top: clamp(thumbTop, 0, trackH - thumbH),
            backgroundColor: hovered === 'v' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
          }}
          onMouseDown={(e) => handleMouseDown('v', e)}
        />
      </div>
    </>
  );
};

export default CanvasScrollbars;
