'use client';

import React, { useState } from 'react';
import { User } from 'lucide-react';

interface UserAvatarProps {
  avatarUrl?: string;
  name?: string;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Module 2 (Task 39): Customer Profile Avatar Thumbnail & Initials Fallback
 *
 * Displays circular user avatar thumbnail when signed in (Google OAuth or custom profile pic),
 * with graceful fallback to Bengali/English initials or Amazon-style User vector icon.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarUrl,
  name = '',
  className = '',
  size = 'sm',
}) => {
  const [imageError, setImageError] = useState(false);

  const dimensionClasses = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm';

  // Compute initials (e.g. "সাবির আহমেদ" -> "সা", "Sabir Ahmed" -> "SA")
  const getInitials = (fullName: string) => {
    if (!fullName.trim()) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(name);

  // 1. If user has avatar image and it hasn't failed to load
  if (avatarUrl && !imageError) {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden ring-1 ring-amber-400 shadow-xs ${dimensionClasses} ${className}`}
      >
        {/* eslint-disable-next-js/no-img-element */}
        <img
          src={avatarUrl}
          alt={name ? `${name}-এর প্রোফাইল ছবি` : 'প্রোফাইল ছবি'}
          width={32}
          height={32}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  // 2. If user is logged in with a name but no image, show initials
  if (name && initials) {
    return (
      <div
        title={name}
        aria-label={name}
        className={`inline-flex items-center justify-center shrink-0 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-400/50 shadow-xs ${dimensionClasses} ${className}`}
      >
        <span className="leading-none text-[10px] font-semibold">{initials}</span>
      </div>
    );
  }

  // 3. Default fallback icon
  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 text-gray-300 group-hover:text-amber-300 transition-colors ${className}`}
    >
      <User className="w-5 h-5" />
    </div>
  );
};
