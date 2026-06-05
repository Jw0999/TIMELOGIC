"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Mail, Phone, MapPin, Loader2, Check, Download, MonitorDown, ArrowRight } from "lucide-react";
import { CONTACT, DOWNLOADS } from "@/lib/site";
import { EASE, fadeUp, inView, stagger } from "@/lib/motion";

type Status = "idle" | "submitting" | "success" | "error";

const TEAM_SIZES = ["1 - 25", "26 - 100", "101 - 500", "501 - 2,000", "2,000+"];

export function Contact() {
  const reduce = useReducedMotion();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const org = String(data.get("org") || "").trim();

    if (!name || !email || !org) {
      setError("Please fill in your name, work email, and organization.");
      setStatus("error");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid work email address.");
      setStatus("error");
      return;
    }

    setError("");
    setStatus("submitting");
    try {
      // Wire this to your backend / email service. Simulated for the static site.
      await new Promise((r) => setTimeout(r, 1200));
      setStatus("success");
    } catch {
      setError("Something went wrong. Please try again, or email us directly.");
      setStatus("error");
    }
  }

  const inputCls =
    "w-full rounded-xl border border-line bg-white/[0.03] px-4 py-3 text-sm text-fg placeholder-faint outline-none transition focus:border-brand/50 focus:ring-2 focus:ring-brand/30";
  const labelCls = "mb-1.5 block text-xs font-semibold text-muted";

  return (
    <section id="contact" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
          {/* left: pitch + details */}
          <motion.div
            variants={stagger(0, 0.08)}
            initial={reduce ? false : "hidden"}
            whileInView="show"
            viewport={inView}
          >
            <motion.span variants={fadeUp} className="text-xs font-semibold uppercase tracking-[0.18em] text-sky">
              Get started
            </motion.span>
            <motion.h2 variants={fadeUp} className="mt-3 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
              Bring TimeLogic to your organization.
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 max-w-md text-[15.5px] leading-relaxed text-muted">
              Tell us about your team and we will get you set up. Or download the apps and start today.
            </motion.p>

            <motion.ul variants={fadeUp} className="mt-8 space-y-3">
              {[
                { icon: Mail, label: CONTACT.email, href: `mailto:${CONTACT.email}` },
                { icon: Phone, label: CONTACT.phone, href: `tel:${CONTACT.phone.replace(/\s/g, "")}` },
                { icon: MapPin, label: CONTACT.region, href: null },
              ].map(({ icon: Icon, label, href }) => {
                const inner = (
                  <span className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.04] ring-1 ring-line">
                      <Icon size={16} className="text-sky" />
                    </span>
                    <span className="text-sm font-medium text-fg">{label}</span>
                  </span>
                );
                return (
                  <li key={label}>
                    {href ? (
                      <a href={href} className="inline-block transition-opacity hover:opacity-80">
                        {inner}
                      </a>
                    ) : (
                      inner
                    )}
                  </li>
                );
              })}
            </motion.ul>

            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
              <a
                href={DOWNLOADS.android.href ?? "#"}
                className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-[13px] font-semibold text-white transition-transform active:scale-95"
              >
                <Download size={14} /> Download Android
              </a>
              <a
                href="#platforms"
                className="inline-flex items-center gap-2 rounded-full glass px-4 py-2.5 text-[13px] font-semibold text-fg transition-colors hover:bg-white/[0.06]"
              >
                <MonitorDown size={14} /> Download Desktop
              </a>
            </motion.div>
          </motion.div>

          {/* right: form */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={inView}
            transition={{ duration: 0.7, ease: EASE }}
            className="card p-6 sm:p-8"
          >
            <AnimatePresence mode="wait">
              {status === "success" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex min-h-[420px] flex-col items-center justify-center text-center"
                >
                  <motion.span
                    initial={reduce ? false : { scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    className="grid h-16 w-16 place-items-center rounded-full bg-emerald-400/15 ring-1 ring-emerald-400/30"
                  >
                    <Check size={30} className="text-emerald-400" />
                  </motion.span>
                  <h3 className="mt-5 text-xl font-bold text-fg">Request received</h3>
                  <p className="mt-2 max-w-xs text-sm text-muted">
                    Thanks for reaching out. Our team will get back to you shortly at the email you provided.
                  </p>
                  <button
                    onClick={() => setStatus("idle")}
                    className="mt-6 text-sm font-semibold text-sky hover:opacity-80"
                  >
                    Send another message
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={onSubmit}
                  noValidate
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                >
                  <div className="sm:col-span-1">
                    <label htmlFor="name" className={labelCls}>Name</label>
                    <input id="name" name="name" autoComplete="name" placeholder="Amara Okafor" className={inputCls} />
                  </div>
                  <div className="sm:col-span-1">
                    <label htmlFor="email" className={labelCls}>Work email</label>
                    <input id="email" name="email" type="email" autoComplete="email" placeholder="amara@company.com" className={inputCls} />
                  </div>
                  <div className="sm:col-span-1">
                    <label htmlFor="org" className={labelCls}>Organization</label>
                    <input id="org" name="org" placeholder="Company name" className={inputCls} />
                  </div>
                  <div className="sm:col-span-1">
                    <label htmlFor="size" className={labelCls}>Team size</label>
                    <select id="size" name="size" className={inputCls} defaultValue={TEAM_SIZES[1]}>
                      {TEAM_SIZES.map((s) => (
                        <option key={s} value={s} className="bg-surface">{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="message" className={labelCls}>Message</label>
                    <textarea id="message" name="message" rows={4} placeholder="Tell us about your attendance needs." className={`${inputCls} resize-none`} />
                  </div>

                  {status === "error" && (
                    <p className="sm:col-span-2 text-[13px] font-medium text-red-400">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_40px_-12px_rgba(37,99,235,0.7)] transition-transform active:scale-[0.99] disabled:opacity-70"
                  >
                    {status === "submitting" ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Sending…
                      </>
                    ) : (
                      <>
                        Send request
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
