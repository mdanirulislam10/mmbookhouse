'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, X, CheckCircle2, AlertCircle, Clock, Store, Navigation } from 'lucide-react';
import { lookupPincode, toEnglishDigits } from '@/hooks/useDeliveryLocation';
import { PincodeInfo, FulfillmentMode } from '@/types/header';
import { PickupToggle } from './PickupToggle';

interface PincodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPincode: string;
  onSelectPincode: (pincode: string) => void;
  fulfillmentMode: FulfillmentMode;
  onSelectFulfillmentMode: (mode: FulfillmentMode) => void;
}

const QUICK_PINCODES = [
  { code: '732101', name: 'মালদা সদর (ইংলিশ বাজার)' },
  { code: '732102', name: 'ওল্ড মালদা' },
  { code: '732124', name: 'চাঁচল (মালদা)' },
  { code: '732142', name: 'সামসি (মালদা)' },
  { code: '700073', name: 'কলেজ স্ট্রিট (কলকাতা)' },
  { code: '734001', name: 'শিলিগুড়ি' },
];

export const PincodeModal: React.FC<PincodeModalProps> = ({
  isOpen,
  onClose,
  currentPincode,
  onSelectPincode,
  fulfillmentMode,
  onSelectFulfillmentMode,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [previewInfo, setPreviewInfo] = useState<PincodeInfo | null>(null);
  const [activeMode, setActiveMode] = useState<FulfillmentMode>(fulfillmentMode);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (autoCloseTimeoutRef.current) {
        clearTimeout(autoCloseTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setInputCode(currentPincode || '');
      setError(null);
      setActiveMode(fulfillmentMode);
      const info = lookupPincode(currentPincode);
      setPreviewInfo(info);
      if (fulfillmentMode === 'delivery') {
        setTimeout(() => {
          inputRef.current?.focus();
          inputRef.current?.select();
        }, 100);
      }
    }
  }, [isOpen, currentPincode, fulfillmentMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (autoCloseTimeoutRef.current) clearTimeout(autoCloseTimeoutRef.current);
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (autoCloseTimeoutRef.current) {
      clearTimeout(autoCloseTimeoutRef.current);
      autoCloseTimeoutRef.current = null;
    }

    const normalized = toEnglishDigits(e.target.value);
    const val = normalized.replace(/\D/g, '').slice(0, 6);
    setInputCode(val);
    setError(null);

    if (val.length === 6) {
      const info = lookupPincode(val);
      if (info) {
        setPreviewInfo(info);
        // Task 49: 6-Digit complete auto-validation & auto-close after 650ms confirmation preview
        autoCloseTimeoutRef.current = setTimeout(() => {
          onSelectFulfillmentMode('delivery');
          onSelectPincode(val);
          onClose();
        }, 650);
      } else {
        setPreviewInfo(null);
        setError('দয়া করে সঠিক ৬ সংখ্যার পিনকোড দিন');
      }
    } else {
      setPreviewInfo(null);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (autoCloseTimeoutRef.current) {
      clearTimeout(autoCloseTimeoutRef.current);
      autoCloseTimeoutRef.current = null;
    }
    if (inputCode.length !== 6) {
      setError('পিনকোড অবশ্যই ৬ সংখ্যার হতে হবে');
      return;
    }
    const info = lookupPincode(inputCode);
    if (!info) {
      setError('পিনকোডটি সঠিক নয়');
      return;
    }
    onSelectFulfillmentMode('delivery');
    onSelectPincode(inputCode);
    onClose();
  };

  const handleQuickSelect = (code: string) => {
    setInputCode(code);
    onSelectFulfillmentMode('delivery');
    onSelectPincode(code);
    onClose();
  };

  const handleConfirmStorePickup = () => {
    onSelectFulfillmentMode('pickup');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pincode-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-200 text-gray-900 animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="bg-[#f0f2f2] px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-600" />
            <h3 id="pincode-modal-title" className="text-base font-bold text-gray-800">
              ডেলিভারি বা পিকআপ মোড বেছে নিন
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="p-1 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Task 9: Fulfillment Mode Toggle (Home Delivery vs Store Pickup) */}
          <PickupToggle
            mode={activeMode}
            onChange={(m) => {
              setActiveMode(m);
              if (m === 'pickup') {
                setError(null);
              }
            }}
          />

          {activeMode === 'pickup' ? (
            /* Store Pickup View (Task 9) */
            <div className="space-y-4 py-2 animate-in fade-in duration-150">
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <Store className="w-5 h-5 text-amber-700" />
                  <span>নেতাজি সুভাষ রোড কাউন্টার (মালদা শহর)</span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  ঠিকানা: এম.এম বুক হাউস, নেতাজি সুভাষ রোড (প্রধান পোস্ট অফিসের বিপরীতে), মালদা - ৭৩২১০১।
                </p>
                <div className="flex items-center gap-2 text-xs text-green-700 font-semibold pt-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>কোনো ডেলিভারি চার্জ নেই (১০০% ফ্রি ইনস্ট্যান্ট পিকআপ)</span>
                </div>
              </div>

              <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                <span>অর্ডার সম্পন্ন হওয়ার ২ ঘণ্টার মধ্যে কাউন্টার থেকে বই সংগ্রহ করা যাবে।</span>
              </div>

              <button
                type="button"
                onClick={handleConfirmStorePickup}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-gray-950 font-bold rounded shadow-sm transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Navigation className="w-4 h-4" />
                <span>কাউন্টার পিকআপ মোড সক্রিয় করুন</span>
              </button>
            </div>
          ) : (
            /* Home Delivery View with Pincode */
            <div className="space-y-4 animate-in fade-in duration-150">
              <p className="text-xs text-gray-600 leading-relaxed">
                বইয়ের দ্রুততম হোম ডেলিভারি, ক্যাশ অন ডেলিভারি (COD) এবং ডেলিভারি চার্জ যাচাই করতে আপনার পিনকোড দিন:
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      ref={inputRef}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={inputCode}
                      onChange={handleInputChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSubmit();
                        }
                      }}
                      placeholder="যেমন: 732101"
                      className={`w-full px-3 py-2 text-sm font-semibold tracking-wider rounded border transition-all outline-none ${
                        error
                          ? 'border-red-500 ring-2 ring-red-100'
                          : previewInfo
                          ? 'border-green-600 ring-2 ring-green-100'
                          : 'border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200'
                      }`}
                    />
                    {previewInfo && (
                      <div className="absolute right-2.5 top-2 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="hidden sm:inline-block text-[10px] bg-green-100 text-green-800 font-mono font-bold px-1.5 py-0.5 rounded border border-green-300">
                          Enter ↵
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm font-bold bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] text-gray-900 rounded border border-[#fcd200] shadow-sm transition-all cursor-pointer"
                  >
                    প্রয়োগ করুন
                  </button>
                </div>

                {error && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}

                {previewInfo && (
                  <div className="p-3 bg-amber-50/80 rounded border border-amber-200 text-xs space-y-1">
                    <div className="font-bold text-gray-900 flex items-center justify-between">
                      <span>📍 {previewInfo.area}</span>
                      <span className="text-green-700 font-semibold bg-green-100 px-2 py-0.5 rounded text-[10px]">
                        হোম ডেলিভারি উপলব্ধ
                      </span>
                    </div>
                    <div className="text-gray-600 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>সময়: <strong className="text-gray-800">{previewInfo.estimatedDeliveryText}</strong></span>
                    </div>
                    <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5 pt-1 border-t border-amber-200/60 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>এলাকা শনাক্ত হয়েছে — স্বয়ংক্রিয়ভাবে সেভ হচ্ছে... (বা Enter চাপুন)</span>
                    </div>
                  </div>
                )}
              </form>

              {/* Quick Select */}
              <div>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                  জনপ্রিয় এলাকা দ্রুত নির্বাচন করুন:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_PINCODES.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => handleQuickSelect(item.code)}
                      className={`text-left p-2 rounded border text-xs transition-all ${
                        inputCode === item.code
                          ? 'bg-amber-100/70 border-amber-500 text-amber-900 font-bold'
                          : 'border-gray-200 hover:border-amber-400 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="font-bold text-gray-900">{item.code}</div>
                      <div className="text-[11px] text-gray-500 truncate">{item.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
