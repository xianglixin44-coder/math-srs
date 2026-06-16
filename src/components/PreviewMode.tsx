import { useState, useEffect, useRef } from 'react';
import { Timer } from 'lucide-react';
import { renderLine } from '../utils/katex';

interface Props {
  title: string;
  dimensionLabel: string;
  question: string;
  answer: string[] | number;
  onComplete: () => void;
}

export default function PreviewMode({ title, dimensionLabel, question, answer, onComplete }: Props) {
  const [seconds, setSeconds] = useState(40);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(timer);
          setTimeout(() => onCompleteRef.current(), 300);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pct = (seconds / 40) * 100;

  // Render question with cloze answers filled in (preview shows the complete content)
  const renderPreview = () => {
    if (Array.isArray(answer)) {
      // Cloze: replace [[N]] with the correct answer
      const parts = question.split(/(\[\[\d+\]\])/g);
      return parts.map((part, i) => {
        const m = part.match(/\[\[(\d+)\]\]/);
        if (m) {
          const idx = parseInt(m[1]) - 1;
          return (
            <span key={i} className="inline px-1.5 py-0.5 bg-purple-600/20 text-purple-200 rounded font-medium text-sm">
              {answer[idx] || '___'}
            </span>
          );
        }
        return <span key={i}>{renderLine(part)}</span>;
      });
    }
    // Choice: show question without options
    return renderLine(question);
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer size={16} className="text-purple-400" />
          <span className="text-xs text-purple-400">{dimensionLabel}</span>
        </div>
        <span className="text-sm font-mono text-purple-300">{seconds}s</span>
      </div>

      <div className="w-full bg-slate-700 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-400 transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
        <p className="text-xs text-purple-400/60 mb-2">{title}</p>
        {renderPreview()}
      </div>

      <p className="text-xs text-slate-500 text-center">记忆关键内容，倒计时结束自动进入测试</p>
    </div>
  );
}
