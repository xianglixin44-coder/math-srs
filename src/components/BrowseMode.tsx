import { useState, useEffect } from 'react';
import { BookOpen, Brain, Lightbulb, AlertTriangle, Network, ArrowLeft } from 'lucide-react';
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

interface DimInfo {
  key: string;
  label: string;
  type: 'cloze' | 'choice';
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

function buildDims(card: Card): DimInfo[] {
  const dims: DimInfo[] = [];
  DIM_ORDER.forEach(dim => {
    if ((card.dimensions.cloze as any)?.[dim]) dims.push({ key: dim, label: DIM_LABELS[dim], type: 'cloze' });
    if ((card.dimensions.choice as any)?.[dim]) dims.push({ key: dim, label: DIM_LABELS[dim], type: 'choice' });
  });
  return dims;
}

export default function BrowseMode({ activeCardId }: Props) {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [selectedDim, setSelectedDim] = useState<string | null>(null);

  useEffect(() => {
    api.cards.list().then(setCards).catch(() => setCards([]));
  }, []);

  // Reset selected dim when card changes
  useEffect(() => {
    setSelectedDim(null);
  }, [activeCardId]);

  if (cards === null) {
    return <div className="glass-card p-12 text-center"><p className="text-slate-400">加载中...</p></div>;
  }

  if (cards.length === 0) {
    return <div className="glass-card p-12 text-center"><p className="text-slate-400">暂无卡片</p></div>;
  }

  const activeCard = cards.find(c => c.id === activeCardId) ?? null;

  if (!activeCard) {
    return (
      <div className="glass-card p-12 text-center space-y-3">
        <p className="text-slate-400">从左侧目录选择一张卡片查看</p>
        <p className="text-xs text-slate-500">点击维度方格进入学习笔记</p>
      </div>
    );
  }

  const dims = buildDims(activeCard);

  // ── Detail page (single dimension, full page) ──────────────────
  if (selectedDim) {
    const dim = dims.find(d => d.key === selectedDim);
    if (!dim) { setSelectedDim(null); return null; }

    const isCloze = (activeCard.dimensions.cloze as any)?.[dim.key];
    const isChoice = (activeCard.dimensions.choice as any)?.[dim.key];
    const dimData = (activeCard.dimensions as any)[isCloze ? 'cloze' : 'choice']?.[dim.key];
    if (!dimData) { setSelectedDim(null); return null; }

    return (
      <div className="space-y-6" key={`detail-${activeCard.id}-${dim.key}`}>
        {/* Back + breadcrumb */}
        <button
          onClick={() => setSelectedDim(null)}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={16} />
          <span className="text-slate-500">{activeCard.id} {activeCard.title}</span>
        </button>

        {/* Dimension header */}
        <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/30">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${GRID_COLORS[dim.key]} flex items-center justify-center`}>
              {(() => { const Icon = GRID_ICONS[dim.key]; return <span className="text-white"><Icon size={20} /></span>; })()}
            </div>
            <div>
              <div className="text-lg font-bold text-white">{dim.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">
                {dim.type === 'cloze' ? '填空笔记' : '选择笔记'} · {activeCard.title}
              </div>
            </div>
          </div>
        </div>

        {/* Note content */}
        <div className="glass-card p-6">
          <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            {isCloze && Array.isArray(dimData.answer)
              ? renderClozeNote(dimData.question, dimData.answer)
              : isChoice && dimData.options
                ? renderChoiceNote(dimData.question, dimData.options, dimData.answer as number)
                : renderLine(dimData.question)
            }
          </div>
        </div>
      </div>
    );
  }

  // ── Grid page ──────────────────────────────────────────────
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
        {dims.map(dim => {
          const Icon = GRID_ICONS[dim.key] || BookOpen;
          return (
            <button
              key={dim.key}
              onClick={() => setSelectedDim(dim.key)}
              className="relative rounded-xl p-4 text-left border transition-all min-h-[100px] bg-slate-800/40 border-slate-700/30 hover:border-slate-600/50 hover:bg-slate-800/60"
            >
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${GRID_COLORS[dim.key]} flex items-center justify-center mb-2`}>
                <span className="text-white"><Icon size={14} /></span>
              </div>
              <div className="text-xs font-medium text-slate-200">{dim.label}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{dim.type === 'cloze' ? '填空笔记' : '选择笔记'}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
