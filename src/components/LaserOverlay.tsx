import { useRef, useEffect, useCallback } from 'react';

interface LaserPoint {
  x: number;
  y: number;
  time: number;
}

interface LaserOverlayProps {
  active: boolean;
}

const TRAIL_DURATION = 1500;
const CORE_RADIUS = 7;
const GLOW_RADIUS = 28;

export default function LaserOverlay({ active }: LaserOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const points = useRef<LaserPoint[]>([]);
  const animId = useRef<number>(0);
  const mousePos = useRef<{ x: number; y: number } | null>(null);

  const resize = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = window.innerWidth * dpr;
    c.height = window.innerHeight * dpr;
    c.style.width = `${window.innerWidth}px`;
    c.style.height = `${window.innerHeight}px`;
    const ctx = c.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  const animate = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    const now = Date.now();
    // Remove expired points
    points.current = points.current.filter(p => now - p.time < TRAIL_DURATION);

    ctx.clearRect(0, 0, c.width, c.height);

    // Draw trail
    if (points.current.length > 1) {
      for (let i = 1; i < points.current.length; i++) {
        const p0 = points.current[i - 1];
        const p1 = points.current[i];
        const age = now - p1.time;
        const alpha = Math.max(0, 1 - age / TRAIL_DURATION);

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = `rgba(220, 20, 20, ${alpha * 0.9})`;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Outer glow on trail
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = `rgba(255, 50, 30, ${alpha * 0.35})`;
        ctx.lineWidth = 14;
        ctx.stroke();
      }
    }

    // Draw laser dot at current position
    const pos = mousePos.current;
    if (pos && active) {
      // Outer glow
      const gradient = ctx.createRadialGradient(pos.x, pos.y, CORE_RADIUS, pos.x, pos.y, GLOW_RADIUS);
      gradient.addColorStop(0, 'rgba(255, 80, 40, 0.5)');
      gradient.addColorStop(0.5, 'rgba(255, 50, 20, 0.2)');
      gradient.addColorStop(1, 'rgba(255, 30, 10, 0)');
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, GLOW_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Inner bright core
      const coreGrad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, CORE_RADIUS);
      coreGrad.addColorStop(0, 'rgba(255, 255, 220, 0.95)');
      coreGrad.addColorStop(0.4, 'rgba(255, 100, 50, 0.9)');
      coreGrad.addColorStop(1, 'rgba(255, 40, 20, 0.6)');
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, CORE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();
    }

    animId.current = requestAnimationFrame(animate);
  }, [active]);

  useEffect(() => {
    if (!active) {
      // Clean up when deactivated
      const c = canvasRef.current;
      if (c) {
        const ctx = c.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, c.width, c.height);
      }
      points.current = [];
      mousePos.current = null;
      cancelAnimationFrame(animId.current);
      return;
    }

    resize();
    window.addEventListener('resize', resize);
    animId.current = requestAnimationFrame(animate);

    const onMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      points.current.push({ x: e.clientX, y: e.clientY, time: Date.now() });
    };
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      mousePos.current = { x: t.clientX, y: t.clientY };
      points.current.push({ x: t.clientX, y: t.clientY, time: Date.now() });
    };
    const onLeave = () => {
      mousePos.current = null;
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onTouch);
    window.addEventListener('mouseleave', onLeave);

    return () => {
      cancelAnimationFrame(animId.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, [active, resize, animate]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
