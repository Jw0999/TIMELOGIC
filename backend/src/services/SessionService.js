const { v4: uuidv4 } = require('uuid');
const { prisma } = require('../config/database');
const { redis, PREFIXES } = require('../config/redis');
const env = require('../config/env');
const QRTokenService = require('./QRTokenService');
const logger = require('../config/logger');

// Implements the State pattern for AttendanceSession lifecycle.
const VALID_TRANSITIONS = {
  SCHEDULED: ['ACTIVE'],
  ACTIVE:    ['PAUSED', 'LOCKED', 'ENDED'],
  PAUSED:    ['ACTIVE', 'ENDED'],
  LOCKED:    ['ENDED'],
  ENDED:     [],
};

class SessionService {
  async createSession(adminId, config) {
    const { sessionName, officeId, qrRefreshInterval } = config;

    // Snapshot office + org name and read the office work hours
    const office = await prisma.office.findUnique({
      where: { id: officeId },
      select: { name: true, openTime: true, closeTime: true, organization: { select: { name: true } } },
    });
    if (!office) throw Object.assign(new Error('Office not found'), { status: 404 });

    const now      = new Date();
    const minOfDay = now.getHours() * 60 + now.getMinutes();
    const openMin  = this._toMinutes(office.openTime);
    const closeMin = this._toMinutes(office.closeTime);

    // ── Creation window: from (openTime - SESSION_LEAD) up to closeTime ──
    if (openMin != null && closeMin != null) {
      const windowStart = openMin - env.SESSION_LEAD_MIN;
      if (minOfDay < windowStart) {
        const hh = Math.floor(windowStart / 60), mm = windowStart % 60;
        throw Object.assign(
          new Error(`Too early. Sessions can be created from ${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')} (30 min before the ${office.openTime} open time).`),
          { status: 400 }
        );
      }
      if (minOfDay > closeMin) {
        throw Object.assign(
          new Error(`The work day has ended (closes ${office.closeTime}). No new sessions today.`),
          { status: 400 }
        );
      }
    }

    // ── Only ONE live session per office per day ──
    const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
    const existing = await prisma.attendanceSession.findFirst({
      where: { officeId, startTime: { gte: dayStart }, status: { in: ['ACTIVE', 'SCHEDULED', 'PAUSED'] } },
      select: { id: true },
    });
    if (existing) {
      throw Object.assign(
        new Error('A session already exists for this office today. End it before starting a new one.'),
        { status: 409 }
      );
    }

    // Session runs from now until the office close time
    const start  = now;
    const autoEnd = (closeMin != null) ? this._atTime(now, office.closeTime) : new Date(start.getTime() + 8 * 3600 * 1000);

    // Create as ACTIVE immediately and generate first QR
    const session = await prisma.attendanceSession.create({
      data: {
        id: uuidv4(),
        sessionName,
        officeId,
        officeName: office?.name ?? null,
        orgName:    office?.organization?.name ?? null,
        createdBy: adminId,
        startTime: start,
        endTime: autoEnd,
        qrRefreshInterval:     qrRefreshInterval ?? 120,
        status: 'ACTIVE',
      },
      include: { office: true, creator: { select: { id: true, firstName: true, lastName: true } } },
    });

    // Generate first QR token and schedule rotation
    const token = await QRTokenService.generate(session);
    await QRTokenService.scheduleRotation(session);
    this._emitEvent('session:started', session);

    logger.info(`Session created+started: ${session.id} | expires at ${autoEnd.toISOString()}`);
    return { session, currentToken: token };
  }

  async startSession(sessionId) {
    const session = await this._transition(sessionId, 'ACTIVE');
    const token = await QRTokenService.generate(session);
    await QRTokenService.scheduleRotation(session);
    this._emitEvent('session:started', session);
    return { session, currentToken: token };
  }

  async pauseSession(sessionId) {
    const session = await this._transition(sessionId, 'PAUSED');
    await QRTokenService.invalidatePrevious(sessionId);
    this._emitEvent('session:paused', session);
    return session;
  }

  async resumeSession(sessionId) {
    const session = await this._transition(sessionId, 'ACTIVE');
    const token = await QRTokenService.generate(session);
    await QRTokenService.scheduleRotation(session);
    this._emitEvent('session:resumed', session);
    return { session, currentToken: token };
  }

