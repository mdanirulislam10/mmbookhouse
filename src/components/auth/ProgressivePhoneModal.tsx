'use client';

import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, Phone, Smartphone, X, ArrowRight } from 'lucide-react';
import { PhoneInputWithCountryCode } from './PhoneInputWithCountryCode';
import { OtpInputBoxes } from './OtpInputBoxes';
import { CountdownTimer } from './CountdownTimer';
import { otpService } from '@/lib/auth/otpService';
import { accountLinkingService } from '@/lib/auth/accountLinking';
import { OtpDeliveryChannel } from '@/types/auth';

interface ProgressivePhoneModalProps {
  isOpen: boolean;
  email: string;
  onSuccess: (verifiedPhone: string) => void;
  onClose: () => void;
}

export const ProgressivePhoneModal: React.FC<ProgressivePhoneModalProps> = ({
  isOpen,
  email,
  onSuccess,
  onClose,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'input' | 'verify' | 'done'>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(5);

  if (!isOpen) return null;

  const handleSendOtp = async (channel?: OtpDeliveryChannel) => {
    if (phoneNumber.length !== 10) {
      setIsError(true);
      setErrorMessage('সঠিক ১০ ডিজিটের মোবাইল নম্বর দিন');
      return;
    }

    setIsLoading(true);
    setIsError(false);

    try {
      await otpService.sendOtp(phoneNumber, channel);
      setStep('verify');
    } catch {
      setIsError(true);
      setErrorMessage('ওটিপি পাঠাতে সমস্যা হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otp;
    if (code.length !== 6) return;

    setIsLoading(true);
    setIsError(false);

    try {
      const res = await otpService.verifyOtp(phoneNumber, code);
      if (res.isValid) {
        await accountLinkingService.attachPhoneNumber(email, phoneNumber);
        setStep('done');
        setTimeout(() => {
          onSuccess(phoneNumber);
        }, 1000);
      } else {
        setIsError(true);
        setErrorMessage(res.message);
        setAttemptsLeft(res.attemptsLeft);
      }
    } catch {
      setIsError(true);
      setErrorMessage('যাচাইকরণে ত্রুটি হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fadeIn font-bengali">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-gray-100 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'done' ? (
          <div className="py-6 text-center animate-fadeIn space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-gray-950">মোবাইল নম্বর সফলভাবে যুক্ত হয়েছে!</h3>
            <p className="text-xs text-gray-500">আপনার প্রোফাইল এখন সম্পূর্ণ প্রস্তুত।</p>
          </div>
        ) : step === 'input' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-950">মোবাইল নম্বর সংযুক্তিকরণ</h3>
                <p className="text-xs text-gray-500">বই ডেলিভারি ও অর্ডারের আপডেটের জন্য আবশ্যক</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-2.5 rounded-lg">
              আপনি গুগলে সফলভাবে সাইন-ইন করেছেন। পার্সেল ডেলিভারি ও দ্রুততম ট্র্যাকিং নিশ্চিত করতে আপনার ১০ ডিজিটের ফোন নম্বরটি একবার যুক্ত করুন।
            </p>

            <PhoneInputWithCountryCode
              value={phoneNumber}
              onChange={(val) => {
                setPhoneNumber(val);
                setIsError(false);
              }}
              error={isError ? errorMessage : undefined}
            />

            <button
              type="button"
              onClick={() => handleSendOtp()}
              disabled={phoneNumber.length !== 10 || isLoading}
              className="w-full py-2.5 bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] disabled:opacity-50 text-gray-950 font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <span>{isLoading ? 'পাঠানো হচ্ছে...' : 'ওটিপি পাঠান'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-base font-black text-gray-950">ওটিপি যাচাইকরণ</h3>
              <p className="text-xs text-gray-500 mt-0.5">+91 {phoneNumber} নম্বরে কোড পাঠানো হয়েছে</p>
            </div>

            <OtpInputBoxes
              value={otp}
              onChange={(val) => {
                setOtp(val);
                setIsError(false);
              }}
              onComplete={handleVerifyOtp}
              isError={isError}
              errorMessage={errorMessage}
              attemptsLeft={attemptsLeft}
              disabled={isLoading}
            />

            <button
              type="button"
              onClick={() => handleVerifyOtp()}
              disabled={otp.length !== 6 || isLoading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <span>{isLoading ? 'যাচাই করা হচ্ছে...' : 'ভেরিফাই ও লিঙ্ক করুন'}</span>
            </button>

            <CountdownTimer
              initialSeconds={30}
              onResend={(channel) => handleSendOtp(channel)}
              disabled={isLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
};
