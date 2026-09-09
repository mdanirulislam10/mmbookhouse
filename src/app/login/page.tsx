'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Phone, Lock, ArrowRight, ShieldCheck, Home, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length >= 10) {
      setOtpSent(true);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length >= 4) {
      setIsSuccess(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 font-bengali">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-lg">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block mb-3">
            <span className="text-2xl font-black tracking-tight text-gray-950">
              M.M <span className="text-amber-500">BOOK HOUSE</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">গ্রাহক লগইন ও সাইন-ইন</h1>
          <p className="text-xs text-gray-500 mt-1">
            আপনার মোবাইল নম্বর দিয়ে সহজে সাইন ইন করুন
          </p>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-1">লগইন সফল হয়েছে!</h2>
            <p className="text-xs text-gray-600 mb-4">হোমপেজে রিডাইরেক্ট করা হচ্ছে...</p>
          </div>
        ) : !otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                মোবাইল নম্বর (১০ ডিজিট) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-xs font-bold text-gray-500">+91</span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  pattern="[0-9]{10}"
                  placeholder="যেমন: 9800123456"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>ওটিপি (OTP) পাঠান</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>আপনার ব্যক্তিগত তথ্য সম্পূর্ণ নিরাপদ</span>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-xs bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-amber-800">
              +91 {phoneNumber} নম্বরে ৪ ডিজিটের ওটিপি পাঠানো হয়েছে।
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                ওটিপি কোড (OTP Code) *
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="যেমন: 1234"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-2.5 text-center tracking-widest text-lg font-bold rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>লগইন নিশ্চিত করুন</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setOtpSent(false)}
              className="w-full text-xs text-gray-500 hover:text-gray-900 underline"
            >
              ভুল নম্বর? পরিবর্তন করুন
            </button>
          </form>
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
      </div>
    </div>
  );
}
