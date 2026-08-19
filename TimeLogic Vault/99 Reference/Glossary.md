---
title: Glossary
tags: [reference, glossary]
---

# Glossary

- **Buddy punching** — a coworker clocks you in/out while you're absent. Beaten by [[The 3-Layer Verification|device binding]].
- **Challenge code** — short-lived, one-time code required to check in (Layer 3). Defeats replays/scripts.
- **Device binding** — locking an account to one phone (`RegisteredDevice.deviceFingerprint`). → [[Data Model]]
- **Fraud alert** — a flag raised by the Fraud Detection Engine (off-network break, overstay, repeat failures, device mismatch). → [[Anti-Cheat & Fraud]]
- **Office public IP** — the office network's internet IP; used to verify iPhone/web check-ins. **Auto-learned** from Wi-Fi-verified Android check-ins.
- **PWA** — Progressive Web App; the installable iOS/web employee app. → [[Platforms & Download Links]]
- **RBAC** — role-based access control (SUPER_ADMIN / ADMIN / EMPLOYEE). → [[User Roles]]
- **Reset device** — admin action clearing an employee's bound device so a new phone can be registered.
- **Session** — a dated attendance window for an org; opens (auto) at the opening time, auto-checks-out at close. → [[Features]]
- **SSID** — the Wi-Fi network name; Android's Layer 1 network check.
- **Soft delete** — marking a record/employee inactive instead of deleting; preserves the audit trail.
- **Tenant / multi-tenant** — one backend serving many isolated organizations, scoped by `orgId`. → [[Architecture]]

Related: [[Home]]
