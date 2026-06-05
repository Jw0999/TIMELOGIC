"use client";

import { motion, useReducedMotion } from "motion/react";
import { Download } from "lucide-react";
import { NAV, DOWNLOADS } from "@/lib/site";
import { EASE, inView } from "@/lib/motion";
import { Logo, Wordmark } from "./ui/Logo";

export function Footer() {
  const reduce = useReducedMotion();
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-line bg-base/60">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* brand */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="relative grid h-11 w-11 place-items-center">
                {!reduce && (
                  <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90" fill="none">
                    <motion.circle
                      cx="24" cy="24" r="21"
                      stroke="var(--color-brand)" strokeWidth="1.6" strokeLinecap="round"
                      pathLength={1}
                      initial={{ pathLength: 0, opacity: 0.3 }}
                      whileInView={{ pathLength: 1, opacity: 1 }}
                      viewport={inView}
                      transition={{ duration: 1.4, ease: EASE }}
                    />
                  </svg>
                )}
                <Logo size={26} />
              </span>
              <Wordmark className="text-lg font-bold" />
            </div>
            <p className="mt-4 max-w-xs text-sm text-muted">Attendance you can trust.</p>
          </div>

          {/* nav */}
          <FooterCol title="Navigate">
            {NAV.map((n) => (
              <a key={n.id} href={`#${n.id}`} className="block py-1.5 text-sm text-muted transition-colors hover:text-fg">
                {n.label}
              </a>
            ))}
          </FooterCol>

          {/* downloads */}
          <FooterCol title="Download">
            <FooterDownload label="Android" href={DOWNLOADS.android.href} />
            <FooterDownload label="Desktop · Windows" href={DOWNLOADS.windows.href} />
            <FooterDownload label="Desktop · Linux" href={DOWNLOADS.linux.href} />
            <span className="flex items-center gap-2 py-1.5 text-sm text-faint">iOS <Soon /></span>
            <span className="flex items-center gap-2 py-1.5 text-sm text-faint">macOS <Soon /></span>
          </FooterCol>

          {/* legal */}
          <FooterCol title="Legal">
            <a href="#" className="block py-1.5 text-sm text-muted transition-colors hover:text-fg">Privacy</a>
            <a href="#" className="block py-1.5 text-sm text-muted transition-colors hover:text-fg">Terms</a>
          </FooterCol>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 sm:flex-row">
          <p className="text-xs text-faint">© {year} TimeLogic. All rights reserved.</p>
          <p className="text-xs text-faint">Built for teams that need proof, not promises.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-faint">{title}</p>
      {children}
    </div>
  );
}

function FooterDownload({ label, href }: { label: string; href: string | null }) {
  return (
    <a
      href={href ?? "#"}
      className="flex items-center gap-2 py-1.5 text-sm text-muted transition-colors hover:text-fg"
    >
      <Download size={13} className="text-sky" /> {label}
    </a>
  );
}

function Soon() {
  return (
    <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-faint">
      Soon
    </span>
  );
}
