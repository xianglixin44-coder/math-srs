import { useState, useRef } from 'react';

// ─── Stroke-based handwriting recognition ──────────────────────

type Point = { x: number; y: number };

// 8-direction Freeman chain code
//  7 0 1
//  6   2
//  5 4 3
function direction(from: Point, to: Point): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const angle = Math.atan2(-dy, dx); // y-axis inverted in canvas
  // Normalize to 0..2π
  const a = angle < 0 ? angle + 2 * Math.PI : angle;
  // Quantize to 8 directions
  return Math.round((a / (Math.PI / 4)) % 8);
}

function strokesToChainCode(strokes: Point[][]): number[] {
  const codes: number[] = [];
  for (const stroke of strokes) {
    for (let i = 1; i < stroke.length; i++) {
      codes.push(direction(stroke[i - 1], stroke[i]));
    }
  }
  return codes;
}

// Compress repeated directions (e.g., [0,0,0,1,1] → [0,1])
function compressChain(codes: number[]): number[] {
  const result: number[] = [];
  for (const c of codes) {
    if (result.length === 0 || result[result.length - 1] !== c) {
      result.push(c);
    }
  }
  return result;
}

// ─── Symbol templates (compressed 8-direction chain codes) ────

interface SymbolTemplate {
  symbol: string;
  chain: number[];
}

const TEMPLATES: SymbolTemplate[] = [
  // ∈ — left arc then right arc: right→down→left→up, then right
  { symbol: '∈', chain: [2, 3, 4, 5, 6, 7, 0] },
  { symbol: '∈', chain: [2, 4, 6, 7, 0] },
  // ⊆ — like _ then open-top: right→right, then right→down→left→up
  { symbol: '⊆', chain: [0, 0, 2, 4, 6, 7, 0] },
  { symbol: '⊆', chain: [0, 0, 2, 3, 4, 5, 6, 7] },
  // ⊊ — ⊆ with slash through
  { symbol: '⊊', chain: [0, 0, 2, 4, 6, 7, 0, 1, 1, 5] },
  // ∅ — circle
  { symbol: '∅', chain: [0, 1, 2, 3, 4, 5, 6, 7] },
  // ∪ — right arc then left arc
  { symbol: '∪', chain: [2, 3, 4, 5, 6, 7, 0] },
  // ∩ — left arc then right arc (inverted ∪)
  { symbol: '∩', chain: [6, 5, 4, 3, 2, 1, 0] },
  // ⊆ alt — C shape with line under
  { symbol: '⊆', chain: [2, 3, 4, 5, 6, 7, 0, 0] },
  // ∅ alt — circle with slash
  { symbol: '∅', chain: [0, 1, 2, 3, 4, 5, 6, 7, 0] },
  // ≠ — equals with slash
  { symbol: '≠', chain: [0, 0, 1, 1, 5, 5] },
  // ≤
  { symbol: '≤', chain: [0, 0, 4, 4] },
  // ≥
  { symbol: '≥', chain: [0, 0, 6, 6] },
  // √
  { symbol: '√', chain: [7, 0, 2] },
  // ∞
  { symbol: '∞', chain: [0, 7, 6, 4, 3, 2, 2, 1, 0, 0, 7, 6, 5, 4, 3, 2, 1] },
  // →
  { symbol: '→', chain: [0, 0, 7, 0, 1, 0, 0] },
  // ⇒
  { symbol: '⇒', chain: [0, 0, 7, 0, 1, 0, 0, 1, 1, 5, 5] },
  // ∀
  { symbol: '∀', chain: [6, 5, 4, 3, 2, 7, 7, 0, 1, 2] },
  // ∃
  { symbol: '∃', chain: [0, 0, 7, 6, 5, 4, 3] },
];

// Levenshtein distance for sequence matching
function levenshtein(a: number[], b: number[]): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

function recognize(chain: number[]): { symbol: string; confidence: number }[] {
  if (chain.length < 3) return [];
  const compressed = compressChain(chain);
  const results = TEMPLATES.map(t => {
    const dist = levenshtein(compressed, t.chain);
    const maxLen = Math.max(compressed.length, t.chain.length);
    return { symbol: t.symbol, confidence: 1 - dist / maxLen };
  });
  results.sort((a, b) => b.confidence - a.confidence);
  // Deduplicate by symbol
  const seen = new Set<string>();
  const unique: { symbol: string; confidence: number }[] = [];
  for (const r of results) {
    if (!seen.has(r.symbol)) {
      seen.add(r.symbol);
      unique.push(r);
    }
  }
  return unique.slice(0, 5);
}

// ─── Common symbol grid (fallback) ────────────────────────────

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

export default function MathSymbolPad({ targetRef, visible }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [guesses, setGuesses] = useState<{ symbol: string; confidence: number }[]>([]);
  const [activeGroup, setActiveGroup] = useState(0);
  const recognizeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!visible) return null;

  const insertSymbol = (symbol: string) => {
    const input = targetRef.current;
    if (!input) return;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    const before = input.value.slice(0, start);
    const after = input.value.slice(end);
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    )?.set;
    nativeSetter?.call(input, before + symbol + after);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const newPos = start + symbol.length;
    input.setSelectionRange(newPos, newPos);
    input.focus();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setStrokes([]);
    setCurrentStroke([]);
    setGuesses([]);
  };

  const getCanvasPos = (e: React.PointerEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
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
      // Draw incrementally
      if (prev.length >= 1) {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
          ctx.strokeStyle = '#a78bfa';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(prev[prev.length - 1].x, prev[prev.length - 1].y);
          ctx.lineTo(pos.x, pos.y);
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

    // Attempt recognition after 400ms pause
    if (recognizeTimer.current) clearTimeout(recognizeTimer.current);
    recognizeTimer.current = setTimeout(() => {
      const chain = strokesToChainCode(newStrokes);
      const results = recognize(chain);
      setGuesses(results);
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
          className="bg-slate-950 rounded-lg border border-slate-700/30 overflow-hidden"
          style={{ touchAction: 'none' }}
        >
          <canvas
            ref={canvasRef}
            width={240}
            height={80}
            className="w-full block cursor-crosshair"
            style={{ height: 80 }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
        </div>

        {/* Recognition results */}
        {guesses.length > 0 && (
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
