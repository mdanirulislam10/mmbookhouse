'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { accountLinkingService, SocialAuthPayload } from '@/lib/auth/accountLinking';
import { UserProfile } from '@/types/auth';

interface GoogleOneTapProps {
  onSuccess: (profile: UserProfile, needsPhone: boolean) => void;
  onFallbackToPhone: () => void;
  disabled?: boolean;
}

export const GoogleOneTap: React.FC<GoogleOneTapProps> = ({
  onSuccess,
  onFallbackToPhone,
  disabled = false,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Task 11 & 18: Google 1-Tap & PKCE initialization
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load Google GIS script dynamically if not present
    const scriptId = 'google-gsi-client';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Simulated Google OAuth 2.0 flow with minimal scopes (Task 17)
      // and PKCE state simulation (Task 18)
      const mockGooglePayload: SocialAuthPayload = {
        email: 'sabir.student@gmail.com',
        fullName: 'সাবির আহমেদ',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        provider: 'google',
        providerId: 'google-uid-100293',
        codeVerifier: 'pkce-secure-verifier-token-998811',
      };

      // Merge / create account
      const result = await accountLinkingService.linkSocialAccount(mockGooglePayload);
      onSuccess(result.profile, result.needsPhone);
    } catch (err) {
      // Task 20: Friendly Fallback notice
      setErrorMessage('গুগল সাইন-ইনে সমস্যা দেখা দিয়েছে—অনুগ্রহ করে মোবাইল ওটিপি দিয়ে সহজে লগইন করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-3 pt-2">
      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="border-t border-gray-200 w-full" />
        <span className="bg-white px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider shrink-0 select-none">
          অথবা
        </span>
        <div className="border-t border-gray-200 w-full" />
      </div>

      {/* Task 16: Standard OAuth 2.0 "Continue with Google" Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={disabled || isLoading}
        className="w-full py-2.5 px-4 bg-white hover:bg-gray-50 active:bg-gray-100 border border-gray-300 text-gray-800 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        {/* Google G Logo SVG */}
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>{isLoading ? 'সংযোগ করা হচ্ছে...' : 'Continue with Google (১-ক্লিক সাইন-ইন)'}</span>
      </button>

      {/* Task 20: Fallback Alert message */}
      {errorMessage && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p>{errorMessage}</p>
            <button
              type="button"
              onClick={onFallbackToPhone}
              className="font-bold underline text-amber-800 hover:text-amber-950 mt-1 cursor-pointer"
            >
              মোবাইল ওটিপি দিয়ে এগিয়ে যান ➔
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
