'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Home, CheckCircle2, ArrowRight, ArrowLeft, Lock, AlertTriangle } from 'lucide-react';
import { PhoneInputWithCountryCode } from '@/components/auth/PhoneInputWithCountryCode';
import { OtpInputBoxes } from '@/components/auth/OtpInputBoxes';
import { CountdownTimer } from '@/components/auth/CountdownTimer';
import { GoogleOneTap } from '@/components/auth/GoogleOneTap';
import { ProgressivePhoneModal } from '@/components/auth/ProgressivePhoneModal';
import { CloudflareTurnstile } from '@/components/auth/CloudflareTurnstile';
import { AccountLockoutBanner } from '@/components/auth/AccountLockoutBanner';
import { DpdpConsentNoticeModal } from '@/components/auth/DpdpConsentNoticeModal';
import { otpService } from '@/lib/auth/otpService';
import { lockoutService } from '@/lib/auth/lockoutService';
import { OtpDeliveryChannel, UserProfile } from '@/types/auth';
import { useAuthSession } from '@/hooks/useAuthSession';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const { setProfile } = useAuthSession();

  // Form State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'success' | 'locked'>('phone');
  const [deliveryChannel, setDeliveryChannel] = useState<OtpDeliveryChannel>('sms');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [showProgressiveModal, setShowProgressiveModal] = useState(false);
  const [googleUserEmail, setGoogleUserEmail] = useState('');
  const [showDpdpModal, setShowDpdpModal] = useState(false);

  const handleGoogleSuccess = (profile: UserProfile, needsPhone: boolean) => {
    setProfile({
      id: profile.id,
      fullName: profile.fullName,
      email: profile.email || '',
      avatarUrl: profile.avatarUrl || '',
      isLoggedIn: true,
    });

    if (needsPhone) {
      setGoogleUserEmail(profile.email || '');
      setShowProgressiveModal(true);
    } else {
      setStep('success');
      setTimeout(() => {
        router.push(redirectUrl);
      }, 1000);
    }
  };

  // Send OTP (Task 49: Smart WhatsApp routing on initial submit)
  const handleSendOtp = async (channel?: OtpDeliveryChannel) => {
    if (phoneNumber.length !== 10) {
      setErrorMessage('অনুগ্রহ করে সঠিক ১০ ডিজিটের ভারতীয় মোবাইল নম্বর লিখুন');
      setIsError(true);
      return;
    }

    // Task 29: Check if account is locked before trying to send OTP
    const lockCheck = lockoutService.checkLockout(phoneNumber);
    if (lockCheck.isLocked) {
      setStep('locked');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setIsError(false);

    try {
      const res = await otpService.sendOtp(phoneNumber, channel);
      setDeliveryChannel(res.channel);
      setStatusMessage(res.message);
      setStep('otp');
      setAttemptsLeft(5);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ওটিপি পাঠাতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।';
      if (lockoutService.checkLockout(phoneNumber).isLocked) {
        setStep('locked');
        return;
      }
      setErrorMessage(msg);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otp;
    if (code.length !== 6) {
      setErrorMessage('অনুগ্রহ করে ৬-ডিজিটের সম্পূর্ণ ওটিপি কোড প্রবেশ করান');
      setIsError(true);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setIsError(false);

    try {
      const res = await otpService.verifyOtp(phoneNumber, code);
      if (res.isValid) {
        // Set authenticated user in session
        setProfile({
          id: `user-${phoneNumber}`,
          fullName: `গ্রাহক (+91 ${phoneNumber.slice(0, 5)}***)`,
          email: `${phoneNumber}@customer.mmbookhouse.com`,
          avatarUrl: '',
          isLoggedIn: true,
        });

        setStep('success');
        setTimeout(() => {
          router.push(redirectUrl);
        }, 1200);
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
      setErrorMessage('যাচাইকরণে ত্রুটি হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalSuccess = () => {
    setShowProgressiveModal(false);
    setStep('success');
    setTimeout(() => {
      router.push(redirectUrl);
    }, 1000);
  };

  const handleModalClose = () => {
    setShowProgressiveModal(false);
    router.push(redirectUrl);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 font-bengali relative overflow-hidden bg-radial-[at_top_center] from-amber-500/10 via-transparent to-transparent">
      {/* Ambient Lighting Orbs */}
      <div className="absolute top-10 -left-20 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-2xl relative z-10 transition-all hover:border-amber-400/60">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block mb-3 group">
            <span className="text-2xl font-black tracking-tight text-gray-950 flex items-center justify-center gap-1.5">
              <span>M.M</span>
              <span className="text-amber-500 group-hover:text-amber-600 transition-colors">BOOK HOUSE</span>
            </span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200 mb-2">
            <span>⚡ ফাস্ট পাসওয়ার্ডলেস অথেনটিকেশন</span>
          </div>
          <h1 className="text-xl font-black text-gray-950">গ্রাহক লগইন ও সাইন-ইন</h1>
          <p className="text-xs text-gray-500 mt-1">
            পাসওয়ার্ড ছাড়াই মাত্র ১০ সেকেন্ডে মোবাইল ওটিপি দিয়ে নিরাপদে লগইন করুন
          </p>
        </div>

        {/* Step: Success */}
        {step === 'success' && (
          <div className="py-8 text-center animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-black text-gray-950 mb-1">লগইন সফল হয়েছে!</h2>
            <p className="text-xs text-gray-600">আপনাকে মূল পেজে রিডাইরেক্ট করা হচ্ছে...</p>
          </div>
        )}

        {/* Step: Locked (Brute Force Protection - Task 29) */}
        {step === 'locked' && (
          <AccountLockoutBanner
            phoneNumber={phoneNumber}
            onReset={() => {
              setStep('phone');
              setOtp('');
              setIsError(false);
              setErrorMessage('');
            }}
          />
        )}

        {/* Step: Enter Phone Number */}
        {step === 'phone' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendOtp();
            }}
            className="space-y-4"
          >
            <PhoneInputWithCountryCode
              value={phoneNumber}
              onChange={(val) => {
                setPhoneNumber(val);
                if (isError) setIsError(false);
              }}
              error={isError ? errorMessage : undefined}
              autoFocus
            />

            <button
              type="submit"
              disabled={phoneNumber.length !== 10 || isLoading}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-950 font-black text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <span>{isLoading ? 'ওটিপি পাঠানো হচ্ছে...' : 'ওটিপি (OTP) পাঠান'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Google 1-Tap / Social Auth (Task 11 & 16) */}
            <GoogleOneTap
              onSuccess={handleGoogleSuccess}
              onFallbackToPhone={() => {}}
              disabled={isLoading}
            />

            {/* Task 28: Cloudflare Turnstile Invisible Bot Protection */}
            <CloudflareTurnstile onVerify={(_t) => {}} />

            {/* Trust & DPDP Badges Row */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>256-Bit SSL এনক্রিপ্টেড</span>
              </span>
              <button
                type="button"
                onClick={() => setShowDpdpModal(true)}
                className="hover:text-emerald-700 underline decoration-dotted cursor-pointer transition-colors"
              >
                DPDP 2023 কমপ্লায়েন্ট
              </button>
            </div>
          </form>
        )}

        {/* Step: Enter 6-digit OTP */}
        {step === 'otp' && (
          <div className="space-y-4">
            <div className="text-xs bg-amber-50/80 border border-amber-200/60 p-3 rounded-xl text-amber-900 flex items-start gap-2">
              <span className="text-sm">📱</span>
              <div className="flex-1 leading-tight">
                <span className="font-bold">+91 {phoneNumber}</span> নম্বরে {deliveryChannel === 'whatsapp' ? 'WhatsApp' : 'এসএমএস'}-এ ৬-ডিজিটের কোড পাঠানো হয়েছে।
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700">
                  ৬-ডিজিটের ওটিপি প্রবেশ করান <span className="text-red-500">*</span>
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

              {/* 6-box OTP Input */}
              <OtpInputBoxes
                value={otp}
                onChange={(val) => {
                  setOtp(val);
                  if (isError) setIsError(false);
                }}
                onComplete={(completedCode) => handleVerifyOtp(completedCode)}
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
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-black text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <span>{isLoading ? 'যাচাই করা হচ্ছে...' : 'লগইন নিশ্চিত করুন'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>

            {/* Countdown and WhatsApp fallback resend */}
            <CountdownTimer
              initialSeconds={30}
              onResend={(channel) => handleSendOtp(channel)}
              disabled={isLoading}
            />
          </div>
        )}

        {/* Back Link */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-amber-600 font-medium transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>হোমপেজে ফিরে যান</span>
          </Link>
        </div>

        {/* Task 12: Progressive Phone Completion Modal */}
        <ProgressivePhoneModal
          isOpen={showProgressiveModal}
          email={googleUserEmail}
          onSuccess={() => {
            setShowProgressiveModal(false);
            setStep('success');
            setTimeout(() => {
              router.push(redirectUrl);
            }, 1000);
          }}
          onClose={() => {
            setShowProgressiveModal(false);
            router.push(redirectUrl);
          }}
        />

        {/* Task 30: DPDP Act 2023 Consent Notice & Privacy Settings Modal */}
        <DpdpConsentNoticeModal
          isOpen={showDpdpModal}
          onClose={() => setShowDpdpModal(false)}
          userId={phoneNumber ? `user-${phoneNumber}` : 'guest'}
        />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
