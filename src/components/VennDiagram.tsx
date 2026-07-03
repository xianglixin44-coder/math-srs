interface Props {
  /** Left circle label (e.g., "A" or "p(x)") */
  left: string;
  /** Right circle label */
  right: string;
  /** Elements in left-only region */
  leftOnly?: string;
  /** Elements in right-only region */
  rightOnly?: string;
  /** Elements in intersection region */
  intersection?: string;
  /** Which region to highlight */
  highlight?: 'left' | 'right' | 'intersection' | 'union';
  /** Optional title/caption above the diagram */
  title?: string;
}

function splitItems(s?: string): string[] {
  if (!s) return [];
  return s.split(/[,，\n]+/).map(x => x.trim()).filter(Boolean);
}

const COLORS = {
  left:      { fill: 'rgba(147,51,234,0.12)', stroke: '#a855f7', item: '#7e22ce' },
  right:     { fill: 'rgba(59,130,246,0.12)', stroke: '#60a5fa', item: '#2563eb' },
  intersect: { fill: 'rgba(239,68,68,0.18)',  stroke: '#f87171', item: '#dc2626' },
};

export default function VennDiagram({ left, right, leftOnly, rightOnly, intersection, highlight, title }: Props) {
  const leftItems = splitItems(leftOnly);
  const rightItems = splitItems(rightOnly);
  const interItems = splitItems(intersection);
  const h = highlight;

  return (
    <div className="flex flex-col items-center my-5">
      {title && <div className="text-xs text-blue-700/70 mb-3 font-medium">{title}</div>}
      <svg viewBox="0 0 320 190" className="w-full max-w-xs">
        {/* Circles */}
        <ellipse cx="120" cy="100" rx="78" ry="60"
          fill={h === 'left' || h === 'union' ? 'rgba(147,51,234,0.22)' : COLORS.left.fill}
          stroke={h === 'left' ? '#c084fc' : COLORS.left.stroke} strokeWidth={h === 'left' ? 2 : 1.2} />
        <ellipse cx="200" cy="100" rx="78" ry="60"
          fill={h === 'right' || h === 'union' ? 'rgba(59,130,246,0.22)' : COLORS.right.fill}
          stroke={h === 'right' ? '#93c5fd' : COLORS.right.stroke} strokeWidth={h === 'right' ? 2 : 1.2} />

        {/* Intersection highlight clip */}
        {(h === 'intersection' || interItems.length > 0) && (
          <>
            <clipPath id="vc">
              <ellipse cx="120" cy="100" rx="78" ry="60" />
            </clipPath>
            <ellipse cx="200" cy="100" rx="78" ry="60"
              fill={h === 'intersection' ? COLORS.intersect.fill : 'rgba(239,68,68,0.08)'}
              stroke={h === 'intersection' ? COLORS.intersect.stroke : 'none'}
              strokeWidth={h === 'intersection' ? 1.5 : 0}
              clipPath="url(#vc)" />
          </>
        )}

        {/* Labels: collection notation style */}
        <text x="80" y="30" textAnchor="middle" fill="#7e22ce" style={{ fontSize: 12, fontWeight: 600 }}>{left}</text>
        <text x="240" y="30" textAnchor="middle" fill="#2563eb" style={{ fontSize: 12, fontWeight: 600 }}>{right}</text>

        {/* Left-only items */}
        {leftItems.map((item, i) => (
          <text key={`l${i}`} x="55" y={78 + i * 17} textAnchor="middle" fill={COLORS.left.item} style={{ fontSize: 12 }}>
            {item}
          </text>
        ))}

        {/* Right-only items */}
        {rightItems.map((item, i) => (
          <text key={`r${i}`} x="265" y={78 + i * 17} textAnchor="middle" fill={COLORS.right.item} style={{ fontSize: 12 }}>
            {item}
          </text>
        ))}

        {/* Intersection items */}
        {interItems.map((item, i) => (
          <text key={`i${i}`} x="160" y={88 + i * 17} textAnchor="middle" fill={COLORS.intersect.item} style={{ fontSize: 12 }}>
            {item}
          </text>
        ))}

        {/* Bottom legend line */}
        {h && (
          <text x="160" y="178" textAnchor="middle" fill="#475569" style={{ fontSize: 9 }}>
            {h === 'intersection' ? `● 高亮区域 = ${left} ∩ ${right}` :
             h === 'left' ? `● 高亮区域 = ${left} ⊆ ${right}` :
             h === 'union' ? `● 高亮区域 = ${left} ∪ ${right}` : ''}
          </text>
        )}
      </svg>
    </div>
  );
}
