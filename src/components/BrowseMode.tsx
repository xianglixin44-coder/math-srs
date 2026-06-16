import { useState, useEffect, useRef } from 'react';
import { BookOpen, Brain, Lightbulb, AlertTriangle, Network, ArrowLeft, ChevronLeft, ChevronRight, FlaskConical, ArrowRightLeft } from 'lucide-react';
import { api, type BrowseCard } from '../api/client';
import { renderLine } from '../utils/katex';

const SECTION_ICONS: Record<string, React.FC<{ size?: number }>> = {
  concept: BookOpen,
  method: Brain,
  pitfall: AlertTriangle,
  insight: Lightbulb,
  challenge: Network,
  example: FlaskConical,
  connect: ArrowRightLeft,
};
const FALLBACK_ICONS: Record<number, React.FC<{ size?: number }>> = {
  0: BookOpen,
  1: Brain,
  2: AlertTriangle,
  3: Lightbulb,
  4: Network,
  5: FlaskConical,
  6: ArrowRightLeft,
};

const SECTION_COLORS: Record<string, string> = {
  concept: 'from-purple-500 to-pink-500',
  method: 'from-blue-500 to-cyan-500',
  pitfall: 'from-rose-500 to-red-500',
  insight: 'from-violet-500 to-purple-500',
  challenge: 'from-amber-500 to-orange-500',
  example: 'from-emerald-500 to-teal-500',
  connect: 'from-cyan-500 to-blue-500',
};
const FALLBACK_COLORS = [
  'from-purple-500 to-pink-500',
  'from-blue-500 to-cyan-500',
  'from-rose-500 to-red-500',
  'from-violet-500 to-purple-500',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-500',
  'from-cyan-500 to-blue-500',
];

interface Props {
  activeCardId: string | null;
}

