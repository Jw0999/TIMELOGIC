"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { EASE } from "@/lib/motion";
import { Logo, Wordmark } from "./ui/Logo";

/**
 * Full-screen navy intro. The clock mark scales in, a blue ring sweeps around
 * it, the wordmark fades up, then the whole loader lifts away to reveal the
 * page. Plays once per full page load. Locks scroll while visible.
 */
export function IntroLoader() {
  const [done, setDone] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => setDone(true), reduce ? 700 : 2200);
    return () => clearTimeout(t);
  }, [reduce]);

  return (
    <AnimatePresence onExitComplete={() => (document.body.style.overflow = "")}>
      {!done && (
        <motion.div
          key="loader"
          className="fixed inset-0 z-[100] grid place-items-center bg-ink"
          initial={{ opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -30 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          {/* ambient glow */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full glow-radial opacity-50 blur-2xl" />

          <div className="relative flex flex-col items-center">
            <div className="relative grid h-28 w-28 place-items-center">
              {/* sweeping ring */}
              {!reduce && (
                <svg
                  viewBox="0 0 120 120"
                  className="absolute inset-0 h-full w-full -rotate-90"
                  fill="none"
                >
                  <circle cx="60" cy="60" r="54" stroke="rgba(148,173,230,0.12)" strokeWidth="2" />
                  <motion.circle
                    cx="60"
                    cy="60"
                    r="54"
                    stroke="var(--color-brand)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    pathLength={1}
                    initial={{ pathLength: 0, opacity: 0.2 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.4, ease: EASE }}
                  />
                </svg>
              )}

              {/* logo */}
              <motion.div
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease: EASE }}
              >
                <Logo size={56} />
              </motion.div>
            </div>

            <motion.div
              className="mt-6 text-2xl font-bold"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: reduce ? 0 : 0.5 }}
            >
              <Wordmark />
            </motion.div>

            {/* loading bar */}
            {!reduce && (
              <div className="mt-6 h-[3px] w-32 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full w-full rounded-full bg-gradient-to-r from-brand to-sky"
                  initial={{ x: "-100%" }}
                  animate={{ x: "0%" }}
                  transition={{ duration: 1.8, ease: EASE }}
                />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
