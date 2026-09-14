'use client';

import React, { useState } from 'react';
import { Building2, CheckCircle2, AlertCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { GstBillingDetails } from '@/types/checkout';
import { sanitizeGstin, validateGstin } from '@/lib/validations/checkout';

export interface GstBillingFormProps {
  useGstInvoice: boolean;
  onToggleUseGst: (enabled: boolean) => void;
  gstDetails?: GstBillingDetails;
  onChangeGstDetails: (details: GstBillingDetails, isValid: boolean) => void;
  className?: string;
}

/**
 * Module 12 - Task 5: GST Institutional Billing Form (Item 27)
 * 
 * Features:
 * - Collapsible toggle for business/school/college institutional invoice.
 * - Auto-sanitized 15-character GSTIN input.
 * - Live State Code detection (e.g. Code 19 for West Bengal).
 * - Company Name & Registered Address fields.
 */
export const GstBillingForm: React.FC<GstBillingFormProps> = ({
  useGstInvoice,
  onToggleUseGst,
  gstDetails,
  onChangeGstDetails,
  className = '',
}) => {
  const { isBengali } = useLanguage();
  const [isOpen, setIsOpen] = useState<boolean>(useGstInvoice);
  const [companyName, setCompanyName] = useState<string>(gstDetails?.companyName || '');
  const [gstin, setGstin] = useState<string>(gstDetails?.gstin || '');
  const [address, setAddress] = useState<string>(gstDetails?.registeredAddress || '');
  const [gstinError, setGstinError] = useState<string | null>(null);
  const [stateNotice, setStateNotice] = useState<string | null>(null);

  const handleToggle = (checked: boolean) => {
    setIsOpen(checked);
    onToggleUseGst(checked);
    if (!checked) {
      setGstinError(null);
      setStateNotice(null);
    }
  };

  const handleGstinChange = (val: string) => {
    const clean = sanitizeGstin(val);
    setGstin(clean);

    if (clean.length === 15) {
      const result = validateGstin(clean);
      if (result.isValid) {
        setGstinError(null);
        setStateNotice(
          result.isWestBengal
            ? (isBengali ? 'পশ্চিমবঙ্গ (স্টেট কোড ১৯) শনাক্ত হয়েছে' : 'West Bengal (State Code 19) detected')
            : (isBengali ? `অন্যান্য রাজ্য (স্টেট কোড ${result.stateCode})` : `Other State (Code ${result.stateCode})`)
        );
        const newDetails: GstBillingDetails = {
          companyName,
          gstin: clean,
          registeredAddress: address,
          stateCode: result.stateCode,
        };
        onChangeGstDetails(newDetails, companyName.trim().length >= 2);
      } else {
        setGstinError(result.error || 'Invalid GSTIN');
        setStateNotice(null);
        onChangeGstDetails(
          { companyName, gstin: clean, registeredAddress: address },
          false
        );
      }
    } else {
      if (clean.length > 0) {
        setGstinError(isBengali ? 'জিএসটি নম্বর ১৫ অক্ষরের হতে হবে' : 'GSTIN must be 15 characters');
      } else {
        setGstinError(null);
      }
      setStateNotice(null);
      onChangeGstDetails(
        { companyName, gstin: clean, registeredAddress: address },
        false
      );
    }
  };

  const handleCompanyNameChange = (val: string) => {
    setCompanyName(val);
    const validGstin = validateGstin(gstin).isValid;
    onChangeGstDetails(
      { companyName: val, gstin, registeredAddress: address },
      val.trim().length >= 2 && validGstin
    );
  };

  const handleAddressChange = (val: string) => {
    setAddress(val);
    const validGstin = validateGstin(gstin).isValid;
    onChangeGstDetails(
      { companyName, gstin, registeredAddress: val },
      companyName.trim().length >= 2 && validGstin
    );
  };

  return (
    <div className={`border border-gray-200 rounded-xl bg-gray-50/50 p-4 transition-all ${className}`}>
      {/* Header Toggle */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={useGstInvoice}
            onChange={(e) => handleToggle(e.target.checked)}
            className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
          />
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-700 shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-gray-900">
              {isBengali ? 'প্রতিষ্ঠানের নামে জিএসটি (GST) ইনভয়েস প্রয়োজন?' : 'Use GST Invoice for Business/Institution'}
            </span>
          </div>
        </label>

        <button
          type="button"
          onClick={() => handleToggle(!useGstInvoice)}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Form Fields */}
      {useGstInvoice && (
        <div className="mt-4 pt-3 border-t border-gray-200/80 space-y-3">
          <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              {isBengali
                ? 'স্কুল, কলেজ, লাইব্রেরি বা কোচিং ইনস্টিটিউটের ট্যাক্স ইনপুট ক্রেডিট (ITC) পাওয়ার জন্য সঠিক তথ্য দিন।'
                : 'Enter your business GSTIN to claim Input Tax Credit (ITC) for school, college, or library.'}
            </span>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Company Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {isBengali ? 'প্রতিষ্ঠানের নাম (Company / Institute Name) *' : 'Company / Institute Name *'}
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => handleCompanyNameChange(e.target.value)}
                placeholder="e.g. Malda College Library"
                className="w-full text-xs sm:text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
              />
            </div>

            {/* GSTIN Input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {isBengali ? '১৫-সংখ্যার জিএসটি নম্বর (GSTIN) *' : '15-Digit GSTIN *'}
              </label>
              <input
                type="text"
                maxLength={15}
                value={gstin}
                onChange={(e) => handleGstinChange(e.target.value)}
                placeholder="19AAAAA0000A1Z5"
                className={`w-full text-xs sm:text-sm px-3 py-2 font-mono uppercase tracking-wider border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                  gstinError
                    ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-gray-300 focus:ring-emerald-500/20 focus:border-emerald-600'
                }`}
              />

              {stateNotice && (
                <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{stateNotice}</span>
                </p>
              )}

              {gstinError && (
                <p className="text-[11px] font-semibold text-red-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{gstinError}</span>
                </p>
              )}
            </div>
          </div>

          {/* Registered Address */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {isBengali ? 'জিএসটি নিবন্ধিত ঠিকানা (ঐচ্ছিক)' : 'Registered Address (Optional)'}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              placeholder="e.g. Rathbari, Malda, West Bengal - 732101"
              className="w-full text-xs sm:text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GstBillingForm;
