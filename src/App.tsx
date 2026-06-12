import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import BrowseMode from './components/BrowseMode';
import ReviewMode from './components/ReviewMode';
import ImportExportPanel from './components/ImportExportPanel';
import { checkHealth } from './api/client';

export default function App() {
  const [mode, setMode] = useState<'browse' | 'review' | 'import'>('browse');
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    checkHealth().then(setOnline);
    const timer = setInterval(() => checkHealth().then(setOnline), 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {online === false && (
        <div className="bg-amber-900/50 border-b border-amber-600/40 px-6 py-2 text-center text-sm text-amber-200">
          ⚠️ 无法连接到后端服务（{window.location.hostname}:3000）— 仅浏览模式可用
        </div>
      )}
      <Layout mode={mode} setMode={setMode} online={online}>
        {mode === 'browse' && <BrowseMode />}
        {mode === 'review' && (online !== false
          ? <ReviewMode />
          : <div className="glass-card p-12 text-center text-slate-400">需要后端服务才能复习</div>
        )}
        {mode === 'import' && (online !== false
          ? <ImportExportPanel />
          : <div className="glass-card p-12 text-center text-slate-400">需要后端服务才能导入导出</div>
        )}
      </Layout>
    </>
  );
}
