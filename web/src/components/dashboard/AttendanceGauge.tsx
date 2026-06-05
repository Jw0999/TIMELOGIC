import React from 'react';

interface Props { present: number; late: number; absent: number }

export default function AttendanceGauge({ present, late, absent }: Props) {
  const total = present + late + absent;
  const pct   = total > 0 ? Math.round((present / total) * 100) : 0;

  // Semi-circle SVG gauge
  const r   = 70;
  const cx  = 100, cy = 100;
  const circumference = Math.PI * r; // half circle

  const presentArc = total > 0 ? (present / total) * circumference : 0;
  const lateArc    = total > 0 ? (late    / total) * circumference : 0;
  // absent fills the rest

  // Convert arc length to stroke-dasharray approach on a half circle
  // We rotate the SVG so the half circle goes from left to right
  const toXY = (deg: number) => ({
    x: cx + r * Math.cos((deg * Math.PI) / 180),
    y: cy + r * Math.sin((deg * Math.PI) / 180),
  });

  const startPt = toXY(180);
  const endPt   = toXY(0);

  // Build arc segments
  type Segment = { color: string; pct: number };
  const segments: Segment[] = [
    { color: '#15803d', pct: total > 0 ? present / total : 0 },
    { color: '#86efac', pct: total > 0 ? late    / total : 0 },
    { color: '#D1D5DB', pct: total > 0 ? absent  / total : 0 },
  ];

  let currentAngle = 180;
  const arcs = segments.map((seg) => {
    const startAngle = currentAngle;
    const sweep      = seg.pct * 180;
    const endAngle   = startAngle + sweep;
    currentAngle     = endAngle;

    if (sweep < 0.5) return null;
    const s = toXY(startAngle);
    const e = toXY(endAngle);
    const large = sweep > 180 ? 1 : 0;

    return { d: `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`, color: seg.color };
  }).filter(Boolean);

  return (
    <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-5 flex flex-col">
      <h3 className="font-bold text-[15px] text-[var(--text-main)] mb-3">Attendance Rate</h3>

      {/* Gauge */}
      <div className="flex justify-center">
        <div className="relative">
          <svg viewBox="0 0 200 110" className="w-[200px]">
            {/* Track */}
            <path d={`M ${startPt.x.toFixed(2)} ${startPt.y.toFixed(2)} A ${r} ${r} 0 0 1 ${endPt.x.toFixed(2)} ${endPt.y.toFixed(2)}`}
              fill="none" stroke="#F3F4F6" strokeWidth={16} strokeLinecap="round" />
            {/* Colored segments */}
            {arcs.map((arc, i) => arc && (
              <path key={i} d={arc.d} fill="none" stroke={arc.color} strokeWidth={16} strokeLinecap={i === 0 ? 'round' : 'butt'} />
            ))}
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
            <span className="text-3xl font-black text-[var(--text-main)]">{pct}%</span>
            <span className="text-[11px] text-[var(--text-muted)] font-medium">Present Today</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3">
        {[
          { color: '#15803d', label: 'Present', val: present },
          { color: '#86efac', label: 'Late',    val: late },
          { color: '#D1D5DB', label: 'Absent',  val: absent },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: l.color }} />
            <span className="text-[11px] text-[var(--text-muted)] font-medium">{l.label} ({l.val})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
