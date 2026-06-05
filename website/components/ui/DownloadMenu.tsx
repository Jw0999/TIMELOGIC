"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, Download, Smartphone, MonitorDown, Apple, Laptop } from "lucide-react";
import { DOWNLOADS, type DownloadKey } from "@/lib/site";

const ICONS: Record<DownloadKey, React.ElementType> = {
  android: Smartphone,
  windows: MonitorDown,
  linux: Laptop,
  ios: Apple,
  mac: Apple,
};

const ORDER: DownloadKey[] = ["android", "windows", "linux", "ios", "mac"];

export function DownloadMenu({ align = "left" }: { align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="group inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_30px_-8px_rgba(37,99,235,0.7)] transition-transform active:scale-[0.97]"
      >
        <Download size={16} className="opacity-90" />
        <span className="hidden sm:inline">Download</span>
        <ChevronDown
          size={15}
          className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className={`absolute top-[calc(100%+10px)] z-50 w-64 overflow-hidden rounded-2xl glass p-1.5 shadow-card ${
              align === "right" ? "right-0" : "left-0"
            }`}
          >
            {ORDER.map((key) => {
              const item = DOWNLOADS[key];
              const Icon = ICONS[key];
              const platformLabel =
                key === "windows" || key === "linux" ? `Desktop · ${item.label}` : item.label;

              if (!item.available) {
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 opacity-55"
                  >
                    <span className="flex items-center gap-3">
                      <Icon size={17} className="text-faint" />
                      <span className="text-sm font-medium text-muted">{platformLabel}</span>
                    </span>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-faint">
                      Soon
                    </span>
                  </div>
                );
              }

              return (
                <a
                  key={key}
                  role="menuitem"
                  href={item.href ?? "#"}
                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.05]"
                  onClick={() => setOpen(false)}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={17} className="text-sky" />
                    <span className="text-sm font-medium text-fg">{platformLabel}</span>
                  </span>
                  <Download size={14} className="text-faint" />
                </a>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
