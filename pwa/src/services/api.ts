import { API_URL } from "../config";

const ACCESS = "tl_access";
const REFRESH = "tl_refresh";

export const tokens = {
  get access() {
    return localStorage.getItem(ACCESS);
  },
  set(access: string, refresh: string) {
    localStorage.setItem(ACCESS, access);
    localStorage.setItem(REFRESH, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
  },
};

export interface ApiError extends Error {
  reason?: string;
  status?: number;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const access = tokens.access;
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
      ...(options.headers || {}),
    },
  });

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    /* no body */
  }

  if (!res.ok) {
    const err = new Error(body?.message || `Request failed (${res.status})`) as ApiError;
    err.reason = body?.reason;
    err.status = res.status;
    throw err;
  }
  return (body?.data ?? body) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
};
