const { v4: uuidv4 } = require('uuid');
const { prisma } = require('../config/database');
const logger = require('../config/logger');

class NotificationService {
  async notifyEmployee(employeeId, message, metadata = {}) {
    await this._log(employeeId, 'in-app', null, message);
    this._emit('notification:employee', { userId: employeeId, message, ...metadata });
  }

  async notifyAdmin(adminId, message, metadata = {}) {
    await this._log(adminId, 'in-app', 'Admin Alert', message);
    this._emit('notification:admin', { userId: adminId, message, ...metadata });
  }

  async notifyBulk(employeeIds, message) {
    for (const id of employeeIds) {
      await this.notifyEmployee(id, message);
    }
  }

  async sendPush(deviceId, payload) {
    // FCM integration point — replace with actual FCM call when FCM_SERVER_KEY is set.
    logger.debug(`Push to device ${deviceId}:`, payload);
    await this._log(null, 'push', payload.title, JSON.stringify(payload), { deviceId });
  }

  async sendEmail(email, subject, body) {
    // SMTP integration point — replace with nodemailer when SMTP is configured.
    logger.debug(`Email to ${email}: ${subject}`);
    await this._log(null, 'email', subject, body, { email });
  }

  async sendSMS(phone, message) {
    // SMS gateway integration point.
    logger.debug(`SMS to ${phone}: ${message}`);
    await this._log(null, 'sms', null, message, { phone });
  }

  async _log(userId, channel, subject, body, metadata = {}) {
    try {
      await prisma.notificationLog.create({
        data: {
          id: uuidv4(),
          userId: userId || 'system',
          channel,
          subject,
          body,
          metadata,
        },
      });
    } catch (err) {
      logger.warn('Failed to log notification:', err.message);
    }
  }

  _emit(event, payload) {
    if (!this._io) {
      try { this._io = require('../sockets/io').getIO(); } catch { return; }
    }
    if (this._io) this._io.emit(event, payload);
  }
}

module.exports = new NotificationService();
