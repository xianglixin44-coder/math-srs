interface Props {
  /** Left circle label */
  left: string;
  /** Right circle label */
  right: string;
  /** Elements in left-only region (comma-separated or newline) */
  leftOnly?: string;
  /** Elements in right-only region */
  rightOnly?: string;
  /** Elements in intersection region */
  intersection?: string;
  /** Which region to highlight: 'left' | 'right' | 'intersection' | 'union' */
  highlight?: 'left' | 'right' | 'intersection' | 'union';
}

/** Split comma/newline separated string into array, trim each */
function splitItems(s?: string): string[] {
  if (!s) return [];
  return s.split(/[,，\n]+/).map(x => x.trim()).filter(Boolean);
}

const REGION_COLORS = {
  left: { fill: 'rgba(147,51,234,0.15)', stroke: '#a855f7' },
  right: { fill: 'rgba(59,130,246,0.15)', stroke: '#3b82f6' },
  intersection: { fill: 'rgba(239,68,68,0.2)', stroke: '#f87171' },
  union: { fill: 'rgba(147,51,234,0.15)', stroke: '#a855f7' },
};

export default function VennDiagram({ left, right, leftOnly, rightOnly, intersection, highlight }: Props) {
  const leftItems = splitItems(leftOnly);
  const rightItems = splitItems(rightOnly);
  const interItems = splitItems(intersection);

  return (
    <div className="flex justify-center my-4">
      <svg viewBox="0 0 320 180" className="w-full max-w-xs">
        {/* Circle backgrounds */}
        <ellipse cx="120" cy="90" rx="80" ry="65" fill={REGION_COLORS.left.fill} stroke={REGION_COLORS.left.stroke} strokeWidth="1.5" />
        <ellipse cx="200" cy="90" rx="80" ry="65" fill={REGION_COLORS.right.fill} stroke={REGION_COLORS.right.stroke} strokeWidth="1.5" />

        {/* Highlight: intersection (clip to left circle, then fill right circle color) */}
        {highlight === 'intersection' && (
          <>
            <clipPath id="clip-left">
              <ellipse cx="120" cy="90" rx="80" ry="65" />
            </clipPath>
            <ellipse cx="200" cy="90" rx="80" ry="65" fill={REGION_COLORS.intersection.fill} clipPath="url(#clip-left)" />
          </>
        )}

        {/* Labels */}
        <text x="85" y="35" textAnchor="middle" className="text-xs fill-slate-300" style={{ fontSize: 11 }}>{left}</text>
        <text x="235" y="35" textAnchor="middle" className="text-xs fill-slate-300" style={{ fontSize: 11 }}>{right}</text>

        {/* Left-only items */}
        {leftItems.map((item, i) => (
          <text key={`l${i}`} x="50" y={70 + i * 18} textAnchor="middle" className="fill-purple-300" style={{ fontSize: 13 }}>
            {item}
          </text>
        ))}

        {/* Right-only items */}
        {rightItems.map((item, i) => (
          <text key={`r${i}`} x="270" y={70 + i * 18} textAnchor="middle" className="fill-blue-300" style={{ fontSize: 13 }}>
            {item}
          </text>
        ))}

        {/* Intersection items */}
        {interItems.map((item, i) => (
          <text key={`i${i}`} x="160" y={78 + i * 18} textAnchor="middle" className="fill-red-300" style={{ fontSize: 13 }}>
            {item}
          </text>
        ))}

        {/* Legend */}
        <text x="10" y="170" className="fill-slate-500" style={{ fontSize: 9 }}>
          {highlight === 'intersection' ? '● 高亮 = 交集' : ''}
        </text>
      </svg>
    </div>
  );
}
