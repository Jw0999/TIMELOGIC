import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';

/**
 * Collects the device / network / location context the backend needs to
 * enforce the check-in pipeline (device binding → Wi-Fi → geo-fence).
 *
 * IMPORTANT (Android): the Wi-Fi SSID can only be read AFTER location
 * permission is granted AND location services are ON. So we must request
 * permission *before* calling NetInfo — never in parallel.
 */

const DEVICE_ID_FILE = `${FileSystem.documentDirectory}device-id.txt`;

function makeId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Stable per-install device identifier, persisted to the document directory. */
export async function getDeviceId(): Promise<string> {
  try {
    const info = await FileSystem.getInfoAsync(DEVICE_ID_FILE);
    if (info.exists) {
      const id = await FileSystem.readAsStringAsync(DEVICE_ID_FILE);
      if (id && id.trim()) return id.trim();
    }
    const fresh = makeId();
    await FileSystem.writeAsStringAsync(DEVICE_ID_FILE, fresh);
    return fresh;
  } catch {
    return makeId();
  }
}

// Values NetInfo returns when it CAN'T actually read the SSID
const BAD_SSIDS = ['<unknown ssid>', 'unknown ssid', 'unknown', '02:00:00:00:00:00', ''];

function cleanSSID(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  // Strip surrounding quotes some platforms add, then trim
  const s = raw.replace(/^"+|"+$/g, '').trim();
  if (!s) return null;
  if (BAD_SSIDS.includes(s.toLowerCase())) return null;
  return s;
}

/**
 * Reads the current Wi-Fi SSID. Assumes location permission is already
 * granted (call requestLocationPermission first). Retries briefly because
 * NetInfo sometimes returns a stale/empty value on the first call.
 */
export async function getWifiSSID(): Promise<string | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const state = await NetInfo.fetch('wifi');
      if (state.type === 'wifi' && state.details) {
        const ssid = cleanSSID((state.details as any).ssid);
        if (ssid) return ssid;
      }
    } catch {
      /* retry */
    }
    // brief backoff before retrying
    await new Promise((r) => setTimeout(r, 300));
  }
  return null;
}

/** Request foreground location permission. Returns true if granted. */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const current = await Location.getForegroundPermissionsAsync();
    if (current.granted) return true;
    const req = await Location.requestForegroundPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

/** True only if the device is actually connected to a Wi-Fi network right now. */
async function isConnectedToWifi(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch('wifi');
    return state.type === 'wifi' && state.isConnected === true;
  } catch {
    return false;
  }
}

/**
 * Gather the check-in context: stable device id + verified Wi-Fi SSID.
 *
 * STRICT: this NEVER returns a null/empty SSID. If we cannot positively confirm
 * the device is on a Wi-Fi network and read its name, it throws a clear, blocking
 * error so the app never sends a null that could slip past the Wi-Fi check. This
 * is identical on iOS and Android (iOS needs the wifi-info entitlement, which the
 * production build ships, plus Location permission + Location Services ON).
 */
export async function collectCheckInContext(): Promise<{
  deviceId: string;
  wifiSSID: string;
  platform: string;
}> {
  const deviceId = await getDeviceId();

  // 1. Location permission (required to read the SSID on iOS AND Android)
  const granted = await requestLocationPermission();
  if (!granted) {
    throw new Error('Allow Location permission so we can confirm you are on the company Wi-Fi, then try again.');
  }

  // 2. Location Services (GPS) must be ON, or the OS hides the SSID
  try {
    const servicesOn = await Location.hasServicesEnabledAsync();
    if (!servicesOn) {
      throw new Error('Turn ON Location/GPS so we can verify the company Wi-Fi, then try again.');
    }
  } catch (e: any) {
    if (e?.message?.includes('Location')) throw e;
  }

  // 3. Must actually be connected to Wi-Fi (not mobile data)
  if (!(await isConnectedToWifi())) {
    throw new Error('You are not connected to Wi-Fi. Connect to the company Wi-Fi to check in.');
  }

  // 4. Read the SSID — must be a real value, never null
  const wifiSSID = await getWifiSSID();
  if (!wifiSSID) {
    throw new Error('Could not read your Wi-Fi name. Make sure Location is ON and you are connected to the company Wi-Fi, then try again.');
  }

  return { deviceId, wifiSSID, platform: Platform.OS };
}
