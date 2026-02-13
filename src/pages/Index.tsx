import { useCanvas } from '@/hooks/useCanvas';
import Toolbar from '@/components/Toolbar';

const Index = () => {
  const {
    canvasRef,
    tool, setTool,
    color, setColor,
    brushSize, setBrushSize,
    history, historyIndex,
    startDrawing, draw, stopDrawing,
    undo, redo, clearCanvas, saveAsImage,
  } = useCanvas();

  return (
    <div className="fixed inset-0 canvas-gradient overflow-hidden">
      <Toolbar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={undo}
        onRedo={redo}
        onClear={clearCanvas}
        onSave={saveAsImage}
      />
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
    </div>
  );
};

export default Index;
