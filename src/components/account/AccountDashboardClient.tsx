'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  User,
  Package,
  MapPin,
  Shield,
  Laptop,
  ChevronRight,
  Settings,
  FileText,
  Clock,
  ExternalLink,
  Compass,
  Receipt,
  Download,
  Trash2,
  LayoutGrid,
  Gift,
} from 'lucide-react';
import { ProfileMetadataCard } from './ProfileMetadataCard';
import { ExamPreferencesSelector } from './ExamPreferencesSelector';
import { BusinessGstinCard } from './BusinessGstinCard';
import { MultiDeviceSessionsCard } from './MultiDeviceSessionsCard';
import { PhoneUpdateModal } from './PhoneUpdateModal';
import { DeleteAccountModal } from './DeleteAccountModal';
import { UserAvatarBadge } from './UserAvatarBadge';
import { AvatarUploadCard } from './AvatarUploadCard';
import { WhatsAppOptInCard } from './WhatsAppOptInCard';
import { NotificationPreferencesCard } from './NotificationPreferencesCard';
import { DataExportCard } from './DataExportCard';
import { AmazonAccountHubCards } from './AmazonAccountHubCards';
import { ReferAndEarnCard } from './ReferAndEarnCard';
import { DpdpConsentNoticeModal } from '@/components/auth/DpdpConsentNoticeModal';
import { useAuthSession } from '@/hooks/useAuthSession';

/**
 * Task 31, 32, 33, 34, 36, 37, 38, 39, 40 & Task 43: Amazon-Pattern Customer Account Hub Client
 */
