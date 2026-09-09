'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { AppLanguage } from '@/types/header';
import { getHeaderDictionary } from '@/lib/i18n/headerDictionary';

interface LanguageSelectorProps {
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage } = useLanguage();
  const dict = getHeaderDictionary(language);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Smooth hover open/close with slight debounce
  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelectLanguage = (lang: AppLanguage) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onBlur={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
          setIsOpen(false);
        }
      }}
      className={`relative ${className}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={dict.language.ariaLabel(language)}
        aria-expanded={isOpen}
        className="amazon-nav-box flex items-center gap-1 text-xs font-bold text-gray-200 select-none focus:outline-none cursor-pointer"
      >
        <Globe className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="uppercase tracking-wider font-extrabold">{language}</span>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Flyout Card with Amazon Pointer */}
      {isOpen && (
        <div
          role="region"
          aria-label={dict.language.title}
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 bg-white rounded-md shadow-2xl border border-gray-200 text-gray-900 z-[95] overflow-hidden animate-in fade-in zoom-in-95 duration-150 select-none"
        >
          {/* Top Arrow Pointer */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-t border-l border-gray-200 rotate-45" />

          {/* Options Header */}
          <div className="bg-[#f0f2f2] px-3 py-2 border-b border-gray-200">
            <span className="text-[11px] font-bold text-gray-700">
              {dict.language.title}
            </span>
          </div>

          {/* Language Options */}
          <div className="p-2 space-y-1 text-xs">
            {/* Bengali */}
            <button
              type="button"
              onClick={() => handleSelectLanguage('bn')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded transition-colors cursor-pointer ${
                language === 'bn'
                  ? 'bg-amber-100/70 text-amber-950 font-bold'
                  : 'hover:bg-gray-100 text-gray-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-gray-950 font-serif font-black text-xs flex items-center justify-center shadow-xs">
                  অ
                </span>
                <span>{dict.language.bnOption}</span>
              </div>
              {language === 'bn' && <Check className="w-3.5 h-3.5 text-amber-700" />}
            </button>

            {/* English */}
            <button
              type="button"
              onClick={() => handleSelectLanguage('en')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded transition-colors cursor-pointer ${
                language === 'en'
                  ? 'bg-amber-100/70 text-amber-950 font-bold'
                  : 'hover:bg-gray-100 text-gray-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-sans font-bold text-[10px] flex items-center justify-center shadow-xs">
                  EN
                </span>
                <span>{dict.language.enOption}</span>
              </div>
              {language === 'en' && <Check className="w-3.5 h-3.5 text-amber-700" />}
            </button>
          </div>

          <div className="bg-gray-50 px-3 py-1.5 border-t border-gray-100 text-[10px] text-gray-500 text-center">
            {dict.language.savedNotice}
          </div>
        </div>
      )}
    </div>
  );
};
