const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const { prisma } = require('../config/database');
const { redis, PREFIXES } = require('../config/redis');
const env = require('../config/env');
const logger = require('../config/logger');

// Factory + Singleton behaviour per session — implements the QRTokenGenerator class from the OOD.
class QRTokenService {
  // Generate a new rotating token for a session.
  async generate(session) {
    const expiresAt = new Date(Date.now() + session.qrRefreshInterval * 1000);
    const tokenValue = this._sign(session.id, expiresAt);

    const token = await prisma.qRToken.create({
      data: {
        id: uuidv4(),
        tokenValue,
        sessionId: session.id,
        expiresAt,
      },
    });

    // Cache in Redis for ultra-fast validation; TTL matches expiry
    await redis.setex(
      `${PREFIXES.QR_TOKEN}${tokenValue}`,
      session.qrRefreshInterval + 5, // small grace window
      JSON.stringify({ sessionId: session.id, tokenId: token.id })
    );

    logger.debug(`QR generated for session ${session.id}, expires ${expiresAt.toISOString()}`);
    return token;
  }

  // Validate a scanned token payload; returns { valid, reason, token }.
  async validateToken(tokenValue, sessionId) {
    // Fast path via Redis
    const cached = await redis.get(`${PREFIXES.QR_TOKEN}${tokenValue}`);

    if (cached) {
      const meta = JSON.parse(cached);
      if (meta.sessionId !== sessionId) return { valid: false, reason: 'INVALID_TOKEN' };
    }
    // Redis miss — token may have been evicted or rotated; fall back to DB
    // This prevents a race condition where the QR rotates mid-flow but the token is still valid

    const token = await prisma.qRToken.findUnique({ where: { tokenValue } });
    if (!token)                       return { valid: false, reason: 'INVALID_TOKEN' };
    if (token.isConsumed)             return { valid: false, reason: 'INVALID_TOKEN' };
    if (token.expiresAt < new Date()) return { valid: false, reason: 'EXPIRED_TOKEN' };
    if (token.sessionId !== sessionId) return { valid: false, reason: 'INVALID_TOKEN' };

    return { valid: true, token };
  }

  // Mark a token as consumed by an employee (single-use enforcement).
  async consume(tokenId, employeeId) {
    const token = await prisma.qRToken.update({
      where: { id: tokenId },
      data: { isConsumed: true, consumedBy: employeeId, consumedAt: new Date() },
    });
    await redis.del(`${PREFIXES.QR_TOKEN}${token.tokenValue}`);
    return token;
  }

  // Invalidate all previous tokens for a session (called on rotation or emergency).
  async invalidatePrevious(sessionId) {
    const tokens = await prisma.qRToken.findMany({
      where: { sessionId, isConsumed: false },
    });

    const pipeline = redis.pipeline();
    for (const t of tokens) {
      pipeline.del(`${PREFIXES.QR_TOKEN}${t.tokenValue}`);
    }
    await pipeline.exec();

    await prisma.qRToken.updateMany({
      where: { sessionId, isConsumed: false },
      data: { isConsumed: true },
    });

    logger.info(`Invalidated ${tokens.length} QR tokens for session ${sessionId}`);
  }

  // Encode a token into a scannable QR PNG buffer.
  async encodeToQRImage(tokenValue, sessionId) {
    const payload = JSON.stringify({ t: tokenValue, s: sessionId, ts: Date.now() });
    return QRCode.toBuffer(payload, { errorCorrectionLevel: 'H', width: 300 });
  }

  // Schedule automatic rotation — stored as a Redis key that the session service polls.
  async scheduleRotation(session) {
    await redis.setex(
      `${PREFIXES.SESSION}rotation:${session.id}`,
      session.qrRefreshInterval,
      '1'
    );
  }

  getRemainingSeconds(token) {
    return Math.max(0, Math.floor((token.expiresAt - Date.now()) / 1000));
  }

  // ── private ──────────────────────────────────────────────────────────────────

  _sign(sessionId, expiresAt) {
    const payload = `${sessionId}:${expiresAt.getTime()}:${uuidv4()}`;
    const sig = crypto
      .createHmac('sha256', env.QR_SECRET_KEY)
      .update(payload)
      .digest('hex');
    return `${Buffer.from(payload).toString('base64url')}.${sig}`;
  }
}

module.exports = new QRTokenService();
