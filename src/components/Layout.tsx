import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';

interface Props {
  mode: 'browse' | 'review' | 'import' | 'bank';
  setMode: (m: 'browse' | 'review' | 'import' | 'bank') => void;
  online: boolean | null;
  activeCardId: string | null;
  onSelectCard: (id: string) => void;
}

export default function Layout({ mode, setMode, online, activeCardId, onSelectCard, children }: Props & { children: React.ReactNode }) {
  const offline = online === false;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { key: 'browse', label: '📖 浏览', needsBackend: false },
    { key: 'review', label: '🎯 复习', needsBackend: true },
    { key: 'bank',   label: '📚 题库', needsBackend: true },
    { key: 'import', label: '📥 导入', needsBackend: true },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col" style={{background:'#f5f3ef'}}>
      {/* ── 顶部导航栏 ── */}
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
        <span className="text-[10px] px-2 py-0.5 rounded-full text-white/70 bg-white/15">
          {online === null ? '🔗 检测中' : online ? '🟢 已连接' : '🔴 离线'}
        </span>
      </header>

      <div className="flex-1 flex">
        {/* ── 侧边栏 ── */}
        <aside
          className={`${sidebarOpen ? 'block' : 'hidden'} md:block shrink-0 overflow-y-auto`}
          style={{
            width: 210, minWidth: 210,
            background: '#fff',
            borderRight: '1px solid #ddd',
            height: 'calc(100vh - 48px)', position: 'sticky', top: 48,
          }}
        >
          {navItems.map(item => {
            const disabled = offline && item.needsBackend;
            return (
              <div
                key={item.key}
                onClick={() => { if (!disabled) { setMode(item.key as any); setSidebarOpen(false); }}}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 18px', cursor: disabled ? 'not-allowed' : 'pointer',
                  fontSize: 13, borderLeft: '3px solid transparent',
                  color: disabled ? '#bbb' : mode === item.key ? '#1a1a2e' : '#5a5a7a',
                  background: mode === item.key ? '#e8e4de' : 'transparent',
                  fontWeight: mode === item.key ? 600 : 400,
                  borderLeftColor: mode === item.key ? '#c0392b' : 'transparent',
                }}
              >
                {item.label}
              </div>
            );
          })}

          <div style={{borderTop:'1px solid #ddd', marginTop:8, paddingTop:4}}>
            <div style={{fontSize:12, color:'#5a5a7a', padding:'10px 18px 6px', fontWeight:600}}>
              📐 课本目录
            </div>
            <Sidebar activeCardId={activeCardId} onSelectCard={(id) => { onSelectCard(id); setSidebarOpen(false); }} />
          </div>
        </aside>

        {/* 遮罩层（移动端） */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── 主内容区 ── */}
        <main className="flex-1 p-6" style={{maxWidth:1000, margin:'0 auto', width:'100%'}}>
          {children}
        </main>
      </div>
    </div>
  );
}
