import { useState, useEffect } from 'react';
import { BookOpen, Brain, Lightbulb, AlertTriangle, Network, ArrowLeft } from 'lucide-react';
import { api } from '../api/client';
import type { Card } from '../types/card';
import { DIM_ORDER, DIM_LABELS } from '../types/card';
import PreviewMode from './PreviewMode';
import ClozeCard from './ClozeCard';
import ChoiceCard from './ChoiceCard';

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

type ViewState =
  | { stage: 'loading' }
  | { stage: 'empty' }
  | { stage: 'done'; correct: number; total: number; onRestart: () => void }
  | { stage: 'select'; card: Card; cardIdx: number; dims: DimInfo[]; scores: Record<string, number> }
  | { stage: 'review'; card: Card; dim: DimInfo; phase: 'preview' | 'test'; cardIdx: number; dimIdx: number; totalDims: number; scores: Record<string, number> };

interface DimInfo {
  key: string;
  label: string;
  type: 'cloze' | 'choice';
  data: any;
}

function buildDims(card: Card): DimInfo[] {
  const dims: DimInfo[] = [];
  DIM_ORDER.forEach(dim => {
    const clozeVal = (card.dimensions.cloze as any)?.[dim];
    const choiceVal = (card.dimensions.choice as any)?.[dim];
    if (clozeVal) dims.push({ key: dim, label: DIM_LABELS[dim], type: 'cloze', data: clozeVal });
    if (choiceVal) dims.push({ key: dim, label: DIM_LABELS[dim], type: 'choice', data: choiceVal });
  });
  return dims;
}

