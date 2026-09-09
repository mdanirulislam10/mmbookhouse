/**
 * Task 30: Client-Server Clock Synchronization & Time-Drift Manager
 * Computes difference between client local device clock and server clock (IST)
 */

let cachedServerOffsetMs = 0;
let isSynced = false;
let syncPromise: Promise<number> | null = null;

export async function syncServerTime(): Promise<number> {
  if (typeof window === 'undefined') return 0;
  if (syncPromise) return syncPromise;

  syncPromise = (async () => {
    try {
      const clientBeforeFetch = Date.now();
      const res = await fetch('/api/server-time', { cache: 'no-store' });
      const clientAfterFetch = Date.now();

      if (!res.ok) return cachedServerOffsetMs;

      const data = await res.json();
      const roundTripTime = clientAfterFetch - clientBeforeFetch;
      // Estimate network latency as half the round-trip time
      const estimatedServerTime = data.serverTimestamp + Math.round(roundTripTime / 2);
      cachedServerOffsetMs = estimatedServerTime - clientAfterFetch;
      isSynced = true;

      return cachedServerOffsetMs;
    } catch (err) {
      console.warn('Clock synchronization with server failed, using local device time:', err);
      return cachedServerOffsetMs;
    } finally {
      syncPromise = null;
    }
  })();

  return syncPromise;
}

export function getSyncedCurrentTime(): number {
  return Date.now() + cachedServerOffsetMs;
}

export function getServerOffsetMs(): number {
  return cachedServerOffsetMs;
}

export function isClockSynced(): boolean {
  return isSynced;
}
