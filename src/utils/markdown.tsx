import React from 'react';
import katex from 'katex';

function renderLatex(formula: string, display: boolean): string {
  try {
    return katex.renderToString(formula, { throwOnError: false, displayMode: display });
  } catch {
    return formula;
  }
}

function InlineFormat({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>;
        if (p.startsWith('*') && p.endsWith('*') && p.length > 2) return <em key={i}>{p.slice(1, -1)}</em>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

function InlineLine({ line }: { line: string }) {
  const segments: { type: 'text' | 'latex'; content: string; display?: boolean }[] = [];
  let remaining = line;

  while (remaining) {
    const dm = remaining.match(/\$\$(.+?)\$\$/);
    const im = remaining.match(/(?<!\$)\$(.+?)\$(?!\$)/);

    if (!dm && !im) {
      segments.push({ type: 'text', content: remaining });
      break;
    }

    const match = dm && (!im || dm.index! <= im.index!) ? dm : im!;
    const display = match === dm;

    if (match.index! > 0) {
      segments.push({ type: 'text', content: remaining.slice(0, match.index) });
    }
    segments.push({ type: 'latex', content: match[1], display });
    remaining = remaining.slice(match.index! + match[0].length);
  }

  return (
    <>
      {segments.map((seg, i) =>
        seg.type === 'latex' ? (
          <span key={i} dangerouslySetInnerHTML={{ __html: renderLatex(seg.content, !!seg.display) }} />
        ) : (
          <InlineFormat key={i} text={seg.content} />
        )
      )}
    </>
  );
}

export function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];
  let buf: string[] = [];
  const flushBuf = () => {
    if (buf.length > 0) {
      result.push(
        <div key={result.length}>
          {buf.map((t, i) => (
            <div key={i} className="mb-1"><InlineLine line={t} /></div>
          ))}
        </div>
      );
      buf = [];
    }
  };

  for (const raw of lines) {
    const t = raw.trim();
    if (!t) {
      flushBuf();
      result.push(<div key={result.length} className="h-1.5" />);
      continue;
    }

    // Headings
    if (t.startsWith('### ')) { flushBuf(); result.push(<h4 key={result.length} className="text-sm font-bold mt-3 mb-1.5" style={{color:'#c0392b'}}><InlineLine line={t.slice(4)} /></h4>); continue; }
    if (t.startsWith('## ')) { flushBuf(); result.push(<h3 key={result.length} className="text-base font-bold mt-4 mb-1.5" style={{color:'#1a1a2e'}}><InlineLine line={t.slice(3)} /></h3>); continue; }
    if (t.startsWith('# ')) { flushBuf(); result.push(<h2 key={result.length} className="text-lg font-bold mt-4 mb-2" style={{color:'#1a1a2e'}}><InlineLine line={t.slice(2)} /></h2>); continue; }

    // Image: ![alt](path)
    const imgMatch = t.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      flushBuf();
      result.push(
        <div key={result.length} className="my-3 flex justify-center">
          <img src={imgMatch[2]} alt={imgMatch[1]} className="max-w-full rounded-lg shadow-sm" style={{maxHeight:400}} />
        </div>
      );
      continue;
    }

    // Unordered list
    if (/^[-*]\s/.test(t)) {
      flushBuf();
      result.push(
        <div key={result.length} className="flex gap-2 mb-0.5 pl-2">
          <span className="text-gray-500 mt-0.5">•</span>
          <span><InlineLine line={t.replace(/^[-*]\s+/, '')} /></span>
        </div>
      );
      continue;
    }
    // Ordered list
    if (/^\d+[.)]\s/.test(t) || /^\d+\.\s+\*\*/.test(t)) {
      flushBuf();
      const num = t.match(/^(\d+)/)?.[1] || '';
      result.push(
        <div key={result.length} className="flex gap-2 mb-0.5 pl-2">
          <span className="text-gray-500 mt-0.5 min-w-[1.2em]">{num}.</span>
          <span><InlineLine line={t.replace(/^\d+[.)]\s+/, '').replace(/^\d+\.\s+/, '')} /></span>
        </div>
      );
      continue;
    }

    // Table row
    if (t.startsWith('|')) {
      flushBuf();
      result.push(<div key={result.length} className="mb-0.5"><InlineLine line={t} /></div>);
      continue;
    }

    buf.push(raw);
  }
  flushBuf();
  return result;
}
