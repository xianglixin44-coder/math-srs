import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, BookOpen, BookMarked } from 'lucide-react';
import { api } from '../api/client';

interface TextbookSection {
  id: string;
  title: string;
  category?: string;
  sectionCount: number;
  hasScaffold?: boolean;
}

interface TextbookChapter {
  key: string;
  title: string;
  sections: TextbookSection[];
}

interface TextbookVolume {
  key: string;
  title: string;
  chapters: TextbookChapter[];
}

interface TextbookData {
  volumes: TextbookVolume[];
}

interface Props {
  activeCardId: string | null;
  onSelectCard: (id: string) => void;
}

export default function Sidebar({ activeCardId, onSelectCard }: Props) {
  const [textbook, setTextbook] = useState<TextbookData | null>(null);
  const [availableCards, setAvailableCards] = useState<Map<string, boolean>>(new Map());
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/browse/textbook')
      .then(r => r.json())
      .then(setTextbook)
      .catch(() => setTextbook(null));

    api.browse.list().then((cards: any[]) => {
      const m = new Map<string, boolean>();
      cards.forEach(c => m.set(c.id, c.hasScaffold ?? false));
      setAvailableCards(m);
    }).catch(() => {});
  }, []);

  if (!textbook) return null;

  const toggle = (key: string) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="w-56 shrink-0 h-full overflow-y-auto border-r border-gray-200 bg-white/80 p-3 space-y-0.5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-2 mb-3">
        📝 专题笔记
      </h3>

      {textbook.volumes.map(vol => {
        const volKey = `vol-${vol.key}`;
        const isVolOpen = !collapsed[volKey];
        return (
          <div key={volKey}>
            <button
              onClick={() => toggle(volKey)}
              className="w-full flex items-center gap-1 px-2 py-1.5 text-base text-gray-700 hover:text-gray-900 transition-colors rounded"
            >
              {isVolOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <BookMarked size={12} className="text-blue-600" />
              <span className="font-medium">{vol.title}</span>
            </button>

            {isVolOpen && vol.chapters.map(ch => {
              const chKey = `ch-${ch.key}`;
              const isChOpen = !collapsed[chKey];
              return (
                <div key={chKey}>
                  <button
                    onClick={() => toggle(chKey)}
                    className="w-full flex items-center gap-1 pl-5 pr-2 py-1.5 text-base text-gray-600 hover:text-gray-800 transition-colors rounded"
                  >
                    {isChOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                    <span>{ch.title}</span>
                    <span className="text-gray-400 ml-auto text-xs">
                      {ch.sections.filter(s => availableCards.has(s.id)).length}/{ch.sections.length}
                    </span>
                  </button>

                  {isChOpen && ch.sections.map(sec => {
                    const hasCard = availableCards.has(sec.id);
                    const hasScaffold = availableCards.get(sec.id) ?? false;
                    return (
                      <button
                        key={sec.id}
                        onClick={() => hasCard && onSelectCard(sec.id)}
                        disabled={!hasCard}
                        className={`w-full text-left pl-8 pr-2 py-1 text-base rounded transition-colors flex items-center gap-1.5 ${
                          activeCardId === sec.id
                            ? 'bg-gray-100 text-blue-600 border border-blue-200'
                            : hasCard
                              ? 'text-gray-600 hover:text-gray-800 hover:bg-white'
                              : 'text-gray-400 cursor-default'
                        }`}
                      >
                        <BookOpen size={9} className={`shrink-0 ${hasCard ? 'opacity-50' : 'opacity-25'}`} />
                        <span className="truncate">{sec.id} {sec.title}</span>
                        {hasScaffold && <span className="shrink-0 text-amber-500 text-xs ml-0.5" title="含压轴题思维脚手架">⭐</span>}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
