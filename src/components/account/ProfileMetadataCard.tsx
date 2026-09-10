'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Save,
  Edit3,
  ExternalLink,
} from 'lucide-react';
import { UserProfile } from '@/types/auth';
import { profileService, DEFAULT_CUSTOMER_PROFILE } from '@/lib/auth/profileService';
import { EmailVerificationModal } from './EmailVerificationModal';
import { useAuthSession } from '@/hooks/useAuthSession';

interface ProfileMetadataCardProps {
  initialProfile?: UserProfile;
  onProfileUpdated?: (updated: UserProfile) => void;
  onOpenPhoneUpdateModal?: () => void;
  className?: string;
}

/**
 * Task 31 & 35: Customer Profile Metadata Card (Amazon-pattern)
 * Manages Full Name, Verified Mobile Number, Invoice Email, and Alternative Phone.
 */
export const ProfileMetadataCard: React.FC<ProfileMetadataCardProps> = ({
  initialProfile,
  onProfileUpdated,
  onOpenPhoneUpdateModal,
  className = '',
}) => {
  const { profile: authProfile, setProfile: setAuthProfile } = useAuthSession();

  const [profile, setProfile] = useState<UserProfile>(() => {
    if (initialProfile) return initialProfile;
    if (authProfile.id) {
      return profileService.getProfile(authProfile.id);
    }
    return DEFAULT_CUSTOMER_PROFILE;
  });

  const [fullName, setFullName] = useState(profile.fullName || '');
  const [altPhone, setAltPhone] = useState(profile.altPhoneNumber || '');
  const [email, setEmail] = useState(profile.email || '');
  const [showEmailVerifyModal, setShowEmailVerifyModal] = useState(false);

  const [errors, setErrors] = useState<{
    fullName?: string;
    altPhone?: string;
    email?: string;
    general?: string;
  }>({});

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Synchronize when active auth session changes
  useEffect(() => {
    if (authProfile.id) {
      const p = profileService.getProfile(authProfile.id);
      setProfile(p);
      setFullName(p.fullName || authProfile.fullName || '');
      setAltPhone(p.altPhoneNumber || authProfile.altPhoneNumber || '');
      setEmail(p.email || authProfile.email || '');
    }
  }, [authProfile]);

  // Task 35: Listen for email verification event
  useEffect(() => {
    const handleVerified = () => {
      setProfile((prev) => ({ ...prev, isEmailVerified: true }));
    };
    window.addEventListener('mm_email_verified', handleVerified);
    return () => window.removeEventListener('mm_email_verified', handleVerified);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate inputs
    const nameCheck = profileService.validateFullName(fullName);
    const altPhoneCheck = profileService.validateAltPhone(altPhone, profile.phoneNumber);
    const emailCheck = profileService.validateEmail(email);

    const newErrors: typeof errors = {};
    if (!nameCheck.isValid) newErrors.fullName = nameCheck.error;
    if (!altPhoneCheck.isValid) newErrors.altPhone = altPhoneCheck.error;
    if (!emailCheck.isValid) newErrors.email = emailCheck.error;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);

    const updatedProfile: UserProfile = {
      ...profile,
      fullName: fullName.trim(),
      altPhoneNumber: altPhone.trim() ? altPhone.trim() : undefined,
      email: email.trim() ? email.trim() : undefined,
    };

    const res = profileService.saveProfile(updatedProfile);

    if (res.success) {
      setProfile(res.profile);
      // Sync into global session
      setAuthProfile({
        ...authProfile,
        fullName: res.profile.fullName,
        email: res.profile.email || authProfile.email,
        altPhoneNumber: res.profile.altPhoneNumber,
      });

      if (onProfileUpdated) {
        onProfileUpdated(res.profile);
      }

      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } else {
      setErrors({ general: res.error || 'প্রোফাইল তথ্য সংরক্ষণ করতে সমস্যা হয়েছে।' });
    }

    setIsSaving(false);
  };

  return (
    <div className={`bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden font-bengali ${className}`}>
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-gray-50 to-amber-50/40 border-b border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-gray-900 leading-tight">
              মৌলিক প্রোফাইল মেটাডাটা
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              অর্ডার চালান, ডেলিভারি ট্র্যাকিং ও অ্যাকাউন্টের ব্যক্তিগত তথ্য
            </p>
          </div>
        </div>

        {showSuccessToast && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>সফলভাবে সংরক্ষিত হয়েছে!</span>
          </div>
        )}
      </div>

      {/* Form Content */}
      <form onSubmit={handleSave} className="p-6 space-y-6">
        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Field 1: Full Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">
              গ্রাহকের পুরো নাম <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                }}
                placeholder="যেমন: সাবির আহমেদ"
                className={`w-full pl-9 pr-3 py-2.5 bg-gray-50 border rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-hidden transition-all ${
                  errors.fullName ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
                }`}
              />
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
            {errors.fullName ? (
              <p className="text-[11px] text-red-600 font-medium">{errors.fullName}</p>
            ) : (
              <p className="text-[11px] text-gray-400">অর্ডার ইনভয়েস ও চালানে এই নামটি মুদ্রিত হবে।</p>
            )}
          </div>

          {/* Field 2: Verified Primary Phone */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-700">
                ভেরিফায়েড মোবাইল নম্বর <span className="text-red-500">*</span>
              </label>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                <span>ভেরিফাইড</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <div className="w-full pl-9 pr-3 py-2.5 bg-gray-100/80 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-800 cursor-not-allowed select-none flex items-center">
                  <span>+91 {profile.phoneNumber}</span>
                </div>
                <Phone className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
              </div>

              <button
                type="button"
                onClick={onOpenPhoneUpdateModal}
                className="px-3 py-2.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                <span>পরিবর্তন</span>
              </button>
            </div>
            <p className="text-[11px] text-gray-400">
              লগইন ও অর্ডারের ওটিপি এই নম্বরে পাঠানো হয়। ২-স্টেপ ওটিপি দিয়ে পরিবর্তনযোগ্য।
            </p>
          </div>

          {/* Field 3: Optional Email for Digital Invoices */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-700">
                ডিজিটাল চালানের ইমেইল (ঐচ্ছিক)
              </label>
              {profile.email && profile.isEmailVerified ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" />
                  <span>ইমেইল ভেরিফাইড</span>
                </span>
              ) : email ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    আনভেরিফাইড
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowEmailVerifyModal(true)}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                  >
                    ভেরিফাই করুন
                  </button>
                </div>
              ) : null}
            </div>

            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="যেমন: student@example.com"
                className={`w-full pl-9 pr-3 py-2.5 bg-gray-50 border rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-hidden transition-all ${
                  errors.email ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
                }`}
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
            {errors.email ? (
              <p className="text-[11px] text-red-600 font-medium">{errors.email}</p>
            ) : (
              <p className="text-[11px] text-gray-400">
                ডিজিটাল ক্যাশ মেমো ও ই-চালান সরাসরি এই ইমেইলে পিডিএফ আকারে পৌঁছে যাবে।
              </p>
            )}
          </div>

          {/* Field 4: Alternative Mobile Number */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">
              বিকল্প যোগাযোগ নম্বর (ঐচ্ছিক)
            </label>
            <div className="relative">
              <input
                type="tel"
                maxLength={10}
                value={altPhone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setAltPhone(val);
                  if (errors.altPhone) setErrors((prev) => ({ ...prev, altPhone: undefined }));
                }}
                placeholder="যেমন: 9733098765"
                className={`w-full pl-9 pr-3 py-2.5 bg-gray-50 border rounded-xl text-xs font-mono font-medium text-gray-900 focus:bg-white focus:outline-hidden transition-all ${
                  errors.altPhone ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
                }`}
              />
              <PhoneCall className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
            {errors.altPhone ? (
              <p className="text-[11px] text-red-600 font-medium">{errors.altPhone}</p>
            ) : (
              <p className="text-[11px] text-gray-400">
                ডেলিভারির সময় প্রধান নম্বর ব্যস্ত বা নেটওয়ার্কহীন থাকলে এই নম্বরে কল দেওয়া হবে।
              </p>
            )}
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>তথ্যসমূহ ভারতীয় DPDP আইন ২০২৩ অনুযায়ী এনক্রিপ্টেড ও সুরক্ষিত</span>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-2.5 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 disabled:opacity-50 text-gray-950 text-xs font-black rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'সংরক্ষণ করা হচ্ছে...' : 'প্রোফাইল আপডেট সংরক্ষণ করুন'}</span>
          </button>
        </div>
      </form>

      {/* Task 35: 1-Click Email Verification Modal */}
      <EmailVerificationModal
        isOpen={showEmailVerifyModal}
        onClose={() => setShowEmailVerifyModal(false)}
        email={email}
        userId={profile.id}
        onVerified={() => {
          setProfile((prev) => ({ ...prev, isEmailVerified: true }));
        }}
      />
    </div>
  );
};
