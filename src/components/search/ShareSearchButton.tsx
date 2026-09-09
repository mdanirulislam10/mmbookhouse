'use client';

import React, { useState } from 'react';
import { Share2, Check, Copy, MessageCircle } from 'lucide-react';

interface ShareSearchButtonProps {
  isBengali?: boolean;
  className?: string;
}

/**
 * Task 33: 100% Reproducible URL Sharing (১০০% রিপ্রোডিউসিবল ইউআরএল শেয়ারিং)
 * Copies active filter state URL to clipboard & provides quick WhatsApp sharing.
 */
export const ShareSearchButton: React.FC<ShareSearchButtonProps> = ({
  isBengali = true,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const getShareUrl = (): string => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return '';
  };

  const handleCopyLink = async () => {
    const url = getShareUrl();
    if (!url) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleNativeShare = async () => {
    const url = getShareUrl();
    if (!url) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'M.M Book House Malda - বইয়ের তালিকা',
          text: 'এম.এম বুক হাউস মালদার অনলাইন ক্যাটালগ থেকে নির্বাচিত বইয়ের তালিকা দেখুন:',
          url,
        });
        return;
      } catch {
        // User cancelled or share failed, fallback to copy
      }
    }
    handleCopyLink();
  };

  const getWhatsAppShareUrl = (): string => {
    const url = getShareUrl();
    const text = isBengali
      ? `এম.এম বুক হাউস মালদা থেকে বইয়ের তালিকা দেখুন:\n${url}`
      : `Check out this book list from M.M Book House Malda:\n${url}`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div className="flex items-center gap-1">
        {/* Main Share Button */}
        <button
          type="button"
          onClick={handleNativeShare}
          title={isBengali ? 'এই ফিল্টার করা পেজ শেয়ার করুন' : 'Share this filtered search'}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-50/90 hover:bg-white text-gray-700 hover:text-gray-950 border border-gray-300 rounded-lg shadow-2xs hover:border-gray-400 transition-all cursor-pointer select-none"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
              <span className="text-emerald-700 font-bold">
                {isBengali ? 'কপি হয়েছে!' : 'Copied!'}
              </span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              <span>{isBengali ? 'শেয়ার করুন' : 'Share'}</span>
            </>
          )}
        </button>

        {/* WhatsApp Quick Share Button */}
        <a
          href={getWhatsAppShareUrl()}
          target="_blank"
          rel="noopener noreferrer"
          title={isBengali ? 'হোয়াটসঅ্যাপে বন্ধুদের শেয়ার করুন' : 'Share to WhatsApp'}
          className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg shadow-2xs transition-colors shrink-0 flex items-center justify-center"
        >
          <MessageCircle className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
