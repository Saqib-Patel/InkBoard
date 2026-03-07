import { useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, PencilBrush, CircleBrush, FabricObject, Rect, Ellipse, Line, Textbox, type TPointerEventInfo } from 'fabric';

export type Tool = 'select' | 'pen' | 'highlighter' | 'eraser' | 'text' | 'rectangle' | 'circle' | 'arrow' | 'laser';
export type BrushSize = 'small' | 'medium' | 'large';

interface PageData {
  json: string;
}

const STORAGE_KEY = 'notesapp_fabric_pages';

export function useFabricCanvas() {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const [tool, setToolState] = useState<Tool>('pen');
  const [color, setColor] = useState('#1a1a2e');
  const [brushSize, setBrushSize] = useState<BrushSize>('medium');
  const [customSize, setCustomSize] = useState(6);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedo = useRef(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pages, setPages] = useState<PageData[]>([]);

  // Shape drawing state
  const shapeStart = useRef<{ x: number; y: number } | null>(null);
  const activeShape = useRef<FabricObject | null>(null);

  const fc = () => fabricRef.current;

  // --- Init ---
  const initCanvas = useCallback(() => {
    if (!canvasElRef.current) return;
    if (fabricRef.current) {
      fabricRef.current.dispose();
    }

    const parent = canvasElRef.current.parentElement;
    const w = parent?.clientWidth || window.innerWidth;
    const h = parent?.clientHeight || window.innerHeight;

    const canvas = new Canvas(canvasElRef.current, {
      width: w,
      height: h,
      backgroundColor: '#ffffff',
      isDrawingMode: true,
      selection: false,
    });

    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = '#1a1a2e';
    canvas.freeDrawingBrush.width = 6;

    fabricRef.current = canvas;

    // Save initial state
    saveHistoryState();
  }, []);

  useEffect(() => {
    initCanvas();

    const handleResize = () => {
      const canvas = fc();
      if (!canvas) return;
      const parent = canvasElRef.current?.parentElement;
      const w = parent?.clientWidth || window.innerWidth;
      const h = parent?.clientHeight || window.innerHeight;
      canvas.setDimensions({ width: w, height: h });
      canvas.renderAll();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      fabricRef.current?.dispose();
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- History ---
  const saveHistoryState = useCallback(() => {
    if (isUndoRedo.current) return;
    const canvas = fc();
    if (!canvas) return;
    const json = JSON.stringify(canvas.toJSON());
    setHistory(prev => {
      const newH = prev.slice(0, historyIndex + 1);
      newH.push(json);
      if (newH.length > 50) newH.shift();
      return newH;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Listen for object changes
  useEffect(() => {
    const canvas = fc();
    if (!canvas) return;
    const onModified = () => saveHistoryState();
    canvas.on('object:added', onModified);
    canvas.on('object:modified', onModified);
    canvas.on('object:removed', onModified);
    canvas.on('path:created', onModified);
    return () => {
      canvas.off('object:added', onModified);
      canvas.off('object:modified', onModified);
      canvas.off('object:removed', onModified);
      canvas.off('path:created', onModified);
    };
  }, [saveHistoryState]);

  const loadFromJSON = useCallback((json: string) => {
    const canvas = fc();
    if (!canvas) return;
    isUndoRedo.current = true;
    canvas.loadFromJSON(json).then(() => {
      canvas.renderAll();
      isUndoRedo.current = false;
    });
  }, []);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setHistory(prev => {
      if (prev[newIndex]) loadFromJSON(prev[newIndex]);
      return prev;
    });
  }, [historyIndex, loadFromJSON]);

  const redo = useCallback(() => {
    setHistory(prev => {
      if (historyIndex >= prev.length - 1) return prev;
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      if (prev[newIndex]) loadFromJSON(prev[newIndex]);
      return prev;
    });
  }, [historyIndex, loadFromJSON]);

  // --- Tool switching ---
  const setTool = useCallback((t: Tool) => {
    setToolState(t);
    const canvas = fc();
    if (!canvas) return;

    // Reset event listeners for shapes
    canvas.off('mouse:down');
    canvas.off('mouse:move');
    canvas.off('mouse:up');

    if (t === 'select') {
      canvas.isDrawingMode = false;
      canvas.selection = true;
      canvas.forEachObject(o => { o.selectable = true; o.evented = true; });
      canvas.defaultCursor = 'default';
      return;
    }

    if (t === 'pen' || t === 'highlighter' || t === 'eraser') {
      canvas.isDrawingMode = true;
      canvas.selection = false;
      canvas.forEachObject(o => { o.selectable = false; o.evented = false; });

      if (t === 'eraser') {
        // Use white brush as simple eraser
        canvas.freeDrawingBrush = new PencilBrush(canvas);
        canvas.freeDrawingBrush.color = '#ffffff';
        canvas.freeDrawingBrush.width = customSize * 3;
      } else if (t === 'highlighter') {
        canvas.freeDrawingBrush = new PencilBrush(canvas);
        canvas.freeDrawingBrush.color = color;
        canvas.freeDrawingBrush.width = customSize * 4;
        // We'll set opacity on the path after creation
      } else {
        canvas.freeDrawingBrush = new PencilBrush(canvas);
        canvas.freeDrawingBrush.color = color;
        canvas.freeDrawingBrush.width = customSize;
      }
      return;
    }

    // For text, shapes, laser — not drawing mode
    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.forEachObject(o => { o.selectable = false; o.evented = false; });

    if (t === 'text') {
      canvas.defaultCursor = 'text';
      setupTextTool(canvas);
    } else if (t === 'rectangle' || t === 'circle' || t === 'arrow') {
      canvas.defaultCursor = 'crosshair';
      setupShapeTool(canvas, t);
    } else if (t === 'laser') {
      canvas.defaultCursor = 'none';
    }
  }, [color, customSize]);

  // Highlighter: make paths semi-transparent
  useEffect(() => {
    const canvas = fc();
    if (!canvas) return;
    const onPath = () => {
      if (tool === 'highlighter') {
        const objects = canvas.getObjects();
        const last = objects[objects.length - 1];
        if (last) {
          last.set({ opacity: 0.35 });
          canvas.renderAll();
        }
      }
    };
    canvas.on('path:created', onPath);
    return () => { canvas.off('path:created', onPath); };
  }, [tool]);

  // Update brush when color/size changes
  useEffect(() => {
    const canvas = fc();
    if (!canvas || !canvas.freeDrawingBrush) return;
    if (tool === 'pen') {
      canvas.freeDrawingBrush.color = color;
      canvas.freeDrawingBrush.width = customSize;
    } else if (tool === 'highlighter') {
      canvas.freeDrawingBrush.color = color;
      canvas.freeDrawingBrush.width = customSize * 4;
    } else if (tool === 'eraser') {
      canvas.freeDrawingBrush.color = '#ffffff';
      canvas.freeDrawingBrush.width = customSize * 3;
    }
  }, [color, customSize, tool]);

  // --- Text tool ---
  const setupTextTool = (canvas: Canvas) => {
    canvas.on('mouse:down', (opt: TPointerEventInfo) => {
      const pointer = canvas.getViewportPoint(opt.e);
      const textbox = new Textbox('Type here...', {
        left: pointer.x,
        top: pointer.y,
        fontSize: Math.max(customSize * 3, 18),
        fill: color,
        fontFamily: 'Inter, sans-serif',
        editable: true,
        selectable: true,
        width: 200,
      });
      canvas.add(textbox);
      canvas.setActiveObject(textbox);
      textbox.enterEditing();
      // Remove listener after placement
      canvas.off('mouse:down');
    });
  };

  // --- Shape tools ---
  const setupShapeTool = (canvas: Canvas, shapeTool: 'rectangle' | 'circle' | 'arrow') => {
    canvas.on('mouse:down', (opt: TPointerEventInfo) => {
      const pointer = canvas.getViewportPoint(opt.e);
      shapeStart.current = { x: pointer.x, y: pointer.y };

      let shape: FabricObject;
      if (shapeTool === 'rectangle') {
        shape = new Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: 'transparent',
          stroke: color,
          strokeWidth: customSize,
          selectable: false,
          evented: false,
        });
      } else if (shapeTool === 'circle') {
        shape = new Ellipse({
          left: pointer.x,
          top: pointer.y,
          rx: 0,
          ry: 0,
          fill: 'transparent',
          stroke: color,
          strokeWidth: customSize,
          selectable: false,
          evented: false,
        });
      } else {
        // Arrow = line + we'll add arrowhead on mouse up
        shape = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          stroke: color,
          strokeWidth: customSize,
          selectable: false,
          evented: false,
        });
      }
      canvas.add(shape);
      activeShape.current = shape;
    });

    canvas.on('mouse:move', (opt: TPointerEventInfo) => {
      if (!shapeStart.current || !activeShape.current) return;
      const pointer = canvas.getViewportPoint(opt.e);
      const sx = shapeStart.current.x;
      const sy = shapeStart.current.y;

      if (shapeTool === 'rectangle') {
        const rect = activeShape.current as Rect;
        rect.set({
          left: Math.min(sx, pointer.x),
          top: Math.min(sy, pointer.y),
          width: Math.abs(pointer.x - sx),
          height: Math.abs(pointer.y - sy),
        });
      } else if (shapeTool === 'circle') {
        const ellipse = activeShape.current as Ellipse;
        ellipse.set({
          left: Math.min(sx, pointer.x),
          top: Math.min(sy, pointer.y),
          rx: Math.abs(pointer.x - sx) / 2,
          ry: Math.abs(pointer.y - sy) / 2,
        });
      } else {
        const line = activeShape.current as Line;
        line.set({ x2: pointer.x, y2: pointer.y });
      }
      canvas.renderAll();
    });

    canvas.on('mouse:up', () => {
      if (shapeTool === 'arrow' && activeShape.current && shapeStart.current) {
        // Add arrowhead
        const line = activeShape.current as Line;
        const x1 = line.x1!, y1 = line.y1!, x2 = line.x2!, y2 = line.y2!;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headLen = 15;

        const head1 = new Line([
          x2, y2,
          x2 - headLen * Math.cos(angle - Math.PI / 6),
          y2 - headLen * Math.sin(angle - Math.PI / 6),
        ], { stroke: color, strokeWidth: customSize, selectable: false, evented: false });

        const head2 = new Line([
          x2, y2,
          x2 - headLen * Math.cos(angle + Math.PI / 6),
          y2 - headLen * Math.sin(angle + Math.PI / 6),
        ], { stroke: color, strokeWidth: customSize, selectable: false, evented: false });

        canvas.add(head1);
        canvas.add(head2);
      }

      shapeStart.current = null;
      activeShape.current = null;

      // Re-setup for next shape
      canvas.off('mouse:down');
      canvas.off('mouse:move');
      canvas.off('mouse:up');
      setupShapeTool(canvas, shapeTool);
    });
  };

  // --- Clear ---
  const clearCanvas = useCallback(() => {
    const canvas = fc();
    if (!canvas) return;
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    canvas.renderAll();
    saveHistoryState();
  }, [saveHistoryState]);

  // --- Export ---
  const saveAsImage = useCallback(() => {
    const canvas = fc();
    if (!canvas) return;
    const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 2 });
    const link = document.createElement('a');
    link.download = `note-page${currentPage + 1}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }, [currentPage]);

  const saveAsPdf = useCallback(async () => {
    const canvas = fc();
    if (!canvas) return;
    const { jsPDF } = await import('jspdf');
    const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 2 });
    const w = canvas.getWidth();
    const h = canvas.getHeight();
    const pdf = new jsPDF({ orientation: w > h ? 'landscape' : 'portrait', unit: 'px', format: [w, h] });
    pdf.addImage(dataUrl, 'PNG', 0, 0, w, h);
    pdf.save(`note-page${currentPage + 1}-${Date.now()}.pdf`);
  }, [currentPage]);

  // --- Multi-page ---
  const saveCurrentPage = useCallback(() => {
    const canvas = fc();
    if (!canvas) return;
    const json = JSON.stringify(canvas.toJSON());
    setPages(prev => {
      const newPages = [...prev];
      newPages[currentPage] = { json };
      return newPages;
    });
  }, [currentPage]);

  const loadPage = useCallback((pageIndex: number) => {
    const canvas = fc();
    if (!canvas) return;
    const page = pages[pageIndex];
    if (page) {
      isUndoRedo.current = true;
      canvas.loadFromJSON(page.json).then(() => {
        canvas.renderAll();
        isUndoRedo.current = false;
        setHistory([]);
        setHistoryIndex(-1);
        saveHistoryState();
      });
    } else {
      canvas.clear();
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
      setHistory([]);
      setHistoryIndex(-1);
      saveHistoryState();
    }
  }, [pages, saveHistoryState]);

  const goToPage = useCallback((pageIndex: number) => {
    saveCurrentPage();
    setCurrentPage(pageIndex);
    setTimeout(() => loadPage(pageIndex), 50);
  }, [saveCurrentPage, loadPage]);

  const addPage = useCallback(() => {
    saveCurrentPage();
    const newIndex = Math.max(pages.length, currentPage + 1);
    setCurrentPage(newIndex);
    const canvas = fc();
    if (canvas) {
      canvas.clear();
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
    }
    setHistory([]);
    setHistoryIndex(-1);
    saveHistoryState();
  }, [saveCurrentPage, pages.length, currentPage, saveHistoryState]);

  const totalPages = Math.max(pages.length, currentPage + 1);

  // --- LocalStorage auto-save ---
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const canvas = fc();
        if (!canvas) return;
        const json = JSON.stringify(canvas.toJSON());
        const allPages = [...pages];
        allPages[currentPage] = { json };
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ pages: allPages, currentPage }));
      } catch { /* storage full */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [pages, currentPage]);

  const loadFromLocalStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data.pages?.length > 0) {
        setPages(data.pages);
        setCurrentPage(data.currentPage || 0);
        const page = data.pages[data.currentPage || 0];
        if (page) {
          loadFromJSON(page.json);
        }
        return true;
      }
    } catch { /* corrupt */ }
    return false;
  }, [loadFromJSON]);

  const hasSavedData = () => {
    try { return !!localStorage.getItem(STORAGE_KEY); } catch { return false; }
  };

  return {
    canvasRef: canvasElRef,
    tool, setTool, color, setColor,
    brushSize, setBrushSize, customSize, setCustomSize,
    history, historyIndex,
    undo, redo, clearCanvas, saveAsImage, saveAsPdf,
    currentPage, totalPages, goToPage, addPage,
    loadFromLocalStorage, hasSavedData,
  };
}
