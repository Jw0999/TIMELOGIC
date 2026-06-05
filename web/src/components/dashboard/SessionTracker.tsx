import React, { useEffect, useState } from 'react';
import { Pause, Square } from 'lucide-react';

export default function SessionTracker() {
  const [time, setTime] = useState(new Date());
  const [running, setRunning] = useState(true);
  const [elapsed, setElapsed] = useState(0); // seconds tracked

  useEffect(() => {
    const tick = setInterval(() => {
      setTime(new Date());
      if (running) setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(tick);
  }, [running]);

  const pad = (n: number) => String(n).padStart(2, '0');
  const h   = Math.floor(elapsed / 3600);
  const m   = Math.floor((elapsed % 3600) / 60);
  const s   = elapsed % 60;

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 text-white"
      style={{ background: 'linear-gradient(135deg, #0d3320 0%, #15803d 100%)' }}
    >
      {/* Label */}
      <p className="text-xs font-semibold text-white/70 uppercase tracking-widest">Session Tracker</p>

      {/* Timer display */}
      <div className="flex flex-col items-center py-2">
        <p className="text-4xl font-black tracking-wider tabular-nums">
          {pad(h)}:{pad(m)}:{pad(s)}
        </p>
        <p className="text-[11px] text-white/50 mt-1">
          {running ? 'Tracking active session' : 'Paused'}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setRunning(!running)}
          className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
        >
          {running
            ? <Pause  size={16} className="text-white fill-white" />
            : <svg viewBox="0 0 16 16" className="w-4 h-4 fill-white"><polygon points="3,2 14,8 3,14" /></svg>
          }
        </button>
        <button
          onClick={() => { setRunning(false); setElapsed(0); }}
          className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
        >
          <Square size={14} className="text-white fill-white" />
        </button>
      </div>
    </div>
  );
}
