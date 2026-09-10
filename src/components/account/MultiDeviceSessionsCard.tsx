'use client';

import React, { useState, useEffect } from 'react';
import { Laptop, Smartphone, Tablet, ShieldAlert, LogOut, CheckCircle2, MapPin, Clock } from 'lucide-react';
import { DeviceSession } from '@/types/auth';
import { multiDeviceSessionService } from '@/lib/auth/multiDeviceSessionService';
import { useAuthSession } from '@/hooks/useAuthSession';

interface MultiDeviceSessionsCardProps {
  className?: string;
}

/**
 * Task 25: Multi-Device Session Control & "Log out of all devices"
 * Amazon-style device manager letting customers view all active devices
 * and remotely revoke access with 1-click.
 */
export const MultiDeviceSessionsCard: React.FC<MultiDeviceSessionsCardProps> = ({
  className = '',
}) => {
  const { profile, isLoggedIn } = useAuthSession();
  const userId = profile.id || 'user-default';

  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isTerminatingAll, setIsTerminatingAll] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      const active = multiDeviceSessionService.getUserSessions(userId);
      setSessions(active);
    }
  }, [isLoggedIn, userId]);

  if (!isLoggedIn) return null;

  const handleTerminateSingle = (sessionId: string) => {
    const updated = multiDeviceSessionService.terminateSession(userId, sessionId);
    setSessions(updated);
    setSuccessMessage('নির্বাচিত ডিভাইসটি সফলভাবে সাইন-আউট করা হয়েছে।');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleTerminateAllOther = () => {
    setIsTerminatingAll(true);
    setTimeout(() => {
      const updated = multiDeviceSessionService.terminateAllOtherSessions(userId);
      setSessions(updated);
      setIsTerminatingAll(false);
      setSuccessMessage('অন্যান্য সমস্ত ডিভাইস থেকে অ্যাকাউন্ট সাইন-আউট করা হয়েছে।');
      setTimeout(() => setSuccessMessage(null), 3500);
    }, 600);
  };

  const getDeviceIcon = (type: DeviceSession['deviceType']) => {
    switch (type) {
      case 'desktop':
        return <Laptop className="w-5 h-5 text-blue-600" />;
      case 'mobile':
        return <Smartphone className="w-5 h-5 text-emerald-600" />;
      case 'tablet':
        return <Tablet className="w-5 h-5 text-purple-600" />;
    }
  };

  const otherSessionsCount = sessions.filter((s) => !s.isCurrentDevice).length;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-xs font-bengali ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <h3 className="text-base font-bold text-gray-950">
              সক্রিয় ডিভাইস ও সেশন নিয়ন্ত্রণ (Device Management)
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            বর্তমানে আপনার অ্যাকাউন্টে {sessions.length}টি সক্রিয় ডিভাইস লগইন রয়েছে।
          </p>
        </div>

        {/* Log out of all other devices CTA */}
        {otherSessionsCount > 0 && (
          <button
            type="button"
            onClick={handleTerminateAllOther}
            disabled={isTerminatingAll}
            className="px-3.5 py-2 bg-red-50 hover:bg-red-100 active:bg-red-200 border border-red-200 text-red-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <LogOut className="w-3.5 h-3.5 text-red-600" />
            <span>
              {isTerminatingAll ? 'সাইন-আউট হচ্ছে...' : 'অন্যান্য সব ডিভাইস থেকে সাইন-আউট'}
            </span>
          </button>
        )}
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Devices List */}
      <div className="mt-4 divide-y divide-gray-100">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                {getDeviceIcon(session.deviceType)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-black text-gray-900">{session.deviceName}</h4>
                  {session.isCurrentDevice && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      <span>বর্তমান ডিভাইস (This Device)</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span>{session.location}</span>
                  </span>
                  <span>•</span>
                  <span>IP: {session.ipAddress}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span>{session.lastActive}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Individual Terminate Button */}
            {!session.isCurrentDevice && (
              <button
                type="button"
                onClick={() => handleTerminateSingle(session.id)}
                className="self-start sm:self-center px-3 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-gray-200 text-gray-700 text-xs font-semibold rounded-md transition-colors cursor-pointer"
              >
                লগআউট করুন
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
