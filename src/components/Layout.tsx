import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';

type Mode = 'browse' | 'review' | 'import' | 'bank' | 'books' | 'lectures' | 'exercises' | 'system';

interface Props {
  mode: Mode;
  setMode: (m: Mode) => void;
  onLectureClick: () => void;
  onBrowseClick: () => void;
  online: boolean | null;
  activeCardId: string | null;
  onSelectCard: (id: string) => void;
}

function useDateTime() {
  const [dt, setDt] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setDt(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const date = dt.toLocaleDateString('zh-CN', { year:'numeric', month:'2-digit', day:'2-digit', weekday:'short' });
  const time = dt.toLocaleTimeString('zh-CN', { hour:'2-digit', minute:'2-digit' });
  return `${date} ${time}`;
}

export default function Layout({ mode, setMode, onLectureClick, onBrowseClick, online, activeCardId, onSelectCard, children }: Props & { children: React.ReactNode }) {
  const offline = online === false;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dateTime = useDateTime();

  const mainNav = [
    { key: 'browse', label: '📖 浏览', needsBackend: false },
    { key: 'review', label: '🎯 复习', needsBackend: true },
  ] as const;

  const toolNav = [
    { key: 'bank',   label: '📚 题库', needsBackend: true },
    { key: 'import', label: '📥 导入', needsBackend: true },
    { key: 'books',  label: '📖 教材', needsBackend: true },
    { key: 'lectures', label: '🎓 讲解', needsBackend: false },
    { key: 'exercises', label: '✏️ 习题', needsBackend: true },
    { key: 'system', label: '🗺️ 体系', needsBackend: false },
  ] as const;

  const renderNav = (items: ReadonlyArray<{ key: Mode; label: string; needsBackend: boolean }>) =>
    items.map(item => {
      const disabled = offline && item.needsBackend;
      return (
        <div
          key={item.key}
          onClick={() => { if (!disabled) { (item.key === 'lectures' ? onLectureClick : item.key === 'browse' ? onBrowseClick : () => setMode(item.key))(); setSidebarOpen(false); }}}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: 16, borderLeft: '3px solid transparent',
            color: disabled ? '#bbb' : mode === item.key ? '#1a1a2e' : '#5a5a7a',
            background: mode === item.key ? '#e8e4de' : 'transparent',
            fontWeight: mode === item.key ? 600 : 400,
            borderLeftColor: mode === item.key ? '#c0392b' : 'transparent',
          }}
        >
          {item.label}
        </div>
      );
    });

  return (
    <div className="min-h-screen flex flex-col" style={{background:'#f5f3ef'}}>
      <header
        className="sticky top-0 z-50 flex items-center gap-3 px-4 py-2.5 shadow-sm"
        style={{background:'linear-gradient(135deg, #1a1a2e 0%, #2c3e50 100%)'}}
      >
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden p-1 rounded hover:bg-white/10 transition-colors"
        >
          {sidebarOpen ? <X size={20} color="white" /> : <Menu size={20} color="white" />}
        </button>
        <h1 className="text-base font-bold text-white">📐 数学SRS</h1>
        <span className="text-xs px-2 py-0.5 rounded-full text-white/70 bg-white/15">
          {online === null ? '🔗 检测中' : online ? '🟢 已连接' : '🔴 离线'}
        </span>

        <div className="ml-auto text-white/60 text-xs">
          {dateTime}
        </div>
      </header>

      <div className="flex-1 flex">
        <aside
          className={`${sidebarOpen ? 'block' : 'hidden'} md:block shrink-0 overflow-y-auto`}
          style={{
            width: 210, minWidth: 210,
            background: '#fff',
            borderRight: '1px solid #ddd',
            height: 'calc(100vh - 48px)', position: 'sticky', top: 48,
          }}
        >
          {renderNav(mainNav)}

          <div style={{marginTop:8}}>
            <div style={{fontSize:14, color:'#5a5a7a', padding:'10px 18px 6px', fontWeight:600}}>
              🔧 工具
            </div>
            {renderNav(toolNav)}
          </div>

          <div style={{borderTop:'1px solid #ddd', marginTop:8, paddingTop:4}}>
            <Sidebar activeCardId={activeCardId} onSelectCard={(id) => { onSelectCard(id); setSidebarOpen(false); }} />
          </div>
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <main className="flex-1 p-6" style={{maxWidth:1000, margin:'0 auto', width:'100%'}}>
          {children}
        </main>
      </div>
    </div>
  );
}
