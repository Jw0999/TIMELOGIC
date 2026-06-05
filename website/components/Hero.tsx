"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { ArrowRight, ShieldCheck, Wifi, Smartphone, Clock } from "lucide-react";
import { DOWNLOADS } from "@/lib/site";
import { EASE, fadeUp, stagger } from "@/lib/motion";
import { PhoneMockup } from "./ui/PhoneMockup";

export function Hero() {
  const reduce = useReducedMotion();

  // Cursor-responsive tilt
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), { stiffness: 150, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-9, 9]), { stiffness: 150, damping: 18 });

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <section id="hero" className="relative overflow-hidden pt-32 pb-20 sm:pt-40 lg:pb-28">
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-texture opacity-60" />
        <div className="absolute -top-24 left-1/2 h-[520px] w-[760px] -translate-x-1/2 rounded-full glow-radial opacity-40 blur-[60px]" />
        <div className="absolute right-[8%] top-1/3 h-[300px] w-[300px] rounded-full glow-radial opacity-20 blur-[60px]" />
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-5 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
        {/* Copy */}
        <motion.div
          variants={stagger(0.1, 0.09)}
          initial={reduce ? false : "hidden"}
          animate="show"
          className="text-center lg:text-left"
        >
          <motion.div variants={fadeUp} className="mb-5 flex justify-center lg:justify-start">
            <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-[12.5px] font-medium text-muted">
              <ShieldCheck size={14} className="text-sky" />
              Secure workforce attendance
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mx-auto max-w-xl text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:mx-0 lg:text-6xl"
          >
            <span className="text-fg">Attendance you can </span>
            <span className="text-gradient">actually trust.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mx-auto mt-5 max-w-md text-[15.5px] leading-relaxed text-muted lg:mx-0"
          >
            TimeLogic verifies every check-in by Wi-Fi, device, and time. Your team marks
            attendance from their phone, with zero room to cheat.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start"
          >
            <a
              href={DOWNLOADS.android.href ?? "#"}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_40px_-12px_rgba(37,99,235,0.8)] transition-transform active:scale-[0.98] sm:w-auto"
            >
              Download for Android
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#platforms"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full glass px-6 py-3 text-sm font-semibold text-fg transition-colors hover:bg-white/[0.06] sm:w-auto"
            >
              Get Desktop App
            </a>
          </motion.div>

          <motion.p variants={fadeUp} className="mt-4 text-xs text-faint">
            iOS and macOS coming soon.
          </motion.p>
        </motion.div>

        {/* Device */}
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          className="flex justify-center lg:justify-end"
          style={{ perspective: 1200 }}
        >
          <motion.div style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}>
            <motion.div
              animate={reduce ? undefined : { y: [0, -14, 0] }}
              transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
            >
              <PhoneMockup />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* verification chips strip (under the hero, not inside it) */}
      <div className="mx-auto mt-14 flex max-w-6xl flex-wrap items-center justify-center gap-3 px-5 lg:justify-start">
        {[
          { icon: Wifi, label: "Wi-Fi verified" },
          { icon: Smartphone, label: "Device bound" },
          { icon: Clock, label: "Time enforced" },
        ].map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.02] px-3.5 py-1.5 text-xs font-medium text-muted"
          >
            <Icon size={13} className="text-sky" />
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}
