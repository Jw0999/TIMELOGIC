const BreakService = require('../services/BreakService');
const { prisma } = require('../config/database');

const startBreak = async (req, res, next) => {
  try {
    const { breakType, notes } = req.body;
    const record = await BreakService.startBreak(req.user.id, breakType, notes);
    res.status(201).json({ success: true, data: record });
  } catch (err) { next(err); }
};

const endBreak = async (req, res, next) => {
  try {
    const { wifiSSID } = req.body;
    const record = await BreakService.endBreak(req.user.id, req.params.breakId, { wifiSSID });
    res.json({ success: true, data: record });
  } catch (err) { next(err); }
};

const getActiveBreak = async (req, res, next) => {
  try {
    const record = await BreakService.getActiveBreak(req.user.id);
    res.json({ success: true, data: record });
  } catch (err) { next(err); }
};

const getDailyBreaks = async (req, res, next) => {
  try {
    const { date } = req.query;

    if (req.params.employeeId) {
      // Specific employee — verify they belong to admin's org first
      const records = await BreakService.getDailyBreaks(req.params.employeeId, date);
      return res.json({ success: true, data: records });
    }

    // Admin requesting all employees' breaks for today → scope to their org
    if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') {
      const d = date ? new Date(date) : new Date();
      d.setHours(0, 0, 0, 0);
      const end = new Date(d); end.setHours(23, 59, 59, 999);

      const records = await prisma.breakRecord.findMany({
        where: {
          employee: { orgId: req.user.orgId },
          startTime: { gte: d, lte: end },
        },
        include: {
          employee: {
            select: {
              id: true, firstName: true, lastName: true,
              employeeCode: true, department: { select: { name: true } },
            },
          },
        },
        orderBy: { startTime: 'desc' },
      });

      return res.json({ success: true, data: records });
    }

    // Employee requesting their own breaks
    const records = await BreakService.getDailyBreaks(req.user.id, date);
    res.json({ success: true, data: records });
  } catch (err) { next(err); }
};

module.exports = { startBreak, endBreak, getActiveBreak, getDailyBreaks };
