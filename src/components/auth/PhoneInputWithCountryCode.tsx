'use client';

import React from 'react';
import { Phone, CheckCircle2 } from 'lucide-react';

interface PhoneInputWithCountryCodeProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  error?: string;
}

export const PhoneInputWithCountryCode: React.FC<PhoneInputWithCountryCodeProps> = ({
  value,
  onChange,
  disabled = false,
  autoFocus = false,
  error,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Normalize Bengali digits (০-৯) to standard English digits (0-9)
    const normalized = e.target.value.replace(/[০-৯]/g, (d) =>
      String.fromCharCode(d.charCodeAt(0) - 0x09e6 + 0x0030)
    );
    // Only allow numeric digits up to 10 chars
    const cleaned = normalized.replace(/\D/g, '').slice(0, 10);
    onChange(cleaned);
  };

  const isValid = value.length === 10 && /^[6-9]\d{9}$/.test(value);

  return (
    <div className="w-full">
      <label htmlFor="phone-input" className="block text-xs font-bold text-gray-700 mb-1.5">
        মোবাইল নম্বর (১০ ডিজিট) <span className="text-red-500">*</span>
      </label>
      <div className="relative flex items-center">
        {/* Locked Country Code with Indian Flag */}
        <div className="absolute left-2 flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 border border-gray-200 rounded-md text-gray-800 font-bold text-xs select-none pointer-events-none z-10 shadow-2xs">
          <span className="text-sm leading-none" role="img" aria-label="India Flag">🇮🇳</span>
          <span className="text-gray-900 font-mono font-bold">+91</span>
        </div>

        <input
          id="phone-input"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          pattern="[6-9][0-9]{9}"
          maxLength={10}
          required
          disabled={disabled}
          autoFocus={autoFocus}
          placeholder="যেমন: 9800123456"
          value={value}
          onChange={handleChange}
          className={`w-full pl-[84px] pr-10 py-3 text-sm font-semibold tracking-wider rounded-lg border transition-all ${
            error
              ? 'border-red-500 bg-red-50/20 focus:ring-2 focus:ring-red-400 focus:border-red-500 text-red-900'
              : isValid
              ? 'border-emerald-500 bg-emerald-50/10 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500 text-gray-950'
              : 'border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-950'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-75' : 'bg-white'}`}
        />

        {/* Valid Indicator */}
        {isValid && (
          <div className="absolute right-3 text-emerald-600 pointer-events-none" title="সঠিক ১০ ডিজিটের ভারতীয় নম্বর">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-red-600 mt-1 font-medium">{error}</p>
      ) : (
        <p className="text-[11px] text-gray-500 mt-1">
          পাসওয়ার্ড ছাড়াই আপনার নম্বরে ওটিপি (OTP) পাঠানো হবে।
        </p>
      )}
    </div>
  );
};
