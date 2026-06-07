"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  Smartphone, MonitorDown, Apple, Laptop, Cloud, Download, Bell, ArrowRight,
} from "lucide-react";
import { DOWNLOADS } from "@/lib/site";
import { EASE, fadeUp, inView, stagger } from "@/lib/motion";

export function Platforms() {
  const reduce = useReducedMotion();

  return (
    <section id="platforms" className="relative overflow-hidden py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[360px] w-[820px] -translate-x-1/2 rounded-full glow-radial opacity-25 blur-[70px]" />
      </div>

      <div className="mx-auto max-w-6xl px-5">
        <motion.div
          variants={stagger(0, 0.08)}
          initial={reduce ? false : "hidden"}
          whileInView="show"
          viewport={inView}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.span variants={fadeUp} className="text-xs font-semibold uppercase tracking-[0.18em] text-sky">
            Platforms
          </motion.span>
          <motion.h2 variants={fadeUp} className="mt-3 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            One system, every screen.
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-[15.5px] leading-relaxed text-muted">
            Employees check in on the go. Admins run the show from the desktop. Everything stays in sync, live.
          </motion.p>
        </motion.div>

        {/* platform cards */}
        <motion.div
          variants={stagger(0.05, 0.1)}
          initial={reduce ? false : "hidden"}
          whileInView="show"
          viewport={inView}
          className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {/* Android */}
          <motion.div variants={fadeUp} className="card relative overflow-hidden p-6 transition-transform duration-300 hover:-translate-y-1.5">
            <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full glow-radial opacity-40 blur-2xl" />
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/15 ring-1 ring-brand/25">
              <Smartphone size={22} className="text-sky" />
            </span>
            <p className="mt-5 inline-flex rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-emerald-400">
              Available
            </p>
            <h3 className="mt-2 text-lg font-bold text-fg">Android</h3>
            <p className="text-xs text-faint">Employee app</p>
            <p className="mt-3 text-[13px] leading-relaxed text-muted">
              Check in and out, run breaks, request leave, and track your status and history.
            </p>
            <a
              href={DOWNLOADS.android.href ?? "#"}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-[13px] font-semibold text-white transition-transform active:scale-95"
            >
              <Download size={14} /> Download
            </a>
          </motion.div>

          {/* Desktop */}
          <motion.div variants={fadeUp} className="card relative overflow-hidden p-6 transition-transform duration-300 hover:-translate-y-1.5">
            <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full glow-radial opacity-40 blur-2xl" />
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/15 ring-1 ring-brand/25">
              <MonitorDown size={22} className="text-sky" />
            </span>
            <p className="mt-5 inline-flex rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-emerald-400">
              Available
            </p>
            <h3 className="mt-2 text-lg font-bold text-fg">Desktop</h3>
            <p className="text-xs text-faint">Admin app · Windows & Linux</p>
            <p className="mt-3 text-[13px] leading-relaxed text-muted">
              Sessions, employees, devices, leave approvals, live fraud alerts, and exports.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href={DOWNLOADS.windows.href ?? "#"} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-3.5 py-2 text-[12.5px] font-semibold text-fg ring-1 ring-line transition-colors hover:bg-white/[0.08]">
                <MonitorDown size={13} /> Windows
              </a>
              <a href={DOWNLOADS.linux.href ?? "#"} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-3.5 py-2 text-[12.5px] font-semibold text-fg ring-1 ring-line transition-colors hover:bg-white/[0.08]">
                <Laptop size={13} /> Linux
              </a>
            </div>
          </motion.div>

          {/* iOS — coming soon */}
          <ComingSoon icon={Apple} title="iOS" sub="Employee app" reduce={reduce} />
          {/* macOS — coming soon */}
          <ComingSoon icon={Apple} title="macOS" sub="Admin app" reduce={reduce} />
        </motion.div>

        {/* sync strip */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={inView}
          transition={{ duration: 0.7, ease: EASE }}
          className="card mt-6 flex flex-col items-center justify-between gap-6 p-6 sm:flex-row sm:p-8"
        >
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-bold text-fg">Cloud backend. Real-time sync.</h3>
            <p className="mt-1.5 max-w-md text-[13.5px] leading-relaxed text-muted">
              Every check-in, break, and approval flows through a secure, always-on backend, so the
              phone and desktop apps stay in sync the instant anything changes.
            </p>
          </div>

          {/* phone <-> cloud <-> desktop visual */}
          <div className="flex items-center gap-3">
            <SyncNode icon={Smartphone} />
            <SyncWire reduce={reduce} />
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/15 ring-1 ring-brand/30">
              <Cloud size={24} className="text-sky" />
            </span>
            <SyncWire reduce={reduce} reverse />
            <SyncNode icon={MonitorDown} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ComingSoon({
  icon: Icon,
  title,
  sub,
  reduce,
}: {
  icon: React.ElementType;
  title: string;
  sub: string;
  reduce: boolean | null;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="relative overflow-hidden rounded-[20px] border border-dashed border-line bg-white/[0.012] p-6"
    >
      <span className="absolute right-4 top-4 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-faint">
        Coming soon
      </span>
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.03] ring-1 ring-line">
        <Icon size={22} className="text-faint" />
      </span>
      <h3 className="mt-7 text-lg font-bold text-muted">{title}</h3>
      <p className="text-xs text-faint">{sub}</p>
      <p className="mt-3 text-[13px] leading-relaxed text-faint">
        In active development. Get notified the moment it ships.
      </p>
      <button className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/[0.03] px-4 py-2 text-[13px] font-semibold text-muted ring-1 ring-line">
        <Bell size={13} /> Notify me
      </button>
    </motion.div>
  );
}

function SyncNode({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.04] ring-1 ring-line">
      <Icon size={20} className="text-muted" />
    </span>
  );
}

function SyncWire({ reduce, reverse }: { reduce: boolean | null; reverse?: boolean }) {
  return (
    <span className="relative hidden h-px w-10 bg-line sm:block">
      {!reduce && (
        <motion.span
          className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-sky shadow-[0_0_8px_2px_rgba(96,165,250,0.6)]"
          initial={{ left: reverse ? "100%" : "0%" }}
          animate={{ left: reverse ? "0%" : "100%" }}
          transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity, repeatType: "loop" }}
        />
      )}
    </span>
  );
}
