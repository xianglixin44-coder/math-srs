import { useState, useEffect } from 'react';
import katex from 'katex';

interface Props {
  text: string;
}

export default function KatexText({ text }: Props) {
  const [html, setHtml] = useState('');

  useEffect(() => {
    try {
      setHtml(
        katex.renderToString(text, {
          throwOnError: false,
          displayMode: true,
          strict: false,
        })
      );
    } catch {
      setHtml(text);
    }
  }, [text]);

  if (!text.includes('\\')) return null;
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export function renderMixed(text: string): (string | { __html: string })[] {
  const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/s);
  return parts.map((part) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      const formula = part.slice(2, -2);
      try {
        return { __html: katex.renderToString(formula, { throwOnError: false, displayMode: true }) };
      } catch {
        return part;
      }
    }
    if (part.startsWith('$') && part.endsWith('$')) {
      const formula = part.slice(1, -1);
      try {
        return { __html: katex.renderToString(formula, { throwOnError: false, displayMode: false }) };
      } catch {
        return part;
      }
    }
    return part;
  });
}

export function renderLine(line: string): React.ReactElement {
  const parts = renderMixed(line);
  return (
    <>
      {parts.map((p, i) =>
        typeof p === 'string' ? (
          <span key={i}>{p}</span>
        ) : (
          <span key={i} dangerouslySetInnerHTML={p} />
        )
      )}
    </>
  );
}
