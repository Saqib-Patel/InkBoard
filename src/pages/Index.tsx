import { useState, useEffect, useCallback, useRef } from 'react';
import { useFabricCanvas } from '@/hooks/useFabricCanvas';
import Toolbar from '@/components/Toolbar';
import LaserOverlay from '@/components/LaserOverlay';
import WelcomeTooltip from '@/components/WelcomeTooltip';
import SettingsPanel from '@/components/SettingsPanel';
import KeyboardCheatsheet from '@/components/KeyboardCheatsheet';
import ErrorBoundary from '@/components/ErrorBoundary';
import type { GridStyle } from '@/components/SettingsPanel';
import {
  ChevronLeft, ChevronRight, Plus, Maximize, Minimize,
  FolderOpen, PenTool, ZoomIn, ZoomOut,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Tool } from '@/hooks/useFabricCanvas';

const Index = () => {
  const {
    canvasRef, tool, setTool, color, setColor,
    brushSize, setBrushSize, customSize, setCustomSize,
    opacity, setOpacity,
    history, historyIndex,
    undo, redo, clearCanvas, saveAsImage, saveAsPdf, saveAsSvg,
    currentPage, totalPages, goToPage, addPage,
    loadFromLocalStorage, hasSavedData, autoSave,
    zoom, zoomIn, zoomOut, resetZoom,
    deleteSelected,
  } = useFabricCanvas();

  const [gridStyle, setGridStyle] = useState<GridStyle>('plain');
  const [darkMode, setDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [autoSaveInterval, setAutoSaveInterval] = useState(30);

  // Dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Auto-save
  useEffect(() => {
    const interval = setInterval(() => autoSave(), autoSaveInterval * 1000);
    return () => clearInterval(interval);
  }, [autoSave, autoSaveInterval]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') return;

    const key = e.key.toLowerCase();
    const meta = e.ctrlKey || e.metaKey;

    const toolMap: Record<string, Tool> = {
      s: 'select', p: 'pen', h: 'highlighter', e: 'eraser',
      t: 'text', r: 'rectangle', c: 'circle', a: 'arrow',
      l: 'laser', v: 'triangle',
    };

    // Meta shortcuts first
    if (meta) {
      if (key === 'z' && e.shiftKey) { e.preventDefault(); redo(); return; }
      if (key === 'z') { e.preventDefault(); undo(); return; }
      if (key === 's') { e.preventDefault(); autoSave(); toast.success('Saved!'); return; }
      if (key === 'a') { e.preventDefault(); return; }
      if (key === '=') { e.preventDefault(); zoomIn(); return; }
      if (key === '-') { e.preventDefault(); zoomOut(); return; }
      if (key === '0') { e.preventDefault(); resetZoom(); return; }
      if (key === ']') { e.preventDefault(); if (currentPage < totalPages - 1) goToPage(currentPage + 1); else addPage(); return; }
      if (key === '[') { e.preventDefault(); if (currentPage > 0) goToPage(currentPage - 1); return; }
    }

    if (key === 'delete' || key === 'backspace') { deleteSelected(); return; }
    if (!meta && toolMap[key]) { setTool(toolMap[key]); return; }
    if (key === 'g') { setGridStyle(prev => prev === 'plain' ? 'dots' : prev === 'dots' ? 'grid' : prev === 'grid' ? 'lines' : 'plain'); return; }
    if (key === 'f') { toggleFullscreen(); return; }
  }, [setTool, undo, redo, autoSave, zoomIn, zoomOut, resetZoom, deleteSelected, currentPage, totalPages, goToPage, addPage]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => { setLoaded(true); }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const gridClass =
    gridStyle === 'dots' ? 'canvas-grid-dots' :
    gridStyle === 'grid' ? 'canvas-grid-lines' :
    gridStyle === 'lines' ? 'canvas-grid-ruled' : '';

  return (
    <ErrorBoundary>
      <div className={`fixed inset-0 canvas-gradient overflow-hidden transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
        <WelcomeTooltip />
        <KeyboardCheatsheet />

        <Toolbar
          tool={tool} setTool={setTool}
          color={color} setColor={setColor}
          brushSize={brushSize} setBrushSize={setBrushSize}
          customSize={customSize} setCustomSize={setCustomSize}
          opacity={opacity} setOpacity={setOpacity}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onUndo={undo} onRedo={redo}
          onClear={clearCanvas}
          onSavePng={() => { saveAsImage(); toast.success('PNG exported!'); }}
          onSavePdf={() => { saveAsPdf(); toast.success('PDF exported!'); }}
          onSaveSvg={() => { saveAsSvg(); toast.success('SVG exported!'); }}
        />

        {/* Canvas */}
        <div className="relative w-full h-full">
          {gridStyle !== 'plain' && (
            <div className={`absolute inset-0 ${gridClass} pointer-events-none z-10`} />
          )}
          <canvas
            ref={canvasRef}
            className={`w-full h-full ${tool === 'laser' ? 'cursor-none' : ''}`}
          />
        </div>

        <LaserOverlay active={tool === 'laser'} />

        {/* Bottom bar */}
        <div className="fixed bottom-4 left-4 right-4 flex items-end justify-between z-30 pointer-events-none">
          {/* Brand */}
          <div className="flex items-center gap-2 pointer-events-auto select-none">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary">
              <PenTool size={14} className="text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold brand-text tracking-tight">NoteCanvas</span>
          </div>

          {/* Page navigation + zoom */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button className="page-nav-btn" onClick={zoomOut} aria-label="Zoom out">
              <ZoomOut size={16} />
            </button>
            <span className="text-[10px] font-mono text-muted-foreground px-1 select-none min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button className="page-nav-btn" onClick={zoomIn} aria-label="Zoom in">
              <ZoomIn size={16} />
            </button>

            <div className="w-px h-5 bg-border mx-1" />

            <button
              className="page-nav-btn"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 0}
              aria-label="Previous page"
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
              aria-label={currentPage >= totalPages - 1 ? 'Add new page' : 'Next page'}
            >
              {currentPage >= totalPages - 1 ? <Plus size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>

          {/* Quick controls */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {hasSavedData() && (
              <button className="page-nav-btn" onClick={loadFromLocalStorage} title="Load saved notes" aria-label="Load saved notes">
                <FolderOpen size={16} />
              </button>
            )}
            <SettingsPanel
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              gridStyle={gridStyle}
              setGridStyle={setGridStyle}
              autoSaveInterval={autoSaveInterval}
              setAutoSaveInterval={setAutoSaveInterval}
              onResetCanvas={clearCanvas}
            />
            <button className="page-nav-btn" onClick={toggleFullscreen} title="Fullscreen (F)" aria-label="Toggle fullscreen">
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Index;
