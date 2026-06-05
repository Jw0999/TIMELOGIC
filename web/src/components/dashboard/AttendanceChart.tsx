import React from 'react';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface DayBar { height: number; type: 'solid' | 'light' | 'stripe'; tooltip?: string }

function StripePattern({ id }: { id: string }) {
  return (
    <defs>
      <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="6" stroke="#D1D5DB" strokeWidth="3" />
      </pattern>
    </defs>
  );
}

function Bar({ bar, idx, maxH }: { bar: DayBar; idx: number; maxH: number }) {
  const bH  = Math.round((bar.height / 100) * maxH);
  const bW  = 28;
  const x   = idx * 44 + 8;
  const y   = maxH - bH;
  const rx  = 8;
  const id  = `stripe-${idx}`;

  const fill = bar.type === 'solid'  ? '#15803d'
             : bar.type === 'light'  ? '#86efac'
             : `url(#${id})`;

  return (
    <g>
      {bar.type === 'stripe' && <StripePattern id={id} />}
      <rect x={x} y={y} width={bW} height={bH} rx={rx} fill={fill} />
      {bar.tooltip && (
        <g>
          <rect x={x - 2} y={y - 28} width={38} height={20} rx={6} fill="#1a1a1a" />
          <text x={x + 17} y={y - 14} textAnchor="middle" fontSize="10" fill="white" fontWeight="700">
            {bar.tooltip}
          </text>
        </g>
      )}
    </g>
  );
}

export default function AttendanceChart() {
  const bars: DayBar[] = [
    { height: 45, type: 'stripe' },
    { height: 72, type: 'solid' },
    { height: 60, type: 'light' },
    { height: 88, type: 'solid', tooltip: '74%' },
    { height: 55, type: 'stripe' },
    { height: 78, type: 'solid' },
    { height: 38, type: 'stripe' },
  ];

  const svgW  = 340;
  const svgH  = 140;
  const barH  = 110;

  return (
    <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-5">
      <h3 className="font-bold text-[15px] text-[var(--text-main)] mb-4">Attendance Analytics</h3>
      <svg width="100%" viewBox={`0 0 ${svgW} ${svgH + 20}`}>
        {bars.map((bar, i) => (
          <Bar key={i} bar={bar} idx={i} maxH={barH} />
        ))}
        {/* X-axis labels */}
        {DAYS.map((d, i) => (
          <text key={i} x={i * 44 + 22} y={barH + 18} textAnchor="middle" fontSize="11" fill="#9CA3AF" fontWeight="500">
            {d}
          </text>
        ))}
      </svg>
    </div>
  );
}
