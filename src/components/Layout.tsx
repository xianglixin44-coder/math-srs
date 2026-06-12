import { useState } from 'react';
import { BookOpen, Play, Upload, Menu, X, Database } from 'lucide-react';
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

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="glass px-4 py-2 flex items-center gap-3 sticky top-0 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
          title={sidebarOpen ? '关闭侧边栏' : '打开侧边栏'}
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <h1 className="text-lg font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
          数学SRS
        </h1>
        <div className="flex gap-1.5 ml-auto">
          {([
            ['browse', BookOpen, '浏览', false],
            ['review', Play, '复习', true],
            ['import', Upload, '导入', true],
            ['bank', Database, '题库', true],
          ] as const).map(([m, Icon, label, needsBackend]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              disabled={offline && needsBackend}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all
                ${mode === m
                  ? 'bg-purple-600/30 text-purple-200 border border-purple-500/30'
                  : offline && needsBackend
                    ? 'text-slate-600 cursor-not-allowed'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
      </nav>
      <div className="flex-1 flex">
        {/* Sidebar — fixed on desktop, overlay on mobile via toggle */}
        <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block shrink-0`}>
          <Sidebar activeCardId={activeCardId} onSelectCard={onSelectCard} />
        </div>
        <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
