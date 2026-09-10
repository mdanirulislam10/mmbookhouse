'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, Mail } from 'lucide-react';
import { emailVerificationService } from '@/lib/auth/emailVerificationService';
import { useAuthSession } from '@/hooks/useAuthSession';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';
  const userId = searchParams.get('userId') || '';

  const { profile, setProfile } = useAuthSession();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('আপনার ইমেইল যাচাই করা হচ্ছে...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('কোনো ভেরিফিকেশন টোকেন পাওয়া যায়নি।');
      return;
    }

    emailVerificationService
      .verifyEmailToken(token, email, userId)
      .then((res) => {
        if (res.success) {
          setStatus('success');
          setMessage(res.message);
          // Sync auth session
          if (profile.id) {
            setProfile({
              ...profile,
              isEmailVerified: true,
              email: email || profile.email,
            });
          }
        } else {
          setStatus('error');
          setMessage(res.message);
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('যাচাইকরণে অপ্রত্যাশিত ত্রুটি ঘটেছে।');
      });
  }, [token, email, userId, profile, setProfile]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 bg-gray-50/60 font-bengali">
      <div className="w-full max-w-md bg-white border border-gray-200/90 rounded-2xl shadow-xl p-8 text-center space-y-5">
        {status === 'verifying' && (
          <div className="py-6 space-y-4 animate-fadeIn">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Mail className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-black text-gray-900">ইমেইল যাচাই করা হচ্ছে...</h1>
            <p className="text-xs text-gray-500">অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করুন</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-4 space-y-4 animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">ইমেইল সফলভাবে ভেরিফাইড!</h1>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                <span className="font-mono font-bold text-gray-900">{email}</span> ঠিকানায় এখন থেকে আপনার সমস্ত বইয়ের ক্যাশ মেমো ও ডেলিভারি আপডেট পাঠানো হবে।
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified Email Badge Active</span>
            </div>

            <div className="pt-4">
              <Link
                href="/account"
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-gray-950 font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>অ্যাকাউন্ট ড্যাশবোর্ডে ফিরে যান</span>
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="py-4 space-y-4 animate-fadeIn">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">ভেরিফিকেশন ব্যর্থ হয়েছে</h1>
              <p className="text-xs text-red-600 mt-1">{message}</p>
            </div>

            <div className="pt-4">
              <Link
                href="/account"
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>অ্যাকাউন্টে ফিরে যান</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
