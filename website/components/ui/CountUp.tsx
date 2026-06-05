"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { EASE } from "@/lib/motion";

/**
 * Counts up to `value` the first time it scrolls into view. Falls back to the
 * final value instantly under reduced motion.
 */
export function CountUp({
  value,
  suffix = "",
  durationMs = 1400,
  className,
}: {
  value: number;
  suffix?: string;
  durationMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    if (reduce || value === 0) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    // easeOutExpo via cubic-bezier sampling approximation
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setDisplay(Math.round(ease(t) * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isInView, reduce, value, durationMs]);

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}
