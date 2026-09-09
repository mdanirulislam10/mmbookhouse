'use client';

import { useState, useEffect } from 'react';

export type EffectiveConnectionType = '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';

interface NetworkInformation extends EventTarget {
  effectiveType?: EffectiveConnectionType;
  saveData?: boolean;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

/**
 * Combined Network Status Hook:
 * Supports online/offline detection (Module 2) and connection speed / data saver (Module 4/Adaptive).
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isReconnected, setIsReconnected] = useState<boolean>(false);
  const [effectiveType, setEffectiveType] = useState<EffectiveConnectionType>('4g');
  const [saveData, setSaveData] = useState<boolean>(false);
  const [isSlowConnection, setIsSlowConnection] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

    // Check initial online status
    setIsOnline(navigator.onLine);

    let reconnectedTimer: NodeJS.Timeout | null = null;

    const handleOnline = () => {
      setIsOnline(true);
      setIsReconnected(true);
      if (reconnectedTimer) clearTimeout(reconnectedTimer);
      reconnectedTimer = setTimeout(() => {
        setIsReconnected(false);
      }, 3500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // TypeScript doesn't define navigator.connection by default
    const connection = (navigator as unknown as { connection?: NetworkInformation }).connection;

    if (!connection) {
      setEffectiveType('4g');
      setIsSlowConnection(false);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        if (reconnectedTimer) clearTimeout(reconnectedTimer);
      };
    }

    const updateNetworkStatus = () => {
      const type = connection.effectiveType || '4g';
      const isSaveData = connection.saveData || false;
      const isSlow = type === 'slow-2g' || type === '2g' || type === '3g' || isSaveData;

      setEffectiveType(type);
      setSaveData(isSaveData);
      setIsSlowConnection(isSlow);
    };

    updateNetworkStatus();

    connection.addEventListener('change', updateNetworkStatus);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (reconnectedTimer) clearTimeout(reconnectedTimer);
      connection.removeEventListener('change', updateNetworkStatus);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    isReconnected,
    effectiveType,
    saveData,
    isSlowConnection,
  };
}
