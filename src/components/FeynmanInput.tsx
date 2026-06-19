import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface Props { cardId: string; }

export default function FeynmanInput({ cardId }: Props) {
  const [answer, setAnswer] = useState('');
  const [saved, setSaved] = useState(false);
  const [showRef, setShowRef] = useState(false);
  const [rating, setRating] = useState<number | null>(null);

  const answerRef = useRef(answer);
  const ratingRef = useRef(rating);
  answerRef.current = answer;
  ratingRef.current = rating;

  // Load from SQLite on mount / card change
  useEffect(() => {
    fetch(`/api/feynman/${cardId}`)
      .then(r => r.json())
      .then(data => {
        setAnswer(data.answer || '');
        setRating(data.rating ?? null);
      })
      .catch(() => {});
  }, [cardId]);

  const persist = useCallback(() => {
    fetch('/api/feynman/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        card_id: cardId,
        answer: answerRef.current,
        rating: ratingRef.current,
      }),
    }).then(() => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }, [cardId]);

  const handleClear = () => {
    setAnswer('');
    setRating(null);
    setShowRef(false);
    persist();
  };

  return (
    <div className="glass-card p-6 space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
          <MessageCircle size={16} /> 你的费曼解释
        </h4>
        <div className="flex items-center gap-2">
          {rating !== null && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              rating === 3 ? 'bg-green-500/20 text-green-300' : rating === 2 ? 'bg-blue-500/20 text-blue-300' :
              rating === 1 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-500/20 text-slate-400'
            }`}>{rating === 3 ? '★ 完美' : rating === 2 ? '★ 良好' : rating === 1 ? '★ 部分' : '需改进'}</span>
          )}
          <span className="text-xs text-slate-500">{answer ? `${answer.length} 字` : '未填写'}</span>
        </div>
      </div>

      <textarea value={answer} onChange={(e) => setAnswer(e.target.value)}
        placeholder="用最简单的话写下你的理解..."
        className="w-full h-48 bg-slate-900/80 border border-slate-700/50 rounded-xl p-4 text-sm text-slate-200 placeholder:text-slate-600 resize-y focus:outline-none focus:border-purple-500/50 transition-colors"
      />

      <div className="flex gap-2">
        <button onClick={persist}
          className="px-4 py-2 bg-purple-600/50 hover:bg-purple-600/70 border border-purple-500/30 rounded-lg text-sm text-purple-200 transition-colors"
        >{saved ? '✓ 已保存' : '保存'}</button>
        <button onClick={() => setShowRef(!showRef)}
          className={`px-4 py-2 border rounded-lg text-sm transition-colors flex items-center gap-1 ${
            showRef ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-slate-800/50 hover:bg-slate-700/50 border-slate-700/30 text-slate-400'
          }`}
        ><Sparkles size={14} />{showRef ? '隐藏参考' : '对照参考'}{showRef ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
        <button onClick={handleClear}
          className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/30 rounded-lg text-sm text-slate-400 transition-colors"
        >清除</button>
      </div>

      {showRef && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-2">
          <h5 className="text-xs font-semibold text-amber-300 flex items-center gap-1"><Sparkles size={12} /> 参考答案要点</h5>
          <div className="text-sm text-slate-300 space-y-1.5">
            <p><strong>1. 集合</strong>就是把一堆有共同特点的东西放在一起。比如「铅笔盒里所有的笔」。</p>
            <p><strong>2. 确定性</strong>：随便拿一个东西，能明确说它是或不是。「高个子的人」不能构成集合——多高算高？</p>
            <p><strong>3. 互异性</strong>：集合里不能重复。{`{1,2,2,3}`} 不合法，应写 {`{1,2,3}`}。</p>
            <p><strong>4. ∈ 是元素↔集合</strong>：2∈{`{1,2,3}`}。<strong>⊆ 是集合↔集合</strong>：{`{1,2}`}⊆{`{1,2,3}`}。不能混用！</p>
          </div>
        </div>
      )}

      <div className="border-t border-slate-700/30 pt-4">
        <p className="text-xs text-slate-400 mb-2">对照参考后，给自己打分：</p>
        <div className="flex gap-2">
          {[
            { v: 0, label: '完全跑偏', cls: 'border-slate-600 text-slate-500 hover:border-slate-500' },
            { v: 1, label: '部分覆盖', cls: 'border-amber-500/40 text-amber-400 hover:border-amber-400' },
            { v: 2, label: '基本覆盖', cls: 'border-blue-500/40 text-blue-400 hover:border-blue-400' },
            { v: 3, label: '完美表达', cls: 'border-green-500/40 text-green-400 hover:border-green-400' },
          ].map(({ v, label, cls }) => (
            <button key={v}
              onClick={() => { setRating(v); ratingRef.current = v; persist(); }}
              className={`flex-1 py-2 border rounded-lg text-xs transition-colors ${
                rating === v
                  ? v === 3 ? 'bg-green-500/20 border-green-400 text-green-300' :
                    v === 2 ? 'bg-blue-500/20 border-blue-400 text-blue-300' :
                    v === 1 ? 'bg-amber-500/20 border-amber-400 text-amber-300' :
                    'bg-slate-600/20 border-slate-500 text-slate-300'
                  : cls
              }`}
            >{v === 3 ? '⭐' : v === 2 ? '✓' : v === 1 ? '△' : '✗'} {label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
