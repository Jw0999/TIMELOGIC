const { v4: uuidv4 } = require('uuid');
const { prisma } = require('../config/database');
const { redis, PREFIXES } = require('../config/redis');
const env = require('../config/env');
const logger = require('../config/logger');

const CHALLENGE_TTL_SECONDS = 120; // code valid for 2 minutes

class AttendanceService {
  // ── CHALLENGE (anti-automation) ───────────────────────────────────────────────
  // Step 1 of check-in: validate the Wi-Fi FIRST, then issue a short-lived random
  // code the employee must type back. If they're on the wrong network, no code is
  // issued — they're told to connect to the company Wi-Fi instead.
  async issueChallenge(employeeId, sessionId, ctx = {}) {
    // Session must exist and be active to issue a challenge
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true, status: true,
        office: { select: { id: true, wifiSSID: true, securitySettings: true } },
      },
    });
    if (!session || session.status !== 'ACTIVE') {
      return { success: false, reason: 'SESSION_CLOSED', message: 'No active attendance session. Ask your admin to start a session.' };
    }

    // Gate: must be on the company Wi-Fi BEFORE we reveal a code
    const wifi = this._checkWifi(session.office, ctx, employeeId);
    if (!wifi.ok) {
      return { success: false, reason: wifi.reason, message: wifi.message };
    }

    const code = String(Math.floor(100000 + Math.random() * 900000)); // random 6-digit
    const key = `${PREFIXES.CHALLENGE}${employeeId}`;
    const payload = JSON.stringify({ code, sessionId });
    try {
      await redis.set(key, payload, 'EX', CHALLENGE_TTL_SECONDS);
    } catch (err) {
      logger.error('Challenge store failed:', err.message);
      return { success: false, reason: 'CHALLENGE_REQUIRED', message: 'Could not start check-in. Try again.' };
    }
    return { success: true, code, expiresIn: CHALLENGE_TTL_SECONDS };
  }

  // Wi-Fi validation, shared by issueChallenge and the check-in pipeline.
  // Each office enforces ITS OWN configured SSID only — no global/cross-org fallback.
  _checkWifi(office, ctx, employeeId) {
    const settings = office?.securitySettings ?? {};
    const wifiRequired = settings.wifiRequired !== false; // default on
    if (!wifiRequired) return { ok: true, verified: false };

    const expected = (office?.wifiSSID || '').trim();
    // Wi-Fi is required but the org hasn't set its SSID yet → we cannot verify, so
    // we must NOT let anyone through. Admin has to set it in Security Settings.
    if (!expected) {
      return {
        ok: false, reason: 'WIFI_NOT_CONFIGURED',
        message: 'Your office Wi-Fi has not been set up yet. Please contact your administrator.',
      };
    }

    const got = (ctx.wifiSSID || '').trim();

    if (!got) {
      logger.warn(`WiFi: employee ${employeeId} sent no SSID (expected "${expected}")`);
      return {
        ok: false, reason: 'WIFI_REQUIRED',
        message: `Couldn't detect your Wi-Fi. Turn ON Location/GPS, grant location permission, and connect to "${expected}", then try again.`,
      };
    }
    if (got.toLowerCase() !== expected.toLowerCase()) {
      logger.warn(`WiFi mismatch: employee ${employeeId} on "${got}" but expected "${expected}"`);
      return {
        ok: false, reason: 'WIFI_MISMATCH',
        message: `You are connected to "${got}". Please connect to the company Wi-Fi "${expected}" to check in.`,
      };
    }
    return { ok: true, verified: true };
  }

  // ── WiFi HEARTBEAT ──────────────────────────────────────────────────────────
  // The app pings this periodically while the employee is clocked in. It tracks
  // live presence, and when someone on break returns to the office Wi-Fi it ends
  // the break automatically (the overstay sweep handles those who never return).
  async recordHeartbeat(employeeId, wifiSSID) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const record = await prisma.attendanceRecord.findFirst({
      where: { employeeId, date: today, clockInTime: { not: null }, clockOutTime: null },
      include: { session: { select: { id: true, office: { select: { wifiSSID: true } } } } },
    });
    if (!record) return { tracked: false, onWifi: null }; // not clocked in / already out

    const expected = (record.session?.office?.wifiSSID || '').trim();
    const got = (wifiSSID || '').trim();
    const onWifi = expected ? got.toLowerCase() === expected.toLowerCase() : !!got;

    // Live presence (ephemeral, 3-minute TTL)
    try {
      await redis.set(`${PREFIXES.PRESENCE}${employeeId}`,
        JSON.stringify({ onWifi, ssid: got || null, at: Date.now() }), 'EX', 180);
    } catch (_) { /* presence is best-effort */ }

    // On break AND back on the office Wi-Fi → end the break (returned legitimately)
    let breakEnded = false;
    if (onWifi) {
      const BreakService = require('./BreakService');
      const active = await BreakService.getActiveBreak(employeeId);
      if (active) {
        await BreakService.endBreak(employeeId, active.id, { wifiSSID: got });
        breakEnded = true;
      }
    }
    return { tracked: true, onWifi, breakEnded };
  }

  async _verifyChallenge(employeeId, sessionId, submittedCode) {
    const key = `${PREFIXES.CHALLENGE}${employeeId}`;
    let stored;
    try {
      stored = await redis.get(key);
    } catch (err) {
      logger.error('Challenge read failed:', err.message);
      return { ok: false, reason: 'CHALLENGE_REQUIRED', message: 'Could not verify your code. Try again.' };
    }
    if (!stored) {
      return { ok: false, reason: 'CHALLENGE_EXPIRED', message: 'Your check-in code expired. Tap Check In again to get a new code.' };
    }
    const { code, sessionId: challengeSession } = JSON.parse(stored);
    if (!submittedCode || String(submittedCode).trim() !== code || challengeSession !== sessionId) {
      return { ok: false, reason: 'CHALLENGE_FAILED', message: 'The code you entered is incorrect. Please try again.' };
    }
    // One-time use — consume it
    await redis.del(key).catch(() => {});
    return { ok: true };
  }

  // ── CHECK IN ────────────────────────────────────────────────────────────────
  async checkIn(employeeId, scanData) {
    const { sessionId, deviceId, wifiSSID, challengeCode, platform, model } = scanData;

    // Load session + office + security settings in one query
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true, status: true, startTime: true, endTime: true,
        office: {
          select: {
            id: true, name: true, wifiSSID: true, openTime: true,
            graceMinutes: true, lateAfterMinutes: true, gracePenalty: true, latePenalty: true,
            securitySettings: true,
          },
        },
      },
    });

    if (!session || session.status !== 'ACTIVE') {
      return { success: false, reason: 'SESSION_CLOSED' };
    }

    // ── Check-in window: open for CHECKIN_WINDOW_MIN after the session start ──
    const minsSinceStart = (Date.now() - session.startTime.getTime()) / 60000;
    if (minsSinceStart > env.CHECKIN_WINDOW_MIN) {
      return {
        success: false, reason: 'CHECKIN_CLOSED',
        message: `Check-in closed. The window was open for ${env.CHECKIN_WINDOW_MIN} minutes after the session started. You are marked absent for today.`,
      };
    }

    // Prevent duplicate check-in on same session/day
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const existing = await prisma.attendanceRecord.findFirst({
      where: { employeeId, sessionId, date: today },
    });
    if (existing?.clockInTime) {
      throw Object.assign(new Error('Already clocked in for this session today'), { status: 409 });
    }

    // ── STEP 0: Time-based challenge (anti-automation) ──
    const challenge = await this._verifyChallenge(employeeId, sessionId, challengeCode);
    if (!challenge.ok) {
      return { success: false, reason: challenge.reason, message: challenge.message };
    }

    // ── Verification pipeline (device binding → wifi) ──
    const ctx = { deviceId, wifiSSID, platform, model };
    const check = await this._verifyContext({
      employeeId,
      office: session.office,
      ctx,
      registerIfNew: true,
    });
    if (!check.ok) {
      return { success: false, reason: check.reason, message: check.message };
    }

    // ── Attendance rules: status + penalty ──
    const clockInTime = new Date();
    const { status, penalty } = this._computeStatusAndPenalty(clockInTime, session);

    // ── Persist the record ──
    const record = await prisma.attendanceRecord.upsert({
      where: { employeeId_sessionId_date: { employeeId, sessionId, date: today } },
      create: {
        id: uuidv4(), employeeId, sessionId, date: today, clockInTime,
        status, scanResult: 'VALID',
        wifiVerified: check.wifiVerified, deviceVerified: check.deviceVerified,
        deviceId: deviceId ?? null, wifiSSID: wifiSSID ?? null, penalty,
      },
      update: {
        clockInTime, status, scanResult: 'VALID',
        wifiVerified: check.wifiVerified, deviceVerified: check.deviceVerified,
        deviceId: deviceId ?? null, wifiSSID: wifiSSID ?? null, penalty,
      },
    });

    this._emit('attendance:checkin', { record, sessionId });
    return { success: true, record, status, penalty, clockInTime };
  }

  // ── CHECK OUT ─────────────────────────────────────────────────────────────────
  async checkOut(employeeId, sessionId, ctx = {}) {
    const today = new Date(); today.setHours(0, 0, 0, 0);

    // Resolve the record (sessionId optional)
    const record = await prisma.attendanceRecord.findFirst({
      where: { employeeId, ...(sessionId ? { sessionId } : {}), date: today },
      orderBy: { clockInTime: 'desc' },
      include: {
        session: {
          select: {
            id: true,
            office: {
              select: {
                id: true, name: true, wifiSSID: true,
                securitySettings: true,
              },
            },
          },
        },
      },
    });

    if (!record) throw Object.assign(new Error('No check-in record found for today'), { status: 404 });
    if (record.clockOutTime) throw Object.assign(new Error('Already clocked out'), { status: 409 });

    // ── Same device / wifi / geo enforcement on the way out ──
    const check = await this._verifyContext({
      employeeId,
      office: record.session.office,
      ctx,
      registerIfNew: false,
    });
    if (!check.ok) {
      const err = new Error(check.message);
      err.status = 403; err.reason = check.reason;
      throw err;
    }

    const clockOutTime = new Date();
    const workMs = clockOutTime - record.clockInTime;
    const totalWorkHours = parseFloat((workMs / 3600000).toFixed(2));

    const updated = await prisma.attendanceRecord.update({
      where: { id: record.id },
      data: { clockOutTime, totalWorkHours },
    });

    this._emit('attendance:checkout', { record: updated, sessionId: record.sessionId });
    return updated;
  }

  // ── Verification pipeline: Device Binding → Wi-Fi → Geo-fence ──────────────────
  async _verifyContext({ employeeId, office, ctx, registerIfNew }) {
    const settings = office?.securitySettings ?? {};
    let deviceVerified = false;
    let wifiVerified = false;

    // ── STEP 1: Device Binding ──
    const deviceBindingEnabled = settings.deviceBindingEnabled !== false; // default on
    if (deviceBindingEnabled) {
      if (!ctx.deviceId) {
        return { ok: false, reason: 'DEVICE_REQUIRED', message: 'Device identification is required to check in.' };
      }

      // Is this physical device already bound to a *different* employee?
      const boundElsewhere = await prisma.registeredDevice.findFirst({
        where: { deviceFingerprint: ctx.deviceId, isActive: true, employeeId: { not: employeeId } },
        select: { id: true },
      });
      if (boundElsewhere) {
        return { ok: false, reason: 'DEVICE_CONFLICT', message: 'This device is already assigned to another employee.' };
      }

      // Already registered to this employee?
      const mine = await prisma.registeredDevice.findFirst({
        where: { deviceFingerprint: ctx.deviceId, employeeId, isActive: true },
        select: { id: true },
      });

      if (mine) {
        await prisma.registeredDevice.update({ where: { id: mine.id }, data: { lastUsedAt: new Date() } });
        deviceVerified = true;
      } else if (registerIfNew) {
        // First time this employee uses this device → bind it (respect max devices)
        const maxDevices = settings.maxDevicesPerEmployee ?? 2;
        const activeCount = await prisma.registeredDevice.count({ where: { employeeId, isActive: true } });
        if (activeCount >= maxDevices) {
          return { ok: false, reason: 'DEVICE_LIMIT', message: `You have reached the maximum of ${maxDevices} registered devices. Contact your admin.` };
        }
        await prisma.registeredDevice.create({
          data: {
            id: uuidv4(), employeeId, deviceFingerprint: ctx.deviceId,
            platform: ctx.platform || 'unknown', model: ctx.model || null,
            isActive: true, lastUsedAt: new Date(),
          },
        });
        deviceVerified = true;
      } else {
        // Checkout / no auto-register: device must already be bound
        return { ok: false, reason: 'DEVICE_NOT_BOUND', message: 'This device is not registered to you. Check in first.' };
      }
    }

    // ── STEP 2: Wi-Fi Validation (re-checked here in case the network changed) ──
    const wifi = this._checkWifi(office, ctx, employeeId);
    if (!wifi.ok) return { ok: false, reason: wifi.reason, message: wifi.message };
    wifiVerified = wifi.verified;

    return { ok: true, deviceVerified, wifiVerified };
  }

  // ── Status + penalty from the ORGANIZATION's configured grace/late/penalty ─────
  // Lateness is measured from the official OPEN TIME (today), so it's consistent no
  // matter when the session was actually created. The penalty clock effectively
  // starts at openTime + graceMinutes (e.g. open 07:00 + grace 50 → penalties at 07:50).
  //  ≤ graceMinutes after open      → PRESENT, no penalty
  //  ≤ lateAfterMinutes after open  → PRESENT, gracePenalty (₦ off salary)
  //  > lateAfterMinutes after open  → LATE,    latePenalty  (₦ off salary)
  _computeStatusAndPenalty(clockInTime, session) {
    const o = session.office ?? {};
    const grace        = o.graceMinutes     ?? 30;
    const lateAfter    = o.lateAfterMinutes ?? 90;
    const gracePenalty = o.gracePenalty     ?? 0;
    const latePenalty  = o.latePenalty      ?? 0;

    // Reference = today at the office's openTime; fall back to session start.
    let ref = session.startTime;
    if (o.openTime && /^\d{1,2}:\d{2}$/.test(o.openTime)) {
      const [h, m] = o.openTime.split(':').map(Number);
      ref = new Date(clockInTime); ref.setHours(h, m, 0, 0);
    }

    const minutesLate = (clockInTime.getTime() - ref.getTime()) / 60000;
    if (minutesLate <= grace)     return { status: 'PRESENT', penalty: 0 };
    if (minutesLate <= lateAfter) return { status: 'PRESENT', penalty: gracePenalty };
    return { status: 'LATE', penalty: latePenalty };
  }

  async getStatus(employeeId, date) {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    return prisma.attendanceRecord.findFirst({
      where: { employeeId, date: targetDate },
      include: { breakRecords: true },
    });
  }

  async getHistory(employeeId, range) {
    const { startDate, endDate, page = 1, limit = 30 } = range;
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where: { employeeId, date: { gte: new Date(startDate), lte: new Date(endDate) } },
        include: { breakRecords: true, session: { select: { sessionName: true } } },
        orderBy: { date: 'desc' },
        skip, take: limit,
      }),
      prisma.attendanceRecord.count({
        where: { employeeId, date: { gte: new Date(startDate), lte: new Date(endDate) } },
      }),
    ]);

    return { records, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async flagRecord(recordId, reason, adminId) {
    return prisma.attendanceRecord.update({
      where: { id: recordId },
      data: { flagged: true, flagReason: reason, reviewedBy: adminId },
    });
  }

  async approveRecord(recordId, adminId, notes) {
    return prisma.attendanceRecord.update({
      where: { id: recordId },
      data: { flagged: false, reviewedBy: adminId, reviewNotes: notes },
    });
  }

  _emit(event, payload) {
    if (!this._io) {
      try { this._io = require('../sockets/io').getIO(); } catch { return; }
    }
    if (this._io) this._io.emit(event, payload);
  }
}

module.exports = new AttendanceService();
