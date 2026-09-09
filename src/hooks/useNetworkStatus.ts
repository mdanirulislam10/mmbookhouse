'use client';

import { useSyncExternalStore } from 'react';

export type EffectiveConnectionType = '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';

interface NetworkInformation extends EventTarget {
  effectiveType?: EffectiveConnectionType;
  saveData?: boolean;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

export interface NetworkState {
  isOnline: boolean;
  isReconnected: boolean;
  effectiveType: EffectiveConnectionType;
  saveData: boolean;
  isSlowConnection: boolean;
}

const SERVER_SNAPSHOT: NetworkState = {
  isOnline: true,
  isReconnected: false,
  effectiveType: '4g',
  saveData: false,
  isSlowConnection: false,
};

let currentNetworkState: NetworkState = { ...SERVER_SNAPSHOT };
const subscribers = new Set<() => void>();

function notifySubscribers() {
  subscribers.forEach((cb) => cb());
}

// Global single initialization of network listeners to prevent 80+ redundant event listeners
if (typeof window !== 'undefined') {
  currentNetworkState.isOnline = navigator.onLine;

  let reconnectedTimer: NodeJS.Timeout | null = null;

  const handleOnline = () => {
    currentNetworkState = {
      ...currentNetworkState,
      isOnline: true,
      isReconnected: true,
    };
    notifySubscribers();

    if (reconnectedTimer) clearTimeout(reconnectedTimer);
    reconnectedTimer = setTimeout(() => {
      currentNetworkState = {
        ...currentNetworkState,
        isReconnected: false,
      };
      notifySubscribers();
    }, 3500);
  };

  const handleOffline = () => {
    currentNetworkState = {
      ...currentNetworkState,
      isOnline: false,
      isReconnected: false,
    };
    notifySubscribers();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  const connection = (navigator as unknown as { connection?: NetworkInformation }).connection;
  if (connection) {
    const updateConnectionDetails = () => {
      const type = connection.effectiveType || '4g';
      const isSaveData = connection.saveData || false;
      const isSlow = type === 'slow-2g' || type === '2g' || type === '3g' || isSaveData;

      currentNetworkState = {
        ...currentNetworkState,
        effectiveType: type,
        saveData: isSaveData,
        isSlowConnection: isSlow,
      };
      notifySubscribers();
    };

    updateConnectionDetails();
    connection.addEventListener('change', updateConnectionDetails);
  }
}

function subscribe(callback: () => void) {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

function getSnapshot(): NetworkState {
  return currentNetworkState;
}

function getServerSnapshot(): NetworkState {
  return SERVER_SNAPSHOT;
}

/**
 * Singleton Network Status Hook:
 * Single event listener across the entire page prevents memory leaks in large lists (Audit Fix 6).
 */
export function useNetworkStatus() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    ...state,
    isOffline: !state.isOnline,
  };
}
