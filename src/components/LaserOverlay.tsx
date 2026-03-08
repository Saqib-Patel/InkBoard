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
const CORE_RADIUS = 4;
const GLOW_RADIUS = 14;

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

    // Draw smooth trail using quadratic curves
    const pts = points.current;
    if (pts.length > 1) {
      // Outer glow pass
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2;
        const my = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      const last = pts[pts.length - 1];
      ctx.lineTo(last.x, last.y);
      const avgAge = now - pts[Math.floor(pts.length / 2)].time;
      const glowAlpha = Math.max(0, 1 - avgAge / TRAIL_DURATION);
      ctx.strokeStyle = `rgba(255, 50, 30, ${glowAlpha * 0.15})`;
      ctx.lineWidth = 4;
      ctx.stroke();

      // Core trail pass
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2;
        const my = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      ctx.lineTo(last.x, last.y);
      ctx.strokeStyle = `rgba(220, 20, 20, ${glowAlpha * 0.7})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // Draw laser dot at current position
    const pos = mousePos.current;
    if (pos && active) {
      // Outer glow
      const gradient = ctx.createRadialGradient(pos.x, pos.y, CORE_RADIUS, pos.x, pos.y, GLOW_RADIUS);
      gradient.addColorStop(0, 'rgba(255, 30, 20, 0.7)');
      gradient.addColorStop(0.4, 'rgba(255, 20, 10, 0.35)');
      gradient.addColorStop(1, 'rgba(255, 10, 5, 0)');
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, GLOW_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Inner bright core
      const coreGrad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, CORE_RADIUS);
      coreGrad.addColorStop(0, 'rgba(255, 255, 240, 1)');
      coreGrad.addColorStop(0.3, 'rgba(255, 80, 40, 0.95)');
      coreGrad.addColorStop(1, 'rgba(220, 20, 10, 0.8)');
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
    />
  );
}
