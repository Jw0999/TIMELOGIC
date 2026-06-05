const ReportService = require('../services/ReportService');

const daily = async (req, res, next) => {
  try {
    const { date } = req.query;
    const result = await ReportService.generateDaily(date || new Date(), req.user.id, req.user.orgId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

const weekly = async (req, res, next) => {
  try {
    // Default weekStart to the most recent Monday
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const weekStart = req.query.weekStart || monday.toISOString().split('T')[0];
    const result = await ReportService.generateWeekly(weekStart, req.user.id, req.user.orgId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

const monthly = async (req, res, next) => {
  try {
    // Default to current month/year when not provided
    const now = new Date();
    const year  = req.query.year  ? +req.query.year  : now.getFullYear();
    const month = req.query.month ? +req.query.month : now.getMonth() + 1;
    const result = await ReportService.generateMonthly(year, month, req.user.id, req.user.orgId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

const custom = async (req, res, next) => {
  try {
    const now = new Date();
    const startDate = req.query.startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate   = req.query.endDate   || now.toISOString().split('T')[0];
    const result = await ReportService.generateCustom(startDate, endDate, req.user.id, req.user.orgId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

const byDepartment = async (req, res, next) => {
  try {
    const { departmentId, startDate, endDate } = req.query;
    const result = await ReportService.generateByDepartment(departmentId, startDate, endDate, req.user.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

const byEmployee = async (req, res, next) => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    const result = await ReportService.generateByEmployee(employeeId, startDate, endDate, req.user.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

const exportExcel = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    // Super Admin (platform-org) gets ALL orgs; regular admin gets only their org
    const exportOrgId = req.user.role === 'SUPER_ADMIN' ? null : req.user.orgId;
    const buffer = await ReportService.exportFullToExcel(exportOrgId);
    const prefix = req.user.role === 'SUPER_ADMIN' ? 'all-orgs' : 'org';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${prefix}-full-report-${today}.xlsx"`);
    res.send(buffer);
  } catch (err) { next(err); }
};

const exportCSV = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const exportOrgId = req.user.role === 'SUPER_ADMIN' ? null : req.user.orgId;
    const csv = await ReportService.exportFullToCSV(exportOrgId);
    const prefix = req.user.role === 'SUPER_ADMIN' ? 'all-orgs' : 'org';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${prefix}-full-report-${today}.csv"`);
    res.send(csv);
  } catch (err) { next(err); }
};

const liveStats = async (req, res, next) => {
  try {
    const stats = await ReportService.getDashboardLiveStats(req.user.orgId);
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
};

module.exports = { daily, weekly, monthly, custom, byDepartment, byEmployee, exportExcel, exportCSV, liveStats };
