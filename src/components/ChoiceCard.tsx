import { useState, useMemo } from 'react';
import { renderLine } from '../utils/katex';

interface Props {
  question: string;
  options: string[];
  answer: number;
  onScore: (score: number) => void;
}

function shuffleOptions(opts: string[], correctIdx: number) {
  // Pair each option with its original index, then shuffle
  const items = opts.map((opt, i) => ({ opt, origIdx: i }));
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  const shuffledOpts = items.map(x => x.opt);
  const newCorrectIdx = items.findIndex(x => x.origIdx === correctIdx);
  return { options: shuffledOpts, correct: newCorrectIdx };
}

export default function ChoiceCard({ question, options, answer, onScore }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { options: shuffled, correct } = useMemo(
    () => shuffleOptions(options, answer),
    [options, answer]
  );

  const handleSelect = (idx: number) => {
    if (submitted) return;
    setSelected(idx);
    setSubmitted(true);
    onScore(idx === correct ? 3 : 0);
  };

  return (
    <div
      className="glass-card p-6 space-y-4"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap select-none">
        {renderLine(question)}
      </div>
      <div className="space-y-2">
        {shuffled.map((opt, i) => {
          const letter = String.fromCharCode(65 + i);
          let cls = 'p-3 rounded-lg border transition-all cursor-pointer text-base ';
          if (!submitted) {
            cls += selected === i
              ? 'border-purple-400 bg-purple-600/20 text-blue-600'
              : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800';
          } else if (i === correct) {
            cls += 'border-green-400 bg-green-600/20 text-green-700';
          } else if (i === selected) {
            cls += 'border-red-400 bg-red-600/20 text-red-700';
          } else {
            cls += 'border-gray-200 text-gray-400';
          }
          return (
            <div key={i} onClick={() => handleSelect(i)} className={cls}>
              <span className="font-mono mr-2">{letter}.</span>
              {renderLine(opt)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
