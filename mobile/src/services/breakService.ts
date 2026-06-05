import { api } from './api';

export async function startBreakApi(breakType: string): Promise<{ id: string; startTime: string }> {
  const res = await api.post<{ success: boolean; data: any }>('/breaks', { breakType });
  return { id: res.data.id, startTime: res.data.startTime };
}

export async function endBreakApi(breakId: string): Promise<void> {
  await api.put(`/breaks/${breakId}/end`, {});
}

export async function getActiveBreakApi(): Promise<{ id: string; breakType: string; startTime: string } | null> {
  const res = await api.get<{ success: boolean; data: any }>('/breaks/active');
  return res.data ?? null;
}
