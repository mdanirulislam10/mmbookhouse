'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';
import { cartToast, CartToastData } from '@/lib/utils/cartToast';

export const CartToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<CartToastData[]>([]);

  useEffect(() => {
    const unsubscribe = cartToast.subscribe((newToast) => {
      setToasts((prev) => [...prev, newToast]);

      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, newToast.durationMs || 4500);

      return () => clearTimeout(timer);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      aria-live="assertive"
    >
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
              isError
                ? 'bg-rose-50/95 border-rose-200 text-rose-950'
                : isSuccess
                ? 'bg-emerald-50/95 border-emerald-200 text-emerald-950'
                : isWarning
                ? 'bg-amber-50/95 border-amber-200 text-amber-950'
                : 'bg-sky-50/95 border-sky-200 text-sky-950'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isError && <AlertCircle className="w-5 h-5 text-rose-600" />}
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-amber-600" />}
              {!isError && !isSuccess && !isWarning && <Info className="w-5 h-5 text-sky-600" />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold font-bengali leading-snug">
                {toast.titleBn || toast.title}
              </p>
              <p className="text-[11px] text-gray-700 font-bengali mt-0.5 leading-relaxed">
                {toast.messageBn || toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-black/5 transition-colors"
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
