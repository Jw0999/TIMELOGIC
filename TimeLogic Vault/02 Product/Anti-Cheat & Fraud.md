---
title: Anti-Cheat & Fraud
tags: [product, security, fraud]
---

# Anti-Cheat & Fraud

Beyond the [[The 3-Layer Verification|3-layer check-in]], a live engine watches for abuse and a strict data policy keeps everything auditable.

## 🚨 Live fraud detection
The backend's **Fraud Detection Engine** raises real-time alerts for:
- **Off-network breaks** — went on break but left the company network
- **Overstays** — break ran past its allowed maximum
- **Repeated failed check-ins** — many bad attempts in a row
- **Device mismatch** — attempt from a phone that isn't the bound device

Alerts have **severity** and a **status** (open / resolved / dismissed / escalated); admins triage from the desktop app.

## 🛡️ Built-in protections
- **Screenshot / screen-record blocking** in the employee app — protects one-time codes and data.
- **One device per account** — see Layer 2 of [[The 3-Layer Verification]].
- **Time-boxed codes** — Layer 3; replays are useless.
- **Sessions lock after opening time** — no quietly back-dating attendance.
- **Anti-late logic** — present-by-(open − grace) else marked LATE, driven by login/desktop ping + scheduler.
- **Emergency stop-all** — an admin can freeze attendance org-wide instantly.

## 🗂️ Data integrity
> [!success] Nothing is ever deleted
> Terminating an employee is a **soft delete** — they can no longer log in, but **all their records are preserved** and remain visible to the Super Admin. Every session is kept permanently. Full Excel/CSV export.

## Talking point
> "Security isn't a feature we added — it **is** the product. Every other attendance tool treats verification as optional. We treat a check-in as guilty until proven present."

Related: [[The 3-Layer Verification]] · [[Problem & Solution]] · [[Data Model]]
