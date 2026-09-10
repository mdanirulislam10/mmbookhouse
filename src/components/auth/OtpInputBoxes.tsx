'use client';

import React, { useRef, useEffect, useState } from 'react';

interface OtpInputBoxesProps {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
  onComplete?: (otp: string) => void;
  isError?: boolean;
  errorMessage?: string;
  attemptsLeft?: number;
  disabled?: boolean;
}

export const OtpInputBoxes: React.FC<OtpInputBoxesProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  isError = false,
  errorMessage,
  attemptsLeft = 5,
  disabled = false,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [shouldShake, setShouldShake] = useState(false);

  // Trigger shake animation on error
  useEffect(() => {
    if (isError) {
      setShouldShake(true);
      const timer = setTimeout(() => setShouldShake(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isError, errorMessage]);

  // Initial focus on first empty box
  useEffect(() => {
    if (!disabled) {
      const firstEmptyIndex = value.length < length ? value.length : 0;
      inputRefs.current[firstEmptyIndex]?.focus();
    }
  }, [disabled, length]);

  // Task 6: WebOTP API Integration for Android / Chrome 1-tap SMS auto-read
  useEffect(() => {
    if (typeof window === 'undefined' || disabled) return;

    if ('OTPCredential' in window && navigator.credentials) {
      const ac = new AbortController();

      navigator.credentials
        .get({
          otp: { transport: ['sms'] },
          signal: ac.signal,
        } as unknown as CredentialRequestOptions)
        .then((content: unknown) => {
          const otpCred = content as { code?: string };
          if (otpCred && otpCred.code) {
            const digits = otpCred.code.replace(/\D/g, '').slice(0, length);
            if (digits.length === length) {
              onChange(digits);
              if (onComplete) onComplete(digits);
            }
          }
        })
        .catch(() => {
          // WebOTP aborted or not provided; gracefully ignore
        });

      return () => {
        ac.abort();
      };
    }
  }, [length, onChange, onComplete, disabled]);

  const normalizeDigits = (str: string): string => {
    return str.replace(/[০-৯]/g, (d) =>
      String.fromCharCode(d.charCodeAt(0) - 0x09e6 + 0x0030)
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const rawChar = normalizeDigits(e.target.value);
    const char = rawChar.replace(/\D/g, '');
    if (!char) return;

    const valArr = value.split('');
    // Take the last character entered
    const lastChar = char.slice(-1);
    valArr[index] = lastChar;
    const newOtp = valArr.join('').slice(0, length);
    onChange(newOtp);

    // Auto-focus next box
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.length === length && onComplete) {
      onComplete(newOtp);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const valArr = value.split('');
      if (valArr[index]) {
        valArr[index] = '';
        onChange(valArr.join(''));
      } else if (index > 0) {
        // Move to previous box and delete
        valArr[index - 1] = '';
        onChange(valArr.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Task 9: Smart Clipboard Paste Handler (Supports English and Bengali digits)
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    const normalized = normalizeDigits(pastedData);
    const digitsOnly = normalized.replace(/\D/g, '').slice(0, length);

    if (digitsOnly.length > 0) {
      onChange(digitsOnly);
      const nextFocus = Math.min(digitsOnly.length, length - 1);
      inputRefs.current[nextFocus]?.focus();

      if (digitsOnly.length === length && onComplete) {
        onComplete(digitsOnly);
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* 6 Individual Square Boxes with Shake Animation */}
      <div
        className={`flex items-center justify-center gap-2 sm:gap-3 my-2 transition-transform ${
          shouldShake ? 'animate-shake' : ''
        }`}
        onPaste={handlePaste}
      >
        {Array.from({ length }).map((_, index) => {
          const digit = value[index] || '';
          return (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              disabled={disabled}
              value={digit}
              onChange={(e) => handleInputChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black font-mono rounded-xl border-2 transition-all outline-none select-none ${
                isError
                  ? 'border-red-500 bg-red-50 text-red-700 focus:ring-2 focus:ring-red-400'
                  : digit
                  ? 'border-amber-500 bg-amber-50/20 text-gray-950 focus:ring-2 focus:ring-amber-400'
                  : 'border-gray-300 bg-white text-gray-950 focus:border-amber-500 focus:ring-2 focus:ring-amber-400'
              } ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'cursor-text shadow-sm'}`}
            />
          );
        })}
      </div>

      {/* Task 8: Error message and remaining attempts */}
      {isError && (
        <div className="mt-2 text-center">
          <p className="text-xs font-bold text-red-600">
            {errorMessage || 'ভুল ওটিপি — অনুগ্রহ করে পুনরায় যাচাই করুন'}
          </p>
          {attemptsLeft > 0 && attemptsLeft < 5 && (
            <p className="text-[11px] text-amber-700 mt-0.5">
              আর মাত্র {attemptsLeft}টি সুযোগ বাকি আছে
            </p>
          )}
        </div>
      )}

      {/* Shake Keyframe CSS */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};
