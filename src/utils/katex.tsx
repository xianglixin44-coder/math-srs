import katex from 'katex';

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
