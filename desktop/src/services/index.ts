import { api } from './api';
import { API_URL } from '../config';

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const fetchLiveStats   = () => api.get<any>('/reports/live-stats').then((r) => r.data ?? r);

// ─── Sessions ────────────────────────────────────────────────────────────────
export const fetchSessions    = () => api.get<any>('/sessions').then((r) => r.data ?? []);
export const createSession    = (body: any) => api.post<any>('/sessions', body).then((r) => r.data);
export const startSession     = (id: string) => api.post<any>(`/sessions/${id}/start`, {}).then((r) => r.data);
export const pauseSession     = (id: string) => api.post<any>(`/sessions/${id}/pause`, {}).then((r) => r.data);
export const resumeSession    = (id: string) => api.post<any>(`/sessions/${id}/resume`, {}).then((r) => r.data);
export const endSession       = (id: string) => api.post<any>(`/sessions/${id}/end`, {}).then((r) => r.data);
export const lockSession      = (id: string) => api.post<any>(`/sessions/${id}/lock`, {}).then((r) => r.data);
export const refreshQR        = (id: string) => api.post<any>(`/sessions/${id}/refresh-qr`, {}).then((r) => r.data);

// ─── Attendance ──────────────────────────────────────────────────────────────
export const fetchAttendance  = (query = '') => api.get<any>(`/attendance/history${query}`).then((r) => r.data ?? []);
export const fetchFlagged     = () => api.get<any>('/attendance/flagged').then((r) => r.data ?? []);
export const flagRecord       = (id: string, reason: string) => api.put<any>(`/attendance/records/${id}/flag`, { reason });
export const approveRecord    = (id: string) => api.put<any>(`/attendance/records/${id}/approve`, {});

// ─── Employees ───────────────────────────────────────────────────────────────
export const fetchEmployees   = () => api.get<any>('/admin/users').then((r) => r.data ?? []);
export const fetchPlanInfo    = () => api.get<any>('/admin/plan').then((r) => r.data);
export const createEmployee   = (body: any) => api.post<any>('/admin/employees', body).then((r) => r.data);
export const suspendUser      = (id: string) => api.put<any>(`/admin/users/${id}/suspend`, {});
export const activateUser     = (id: string) => api.put<any>(`/admin/users/${id}`, { status: 'ACTIVE' });
export const deleteEmployee   = (id: string) => api.delete<any>(`/admin/users/${id}`);
export const fetchDepartments = () => api.get<any>('/admin/org').then((r) => (r.data?.departments ?? []));

// ─── Leaves ──────────────────────────────────────────────────────────────────
export const fetchPendingLeaves = () => api.get<any>('/leaves/pending').then((r) => r.data ?? []);
export const approveLeave       = (id: string) => api.put<any>(`/leaves/${id}/approve`, {});
export const rejectLeave        = (id: string, reason: string) => api.put<any>(`/leaves/${id}/reject`, { rejectionReason: reason });

// ─── Breaks ──────────────────────────────────────────────────────────────────
export const fetchDailyBreaks  = () => api.get<any>('/breaks/daily').then((r) => r.data ?? []);

// ─── Fraud Alerts ────────────────────────────────────────────────────────────
export const fetchAlerts      = () => api.get<any>('/fraud').then((r) => r.data ?? []);
export const resolveAlert     = (id: string, resolution: string) => api.put<any>(`/fraud/${id}/resolve`, { resolution });
export const dismissAlert     = (id: string) => api.put<any>(`/fraud/${id}/dismiss`, {});
export const escalateAlert    = (id: string) => api.put<any>(`/fraud/${id}/escalate`, {});

// ─── Reports ─────────────────────────────────────────────────────────────────
export const fetchDailyReport = () => api.get<any>('/reports/daily').then((r) => r.data);
export const fetchMonthlyReport= () => api.get<any>('/reports/monthly').then((r) => r.data);
export const getExcelUrl      = () => `${API_URL}/reports/export/excel`;
export const getCsvUrl        = () => `${API_URL}/reports/export/csv`;

// ─── Office / Check-In Enforcement Settings ──────────────────────────────────
export const fetchAdminOrg       = () => api.get<any>('/admin/org').then((r) => r.data);
export const updateOfficeSettings = (officeId: string, body: any) =>
  api.put<any>(`/admin/offices/${officeId}/settings`, body).then((r) => r.data);

// ─── Emergency ───────────────────────────────────────────────────────────────
export const stopAllAttendance = (officeId: string, reason: string) => api.post<any>('/admin/emergency/stop-all', { officeId, reason });
export const lockSystem        = (reason: string) => api.post<any>('/admin/emergency/lock-system', { reason });
export const invalidateQR      = (officeId: string, reason: string) => api.post<any>('/admin/emergency/invalidate-qr', { officeId, reason });
export const revertEmergency   = (controlId: string) => api.post<any>(`/admin/emergency/${controlId}/revert`, {});
