import { useState, useEffect } from 'react';
import { ChevronLeft, BookOpen } from 'lucide-react';
import { renderMarkdown } from '../utils/markdown';

interface LectureSummary { id: string; title: string; textbook: string; partCount: number; }
interface LectureSection { key: string; label: string; content: string; }
interface LecturePart { label: string; sections: LectureSection[]; }
interface Lecture { id: string; title: string; textbook: string; parts: LecturePart[]; }

const CUE_WIDTH = 220;
const STYLES = {
  body: { background: '#F6F5F2', minHeight:'100vh', padding:'40px 20px', display:'flex', justifyContent:'center' },
  paper: { background:'#FFFFFF', width:'100%', maxWidth:900, boxShadow:'0 4px 20px rgba(0,0,0,0.05)', borderRadius:8, padding:40, boxSizing:'border-box' as const },
  header: { borderBottom:'2px dashed #BDC3C7', paddingBottom:20, marginBottom:30 },
  headerTitle: { fontSize:28, margin:0, marginBottom:10, color:'#2C3E50' },
  headerMeta: { fontSize:14, color:'#7F8C8D' },
  row: { display:'grid', gridTemplateColumns:`${CUE_WIDTH}px 1fr`, gap:30, position:'relative' as const },
  cue: { padding:'15px 20px 15px 0', textAlign:'right' as const, fontWeight:'bold', color:'#7F8C8D', fontSize:14, borderRight:'2px solid #E74C3C', boxSizing:'border-box' as const },
  note: { padding:'15px 0 15px 10px', fontSize:15, lineHeight:1.8, color:'#2C3E50', minWidth:0, wordBreak:'normal' as const, whiteSpace:'normal' },
  ol: { width:'100%', paddingLeft:20, margin:0 },
  ul: { width:'100%', paddingLeft:20, margin:0 },
  li: { display:'list-item', width:'100%', wordBreak:'normal', whiteSpace:'normal' },
  sectionTitle: { fontSize:18, fontWeight:'bold', color:'#2C3E50', marginTop:0, marginBottom:15, borderLeft:'4px solid #2C3E50', paddingLeft:10 },
  practiceCard: { background:'#F8FAFC', borderLeft:'4px solid #3498DB', borderRadius:6, padding:20, margin:'20px 0' },
  exercise: { background:'#FAFAFA', border:'1px solid #E2E8F0', borderRadius:6, padding:20, marginTop:30 },
  summary: { background:'#FCF8E3', borderTop:'2px solid #F0AD4E', borderRadius:4, padding:25, marginTop:40 },
};

function CornellHeader({ title, textbook }: { title: string; textbook: string }) {
  const today = new Date().toLocaleDateString('zh-CN', { year:'numeric', month:'2-digit', day:'2-digit' });
  return (
    <div style={STYLES.header}>
      <h1 style={STYLES.headerTitle}>{title}</h1>
      <div style={STYLES.headerMeta}>{textbook} | 生成日期: {today}</div>
    </div>
  );
}

function CornellRow({ cue, children }: { cue: string; children: React.ReactNode }) {
  return (
    <div style={STYLES.row}>
      <div style={STYLES.cue}>{cue}</div>
      <div className="cornell-note" style={STYLES.note}>{children}</div>
    </div>
  );
}

function CornellView({ lecture }: { lecture: Lecture }) {
  const p0 = lecture.parts[0] || { sections: [] };
  const p1 = lecture.parts[1] || { sections: [] };
  const p2 = lecture.parts.length > 2 ? lecture.parts[2] : null;

  const methodSec = p1.sections.find(s => s.key === 'method') || p0.sections.find(s => s.key === 'method');
  const essenceSec = p0.sections.find(s => s.key === 'essence');
  const connectionSec = p0.sections.find(s => s.key === 'connection');
  const summarySections = p2 ? p2.sections : [essenceSec, connectionSec].filter(Boolean);
  const cueSections = p0.sections.filter(s => !['method', 'essence', 'connection'].includes(s.key));
  const examplesSec = p1.sections.find(s => s.key === 'examples');
  const exercisesSec = p1.sections.find(s => s.key === 'exercises');

  return (
    <div style={STYLES.body}>
      <style>{`
        .cornell-note ol, .cornell-note ul { width:100%!important; padding-left:20px; margin:0; }
        .cornell-note li { display:list-item!important; width:100%!important; word-break:normal!important; white-space:normal!important; }
      `}</style>
      <div style={STYLES.paper}>
        <CornellHeader title={lecture.title} textbook={lecture.textbook} />

        {/* Q&A rows */}
        {cueSections.map(sec => (
          <CornellRow key={sec.key} cue={sec.label}>
            <div style={STYLES.sectionTitle}>{sec.label.replace(/^Q\d+:\s*/, '')}</div>
            {renderMarkdown(sec.content)}
          </CornellRow>
        ))}

        {/* Method + Examples in same row */}
        {methodSec && (
          <CornellRow cue={methodSec.label}>
            <div style={STYLES.sectionTitle}>{methodSec.label.replace(/^Q\d+:\s*/, '')}</div>
            {renderMarkdown(methodSec.content)}
            {examplesSec && (
              <div style={STYLES.practiceCard}>
                {renderMarkdown(examplesSec.content)}
              </div>
            )}
          </CornellRow>
        )}

        {/* Exercises full-width */}
        {exercisesSec && (
          <div style={STYLES.exercise}>
            <h3 style={{margin:0, marginBottom:15, color:'#2C3E50'}}>巩固习题</h3>
            {renderMarkdown(exercisesSec.content)}
          </div>
        )}

        {/* Summary */}
        {summarySections.length > 0 && (
          <div style={STYLES.summary}>
            {summarySections.map(sec => (
              <div key={sec.key} className="mb-3 last:mb-0">
                <h4 style={{fontSize:16, fontWeight:'bold', margin:0, marginBottom:8, color:'#2C3E50'}}>{sec.label}</h4>
                {renderMarkdown(sec.content)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

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

  const currentIdx = selected ? lectures.findIndex(l => l.id === selected.id) : -1;
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < lectures.length - 1;

  if (selected) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm" style={{color:'#5a5a7a', background:'none', border:'none', cursor:'pointer', padding:'4px 0'}}>
            <ChevronLeft size={16} /> 返回列表
          </button>
          <div className="flex gap-2">
            <button disabled={!hasPrev} onClick={() => hasPrev && openLecture(lectures[currentIdx-1].id)}
              className="text-xs px-3 py-1.5 rounded border disabled:opacity-30 hover:bg-gray-50"
              style={{borderColor:'#e2e8f0', color:'#5a5a7a', background:'white'}}>
              ← 上一节
            </button>
            <button disabled={!hasNext} onClick={() => hasNext && openLecture(lectures[currentIdx+1].id)}
              className="text-xs px-3 py-1.5 rounded border disabled:opacity-30 hover:bg-gray-50"
              style={{borderColor:'#e2e8f0', color:'#5a5a7a', background:'white'}}>
              下一节 →
            </button>
          </div>
        </div>
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
