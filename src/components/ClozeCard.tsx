import { useState, useRef } from 'react';
import { Check, X } from 'lucide-react';
import { renderLine } from '../utils/katex';
import MathSymbolPad from './MathSymbolPad';

interface Props {
  question: string;
  answer: string[];
  onScore: (score: number) => void;
}

export default function ClozeCard({ question, answer: answers, onScore }: Props) {
  const blanks = (question.match(/\[\[(\d+)\]\]/g) || []).length;
  const [inputs, setInputs] = useState<string[]>(Array(blanks).fill(''));
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  // Ensure array has enough slots
  if (inputRefs.current.length < blanks) {
    inputRefs.current = Array(blanks).fill(null);
  }
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSubmit = () => {
    const res = inputs.map((inp, i) => {
      const norm = inp.trim().normalize('NFKC');
      return norm === (answers[i] || '');
    });
    setResults(res);
    setSubmitted(true);
    setFocusedIdx(null);
    onScore(res.every(Boolean) ? 3 : 0);
  };

  const handleFocus = (idx: number) => {
    if (blurTimeout.current) clearTimeout(blurTimeout.current);
    setFocusedIdx(idx);
  };

  const handleBlur = () => {
    // Delay hiding the pad so symbol button taps can register
    blurTimeout.current = setTimeout(() => setFocusedIdx(null), 200);
  };

  const renderQuestion = () => {
    const parts = question.split(/(\[\[\d+\]\])/g);
    return parts.map((part, i) => {
      const m = part.match(/\[\[(\d+)\]\]/);
      if (m) {
        const idx = parseInt(m[1]) - 1;
        return submitted ? (
          <span key={i} className={`inline px-1.5 py-0.5 rounded font-mono text-sm ${
            results[idx]
              ? 'bg-green-600/30 text-green-300'
              : 'bg-red-600/30 text-red-300'
          }`}>
            {inputs[idx] || '___'}
            {results[idx] ? <Check size={12} className="inline ml-1" /> : <X size={12} className="inline ml-1" />}
          </span>
        ) : (
          <input
            key={i}
            ref={el => { inputRefs.current[idx] = el; }}
            value={inputs[idx]}
            onChange={e => {
              const next = [...inputs];
              next[idx] = e.target.value;
              setInputs(next);
            }}
            onFocus={() => handleFocus(idx)}
            onBlur={handleBlur}
            className="w-24 px-1.5 py-0.5 bg-slate-700 border border-purple-500/30 rounded text-sm text-purple-200 font-mono focus:outline-none focus:border-purple-400"
            placeholder={`填${idx + 1}`}
            onPaste={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
          />
        );
      }
      return <span key={i}>{renderLine(part)}</span>;
    });
  };

  return (
    <div
      className="glass-card p-6 space-y-4"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap select-none">
        {renderQuestion()}
      </div>
      {!submitted && (
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-purple-600/40 hover:bg-purple-600/60 rounded-lg text-sm transition-colors"
        >
          提交
        </button>
      )}
      {!submitted && focusedIdx !== null && (
        <MathSymbolPad
          targetRef={{ current: inputRefs.current[focusedIdx] }}
          visible={true}
        />
      )}
      {submitted && !results.every(Boolean) && (
        <div className="text-xs text-green-400 mt-2">
          正确答案：{answers.join(' · ')}
        </div>
      )}
    </div>
  );
}
