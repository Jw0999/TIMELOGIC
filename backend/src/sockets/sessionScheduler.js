/**
 * Session Scheduler — runs every 30s, driven by EACH OFFICE's own work hours
 * (office.openTime / office.closeTime, set per organization). Scales to many
 * organizations: each tick only touches offices whose threshold matches the
 * current minute, so most ticks do almost nothing.
 *
 *  openTime - AUTO_CREATE_LEAD (e.g. 07:50 for an 08:00 open)
 *        → auto-create an ACTIVE session if the admin hasn't already.
 *  closeTime
 *        → end the session (no more check-ins; check-out still works).
 *  closeTime + AUTO_CHECKOUT_LAG (e.g. 20:40 for a 20:00 close)
 *        → auto check-out anyone still clocked in.
 */

const { prisma } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const env = require('../config/env');
const QRTokenService = require('../services/QRTokenService');
const BreakService = require('../services/BreakService');
const logger = require('../config/logger');

let _timer = null;
let _lastMinute = -1;

function toMinutes(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return null;
  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}
function atTime(base, hhmm) {
  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));
  const d = new Date(base); d.setHours(h, m, 0, 0); return d;
}

async function tick() {
  try {
    const now      = new Date();
    const minOfDay = now.getHours() * 60 + now.getMinutes();
    if (minOfDay === _lastMinute) return; // once per minute
    _lastMinute = minOfDay;

    const orgs = await prisma.organization.findMany({
      where: { id: { not: 'platform-org' } },
      include: { offices: { where: { isActive: true } } },
    });

    for (const org of orgs) {
      for (const office of org.offices) {
        const openMin  = toMinutes(office.openTime);
        const closeMin = toMinutes(office.closeTime);
        if (openMin == null || closeMin == null) continue;

        const autoCreateMin  = openMin - env.AUTO_CREATE_LEAD_MIN;
        const autoCheckoutMin = closeMin + env.AUTO_CHECKOUT_LAG_MIN;

        if (minOfDay === autoCreateMin)   await autoCreate(org, office, now);
        if (minOfDay === closeMin)        await endOfficeSessions(org, office, now);
        if (minOfDay === autoCheckoutMin) await autoCheckout(org, office, now);
      }
    }

    // Force-end any break that overstayed its department window (raises fraud).
    await BreakService.autoEndOverdueBreaks().catch((e) => logger.warn('break sweep:', e.message));
  } catch (err) {
    logger.warn('Session scheduler tick error:', err.message);
  }
}

// Auto-create a session at openTime - lead, ONLY if none exists yet today.
async function autoCreate(org, office, now) {
  const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
  const existing = await prisma.attendanceSession.findFirst({
    where: { officeId: office.id, startTime: { gte: dayStart }, status: { in: ['ACTIVE', 'SCHEDULED', 'PAUSED'] } },
    select: { id: true },
  });
  if (existing) return; // admin already created one — do not auto-create

  const admin = await prisma.user.findFirst({
    where: { orgId: org.id, role: 'ADMIN', status: 'ACTIVE' }, select: { id: true },
  });

  const startTime = new Date(now);                       // openTime - lead
  const endTime   = atTime(now, office.closeTime || '17:00');
  if (endTime <= startTime) return;

  const session = await prisma.attendanceSession.create({
    data: {
      id: uuidv4(),
      sessionName: `${office.name} – ${now.toLocaleDateString('en-GB')}`,
      officeId:   office.id,
      officeName: office.name,
      orgName:    org.name,
      createdBy:  admin?.id ?? null,
      startTime, endTime,
      qrRefreshInterval: 120,
      status: 'ACTIVE',
    },
  });
  await QRTokenService.generate(session);
  await QRTokenService.scheduleRotation(session);
  logger.info(`Scheduler: auto-created session for ${org.name}/${office.name} (open ${office.openTime})`);
}

// End the office's active sessions at closeTime (stops further check-ins).
async function endOfficeSessions(org, office, now) {
  const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
  const sessions = await prisma.attendanceSession.findMany({
    where: { officeId: office.id, startTime: { gte: dayStart }, status: { in: ['ACTIVE', 'PAUSED'] } },
    select: { id: true, sessionName: true },
  });
  for (const sn of sessions) {
    await prisma.attendanceSession.update({ where: { id: sn.id }, data: { status: 'ENDED' } });
    await QRTokenService.invalidatePrevious(sn.id).catch(() => {});
    logger.info(`Scheduler: ended session ${sn.sessionName} for ${org.name}/${office.name} at ${office.closeTime}`);
  }
}

// Auto check-out anyone still clocked in, closeTime + lag.
async function autoCheckout(org, office, now) {
  const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
  const open = await prisma.attendanceRecord.findMany({
    where: {
      date: dayStart,
      clockInTime: { not: null },
      clockOutTime: null,
      session: { officeId: office.id },
    },
    select: { id: true, clockInTime: true },
  });
  for (const r of open) {
    const clockOutTime = new Date(now);
    const workMs = clockOutTime - r.clockInTime;
    await prisma.attendanceRecord.update({
      where: { id: r.id },
      data: { clockOutTime, totalWorkHours: parseFloat((workMs / 3600000).toFixed(2)) },
    });
  }
  if (open.length) logger.info(`Scheduler: auto-checked-out ${open.length} for ${org.name}/${office.name}`);
}

function startSessionScheduler() {
  if (_timer) return;
  _timer = setInterval(tick, 30_000);
  logger.info('Session scheduler started (per-office, multi-org)');
}
function stopSessionScheduler() { if (_timer) { clearInterval(_timer); _timer = null; } }

module.exports = { startSessionScheduler, stopSessionScheduler };