  async endSession(sessionId) {
    const session = await this._transition(sessionId, 'ENDED');
    await QRTokenService.invalidatePrevious(sessionId);
    await redis.del(`${PREFIXES.SESSION}${sessionId}`);
    this._emitEvent('session:ended', session);
    logger.info(`Session ended: ${sessionId}`);
    return session;
  }

  async lockSession(sessionId) {
    const session = await this._transition(sessionId, 'LOCKED');
    await QRTokenService.invalidatePrevious(sessionId);
    this._emitEvent('session:locked', session);
    return session;
  }

  async forceRefreshQR(sessionId) {
    const session = await prisma.attendanceSession.findUnique({ where: { id: sessionId } });
    if (!session || session.status !== 'ACTIVE') {
      throw Object.assign(new Error('Session must be ACTIVE to refresh QR'), { status: 400 });
    }
    await QRTokenService.invalidatePrevious(sessionId);
    const token = await QRTokenService.generate(session);
    await QRTokenService.scheduleRotation(session);
    this._emitEvent('session:qr_refreshed', { sessionId, token });
    return token;
  }

  async getLiveStatus(sessionId) {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        _count: { select: { attendanceRecords: true, scanAttempts: true, fraudAlerts: true } },
      },
    });

    if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });

    const presentCount = await prisma.attendanceRecord.count({
      where: { sessionId, status: { in: ['PRESENT', 'LATE'] } },
    });

    const latestToken = await prisma.qRToken.findFirst({
      where: { sessionId, isConsumed: false },
      orderBy: { generatedAt: 'desc' },
    });

    return {
      session,
      stats: {
        totalRecords: session._count.attendanceRecords,
        present: presentCount,
        scanAttempts: session._count.scanAttempts,
        fraudAlerts: session._count.fraudAlerts,
      },
      qrExpiresIn: latestToken ? QRTokenService.getRemainingSeconds(latestToken) : null,
    };
  }

  async getActiveSessions(officeId, orgId) {
    // Return ALL sessions for the admin's org (full history), most recent first.
    // Active sessions naturally sort to the top by startTime. Past/ENDED sessions
    // are preserved and shown too — nothing is ever hidden or removed.
    const orgFilter = officeId
      ? { officeId }
      : orgId
        ? { office: { orgId } }
        : {};
    return prisma.attendanceSession.findMany({
      where: orgFilter,
      include: {
        office: { select: { id: true, name: true } },
        creator: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { attendanceRecords: true } },
      },
      orderBy: { startTime: 'desc' },
      take: 200,
    });
  }

  async getCurrentQRImage(sessionId) {
    const token = await prisma.qRToken.findFirst({
      where: { sessionId, isConsumed: false, expiresAt: { gt: new Date() } },
      orderBy: { generatedAt: 'desc' },
    });

    if (!token) throw Object.assign(new Error('No active QR token'), { status: 404 });

    const qrBuffer = await QRTokenService.encodeToQRImage(token.tokenValue, sessionId);
    return {
      image: qrBuffer,
      expiresIn: QRTokenService.getRemainingSeconds(token),
      tokenId: token.id,
    };
  }

  // ── private ──────────────────────────────────────────────────────────────────

  _toMinutes(hhmm) {
    if (!hhmm || typeof hhmm !== 'string') return null;
    const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  }
  _atTime(base, hhmm) {
    const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));
    const d = new Date(base); d.setHours(h, m, 0, 0); return d;
  }

  async _transition(sessionId, targetStatus) {
    const session = await prisma.attendanceSession.findUnique({ where: { id: sessionId } });
    if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });

    const allowed = VALID_TRANSITIONS[session.status] || [];
    if (!allowed.includes(targetStatus)) {
      throw Object.assign(
        new Error(`Cannot transition session from ${session.status} to ${targetStatus}`),
        { status: 400 }
      );
    }

    return prisma.attendanceSession.update({
      where: { id: sessionId },
      data: { status: targetStatus },
    });
  }

  _emitEvent(event, payload) {
    // Attach the socket emitter lazily to avoid circular dependency at boot time.
    if (!this._io) {
      try { this._io = require('../sockets/io').getIO(); } catch { return; }
    }
    if (this._io) this._io.emit(event, payload);
  }
}

module.exports = new SessionService();
