const { v4: uuidv4 } = require('uuid');
const { prisma } = require('../config/database');
const logger = require('../config/logger');

// Observer pattern — receives ScanAttempt events and emits FraudAlerts.
class FraudDetectionEngine {
  async analyze(scanAttempt) {
    const alerts = [];

    const [rapid, proxy] = await Promise.all([
      this.checkRapidScans(scanAttempt.employeeId),
      this.checkProxyPattern(scanAttempt.employeeId),
    ]);

    if (rapid) alerts.push(await this.createAlert(scanAttempt.employeeId, scanAttempt.sessionId, scanAttempt.id, 'REPEATED_FAILED_SCANS', 'HIGH'));
    if (proxy) alerts.push(await this.createAlert(scanAttempt.employeeId, scanAttempt.sessionId, scanAttempt.id, 'PROXY_ATTENDANCE', 'HIGH'));

    if (alerts.length > 0) {
      this._emit('fraud:alerts', alerts);
      logger.warn(`Fraud detection: ${alerts.length} alert(s) for employee ${scanAttempt.employeeId}`);
    }

    return alerts;
  }

  async checkRapidScans(employeeId) {
    // More than 5 scan attempts in the last 2 minutes = suspicious
    const count = await prisma.scanAttempt.count({
      where: {
        employeeId,
        timestamp: { gte: new Date(Date.now() - 2 * 60 * 1000) },
      },
    });
    return count > 5;
  }

  async checkProxyPattern(employeeId) {
    // Same IP used by multiple employees in the last 30 minutes = proxy attendance
    const recentAttempt = await prisma.scanAttempt.findFirst({
      where: { employeeId, result: 'VALID' },
      orderBy: { timestamp: 'desc' },
    });
    if (!recentAttempt?.ipAddress) return false;

    const othersOnSameIP = await prisma.scanAttempt.count({
      where: {
        ipAddress: recentAttempt.ipAddress,
        timestamp: { gte: new Date(Date.now() - 30 * 60 * 1000) },
        employeeId: { not: employeeId },
        result: 'VALID',
      },
    });

    return othersOnSameIP >= 3;
  }

  async createAlert(employeeId, sessionId, scanAttemptId, fraudType, severity = 'MEDIUM', description = null) {
    const descriptions = {
      SCREENSHOT_ATTEMPT:      'Screenshot capture detected during attendance',
      REPEATED_FAILED_SCANS:   'Repeated failed scan attempts detected',
      PROXY_ATTENDANCE:        'Same IP address used by multiple employees — possible proxy attendance',
    };

    return prisma.fraudAlert.create({
      data: {
        id: uuidv4(),
        employeeId,
        sessionId,
        scanAttemptId,
        fraudType,
        severity,
        description: description || descriptions[fraudType] || fraudType,
        status: 'NEW',
      },
    });
  }

  async getAlertsByEmployee(employeeId, filters = {}) {
    const { status, severity, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    return prisma.fraudAlert.findMany({
      where: {
        employeeId,
        ...(status && { status }),
        ...(severity && { severity }),
      },
      include: { session: { select: { sessionName: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }

  async resolveAlert(alertId, adminId, resolution) {
    return prisma.fraudAlert.update({
      where: { id: alertId },
      data: { status: 'RESOLVED', resolvedBy: adminId, resolution },
    });
  }

  async dismissAlert(alertId, adminId, reason) {
    return prisma.fraudAlert.update({
      where: { id: alertId },
      data: { status: 'DISMISSED', resolvedBy: adminId, resolution: reason },
    });
  }

  async escalateAlert(alertId) {
    return prisma.fraudAlert.update({
      where: { id: alertId },
      data: { status: 'INVESTIGATING', severity: 'HIGH' },
    });
  }

  async logScreenshotAttempt(employeeId, deviceId, platform, sessionId) {
    await prisma.screenshotLog.create({
      data: { id: uuidv4(), employeeId, deviceId, platform, sessionId },
    });
    await this.createAlert(employeeId, sessionId, null, 'SCREENSHOT_ATTEMPT', 'LOW');
  }

  _emit(event, payload) {
    if (!this._io) {
      try { this._io = require('../sockets/io').getIO(); } catch { return; }
    }
    if (this._io) this._io.emit(event, payload);
  }
}

module.exports = new FraudDetectionEngine();
