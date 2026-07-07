import { useState, useEffect } from 'react';
import { ChevronLeft, BookOpen } from 'lucide-react';
import { renderMarkdown } from '../utils/markdown';

interface LectureSummary { id: string; title: string; textbook: string; partCount: number; }
interface LectureSection { key: string; label: string; content: string; }
interface LecturePart { label: string; sections: LectureSection[]; }
interface Lecture { id: string; title: string; textbook: string; parts: LecturePart[]; }

/** Cornell Header */
function CornellHeader({ title, textbook }: { title: string; textbook: string }) {
  const today = new Date().toLocaleDateString('zh-CN', { year:'numeric', month:'2-digit', day:'2-digit' });
  return (
    <header className="mb-6" style={{borderBottom:'3px double #d1d5db', paddingBottom:12}}>
      <h1 className="text-2xl font-bold mb-1" style={{color:'#1a1a2e'}}>{title}</h1>
      <div className="flex items-center gap-4 text-xs" style={{color:'#9ca3af'}}>
        <span>{textbook}</span>
        <span>生成日期: {today}</span>
      </div>
    </header>
  );
}

/** Left column - Cue Column (25%) */
function CueColumn({ cues }: { cues: { label: string; key: string }[] }) {
  return (
    <div className="pr-4 text-right" style={{width:'25%', minWidth:120, flexShrink:0}}>
      {cues.map((cue, i) => (
        <div key={cue.key} className="mb-2" style={{
          fontSize:13, color:'#6b7280', lineHeight:1.5,
          paddingTop: i === 0 ? 0 : 8,
        }}>
          {cue.label}
        </div>
      ))}
    </div>
  );
}

/** Right column - Notes Column (75%) */
function NotesColumn({ children }: { children: React.ReactNode }) {
  return (
    <div style={{width:'75%', flexShrink:0, paddingLeft:20,
      borderLeft:'2px solid #f87171'}}>
      {children}
    </div>
  );
}

/** Bottom Summary */
function CornellFooter({ sections }: { sections: LectureSection[] }) {
  if (!sections.length) return null;
  return (
    <footer className="mt-8 p-5 rounded-lg" style={{background:'#fefce8', border:'1px solid #fde68a'}}>
      {sections.map(sec => (
        <div key={sec.key} className="mb-3 last:mb-0">
          <h4 className="text-sm font-bold mb-1" style={{color:'#c0392b'}}>{sec.label}</h4>
          <div className="text-sm" style={{lineHeight:1.8, color:'#333'}}>
            {renderMarkdown(sec.content)}
          </div>
        </div>
      ))}
    </footer>
  );
}

/** Main Cornell layout for a lecture */
function CornellView({ lecture }: { lecture: Lecture }) {
  // Part 0: cue/notes sections (Q&A or knowledge notes)
  // Part 1: examples + exercises
  // Part 2 (if exists): bottom summary (essence + connection)

  const part0 = lecture.parts[0] || { sections: [] };
  const part1 = lecture.parts[1] || { sections: [] };
  const part2 = lecture.parts.length > 2 ? lecture.parts[2] : null;

  // Separate method from other sections in part0
  const methodSec = part0.sections.find(s => s.key === 'method');
  const cueSections = part0.sections.filter(s => s.key !== 'method');

  // Example/exercise sections from part 1
  const examplesSec = part1.sections.find(s => s.key === 'examples');
  const exercisesSec = part1.sections.find(s => s.key === 'exercises');

  return (
    <div className="max-w-4xl mx-auto">
      <CornellHeader title={lecture.title} textbook={lecture.textbook} />

      {/* Main area: left cues + right notes */}
      <div className="flex" style={{marginBottom:24}}>
        <CueColumn cues={cueSections.map(s => ({ label: s.label, key: s.key }))} />
        <NotesColumn>
          {cueSections.map(sec => (
            <div key={sec.key} className="mb-5">
              <div className="text-sm" style={{lineHeight:1.8, color:'#333'}}>
                {renderMarkdown(sec.content)}
              </div>
            </div>
          ))}
        </NotesColumn>
      </div>

      {/* Method section + Examples + Exercises in card background */}
      <div className="rounded-lg p-5 mb-6" style={{background:'#f8fafc', border:'1px solid #e2e8f0'}}>
        {methodSec && (
          <div className="mb-4">
            <h3 className="text-base font-bold mb-2" style={{color:'#c0392b'}}>{methodSec.label}</h3>
            <div className="text-sm" style={{lineHeight:1.8, color:'#333'}}>
              {renderMarkdown(methodSec.content)}
            </div>
          </div>
        )}
        {examplesSec && (
          <div className="mb-4">
            <h3 className="text-base font-bold mb-2" style={{color:'#c0392b'}}>{examplesSec.label}</h3>
            <div className="text-sm" style={{lineHeight:1.8, color:'#333'}}>
              {renderMarkdown(examplesSec.content)}
            </div>
          </div>
        )}
        {exercisesSec && (
          <div>
            <h3 className="text-base font-bold mb-2" style={{color:'#c0392b'}}>{exercisesSec.label}</h3>
            <div className="text-sm" style={{lineHeight:1.8, color:'#333'}}>
              {renderMarkdown(exercisesSec.content)}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Summary */}
      {part2 && <CornellFooter sections={part2.sections} />}
    </div>
  );
}

/** Main LecturesMode component */
export default function LecturesMode() {
  const [lectures, setLectures] = useState<LectureSummary[]>([]);
  const [selected, setSelected] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/lectures').then(r => r.json()).then(setLectures).catch(() => {});
  }, []);

  const openLecture = async (id: string) => {
    setLoading(true);
    try { const r = await fetch(`/api/lectures/${id}`); if (r.ok) setSelected(await r.json()); } catch {}
    setLoading(false);
  };

  if (selected) {
    return (
      <div>
        <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm mb-4 hover:opacity-70" style={{color:'#5a5a7a'}}>
          <ChevronLeft size={16} /> 返回列表
        </button>
        <CornellView lecture={selected} />
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
        {lectures.map(lec => (
          <button key={lec.id} onClick={() => openLecture(lec.id)}
            className="text-left p-4 rounded-lg border transition-shadow hover:shadow-md"
            style={{background:'#fff', borderColor:'#e8e4de'}}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono mr-3 px-2 py-0.5 rounded" style={{background:'#f5f3ef', color:'#5a5a7a'}}>{lec.id}</span>
                <span className="font-semibold" style={{color:'#1a1a2e'}}>{lec.title}</span>
              </div>
              <span className="text-xs" style={{color:'#999'}}>{lec.partCount} 部分</span>
            </div>
            {lec.textbook && <p className="text-xs mt-1.5 ml-1" style={{color:'#999'}}>{lec.textbook}</p>}
          </button>
        ))}
      </div>
      {lectures.length === 0 && !loading && <p className="text-sm text-center py-12" style={{color:'#999'}}>暂无讲解内容</p>}
    </div>
  );
}