export const AccountDashboardClient: React.FC = () => {
  const { profile, loginAsDemo } = useAuthSession();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'exams' | 'business' | 'security' | 'data' | 'refer'>('overview');
  const [showDpdpModal, setShowDpdpModal] = useState(false);
  const [isPhoneUpdateModalOpen, setIsPhoneUpdateModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);

  // Sync tab from URL query params (Task 41 & 43)
  useEffect(() => {
    if (tabParam && ['overview', 'profile', 'exams', 'business', 'security', 'data', 'refer'].includes(tabParam)) {
      setActiveTab(tabParam as 'overview' | 'profile' | 'exams' | 'business' | 'security' | 'data' | 'refer');
    }
  }, [tabParam]);

  const displayName = profile.fullName || 'গ্রাহক';

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#131921] via-[#1e2a38] to-[#232f3e] text-white rounded-2xl p-6 sm:p-8 border border-amber-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <UserAvatarBadge
              fullName={displayName}
              avatarUrl={profile.avatarUrl}
              size="lg"
              showOnlinePulse={profile.isLoggedIn}
            />
            <div>
              <div className="text-xs text-amber-400 font-bold uppercase tracking-wider flex items-center gap-2">
                <span>সম্মানিত গ্রাহক ড্যাশবোর্ড</span>
                {profile.isLoggedIn && (
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30">
                    লগইন সক্রিয়
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
                স্বাগতম, <span className="text-amber-400">{displayName}</span>
              </h1>
              <p className="text-xs text-gray-300 mt-1">
                মালদা ও উত্তরবঙ্গের শিক্ষার্থীদের বিশ্বস্ত বইয়ের নির্ভরযোগ্য ঠিকানা
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {!profile.isLoggedIn && (
              <button
                type="button"
                onClick={loginAsDemo}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg border border-white/20 transition-colors cursor-pointer"
              >
                ডেমো লগইন করুন
              </button>
            )}

            <Link
              href="/orders"
              className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-gray-950 text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Package className="w-4 h-4" />
              <span>আপনার অর্ডারসমূহ</span>
            </Link>
          </div>
        </div>

        {/* Quick Customer Metric Chips (Task 43 & 48 Polish) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/10">
          <Link
            href="/orders"
            className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/15 flex items-center gap-3 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-gray-300 block">চলতি অর্ডার</span>
              <span className="text-sm font-black text-white group-hover:text-amber-400 transition-colors">১টি বই ট্র্যাকিং</span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setActiveTab('refer')}
            className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/15 flex items-center gap-3 transition-all group text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-gray-300 block">রিওয়ার্ড পয়েন্ট</span>
              <span className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors">৩৫০ পয়েন্ট (₹৩৫)</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setShowDpdpModal(true)}
            className="col-span-2 sm:col-span-1 bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/15 flex items-center gap-3 transition-all group text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-400/20 text-blue-300 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-gray-300 block">DPDP Act 2023</span>
              <span className="text-sm font-black text-emerald-400 flex items-center gap-1">
                <span>১০০% সুরক্ষিত</span>
              </span>
            </div>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-700/60 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'overview'
                ? 'bg-amber-400 text-gray-950 shadow-xs'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>ড্যাশবোর্ড হাব</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'profile'
                ? 'bg-amber-400 text-gray-950 shadow-xs'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>প্রোফাইল ও মেটাডাটা</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('exams')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'exams'
                ? 'bg-amber-400 text-gray-950 shadow-xs'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>পরীক্ষার প্রস্তুতি ও লক্ষ্য</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('business')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'business'
                ? 'bg-amber-400 text-gray-950 shadow-xs'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>বিজনেস জিএসটি ও চালান</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'security'
                ? 'bg-amber-400 text-gray-950 shadow-xs'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>ডিভাইস ও সেশন সিকিউরিটি</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'data'
                ? 'bg-amber-400 text-gray-950 shadow-xs'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>ডেটা এক্সপোর্ট (DPDP)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('refer')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'refer'
                ? 'bg-amber-400 text-gray-950 shadow-xs'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Gift className="w-3.5 h-3.5 text-amber-300" />
            <span>রেফার ও রিওয়ার্ড</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDpdpModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2 cursor-pointer shrink-0 ml-auto"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>DPDP ডাটা প্রটেকশন</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {/* Overview Hub (Task 43: Amazon 6-Card / 8-Card Grid) */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fadeIn">
          <AmazonAccountHubCards
            onSelectTab={(tab) => setActiveTab(tab)}
            onOpenDpdpModal={() => setShowDpdpModal(true)}
          />

          {/* Quick Profile Snapshot Strip */}
          <div className="p-5 bg-white border border-gray-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <UserAvatarBadge
                fullName={displayName}
                avatarUrl={profile.avatarUrl}
                size="md"
              />
              <div>
                <p className="text-xs font-bold text-gray-900 flex items-center gap-2">
                  <span>{displayName}</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                    ভেরিফায়েড কাস্টমার
                  </span>
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  ফোন: +91 {profile.phoneNumber || '9800123456'} {profile.email ? `• ইমেইল: ${profile.email}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                প্রোফাইল সেটিংস
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('data')}
                className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              >
                <Download className="w-3 h-3 text-emerald-600" />
                <span>ডেটা এক্সপোর্ট</span>
              </button>
            </div>
          </div>

          {/* Task 48: Refer & Earn Rewards Card */}
          <ReferAndEarnCard
            userId={profile.id}
            fullName={displayName}
          />
        </div>
      )}
      {activeTab === 'profile' && (
        <div className="space-y-8">
          <AvatarUploadCard />
          <ProfileMetadataCard
            onOpenPhoneUpdateModal={() => setIsPhoneUpdateModalOpen(true)}
          />
          <ExamPreferencesSelector />
          <BusinessGstinCard />
          <WhatsAppOptInCard />
          <NotificationPreferencesCard />
          <DataExportCard userId={profile.id} />

          {/* Amazon Quick 3-card overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/orders"
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-amber-600 transition-colors">
                  আপনার সমস্ত অর্ডার
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  চলতি অর্ডারের লাইভ ট্র্যাকিং ও চালান সরাসরি ডাউনলোড করুন।
                </p>
              </div>
              <span className="text-xs font-bold text-amber-600 mt-4 flex items-center gap-1">
                <span>অর্ডার দেখুন</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1">
                  সংরক্ষিত ঠিকানা
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">
                  মালদা শহর ও জেলার যে কোনো ব্লকের জন্য আপনার ডেলিভারি ঠিকানা।
                </p>
                <div className="text-xs bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-gray-700">
                  📍 রবীন্দ্র এভিনিউ, ইংলিশ বাজার, মালদা - ৭৩২৪০১
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-700 mt-4">
                ✓ কাউন্টার পিকআপ ও হোম ডেলিভারি সক্রিয়
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1">
                  গোপনীয়তা ও অধিকার
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">
                  ভারতীয় ডিজিটাল ব্যক্তিগত ডাটা সুরক্ষা আইন (DPDP Act 2023) কমপ্লায়েন্স।
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDpdpModal(true)}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>সম্মতি ও তথ্যের অধিকার দেখুন</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('data')}
                    className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>১-ক্লিক ডেটা এক্সপোর্ট (PDF/JSON)</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <span className="text-xs font-semibold text-gray-400 mt-4">
                গ্রিভেন্স অফিসার: জনাব সাবির খান
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'exams' && (
        <div className="space-y-6">
          <ExamPreferencesSelector />
        </div>
      )}

      {activeTab === 'business' && (
        <div className="space-y-6">
          <BusinessGstinCard />
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          <MultiDeviceSessionsCard />
          <DataExportCard userId={profile.id} />

          {/* Task 40: Danger Zone - DPDP Act 2023 Sec 12 Right to Erasure */}
          <div className="bg-red-50/60 rounded-2xl border border-red-200 p-6 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-red-950 flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-red-600" />
                  <span>অ্যাকাউন্ট চিরতরে মুছে ফেলার আবেদন (DPDP Act 2023 Sec 12)</span>
                </h4>
                <p className="text-xs text-red-800/80 mt-1 max-w-xl leading-relaxed">
                  ডিজিটাল ব্যক্তিগত ডেটা সুরক্ষা আইন ২০২৩ অনুযায়ী আপনার ব্যক্তিগত তথ্য, সংরক্ষিত ঠিকানা ও উইশলিস্ট স্থায়ীভাবে নিশ্চিহ্ন করার জন্য ৬-ডিজিট ওটিপি দিয়ে নিশ্চিত করুন।
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteAccountModalOpen(true)}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                <span>অ্যাকাউন্ট মুছুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="space-y-6">
          <DataExportCard userId={profile.id} />
        </div>
      )}

      {/* Task 48: Dedicated Refer & Earn Tab */}
      {activeTab === 'refer' && (
        <div className="space-y-6 animate-fadeIn">
          <ReferAndEarnCard
            userId={profile.id}
            fullName={displayName}
          />
        </div>
      )}

      {/* DPDP Privacy Hub Modal */}
      <DpdpConsentNoticeModal
        isOpen={showDpdpModal}
        onClose={() => setShowDpdpModal(false)}
        userId={profile.id || 'guest'}
      />

      {/* Task 34: 2-Step Secure Mobile Number Update Modal */}
      <PhoneUpdateModal
        isOpen={isPhoneUpdateModalOpen}
        onClose={() => setIsPhoneUpdateModalOpen(false)}
        currentPhoneNumber={profile.phoneNumber || '9800123456'}
        onSuccess={(newPhone) => {
          console.log(`[MM Enterprise] Phone number updated to: ${newPhone}`);
        }}
      />

      {/* Task 40: Self-Service Account Deletion Modal with OTP Confirmation */}
      <DeleteAccountModal
        isOpen={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
        userId={profile.id || 'user-demo-sabir'}
        phoneNumber={profile.phoneNumber || '9800123456'}
      />
    </div>
  );
};
