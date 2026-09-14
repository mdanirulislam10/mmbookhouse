'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  MessageCircle,
  Smartphone,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Ban,
  Sparkles,
  Info,
} from 'lucide-react';
import { CustomerNotificationPreference } from '@/types/notifications';
import { defaultPreferenceService } from '@/lib/services/notificationPreferenceService';
import { maskPhoneNumber, sanitizePhoneNumberE164 } from '@/lib/services/notificationTemplateService';

interface NotificationPreferencesFormProps {
  userId?: string;
  phone?: string;
  className?: string;
  onSaved?: (prefs: CustomerNotificationPreference) => void;
}

export const NotificationPreferencesForm: React.FC<NotificationPreferencesFormProps> = ({
  userId = 'usr_guest_demo',
  phone = '+919832123456',
  className = '',
  onSaved,
}) => {
  const [preferences, setPreferences] = useState<CustomerNotificationPreference>(() =>
    defaultPreferenceService.getPreferences(userId)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [optOutNotice, setOptOutNotice] = useState<string | null>(null);

  const cleanPhone = sanitizePhoneNumberE164(phone);
  const maskedPhone = cleanPhone.valid ? cleanPhone.masked : maskPhoneNumber(phone);

  useEffect(() => {
    const loaded = defaultPreferenceService.getPreferences(userId);
    setPreferences(loaded);
  }, [userId]);

  const handleToggle = (field: keyof CustomerNotificationPreference) => {
    if (typeof preferences[field] === 'boolean') {
      setPreferences((prev) => ({
        ...prev,
        [field]: !prev[field],
      }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // In real production, also PUT to /api/notifications/preferences
      const updated = defaultPreferenceService.updatePreferences(userId, {
        whatsapp_enabled: preferences.whatsapp_enabled,
        sms_enabled: preferences.sms_enabled,
        email_enabled: preferences.email_enabled,
        promotions_opt_in: preferences.promotions_opt_in,
      });

      setPreferences(updated);
      setSaveSuccess(true);
      if (onSaved) onSaved(updated);

      setTimeout(() => {
        setSaveSuccess(false);
      }, 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInstantStopPromotions = () => {
    const res = defaultPreferenceService.handleOptOut(phone, 'STOP');
    if (res.success) {
      setPreferences((prev) => ({ ...prev, promotions_opt_in: false }));
      setOptOutNotice(res.message);
      setTimeout(() => setOptOutNotice(null), 6000);
    }
  };

  return (
    <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between pb-5 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Bell className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              অটোমেটেড ট্রানজ্যাকশনাল নোটিফিকেশন সেটিংস
            </h2>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            অর্ডার ট্র্যাকিং, ওটিপি এবং কুরিয়ার লাইভ আপডেট প্রাপ্তির মাধ্যম নিয়ন্ত্রণ করুন
          </p>
        </div>

        {/* DPDP Compliance Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full text-xs font-medium border border-zinc-200 dark:border-zinc-700">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>DPDP Act 2023 সুরক্ষিত</span>
        </div>
      </div>

      {/* Phone Number Display */}
      <div className="my-5 p-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl flex items-center justify-between border border-zinc-200/60 dark:border-zinc-700/60">
        <div className="flex items-center gap-3">
          <Smartphone className="w-5 h-5 text-zinc-500" />
          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">সংযুক্ত মোবাইল নম্বর (E.164)</div>
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 font-mono tracking-wide">
              {maskedPhone}
            </div>
          </div>
        </div>
        <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md font-medium">
          যাচাইকৃত (Verified)
        </span>
      </div>

      {/* Opt Out Alert Toast */}
      {optOutNotice && (
        <div className="mb-5 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3 text-xs text-amber-800 dark:text-amber-200">
          <Ban className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{optOutNotice}</span>
        </div>
      )}

      {/* Preferences Toggles */}
      <div className="space-y-4">
        {/* 1. WhatsApp Priority Channel */}
        <div className="flex items-start justify-between p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-emerald-200 dark:hover:border-emerald-900/40 transition-colors">
          <div className="flex items-start gap-3">
            <span className="p-2 bg-emerald-100/60 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0 mt-0.5">
              <MessageCircle className="w-5 h-5" />
            </span>
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                WhatsApp ইনস্ট্যান্ট নোটিফিকেশন
                <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-bold">
                  সুপারিশকৃত
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                অর্ডার কনফার্মেশন, কুরিয়ার ট্র্যাকিং লিঙ্ক ও ইনভয়েস PDF সরাসরি হোয়াটসঅ্যাপে পান
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle('whatsapp_enabled')}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              preferences.whatsapp_enabled ? 'bg-emerald-600' : 'bg-zinc-300 dark:bg-zinc-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                preferences.whatsapp_enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 2. DLT SMS Backup Channel */}
        <div className="flex items-start justify-between p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors">
          <div className="flex items-start gap-3">
            <span className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg shrink-0 mt-0.5">
              <Smartphone className="w-5 h-5" />
            </span>
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                TRAI DLT ট্রানজ্যাকশনাল SMS (Header: MMBOOK)
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                হোয়াটসঅ্যাপ ডেলিভারি না হলে অথবা ইন্টারনেট না থাকলে গোপন ডেলিভারি OTP ব্যাকআপ এসএমএস
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle('sms_enabled')}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              preferences.sms_enabled ? 'bg-emerald-600' : 'bg-zinc-300 dark:bg-zinc-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                preferences.sms_enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 3. Promotional Offers & Book Drops */}
        <div className="flex items-start justify-between p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-amber-200 dark:hover:border-amber-900/40 transition-colors">
          <div className="flex items-start gap-3">
            <span className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                নতুন বই প্রকাশনা ও বিশেষ কুপন অ্যালার্ট
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                নতুন প্রতিযোগিতামূলক পরীক্ষার বই, মালদা শপের বুকফেয়ার অফার ও এক্সক্লুসিভ ডিসকাউন্ট
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle('promotions_opt_in')}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              preferences.promotions_opt_in ? 'bg-emerald-600' : 'bg-zinc-300 dark:bg-zinc-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                preferences.promotions_opt_in ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Actions & Footer */}
      <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Opt-out STOP helper */}
        <button
          type="button"
          onClick={handleInstantStopPromotions}
          className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1.5 transition-colors"
        >
          <Ban className="w-3.5 h-3.5" />
          <span>সকল প্রমোশনাল অফার বন্ধ করুন ("STOP")</span>
        </button>

        {/* Save Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {saveSuccess && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              সংরক্ষিত হয়েছে!
            </span>
          )}
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'সংরক্ষণ হচ্ছে...' : 'পছন্দসমূহ সংরক্ষণ করুন'}
          </button>
        </div>
      </div>
    </div>
  );
};
