import { api } from './api';
import { tokenStore } from './tokenStore';
import { getDeviceId } from './deviceInfo';

export interface AuthUser {
  id: string;
  employeeCode: string | null;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  shiftType: string;
  orgId: string;
  departmentId?: string | null;
  profileImageUrl?: string | null;  // path to face photo (used for avatar + face verification)
}

interface LoginResponse {
  success: boolean;
  data: { accessToken: string; refreshToken: string; user: AuthUser };
}

export async function loginApi(identifier: string, password: string) {
  const isEmail = identifier.includes('@');
  // Bind this phone to the account (one device per employee, enforced server-side)
  const deviceFingerprint = await getDeviceId();
  const body = isEmail
    ? { email: identifier, password, deviceFingerprint }
    : { employeeCode: identifier, password, deviceFingerprint };
  const res = await api.post<LoginResponse>('/auth/login', body);
  const { accessToken, refreshToken, user } = res.data;
  tokenStore.set(accessToken, refreshToken);
  return user;
}

export async function logoutApi() {
  const refresh = tokenStore.getRefresh();
  if (refresh) {
    await api.post('/auth/logout', { refreshToken: refresh }).catch(() => {});
  }
  tokenStore.clear();
}

export async function getMeApi(): Promise<AuthUser> {
  const res = await api.get<{ success: boolean; data: AuthUser }>('/auth/me');
  return res.data;
}
