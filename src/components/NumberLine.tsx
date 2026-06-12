interface IntervalProps {
  /** Interval notation like "(-∞, 2]" or "[1, 3)" */
  notation: string;
  /** Highlight color */
  color?: string;
}

/** Parse interval notation and return {left, right, leftOpen, rightOpen} */
function parseInterval(notation: string) {
  const match = notation.match(/^([\[\(])([^,]+),\s*([^\]\)]+)([\]\)])$/);
  if (!match) return null;
  return {
    leftOpen: match[1] === '(',
    left: match[2].trim(),
    right: match[3].trim(),
    rightOpen: match[4] === ')',
  };
}

function isInf(s: string) { return s.includes('∞') || s.includes('inf'); }

export default function NumberLine({ intervals }: { intervals: IntervalProps[] }) {
  const parsed = intervals.map(i => ({ ...i, parsed: parseInterval(i.notation) })).filter(i => i.parsed);

  // Determine range
  let minVal = -1, maxVal = 5;
  for (const { parsed: p } of parsed) {
    if (!p) continue;
    if (!isInf(p.left)) { const v = parseFloat(p.left); if (!isNaN(v)) minVal = Math.min(minVal, v - 1); }
    if (!isInf(p.right)) { const v = parseFloat(p.right); if (!isNaN(v)) maxVal = Math.max(maxVal, v + 1); }
  }

  const range = maxVal - minVal;
  const pad = range * 0.05;
  const xMin = minVal - pad;
  const xMax = maxVal + pad;
  const toX = (v: number) => 40 + ((v - xMin) / (xMax - xMin)) * 240;

  // Generate tick marks at integer positions
  const ticks: number[] = [];
  for (let i = Math.floor(minVal); i <= Math.ceil(maxVal); i++) {
    if (i >= -1 && i <= 8) ticks.push(i);
  }

  return (
    <div className="flex justify-center my-4">
      <svg viewBox="0 0 320 80" className="w-full max-w-sm">
        {/* Main number line */}
        <line x1={toX(minVal - pad)} y1={35} x2={toX(maxVal + pad)} y2={35}
          stroke="#64748b" strokeWidth="1.5" />

        {/* Arrow heads */}
        <polygon points={`${toX(maxVal + pad) - 6},32 ${toX(maxVal + pad)},35 ${toX(maxVal + pad) - 6},38`} fill="#64748b" />
        <polygon points={`${toX(minVal - pad) + 6},32 ${toX(minVal - pad)},35 ${toX(minVal - pad) + 6},38`} fill="#64748b" />

        {/* Tick marks and labels */}
        {ticks.map(t => {
          const x = toX(t);
          return (
            <g key={t}>
              <line x1={x} y1={30} x2={x} y2={40} stroke="#475569" strokeWidth="0.5" />
              <text x={x} y={52} textAnchor="middle" fill="#94a3b8" style={{ fontSize: 10 }}>{t}</text>
            </g>
          );
        })}

        {/* Interval bars */}
        {parsed.map((item, idx) => {
          const { parsed: p, color = '#a855f7' } = item;
          if (!p) return null;

          const leftVal = isInf(p.left) ? xMin : parseFloat(p.left);
          const rightVal = isInf(p.right) ? xMax : parseFloat(p.right);
          if (isNaN(leftVal) || isNaN(rightVal)) return null;

          const lx = toX(leftVal);
          const rx = toX(rightVal);

          return (
            <g key={idx}>
              {/* Bar */}
              <line x1={lx} y1={27} x2={rx} y2={27} stroke={color} strokeWidth="4" strokeLinecap="round" opacity="0.6" />
              <line x1={lx} y1={27} x2={rx} y2={27} stroke={color} strokeWidth="2" strokeLinecap="round" />

              {/* Left endpoint */}
              <circle cx={lx} cy={27} r="4" fill={p.leftOpen ? 'transparent' : color} stroke={color} strokeWidth="1.5" />
              {/* Right endpoint */}
              <circle cx={rx} cy={27} r="4" fill={p.rightOpen ? 'transparent' : color} stroke={color} strokeWidth="1.5" />

              {/* Label */}
              <text x={(lx + rx) / 2} y={22} textAnchor="middle" fill={color} style={{ fontSize: 9 }}>
                {p.leftOpen ? '(' : '['}{p.left},{p.right}{p.rightOpen ? ')' : ']'}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
