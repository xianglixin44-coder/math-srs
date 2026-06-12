import { useState, useEffect } from 'react';
import { api } from '../api/client';

interface CardItem {
  id: string;
  title: string;
  category: string;
}

interface SRSItem {
  card_id: string;
  ease_factor: number;
  interval: number;
  due_date: string;
  reps: number;
  last_review: string | null;
}

export default function BankMode() {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [srsState, setSrsState] = useState<Record<string, SRSItem>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.cards.list(),
      api.srs.state(),
    ]).then(([cardList, srsList]) => {
      setCards(cardList);
      const stateMap: Record<string, SRSItem> = {};
      for (const s of srsList) {
        stateMap[s.card_id] = s;
      }
      setSrsState(stateMap);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="glass-card p-12 text-center"><p className="text-slate-400">加载中...</p></div>;
  }

  const totalCards = cards.length;
  const dueCards = cards.filter(c => {
    const s = srsState[c.id];
    if (!s) return true; // never reviewed → due
    return new Date(s.due_date) <= new Date();
  }).length;

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-purple-300">{totalCards}</div>
          <div className="text-xs text-slate-400 mt-1">总卡片数</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-amber-300">{dueCards}</div>
          <div className="text-xs text-slate-400 mt-1">待复习</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-green-300">{totalCards - dueCards}</div>
          <div className="text-xs text-slate-400 mt-1">已掌握</div>
        </div>
      </div>

      {/* Card table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50 text-left">
                <th className="px-4 py-3 text-xs text-slate-500 font-medium">ID</th>
                <th className="px-4 py-3 text-xs text-slate-500 font-medium">标题</th>
                <th className="px-4 py-3 text-xs text-slate-500 font-medium">分类</th>
                <th className="px-4 py-3 text-xs text-slate-500 font-medium">复习次数</th>
                <th className="px-4 py-3 text-xs text-slate-500 font-medium">间隔(天)</th>
                <th className="px-4 py-3 text-xs text-slate-500 font-medium">难度因子</th>
                <th className="px-4 py-3 text-xs text-slate-500 font-medium">到期日</th>
                <th className="px-4 py-3 text-xs text-slate-500 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              {cards.map(card => {
                const s = srsState[card.id];
                const isDue = !s || new Date(s.due_date) <= new Date();
                return (
                  <tr key={card.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-2.5 text-purple-300 font-mono text-xs">{card.id}</td>
                    <td className="px-4 py-2.5 text-slate-200">{card.title}</td>
                    <td className="px-4 py-2.5 text-slate-400 text-xs">{card.category}</td>
                    <td className="px-4 py-2.5 text-slate-300 font-mono text-xs">{s?.reps ?? 0}</td>
                    <td className="px-4 py-2.5 text-slate-300 font-mono text-xs">{s?.interval ?? '-'}</td>
                    <td className="px-4 py-2.5 text-slate-300 font-mono text-xs">{s?.ease_factor?.toFixed(1) ?? '-'}</td>
                    <td className="px-4 py-2.5 text-slate-400 text-xs">{s?.due_date?.slice(0, 10) ?? '-'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        !s ? 'bg-slate-700/50 text-slate-400' :
                        isDue ? 'bg-amber-600/20 text-amber-300' :
                        'bg-green-600/20 text-green-300'
                      }`}>
                        {!s ? '新卡片' : isDue ? '待复习' : '已掌握'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
