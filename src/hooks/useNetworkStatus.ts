'use client';

import { useState, useEffect } from 'react';

/**
 * Module 2 (Task 37): Network Status Detection Hook
 *
 * Tracks the browser's online/offline connectivity status in real time.
 * Provides a transient 'reconnected' flag to display a brief confirmation banner.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isReconnected, setIsReconnected] = useState<boolean>(false);

  useEffect(() => {
    // Check initial status in browser
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    let reconnectedTimer: NodeJS.Timeout | null = null;

    const handleOnline = () => {
      setIsOnline(true);
      setIsReconnected(true);

      // Auto dismiss reconnected banner after 3.5 seconds
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

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (reconnectedTimer) clearTimeout(reconnectedTimer);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    isReconnected,
  };
}
