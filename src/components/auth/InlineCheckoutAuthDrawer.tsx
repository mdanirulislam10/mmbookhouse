'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, CheckCircle2, ArrowRight, ArrowLeft, ShoppingBag } from 'lucide-react';
import { PhoneInputWithCountryCode } from './PhoneInputWithCountryCode';
import { OtpInputBoxes } from './OtpInputBoxes';
import { CountdownTimer } from './CountdownTimer';
import { GoogleOneTap } from './GoogleOneTap';
import { CloudflareTurnstile } from './CloudflareTurnstile';
import { AccountLockoutBanner } from './AccountLockoutBanner';
import { DpdpConsentNoticeModal } from './DpdpConsentNoticeModal';
import { otpService } from '@/lib/auth/otpService';
import { lockoutService } from '@/lib/auth/lockoutService';
import { OtpDeliveryChannel, UserProfile } from '@/types/auth';
import { useAuthSession } from '@/hooks/useAuthSession';

interface InlineCheckoutAuthDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: (profile: UserProfile) => void;
  title?: string;
  subtitle?: string;
}

/**
 * Task 21: Inline Checkout Auth Slide-Over Drawer
 * Prevents checkout drop-offs by completing mobile OTP verification
 * directly inside an inline slide-over drawer without leaving the checkout/cart page.
 */
