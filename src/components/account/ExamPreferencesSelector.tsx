'use client';

import React, { useState, useEffect } from 'react';
import {
  Compass,
  CheckCircle2,
  Sparkles,
  Save,
  RotateCcw,
  BookOpen,
  HelpCircle,
} from 'lucide-react';
import { CustomerExamPreference, UserProfile } from '@/types/auth';
import { EXAM_PREFERENCE_OPTIONS, ExamPreferenceOption } from '@/lib/data/examPreferencesData';
import { profileService, DEFAULT_CUSTOMER_PROFILE } from '@/lib/auth/profileService';
import { useAuthSession } from '@/hooks/useAuthSession';

interface ExamPreferencesSelectorProps {
  initialPreferences?: CustomerExamPreference[];
  onPreferencesSaved?: (preferences: CustomerExamPreference[]) => void;
  className?: string;
}

/**
 * Task 32: Exam Preparation & Target Goals Tag Selector (Smart Personalization)
 * Allows students & competitive exam aspirants to select targets (WBCS, UGB, Primary TET, etc.)
 * which prioritizes relevant book recommendations across the homepage and search feeds.
 */
export const ExamPreferencesSelector: React.FC<ExamPreferencesSelectorProps> = ({
  initialPreferences,
  onPreferencesSaved,
  className = '',
}) => {
  const { profile: authProfile } = useAuthSession();

  const [selected, setSelected] = useState<CustomerExamPreference[]>(() => {
    if (initialPreferences && initialPreferences.length > 0) {
      return initialPreferences;
    }
    if (authProfile.id) {
      const p = profileService.getProfile(authProfile.id);
      if (p.examPreferences && p.examPreferences.length > 0) {
        return p.examPreferences;
      }
    }
    return ['wbcs', 'ugb']; // Default recommended targets for Malda district
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (authProfile.id) {
      const p = profileService.getProfile(authProfile.id);
      if (p.examPreferences && p.examPreferences.length > 0) {
        setSelected(p.examPreferences);
      }
    }
  }, [authProfile.id]);

  const togglePreference = (id: CustomerExamPreference) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        // Keep at least 1 preference
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSave = () => {
    setIsSaving(true);

    const currentUserId = authProfile.id || DEFAULT_CUSTOMER_PROFILE.id;
    const current = profileService.getProfile(currentUserId);
    const updated: UserProfile = {
      ...current,
      examPreferences: selected,
    };

    profileService.saveProfile(updated);

    // Task 32: Broadcast personalization update to homepage carousels & recommendations
    if (typeof window !== 'undefined') {
      localStorage.setItem('mm_user_exam_preferences', JSON.stringify(selected));
      window.dispatchEvent(
        new CustomEvent('mm_exam_preference_changed', { detail: { preferences: selected } })
      );
    }

    if (onPreferencesSaved) {
      onPreferencesSaved(selected);
    }

    setIsSaving(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleResetToDefault = () => {
    setSelected(['wbcs', 'ugb']);
  };

  return (
    <div className={`bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden font-bengali ${className}`}>
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-amber-50/30 border-b border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-gray-900 leading-tight">
                লক্ষ্য ও পরীক্ষার প্রস্তুতি (Exam Preferences)
              </h2>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>স্মার্ট পারসোনালাইজেশন</span>
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              আপনার নির্বাচিত বিষয় ও পরীক্ষার সিলেবাস অনুযায়ী হোমপেজে বইগুলো সবার আগে প্রাধান্য পাবে
            </p>
          </div>
        </div>

        {showToast && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>পছন্দসমূহ সফলভাবে সংরক্ষিত হয়েছে!</span>
          </div>
        )}
      </div>

      {/* Grid of Exam Targets */}
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-gray-700">
            এক বা একাধিক লক্ষ্য নির্বাচন করুন ({selected.length}টি নির্বাচিত):
          </p>
          <button
            type="button"
            onClick={handleResetToDefault}
            className="text-[11px] text-gray-500 hover:text-gray-800 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>মালদা ডিফল্ট (WBCS ও UGB)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {EXAM_PREFERENCE_OPTIONS.map((item: ExamPreferenceOption) => {
            const isChecked = selected.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => togglePreference(item.id)}
                className={`relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                  isChecked
                    ? item.activeBorderClass
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="text-2xl">{item.icon}</div>
                    <div className="flex items-center gap-1.5">
                      {item.popularTag && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                          {item.popularTag}
                        </span>
                      )}
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                          isChecked
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>

                  <h3 className="font-bold text-gray-900 text-xs leading-snug">
                    {item.nameBn}
                  </h3>
                  <p className="text-[11px] text-gray-400 font-medium">{item.nameEn}</p>
                </div>

                <p className="text-[11px] text-gray-600 mt-2.5 pt-2 border-t border-gray-100 leading-tight">
                  {item.taglineBn}
                </p>
              </div>
            );
          })}
        </div>

        {/* Action Save Bar */}
        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
            <span>হোমপেজের "আপনার জন্য প্রস্তাবিত" বিভাগে নির্বাচিত বিষয়ের বই প্রদর্শিত হবে</span>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'সংরক্ষণ করা হচ্ছে...' : 'পছন্দসমূহ নিশ্চিত করুন'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
