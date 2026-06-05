const { v4: uuidv4 } = require('uuid');
const { prisma } = require('../config/database');
const NotificationService = require('./NotificationService');

class LeaveService {
  async requestLeave(employeeId, data) {
    const { leaveType, startDate, endDate, reason, attachmentUrls = [] } = data;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = this._calcDays(start, end);

    const balance = await prisma.leaveBalance.findFirst({
      where: { employeeId, leaveType, year: start.getFullYear() },
    });

    if (balance && !balance.hasEnough) {
      const remaining = balance.remaining - balance.pending;
      if (totalDays > remaining) {
        throw Object.assign(
          new Error(`Insufficient leave balance. Available: ${remaining} days`),
          { status: 400 }
        );
      }
    }

    const conflict = await this.checkConflicts(employeeId, start, end);
    if (conflict) {
      throw Object.assign(new Error('Leave dates overlap with an existing request'), { status: 409 });
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        id: uuidv4(),
        employeeId,
        leaveType,
        startDate: start,
        endDate: end,
        totalDays,
        reason,
        attachmentUrls,
        status: 'PENDING',
      },
    });

    // Update pending balance
    if (balance) {
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { pending: { increment: totalDays } },
      });
    }

    // Notify admins
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, status: 'ACTIVE' },
    });
    for (const admin of admins) {
      await NotificationService.notifyAdmin(admin.id, `New leave request from employee ${employeeId}`);
    }

    return leave;
  }

  async approveLeave(adminId, leaveId) {
    const leave = await this._findPendingLeave(leaveId);

    const updated = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: { status: 'APPROVED', approvedBy: adminId, approvedAt: new Date() },
    });

    await this._adjustBalance(leave.employeeId, leave.leaveType, leave.startDate.getFullYear(), {
      pendingDelta: -leave.totalDays,
      usedDelta: leave.totalDays,
      remainingDelta: -leave.totalDays,
    });

    await NotificationService.notifyEmployee(leave.employeeId, `Your ${leave.leaveType} leave has been approved`);
    return updated;
  }

  async rejectLeave(adminId, leaveId, rejectionReason) {
    const leave = await this._findPendingLeave(leaveId);

    const updated = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: { status: 'REJECTED', approvedBy: adminId, approvedAt: new Date(), rejectionReason },
    });

    await this._adjustBalance(leave.employeeId, leave.leaveType, leave.startDate.getFullYear(), {
      pendingDelta: -leave.totalDays,
    });

    await NotificationService.notifyEmployee(leave.employeeId, `Your ${leave.leaveType} leave was rejected: ${rejectionReason}`);
    return updated;
  }

  async cancelLeave(employeeId, leaveId) {
    const leave = await prisma.leaveRequest.findFirst({
      where: { id: leaveId, employeeId, status: { in: ['PENDING', 'APPROVED'] } },
    });

    if (!leave) throw Object.assign(new Error('Leave request not found or cannot be cancelled'), { status: 404 });

    const updated = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: { status: 'CANCELLED' },
    });

    const balanceDelta = leave.status === 'PENDING'
      ? { pendingDelta: -leave.totalDays }
      : { usedDelta: -leave.totalDays, remainingDelta: leave.totalDays };

    await this._adjustBalance(employeeId, leave.leaveType, leave.startDate.getFullYear(), balanceDelta);
    return updated;
  }

  async getBalance(employeeId) {
    const year = new Date().getFullYear();
    return prisma.leaveBalance.findMany({
      where: { employeeId, year },
    });
  }

  async getTeamCalendar(departmentId, month) {
    const date = new Date(month);
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const dept = await prisma.department.findUnique({
      where: { id: departmentId },
      include: { employees: { select: { id: true, firstName: true, lastName: true } } },
    });

    if (!dept) throw Object.assign(new Error('Department not found'), { status: 404 });

    const empIds = dept.employees.map((e) => e.id);
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        employeeId: { in: empIds },
        status: 'APPROVED',
        startDate: { lte: end },
        endDate: { gte: start },
      },
      include: { employee: { select: { firstName: true, lastName: true } } },
    });

    return { department: dept, leaves };
  }

  async checkConflicts(employeeId, startDate, endDate) {
    const conflict = await prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          { startDate: { lte: endDate }, endDate: { gte: startDate } },
        ],
      },
    });
    return !!conflict;
  }

  async initBalances(employeeId, year) {
    const leaveTypes = ['ANNUAL', 'SICK', 'CASUAL', 'MATERNITY', 'PATERNITY', 'UNPAID', 'COMPASSIONATE'];
    const defaults = { ANNUAL: 14, SICK: 10, CASUAL: 5, MATERNITY: 90, PATERNITY: 14, UNPAID: 0, COMPASSIONATE: 3 };

    return Promise.all(
      leaveTypes.map((lt) =>
        prisma.leaveBalance.upsert({
          where: { employeeId_leaveType_year: { employeeId, leaveType: lt, year } },
          create: {
            id: uuidv4(),
            employeeId,
            leaveType: lt,
            year,
            totalEntitled: defaults[lt],
            remaining: defaults[lt],
          },
          update: {},
        })
      )
    );
  }

  // ── private ──────────────────────────────────────────────────────────────────

  async _findPendingLeave(leaveId) {
    const leave = await prisma.leaveRequest.findFirst({ where: { id: leaveId, status: 'PENDING' } });
    if (!leave) throw Object.assign(new Error('Leave request not found or not pending'), { status: 404 });
    return leave;
  }

  async _adjustBalance(employeeId, leaveType, year, deltas) {
    const { pendingDelta = 0, usedDelta = 0, remainingDelta = 0 } = deltas;
    const balance = await prisma.leaveBalance.findFirst({ where: { employeeId, leaveType, year } });
    if (!balance) return;

    await prisma.leaveBalance.update({
      where: { id: balance.id },
      data: {
        pending:   { increment: pendingDelta },
        used:      { increment: usedDelta },
        remaining: { increment: remainingDelta },
      },
    });
  }

  _calcDays(start, end) {
    const msPerDay = 86400000;
    return Math.round((end - start) / msPerDay) + 1;
  }
}

module.exports = new LeaveService();
