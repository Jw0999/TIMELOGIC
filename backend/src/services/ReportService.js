const { v4: uuidv4 } = require('uuid');
const { prisma } = require('../config/database');
const XLSX = require('xlsx');

class ReportService {
  async generateDaily(date, adminId, orgId) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    return this._generate('daily', d, end, adminId, orgId);
  }

  async generateWeekly(weekStart, adminId, orgId) {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return this._generate('weekly', start, end, adminId, orgId);
  }

  async generateMonthly(year, month, adminId, orgId) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return this._generate('monthly', start, end, adminId, orgId);
  }

  async generateCustom(startDate, endDate, adminId, orgId) {
    return this._generate('custom', new Date(startDate), new Date(endDate), adminId, orgId);
  }

  async generateByDepartment(departmentId, startDate, endDate, adminId) {
    const employees = await prisma.user.findMany({
      where: { departmentId, status: 'ACTIVE' },
      select: { id: true },
    });
    const empIds = employees.map((e) => e.id);
    return this._generate('department', new Date(startDate), new Date(endDate), adminId, null, { employeeId: { in: empIds } });
  }

  async generateByEmployee(employeeId, startDate, endDate, adminId) {
    return this._generate('employee', new Date(startDate), new Date(endDate), adminId, null, { employeeId });
  }

  // ─── Comprehensive export with full database ───────────────────────────────

  async buildFullExport(orgId) {
    // orgId = null means super admin — export ALL organizations
    const orgFilter = orgId && orgId !== 'platform-org'
      ? { orgId }
      : {};
    const empOrgFilter = orgId && orgId !== 'platform-org'
      ? { employee: { orgId } }
      : {};

    const sessionOrgFilter = orgId && orgId !== 'platform-org' ? { office: { orgId } } : {};

    const [employees, attendanceRecords, leaveRequests, breakRecords, fraudAlerts, sessions] = await Promise.all([
      // All employees (including terminated — full history)
      prisma.user.findMany({
        where: { ...orgFilter, role: { in: ['EMPLOYEE', 'ADMIN'] } },
        select: {
          id: true, firstName: true, lastName: true, email: true,
          employeeCode: true, shiftType: true, status: true, createdAt: true,
          organization: { select: { name: true } },
          department: { select: { name: true } },
          profileImageUrl: true,
        },
        orderBy: [{ organization: { name: 'asc' } }, { firstName: 'asc' }],
      }),
      // All attendance records with employee + org details
      prisma.attendanceRecord.findMany({
        where: empOrgFilter,
        include: {
          employee: {
            select: {
              firstName: true, lastName: true, email: true, employeeCode: true, status: true,
              organization: { select: { name: true } },
              department: { select: { name: true } },
            },
          },
          session: { select: { sessionName: true, startTime: true } },
        },
        orderBy: [{ date: 'desc' }],
      }),
      // All leave requests
      prisma.leaveRequest.findMany({
        where: empOrgFilter,
        include: {
          employee: {
            select: {
              firstName: true, lastName: true, employeeCode: true,
              organization: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // All break records
      prisma.breakRecord.findMany({
        where: empOrgFilter,
        include: {
          employee: {
            select: {
              firstName: true, lastName: true, employeeCode: true,
              organization: { select: { name: true } },
            },
          },
        },
        orderBy: { startTime: 'desc' },
      }),
      // Fraud alerts
      prisma.fraudAlert.findMany({
        where: empOrgFilter,
        include: {
          employee: {
            select: {
              firstName: true, lastName: true, employeeCode: true,
              organization: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // All attendance sessions (full history — never deleted)
      prisma.attendanceSession.findMany({
        where: sessionOrgFilter,
        select: {
          sessionName: true, officeName: true, orgName: true, status: true,
          startTime: true, endTime: true, createdAt: true,
          office: { select: { name: true, organization: { select: { name: true } } } },
          _count: { select: { attendanceRecords: true, scanAttempts: true } },
        },
        orderBy: { startTime: 'desc' },
      }),
    ]);
    return { employees, attendanceRecords, leaveRequests, breakRecords, fraudAlerts, sessions };
  }

  exportToExcel(records, reportMeta) {
    // Legacy single-sheet export
    return this._buildExcelFromAttendance(records);
  }

  async exportFullToExcel(orgId) {
    const data = await this.buildFullExport(orgId);
    const wb = XLSX.utils.book_new();

    // Sheet 1: Attendance Records — ALL records (including terminated employees)
    const attendanceRows = data.attendanceRecords.map((r) => ({
      'Organization':   r.employee?.organization?.name ?? '',
      'Date':           r.date?.toISOString().split('T')[0] ?? '',
      'Day':            r.date ? r.date.toLocaleDateString('en-GB', { weekday: 'long' }) : '',
      'Month':          r.date ? r.date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : '',
      'Employee Code':  r.employee?.employeeCode ?? '',
      'Employee Name':  `${r.employee?.firstName ?? ''} ${r.employee?.lastName ?? ''}`.trim(),
      'Emp Status':     r.employee?.status ?? '',
      'Department':     r.employee?.department?.name ?? '',
      'Session':        r.session?.sessionName ?? '',
      'Clock In':       r.clockInTime ? this._fmtTime(r.clockInTime) : '',
      'Clock Out':      r.clockOutTime ? this._fmtTime(r.clockOutTime) : '',
      'Status':         r.status ?? '',
      'Penalty (NGN)':  r.penalty ?? 0,
      'Work Hours':     r.totalWorkHours?.toFixed(2) ?? '',
      'Break (min)':    r.totalBreakMinutes ?? 0,
      'WiFi Verified':  r.wifiVerified ? 'Yes' : 'No',
      'Device Verified':r.deviceVerified ? 'Yes' : 'No',
      'Flagged':        r.flagged ? 'Yes' : 'No',
      'Flag Reason':    r.flagReason ?? '',
    }));
    const attSheet = attendanceRows.length ? XLSX.utils.json_to_sheet(attendanceRows) : XLSX.utils.json_to_sheet([{ Note: 'No attendance records' }]);
    XLSX.utils.book_append_sheet(wb, attSheet, 'Attendance');

    // Sheet 2: All Employees (including TERMINATED/sacked)
    const empRows = data.employees.map((e) => ({
      'Organization':  e.organization?.name ?? '',
      'Employee Code': e.employeeCode ?? '',
      'First Name':    e.firstName,
      'Last Name':     e.lastName,
      'Email':         e.email,
      'Department':    e.department?.name ?? '',
      'Shift Type':    e.shiftType,
      'Employment Status': e.status,
      'Face Registered': e.profileImageUrl ? 'Yes' : 'No',
      'Joined':        e.createdAt?.toISOString().split('T')[0] ?? '',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(empRows.length ? empRows : [{ Note: 'No employees' }]), 'Employees');

    // Sheet 3: Leave Requests
    const leaveRows = data.leaveRequests.map((l) => ({
      'Organization':  l.employee?.organization?.name ?? '',
      'Employee Code': l.employee?.employeeCode ?? '',
      'Employee Name': `${l.employee?.firstName ?? ''} ${l.employee?.lastName ?? ''}`.trim(),
      'Leave Type':    l.leaveType,
      'Start Date':    l.startDate?.toISOString().split('T')[0] ?? '',
      'End Date':      l.endDate?.toISOString().split('T')[0] ?? '',
      'Total Days':    l.totalDays,
      'Status':        l.status,
      'Reason':        l.reason ?? '',
      'Submitted':     l.createdAt?.toISOString().split('T')[0] ?? '',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(leaveRows.length ? leaveRows : [{ Note: 'No leave requests' }]), 'Leave Requests');

    // Sheet 4: Break Records
    const breakRows = data.breakRecords.map((b) => ({
      'Organization':  b.employee?.organization?.name ?? '',
      'Employee Code': b.employee?.employeeCode ?? '',
      'Employee Name': `${b.employee?.firstName ?? ''} ${b.employee?.lastName ?? ''}`.trim(),
      'Break Type':    b.breakType,
      'Start':         b.startTime ? this._fmtTime(b.startTime) : '',
      'End':           b.endTime ? this._fmtTime(b.endTime) : 'Active',
      'Duration (min)': b.durationMinutes ?? '',
      'Auto-Ended':    b.isAutoEnded ? 'Yes' : 'No',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(breakRows.length ? breakRows : [{ Note: 'No break records' }]), 'Break Records');

    // Sheet 5: Fraud Alerts
    const fraudRows = data.fraudAlerts.map((f) => ({
      'Organization':  f.employee?.organization?.name ?? '',
      'Employee Code': f.employee?.employeeCode ?? '',
      'Employee Name': `${f.employee?.firstName ?? ''} ${f.employee?.lastName ?? ''}`.trim(),
      'Fraud Type':    f.fraudType,
      'Severity':      f.severity,
      'Description':   f.description,
      'Status':        f.status,
      'Date':          f.createdAt?.toISOString().split('T')[0] ?? '',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fraudRows.length ? fraudRows : [{ Note: 'No fraud alerts' }]), 'Fraud Alerts');

    // Sheet 6: Attendance Sessions (full history — never deleted)
    const sessionRows = (data.sessions ?? []).map((s) => ({
      'Organization':  s.office?.organization?.name ?? s.orgName ?? '',
      'Office':        s.office?.name ?? s.officeName ?? '',
      'Session':       s.sessionName ?? '',
      'Status':        s.status ?? '',
      'Date':          s.startTime ? s.startTime.toISOString().split('T')[0] : '',
      'Day':           s.startTime ? s.startTime.toLocaleDateString('en-GB', { weekday: 'long' }) : '',
      'Month':         s.startTime ? s.startTime.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : '',
      'Start Time':    s.startTime ? this._fmtTime(s.startTime) : '',
      'End Time':      s.endTime ? this._fmtTime(s.endTime) : '',
      'Check-ins':     s._count?.attendanceRecords ?? 0,
      'Scan Attempts': s._count?.scanAttempts ?? 0,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sessionRows.length ? sessionRows : [{ Note: 'No sessions' }]), 'Sessions');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  async exportFullToCSV(orgId) {
    const data = await this.buildFullExport(orgId);
    const sections = [];

    sections.push('ATTENDANCE RECORDS (ALL — includes terminated employees)');
    const attHeaders = 'Organization,Date,Day,Month,Employee Code,Employee Name,Emp Status,Department,Clock In,Clock Out,Status,Penalty (NGN),Work Hours,Break (min),WiFi Verified,Device Verified,Flagged';
    sections.push(attHeaders);
    for (const r of data.attendanceRecords) {
      const row = [
        r.employee?.organization?.name ?? '',
        r.date?.toISOString().split('T')[0] ?? '',
        r.date ? r.date.toLocaleDateString('en-GB', { weekday: 'long' }) : '',
        r.date ? r.date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : '',
        r.employee?.employeeCode ?? '',
        `${r.employee?.firstName ?? ''} ${r.employee?.lastName ?? ''}`.trim(),
        r.employee?.status ?? '',
        r.employee?.department?.name ?? '',
        r.clockInTime ? this._fmtTime(r.clockInTime) : '',
        r.clockOutTime ? this._fmtTime(r.clockOutTime) : '',
        r.status ?? '',
        r.penalty ?? 0,
        r.totalWorkHours?.toFixed(2) ?? '',
        r.totalBreakMinutes ?? 0,
        r.wifiVerified ? 'Yes' : 'No',
        r.deviceVerified ? 'Yes' : 'No',
        r.flagged ? 'Yes' : 'No',
      ];
      sections.push(row.join(','));
    }

    sections.push('');
    sections.push('EMPLOYEES (ALL — including terminated/sacked)');
    sections.push('Organization,Employee Code,Name,Email,Department,Shift,Employment Status,Face Registered,Joined');
    for (const e of data.employees) {
      sections.push([
        e.organization?.name ?? '',
        e.employeeCode ?? '',
        `${e.firstName} ${e.lastName}`,
        e.email,
        e.department?.name ?? '',
        e.shiftType,
        e.status,
        e.profileImageUrl ? 'Yes' : 'No',
        e.createdAt?.toISOString().split('T')[0] ?? '',
      ].join(','));
    }

    sections.push('');
    sections.push('LEAVE REQUESTS');
    sections.push('Organization,Employee Code,Name,Type,Start,End,Days,Status,Reason');
    for (const l of data.leaveRequests) {
      sections.push([
        l.employee?.organization?.name ?? '',
        l.employee?.employeeCode ?? '',
        `${l.employee?.firstName ?? ''} ${l.employee?.lastName ?? ''}`.trim(),
        l.leaveType,
        l.startDate?.toISOString().split('T')[0] ?? '',
        l.endDate?.toISOString().split('T')[0] ?? '',
        l.totalDays,
        l.status,
        (l.reason ?? '').replace(/,/g, ';'),
      ].join(','));
    }

    sections.push('');
    sections.push('BREAK RECORDS');
    sections.push('Organization,Employee Code,Name,Break Type,Start,End,Duration (min),Auto-Ended');
    for (const b of data.breakRecords) {
      sections.push([
        b.employee?.organization?.name ?? '',
        b.employee?.employeeCode ?? '',
        `${b.employee?.firstName ?? ''} ${b.employee?.lastName ?? ''}`.trim(),
        b.breakType,
        b.startTime ? this._fmtTime(b.startTime) : '',
        b.endTime ? this._fmtTime(b.endTime) : 'Active',
        b.durationMinutes ?? '',
        b.isAutoEnded ? 'Yes' : 'No',
      ].join(','));
    }

    sections.push('');
    sections.push('ATTENDANCE SESSIONS (full history — never deleted)');
    sections.push('Organization,Office,Session,Status,Date,Day,Month,Start Time,End Time,Check-ins,Scan Attempts');
    for (const s of (data.sessions ?? [])) {
      sections.push([
        s.office?.organization?.name ?? s.orgName ?? '',
        s.office?.name ?? s.officeName ?? '',
        (s.sessionName ?? '').replace(/,/g, ';'),
        s.status ?? '',
        s.startTime ? s.startTime.toISOString().split('T')[0] : '',
        s.startTime ? s.startTime.toLocaleDateString('en-GB', { weekday: 'long' }) : '',
        s.startTime ? s.startTime.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : '',
        s.startTime ? this._fmtTime(s.startTime) : '',
        s.endTime ? this._fmtTime(s.endTime) : '',
        s._count?.attendanceRecords ?? 0,
        s._count?.scanAttempts ?? 0,
      ].join(','));
    }

    return sections.join('\n');
  }

  exportToCSV(records) {
    // Legacy CSV export
    const rows = records.map((r) => ({
      date: r.date?.toISOString().split('T')[0],
      employee: `${r.employee?.firstName ?? r.employeeId} ${r.employee?.lastName ?? ''}`.trim(),
      status: r.status,
      clockIn: r.clockInTime ? this._fmtTime(r.clockInTime) : '',
      clockOut: r.clockOutTime ? this._fmtTime(r.clockOutTime) : '',
      workHours: r.totalWorkHours?.toFixed(2) ?? '',
      breakMinutes: r.totalBreakMinutes ?? 0,
      wifiVerified: r.wifiVerified ? 'Yes' : 'No',
      flagged: r.flagged ? 'Yes' : 'No',
    }));
    if (!rows.length) return '';
    const headers = Object.keys(rows[0]).join(',');
    const lines = rows.map((r) => Object.values(r).join(','));
    return [headers, ...lines].join('\n');
  }

  _fmtTime(d) {
    if (!d) return '';
    return new Date(d).toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  }

  _buildExcelFromAttendance(records) {
    const rows = records.map((r) => ({
      Date: r.date?.toISOString().split('T')[0],
      Employee: `${r.employee?.firstName ?? r.employeeId} ${r.employee?.lastName ?? ''}`.trim(),
      Status: r.status,
      'Clock In': r.clockInTime ? this._fmtTime(r.clockInTime) : '',
      'Clock Out': r.clockOutTime ? this._fmtTime(r.clockOutTime) : '',
      'Work Hours': r.totalWorkHours?.toFixed(2) ?? '',
      'Break (min)': r.totalBreakMinutes ?? 0,
      'WiFi OK': r.wifiVerified ? 'Yes' : 'No',
      Flagged: r.flagged ? 'Yes' : 'No',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  async getDashboardLiveStats(orgId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orgEmployees = await prisma.user.findMany({
      where: { orgId, role: 'EMPLOYEE', status: 'ACTIVE' },
      select: { id: true },
    });
    const empIds = orgEmployees.map((e) => e.id);
    const total = empIds.length;

    const [present, late, onLeave, absent, flagged, openAlerts, activeSessions] = await Promise.all([
      prisma.attendanceRecord.count({ where: { employeeId: { in: empIds }, date: today, status: 'PRESENT' } }),
      prisma.attendanceRecord.count({ where: { employeeId: { in: empIds }, date: today, status: 'LATE' } }),
      prisma.attendanceRecord.count({ where: { employeeId: { in: empIds }, date: today, status: 'ON_LEAVE' } }),
      prisma.attendanceRecord.count({ where: { employeeId: { in: empIds }, date: today, status: 'ABSENT' } }),
      prisma.attendanceRecord.count({ where: { employeeId: { in: empIds }, date: today, flagged: true } }),
      prisma.fraudAlert.count({ where: { employeeId: { in: empIds }, status: 'NEW' } }),
      prisma.attendanceSession.count({ where: { office: { orgId }, status: { in: ['ACTIVE', 'PAUSED'] } } }),
    ]);

    return { total, present, late, onLeave, absent, notRecorded: total - present - late - onLeave - absent, flagged, openAlerts, activeSessions };
  }

  // ── private ──────────────────────────────────────────────────────────────────

  async _generate(reportType, start, end, adminId, orgId, extraFilter = {}) {
    const orgFilter = orgId
      ? { employee: { orgId } }
      : {};

    const records = await prisma.attendanceRecord.findMany({
      where: {
        date: { gte: start, lte: end },
        ...orgFilter,
        ...extraFilter,
      },
      include: { employee: { select: { firstName: true, lastName: true, departmentId: true } } },
    });

    const totalPresent  = records.filter((r) => r.status === 'PRESENT').length;
    const totalLate     = records.filter((r) => r.status === 'LATE').length;
    const totalAbsent   = records.filter((r) => r.status === 'ABSENT').length;
    const totalOnLeave  = records.filter((r) => r.status === 'ON_LEAVE').length;
    const totalFlagged  = records.filter((r) => r.flagged).length;
    const avgWork       = records.filter((r) => r.totalWorkHours).reduce((s, r) => s + r.totalWorkHours, 0) / (records.length || 1);
    const avgBreak      = Math.round(records.reduce((s, r) => s + r.totalBreakMinutes, 0) / (records.length || 1));

    // Check adminId still exists (can be deleted after org removal)
    const adminExists = adminId
      ? await prisma.user.findUnique({ where: { id: adminId }, select: { id: true } }).catch(() => null)
      : null;

    const report = adminExists
      ? await prisma.attendanceReport.create({
          data: {
            id: uuidv4(), reportType,
            dateRangeStart: start, dateRangeEnd: end,
            totalPresent, totalLate, totalAbsent, totalOnLeave, totalFlagged,
            averageWorkHours: parseFloat(avgWork.toFixed(2)),
            averageBreakMinutes: avgBreak,
            generatedBy: adminId,
            metadata: { recordCount: records.length },
          },
        }).catch(() => ({ id: null, reportType }))
      : { id: null, reportType };

    return { report, records };
  }
}

module.exports = new ReportService();
