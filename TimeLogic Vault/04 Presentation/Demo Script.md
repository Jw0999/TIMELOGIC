---
title: Demo Script
tags: [presentation, demo]
---

# Demo Script

> [!warning] Before you start
> - Rotate the Super-Admin password if showing publicly.
> - Have the **Desktop admin app** open and the **employee app** (Android or PWA) ready.
> - Be on the **office Wi-Fi** (or the network whose IP/SSID the org is set to) — Layer 1 will block you otherwise (that's the point!).
> - Pre-create an org + one employee so you're not typing during the talk.

## 🎬 Flow (≈4 minutes)

### 1. Super-Admin (the god view) — 30s
Open https://timelogic.pages.dev → log in.
- Show **organizations** list and creating/editing an org with its **office public IP**.
- Mention: "This is the platform owner view — every org, fully isolated." → [[User Roles]]

### 2. Admin opens the day — 30s
In the **Desktop app**:
- Start an **attendance session**.
- Show the **Employees** tab; point out **Reset device** 📱 (for new phones).

### 3. Employee checks in — the money shot — 90s
On the phone app:
- Tap **Check In** → app fetches the session → backend issues a **one-time code** → enter it → ✅ **Present**.
- Narrate the 3 layers as it happens: "on the network ✓, my registered device ✓, live code ✓." → [[The 3-Layer Verification]]

> [!example] Prove it's real (optional, powerful)
> Turn Wi-Fi **off** (mobile data) and try again → **rejected**. "Clocking in from home is impossible."

### 4. Breaks & leave — 30s
- Start a **break** → live timer; mention overstay/off-network flags.
- Submit a **leave** request → switch to desktop → **approve** it.

### 5. Oversight — 20s
- Desktop: show **fraud alerts** and that **reports export** to Excel/CSV. "Nothing is ever deleted." → [[Anti-Cheat & Fraud]]

### 6. Theme flourish — 10s
- Employee app → **Profile → Appearance** → toggle **light/dark**. "Matches the Android app exactly."

## 🆘 If something fails
- **Check-in rejected?** You're off the configured network — that's Layer 1 working. Switch to the right Wi-Fi.
- **No active session?** Start one in the desktop app (expected gate, not a bug).
- **Phone won't update (PWA)?** Reinstall from Safari (Add to Home Screen) — SW is network-first now.

Related: [[Slide Deck Outline]] · [[Platforms & Download Links]] · [[Q&A Prep]]
