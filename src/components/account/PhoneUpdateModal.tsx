'use client';

import React, { useState } from 'react';
import {
  X,
  Phone,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { PhoneInputWithCountryCode } from '@/components/auth/PhoneInputWithCountryCode';
import { OtpInputBoxes } from '@/components/auth/OtpInputBoxes';
import { CountdownTimer } from '@/components/auth/CountdownTimer';
import { otpService } from '@/lib/auth/otpService';
import { profileService } from '@/lib/auth/profileService';
import { useAuthSession } from '@/hooks/useAuthSession';
import { OtpDeliveryChannel } from '@/types/auth';

interface PhoneUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhoneNumber: string;
  onSuccess?: (newPhoneNumber: string) => void;
}

/**
 * Task 34: 2-Step Secure Mobile Number Update Modal
 * 1. Collects valid new Indian mobile number (different from current).
 * 2. Dispatches & verifies 6-digit OTP on the new device before committing update.
 */
export const PhoneUpdateModal: React.FC<PhoneUpdateModalProps> = ({
  isOpen,
  onClose,
  currentPhoneNumber,
  onSuccess,
}) => {
  const { profile: authProfile, setProfile: setAuthProfile } = useAuthSession();

  const [step, setStep] = useState<'input' | 'otp' | 'success'>('input');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [deliveryChannel, setDeliveryChannel] = useState<OtpDeliveryChannel>('sms');
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(5);

  if (!isOpen) return null;

  const handleSendOtpToNewPhone = async (channel?: OtpDeliveryChannel) => {
    setIsError(false);
    setErrorMessage('');

    const phoneCheck = profileService.validatePrimaryPhone(newPhoneNumber);
    if (!phoneCheck.isValid) {
      setIsError(true);
      setErrorMessage(phoneCheck.error || 'সঠিক ১০ ডিজিটের মোবাইল নম্বর দিন');
      return;
    }

    if (newPhoneNumber.trim() === currentPhoneNumber.trim()) {
      setIsError(true);
      setErrorMessage('নতুন নম্বরটি আপনার বর্তমান মোবাইল নম্বরের সমান হতে পারবে না।');
      return;
    }

    setIsLoading(true);

    try {
      const res = await otpService.sendOtp(newPhoneNumber, channel);
      setDeliveryChannel(res.channel);
      setStep('otp');
      setAttemptsLeft(5);
    } catch (err: unknown) {
      setIsError(true);
      setErrorMessage(err instanceof Error ? err.message : 'ওটিপি পাঠাতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyNewPhone = async (codeToVerify?: string) => {
    const code = codeToVerify || otp;
    if (code.length !== 6) {
      setIsError(true);
      setErrorMessage('৬-ডিজিটের সম্পূর্ণ ওটিপি কোড প্রবেশ করান');
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setErrorMessage('');

    try {
      const res = await otpService.verifyOtp(newPhoneNumber, code);
      if (res.isValid) {
        // Update profile in profileService
        const currentUserId = authProfile.id || `user-${currentPhoneNumber}`;
        const currentProfile = profileService.getProfile(currentUserId);

        const updatedProfile = {
          ...currentProfile,
          phoneNumber: newPhoneNumber,
        };

        profileService.saveProfile(updatedProfile);

        // Update auth session
        setAuthProfile({
          ...authProfile,
          phoneNumber: newPhoneNumber,
        });

        // Broadcast event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('mm_phone_updated', { detail: { newPhoneNumber } })
          );
        }

        setStep('success');

        setTimeout(() => {
          if (onSuccess) {
            onSuccess(newPhoneNumber);
          }
          handleClose();
        }, 1500);
      } else {
        setIsError(true);
        setErrorMessage(res.message);
        setAttemptsLeft(res.attemptsLeft);
      }
    } catch {
      setIsError(true);
      setErrorMessage('যাচাইকরণে ত্রুটি হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('input');
    setNewPhoneNumber('');
    setOtp('');
    setIsError(false);
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm font-bengali animate-fadeIn">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-gray-900 to-gray-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-400 text-gray-950 flex items-center justify-center font-bold shadow-xs">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black leading-tight">
                রেজিস্টার্ড মোবাইল নম্বর পরিবর্তন
              </h2>
              <p className="text-xs text-gray-300 mt-0.5">
                ২-স্টেপ সুরক্ষিত ওটিপি ভেরিফিকেশন
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            aria-label="বন্ধ করুন"
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {step === 'success' ? (
            <div className="py-6 text-center animate-fadeIn space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-black text-gray-950">মোবাইল নম্বর পরিবর্তিত হয়েছে!</h3>
              <p className="text-xs text-gray-600">
                আপনার নতুন রেজিস্টার্ড নম্বর: <span className="font-bold text-gray-950">+91 {newPhoneNumber}</span>
              </p>
            </div>
          ) : step === 'input' ? (
            <div className="space-y-4">
              {/* Current phone pill */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">বর্তমান ভেরিফাইড নম্বর:</span>
                <span className="font-mono font-bold text-gray-800">+91 {currentPhoneNumber}</span>
              </div>

              {/* WhatsApp Priority routing micro-chip */}
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

              {isError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendOtpToNewPhone();
                }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">
                    নতুন ১০-ডিজিটের মোবাইল নম্বর <span className="text-red-500">*</span>
                  </label>
                  <PhoneInputWithCountryCode
                    value={newPhoneNumber}
                    onChange={(val) => {
                      setNewPhoneNumber(val);
                      setIsError(false);
                    }}
                    autoFocus
                  />
                </div>

                <div className="text-[11px] text-gray-500 flex items-start gap-2 bg-blue-50/60 p-3 rounded-xl border border-blue-100">
                  <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    নিরাপত্তার স্বার্থে নতুন নম্বরে একটি ৬-ডিজিটের ওটিপি পাঠানো হবে। যাচাই সম্পন্ন হলেই নম্বরটি সক্রিয় হবে।
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={newPhoneNumber.length !== 10 || isLoading}
                  className="w-full py-3 bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] disabled:opacity-50 text-gray-950 font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <span>{isLoading ? 'ওটিপি পাঠানো হচ্ছে...' : 'নতুন নম্বরে ওটিপি পাঠান'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-xs bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900 flex items-start gap-2">
                <span className="text-sm">📱</span>
                <div className="flex-1 leading-tight">
                  <span className="font-bold">+91 {newPhoneNumber}</span> নম্বরে {deliveryChannel === 'whatsapp' ? 'WhatsApp' : 'এসএমএস'}-এ ৬-ডিজিটের ওটিপি পাঠানো হয়েছে।
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700">
                    ৬-ডিজিটের কোড লিখুন <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('input');
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
                  onComplete={(code) => handleVerifyNewPhone(code)}
                  isError={isError}
                  errorMessage={errorMessage}
                  attemptsLeft={attemptsLeft}
                  disabled={isLoading}
                />
              </div>

              <button
                type="button"
                onClick={() => handleVerifyNewPhone()}
                disabled={otp.length !== 6 || isLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isLoading ? 'যাচাই করা হচ্ছে...' : 'নম্বর পরিবর্তন নিশ্চিত করুন'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>

              <CountdownTimer
                initialSeconds={30}
                onResend={(channel) => handleSendOtpToNewPhone(channel)}
                disabled={isLoading}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-1 text-[11px] text-gray-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>এম.এম বুক হাউস মালদা - সুরক্ষিত ওটিপি সুরক্ষা সার্ভিস</span>
        </div>
      </div>
    </div>
  );
};
