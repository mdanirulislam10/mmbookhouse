'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Trash2,
  X,
  ShieldAlert,
  CheckCircle2,
  Lock,
  ArrowRight,
  Phone,
  RefreshCw,
} from 'lucide-react';
import { dpdpCompliance, DPO_GRIEVANCE_CONTACT } from '@/lib/auth/dpdpCompliance';
import { otpService } from '@/lib/auth/otpService';
import { OtpInputBoxes } from '@/components/auth/OtpInputBoxes';
import { CountdownTimer } from '@/components/auth/CountdownTimer';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useRouter } from 'next/navigation';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  phoneNumber: string;
}

type DeletionStep = 'confirm_warning' | 'otp_verify' | 'completed';

/**
 * Task 40: Self-Service Account Deletion with OTP Confirmation
 * Implements DPDP Act 2023 Section 12 (Right to Erasure)
 */
export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  userId,
  phoneNumber,
}) => {
  const router = useRouter();
  const { logout } = useAuthSession();

  const [step, setStep] = useState<DeletionStep>('confirm_warning');
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [otp, setOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [timerKey, setTimerKey] = useState(0);

  const CONFIRM_KEYWORD = 'DELETE';

  useEffect(() => {
    if (isOpen) {
      setStep('confirm_warning');
      setTypedConfirmation('');
      setOtp('');
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const maskedPhone = dpdpCompliance.maskPhoneNumber(phoneNumber || '9800123456');

  // Step 1: Request OTP for erasure
  const handleProceedToOtp = async () => {
    if (typedConfirmation.trim().toUpperCase() !== CONFIRM_KEYWORD) {
      setErrorMessage(`নিশ্চিত করতে অনুগ্রহ করে ঠিক "${CONFIRM_KEYWORD}" শব্দটি লিখুন।`);
      return;
    }
    setErrorMessage('');
    setIsSendingOtp(true);
    try {
      const res = await otpService.sendOtp(phoneNumber || '9800123456');
      if (res.success) {
        setStep('otp_verify');
        setTimerKey((k) => k + 1);
      } else {
        setErrorMessage(res.message || 'ওটিপি পাঠাতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
      }
    } catch {
      setErrorMessage('সার্ভার সমস্যার কারণে ওটিপি পাঠানো সম্ভব হয়নি।');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 2: Verify OTP and execute erasure
  const handleVerifyAndExecuteErasure = async () => {
    if (otp.length !== 6) {
      setErrorMessage('অনুগ্রহ করে ৬-ডিজিটের ওটিপি সঠিকভাবে প্রদান করুন।');
      return;
    }
    setIsVerifying(true);
    setErrorMessage('');

    try {
      const verifyRes = await otpService.verifyOtp(phoneNumber || '9800123456', otp);
      if (!verifyRes.isValid) {
        setErrorMessage(verifyRes.message || 'ভুল ওটিপি কোড! পুনরায় চেষ্টা করুন।');
        setIsVerifying(false);
        return;
      }

      // Execute DPDP Section 12 Erasure
      await dpdpCompliance.executeRightToErasure(userId, phoneNumber);

      // Perform local session logout
      logout();

      setStep('completed');
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage('অ্যাকাউন্ট মোছার প্রক্রিয়া সম্পন্ন করতে সমস্যা হয়েছে।');
      setIsVerifying(false);
    }
  };

  const handleFinishAndRedirect = () => {
    onClose();
    router.push('/');
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm font-bengali animate-fadeIn">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-red-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-red-900 via-rose-900 to-gray-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-500/40 flex items-center justify-center text-red-300">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black flex items-center gap-2">
                <span>অ্যাকাউন্ট চিরতরে ডিলিট (Right to Erasure)</span>
                <span className="text-[10px] bg-red-800 text-red-200 px-2 py-0.5 rounded-full font-mono font-medium">
                  DPDP Sec 12
                </span>
              </h3>
              <p className="text-[11px] text-red-200/80 mt-0.5">
                ভারতীয় ডেটা সুরক্ষা আইন ২০২৩ অনুযায়ী ব্যক্তিগত তথ্য স্থায়ীভাবে মোছার আবেদন
              </p>
            </div>
          </div>
          {step !== 'completed' && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-red-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* STEP 1: WARNING & CONFIRMATION */}
          {step === 'confirm_warning' && (
            <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-red-800 font-black">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>সতর্কতা: এই প্রক্রিয়াটি অপরিবর্তনীয় (Irreversible)</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-red-700 text-[11px]">
                  <li>আপনার প্রোফাইলের নাম, মোবাইল নম্বর ও ইমেইল স্থায়ীভাবে মুছে দেওয়া হবে।</li>
                  <li>সংরক্ষিত ডেলিভারি ঠিকানা এবং উইশলিস্ট রিমুভ করা হবে।</li>
                  <li>পূর্বের অর্ডার সংক্রান্ত ইনভয়েস ভারতীয় ট্যাক্স আইনানুযায়ী বেনামী হ্যাশ হিসেবে সংরক্ষিত থাকবে।</li>
                  <li>ডিলিট সম্পন্ন হলে আপনি তাৎক্ষণিকভাবে সমস্ত ডিভাইস থেকে সাইন আউট হবেন।</li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1">
                  নিশ্চিত করতে নিচে <span className="font-mono text-red-600 font-black tracking-wider">{CONFIRM_KEYWORD}</span> শব্দটি টাইপ করুন:
                </label>
                <input
                  type="text"
                  value={typedConfirmation}
                  onChange={(e) => setTypedConfirmation(e.target.value.toUpperCase())}
                  placeholder={`টাইপ করুন ${CONFIRM_KEYWORD}`}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-mono text-xs font-bold uppercase tracking-wider focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              {errorMessage && (
                <p className="text-xs text-red-600 font-semibold">{errorMessage}</p>
              )}

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="button"
                  onClick={handleProceedToOtp}
                  disabled={typedConfirmation.trim().toUpperCase() !== CONFIRM_KEYWORD || isSendingOtp}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  {isSendingOtp ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>ওটিপি পাঠানো হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <span>পরবর্তী ধাপ: ওটিপি যাচাই</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {step === 'otp_verify' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-900">
                <Phone className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  আপনার নিবন্ধিত মোবাইল নম্বর <strong>{maskedPhone}</strong>-এ ৬-ডিজিটের নিরাপত্তা কোড পাঠানো হয়েছে।
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 mb-2 text-center">
                  ৬-ডিজিট নিরাপত্তা ওটিপি কোড লিখুন:
                </label>
                <OtpInputBoxes
                  value={otp}
                  onChange={(val) => setOtp(val)}
                  onComplete={() => {}}
                  isError={Boolean(errorMessage)}
                />
              </div>

              <CountdownTimer
                key={timerKey}
                initialSeconds={30}
                onResend={(channel) => otpService.sendOtp(phoneNumber || '9800123456', channel)}
              />

              {errorMessage && (
                <p className="text-xs text-red-600 font-semibold text-center">{errorMessage}</p>
              )}

              <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setStep('confirm_warning')}
                  className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800 cursor-pointer"
                >
                  ← ফিরে যান
                </button>
                <button
                  type="button"
                  onClick={handleVerifyAndExecuteErasure}
                  disabled={otp.length !== 6 || isVerifying}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isVerifying ? 'স্থায়ীভাবে মোছা হচ্ছে...' : 'অ্যাকাউন্ট চিরতরে মুছুন'}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: COMPLETED */}
          {step === 'completed' && (
            <div className="text-center py-4 space-y-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-black text-gray-900">
                  অ্যাকাউন্ট ও ব্যক্তিগত ডেটা সফলভাবে মুছে ফেলা হয়েছে
                </h4>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  DPDP Act 2023 ধারা ১২ অনুসারে আপনার সমস্ত ব্যক্তিগত বিবরণ স্থায়ীভাবে নিশ্চিহ্ন করা হয়েছে।
                  এম.এম বুক হাউসের সাথে থাকার জন্য আপনাকে আন্তরিক ধন্যবাদ।
                </p>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleFinishAndRedirect}
                  className="w-full py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  হোমপেজে ফিরে যান
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
