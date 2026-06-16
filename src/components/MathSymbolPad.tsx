import { useState, useRef, useEffect } from 'react';
import { api } from '../api/client';

// ─── Common symbol grid ────────────────────────────────────────

const SYMBOL_GROUPS = [
  { label: '集合', symbols: ['∈', '∉', '⊆', '⊊', '⊂', '⊃', '∅', '∪', '∩'] },
  { label: '逻辑', symbols: ['∀', '∃', '∧', '∨', '¬', '→', '⇒', '⇔', '∴'] },
  { label: '运算', symbols: ['±', '×', '÷', '√', '∞', '∣', '∥', '∑', '∏'] },
  { label: '比较', symbols: ['≤', '≥', '≠', '≈', '≡', '∼', '≪', '≫', '∝'] },
  { label: '希腊', symbols: ['α', 'β', 'γ', 'δ', 'θ', 'λ', 'μ', 'π', 'φ'] },
  { label: '角标', symbols: ['₁', '₂', '₃', '⁰', '¹', '²', '³', 'ₓ', 'ₙ'] },
];

// ─── Component ────────────────────────────────────────────────

interface Props {
  targetRef: React.RefObject<HTMLInputElement | null>;
  visible: boolean;
}

export default function MathSymbolPad({ targetRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [strokes, setStrokes] = useState<number[][][]>([]);
  const [currentStroke, setCurrentStroke] = useState<number[][]>([]);
  const [guesses, setGuesses] = useState<{ symbol: string; confidence: number }[]>([]);
  const [activeGroup, setActiveGroup] = useState(0);
  const [recognizing, setRecognizing] = useState(false);
  const recognizeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);


  // Resize canvas to match container on mount
  const initCanvasSize = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const w = container.clientWidth;
    const h = 80;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
  };

  useEffect(() => { initCanvasSize(); }, []);

  const insertSymbol = (symbol: string) => {
    const input = targetRef.current;
    if (!input) return;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    )?.set;
    nativeSetter?.call(input, input.value.slice(0, start) + symbol + input.value.slice(end));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.setSelectionRange(start + symbol.length, start + symbol.length);
    input.focus();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStrokes([]);
    setCurrentStroke([]);
    setGuesses([]);
  };

  const getCanvasPos = (e: React.PointerEvent): number[] => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const pos = getCanvasPos(e);
    setCurrentStroke([pos]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    e.preventDefault();
    if (currentStroke.length === 0) return;
    const pos = getCanvasPos(e);
    setCurrentStroke(prev => {
      const next = [...prev, pos];
      if (prev.length >= 1) {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
          ctx.strokeStyle = '#a78bfa';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(prev[prev.length - 1][0], prev[prev.length - 1][1]);
          ctx.lineTo(pos[0], pos[1]);
          ctx.stroke();
        }
      }
      return next;
    });
  };

  const handlePointerUp = () => {
    if (currentStroke.length < 2) {
      setCurrentStroke([]);
      return;
    }
    const newStrokes = [...strokes, currentStroke];
    setStrokes(newStrokes);
    setCurrentStroke([]);

    // Call backend for recognition after 400ms pause
    if (recognizeTimer.current) clearTimeout(recognizeTimer.current);
    recognizeTimer.current = setTimeout(async () => {
      setRecognizing(true);
      try {
        const results = await api.symbols.recognize(newStrokes);
        if (results.length > 0 && results[0].confidence > 0.5) {
          // Auto-insert top result
          insertSymbol(results[0].symbol);
          clearCanvas();
        } else {
          setGuesses(results);
        }
      } catch {
        // Backend unavailable — silently fail
      }
      setRecognizing(false);
    }, 400);
  };

  return (
    <div className="border border-slate-700/50 rounded-xl overflow-hidden bg-slate-900/90">
      {/* Drawing area */}
      <div className="p-3 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500">✍️ 手写符号</span>
          <button
            onClick={clearCanvas}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors"
          >
            清除
          </button>
        </div>
        <div
          ref={containerRef}
          className="bg-slate-950 rounded-lg border border-slate-700/30 overflow-hidden"
          style={{ touchAction: 'none', height: 80 }}
        >
          <canvas
            ref={canvasRef}
            className="block cursor-crosshair"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
        </div>

        {/* Recognition results */}
        {recognizing && (
          <div className="text-[10px] text-slate-500 mt-2">识别中...</div>
        )}
        {!recognizing && guesses.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[10px] text-slate-500 shrink-0">识别:</span>
            {guesses.map(g => (
              <button
                key={g.symbol}
                onPointerDown={(e) => {
                  e.preventDefault();
                  insertSymbol(g.symbol);
                  clearCanvas();
                }}
                className="px-2 py-1 text-sm bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/20 rounded text-purple-200 transition-colors"
              >
                {g.symbol}
                <span className="text-[10px] text-purple-400 ml-0.5">{Math.round(g.confidence * 100)}%</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Symbol grid tabs */}
      <div className="flex overflow-x-auto border-b border-slate-700/50">
        {SYMBOL_GROUPS.map((group, i) => (
          <button
            key={group.label}
            onClick={() => setActiveGroup(i)}
            className={`shrink-0 px-3 py-1.5 text-xs transition-colors ${
              i === activeGroup
                ? 'bg-purple-600/30 text-purple-200 border-b-2 border-purple-500'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {group.label}
          </button>
        ))}
      </div>

      {/* Symbol grid */}
      <div className="grid grid-cols-6 gap-1 p-2">
        {SYMBOL_GROUPS[activeGroup].symbols.map(symbol => (
          <button
            key={symbol}
            onPointerDown={(e) => {
              e.preventDefault();
              insertSymbol(symbol);
            }}
            className="py-2 text-lg text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-lg transition-colors active:scale-90 select-none"
          >
            {symbol}
          </button>
        ))}
      </div>
    </div>
  );
}
