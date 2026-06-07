"use client";

import { motion, useReducedMotion } from "motion/react";
import { STATS } from "@/lib/site";
import { fadeUp, inView, stagger } from "@/lib/motion";
import { CountUp } from "./ui/CountUp";

export function Achievements() {
  const reduce = useReducedMotion();

  return (
    <section id="achievements" className="section-light relative overflow-hidden py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5">
        <motion.div
          variants={stagger(0, 0.08)}
          initial={reduce ? false : "hidden"}
          whileInView="show"
          viewport={inView}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.span variants={fadeUp} className="text-xs font-semibold uppercase tracking-[0.18em] text-sky">
            By the numbers
          </motion.span>
          <motion.h2 variants={fadeUp} className="mt-3 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            Why teams choose TimeLogic.
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-[15.5px] leading-relaxed text-muted">
            Security, reliability, and control, proven where it counts.
          </motion.p>
        </motion.div>

        <motion.ul
          variants={stagger(0.05, 0.07)}
          initial={reduce ? false : "hidden"}
          whileInView="show"
          viewport={inView}
          className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {STATS.map((s) => (
            <motion.li
              key={s.label}
              variants={fadeUp}
              className="card relative overflow-hidden p-7"
            >
              <div className="absolute -right-10 -top-12 h-28 w-28 rounded-full glow-radial opacity-25 blur-2xl" />
              <p className="text-4xl font-extrabold tracking-tight text-fg sm:text-5xl">
                <CountUp value={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-3 text-[15px] font-semibold text-fg">{s.label}</p>
              <p className="mt-1 text-[13px] text-muted">{s.sub}</p>
              <div className="mt-5 h-px w-full bg-gradient-to-r from-brand/40 to-transparent" />
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
