---
title: MVP Scope
tags: [overview, mvp, scope]
---

# MVP Scope

> [!note] What "MVP" means here
> Not a prototype — a **working, deployed, multi-platform product** with the full core loop live in production. This is a shipped MVP.

## ✅ In the MVP (built & live)
**Core attendance loop**
- Secure check-in / check-out with the [[The 3-Layer Verification|3-layer verification]]
- Time-based one-time **challenge codes** (anti-automation)
- Automatic **sessions** (auto-open at opening time, auto-checkout at close)
- Configurable **late / grace / penalty** rules per organization

**Around the loop**
- **Breaks** — per-department policies, max durations, return checks
- **Leave** — requests, approvals, per-type balances
- **Device binding** — one phone per employee + **admin device reset** for new phones
- **Fraud alerts** — live flags for off-network breaks, overstays, repeat failures, device mismatch
- **Reports** — full history, Excel/CSV export, nothing deleted
- **Multi-tenant** — hundreds of orgs, fully isolated (org → office → department → user)

**Surfaces (5 live)** — see [[Platforms & Download Links]]
- 📱 Android employee app
- 🍏 iOS / Web **PWA** employee app (light + dark theme, matches Android)
- 🖥️ Desktop **admin** app (Windows + Linux)
- 🛡️ **Super-Admin** web console
- 🌐 Marketing website

## 🔜 Coming next (out of MVP)
- Native **iOS** app and **macOS** admin app
- Payroll integrations / SSO
- Advanced analytics dashboards
- Push notifications at scale

## 🧭 Guiding principles
- **Honesty first** — security/verification is the product, not a feature.
- **Self-running** — automate the boring admin work.
- **Never lose data** — soft-deletes only; full audit trail.
- **Clean codebase** — see [[How It's Clean]].

Related: [[Features]] · [[Architecture]] · [[Slide Deck Outline]]
