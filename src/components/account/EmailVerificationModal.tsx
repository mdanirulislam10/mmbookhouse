'use client';

import React, { useState, useEffect } from 'react';
import {
  Mail,
  CheckCircle2,
  X,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  Send,
} from 'lucide-react';
import { emailVerificationService } from '@/lib/auth/emailVerificationService';
import { useAuthSession } from '@/hooks/useAuthSession';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  userId?: string;
  onVerified?: () => void;
}

/**
 * Task 35: 1-Click Email Verification Modal & Link Simulator
 */
export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onClose,
  email,
  userId = 'user-demo-sabir',
  onVerified,
}) => {
  const { profile: authProfile, setProfile: setAuthProfile } = useAuthSession();

  const [isLoading, setIsLoading] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState('');
  const [token, setToken] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen && email) {
      setIsVerified(false);
      setErrorMessage('');
      setIsLoading(true);

      // Generate verification link
      emailVerificationService
        .sendVerificationLink(userId, email)
        .then((res) => {
          setVerificationUrl(res.verificationUrl);
          setToken(res.token);
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, email, userId]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (!verificationUrl) return;
    navigator.clipboard.writeText(verificationUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSimulateClick = async () => {
    if (!token) return;
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await emailVerificationService.verifyEmailToken(token, email, userId);
      if (res.success) {
        setIsVerified(true);
        // Update auth session
        setAuthProfile({
          ...authProfile,
          email,
          isEmailVerified: true,
        });

        if (onVerified) {
          onVerified();
        }

        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage('ভেরিফিকেশন সম্পন্ন করতে সমস্যা হয়েছে।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-bengali animate-fadeIn">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-gray-900 to-gray-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black leading-tight">
                ইমেইল ভেরিফিকেশন লিঙ্ক
              </h2>
              <p className="text-xs text-gray-300 mt-0.5">
                ১-ক্লিকে নিশ্চিত করুন ডিজিটাল চালান প্রাপ্তি
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {isVerified ? (
            <div className="py-6 text-center animate-fadeIn space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-black text-gray-950">ইমেইল সফলভাবে ভেরিফাইড!</h3>
              <p className="text-xs text-gray-600">
                প্রোফাইলে সবুজ <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">✓ ভেরিফাইড</span> ব্যাজ যুক্ত করা হয়েছে।
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-xs">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">প্রেরিত ঠিকানা:</span>
                  <span className="font-mono font-bold text-gray-900">{email}</span>
                </div>
              </div>

              <div className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-200">
                <p>
                  আপনার ইনবক্সে একটি সিকিউর ভেরিফিকেশন লিঙ্ক পাঠানো হয়েছে। লিঙ্কটিতে ক্লিক করলে আপনার ইমেইলটি তাৎক্ষণিক ভেরিফাই হয়ে যাবে।
                </p>
                <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>লিঙ্কটির মেয়াদ পরবর্তী ২৪ ঘণ্টা পর্যন্ত বৈধ থাকবে।</span>
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
                  {errorMessage}
                </div>
              )}

              {/* 1-Click Verification Action Button */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleSimulateClick}
                  disabled={isLoading || !token}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isLoading ? 'যাচাই করা হচ্ছে...' : '১-ক্লিকে ইমেইল ভেরিফাই করুন (Verify Link)'}</span>
                </button>

                {verificationUrl && (
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="w-full py-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{isCopied ? 'লিঙ্ক কপি করা হয়েছে!' : 'ভেরিফিকেশন লিঙ্ক কপি করুন'}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-1 text-[11px] text-gray-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>ভেরিফাইড ইমেইলে প্রতিটি বইয়ের ডিজিটাল ক্যাশ মেমো সংরক্ষিত থাকবে</span>
        </div>
      </div>
    </div>
  );
};
