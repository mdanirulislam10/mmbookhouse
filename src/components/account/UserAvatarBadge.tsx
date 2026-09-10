'use client';

import React, { useState } from 'react';
import {
  extractInitials,
  getAvatarGradientForName,
  AvatarGradient,
} from '@/lib/utils/avatarUtils';

export type AvatarBadgeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface UserAvatarBadgeProps {
  fullName?: string;
  avatarUrl?: string;
  size?: AvatarBadgeSize;
  customGradient?: AvatarGradient;
  showOnlinePulse?: boolean;
  className?: string;
}

const SIZE_CONFIGS: Record<
  AvatarBadgeSize,
  { containerClass: string; textClass: string; pulseClass: string }
> = {
  xs: { containerClass: 'w-6 h-6 rounded-md', textClass: 'text-[10px]', pulseClass: 'w-1.5 h-1.5' },
  sm: { containerClass: 'w-8 h-8 rounded-lg', textClass: 'text-xs', pulseClass: 'w-2 h-2' },
  md: { containerClass: 'w-10 h-10 rounded-xl', textClass: 'text-sm', pulseClass: 'w-2.5 h-2.5' },
  lg: { containerClass: 'w-16 h-16 rounded-2xl', textClass: 'text-xl', pulseClass: 'w-3 h-3' },
  xl: { containerClass: 'w-20 h-20 rounded-2xl', textClass: 'text-2xl', pulseClass: 'w-3.5 h-3.5' },
  '2xl': { containerClass: 'w-24 h-24 rounded-3xl', textClass: 'text-3xl', pulseClass: 'w-4 h-4' },
};

/**
 * Task 36: Stylish Initial Avatar Badge & Photo Renderer (Amazon Pattern)
 * Displays either custom uploaded photo or high-fidelity initial badge (e.g. "SK").
 */
export const UserAvatarBadge: React.FC<UserAvatarBadgeProps> = ({
  fullName = 'গ্রাহক',
  avatarUrl,
  size = 'md',
  customGradient,
  showOnlinePulse = false,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const initials = extractInitials(fullName);
  const palette = customGradient || getAvatarGradientForName(fullName);
  const sizeConfig = SIZE_CONFIGS[size];

  const hasValidPhoto = Boolean(avatarUrl && !imageError);

  return (
    <div className="relative inline-block select-none shrink-0">
      <div
        className={`flex items-center justify-center font-black tracking-wider shadow-sm overflow-hidden border ${
          hasValidPhoto
            ? 'bg-gray-100 border-gray-200'
            : `${palette.bgClass} ${palette.borderClass}`
        } ${sizeConfig.containerClass} ${className}`}
      >
        {hasValidPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={fullName}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className={`${sizeConfig.textClass} drop-shadow-xs font-mono font-black uppercase`}>
            {initials}
          </span>
        )}
      </div>

      {showOnlinePulse && (
        <span className="absolute bottom-0 right-0 flex items-center justify-center">
          <span className={`animate-ping absolute inline-flex rounded-full bg-emerald-400 opacity-75 ${sizeConfig.pulseClass}`} />
          <span className={`relative inline-flex rounded-full bg-emerald-500 ring-2 ring-white ${sizeConfig.pulseClass}`} />
        </span>
      )}
    </div>
  );
};
