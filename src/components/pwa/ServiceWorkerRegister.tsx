'use client';

import { useEffect } from 'react';

/**
 * Task 48: Service Worker Registration Client Component
 * Safely registers /sw.js in production or supported browsers without blocking main thread.
 */
export const ServiceWorkerRegister: React.FC = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const register = () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            if (process.env.NODE_ENV === 'development') {
              console.log('[SW] ServiceWorker registered successfully with scope:', registration.scope);
            }
          })
          .catch((error) => {
            console.warn('[SW] ServiceWorker registration failed:', error);
          });
      };

      if (document.readyState === 'complete') {
        register();
      } else {
        window.addEventListener('load', register);
        return () => window.removeEventListener('load', register);
      }
    }
  }, []);

  return null;
};
