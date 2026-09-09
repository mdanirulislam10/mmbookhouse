'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Phone, MessageSquare, Clock, MapPin, X, ExternalLink, Headset } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { getHeaderDictionary } from '@/lib/i18n/headerDictionary';

interface HelplineQuickContactProps {
  className?: string;
}

/**
 * Module 2 (Task 29 & Task 50): WhatsApp & Phone Helpline Quick Contact Popover
 *
 * Provides a dedicated emergency customer support and instant book ordering popover:
 * - 1-Click WhatsApp Assistance (https://wa.me/919733000000)
 * - 1-Click Direct Phone Call to Malda Store Counter (tel:+919800123456)
 * - Netaji Subhash Road Store Operating Hours (10:00 AM - 9:00 PM)
 * - WAI-ARIA modal dialog, Escape key dismissal, outside click detection
 */
export const HelplineQuickContact: React.FC<HelplineQuickContactProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { language } = useLanguage();
  const dict = getHeaderDictionary(language);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const whatsappMessage = encodeURIComponent(
    language === 'bn'
      ? 'নমস্কার M.M Book House, আমি একটি বইয়ের খোঁজ ও অর্ডার করতে চাই।'
      : 'Hello M.M Book House, I want to inquire about and order a book.'
  );
  const whatsappUrl = `https://wa.me/919733000000?text=${whatsappMessage}`;

  return (
    <div
      ref={containerRef}
      onBlur={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
          setIsOpen(false);
        }
      }}
      className={`relative inline-block ${className}`}
    >
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={dict.helpline.ariaLabel}
        className="amazon-nav-box group flex items-center gap-1.5 py-1 px-2 text-gray-200 hover:text-white transition-colors cursor-pointer select-none"
      >
        <div className="relative flex items-center justify-center text-amber-400">
          <Headset className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#131921]" />
        </div>

        <div className="hidden xl:flex flex-col text-left leading-none">
          <span className="text-[11px] text-gray-300 font-normal">
            {dict.helpline.title}
          </span>
          <span className="text-xs font-bold text-white flex items-center gap-0.5">
            24/7 Support
          </span>
        </div>
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          role="dialog"
          aria-label={dict.helpline.title}
          className="absolute right-0 top-full mt-1.5 w-80 sm:w-88 bg-[#1a232e] text-white rounded-md shadow-2xl border border-[#3b4754] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header Banner */}
          <div className="bg-[#232f3e] px-4 py-3 border-b border-[#3b4754] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Headset className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-white">{dict.helpline.title}</h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono">
                Live
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label={dict.helpline.close}
              className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Actions List */}
          <div className="p-3 space-y-2.5">
            {/* 1. WhatsApp Ordering Card */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 p-2.5 rounded bg-[#131921] hover:bg-[#0f141a] border border-[#2e3b4a] hover:border-emerald-500/50 transition-all cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-[#25D366]/20 flex items-center justify-center shrink-0 text-[#25D366] group-hover:scale-105 transition-transform">
                <MessageSquare className="w-5 h-5 fill-current" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white group-hover:text-emerald-400 transition-colors">
                    {dict.helpline.whatsappTitle}
                  </span>
                  <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-emerald-400" />
                </div>
                <p className="text-[11px] text-gray-300 mt-0.5 leading-snug">
                  {dict.helpline.whatsappDesc}
                </p>
                <span className="inline-block mt-1 text-[10px] text-emerald-400 font-bold">
                  +91 97330 00000 &bull; {dict.helpline.whatsappAction} &rarr;
                </span>
              </div>
            </a>

            {/* 2. Direct Phone Call Card */}
            <a
              href="tel:+919800123456"
              className="group flex items-start gap-3 p-2.5 rounded bg-[#131921] hover:bg-[#0f141a] border border-[#2e3b4a] hover:border-amber-400/50 transition-all cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-amber-400/20 flex items-center justify-center shrink-0 text-amber-400 group-hover:scale-105 transition-transform">
                <Phone className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors">
                    {dict.helpline.callTitle}
                  </span>
                  <Phone className="w-3 h-3 text-gray-400 group-hover:text-amber-300" />
                </div>
                <p className="text-[11px] text-gray-300 mt-0.5 leading-snug">
                  {dict.helpline.callDesc}
                </p>
                <span className="inline-block mt-1 text-[10px] text-amber-400 font-bold">
                  +91 98001 23456 &bull; {dict.helpline.callAction} &rarr;
                </span>
              </div>
            </a>
          </div>

          {/* Footer Info: Store Operating Hours & Address */}
          <div className="bg-[#131921] px-3.5 py-2.5 border-t border-[#2e3b4a] text-[11px] text-gray-300 space-y-1">
            <div className="flex items-center gap-1.5 text-gray-300">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{dict.helpline.storeTiming}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-400 text-[10px]">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>নেতাজি সুভাষ রোড, মালদা (পোস্ট অফিসের বিপরীতে)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
