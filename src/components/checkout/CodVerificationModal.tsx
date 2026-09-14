'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, CheckCircle2, RefreshCw, X, PhoneCall, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { COD_OTP_REGEX } from '@/lib/validations/checkout';

import { requestCodOtpAction, verifyCodOtpAction } from '@/actions/codOtp';

export interface CodVerificationModalProps {
  isOpen: boolean;
  phone: string;
  sessionId?: string;
  onVerifySuccess: (otp: string) => void;
  onClose: () => void;
}

/**
 * Module 12 - Task 5: COD Anti-Fraud OTP Verification Modal (Item 26)
 * 
 * Features:
 * - 4-Digit Auto-Focus OTP Input Grid.
 * - Prevents fake orders and parcel returns (RTO Fraud).
 * - 60-Second Resend Cooldown Counter.
 * - Real server-side cryptographic hash verification & rate-limiting.
 * - Displays masked phone number with one-click verification.
 */
export const CodVerificationModal: React.FC<CodVerificationModalProps> = ({
  isOpen,
  phone,
  sessionId = 'sess_cod_checkout',
  onVerifySuccess,
  onClose,
}) => {
  const { isBengali } = useLanguage();
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(60);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [maskedPhoneDisplay, setMaskedPhoneDisplay] = useState<string>('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Automatically request/dispatch OTP when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setCooldown(60);
    setError(null);
    setDigits(['', '', '', '']);

    const initOtp = async () => {
      try {
        const res = await requestCodOtpAction(sessionId, phone);
        if (res.maskedPhone) {
          setMaskedPhoneDisplay(res.maskedPhone);
        }
        if (res.cooldownSeconds) {
          setCooldown(res.cooldownSeconds);
        }
      } catch (err: any) {
        console.warn('COD OTP request error:', err);
      }
    };
    initOtp();

    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, sessionId, phone]);

  // Focus first input on modal open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const displayPhone = maskedPhoneDisplay || (phone.length >= 10
    ? `${phone.substring(0, 2)}******${phone.substring(8)}`
    : phone);

  const handleDigitChange = (index: number, val: string) => {
    const char = val.slice(-1);
    if (char && !/^\d$/.test(char)) return; // Digits only

    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setError(null);

    // Auto-focus next input
    if (char && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullOtp = digits.join('');
    if (!COD_OTP_REGEX.test(fullOtp)) {
      setError(isBengali ? '৪-সংখ্যার সঠিক ওটিপি লিখুন' : 'Please enter valid 4-digit OTP');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const result = await verifyCodOtpAction(sessionId, phone, fullOtp);
      if (result.success) {
        onVerifySuccess(fullOtp);
      } else {
        setError(
          (isBengali ? result.errorBn : result.error) ||
            (isBengali ? 'ভুল ওটিপি কোড' : 'Incorrect OTP code')
        );
      }
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setDigits(['', '', '', '']);
    setError(null);

    try {
      const res = await requestCodOtpAction(sessionId, phone);
      if (res.success) {
        setCooldown(res.cooldownSeconds || 60);
      } else {
        setError((isBengali ? res.errorBn || res.error : res.error) || 'Failed to resend OTP');
      }
    } catch (err: any) {
      setError('Failed to resend OTP');
    } finally {
      setIsResending(false);
      inputRefs.current[0]?.focus();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="COD ওটিপি ভেরিফিকেশন"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-amber-500/10 px-6 py-4 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-900 font-black text-sm sm:text-base">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <span>{isBengali ? 'ক্যাশ অন ডেলিভারি (COD) নিরাপত্তা যাচাই' : 'Verify Cash on Delivery Order'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-center">
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            {isBengali
              ? `ভুয়া অর্ডার ও পার্সেল রিটার্ন প্রতিরোধে আপনার মোবাইল নম্বরে (${displayPhone}) একটি ৪-সংখ্যার ওটিপি কোড পাঠানো হয়েছে।`
              : `To prevent fake orders, a 4-digit verification code has been sent to your phone (${displayPhone}).`}
          </p>

          {/* 4-Digit Inputs */}
          <div className="flex justify-center items-center gap-3">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={`w-12 h-14 text-center text-xl font-mono font-black rounded-xl border-2 transition-all focus:outline-none ${
                  error
                    ? 'border-red-400 bg-red-50 text-red-700 focus:ring-2 focus:ring-red-500/20'
                    : digit
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                    : 'border-gray-200 bg-gray-50 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20'
                }`}
              />
            ))}
          </div>

          {error && (
            <p className="text-xs font-semibold text-red-600 flex items-center justify-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </p>
          )}

          {/* Resend Cooldown */}
          <div className="text-xs text-gray-500">
            {cooldown > 0 ? (
              <span>
                {isBengali ? `পুনরায় কোড পাঠানো যাবে: ${cooldown} সেকেন্ড পর` : `Resend OTP in: ${cooldown}s`}
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isResending}
                className="font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                <span>{isBengali ? 'আবার ওটিপি পাঠান (Resend OTP)' : 'Resend OTP'}</span>
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={handleVerify}
              className="w-full py-3 rounded-full font-black text-sm bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isBengali ? 'ওটিপি যাচাই ও সিওডি অর্ডার নিশ্চিত করুন' : 'Verify & Confirm COD Order'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-full text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {isBengali ? 'পেমেন্ট মেথড পরিবর্তন করুন (Cancel)' : 'Change Payment Method'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodVerificationModal;
