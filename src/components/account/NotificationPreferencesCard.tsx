'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Lock,
  CheckCircle2,
  ShieldCheck,
  Save,
  Ban,
  MessageSquare,
  Mail,
  Smartphone,
  Tag,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { GranularNotificationPreferences } from '@/types/auth';
import {
  notificationPreferencesService,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '@/lib/auth/notificationPreferencesService';
import { useAuthSession } from '@/hooks/useAuthSession';

interface NotificationPreferencesCardProps {
  className?: string;
  onSaved?: (prefs: GranularNotificationPreferences) => void;
}

/**
 * Task 38: Granular Notification Preferences Card
 * Allows customers to silence promotional/advertising messages
 * while keeping essential transactional OTPs, invoices, and delivery tracking active.
 */
export const NotificationPreferencesCard: React.FC<NotificationPreferencesCardProps> = ({
  className = '',
  onSaved,
}) => {
  const { profile: authProfile } = useAuthSession();
  const userId = authProfile.id || 'user-demo-sabir';

  const [prefs, setPrefs] = useState<GranularNotificationPreferences>(() =>
    notificationPreferencesService.getPreferences(userId)
  );

  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (authProfile.id) {
      setPrefs(notificationPreferencesService.getPreferences(authProfile.id));
    }
  }, [authProfile.id]);

  const handleToggle = (key: keyof GranularNotificationPreferences, value: boolean) => {
    if (key === 'transactionalSms' || key === 'transactionalEmail') {
      return; // Mandated immutable
    }

    const updated = {
      ...prefs,
      [key]: value,
    };

    setPrefs(updated);
  };

  const handleSave = () => {
    setIsSaving(true);
    const saved = notificationPreferencesService.savePreferences(userId, prefs);
    setPrefs(saved);

    if (onSaved) {
      onSaved(saved);
    }

    setIsSaving(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const handleEnableDnd = () => {
    setIsSaving(true);
    const dnd = notificationPreferencesService.enableDndMode(userId);
    setPrefs(dnd);

    if (onSaved) {
      onSaved(dnd);
    }

    setIsSaving(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const hasAnyPromoActive =
    prefs.promotionalSms ||
    prefs.promotionalEmail ||
    prefs.promotionalWhatsApp ||
    prefs.priceDropAlerts ||
    prefs.examSyllabusUpdates;

  return (
    <div className={`bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden font-bengali ${className}`}>
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-blue-50/30 border-b border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-gray-900 leading-tight">
                মেসেজ ও নোটিফিকেশন নিয়ন্ত্রণ
              </h2>
              <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                TRAI DND & DPDP Compliant
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              অফার ও বিজ্ঞাপনী বার্তা বন্ধ রেখে শুধুমাত্র জরুরি অর্ডার ও ওটিপি মেসেজ চালু রাখুন
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showToast && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>প্রেফারেন্স আপডেট হয়েছে!</span>
            </div>
          )}

          {hasAnyPromoActive && (
            <button
              type="button"
              onClick={handleEnableDnd}
              disabled={isSaving}
              className="px-3 py-1.5 bg-white hover:bg-red-50 border border-red-200 text-red-600 hover:text-red-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              title="সব বিজ্ঞাপনী মেসেজ বন্ধ করুন"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>DND চালু করুন</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Section 1: Mandated Transactional Notifications */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>জরুরি ট্রানজ্যাকশনাল ও নিরাপত্তা বার্তা (অপরিহার্য)</span>
            </h3>
            <span className="text-[10px] text-gray-400 font-medium">সর্বদা সক্রিয়</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50/90 border border-gray-200 rounded-xl flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-gray-500" />
                  <span>ওটিপি ও সিকিউরিটি এলার্ট</span>
                </p>
                <p className="text-[11px] text-gray-500">লগইন, পাসওয়ার্ডলেস ওটিপি ও অ্যাকাউন্ট নিরাপত্তা।</p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                সক্রিয়
              </span>
            </div>

            <div className="p-3 bg-gray-50/90 border border-gray-200 rounded-xl flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-500" />
                  <span>অর্ডার চালান ও ডেলিভারি স্ট্যাটাস</span>
                </p>
                <p className="text-[11px] text-gray-500">বই কেনা, ক্যাশ মেমো ও কুরিয়ার ট্র্যাকিং লিঙ্ক।</p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                সক্রিয়
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Optional Marketing & Promotional Notifications */}
        <div className="space-y-3 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>অফার ও বিজ্ঞাপনী বার্তা (আপনার পূর্ণ নিয়ন্ত্রণাধীন)</span>
            </h3>
            <span className="text-[11px] text-purple-700 font-semibold">
              {hasAnyPromoActive ? 'বিজ্ঞাপন সক্রিয়' : 'DND মোড সক্রিয় (জিরো স্প্যাম)'}
            </span>
          </div>

          <div className="space-y-2.5">
            {/* Toggle 1: Promotional SMS */}
            <div className="p-3.5 bg-white border border-gray-200 rounded-xl flex items-center justify-between gap-4 hover:border-purple-200 transition-colors">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-600" />
                  <span>এসএমএস-এ বিশেষ অফার ও প্রোমো কুপন</span>
                </p>
                <p className="text-[11px] text-gray-500">
                  পরীক্ষার মৌসুমের বিশেষ ডিসকাউন্ট কোড ও ক্যাশব্যাকের টেক্সট মেসেজ।
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={prefs.promotionalSms}
                  onChange={(e) => handleToggle('promotionalSms', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* Toggle 2: Promotional Email */}
            <div className="p-3.5 bg-white border border-gray-200 rounded-xl flex items-center justify-between gap-4 hover:border-purple-200 transition-colors">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>ইমেইল নিউজলেটার ও নতুন বইয়ের তালিকা</span>
                </p>
                <p className="text-[11px] text-gray-500">
                  মাসে সর্বোচ্চ ১-২টি নির্বাচিত বেস্টসেলার বই ও শিক্ষামূলক নিবন্ধ।
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={prefs.promotionalEmail}
                  onChange={(e) => handleToggle('promotionalEmail', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* Toggle 3: Promotional WhatsApp */}
            <div className="p-3.5 bg-white border border-gray-200 rounded-xl flex items-center justify-between gap-4 hover:border-purple-200 transition-colors">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>হোয়াটসঅ্যাপে বইমেলা ও উৎসবের অফার ব্রডকাস্ট</span>
                </p>
                <p className="text-[11px] text-gray-500">
                  মালদা জেলা বইমেলা ও বিশেষ উপলক্ষে এক্সক্লুসিভ ছাড়ের বার্তা।
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={prefs.promotionalWhatsApp}
                  onChange={(e) => handleToggle('promotionalWhatsApp', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* Toggle 4: Price Drop Alerts */}
            <div className="p-3.5 bg-white border border-gray-200 rounded-xl flex items-center justify-between gap-4 hover:border-purple-200 transition-colors">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-rose-600" />
                  <span>উইশলিস্টের বইয়ের মূল্য হ্রাস ও স্টক সতর্কতা (Price Drop)</span>
                </p>
                <p className="text-[11px] text-gray-500">
                  আপনার সেভ করা কোনো বইয়ের মূল্য কমলে বা আউট-অব-স্টক বই ফিরে এলে বার্তা।
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={prefs.priceDropAlerts}
                  onChange={(e) => handleToggle('priceDropAlerts', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* Toggle 5: Exam Syllabus Updates */}
            <div className="p-3.5 bg-white border border-gray-200 rounded-xl flex items-center justify-between gap-4 hover:border-purple-200 transition-colors">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>পরীক্ষার সিলেবাস ও নতুন সংস্করণের বইয়ের আপডেট</span>
                </p>
                <p className="text-[11px] text-gray-500">
                  WBCS, UGB বা প্রাথমিক টেটের নতুন এডিশন প্রকাশ সংক্রান্ত দরকারি নোটিফিকেশন।
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={prefs.examSyllabusUpdates}
                  onChange={(e) => handleToggle('examSyllabusUpdates', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
            <span>আপনার পছন্দ অনুযায়ী শুধুমাত্র নির্বাচিত মাধ্যমেই বার্তা পাঠানো হবে</span>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'সংরক্ষণ করা হচ্ছে...' : 'নোটিফিকেশন পছন্দ সংরক্ষণ করুন'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
