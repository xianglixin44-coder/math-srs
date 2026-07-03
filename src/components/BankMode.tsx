import { useState, useEffect } from 'react';
import { api, type SRSState } from '../api/client';
import type { Card } from '../types/card';

export default function BankMode() {
  const [cards, setCards] = useState<Card[]>([]);
  const [srsState, setSrsState] = useState<Record<string, SRSState>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.cards.list(),
      api.srs.state(),
    ]).then(([cardList, srsList]) => {
      setCards(cardList);
      const stateMap: Record<string, SRSState> = {};
      for (const s of srsList) {
        stateMap[s.card_id] = s;
      }
      setSrsState(stateMap);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="glass-card p-12 text-center"><p className="text-gray-600">加载中...</p></div>;
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
          <div className="text-2xl font-bold text-blue-700">{totalCards}</div>
          <div className="text-sm text-gray-600 mt-1">总卡片数</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-amber-700">{dueCards}</div>
          <div className="text-sm text-gray-600 mt-1">待复习</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{totalCards - dueCards}</div>
          <div className="text-sm text-gray-600 mt-1">已掌握</div>
        </div>
      </div>

      {/* Card table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="px-4 py-3 text-sm text-gray-500 font-medium">ID</th>
                <th className="px-4 py-3 text-sm text-gray-500 font-medium">标题</th>
                <th className="px-4 py-3 text-sm text-gray-500 font-medium">分类</th>
                <th className="px-4 py-3 text-sm text-gray-500 font-medium">复习次数</th>
                <th className="px-4 py-3 text-sm text-gray-500 font-medium">间隔(天)</th>
                <th className="px-4 py-3 text-sm text-gray-500 font-medium">难度因子</th>
                <th className="px-4 py-3 text-sm text-gray-500 font-medium">到期日</th>
                <th className="px-4 py-3 text-sm text-gray-500 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              {cards.map(card => {
                const s = srsState[card.id];
                const isDue = !s || new Date(s.due_date) <= new Date();
                return (
                  <tr key={card.id} className="border-b border-gray-100 hover:bg-white/30 transition-colors">
                    <td className="px-4 py-2.5 text-blue-700 font-mono text-sm">{card.id}</td>
                    <td className="px-4 py-2.5 text-gray-800">{card.title}</td>
                    <td className="px-4 py-2.5 text-gray-600 text-sm">{card.category}</td>
                    <td className="px-4 py-2.5 text-gray-700 font-mono text-sm">{s?.reps ?? 0}</td>
                    <td className="px-4 py-2.5 text-gray-700 font-mono text-sm">{s?.interval ?? '-'}</td>
                    <td className="px-4 py-2.5 text-gray-700 font-mono text-sm">{s?.ease_factor?.toFixed(1) ?? '-'}</td>
                    <td className="px-4 py-2.5 text-gray-600 text-sm">{s?.due_date?.slice(0, 10) ?? '-'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-sm px-2 py-0.5 rounded-full ${
                        !s ? 'bg-gray-100/50 text-gray-600' :
                        isDue ? 'bg-amber-600/20 text-amber-700' :
                        'bg-green-600/20 text-green-700'
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
