import { useState, useEffect } from 'react';
import { ChevronLeft, Dumbbell } from 'lucide-react';
import { renderMarkdown } from '../utils/markdown';

interface ExerciseItem { lectureId: string; lectureTitle: string; content: string; }

export default function ExercisesMode() {
  const [items, setItems] = useState<ExerciseItem[]>([]);
  const [selected, setSelected] = useState<ExerciseItem | null>(null);

  useEffect(() => {
    fetch('/api/exercises').then(r => r.json()).then(setItems).catch(() => {});
  }, []);

  if (selected) {
    return (
      <div>
        <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm mb-4 hover:opacity-70" style={{color:'#5a5a7a', background:'none', border:'none', cursor:'pointer'}}>
          <ChevronLeft size={16} /> 返回列表
        </button>
        <h2 className="text-xl font-bold mb-4" style={{color:'#1a1a2e'}}>{selected.lectureTitle}</h2>
        <div className="text-sm" style={{lineHeight:1.8, color:'#333'}}>
          {renderMarkdown(selected.content)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Dumbbell size={24} color="#c0392b" />
        <h1 className="text-2xl font-bold" style={{color:'#1a1a2e'}}>📝 习题</h1>
      </div>
      <div className="grid gap-3">
        {items.map(item => (
          <button key={item.lectureId} onClick={() => setSelected(item)}
            className="text-left p-4 rounded-lg border transition-shadow hover:shadow-md"
            style={{background:'#fff', borderColor:'#e8e4de'}}>
            <div className="flex items-center justify-between">
              <span className="font-semibold" style={{color:'#1a1a2e'}}>{item.lectureTitle}</span>
              <span className="text-xs px-2 py-0.5 rounded" style={{background:'#f5f3ef', color:'#5a5a7a'}}>{item.lectureId}</span>
            </div>
          </button>
        ))}
      </div>
      {items.length === 0 && <p className="text-sm text-center py-12" style={{color:'#999'}}>暂无习题</p>}
    </div>
  );
}
