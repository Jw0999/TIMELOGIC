import { api } from './api';
import { getWifiSSID } from './deviceInfo';

export interface HeartbeatResult {
  tracked: boolean;
  onWifi: boolean | null;
  breakEnded?: boolean;
}

/**
 * Sends one Wi-Fi presence ping. The backend uses it to track live presence and
 * to auto-end a break when the employee returns to the office Wi-Fi. Safe to call
 * on a timer; failures are swallowed so a flaky network never crashes the app.
 */
export async function sendHeartbeat(): Promise<HeartbeatResult | null> {
  try {
    const wifiSSID = await getWifiSSID();
    const res = await api.post<{ success: boolean; data: HeartbeatResult }>(
      '/attendance/heartbeat',
      { wifiSSID },
    );
    return res.data;
  } catch {
    return null;
  }
}