/** Simple markdown-like rendering: split on ## headers, render bold etc. */
function renderContent(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Section header ###
    if (line.startsWith('#### ')) {
      result.push(
        <h5 key={i} className="text-sm font-semibold text-purple-400 mt-3 mb-1">{line.slice(5)}</h5>
      );
      continue;
    }
    // Section header ###
    if (line.startsWith('### ')) {
      result.push(
        <h4 key={i} className="text-base font-semibold text-purple-300 mt-4 mb-1">{renderLine(line.slice(4))}</h4>
      );
      continue;
    }
    // Sub header ##
    if (line.startsWith('## ')) {
      result.push(
        <h3 key={i} className="text-lg font-bold text-white mt-5 mb-2">{renderLine(line.slice(3))}</h3>
      );
      continue;
    }

    // Horizontal rule / separator
    if (line === '---') {
      result.push(<hr key={i} className="border-slate-700/50 my-3" />);
      continue;
    }

    // Table
    if (line.startsWith('|')) {
      // collect all table lines
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      i--; // back one since for loop increments
      result.push(
        <div key={i} className="overflow-x-auto my-2 text-sm">
          <table className="w-full border-collapse">
            <tbody>
              {tableLines.filter(l => !l.match(/^\|[\s\-:|]+$/)).map((tl, ti) => {
                const cells = tl.split('|').filter(c => c.trim());
                const isHeader = ti === 0 && (tableLines.length > 2 || tableLines[1]?.match(/^\|[\s\-:|]+$/));
                const Cell = isHeader ? 'th' : 'td';
                return (
                  <tr key={ti} className={isHeader ? 'border-b border-slate-600' : 'border-b border-slate-800'}>
                    {cells.map((cell, ci) => (
                      <Cell key={ci} className={`px-2 py-1 ${isHeader ? 'text-slate-300 font-medium' : 'text-slate-400'}`}>
                        {renderLine(cell.trim())}
                      </Cell>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Image — match ![alt](url) with optional surrounding text
    const imgMatch = line.match(/^!\[(.*)\]\((.+)\)\s*$/);
    if (imgMatch) {
      result.push(
        <div key={i} className="my-4 flex justify-center">
          <img src={imgMatch[2].trim()} alt={imgMatch[1]} className="max-w-full rounded-xl" style={{maxHeight: '320px'}} />
        </div>
      );
      continue;
    }

    // Inline image inside paragraph
    if (line.includes('![') && line.includes('](')) {
      const parts = line.split(/(!\[.*?\]\(.+?\))/g);
      result.push(
        <div key={i} className="my-4 flex justify-center">
          {parts.map((part, pi) => {
            const im = part.match(/!\[(.*)\]\((.+)\)/);
            if (im) return <img key={pi} src={im[2].trim()} alt={im[1]} className="max-w-full rounded-xl" style={{maxHeight: '320px'}} />;
            return null;
          })}
        </div>
      );
      continue;
    }

    // Bold marker **text** (handled below in paragraph)
    if (line.startsWith('> ')) {
      result.push(
        <blockquote key={i} className="border-l-2 border-purple-500/40 pl-3 my-2 text-slate-400 italic text-sm">
          {renderLine(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Bold marker **text**
    // Empty line
    if (line.trim() === '') {
      result.push(<div key={i} className="h-2" />);
      continue;
    }

    // List item
    if (line.match(/^[-*]\s/)) {
      const content = line.replace(/^[-*]\s/, '');
      const segments = content.split(/(\*\*.*?\*\*)/g);
      result.push(
        <li key={i} className="text-base text-slate-300 leading-relaxed ml-4 list-disc">
          {segments.map((seg, si) => {
            if (seg.startsWith('**') && seg.endsWith('**')) {
              return <strong key={si} className="text-slate-100 font-semibold">{renderLine(seg.slice(2, -2))}</strong>;
            }
            return <span key={si}>{renderLine(seg)}</span>;
          })}
        </li>
      );
      continue;
    }

    // Regular paragraph with inline bold
    const segments = line.split(/(\*\*.*?\*\*)/g);
    result.push(
      <p key={i} className="text-base text-slate-300 leading-relaxed whitespace-pre-wrap">
        {segments.map((seg, si) => {
          if (seg.startsWith('**') && seg.endsWith('**')) {
            return <strong key={si} className="text-slate-100 font-semibold">{renderLine(seg.slice(2, -2))}</strong>;
          }
          return <span key={si}>{renderLine(seg)}</span>;
        })}
      </p>
    );
  }

  return result;
}

export default function BrowseMode({ activeCardId }: Props) {
  const [cards, setCards] = useState<BrowseCard[] | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.browse.list().then(async (summaries) => {
      if (cancelled) return;
      if (summaries.length === 0) { setCards([]); return; }
      const fullCards = await Promise.all(
        summaries.map((s) => api.browse.get(s.id))
      );
      if (!cancelled) setCards(fullCards);
    }).catch(() => { if (!cancelled) setCards([]); });
    return () => { cancelled = true; };
  }, []);

  // Reset selected section when card changes
  const prevCardId = useRef(activeCardId);
  useEffect(() => {
    if (activeCardId !== prevCardId.current) {
      prevCardId.current = activeCardId;
      setSelectedSection(null);
    }
  }, [activeCardId]);

  if (cards === null) {
    return <div className="glass-card p-12 text-center"><p className="text-slate-400">加载中...</p></div>;
  }

  if (cards.length === 0) {
    return <div className="glass-card p-12 text-center"><p className="text-slate-400">暂无浏览卡片</p></div>;
  }

  const activeCard = cards.find(c => c.id === activeCardId) ?? null;

  if (!activeCard) {
    return (
      <div className="glass-card p-12 text-center space-y-3">
        <p className="text-slate-400">从左侧目录选择一张卡片查看</p>
        <p className="text-xs text-slate-500">点击内容方格进入学习笔记</p>
      </div>
    );
  }

  // ── Detail page (single section, full page) ──────────────────
  if (selectedSection) {
    const section = activeCard.sections.find(s => s.key === selectedSection);
    if (!section) { setSelectedSection(null); return null; }

    const sectionIdx = activeCard.sections.indexOf(section);
    const colorClass = SECTION_COLORS[section.key] ?? FALLBACK_COLORS[sectionIdx % FALLBACK_COLORS.length];
    const Icon = SECTION_ICONS[section.key] ?? FALLBACK_ICONS[sectionIdx % Object.keys(FALLBACK_ICONS).length];
    const prevSection = sectionIdx > 0 ? activeCard.sections[sectionIdx - 1] : null;
    const nextSection = sectionIdx < activeCard.sections.length - 1 ? activeCard.sections[sectionIdx + 1] : null;

    return (
      <div className="space-y-6" key={`detail-${activeCard.id}-${section.key}`}>
        <button
          onClick={() => setSelectedSection(null)}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={16} />
          <span className="text-slate-500">{activeCard.id} {activeCard.title}</span>
        </button>

        <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/30">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
              <span className="text-white"><Icon size={20} /></span>
            </div>
            <div>
              <div className="text-lg font-bold text-white">{section.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{activeCard.title}</div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="prose prose-invert prose-sm max-w-none">
            {renderContent(section.content)}
          </div>
        </div>

        {/* Prev / Next navigation */}
        <div className="flex items-center justify-between gap-4">
          {prevSection ? (
            <button
              onClick={() => setSelectedSection(prevSection.key)}
              className="flex items-center gap-1 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/30 rounded-lg text-sm text-slate-300 transition-colors"
            >
              <ChevronLeft size={16} />
              <div className="text-left">
                <div className="text-xs text-slate-500">上一节</div>
                <div className="text-sm">{prevSection.label}</div>
              </div>
            </button>
          ) : <div />}
          {nextSection ? (
            <button
              onClick={() => setSelectedSection(nextSection.key)}
              className="flex items-center gap-1 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/30 rounded-lg text-sm text-slate-300 transition-colors"
            >
              <div className="text-right">
                <div className="text-xs text-slate-500">下一节</div>
                <div className="text-sm">{nextSection.label}</div>
              </div>
              <ChevronRight size={16} />
            </button>
          ) : <div />}
        </div>
      </div>
    );
  }

  // ── Grid page ──────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-2xl p-5 border border-purple-500/20">
        <div className="text-xs text-purple-300/70">{activeCard.category}</div>
        <h2 className="text-xl font-bold text-white mt-1">{activeCard.title}</h2>
        <div className="text-xs text-slate-400 mt-1">{activeCard.id} · {activeCard.sections.length} 个内容块</div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {activeCard.sections.map((section, i) => {
          const colorClass = SECTION_COLORS[section.key] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length];
          const Icon = SECTION_ICONS[section.key] ?? FALLBACK_ICONS[i % Object.keys(FALLBACK_ICONS).length];
          return (
            <button
              key={section.key}
              onClick={() => setSelectedSection(section.key)}
              className="relative rounded-xl p-4 text-left border transition-all min-h-[100px] bg-slate-800/40 border-slate-700/30 hover:border-slate-600/50 hover:bg-slate-800/60"
            >
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center mb-2`}>
                <span className="text-white"><Icon size={14} /></span>
              </div>
              <div className="text-xs font-medium text-slate-200">{section.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
