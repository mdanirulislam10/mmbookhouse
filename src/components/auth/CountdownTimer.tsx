'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, MessageSquare } from 'lucide-react';
import { OtpDeliveryChannel } from '@/types/auth';

interface CountdownTimerProps {
  initialSeconds?: number;
  onResend: (channel: OtpDeliveryChannel) => void;
  disabled?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  initialSeconds = 30,
  onResend,
  disabled = false,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft]);

  const isCooldownActive = secondsLeft > 0;

  const formatSeconds = (sec: number) => {
    const s = sec < 10 ? `0${sec}` : `${sec}`;
    return `00:${s}`;
  };

  const handleResendSms = () => {
    if (isCooldownActive || disabled) return;
    setSecondsLeft(initialSeconds);
    onResend('sms');
  };

  const handleResendWhatsapp = () => {
    if (isCooldownActive || disabled) return;
    setSecondsLeft(initialSeconds);
    onResend('whatsapp');
  };

  return (
    <div className="w-full space-y-2 text-center pt-2">
      {isCooldownActive ? (
        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 font-medium">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
          <span>পুনরায় ওটিপি পাঠানোর সময় বাকি:</span>
          <span className="font-bold text-amber-600 font-mono text-sm">
            {formatSeconds(secondsLeft)}
          </span>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
          {/* WhatsApp Resend Button (Task 5 & 49: Prominent Primary Channel) */}
          <button
            type="button"
            onClick={handleResendWhatsapp}
            disabled={disabled}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md disabled:opacity-50"
          >
            <MessageSquare className="w-3.5 h-3.5 fill-white" />
            <span>WhatsApp-এ ওটিপি নিন (দ্রুত)</span>
          </button>

          {/* SMS Resend (Secondary) */}
          <button
            type="button"
            onClick={handleResendSms}
            disabled={disabled}
            className="w-full sm:w-auto px-3.5 py-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
            <span>এসএমএস-এ ওটিপি পাঠান</span>
          </button>
        </div>
      )}
    </div>
  );
};
