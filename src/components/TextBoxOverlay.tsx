import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface TextBoxOverlayProps {
  textBoxes: { id: string; x: number; y: number; text: string; color: string; fontSize: number }[];
  editingTextId: string | null;
  onUpdate: (id: string, text: string) => void;
  onFinish: () => void;
  onDelete: (id: string) => void;
}

export default function TextBoxOverlay({
  textBoxes, editingTextId, onUpdate, onFinish, onDelete,
}: TextBoxOverlayProps) {
  return (
    <>
      {textBoxes.map(tb => (
        <TextBoxItem
          key={tb.id}
          box={tb}
          isEditing={editingTextId === tb.id}
          onUpdate={onUpdate}
          onFinish={onFinish}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}

function TextBoxItem({
  box, isEditing, onUpdate, onFinish, onDelete,
}: {
  box: { id: string; x: number; y: number; text: string; color: string; fontSize: number };
  isEditing: boolean;
  onUpdate: (id: string, text: string) => void;
  onFinish: () => void;
  onDelete: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <div
        className="absolute flex items-center gap-1 animate-scale-in"
        style={{ left: box.x, top: box.y, zIndex: 40 }}
      >
        <input
          ref={inputRef}
          className="bg-transparent border-b-2 outline-none font-medium"
          style={{
            color: box.color,
            fontSize: box.fontSize,
            borderColor: box.color,
            minWidth: 100,
          }}
          value={box.text}
          onChange={e => onUpdate(box.id, e.target.value)}
          onBlur={onFinish}
          onKeyDown={e => { if (e.key === 'Enter') onFinish(); }}
          placeholder="Type here..."
        />
        <button
          className="tool-btn !min-w-[28px] !min-h-[28px]"
          onClick={() => onDelete(box.id)}
          onMouseDown={e => e.preventDefault()}
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  if (!box.text) return null;

  return (
    <div
      className="absolute pointer-events-none font-medium"
      style={{
        left: box.x,
        top: box.y,
        color: box.color,
        fontSize: box.fontSize,
      }}
    >
      {box.text}
    </div>
  );
}
