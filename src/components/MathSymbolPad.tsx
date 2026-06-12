import { useState } from 'react';

// Common math symbols organized by category
const SYMBOL_GROUPS = [
  {
    label: '集合',
    symbols: ['∈', '∉', '⊆', '⊊', '⊂', '⊃', '⊇', '⊋', '∅', '∪', '∩', '∁'],
  },
  {
    label: '逻辑',
    symbols: ['∀', '∃', '∄', '∧', '∨', '¬', '→', '↔', '⇒', '⇔', '∴', '∵'],
  },
  {
    label: '运算',
    symbols: ['±', '∓', '×', '÷', '√', '∛', '∣', '∤', '∥', '∦', '∞', '∝'],
  },
  {
    label: '比较',
    symbols: ['≤', '≥', '≠', '≈', '≡', '≢', '≅', '∼', '∝', '≪', '≫', '≺'],
  },
  {
    label: '希腊',
    symbols: ['α', 'β', 'γ', 'δ', 'ε', 'θ', 'λ', 'μ', 'π', 'σ', 'φ', 'ω'],
  },
  {
    label: '角标',
    symbols: ['₀', '₁', '₂', '₃', '₄', '⁰', '¹', '²', '³', '⁴', 'ᵢ', 'ⱼ'],
  },
];

interface Props {
  /** Ref to the input element that should receive symbols */
  targetRef: React.RefObject<HTMLInputElement | null>;
  /** Whether the pad is visible */
  visible: boolean;
  /** Called when a symbol is inserted */
  onInsert: () => void;
}

export default function MathSymbolPad({ targetRef, visible, onInsert }: Props) {
  const [activeGroup, setActiveGroup] = useState(0);

  if (!visible) return null;

  const insertSymbol = (symbol: string) => {
    const input = targetRef.current;
    if (!input) return;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    const before = input.value.slice(0, start);
    const after = input.value.slice(end);
    const newValue = before + symbol + after;

    // Use native setter to trigger React's onChange
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    )?.set;
    nativeInputValueSetter?.call(input, newValue);
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Restore cursor position after the inserted symbol
    const newPos = start + symbol.length;
    input.setSelectionRange(newPos, newPos);
    input.focus();
    onInsert();
  };

  return (
    <div className="border border-slate-700/50 rounded-xl overflow-hidden bg-slate-900/80">
      {/* Group tabs */}
      <div className="flex overflow-x-auto border-b border-slate-700/50">
        {SYMBOL_GROUPS.map((group, i) => (
          <button
            key={group.label}
            onClick={() => setActiveGroup(i)}
            className={`shrink-0 px-3 py-2 text-xs transition-colors ${
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
              e.preventDefault(); // prevent blur on input
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
