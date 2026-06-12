import { useState, useEffect } from 'react';
import { BookOpen, Brain, Lightbulb, AlertTriangle, Network } from 'lucide-react';
import { api } from '../api/client';
import type { Card } from '../types/card';
import { DIM_ORDER, DIM_LABELS } from '../types/card';

const GRID_ICONS: Record<string, React.FC<{size?:number}>> = {
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

export default function BrowseMode() {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
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

  // Build dimension grid for active card
  const buildDims = (card: Card) => {
    const dims: { key: string; label: string; type: 'cloze' | 'choice' }[] = [];
    DIM_ORDER.forEach(dim => {
      if ((card.dimensions.cloze as any)?.[dim]) dims.push({ key: dim, label: DIM_LABELS[dim], type: 'cloze' });
      if ((card.dimensions.choice as any)?.[dim]) dims.push({ key: dim, label: DIM_LABELS[dim], type: 'choice' });
    });
    return dims;
  };

  return (
    <div className="space-y-6">
      {/* Card selector row */}
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="text-sm text-purple-300 font-medium mr-2">📐 章节选择</h2>
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => { setActiveCard(card); setActiveDim(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeCard?.id === card.id
                ? 'bg-purple-600/30 text-purple-200 border border-purple-500/30'
                : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-slate-700/30'
            }`}
          >
            {card.id} {card.title.length > 8 ? card.title.slice(0, 8) + '...' : card.title}
          </button>
        ))}
      </div>

      {!activeCard && (
        <div className="glass-card p-12 text-center">
          <p className="text-slate-400">选择上方章节查看卡片</p>
        </div>
      )}

      {activeCard && (
        <div>
          {/* Card header */}
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-2xl p-5 mb-6 border border-purple-500/20">
            <div className="text-xs text-purple-300/70">{activeCard.category}</div>
            <h2 className="text-xl font-bold text-white mt-1">{activeCard.title}</h2>
            <div className="text-xs text-slate-400 mt-1">{activeCard.id}</div>
          </div>

          {/* 9-grid dimensions */}
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
                  <div className="text-[10px] text-slate-500 mt-0.5">{dim.type === 'cloze' ? '填空' : '选择'}</div>
                  {isActive && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-purple-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Detail panel */}
          {activeDim && (() => {
            const isCloze = (activeCard.dimensions.cloze as any)?.[activeDim];
            const isChoice = (activeCard.dimensions.choice as any)?.[activeDim];
            const dimData = (activeCard.dimensions as any)[isCloze ? 'cloze' : 'choice']?.[activeDim];
            if (!dimData) return null;

            return (
              <div className="glass-card mt-6 p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded bg-gradient-to-br ${GRID_COLORS[activeDim]} flex items-center justify-center`}>
                    {(() => { const Icon = GRID_ICONS[activeDim]; return <span className="text-white"><Icon size={12} /></span>; })()}
                  </div>
                  <span className="text-sm font-medium text-slate-200">{DIM_LABELS[activeDim]}</span>
                  <span className="text-xs text-slate-500">({isCloze ? '填空' : '选择'})</span>
                </div>
                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {dimData.question}
                </div>
                {isChoice && dimData.options && (
                  <div className="space-y-1.5 mt-3">
                    {dimData.options.map((opt: string, i: number) => (
                      <div key={i} className={`text-xs px-3 py-1.5 rounded ${
                        i === dimData.answer
                          ? 'bg-green-600/15 text-green-300 border border-green-600/30'
                          : 'bg-slate-700/30 text-slate-500 border border-slate-700/20'
                      }`}>
                        {String.fromCharCode(65 + i)}. {opt}
                      </div>
                    ))}
                  </div>
                )}
                {isCloze && Array.isArray(dimData.answer) && (
                  <div className="text-xs text-green-400 mt-2 border-t border-slate-700/50 pt-3">
                    答案：{dimData.answer.join(' · ')}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
