import { useState, useEffect, useCallback } from 'react';
import { useCanvas } from '@/hooks/useCanvas';
import Toolbar from '@/components/Toolbar';
import TextBoxOverlay from '@/components/TextBoxOverlay';
import LaserOverlay from '@/components/LaserOverlay';
import WelcomeTooltip from '@/components/WelcomeTooltip';
import {
  ChevronLeft, ChevronRight, Plus, Grid3X3, Maximize, Minimize,
  FolderOpen, PenTool,
} from 'lucide-react';
import type { Tool } from '@/hooks/useCanvas';

const Index = () => {
  const {
    canvasRef, tool, setTool, color, setColor,
    brushSize, setBrushSize, customSize, setCustomSize,
    history, historyIndex,
    startDrawing, draw, stopDrawing,
    undo, redo, clearCanvas, saveAsImage, saveAsPdf,
    currentPage, totalPages, goToPage, addPage,
    textBoxes, editingTextId, updateTextBox, finishTextEditing, deleteTextBox,
    loadFromLocalStorage, hasSavedData,
  } = useCanvas();

  const [showGrid, setShowGrid] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (editingTextId) return; // Don't capture while typing text
    const key = e.key.toLowerCase();
    const toolMap: Record<string, Tool> = {
      p: 'pen', h: 'highlighter', e: 'eraser',
      t: 'text', r: 'rectangle', c: 'circle', a: 'arrow', l: 'laser',
    };
    if (toolMap[key]) { setTool(toolMap[key]); return; }
    if (key === 'g') { setShowGrid(prev => !prev); return; }
    if (key === 'f') { toggleFullscreen(); return; }
    if ((e.ctrlKey || e.metaKey) && key === 'z') { e.preventDefault(); undo(); return; }
    if ((e.ctrlKey || e.metaKey) && key === 'y') { e.preventDefault(); redo(); return; }
  }, [setTool, undo, redo, editingTextId]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    setLoaded(true);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const getCursorClass = () => {
    if (tool === 'text') return 'cursor-text';
    if (tool === 'eraser') return 'cursor-cell';
    return 'cursor-crosshair';
  };

  return (
    <div className={`fixed inset-0 canvas-gradient overflow-hidden transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
      <WelcomeTooltip />

      <Toolbar
        tool={tool} setTool={setTool}
        color={color} setColor={setColor}
        brushSize={brushSize} setBrushSize={setBrushSize}
        customSize={customSize} setCustomSize={setCustomSize}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={undo} onRedo={redo}
        onClear={clearCanvas}
        onSavePng={saveAsImage}
        onSavePdf={saveAsPdf}
      />

      {/* Canvas */}
      <div className="relative w-full h-full">
        {showGrid && (
          <div className="absolute inset-0 canvas-grid pointer-events-none z-10" />
        )}
        <canvas
          ref={canvasRef}
          className={`w-full h-full touch-none ${getCursorClass()}`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <TextBoxOverlay
          textBoxes={textBoxes}
          editingTextId={editingTextId}
          onUpdate={updateTextBox}
          onFinish={finishTextEditing}
          onDelete={deleteTextBox}
        />
      </div>

      {/* Bottom bar: branding + page nav + controls */}
      <div className="fixed bottom-4 left-4 right-4 flex items-end justify-between z-30 pointer-events-none">
        {/* Brand */}
        <div className="flex items-center gap-2 pointer-events-auto select-none">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--tool-active))' }}>
            <PenTool size={14} className="text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold brand-text tracking-tight">NoteCanvas</span>
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            className="page-nav-btn"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 0}
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs font-semibold text-muted-foreground px-2 select-none">
            {currentPage + 1} / {totalPages}
          </span>
          <button
            className="page-nav-btn"
            onClick={() => currentPage < totalPages - 1 ? goToPage(currentPage + 1) : addPage()}
            title={currentPage >= totalPages - 1 ? 'New page' : 'Next page'}
          >
            {currentPage >= totalPages - 1 ? <Plus size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Quick controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {hasSavedData() && (
            <button
              className="page-nav-btn"
              onClick={loadFromLocalStorage}
              title="Load saved notes"
            >
              <FolderOpen size={16} />
            </button>
          )}
          <button
            className="page-nav-btn"
            onClick={() => setShowGrid(prev => !prev)}
            title="Toggle grid (G)"
            style={{ background: showGrid ? 'hsl(var(--tool-active))' : undefined, color: showGrid ? 'hsl(var(--tool-active-foreground))' : undefined }}
          >
            <Grid3X3 size={16} />
          </button>
          <button
            className="page-nav-btn"
            onClick={toggleFullscreen}
            title="Fullscreen (F)"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
