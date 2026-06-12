import { useState } from 'react';
import { Upload, ClipboardPaste, Download, FileDown, Table, Archive } from 'lucide-react';
import { api } from '../api/client';

export default function ImportExportPanel() {
  const [jsonText, setJsonText] = useState('');
  const [status, setStatus] = useState('');

  const handleImport = async () => {
    if (!jsonText.trim()) return;
    try {
      const cards = JSON.parse(jsonText);
      const data = Array.isArray(cards) ? cards : [cards];
      const res: { imported: number } = await api.import(data);
      setStatus(`✅ 导入 ${res.imported} 张卡片`);
      setJsonText('');
    } catch {
      setStatus('❌ 导入失败，请检查 JSON 格式');
    }
  };

  const handleExport = (type: string) => {
    window.open(`/api/export/${type}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-purple-200">📦 导入 / 导出</h2>

      {/* Import */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Upload size={16} /> 导入外接题库
        </h3>
        <textarea
          value={jsonText}
          onChange={e => setJsonText(e.target.value)}
          placeholder='粘贴 JSON 卡片数据... [{&quot;id&quot;: &quot;01-02&quot;, &quot;title&quot;: &quot;...&quot;}]'
          className="w-full h-32 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 font-mono resize-none focus:outline-none focus:border-purple-500/50"
        />
        <div className="flex items-center gap-3">
          <button onClick={handleImport}
            className="px-4 py-2 bg-purple-600/40 hover:bg-purple-600/60 rounded-lg text-sm flex items-center gap-1.5 transition-colors">
            <ClipboardPaste size={14} /> 导入
          </button>
          {status && <span className="text-sm text-slate-400">{status}</span>}
        </div>
      </div>

      {/* Export */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Download size={16} /> 导出数据
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {([
            ['cards', FileDown, '全部卡片 (JSON)'] as const,
            ['progress', Table, '复习进度 (JSON)'] as const,
            ['stats', Table, '复习统计 (CSV)'] as const,
            ['backup', Archive, '完整备份 (ZIP)'] as const,
          ]).map(([type, Icon, label]) => (
            <button key={type} onClick={() => handleExport(type)}
              className="p-3 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 flex items-center gap-2 transition-colors">
              <span className="text-purple-400"><Icon size={14} /></span> {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
