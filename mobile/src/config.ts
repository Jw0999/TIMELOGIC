import Constants from 'expo-constants';

// Dynamically derive the backend API URL from the Expo dev server host, so the
// phone always reaches the backend on the same WiFi. We check every field Expo
// has used across SDK versions — `hostUri` is the current one (SDK 54), the
// others are older fallbacks.
function getDevHost(): string | null {
  const c: any = Constants;
  const candidates: (string | undefined)[] = [
    c.expoConfig?.hostUri,                       // SDK 49+ (current)
    c.expoGoConfig?.debuggerHost,                // SDK 48-ish
    c.expoGoConfig?.hostUri,
    c.manifest2?.extra?.expoGo?.debuggerHost,    // manifest2
    c.manifest?.debuggerHost,                    // classic manifest
    c.manifest?.hostUri,
  ];
  for (const h of candidates) {
    if (h && typeof h === 'string') return h;
  }
  return null;
}

function getApiUrl(): string {
  // 1. Explicit override (production / standalone builds)
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  // 2. Derive from the Expo dev server IP
  const host = getDevHost();
  if (host) {
    const ip = host.split(':')[0];
    return `http://${ip}:5000/api`;
  }

  // 3. Last resort (only works on an emulator running on this machine)
  return 'http://localhost:5000/api';
}

export const API_URL = getApiUrl();
export const SOCKET_URL = API_URL.replace('/api', '');

// Visible in the Metro logs so you can confirm the phone is hitting the right IP
console.log('[config] API_URL =', API_URL);
