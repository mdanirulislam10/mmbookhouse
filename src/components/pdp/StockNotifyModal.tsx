'use client';

import React, { useState, useEffect } from 'react';
import { Bell, MessageSquare, CheckCircle2, X, AlertCircle, Phone, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { DetailedBookProduct, StockNotificationRequest } from '@/types/pdp';
import { BookProduct } from '@/types/catalog-filter';

interface StockNotifyModalProps {
  book: DetailedBookProduct | BookProduct;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data: StockNotificationRequest) => void;
}

const STORAGE_KEY = 'mm_stock_notifications';

export const StockNotifyModal: React.FC<StockNotifyModalProps> = ({
  book,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { isBengali } = useLanguage();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappConsent, setWhatsappConsent] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setErrorMessage('');
      // Pre-fill phone from last used if available
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const list: StockNotificationRequest[] = JSON.parse(stored);
          if (list.length > 0) {
            setPhoneNumber(list[list.length - 1].phoneNumber);
          }
        }
      } catch {
        // ignore
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validatePhone = (num: string): boolean => {
    const clean = num.replace(/\D/g, '');
    return clean.length === 10 && /^[6-9]/.test(clean);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = phoneNumber.replace(/\D/g, '');

    if (!validatePhone(cleanNumber)) {
      setErrorMessage(
        isBengali
          ? 'অনুগ্রহ করে সঠিক ১০-ডিজিটের ভারতীয় মোবাইল নম্বর দিন (যেমন: 98321XXXXX)'
          : 'Please enter a valid 10-digit Indian phone number starting with 6, 7, 8, or 9'
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const notificationItem: StockNotificationRequest = {
      bookId: book.bookId || book.id,
      bookTitle: isBengali ? book.titleBn || book.title : book.title,
      phoneNumber: cleanNumber,
      whatsappConsent,
      requestedAt: new Date().toISOString(),
    };

    // Save to localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const list: StockNotificationRequest[] = stored ? JSON.parse(stored) : [];
      const updated = [...list.filter((i) => i.bookId !== notificationItem.bookId), notificationItem];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Could not save stock notification to localStorage', err);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      if (onSuccess) {
        onSuccess(notificationItem);
      }
    }, 450);
  };

  // Direct WhatsApp contact URL
  const bookTitleForUrl = encodeURIComponent(book.titleBn || book.title);
  const waDirectMessage = encodeURIComponent(
    `নমস্কার এম.এম বুক হাউস মালদা, আমি এই বইটি কিনতে আগ্রহী কিন্তু স্টকে শেষ দেখাচ্ছে:\n📚 ${book.titleBn || book.title} (লেখক: ${book.author})\nদয়া করে বইটি স্টকে এলে আমাকে জানাবেন।`
  );
  const waDirectUrl = `https://wa.me/919733000000?text=${waDirectMessage}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {isBengali ? 'স্টক এলে জানানোর অনুরোধ' : 'Notify Me When Available'}
              </h3>
              <p className="text-xs text-emerald-100">
                {isBengali ? 'হোয়াটসঅ্যাপে সরাসরি অ্যালার্ট পান' : 'Get restock alerts on WhatsApp'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5">
          {/* Book Snapshot Strip */}
          <div className="flex items-center gap-3 p-2.5 bg-neutral-50 rounded-xl border border-neutral-200/80 mb-4">
            {book.coverImage ? (
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-12 h-16 object-cover rounded shadow-xs shrink-0"
              />
            ) : (
              <div className="w-12 h-16 bg-neutral-200 rounded flex items-center justify-center text-neutral-400 text-xs shrink-0">
                Book
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-rose-100 text-rose-800 rounded mb-1">
                {isBengali ? 'স্টক সাময়িক শেষ' : 'Temporarily Out of Stock'}
              </span>
              <h4 className="text-xs sm:text-sm font-semibold text-neutral-900 line-clamp-1">
                {isBengali ? book.titleBn || book.title : book.title}
              </h4>
              <p className="text-xs text-neutral-500 truncate">{book.author}</p>
            </div>
          </div>

          {/* Form or Success message */}
          {isSuccess ? (
            <div className="py-4 text-center">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-neutral-900 mb-1">
                {isBengali ? 'অনুরোধ গৃহীত হয়েছে!' : 'Notification Registered!'}
              </h4>
              <p className="text-xs sm:text-sm text-neutral-600 mb-4 px-2">
                {isBengali
                  ? `বইটি মালদা দোকানে পৌঁছানো মাত্র +91 ${phoneNumber}-এ হোয়াটসঅ্যাপ বার্তা পাঠানো হবে।`
                  : `We will notify +91 ${phoneNumber} via WhatsApp as soon as copies arrive at our Malda shop.`}
              </p>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors"
              >
                {isBengali ? 'ঠিক আছে' : 'Done'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="phone-input"
                  className="block text-xs font-semibold text-neutral-800 mb-1"
                >
                  {isBengali ? 'আপনার মোবাইল নম্বর (১০ সংখ্যা):' : 'Your Mobile Number:'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-bold text-neutral-500">
                    +91
                  </div>
                  <input
                    id="phone-input"
                    type="tel"
                    maxLength={10}
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value.replace(/\D/g, ''));
                      setErrorMessage('');
                    }}
                    placeholder="9832100000"
                    className="w-full pl-12 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    required
                  />
                </div>
                {errorMessage && (
                  <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMessage}</span>
                  </p>
                )}
              </div>

              {/* WhatsApp Consent Checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={whatsappConsent}
                  onChange={(e) => setWhatsappConsent(e.target.checked)}
                  className="mt-0.5 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs text-neutral-600 leading-snug">
                  {isBengali
                    ? 'হ্যাঁ, বইটি স্টকে এলে আমাকে সরাসরি হোয়াটসঅ্যাপে মেসেজ পাঠিয়ে অবহিত করুন।'
                    : 'Yes, message me directly on WhatsApp when stock is replenished.'}
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60 text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
              >
                <Bell className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? isBengali
                      ? 'সংরক্ষণ করা হচ্ছে...'
                      : 'Saving...'
                    : isBengali
                      ? 'স্টক অ্যালার্ট সেট করুন'
                      : 'Notify Me on WhatsApp'}
                </span>
              </button>

              {/* Direct WhatsApp Callout */}
              <div className="pt-2 text-center border-t border-neutral-100">
                <p className="text-[11px] text-neutral-500 mb-1.5">
                  {isBengali
                    ? 'জরুরি প্রাক-অর্ডার বা সরাসরি বুকিংয়ের জন্য:'
                    : 'Need it urgently for upcoming exam?'}
                </p>
                <a
                  href={waDirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>
                    {isBengali
                      ? 'দোকানের হোয়াটসঅ্যাপে সরাসরি কথা বলুন'
                      : 'Chat directly with shop manager'}
                  </span>
                  <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockNotifyModal;
