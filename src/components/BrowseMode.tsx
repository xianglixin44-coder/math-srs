import { useState, useEffect } from 'react';
import { BookOpen, Brain, Lightbulb, AlertTriangle, Network } from 'lucide-react';
import { api } from '../api/client';
import { renderLine } from '../utils/katex';
import type { Card } from '../types/card';
import { DIM_ORDER, DIM_LABELS } from '../types/card';

const GRID_ICONS: Record<string, React.FC<{ size?: number }>> = {
  formula: BookOpen,
  derive: Brain,
  trigger: Lightbulb,
  geometry: Lightbulb,
  trap: AlertTriangle,
  challenge: Brain,
  transform: Network,
};

const GRID_COLORS: Record<string, string> = {
  formula: 'from-purple-500 to-pink-500',
  derive: 'from-blue-500 to-cyan-500',
  trigger: 'from-emerald-500 to-teal-500',
  geometry: 'from-amber-500 to-orange-500',
  trap: 'from-rose-500 to-red-500',
  challenge: 'from-violet-500 to-purple-500',
  transform: 'from-cyan-500 to-blue-500',
};

interface Props {
  activeCardId: string | null;
}

/** Replace [[N]] placeholders with answer values, rendered as highlighted spans */
function renderClozeNote(question: string, answer: string[]): React.ReactNode[] {
  const parts = question.split(/(\[\[\d+\]\])/g);
  return parts.map((part, i) => {
    const m = part.match(/\[\[(\d+)\]\]/);
    if (m) {
      const idx = parseInt(m[1]) - 1;
      return (
        <span key={i} className="inline px-1.5 py-0.5 rounded font-medium text-purple-200 bg-purple-600/20 border border-purple-500/20">
          {answer[idx] ?? '___'}
        </span>
      );
    }
    return <span key={i}>{renderLine(part)}</span>;
  });
}

/** Render choice content as a study note: question + highlighted correct answer */
function renderChoiceNote(question: string, options: string[], answer: number): React.ReactNode {
  return (
    <div className="space-y-3">
      <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
        {renderLine(question)}
      </div>
      <div className="p-3 rounded-lg bg-green-600/10 border border-green-500/20">
        <div className="text-[10px] text-green-400/70 uppercase tracking-wider mb-1">正确答案</div>
        <div className="text-sm text-green-300 font-medium">
          {String.fromCharCode(65 + answer)}. {options[answer]}
        </div>
      </div>
      {/* Other options dimmed */}
      <div className="space-y-1 opacity-50">
        {options.map((opt, i) => i !== answer && (
          <div key={i} className="text-xs text-slate-500">
            {String.fromCharCode(65 + i)}. {opt}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BrowseMode({ activeCardId }: Props) {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [activeDim, setActiveDim] = useState<string | null>(null);

  useEffect(() => {
    api.cards.list().then(setCards).catch(() => setCards([]));
  }, []);

  if (cards === null) {
    return <div className="glass-card p-12 text-center"><p className="text-slate-400">加载中...</p></div>;
  }

  if (cards.length === 0) {
    return <div className="glass-card p-12 text-center"><p className="text-slate-400">暂无卡片</p></div>;
  }

  const activeCard = cards.find(c => c.id === activeCardId) ?? null;

  const buildDims = (card: Card) => {
    const dims: { key: string; label: string; type: 'cloze' | 'choice' }[] = [];
    DIM_ORDER.forEach(dim => {
      if ((card.dimensions.cloze as any)?.[dim]) dims.push({ key: dim, label: DIM_LABELS[dim], type: 'cloze' });
      if ((card.dimensions.choice as any)?.[dim]) dims.push({ key: dim, label: DIM_LABELS[dim], type: 'choice' });
    });
    return dims;
  };

  if (!activeCard) {
    return (
      <div className="glass-card p-12 text-center space-y-3">
        <p className="text-slate-400">从左侧目录选择一张卡片查看</p>
        <p className="text-xs text-slate-500">点击维度方格展开学习笔记</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card header */}
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-2xl p-5 border border-purple-500/20">
        <div className="text-xs text-purple-300/70">{activeCard.category}</div>
        <h2 className="text-xl font-bold text-white mt-1">{activeCard.title}</h2>
        <div className="text-xs text-slate-400 mt-1">{activeCard.id}</div>
      </div>

      {/* Dimension grid */}
      <div className="grid grid-cols-3 gap-3">
        {buildDims(activeCard).map(dim => {
          const Icon = GRID_ICONS[dim.key] || BookOpen;
          const isActive = activeDim === dim.key;
          return (
            <button
              key={dim.key}
              onClick={() => setActiveDim(isActive ? null : dim.key)}
              className={`relative rounded-xl p-4 text-left border transition-all min-h-[100px] ${
                isActive
                  ? 'bg-slate-800/80 border-purple-500/40 scale-[1.02] shadow-lg shadow-purple-500/10'
                  : 'bg-slate-800/40 border-slate-700/30 hover:border-slate-600/50 hover:bg-slate-800/60'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${GRID_COLORS[dim.key]} flex items-center justify-center mb-2`}>
                <span className="text-white"><Icon size={14} /></span>
              </div>
              <div className="text-xs font-medium text-slate-200">{dim.label}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{dim.type === 'cloze' ? '填空笔记' : '选择笔记'}</div>
              {isActive && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-purple-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Detail panel — study note style */}
      {activeDim && (() => {
        const isCloze = (activeCard.dimensions.cloze as any)?.[activeDim];
        const isChoice = (activeCard.dimensions.choice as any)?.[activeDim];
        const dimData = (activeCard.dimensions as any)[isCloze ? 'cloze' : 'choice']?.[activeDim];
        if (!dimData) return null;

        return (
          <div className="glass-card p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 pb-3 border-b border-slate-700/50">
              <div className={`w-6 h-6 rounded bg-gradient-to-br ${GRID_COLORS[activeDim]} flex items-center justify-center`}>
                {(() => { const Icon = GRID_ICONS[activeDim]; return <span className="text-white"><Icon size={12} /></span>; })()}
              </div>
              <span className="text-sm font-medium text-slate-200">{DIM_LABELS[activeDim]}</span>
              <span className="text-xs text-slate-500 ml-auto">📖 学习笔记</span>
            </div>

            {/* Content */}
            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {isCloze && Array.isArray(dimData.answer)
                ? renderClozeNote(dimData.question, dimData.answer)
                : isChoice && dimData.options
                  ? renderChoiceNote(dimData.question, dimData.options, dimData.answer as number)
                  : renderLine(dimData.question)
              }
            </div>
          </div>
        );
      })()}
    </div>
  );
}
