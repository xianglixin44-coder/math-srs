import { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, BookOpen, ArrowLeft } from 'lucide-react';

interface BookInfo {
  name: string;
  size: number;
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function BooksMode() {
  const [books, setBooks] = useState<BookInfo[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadBooks = () => {
    fetch('/api/books')
      .then(r => r.json())
      .then(setBooks)
      .catch(() => setBooks([]));
  };

  useEffect(loadBooks, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('仅支持 PDF 文件');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/books/upload', { method: 'POST', body: form });
      if (!res.ok) throw new Error('上传失败');
      loadBooks();
    } catch {
      setError('上传失败，请重试');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (name: string) => {
    await fetch(`/api/books/${encodeURIComponent(name)}`, { method: 'DELETE' });
    if (selected === name) setSelected(null);
    loadBooks();
  };

  // ── PDF 查看器 ──
  if (selected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={16} /> 返回书单
          </button>
          <span className="text-lg font-semibold text-gray-900">📖 {selected}</span>
        </div>
        <embed
          src={`/api/books/${encodeURIComponent(selected)}`}
          type="application/pdf"
          className="w-full rounded-xl border border-gray-200"
          style={{ height: 'calc(100vh - 160px)' }}
        />
      </div>
    );
  }

  // ── 书单页 ──
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">📚 教材库</h2>
        <p className="text-sm text-gray-500 mt-1">上传数学教材 PDF，随时查阅参考</p>
      </div>

      {/* 上传按钮 */}
      <div className="glass-card p-6 space-y-3">
        <p className="text-sm text-gray-600">
          已有 {books.length} 本教材
        </p>
        <label className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer text-sm font-medium
          transition-colors border
          ${uploading
            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
          }
        `}>
          <Upload size={16} />
          {uploading ? '上传中...' : '上传 PDF 教材'}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {/* 书单列表 */}
      {books.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-gray-500">暂无教材，点击上方按钮上传</p>
        </div>
      ) : (
        <div className="space-y-2">
          {books.map(book => (
            <div
              key={book.name}
              className="glass-card p-4 flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelected(book.name)}
            >
              <BookOpen size={20} className="text-blue-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{book.name}</div>
                <div className="text-xs text-gray-500">{fmtSize(book.size)}</div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); handleDelete(book.name); }}
                className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                title="删除"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
