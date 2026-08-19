---
title: How It's Clean
tags: [engineering, quality, architecture]
---

# ⭐ How It's Clean

> [!abstract] The pitch
> The codebase is **organized by responsibility, not by accident.** Every layer has one job, configuration lives in one place, and the same design decisions are reused across every surface.

## 1. Clean layered backend
`Route → Middleware → Controller → Service → Prisma`
- **Thin controllers, fat services** — controllers just translate HTTP; all logic lives in named services (`AttendanceService`, `FraudDetectionEngine`, …). → [[Architecture]]
- **Cross-cutting concerns isolated** as middleware: `auth`, `roleGuard` (RBAC), `rateLimiter`, `validate`, `upload`, `errorHandler`. None of that leaks into business logic.
- **One data contract** — the Prisma schema is the single source of truth; migrations track every change. → [[Data Model]]

## 2. Separation by audience
Each surface is its own focused app — employee (Android + PWA), admin (Desktop), platform owner (Super-Admin web), public (Marketing). No "god component" trying to be everything. → [[User Roles]]

## 3. Single source of truth for config
- Marketing copy, links, stats → one `lib/site.ts`.
- Theme/colors → **CSS-variable design tokens** defined once; light/dark and every screen derive from them.
- Mobile palette → one `constants/theme.ts` mirrored exactly by the PWA, so the two employee apps stay visually identical.

## 4. DRY across platforms
The PWA was rebuilt to **mirror the Android app** from the same design tokens and component structure — one design language, two runtimes, no divergence.

## 5. Security as a first-class layer
Verification isn't sprinkled through controllers — it's centralized in the attendance service as explicit **Layer 1/2/3** checks, plus a dedicated fraud engine. → [[The 3-Layer Verification]]

## 6. Self-healing & self-running
- Office public IP **auto-learned** (no manual upkeep at any scale).
- Sessions **auto-open/auto-close**; late logic runs on a scheduler.
- PWA service worker is **network-first + auto-update** (no stale-cache bugs).

## 7. Multi-tenant safety by construction
Every query is **scoped by `orgId`**; tenant isolation is enforced at the data layer, not left to UI.

## 8. Discipline
- **No dead/unused code** policy — removed legacy components when superseded.
- Consistent **TypeScript** + Tailwind conventions across web surfaces.
- **Never delete data** — soft deletes + permanent audit trail. → [[Anti-Cheat & Fraud]]

> [!tip] One-liner for the slide
> "Predictable layers, one source of truth per concern, and the same design reused everywhere — so it's easy to read, safe to change, and ready to scale."

Related: [[Architecture]] · [[Tech Stack]] · [[MVP Scope]]
