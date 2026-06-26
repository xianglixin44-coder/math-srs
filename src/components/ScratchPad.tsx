import { useRef, useState, useEffect, useCallback } from 'react';
import { Pen, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

interface Props {
  /** When this changes, the canvas auto-clears */
  resetKey?: string;
}

export default function ScratchPad({ resetKey }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Initialize canvas
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = (isOpen ? 300 : 0) * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${isOpen ? 300 : 0}px`;
    }
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const dpr = window.devicePixelRatio || 1;
      ctx.scale(dpr, dpr);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctxRef.current = ctx;
    }
  }, [isOpen]);

  useEffect(() => {
    initCanvas();
    const onResize = () => initCanvas();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [initCanvas]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Auto-clear when resetKey changes
  useEffect(() => {
    clearCanvas();
  }, [resetKey]);
  const getPos = (e: React.PointerEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDrawing(true);
    const { x, y } = getPos(e);
    ctxRef.current?.beginPath();
    ctxRef.current?.moveTo(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    // Prevent scrolling while drawing on iPad
    e.preventDefault();
    const { x, y } = getPos(e);
    ctxRef.current?.lineTo(x, y);
    ctxRef.current?.stroke();
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
    ctxRef.current?.closePath();
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 bg-white hover:bg-gray-100/50 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm text-gray-700">
          <Pen size={14} className="text-blue-600" />
          手写草稿
        </span>
        <div className="flex items-center gap-2">
          {isOpen && (
            <span
              onClick={(e) => { e.stopPropagation(); clearCanvas(); }}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors"
              title="清除"
            >
              <Trash2 size={12} /> 清除
            </span>
          )}
          {isOpen ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
        </div>
      </button>

      {/* Canvas area */}
      {isOpen && (
        <div className="bg-gray-100 border-t border-gray-200" style={{ touchAction: 'none' }}>
          <canvas
            ref={canvasRef}
            className="w-full block cursor-crosshair"
            style={{ height: 300 }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
        </div>
      )}
    </div>
  );
}