export default function ReviewMode() {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [view, setView] = useState<ViewState>({ stage: 'loading' });

  // Load due cards
  useEffect(() => {
    api.srs.next().then(list => {
      setCards(list);
      if (list.length === 0) {
        setView({ stage: 'empty' });
      } else {
        const dims = buildDims(list[0]);
        setView({ stage: 'select', card: list[0], cardIdx: 0, dims, scores: {} });
      }
    }).catch(() => {
      setCards([]);
      setView({ stage: 'empty' });
    });
  }, []);

  const handleRestart = () => {
    setCards([]);
    setView({ stage: 'loading' });
    api.srs.next().then(list => {
      setCards(list);
      if (list.length === 0) {
        setView({ stage: 'empty' });
      } else {
        const dims = buildDims(list[0]);
        setView({ stage: 'select', card: list[0], cardIdx: 0, dims, scores: {} });
      }
    }).catch(() => {
      setCards([]);
      setView({ stage: 'empty' });
    });
  };

  const handleDimClick = (dimIdx: number) => {
    if (view.stage !== 'select') return;
    setView({
      stage: 'review',
      card: view.card,
      dim: view.dims[dimIdx],
      phase: 'preview',
      cardIdx: view.cardIdx,
      dimIdx,
      totalDims: view.dims.length,
      scores: view.scores,
    });
  };

  const handleBackToSelect = () => {
    if (view.stage !== 'review') return;
    setView({
      stage: 'select',
      card: view.card,
      cardIdx: view.cardIdx,
      dims: buildDims(view.card),
      scores: view.scores,
    });
  };

  const handleScore = (score: number) => {
    if (view.stage !== 'review' || !cards) return;
    const card = view.card;
    const key = `${card.id}-${view.dim.key}`;
    const newScores = { ...view.scores, [key]: score };
    api.srs.review(card.id, view.dim.key, score);

    // Go back to dimension select after scoring
    const dims = buildDims(card);
    setView({ stage: 'select', card, cardIdx: view.cardIdx, dims, scores: newScores });
  };

  // Advance to next card
  const goNextCard = () => {
    if (!cards) return;
    const nextIdx = view.stage === 'select' ? view.cardIdx + 1 : (view.stage === 'review' ? view.cardIdx + 1 : 0);
    if (nextIdx < cards.length) {
      const dims = buildDims(cards[nextIdx]);
      const prevScores = view.stage === 'select' ? view.scores : (view.stage === 'review' ? view.scores : {});
      setView({ stage: 'select', card: cards[nextIdx], cardIdx: nextIdx, dims, scores: prevScores });
    } else {
      const scores = view.stage === 'select' ? view.scores : (view.stage === 'review' ? view.scores : {});
      const correct = Object.values(scores).filter(s => s === 3).length;
      const total = Object.values(scores).length;
      setView({ stage: 'done', correct, total, onRestart: handleRestart });
    }
  };

  // ── Render ────────────────────────────────────────────────

  if (view.stage === 'loading') {
    return <div className="glass-card p-12 text-center"><p className="text-slate-400">加载中...</p></div>;
  }

  if (view.stage === 'empty') {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-xl text-slate-400">🎉 今日复习完成！</p>
        <p className="text-sm text-slate-500 mt-2">没有待复习的卡片</p>
      </div>
    );
  }

  if (view.stage === 'done') {
    return (
      <div className="glass-card p-8 text-center space-y-4">
        <p className="text-2xl">📊 本次复习统计</p>
        <p className="text-4xl font-bold text-purple-300">{view.correct}/{view.total}</p>
        <p className="text-sm text-slate-400">
          正确率 {view.total > 0 ? Math.round(view.correct / view.total * 100) : 0}%
        </p>
        <button onClick={view.onRestart}
          className="px-4 py-2 bg-purple-600/40 rounded-lg text-sm">
          重新开始
        </button>
      </div>
    );
  }

  if (view.stage === 'select') {
    const { card, dims, scores, cardIdx } = view;
    const totalCards = cards?.length ?? 1;
    const reviewed = dims.filter(d => scores[`${card.id}-${d.key}`] !== undefined).length;

    return (
      <div className="space-y-6" key={`select-${cardIdx}`}>
        {/* Card header */}
        <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-2xl p-5 border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-purple-300/70">{card.category}</div>
              <h2 className="text-xl font-bold text-white mt-1">{card.title}</h2>
              <div className="text-xs text-slate-400 mt-1">{card.id} · 卡片 {cardIdx + 1}/{totalCards}</div>
            </div>
            {reviewed === dims.length && dims.length > 0 && (
              <button onClick={goNextCard}
                className="px-4 py-2 bg-purple-600/40 hover:bg-purple-600/60 rounded-lg text-sm transition-colors">
                下一张 →
              </button>
            )}
          </div>
          {reviewed > 0 && (
            <div className="mt-3 text-xs text-slate-400">
              已复习 {reviewed}/{dims.length} 维度
            </div>
          )}
        </div>

        {/* Dimension grid */}
        <div className="grid grid-cols-3 gap-3">
          {dims.map((dim, i) => {
            const Icon = GRID_ICONS[dim.key] || BookOpen;
            const scoreKey = `${card.id}-${dim.key}`;
            const isDone = scores[scoreKey] !== undefined;
            const isPassed = scores[scoreKey] === 3;

            return (
              <button
                key={dim.key}
                onClick={() => handleDimClick(i)}
                className={`relative rounded-xl p-4 text-left border transition-all min-h-[100px] ${
                  isDone
                    ? isPassed
                      ? 'bg-green-900/20 border-green-500/30'
                      : 'bg-red-900/20 border-red-500/30'
                    : 'bg-slate-800/40 border-slate-700/30 hover:border-slate-600/50 hover:bg-slate-800/60'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${GRID_COLORS[dim.key]} flex items-center justify-center mb-2`}>
                  <span className="text-white"><Icon size={14} /></span>
                </div>
                <div className="text-xs font-medium text-slate-200">{dim.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{dim.type === 'cloze' ? '填空' : '选择'}</div>
                {isDone && (
                  <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${isPassed ? 'bg-green-400' : 'bg-red-400'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // view.stage === 'review'
  const { card, dim, phase, dimIdx, totalDims } = view;
  const isCloze = dim.type === 'cloze';

  return (
    <div className="space-y-4" key={`review-${view.cardIdx}-${dimIdx}-${phase}`}>
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button onClick={handleBackToSelect}
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft size={16} /> 返回选题
        </button>
        <span className="text-xs text-purple-400">
          {card.id} · {dim.label} · 维度 {dimIdx + 1}/{totalDims}
        </span>
      </div>

      {phase === 'preview' ? (
        <PreviewMode
          title={`${card.id} ${card.title}`}
          dimensionLabel={dim.label}
          question={dim.data.question}
          answer={dim.data.answer}
          options={dim.data.options}
          onComplete={() => setView({ ...view, phase: 'test' })}
        />
      ) : isCloze ? (
        <ClozeCard
          question={dim.data.question}
          answer={dim.data.answer}
          onScore={handleScore}
        />
      ) : (
        <ChoiceCard
          question={dim.data.question}
          options={dim.data.options || []}
          answer={dim.data.answer as number}
          onScore={handleScore}
        />
      )}
    </div>
  );
}
