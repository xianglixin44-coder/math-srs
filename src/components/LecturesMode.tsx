import { useState, useEffect } from 'react';
import { ChevronLeft, BookOpen } from 'lucide-react';
import { renderMarkdown } from '../utils/markdown';

interface LectureSummary {
  id: string;
  title: string;
  textbook: string;
  partCount: number;
}

interface LectureSection {
  key: string;
  label: string;
  content: string;
}

interface LecturePart {
  label: string;
  sections: LectureSection[];
}

interface Lecture {
  id: string;
  title: string;
  textbook: string;
  parts: LecturePart[];
}

export default function LecturesMode() {
  const [lectures, setLectures] = useState<LectureSummary[]>([]);
  const [selected, setSelected] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/lectures')
      .then(r => r.json())
      .then(setLectures)
      .catch(() => {});
  }, []);

  const openLecture = async (id: string) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/lectures/${id}`);
      if (r.ok) setSelected(await r.json());
    } catch {}
    setLoading(false);
  };

  if (selected) {
    return (
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-1 text-sm mb-4 hover:opacity-70"
          style={{color: '#5a5a7a'}}
        >
          <ChevronLeft size={16} /> 返回列表
        </button>
        <h1 className="text-2xl font-bold mb-1" style={{color:'#1a1a2e'}}>{selected.title}</h1>
        <p className="text-sm mb-6" style={{color:'#999'}}>{selected.textbook}</p>
        {selected.parts.map((part, pi) => (
          <div key={pi} className="mb-8">
            <h2 className="text-lg font-bold mb-4 px-3 py-1.5 rounded" style={{background:'#1a1a2e', color:'#fff'}}>
              {pi === 0 ? '第一部分：' : '第二部分：'}{part.label}
            </h2>
            {part.sections.map((sec) => (
              <div key={sec.key} className="mb-6 pl-2">
                <h3 className="text-base font-bold mb-2" style={{color:'#c0392b'}}>
                  {sec.label}
                </h3>
                <div className="text-sm" style={{lineHeight:1.8, color:'#333'}}>
                  {renderMarkdown(sec.content)}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen size={24} color="#c0392b" />
        <h1 className="text-2xl font-bold" style={{color:'#1a1a2e'}}>教材讲解</h1>
      </div>
      {loading && <p className="text-sm" style={{color:'#999'}}>加载中...</p>}
      <div className="grid gap-3">
        {lectures.map((lec) => (
          <button
            key={lec.id}
            onClick={() => openLecture(lec.id)}
            className="text-left p-4 rounded-lg border transition-shadow hover:shadow-md"
            style={{background:'#fff', borderColor:'#e8e4de'}}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono mr-3 px-2 py-0.5 rounded" style={{background:'#f5f3ef', color:'#5a5a7a'}}>
                  {lec.id}
                </span>
                <span className="font-semibold" style={{color:'#1a1a2e'}}>{lec.title}</span>
              </div>
              <span className="text-xs" style={{color:'#999'}}>{lec.partCount} 部分</span>
            </div>
            {lec.textbook && (
              <p className="text-xs mt-1.5 ml-1" style={{color:'#999'}}>{lec.textbook}</p>
            )}
          </button>
        ))}
      </div>
      {lectures.length === 0 && !loading && (
        <p className="text-sm text-center py-12" style={{color:'#999'}}>暂无讲解内容</p>
      )}
    </div>
  );
}
