import { api } from './api';
import { collectCheckInContext } from './deviceInfo';

export interface AttendanceStatus {
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  status: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  totalWorkHours: string | null;
  onBreak: boolean;
  breakType: string | null;
  breakStartTime: string | null;
  penalty?: number;
  record?: any;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  clockInTime: string | null;
  clockOutTime: string | null;
  status: string;
  totalWorkHours: string | null;
  totalBreakMinutes: number;
  flagged: boolean;
  wifiVerified: boolean;
  deviceVerified: boolean;
}

export async function getTodayStatus(): Promise<AttendanceStatus> {
  const res = await api.get<{ success: boolean; data: any }>('/attendance/status');
  const d = res.data;
  return {
    hasCheckedIn: !!d?.clockInTime,
    hasCheckedOut: !!d?.clockOutTime,
    status: d?.status ?? null,
    checkInTime: d?.clockInTime
      ? new Date(d.clockInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      : null,
    checkOutTime: d?.clockOutTime
      ? new Date(d.clockOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      : null,
    totalWorkHours: d?.totalWorkHours ?? null,
    onBreak: false,
    breakType: null,
    breakStartTime: null,
    record: d,
  };
}

// Step 1 — send Wi-Fi/device context; backend validates the network BEFORE
// returning a code. If they're on the wrong Wi-Fi, this throws with a message
// telling them to connect to the company network (no code is shown).
export async function requestChallenge(sessionId: string): Promise<{ code: string; expiresIn: number }> {
  const ctx = await collectCheckInContext();
  const res = await api.post<{ success: boolean; data: { code: string; expiresIn: number } }>(
    '/attendance/check-in/challenge', { sessionId, ...ctx }
  );
  return res.data;
}

// Step 2 — submit check-in with the code the user entered + device/wifi context
export async function checkInApi(payload: {
  sessionId: string;
  challengeCode: string;
}): Promise<AttendanceStatus> {
  // Collect device + wifi context for backend enforcement
  const ctx = await collectCheckInContext();
  const res = await api.post<{ success: boolean; data: any }>('/attendance/check-in', { ...payload, ...ctx });
  const d = res.data?.record;
  return {
    hasCheckedIn: true,
    hasCheckedOut: false,
    status: d?.status ?? 'PRESENT',
    checkInTime: d?.clockInTime
      ? new Date(d.clockInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    checkOutTime: null,
    totalWorkHours: null,
    onBreak: false,
    breakType: null,
    breakStartTime: null,
    penalty: res.data?.penalty ?? d?.penalty ?? 0,
    record: d,
  };
}

export async function checkOutApi(): Promise<{ checkOutTime: string; totalWorkHours: string | null }> {
  // Same device / wifi / location enforcement applies on check-out
  const ctx = await collectCheckInContext();
  const res = await api.post<{ success: boolean; data: any }>('/attendance/check-out', ctx);
  const d = res.data;
  return {
    checkOutTime: d?.clockOutTime
      ? new Date(d.clockOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    totalWorkHours: d?.totalWorkHours ?? null,
  };
}

export async function getHistoryApi(page = 1, limit = 50): Promise<AttendanceRecord[]> {
  const res = await api.get<any>(`/attendance/history?page=${page}&limit=${limit}`);
  // Backend returns { data: [...] } — fallback to res.records for safety
  const rows: any[] = Array.isArray(res.data) ? res.data : Array.isArray((res as any).records) ? (res as any).records : [];
  return rows.map((r: any) => ({
    id: r.id,
    date: r.date,
    clockInTime: r.clockInTime,
    clockOutTime: r.clockOutTime,
    status: r.status,
    totalWorkHours: r.totalWorkHours ?? r.total_work_hours ?? null,
    totalBreakMinutes: r.totalBreakMinutes ?? 0,
    flagged: r.flagged ?? false,
    wifiVerified: r.wifiVerified ?? false,
    deviceVerified: r.deviceVerified ?? false,
  }));
}
