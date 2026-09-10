'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';

interface WatermarkOverlayProps {
  bookTitle?: string;
  storeName?: string;
  className?: string;
  enableAlerts?: boolean;
}

/**
 * Task 15: Piracy & Copy Protection + Dynamic Watermark Overlay
 *
 * Enforces strict copyright protection on preview pages:
 * 1. Disables context menu (right-click / long-press save image).
 * 2. Disables text selection and image drag-and-drop.
 * 3. Blocks save/print keyboard shortcuts (Ctrl+P, Ctrl+S, Cmd+S, PrintScreen).
 * 4. Displays semi-transparent repeated diagonal watermarks ("M.M Book House Malda Preview").
 * 5. Includes dynamic session tracking hash and timestamp to discourage unauthorized screen capture.
 */
export const WatermarkOverlay: React.FC<WatermarkOverlayProps> = ({
  bookTitle = 'M.M Book House Malda',
  storeName = 'M.M Book House Malda',
  className = '',
  enableAlerts = true,
}) => {
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    // Generate pseudo-session footprint for dynamic watermark tracking
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    const dateStr = new Date().toISOString().slice(0, 10);
    setSessionId(`MMBH-${dateStr}-${rand}`);
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const triggerWarning = (msg: string) => {
      if (!enableAlerts) return;
      setWarningMessage(msg);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWarningMessage(null);
      }, 3200);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Print Screen protection
      if (e.key === 'PrintScreen') {
        triggerWarning('স্ক্রিনশট বা প্রিন্ট নেওয়া নিষিদ্ধ (Copyright Protected)');
      }

      // Save page (Ctrl+S / Cmd+S)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        triggerWarning('নমুনা পাতা সেভ করা সুরক্ষিত (Protected Content)');
      }

      // Print dialog (Ctrl+P / Cmd+P)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        triggerWarning('প্রিভিউ কপি প্রিন্ট করা সম্ভব নয়');
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerWarning('ডাউনলোড বা কপি সুরক্ষা সক্রিয় (Right-Click Disabled)');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
      clearTimeout(timeoutId);
    };
  }, [enableAlerts]);

  return (
    <>
      {/* Repeating Diagonal Watermark Grid - pointer-events-none prevents click blocking */}
      <div
        className={`absolute inset-0 pointer-events-none select-none overflow-hidden z-20 ${className}`}
        aria-hidden="true"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        <div className="w-full h-full flex flex-col justify-around opacity-[0.065] dark:opacity-[0.09] transform -rotate-[24deg] scale-125">
          {[...Array(6)].map((_, rowIdx) => (
            <div
              key={rowIdx}
              className="flex justify-around items-center whitespace-nowrap gap-12 font-bengali font-black tracking-widest text-neutral-900 dark:text-neutral-100 uppercase select-none"
            >
              <span>{storeName} • স্যাম্পল প্রিভিউ</span>
              <span className="text-xs tracking-normal opacity-80">
                {sessionId ? `ID: ${sessionId}` : 'পাইরেসি দণ্ডনীয় অপরাধ'}
              </span>
              <span>{storeName} • PREVIEW ONLY</span>
              <span className="text-xs tracking-normal opacity-80">
                MALDA • www.mmbookhouse.in
              </span>
            </div>
          ))}
        </div>

        {/* Subtle Bottom Dynamic Security Footer */}
        <div className="absolute bottom-2 right-3 opacity-30 text-[10px] text-neutral-600 dark:text-neutral-400 font-mono select-none">
          SECURE PREVIEW STREAM #{sessionId || 'MMBH-SECURE'}
        </div>
      </div>

      {/* Copy/Print Protection Alert Toast */}
      {warningMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-4 py-2.5 bg-neutral-900/95 text-white text-xs sm:text-sm font-bengali font-medium rounded-lg shadow-2xl border border-neutral-700 backdrop-blur-xs transition-all duration-300 animate-in fade-in slide-in-from-bottom-3"
        >
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <span>{warningMessage}</span>
        </div>
      )}
    </>
  );
};
