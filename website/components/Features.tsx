"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Wifi, Smartphone, Clock, CalendarClock, Gauge, Coffee, LogOut,
  Umbrella, ShieldAlert, EyeOff, FileDown, Building2, ArrowRight, type LucideIcon,
} from "lucide-react";
import { FEATURES } from "@/lib/site";
import { EASE, fadeUp, inView, stagger } from "@/lib/motion";

const ICONS: Record<string, LucideIcon> = {
  wifi: Wifi, smartphone: Smartphone, clock: Clock, calendar: CalendarClock,
  gauge: Gauge, coffee: Coffee, logout: LogOut, umbrella: Umbrella,
  shield: ShieldAlert, eyeoff: EyeOff, filedown: FileDown, building: Building2,
};

function Spotlight({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }
  return (
    <div ref={ref} onPointerMove={onMove} className={`group relative overflow-hidden ${className ?? ""}`}>
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(300px circle at var(--mx) var(--my), rgba(37,99,235,0.16), transparent 62%)",
        }}
      />
      {children}
    </div>
  );
}

const securityLayers = FEATURES.filter((f) => "layer" in f).slice(0, 3);
const rest = FEATURES.filter((f) => !("layer" in f));

export function Features() {
  const reduce = useReducedMotion();

  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5">
        {/* header */}
        <motion.div
          variants={stagger(0, 0.08)}
          initial={reduce ? false : "hidden"}
          whileInView="show"
          viewport={inView}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.span
            variants={fadeUp}
            className="text-xs font-semibold uppercase tracking-[0.18em] text-sky"
          >
            Security by design
          </motion.span>
          <motion.h2
            variants={fadeUp}
            className="mt-3 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl"
          >
            Built so no one can game the system.
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-[15.5px] leading-relaxed text-muted">
            Every check-in passes three independent checks before it counts.
          </motion.p>
        </motion.div>

        {/* 3-layer verification story */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={inView}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative mt-14"
        >
          <Spotlight className="card p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-2">
              <span className="rounded-full bg-sky/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-sky">
                3 layers
              </span>
              <p className="text-sm font-medium text-muted">All three must pass, or it does not count.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {securityLayers.map((f, i) => {
                const Icon = ICONS[f.icon];
                return (
                  <div key={f.title} className="relative">
                    <div className="rounded-2xl border border-line bg-white/[0.02] p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand/15 ring-1 ring-brand/25">
                          <Icon size={20} className="text-sky" />
                        </span>
                        <span className="font-mono text-xs text-faint">0{i + 1}</span>
                      </div>
                      <h3 className="text-base font-bold text-fg">{f.title}</h3>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{f.body}</p>
                    </div>
                    {/* connector arrow between layers */}
                    {i < securityLayers.length - 1 && (
                      <span className="absolute -right-3.5 top-1/2 z-10 hidden -translate-y-1/2 text-faint md:block">
                        <ArrowRight size={18} />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </Spotlight>
        </motion.div>

        {/* remaining features bento */}
        <motion.ul
          variants={stagger(0.05, 0.06)}
          initial={reduce ? false : "hidden"}
          whileInView="show"
          viewport={inView}
          className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {rest.map((f) => {
            const Icon = ICONS[f.icon];
            return (
              <motion.li key={f.title} variants={fadeUp}>
                <Spotlight className="card h-full p-5 transition-transform duration-300 hover:-translate-y-1">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.04] ring-1 ring-line transition-colors group-hover:ring-brand/30">
                    <Icon size={18} className="text-sky" />
                  </span>
                  <h3 className="mt-4 text-[15px] font-bold text-fg">{f.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{f.body}</p>
                </Spotlight>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </section>
  );
}
