import { useState, useEffect } from 'react';
import { api } from '../api/client';
import type { Card } from '../types/card';
import { DIM_ORDER, DIM_LABELS } from '../types/card';
import PreviewMode from './PreviewMode';
import ClozeCard from './ClozeCard';
import ChoiceCard from './ChoiceCard';

export default function ReviewMode() {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [cardIdx, setCardIdx] = useState(0);
  const [dimIdx, setDimIdx] = useState(0);
  const [phase, setPhase] = useState<'preview' | 'test'>('preview');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.srs.next().then(setCards).catch(() => setCards([]));
  }, []);

  if (cards === null) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-slate-400">加载中...</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-xl text-slate-400">🎉 今日复习完成！</p>
        <p className="text-sm text-slate-500 mt-2">没有待复习的卡片</p>
      </div>
    );
  }

  if (done) {
    const correct = Object.values(scores).filter(s => s === 3).length;
    const total = Object.values(scores).length;
    return (
      <div className="glass-card p-8 text-center space-y-4">
        <p className="text-2xl">📊 本次复习统计</p>
        <p className="text-4xl font-bold text-purple-300">{correct}/{total}</p>
        <p className="text-sm text-slate-400">正确率 {total > 0 ? Math.round(correct / total * 100) : 0}%</p>
        <button onClick={() => { setCards([]); setDone(false); setCardIdx(0); setDimIdx(0); setScores({}); }}
          className="px-4 py-2 bg-purple-600/40 rounded-lg text-sm">
          重新开始
        </button>
      </div>
    );
  }

  const card = cards[cardIdx];
  const dims: { key: string; label: string; data: any }[] = [];

  DIM_ORDER.forEach(dim => {
    const clozeVal = (card.dimensions.cloze as any)?.[dim];
    const choiceVal = (card.dimensions.choice as any)?.[dim];
    if (clozeVal) dims.push({ key: dim, label: `${DIM_LABELS[dim]} (填空)`, data: clozeVal });
    if (choiceVal) dims.push({ key: dim, label: `${DIM_LABELS[dim]} (选择)`, data: choiceVal });
  });

  if (dimIdx >= dims.length) {
    // Card done — move to next card
    if (cardIdx + 1 < cards.length) {
      setCardIdx(cardIdx + 1);
      setDimIdx(0);
      setPhase('preview');
    } else {
      setDone(true);
    }
    return null;
  }

  const dim = dims[dimIdx];
  const isCloze = Array.isArray(dim.data.answer);

  const handleScore = (score: number) => {
    const key = `${card.id}-${dim.key}`;
    setScores(prev => ({ ...prev, [key]: score }));
    api.srs.review(card.id, dim.key, score);

    setTimeout(() => {
      setDimIdx(dimIdx + 1);
    }, 800);
  };

  if (phase === 'preview') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">
            {card.id} {card.title}
          </span>
          <span className="text-xs text-purple-400">
            维度 {dimIdx + 1}/{dims.length} · {dim.label}
          </span>
        </div>
        <PreviewMode
          title={`${card.id} ${card.title}`}
          dimensionLabel={dim.label}
          question={dim.data.question}
          answer={dim.data.answer}
          options={dim.data.options}
          onComplete={() => setPhase('test')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">
          {card.id} {card.title}
        </span>
        <span className="text-xs text-purple-400">
          维度 {dimIdx + 1}/{dims.length} · {dim.label}
        </span>
      </div>
      {isCloze ? (
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
