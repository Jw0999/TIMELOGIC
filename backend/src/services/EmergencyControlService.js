const { v4: uuidv4 } = require('uuid');
const { prisma } = require('../config/database');
const QRTokenService = require('./QRTokenService');
const { redis, PREFIXES } = require('../config/redis');
const logger = require('../config/logger');

// Command pattern — each EmergencyAction is undo-capable.
class EmergencyControlService {
  async stopAllAttendance(adminId, reason, officeId) {
    const sessions = await prisma.attendanceSession.findMany({
      where: { officeId, status: { in: ['ACTIVE', 'PAUSED'] } },
    });

    for (const s of sessions) {
      await QRTokenService.invalidatePrevious(s.id);
      await prisma.attendanceSession.update({ where: { id: s.id }, data: { status: 'LOCKED' } });
    }

    const control = await this._createControl(adminId, 'STOP_ALL', reason, sessions.map((s) => s.id));
    this._emit('emergency:stop_all', { officeId, adminId });
    logger.warn(`Emergency STOP_ALL by ${adminId} on office ${officeId}`);
    return control;
  }

  async invalidateAllQR(adminId, reason, officeId) {
    const sessions = await prisma.attendanceSession.findMany({
      where: { officeId, status: 'ACTIVE' },
    });

    for (const s of sessions) {
      await QRTokenService.invalidatePrevious(s.id);
    }

    const control = await this._createControl(adminId, 'INVALIDATE_QR', reason, sessions.map((s) => s.id));
    this._emit('emergency:invalidate_qr', { officeId });
    return control;
  }

  async resetSession(adminId, reason, sessionId) {
    await QRTokenService.invalidatePrevious(sessionId);
    await prisma.attendanceSession.update({ where: { id: sessionId }, data: { status: 'SCHEDULED' } });
    const control = await this._createControl(adminId, 'RESET_SESSION', reason, [sessionId]);
    this._emit('emergency:reset_session', { sessionId });
    return control;
  }

  async lockSystem(adminId, reason, orgId) {
    const offices = await prisma.office.findMany({ where: { orgId, isActive: true } });
    const allSessionIds = [];

    for (const office of offices) {
      const sessions = await prisma.attendanceSession.findMany({
        where: { officeId: office.id, status: { in: ['ACTIVE', 'PAUSED', 'SCHEDULED'] } },
      });
      for (const s of sessions) {
        await QRTokenService.invalidatePrevious(s.id);
        await prisma.attendanceSession.update({ where: { id: s.id }, data: { status: 'LOCKED' } });
        allSessionIds.push(s.id);
      }
    }

    const control = await this._createControl(adminId, 'LOCK_SYSTEM', reason, allSessionIds);
    this._emit('emergency:lock_system', { orgId });
    logger.warn(`Emergency LOCK_SYSTEM by ${adminId} on org ${orgId}`);
    return control;
  }

  async forceLogoutAll(adminId, reason, officeId) {
    // Flush all socket session keys for employees in this office
    const employees = await prisma.user.findMany({
      where: { department: { organization: { offices: { some: { id: officeId } } } }, status: 'ACTIVE' },
      select: { id: true },
    });

    const pipeline = redis.pipeline();
    for (const emp of employees) {
      pipeline.del(`${PREFIXES.SOCKET}${emp.id}`);
    }
    await pipeline.exec();

    const control = await this._createControl(adminId, 'FORCE_LOGOUT_ALL', reason, []);
    this._emit('emergency:force_logout', { officeId });
    return control;
  }

  async revert(adminId, controlId) {
    const control = await prisma.emergencyControl.findUnique({
      where: { id: controlId },
      include: { sessions: true },
    });

    if (!control) throw Object.assign(new Error('Emergency control not found'), { status: 404 });
    if (control.isReverted) throw Object.assign(new Error('Already reverted'), { status: 400 });

    // Revert LOCKED sessions back to ACTIVE where they were active before
    for (const cs of control.sessions) {
      await prisma.attendanceSession.update({
        where: { id: cs.sessionId },
        data: { status: 'ACTIVE' },
      }).catch(() => {});
    }

    return prisma.emergencyControl.update({
      where: { id: controlId },
      data: { isReverted: true, revertedAt: new Date(), revertedBy: adminId },
    });
  }

  // ── private ──────────────────────────────────────────────────────────────────

  async _createControl(adminId, action, reason, sessionIds) {
    const control = await prisma.emergencyControl.create({
      data: {
        id: uuidv4(),
        triggeredBy: adminId,
        action,
        reason,
      },
    });

    if (sessionIds.length > 0) {
      await prisma.emergencyControlSession.createMany({
        data: sessionIds.map((sid) => ({ id: uuidv4(), emergencyControlId: control.id, sessionId: sid })),
      });
    }

    return control;
  }

  _emit(event, payload) {
    if (!this._io) {
      try { this._io = require('../sockets/io').getIO(); } catch { return; }
    }
    if (this._io) this._io.emit(event, payload);
  }
}

module.exports = new EmergencyControlService();
