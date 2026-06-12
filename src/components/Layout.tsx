import { BookOpen, Play, Upload } from 'lucide-react';

interface Props {
  mode: 'browse' | 'review' | 'import';
  setMode: (m: 'browse' | 'review' | 'import') => void;
  online: boolean | null;
}

export default function Layout({ mode, setMode, online, children }: Props & { children: React.ReactNode }) {
  const offline = online === false;
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="glass px-6 py-3 flex items-center gap-6 sticky top-0 z-50">
        <h1 className="text-lg font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
          数学SRS
        </h1>
        <div className="flex gap-2 ml-auto">
          {([
            ['browse', BookOpen, '浏览', false],
            ['review', Play, '复习', true],
            ['import', Upload, '导入', true],
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
      <main className="flex-1 max-w-4xl mx-auto w-full p-6">
        {children}
      </main>
    </div>
  );
}
