'use client';

import React, { useState } from 'react';
import { Share2, Copy, Check, MessageCircle } from 'lucide-react';
import { DetailedBookProduct } from '@/types/pdp';
import { useLanguage } from '@/hooks/useLanguage';
import { formatINR } from '@/lib/utils/currency';

interface SocialShareWidgetProps {
  book: DetailedBookProduct;
  className?: string;
}

export const SocialShareWidget: React.FC<SocialShareWidgetProps> = ({
  book,
  className = '',
}) => {
  const { isBengali, language } = useLanguage();
  const [copied, setCopied] = useState(false);

  const shareTitle = isBengali ? book.titleBn : book.title;
  const priceText = formatINR(book.price, language);
  const shareText = `📚 *${shareTitle}* (${book.author})\n🔥 অফার মূল্য: ${priceText} (${book.discount} ছাড়)\n📍 এম.এম বুক হাউস মালদা থেকে সংগ্রহ করুন:\n`;

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleWhatsAppShare = () => {
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.href;
      const fullMsg = encodeURIComponent(`${shareText}${currentUrl}`);
      window.open(`https://api.whatsapp.com/send?text=${fullMsg}`, '_blank');
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs font-semibold text-gray-500 hidden sm:inline">
        {isBengali ? 'বন্ধুদের সাথে শেয়ার করুন:' : 'Share:'}
      </span>

      {/* WhatsApp 1-Tap Button */}
      <button
        type="button"
        onClick={handleWhatsAppShare}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] font-bold text-xs border border-[#25D366]/30 transition-colors cursor-pointer shadow-2xs"
        title="হোয়াটসঅ্যাপে শেয়ার করুন"
      >
        <MessageCircle className="w-3.5 h-3.5 fill-current" />
        <span>WhatsApp</span>
      </button>

      {/* Copy Link Button */}
      <button
        type="button"
        onClick={handleCopyLink}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
        title="লিঙ্ক কপি করুন"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
            <span className="text-emerald-700 font-bold">
              {isBengali ? 'কপি হয়েছে' : 'Copied'}
            </span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5 text-gray-500" />
            <span>{isBengali ? 'কপি লিঙ্ক' : 'Copy'}</span>
          </>
        )}
      </button>
    </div>
  );
};
