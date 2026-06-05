"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { Menu, X } from "lucide-react";
import { NAV } from "@/lib/site";
import { BrandLockup } from "./ui/Logo";
import { DownloadMenu } from "./ui/DownloadMenu";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("hero");
  const [menuOpen, setMenuOpen] = useState(false);
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 16));

  // Scroll-spy via IntersectionObserver (no scroll listeners).
  useEffect(() => {
    const sections = NAV.map((n) => document.getElementById(n.id)).filter(
      Boolean
    ) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3 sm:pt-4">
      <nav
        className={`flex w-full max-w-6xl items-center justify-between gap-4 rounded-2xl px-3 transition-all duration-300 sm:px-4 ${
          scrolled ? "glass shadow-card py-2" : "border border-transparent bg-transparent py-3"
        }`}
      >
        {/* Brand */}
        <a href="#hero" aria-label="TimeLogic home" className="flex-shrink-0">
          <BrandLockup />
        </a>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={`relative inline-block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active === item.id ? "text-fg" : "text-muted hover:text-fg"
                }`}
              >
                {item.label}
                {active === item.id && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-sky"
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </a>
            </li>
          ))}
        </ul>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          <DownloadMenu align="right" />
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="grid h-10 w-10 place-items-center rounded-xl text-fg ring-1 ring-line lg:hidden"
          >
            <Menu size={20} />
          </button>
        </div>
      </nav>

      {/* Mobile slide-in */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="overlay"
            className="fixed inset-0 z-50 bg-black/60 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMenuOpen(false)}
          />
        )}
        {menuOpen && (
          <motion.aside
            key="panel"
            className="fixed right-0 top-0 z-50 flex h-full w-[82%] max-w-sm flex-col gap-1 bg-base p-5 shadow-2xl lg:hidden"
            initial={reduce ? { opacity: 0 } : { x: "100%" }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
          >
              <div className="mb-6 flex items-center justify-between">
                <BrandLockup />
                <button
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="grid h-10 w-10 place-items-center rounded-xl text-fg ring-1 ring-line"
                >
                  <X size={20} />
                </button>
              </div>
              {NAV.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-xl px-4 py-3 text-base font-medium ${
                    active === item.id ? "bg-white/5 text-fg" : "text-muted"
                  }`}
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-4">
                <DownloadMenu />
              </div>
            </motion.aside>
        )}
      </AnimatePresence>
    </header>
  );
}
