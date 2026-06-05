import type { Variants, Transition } from "motion/react";

// One easing + spring vocabulary shared across the whole site.
export const EASE = [0.16, 1, 0.3, 1] as const;

export const spring: Transition = {
  type: "spring",
  stiffness: 220,
  damping: 26,
  mass: 0.8,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.8, ease: EASE } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 18 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export const stagger = (delayChildren = 0.05, staggerChildren = 0.08): Variants => ({
  hidden: {},
  show: { transition: { delayChildren, staggerChildren } },
});

// Standard in-view viewport config (reveal once, when ~25% visible).
export const inView = { once: true, amount: 0.25 } as const;
