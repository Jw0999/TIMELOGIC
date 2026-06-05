const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/sessionController');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleGuard');
const { validate } = require('../middleware/validate');

router.post('/', authenticate, isAdmin, [
  body('sessionName').notEmpty().withMessage('Session name is required'),
  // officeId is optional — controller auto-resolves from the admin's org if not provided
  body('officeId').optional({ nullable: true }),
  body('startTime').optional().isISO8601(),
], validate, ctrl.createSession);

router.get('/', authenticate, isAdmin, ctrl.getActiveSessions);

router.post('/:id/start',      authenticate, isAdmin, ctrl.startSession);
router.post('/:id/pause',      authenticate, isAdmin, ctrl.pauseSession);
router.post('/:id/resume',     authenticate, isAdmin, ctrl.resumeSession);
router.post('/:id/end',        authenticate, isAdmin, ctrl.endSession);
router.post('/:id/lock',       authenticate, isAdmin, ctrl.lockSession);
router.post('/:id/refresh-qr', authenticate, isAdmin, ctrl.forceRefreshQR);

router.get('/:id/status', authenticate, isAdmin, ctrl.getLiveStatus);
router.get('/:id/qr',     authenticate, ctrl.getQRImage);

// Manual trigger: run auto-create now (useful for testing or if admin missed the 07:20 window)
router.post('/auto-create', authenticate, isAdmin, async (req, res, next) => {
  try {
    const { startSessionScheduler: { autoCreateMorningSessions } } = require('../sockets/sessionScheduler');
    // Import the internal function directly
    const scheduler = require('../sockets/sessionScheduler');
    // Expose a test endpoint that just calls the public function
    res.json({ success: true, message: 'Auto-create triggered. Check server logs for details.' });
    // Run async after responding
    process.nextTick(async () => {
      const { prisma } = require('../config/database');
      const { v4: uuidv4 } = require('uuid');
      const QRTokenService = require('../services/QRTokenService');
      const logger = require('../config/logger');
      const now = new Date();
      const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
      const org = await prisma.organization.findFirst({ where: { id: req.user.orgId }, include: { offices: { where: { isActive: true }, include: { securitySettings: true } } } });
      if (!org) return;
      for (const office of (org.offices || [])) {
        const existing = await prisma.attendanceSession.findFirst({ where: { officeId: office.id, startTime: { gte: dayStart }, status: { in: ['ACTIVE', 'SCHEDULED', 'PAUSED'] } } });
        if (existing) continue;
        const endTime = new Date(now); endTime.setHours(8, 30, 0, 0);
        if (endTime <= now) { endTime.setDate(endTime.getDate() + 1); endTime.setHours(8, 30, 0, 0); }
        const session = await prisma.attendanceSession.create({ data: { id: uuidv4(), sessionName: `Auto Morning Session – ${now.toLocaleDateString('en-GB')}`, officeId: office.id, officeName: office.name, orgName: org.name, createdBy: req.user.id, startTime: now, endTime, qrRefreshInterval: 120, status: 'ACTIVE' } });
        await QRTokenService.generate(session); await QRTokenService.scheduleRotation(session);
        logger.info(`Manual auto-create: session for ${org.name}/${office.name}`);
      }
    });
  } catch (err) { next(err); }
});

module.exports = router;
