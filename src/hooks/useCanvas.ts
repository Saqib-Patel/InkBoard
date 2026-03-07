import { useRef, useState, useCallback, useEffect } from 'react';

export type Tool = 'pen' | 'highlighter' | 'eraser' | 'text' | 'rectangle' | 'circle' | 'arrow' | 'laser';
export type BrushSize = 'small' | 'medium' | 'large';

interface Point {
  x: number;
  y: number;
}

interface TextBox {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
}

interface PageData {
  dataUrl: string;
  textBoxes: TextBox[];
}

const BRUSH_SIZES: Record<BrushSize, number> = { small: 3, medium: 6, large: 12 };
const HIGHLIGHTER_SIZES: Record<BrushSize, number> = { small: 15, medium: 25, large: 40 };
const ERASER_SIZES: Record<BrushSize, number> = { small: 15, medium: 30, large: 50 };

const STORAGE_KEY = 'notesapp_pages';

export function useCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#1a1a2e');
  const [brushSize, setBrushSize] = useState<BrushSize>('medium');
  const [customSize, setCustomSize] = useState(6);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const lastPoint = useRef<Point | null>(null);
  const shapeStart = useRef<Point | null>(null);
  const shapeSnapshot = useRef<ImageData | null>(null);

  // Multi-page
  const [pages, setPages] = useState<PageData[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  // Text boxes
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(imageData);
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    saveState();
  }, [saveState]);

  useEffect(() => {
    initCanvas();
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      ctx.putImageData(imageData, 0, 0);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveToLocalStorage();
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, textBoxes, pages]);

  const getPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const getLineWidth = () => {
    if (tool === 'highlighter') return HIGHLIGHTER_SIZES[brushSize];
    if (tool === 'eraser') return ERASER_SIZES[brushSize];
    if (tool === 'rectangle' || tool === 'circle' || tool === 'arrow') return customSize;
    return customSize;
  };

  const isShapeTool = tool === 'rectangle' || tool === 'circle' || tool === 'arrow';

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();

    if (tool === 'text') {
      const point = getPoint(e);
      const id = `text-${Date.now()}`;
      const newBox: TextBox = {
        id, x: point.x, y: point.y,
        text: '', color, fontSize: Math.max(customSize * 2, 16),
      };
      setTextBoxes(prev => [...prev, newBox]);
      setEditingTextId(id);
      return;
    }

    const point = getPoint(e);
    lastPoint.current = point;
    setIsDrawing(true);

    if (isShapeTool) {
      shapeStart.current = point;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) shapeSnapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const point = getPoint(e);

    if (isShapeTool && shapeStart.current && shapeSnapshot.current) {
      ctx.putImageData(shapeSnapshot.current, 0, 0);
      ctx.lineWidth = customSize;
      ctx.strokeStyle = color;
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;

      const sx = shapeStart.current.x, sy = shapeStart.current.y;

      if (tool === 'rectangle') {
        ctx.beginPath();
        ctx.rect(sx, sy, point.x - sx, point.y - sy);
        ctx.stroke();
      } else if (tool === 'circle') {
        const rx = Math.abs(point.x - sx) / 2;
        const ry = Math.abs(point.y - sy) / 2;
        const cx = (sx + point.x) / 2;
        const cy = (sy + point.y) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (tool === 'arrow') {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        // Arrowhead
        const angle = Math.atan2(point.y - sy, point.x - sx);
        const headLen = 15;
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(point.x - headLen * Math.cos(angle - Math.PI / 6), point.y - headLen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(point.x - headLen * Math.cos(angle + Math.PI / 6), point.y - headLen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      }
      return;
    }

    if (!lastPoint.current) return;
    ctx.lineWidth = getLineWidth();

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else if (tool === 'highlighter') {
      ctx.globalCompositeOperation = 'multiply';
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.globalAlpha = 1;
    }

    const midX = (lastPoint.current.x + point.x) / 2;
    const midY = (lastPoint.current.y + point.y) / 2;
    ctx.quadraticCurveTo(lastPoint.current.x, lastPoint.current.y, midX, midY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    lastPoint.current = point;
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPoint.current = null;
    shapeStart.current = null;
    shapeSnapshot.current = null;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    saveState();
  };

  const undo = () => {
    if (historyIndex <= 0) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const newIndex = historyIndex - 1;
    ctx.putImageData(history[newIndex], 0, 0);
    setHistoryIndex(newIndex);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const newIndex = historyIndex + 1;
    ctx.putImageData(history[newIndex], 0, 0);
    setHistoryIndex(newIndex);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setTextBoxes([]);
    saveState();
  };

  // Flatten text boxes onto canvas for export
  const flattenCanvas = (): HTMLCanvasElement => {
    const canvas = canvasRef.current!;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d')!;
    ctx.drawImage(canvas, 0, 0);
    const dpr = window.devicePixelRatio || 1;
    textBoxes.forEach(tb => {
      ctx.font = `${tb.fontSize * dpr}px Inter, sans-serif`;
      ctx.fillStyle = tb.color;
      ctx.fillText(tb.text, tb.x * dpr, tb.y * dpr + tb.fontSize * dpr);
    });
    return exportCanvas;
  };

  const saveAsImage = () => {
    const exportCanvas = flattenCanvas();
    const link = document.createElement('a');
    link.download = `note-page${currentPage + 1}-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  const saveAsPdf = async () => {
    const { jsPDF } = await import('jspdf');
    const exportCanvas = flattenCanvas();
    const imgData = exportCanvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [exportCanvas.width, exportCanvas.height] });
    pdf.addImage(imgData, 'PNG', 0, 0, exportCanvas.width, exportCanvas.height);
    pdf.save(`note-page${currentPage + 1}-${Date.now()}.pdf`);
  };

  // Multi-page
  const saveCurrentPage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setPages(prev => {
      const newPages = [...prev];
      newPages[currentPage] = { dataUrl, textBoxes };
      return newPages;
    });
  }, [currentPage, textBoxes]);

  const loadPage = useCallback((pageIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const page = pages[pageIndex];
    if (page) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        setTextBoxes(page.textBoxes || []);
        setHistory([]);
        setHistoryIndex(-1);
        saveState();
      };
      img.src = page.dataUrl;
    } else {
      const rect = canvas.getBoundingClientRect();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
      setTextBoxes([]);
      setHistory([]);
      setHistoryIndex(-1);
      saveState();
    }
  }, [pages, saveState]);

  const goToPage = (pageIndex: number) => {
    saveCurrentPage();
    setCurrentPage(pageIndex);
    setTimeout(() => loadPage(pageIndex), 50);
  };

  const addPage = () => {
    saveCurrentPage();
    const newIndex = pages.length || currentPage + 1;
    setCurrentPage(newIndex);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, rect.width, rect.height);
      }
    }
    setTextBoxes([]);
    setHistory([]);
    setHistoryIndex(-1);
    saveState();
  };

  const totalPages = Math.max(pages.length, currentPage + 1);

  // LocalStorage
  const saveToLocalStorage = useCallback(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/png');
      const allPages = [...pages];
      allPages[currentPage] = { dataUrl, textBoxes };
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ pages: allPages, currentPage }));
    } catch {
      // Storage full or unavailable
    }
  }, [pages, currentPage, textBoxes]);

  const loadFromLocalStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data.pages && data.pages.length > 0) {
        setPages(data.pages);
        setCurrentPage(data.currentPage || 0);
        const page = data.pages[data.currentPage || 0];
        if (page) {
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              const img = new Image();
              img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                setTextBoxes(page.textBoxes || []);
                saveState();
              };
              img.src = page.dataUrl;
            }
          }
        }
        return true;
      }
    } catch {
      // Corrupt data
    }
    return false;
  }, [saveState]);

  const hasSavedData = () => {
    try { return !!localStorage.getItem(STORAGE_KEY); } catch { return false; }
  };

  // Text box editing
  const updateTextBox = (id: string, text: string) => {
    setTextBoxes(prev => prev.map(tb => tb.id === id ? { ...tb, text } : tb));
  };
  const finishTextEditing = () => setEditingTextId(null);
  const deleteTextBox = (id: string) => {
    setTextBoxes(prev => prev.filter(tb => tb.id !== id));
    if (editingTextId === id) setEditingTextId(null);
  };

  return {
    canvasRef, tool, setTool, color, setColor,
    brushSize, setBrushSize, customSize, setCustomSize,
    isDrawing, history, historyIndex,
    startDrawing, draw, stopDrawing,
    undo, redo, clearCanvas, saveAsImage, saveAsPdf,
    // Multi-page
    currentPage, totalPages, goToPage, addPage,
    // Text
    textBoxes, editingTextId, updateTextBox, finishTextEditing, deleteTextBox,
    // Storage
    saveToLocalStorage, loadFromLocalStorage, hasSavedData,
  };
}
