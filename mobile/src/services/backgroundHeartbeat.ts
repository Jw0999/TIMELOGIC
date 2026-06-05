// Background Wi-Fi heartbeat. Supplements the foreground 60s ping for when the app
// is backgrounded. The OS controls actual cadence (min ~15 min) and may withhold
// runs to save battery, so this is best-effort, not a replacement for foreground.
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { tokenStore } from './tokenStore';
import { sendHeartbeat } from './heartbeat';

export const HEARTBEAT_TASK = 'timelogic-wifi-heartbeat';

// MUST be defined at module scope so the OS can find it when it wakes the app.
TaskManager.defineTask(HEARTBEAT_TASK, async () => {
  try {
    // Fresh JS context on wake — restore the token from SecureStore first.
    const token = await tokenStore.loadFromSecureStore();
    if (!token) return BackgroundFetch.BackgroundFetchResult.NoData;
    const res = await sendHeartbeat();
    return res?.tracked
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundHeartbeat() {
  try {
    const already = await TaskManager.isTaskRegisteredAsync(HEARTBEAT_TASK);
    if (already) return;
    await BackgroundFetch.registerTaskAsync(HEARTBEAT_TASK, {
      minimumInterval: 15 * 60, // seconds; OS-enforced floor is ~15 min
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch { /* unsupported (e.g. Expo Go) — foreground ping still runs */ }
}

export async function unregisterBackgroundHeartbeat() {
  try {
    const already = await TaskManager.isTaskRegisteredAsync(HEARTBEAT_TASK);
    if (already) await BackgroundFetch.unregisterTaskAsync(HEARTBEAT_TASK);
  } catch { /* ignore */ }
}