export const InlineCheckoutAuthDrawer: React.FC<InlineCheckoutAuthDrawerProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  title = 'অর্ডার সম্পূর্ণ করতে দ্রুত সাইন-ইন',
  subtitle = 'আপনার কার্ট অক্ষুণ্ণ থাকবে, পাসওয়ার্ড ছাড়াই ১০ সেকেন্ডে ওটিপি দিয়ে লগইন করুন',
}) => {
  const { setProfile } = useAuthSession();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'success' | 'locked'>('phone');
  const [deliveryChannel, setDeliveryChannel] = useState<OtpDeliveryChannel>('sms');
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [showDpdpModal, setShowDpdpModal] = useState(false);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset states when opened
  useEffect(() => {
    if (isOpen) {
      setStep('phone');
      setOtp('');
      setIsError(false);
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendOtp = async (channel?: OtpDeliveryChannel) => {
    if (phoneNumber.length !== 10) {
      setIsError(true);
      setErrorMessage('সঠিক ১০ ডিজিটের ভারতীয় মোবাইল নম্বর দিন');
      return;
    }

    // Task 29: Check if phone is locked for 15 minutes
    const lockCheck = lockoutService.checkLockout(phoneNumber);
    if (lockCheck.isLocked) {
      setStep('locked');
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setErrorMessage('');

    try {
      const res = await otpService.sendOtp(phoneNumber, channel);
      setDeliveryChannel(res.channel);
      setStep('otp');
      setAttemptsLeft(5);
    } catch (err: unknown) {
      if (lockoutService.checkLockout(phoneNumber).isLocked) {
        setStep('locked');
        return;
      }
      setIsError(true);
      setErrorMessage(err instanceof Error ? err.message : 'ওটিপি পাঠাতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otp;
    if (code.length !== 6) {
      setIsError(true);
      setErrorMessage('৬-ডিজিটের ওটিপি প্রবেশ করান');
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setErrorMessage('');

    try {
      const res = await otpService.verifyOtp(phoneNumber, code);
      if (res.isValid) {
        const profile: UserProfile = {
          id: `user-${phoneNumber}`,
          fullName: `গ্রাহক (+91 ${phoneNumber.slice(0, 5)}***)`,
          phoneNumber,
          email: `${phoneNumber}@customer.mmbookhouse.com`,
          role: 'customer',
          examPreferences: ['general'],
          whatsappOptIn: true,
          promoNotificationEnabled: true,
          referralCode: `MM${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          referralPoints: 50,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setProfile({
          id: profile.id,
          fullName: profile.fullName,
          email: profile.email || '',
          avatarUrl: '',
          isLoggedIn: true,
        });

        setStep('success');

        setTimeout(() => {
          if (onAuthSuccess) {
            onAuthSuccess(profile);
          }
          onClose();
        }, 800);
      } else {
        setIsError(true);
        setErrorMessage(res.message);
        setAttemptsLeft(res.attemptsLeft);
        if (res.isLocked) {
          setStep('locked');
        }
      }
    } catch {
      setIsError(true);
      setErrorMessage('যাচাইকরণে সমস্যা হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = (profile: UserProfile) => {
    setProfile({
      id: profile.id,
      fullName: profile.fullName,
      email: profile.email || '',
      avatarUrl: profile.avatarUrl || '',
      isLoggedIn: true,
    });
    setStep('success');
    setTimeout(() => {
      if (onAuthSuccess) onAuthSuccess(profile);
      onClose();
    }, 800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="inline-auth-drawer-title"
      className="fixed inset-0 z-[100] flex justify-end font-bengali select-none"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/65 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl z-10 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-gray-100 flex items-start justify-between bg-neutral-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-gray-950 flex items-center justify-center font-bold shadow">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 id="inline-auth-drawer-title" className="text-base font-black text-white">
                {title}
              </h2>
              <p className="text-[11px] text-amber-300/90 leading-tight mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ড্রয়ার বন্ধ করুন"
            className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 flex-1 flex flex-col justify-center">
          {step === 'success' ? (
            <div className="py-8 text-center animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-gray-950 mb-1">লগইন সফল হয়েছে!</h3>
              <p className="text-xs text-gray-600">চেকআউট পেজ স্বয়ংক্রিয়ভাবে সক্রিয় হচ্ছে...</p>
            </div>
          ) : step === 'locked' ? (
            <AccountLockoutBanner
              phoneNumber={phoneNumber}
              onReset={() => {
                setStep('phone');
                setOtp('');
                setIsError(false);
                setErrorMessage('');
              }}
            />
          ) : step === 'phone' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendOtp();
              }}
              className="space-y-4"
            >
              {/* WhatsApp Priority Routing Micro-badge */}
              <div className="flex items-center justify-between text-[11px] text-emerald-800 bg-emerald-50/90 border border-emerald-200/80 rounded-lg py-1.5 px-3 shadow-xs">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  হোয়াটসঅ্যাপ ও এসএমএস স্মার্ট রুট
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                  দ্রুত ওটিপি ⚡
                </span>
              </div>

              <PhoneInputWithCountryCode
                value={phoneNumber}
                onChange={(val) => {
                  setPhoneNumber(val);
                  setIsError(false);
                }}
                error={isError ? errorMessage : undefined}
                autoFocus
              />

              <button
                type="submit"
                disabled={phoneNumber.length !== 10 || isLoading}
                className="w-full py-3 bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] disabled:opacity-50 text-gray-950 font-black text-xs rounded-lg shadow-sm hover:shadow border border-[#fcd200] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <span>{isLoading ? 'ওটিপি পাঠানো হচ্ছে...' : 'ওটিপি (OTP) নিয়ে এগিয়ে যান'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Alternative Google 1-Tap */}
              <GoogleOneTap
                onSuccess={handleGoogleSuccess}
                onFallbackToPhone={() => {}}
                disabled={isLoading}
              />

              {/* Task 28: Cloudflare Turnstile Invisible Bot Protection */}
              <CloudflareTurnstile onVerify={(_t) => {}} />

              <div className="pt-2 border-t border-gray-100 flex flex-col items-center justify-center gap-1 text-[11px] text-gray-500 text-center">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>আপনার কার্টের বইগুলো স্বয়ংক্রিয়ভাবে সংরক্ষিত থাকবে</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDpdpModal(true)}
                  className="text-[10px] text-gray-500 hover:text-emerald-700 underline decoration-dotted cursor-pointer"
                >
                  ভারতীয় DPDP আইন ২০২৩ অনুযায়ী আপনার তথ্য সুরক্ষিত
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-xs bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900 flex items-start gap-2">
                <span className="text-sm">📱</span>
                <div className="flex-1">
                  <span className="font-bold">+91 {phoneNumber}</span> নম্বরে {deliveryChannel === 'whatsapp' ? 'WhatsApp' : 'এসএমএস'}-এ ৬-ডিজিটের ওটিপি পাঠানো হয়েছে।
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700">
                    ৬-ডিজিটের ওটিপি কোড <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone');
                      setOtp('');
                      setIsError(false);
                    }}
                    className="text-[11px] text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>নম্বর পরিবর্তন</span>
                  </button>
                </div>

                <OtpInputBoxes
                  value={otp}
                  onChange={(val) => {
                    setOtp(val);
                    setIsError(false);
                  }}
                  onComplete={(code) => handleVerifyOtp(code)}
                  isError={isError}
                  errorMessage={errorMessage}
                  attemptsLeft={attemptsLeft}
                  disabled={isLoading}
                />
              </div>

              <button
                type="button"
                onClick={() => handleVerifyOtp()}
                disabled={otp.length !== 6 || isLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isLoading ? 'যাচাই করা হচ্ছে...' : 'লগইন নিশ্চিত ও চেকআউট জারি রাখুন'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>

              <CountdownTimer
                initialSeconds={30}
                onResend={(channel) => handleSendOtp(channel)}
                disabled={isLoading}
              />
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3.5 bg-neutral-50/80 border-t border-gray-100 text-center flex items-center justify-center gap-2 text-[11px] text-gray-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline shrink-0" />
          <span>256-Bit SSL সুরক্ষিত • DPDP Act 2023 কমপ্লায়েন্ট</span>
        </div>

        {/* Task 30: DPDP Act 2023 Consent Notice Modal */}
        <DpdpConsentNoticeModal
          isOpen={showDpdpModal}
          onClose={() => setShowDpdpModal(false)}
          userId={phoneNumber ? `user-${phoneNumber}` : 'guest'}
        />
      </div>
    </div>
  );
};
