import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { api } from '../api/client';

interface BrowseCardSummary {
  id: string;
  title: string;
  category?: string;
  sectionCount: number;
}

interface Props {
  activeCardId: string | null;
  onSelectCard: (id: string) => void;
}

export default function Sidebar({ activeCardId, onSelectCard }: Props) {
  const [cards, setCards] = useState<BrowseCardSummary[] | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api.browse.list().then(setCards).catch(() => setCards([]));
  }, []);

  if (cards === null) return null;

  // Group by category
  const groups: Record<string, BrowseCardSummary[]> = {};
  for (const card of cards) {
    const cat = card.category || '未分类';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(card);
  }

  const toggleCategory = (cat: string) => {
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <div className="w-56 shrink-0 h-full overflow-y-auto border-r border-slate-700/50 bg-slate-900/30 p-3 space-y-1">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-3">
        📐 浏览目录
      </h3>
      {Object.entries(groups).map(([category, catCards]) => {
        const isOpen = !collapsed[category];
        return (
          <div key={category}>
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-slate-200 transition-colors rounded"
            >
              {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              {category}
              <span className="text-slate-600 ml-auto">{catCards.length}</span>
            </button>
            {isOpen && catCards.map(card => (
              <button
                key={card.id}
                onClick={() => onSelectCard(card.id)}
                className={`w-full text-left px-4 py-1.5 text-xs rounded transition-colors flex items-center gap-2 ${
                  activeCardId === card.id
                    ? 'bg-purple-600/20 text-purple-200 border border-purple-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <BookOpen size={10} className="shrink-0 opacity-50" />
                <span className="truncate">{card.id} {card.title}</span>
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}
