'use client';

import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Palette,
  Image as ImageIcon,
} from 'lucide-react';
import { UserAvatarBadge } from './UserAvatarBadge';
import {
  AVATAR_GRADIENT_PALETTES,
  AvatarGradient,
  extractInitials,
} from '@/lib/utils/avatarUtils';
import { profileService, DEFAULT_CUSTOMER_PROFILE } from '@/lib/auth/profileService';
import { useAuthSession } from '@/hooks/useAuthSession';

interface AvatarUploadCardProps {
  className?: string;
  onAvatarChanged?: (newAvatarUrl?: string) => void;
}

/**
 * Task 36: Avatar Photo Uploader & Initial Badge Customizer
 * Allows uploading custom photo (max 2MB) or choosing stylish initial badge color theme.
 */
export const AvatarUploadCard: React.FC<AvatarUploadCardProps> = ({
  className = '',
  onAvatarChanged,
}) => {
  const { profile: authProfile, setProfile: setAuthProfile } = useAuthSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(authProfile.avatarUrl);
  const [selectedGradient, setSelectedGradient] = useState<AvatarGradient | undefined>();
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const displayName = authProfile.fullName || 'গ্রাহক';
  const initials = extractInitials(displayName);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage('');

    // 1. Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('ছবির সাইজ সর্বোচ্চ ২ মেগাবাইট (2MB)-এর মধ্যে হতে হবে।');
      return;
    }

    // 2. Check file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMessage('শুধুমাত্র JPG, PNG বা WebP ফরম্যাটের ছবি গ্রহণযোগ্য।');
      return;
    }

    setIsUploading(true);

    const commitAvatar = (base64Data: string) => {
      setAvatarUrl(base64Data);

      // Save to profileService
      const currentUserId = authProfile.id || DEFAULT_CUSTOMER_PROFILE.id;
      const current = profileService.getProfile(currentUserId);
      const updated = {
        ...current,
        avatarUrl: base64Data,
      };
      profileService.saveProfile(updated);

      // Update auth session
      setAuthProfile({
        ...authProfile,
        avatarUrl: base64Data,
      });

      if (onAvatarChanged) {
        onAvatarChanged(base64Data);
      }

      setIsUploading(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    };

    const reader = new FileReader();
    reader.onload = () => {
      const rawDataUrl = reader.result as string;

      // Task 36: Resize to max 256x256 to prevent localStorage quota exhaustion
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 256;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.85);
            commitAvatar(optimizedBase64);
          } else {
            commitAvatar(rawDataUrl);
          }
        } catch {
          commitAvatar(rawDataUrl);
        }
      };

      img.onerror = () => {
        commitAvatar(rawDataUrl);
      };

      img.src = rawDataUrl;
    };

    reader.onerror = () => {
      setIsUploading(false);
      setErrorMessage('ছবি আপলোড করতে সমস্যা হয়েছে। অন্য ছবি চেষ্টা করুন।');
    };

    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarUrl(undefined);

    const currentUserId = authProfile.id || DEFAULT_CUSTOMER_PROFILE.id;
    const current = profileService.getProfile(currentUserId);
    const updated = {
      ...current,
      avatarUrl: undefined,
    };
    profileService.saveProfile(updated);

    setAuthProfile({
      ...authProfile,
      avatarUrl: undefined,
    });

    if (onAvatarChanged) {
      onAvatarChanged(undefined);
    }

    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className={`bg-white rounded-2xl border border-gray-200/90 shadow-sm p-6 font-bengali ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-gray-100 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-black text-gray-900 text-sm">প্রোফাইল ছবি ও অবতার ব্যাজ</h3>
            <p className="text-[11px] text-gray-500">স্টাইলিশ ইনিশিয়াল ব্যাজ অথবা নিজস্ব ফটো আপলোড করুন</p>
          </div>
        </div>

        {showToast && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold animate-fadeIn">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>অবতার আপডেট হয়েছে!</span>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 mb-5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Avatar Display */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <UserAvatarBadge
            fullName={displayName}
            avatarUrl={avatarUrl}
            size="2xl"
            customGradient={selectedGradient}
            showOnlinePulse
          />
          <span className="text-[11px] text-gray-400 font-mono">
            {avatarUrl ? 'আপলোডকৃত ছবি' : `ইনিশিয়াল: ${initials}`}
          </span>
        </div>

        {/* Controls */}
        <div className="flex-1 space-y-4 text-center sm:text-left">
          <div>
            <h4 className="font-bold text-gray-900 text-xs">
              {avatarUrl ? 'কাস্টম প্রোফাইল ফটো সক্রিয়' : 'অটোমেটিক ইনিশিয়াল অবতার সক্রিয়'}
            </h4>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
              {avatarUrl
                ? 'আপনার ডিভাইসের নির্বাচিত ছবিটি প্রোফাইল ও ড্যাশবোর্ডে দৃশ্যমান রয়েছে।'
                : `আপনার পুরো নামের আদ্যক্ষর দিয়ে রঙিন "${initials}" স্টাইলিশ ব্যাজ তৈরি করা হয়েছে।`}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 disabled:opacity-50 text-gray-950 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploading ? 'আপলোড হচ্ছে...' : avatarUrl ? 'অন্য ছবি আপলোড' : 'ডিভাইস থেকে ফটো দিন'}</span>
            </button>

            {avatarUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="px-3 py-2 bg-white hover:bg-red-50 border border-gray-200 text-red-600 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ফটো মুছুন</span>
              </button>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Color Palettes for Initial Badge */}
          {!avatarUrl && (
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-600 font-semibold">
                <Palette className="w-3.5 h-3.5 text-amber-600" />
                <span>ইনিশিয়াল ব্যাজের কালার থিম পরিবর্তন করুন:</span>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                {AVATAR_GRADIENT_PALETTES.map((pal) => (
                  <button
                    key={pal.name}
                    type="button"
                    onClick={() => setSelectedGradient(pal)}
                    title={pal.name}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${
                      pal.bgClass
                    } ${
                      selectedGradient?.name === pal.name
                        ? 'ring-2 ring-offset-2 ring-gray-900 scale-110'
                        : 'border-white shadow-2xs'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
