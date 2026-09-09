'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, GraduationCap, CheckCircle2, Send, Building2 } from 'lucide-react';
import { BulkQuoteRequest } from '@/types/header';

interface BulkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BulkOrderModal: React.FC<BulkOrderModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<BulkQuoteRequest>({
    institutionName: '',
    contactPerson: '',
    phone: '',
    category: 'school-madhyamik-hs',
    estimatedCopies: 50,
    notes: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input and handle ESC key
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData((prev) => ({ ...prev, phone: cleaned }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const quoteRecord = {
      ...formData,
      id: `quote-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    // 1. Persist to localStorage
    try {
      const existing = localStorage.getItem('mm_bulk_order_quotes');
      const quotes = existing ? JSON.parse(existing) : [];
      quotes.unshift(quoteRecord);
      localStorage.setItem('mm_bulk_order_quotes', JSON.stringify(quotes));
    } catch (err) {
      console.warn('Could not save bulk quote to localStorage:', err);
    }

    // 2. POST to API route
    try {
      await fetch('/api/bulk-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    } catch (err) {
      console.warn('Failed to post bulk order to API:', err);
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-order-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 text-gray-900 animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-[#131921] px-6 py-4 text-white flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-amber-400" />
            <div>
              <h3 id="bulk-order-title" className="text-base font-bold">
                প্রতিষ্ঠান ও কোচিং বাল্ক বুকিং (B2B)
              </h3>
              <span className="text-[11px] text-gray-300">
                M.M Book House Malda &bull; স্পেশাল প্রাতিষ্ঠানিক ছাড়
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (Selectable text so phone and helpline can be copied) */}
        <div className="p-6">
          {isSubmitted ? (
            <div className="py-8 text-center space-y-4 animate-in fade-in duration-200">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">
                কোটেশন অনুরোধ সফলভাবে জমা হয়েছে!
              </h4>
              <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
                ধন্যবাদ, <strong>{formData.institutionName || 'আপনার প্রতিষ্ঠান'}</strong>। আমাদের বাল্ক সেলস টিম ২ ঘণ্টার মধ্যে আপনার নম্বরে (<span className="font-mono font-bold">{formData.phone}</span>) স্পেশাল ডিসকাউন্ট রেট ও জিএসটি ইনভয়েস কোটেশন পাঠাবে।
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold rounded text-xs shadow-sm transition-all"
              >
                ঠিক আছে
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-gray-600 leading-relaxed">
                মালদা জেলা ও সমগ্র উত্তরবঙ্গের স্কুল, মাদ্রাসা, কলেজ লাইব্রেরি ও কোচিং সেন্টারের জন্য এককালীন ২০ থেকে ৫০০+ কপি বইয়ের জন্য বিশেষ কোটেশন পান:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Institution Name (with autoFocus) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">
                    প্রতিষ্ঠান / কোচিং সেন্টারের নাম *
                  </label>
                  <input
                    ref={inputRef}
                    autoFocus
                    type="text"
                    required
                    placeholder="যেমন: মালদা জিলা স্কুল / উইনার্স একাডেমি"
                    value={formData.institutionName}
                    onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded border border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                  />
                </div>

                {/* Contact Person */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">
                    যোগাযোগের ব্যক্তির নাম *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: প্রধান শিক্ষক / পরিচালক"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded border border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Phone (Sanitized 10-digit mobile) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">
                    মোবাইল নম্বর (১০ ডিজিট) *
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    required
                    pattern="[0-9]{10}"
                    maxLength={10}
                    placeholder="যেমন: 9800123456"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    className="w-full px-3 py-2 text-xs rounded border border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none font-mono"
                  />
                </div>

                {/* Estimated Copies */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">
                    আনুমানিক বইয়ের সংখ্যা *
                  </label>
                  <select
                    value={formData.estimatedCopies}
                    onChange={(e) => setFormData({ ...formData, estimatedCopies: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded border border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none bg-white"
                  >
                    <option value={25}>২৫ - ৫০ কপি (প্রাথমিক বাল্ক)</option>
                    <option value={100}>১০০ - ২০০ কপি (কোচিং ব্যাচ)</option>
                    <option value={300}>৩০০ - ৫০০ কপি (স্কুল/কলেজ লাইব্রেরি)</option>
                    <option value={500}>৫০০+ কপি (মেগা প্রাতিষ্ঠানিক অর্ডার)</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">
                  বইয়ের বিষয় বা নির্দিষ্ট তালিকার বিবরণ
                </label>
                <textarea
                  rows={3}
                  placeholder="যেমন: মাধ্যমিক টেস্ট পেপার ২০ কপি ও উচ্চমাধ্যমিক সহায়ক বই ৩০ কপি প্রয়োজন..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded border border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] disabled:opacity-60 text-gray-900 font-bold rounded border border-[#fcd200] shadow-sm transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
                >
                  <Send className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-pulse' : ''}`} />
                  <span>{isSubmitting ? 'কোটেশন জমা হচ্ছে...' : 'কোটেশন রিকোয়েস্ট পাঠান (Request-a-Quote)'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer (Selectable phone number) */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-500">
          <span className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-amber-600" />
            <span>সরাসরি অফিসিয়াল জিএসটি ইনভয়েস সহ ডেলিভারি</span>
          </span>
          <span className="font-semibold text-gray-700 select-text cursor-text">
            📞 হেল্পলাইন: +91 97330 00000
          </span>
        </div>
      </div>
    </div>
  );
};
