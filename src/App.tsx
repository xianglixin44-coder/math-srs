import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import BrowseMode from './components/BrowseMode';
import ReviewMode from './components/ReviewMode';
import ImportExportPanel from './components/ImportExportPanel';
import BankMode from './components/BankMode';
import BooksMode from './components/BooksMode';
import LecturesMode from './components/LecturesMode';
import ExercisesMode from './components/ExercisesMode';
import ErrorBoundary from './components/ErrorBoundary';
import { checkHealth } from './api/client';

type Mode = 'browse' | 'review' | 'import' | 'bank' | 'books' | 'lectures' | 'exercises';

export default function App() {
  const [mode, setMode] = useState<Mode>('browse');
  const [online, setOnline] = useState<boolean | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [lectureKey, setLectureKey] = useState(0);

  useEffect(() => {
    checkHealth().then(setOnline);
    const timer = setInterval(() => checkHealth().then(setOnline), 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (mode === 'lectures') setLectureKey(k => k + 1);
  }, [mode]);

  const handleSelectCard = (id: string) => {
    setActiveCardId(id);
  };

  const handleLectureClick = () => {
    setMode('lectures');
    setLectureKey(k => k + 1);
  };

  const handleBrowseClick = () => {
    if (mode !== 'browse') setMode('browse');
    setActiveCardId(null);
  };

  return (
    <>
      {online === false && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-2 text-center text-sm text-red-700">
          ⚠️ 无法连接到后端服务（{window.location.hostname}:3000）— 仅浏览模式可用
        </div>
      )}
      <Layout mode={mode} setMode={setMode} onLectureClick={handleLectureClick} onBrowseClick={handleBrowseClick} online={online} activeCardId={activeCardId} onSelectCard={handleSelectCard}>
        <ErrorBoundary>
        {mode === 'browse' && (
          <BrowseMode activeCardId={activeCardId} />
        )}
        {mode === 'review' && (online !== false
          ? <ReviewMode onActiveCardChange={setActiveCardId} preferCardId={activeCardId} />
          : <div className="glass-card p-12 text-center text-gray-600">需要后端服务才能复习</div>
        )}
        {mode === 'import' && (online !== false
          ? <ImportExportPanel />
          : <div className="glass-card p-12 text-center text-gray-600">需要后端服务才能导入导出</div>
        )}
        {mode === 'bank' && (online !== false
          ? <BankMode />
          : <div className="glass-card p-12 text-center text-gray-600">需要后端服务才能查看题库</div>
        )}
        {mode === 'books' && (
          <BooksMode />
        )}
        {mode === 'lectures' && (
          <LecturesMode key={lectureKey} />
        )}
        {mode === 'exercises' && (
          <ExercisesMode />
        )}
      </ErrorBoundary>
      </Layout>
    </>
  );
}
