'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Save,
  HelpCircle,
  Receipt,
  Trash2,
} from 'lucide-react';
import { UserProfile } from '@/types/auth';
import { gstService, GstValidationResult } from '@/lib/auth/gstService';
import { profileService, DEFAULT_CUSTOMER_PROFILE } from '@/lib/auth/profileService';
import { useAuthSession } from '@/hooks/useAuthSession';

interface BusinessGstinCardProps {
  initialProfile?: UserProfile;
  onGstinSaved?: (businessName: string, gstin: string) => void;
  className?: string;
}

/**
 * Task 33: Business GSTIN & Institution Invoice Card
 * Allows coaching institutes, libraries, and schools to register their GSTIN
 * for claiming B2B GST Input Tax Credit (ITC) on book purchases.
 */
export const BusinessGstinCard: React.FC<BusinessGstinCardProps> = ({
  initialProfile,
  onGstinSaved,
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

  const [hasGst, setHasGst] = useState<boolean>(Boolean(profile.gstin));
  const [businessName, setBusinessName] = useState<string>(profile.businessName || '');
  const [gstin, setGstin] = useState<string>(profile.gstin || '');
  const [institutionType, setInstitutionType] = useState<UserProfile['institutionType']>(
    profile.institutionType || 'coaching_center'
  );

  const [gstValidation, setGstValidation] = useState<GstValidationResult | null>(() => {
    if (profile.gstin) {
      return gstService.validateGstin(profile.gstin);
    }
    return null;
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    if (authProfile.id) {
      const p = profileService.getProfile(authProfile.id);
      setProfile(p);
      setHasGst(Boolean(p.gstin));
      setBusinessName(p.businessName || '');
      setGstin(p.gstin || '');
      setInstitutionType(p.institutionType || 'coaching_center');
      if (p.gstin) {
        setGstValidation(gstService.validateGstin(p.gstin));
      }
    }
  }, [authProfile.id]);

  const handleGstChange = (val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
    setGstin(clean);
    setErrorMessage('');

    if (clean.length === 15) {
      const res = gstService.validateGstin(clean);
      setGstValidation(res);
      if (!res.isValid) {
        setErrorMessage(res.error || 'ভুল জিএসটি নম্বর');
      }
    } else {
      setGstValidation(null);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!hasGst) {
      // Remove GST data if turned off
      setIsSaving(true);
      const updatedProfile: UserProfile = {
        ...profile,
        gstin: undefined,
        businessName: undefined,
        institutionType: undefined,
      };

      profileService.saveProfile(updatedProfile);
      setProfile(updatedProfile);
      setBusinessName('');
      setGstin('');
      setGstValidation(null);
      setIsSaving(false);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      return;
    }

    // Validate inputs
    if (!businessName.trim()) {
      setErrorMessage('প্রতিষ্ঠানের নাম প্রদান করা আবশ্যক।');
      return;
    }

    const validation = gstService.validateGstin(gstin);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'সঠিক ১৫-ডিজিটের ভারতীয় GSTIN লিখুন।');
      return;
    }

    setIsSaving(true);

    const updatedProfile: UserProfile = {
      ...profile,
      businessName: businessName.trim(),
      gstin: validation.cleanGstin,
      institutionType,
    };

    const res = profileService.saveProfile(updatedProfile);

    if (res.success) {
      setProfile(res.profile);
      if (onGstinSaved) {
        onGstinSaved(businessName.trim(), validation.cleanGstin);
      }
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } else {
      setErrorMessage(res.error || 'সংরক্ষণ ব্যর্থ হয়েছে।');
    }

    setIsSaving(false);
  };

  return (
    <div className={`bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden font-bengali ${className}`}>
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-emerald-50/70 via-teal-50/30 to-amber-50/30 border-b border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-gray-900 leading-tight">
                বিজনেস জিএসটি ও প্রাতিষ্ঠানিক চালান (GST Invoice)
              </h2>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                ইনপুট ট্যাক্স ক্রেডিট (ITC)
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              কোচিং সেন্টার, লাইব্রেরি, স্কুল ও ব্যবসা প্রতিষ্ঠানের অর্ডারে জিএসটি ইনভয়েস পাওয়ার সুবিধা
            </p>
          </div>
        </div>

        {showSuccessToast && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>জিএসটি তথ্য সফলভাবে সংরক্ষিত হয়েছে!</span>
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="p-6 space-y-6">
        {/* Toggle Bar */}
        <div className="p-4 bg-gray-50/80 border border-gray-200 rounded-xl flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-gray-900">
              আপনি কি প্রাতিষ্ঠানিক জিএসটি ইনভয়েস (B2B Tax Invoice) পেতে চান?
            </p>
            <p className="text-[11px] text-gray-500">
              সক্রিয় করলে প্রতিটি বইয়ের ক্যাশ মেমোতে আপনার GSTIN ও প্রতিষ্ঠানের নাম অন্তর্ভুক্ত থাকবে।
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={hasGst}
              onChange={(e) => setHasGst(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {hasGst && (
          <div className="space-y-5 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Field 1: Business Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  প্রতিষ্ঠানের পূর্ণ নাম (Business / Institute Name) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="যেমন: মালদা আইডিয়াল একাডেমি / নবদিগন্ত লাইব্রেরি"
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-hidden transition-all"
                  />
                  <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
                <p className="text-[11px] text-gray-400">সরকারি বা প্রাতিষ্ঠানিক রেজিস্ট্রেশন অনুযায়ী নাম লিখুন।</p>
              </div>

              {/* Field 2: Institution Type */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  প্রতিষ্ঠানের ক্যাটাগরি (Type of Organization)
                </label>
                <select
                  value={institutionType}
                  onChange={(e) => setInstitutionType(e.target.value as UserProfile['institutionType'])}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-hidden transition-all"
                >
                  <option value="coaching_center">কোচিং সেন্টার / স্টাডি সার্কেল</option>
                  <option value="school_college">স্কুল / কলেজ / বিশ্ববিদ্যালয়</option>
                  <option value="library">পাবলিক / প্রাইভেট লাইব্রেরি</option>
                  <option value="bookstore_reseller">বই বিক্রেতা / বুক ডিপো</option>
                  <option value="other_enterprise">অন্যান্য বাণিজ্যিক প্রতিষ্ঠান</option>
                </select>
                <p className="text-[11px] text-gray-400">প্রতিষ্ঠান অনুসারে বিশেষ বাল্ক ডিসকাউন্ট কোড প্রযোজ্য হতে পারে।</p>
              </div>
            </div>

            {/* Field 3: 15-Digit GSTIN */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-700">
                  ১৫-ডিজিটের জিএসটিআইএন (GSTIN) <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-gray-400 font-mono">
                  {gstin.length} / 15 অক্ষর
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  maxLength={15}
                  value={gstin}
                  onChange={(e) => handleGstChange(e.target.value)}
                  placeholder="যেমন: 19AAAAA0000A1Z5"
                  className={`w-full pl-9 pr-3 py-2.5 bg-gray-50 border rounded-xl text-xs font-mono font-bold tracking-wider text-gray-900 uppercase focus:bg-white focus:outline-hidden transition-all ${
                    gstValidation?.isValid
                      ? 'border-emerald-500 ring-2 ring-emerald-100'
                      : 'border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                  }`}
                />
                <FileCheck2 className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
              </div>

              {/* GST Realtime Validation Preview Badge */}
              {gstValidation?.isValid && (
                <div className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold">বৈধ জিএসটি নম্বর:</span> {gstValidation.cleanGstin}
                      <span className="block text-[11px] text-emerald-700 font-medium">
                        রাজ্য: {gstValidation.stateName} | প্যান: {gstValidation.pan}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-600 text-white font-bold text-[10px] rounded-md shadow-2xs">
                    ITC ELIGIBLE
                  </span>
                </div>
              )}
            </div>

            {/* Info notice */}
            <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
              <span className="text-base">💡</span>
              <p className="leading-relaxed">
                <strong>ইনপুট ট্যাক্স ক্রেডিট নিশ্চয়তা:</strong> বই সরবরাহের পর চালানের জিএসটি কপি স্বয়ংক্রিয়ভাবে জেনারেট হবে এবং জিএসটি পোর্টাল (GSTR-2B)-এ আপনার ক্রেডিট প্রতিফলিত হবে।
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>জিএসটি বিধিমালা ২০১৭ অনুযায়ী চালানের বৈধতা নিশ্চিত</span>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'সংরক্ষণ করা হচ্ছে...' : 'জিএসটি বিবরণ সংরক্ষণ করুন'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
