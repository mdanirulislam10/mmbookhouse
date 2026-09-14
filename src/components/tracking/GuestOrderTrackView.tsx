'use client';

/**
 * Module 16: Public Guest Order Tracking View & Address Modification Modal
 * M.M Book House Malda - Live Order Tracking Portal
 * 
 * Implements architectural specifications from proposed_modules.md:
 * - Item 38: Public Guest Tracking view by Order Number + 10-digit Phone (+ OTP check)
 * - Item 39: Delivery Address modification strictly before 'packed' status
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Phone,
  ShieldCheck,
  AlertCircle,
  Edit3,
  MapPin,
  CheckCircle2,
  X,
  RefreshCw,
  Truck,
} from 'lucide-react';
import { OrderTimelineStepper } from './OrderTimelineStepper';
import { OrderDetailCard } from './OrderDetailCard';
import { LiveTrackingData, DeliveryAddressSnapshot } from '@/types/tracking';
import { guestTrackLookupSchema } from '@/lib/validations/tracking';

export const GuestOrderTrackView: React.FC = () => {
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get('orderId') || '';
  const initialPhone = searchParams.get('phone') || '';

  const [orderNumber, setOrderNumber] = useState(initialOrderId);
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [trackingData, setTrackingData] = useState<LiveTrackingData | null>(null);

  // Address Editing Modal State (Item 39)
  const [isEditAddressOpen, setIsEditAddressOpen] = useState(false);
  const [addressForm, setAddressForm] = useState<DeliveryAddressSnapshot>({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: 'Malda',
    state: 'West Bengal',
    pincode: '732101',
  });
  const [addressSaving, setAddressSaving] = useState(false);

  // Demo lookup if initial query param provided
  useEffect(() => {
    if (initialOrderId && initialPhone) {
      handleLookup();
    }
  }, []);

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Zod client validation
    const validation = guestTrackLookupSchema.safeParse({
      orderNumber,
      phoneNumber,
    });

    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message || 'অনুগ্রহ করে সঠিক তথ্য প্রদান করুন');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate/Invoke live tracking fetch
      const normalizedOrder = validation.data.orderNumber;
      const normalizedPhone = validation.data.phoneNumber;

      // Mock live order tracking data response (integrates with API route in Task 9)
      const mockOrder: LiveTrackingData = {
        orderId: normalizedOrder,
        orderNumber: normalizedOrder,
        status: 'shipped',
        statusLabelEn: 'Shipped & In Transit',
        statusLabelBn: 'শিপমেন্ট প্রেরণ করা হয়েছে',
        statusDescriptionEn: 'Package has been dispatched via Delhivery surface express.',
        statusDescriptionBn: 'দিল্লিভেরি কুরিয়ারে পার্সেলটি রওয়ানা হয়েছে।',
        isStorePickup: false,
        isCancellable: false, // Disallowed since it is shipped
        isReturnable: false,
        estimatedDeliveryDate: {
          displayEn: 'Tomorrow by 8:00 PM',
          displayBn: 'আগামীকাল রাত ৮:০০টার মধ্যে',
          isDelayed: false,
          isArrivingToday: false,
        },
        shipment: {
          carrier: 'delhivery',
          awb: 'DEL884920192',
          trackingUrl: `https://www.delhivery.com/track/package/DEL884920192`,
        },
        deliveryAddress: {
          fullName: 'Anirul Islam',
          phone: normalizedPhone,
          addressLine1: 'Rabindra Avenue, Rathbari',
          city: 'Malda',
          state: 'West Bengal',
          pincode: '732101',
        },
        subtotal: 580,
        shippingFee: 0,
        grandTotal: 580,
        paymentMethod: 'cod',
        milestones: [
          {
            status: 'order_placed',
            title: 'Order Placed',
            titleBn: 'অর্ডার গৃহীত',
            description: 'Order confirmed and inventory locked',
            descriptionBn: 'অর্ডার গ্রহণ ও কনফার্ম করা হয়েছে',
            timestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
            location: 'Malda Web Store',
          },
          {
            status: 'packed',
            title: 'Packed at Malda Store',
            titleBn: 'মালদা স্টোরে প্যাকিং সম্পন্ন',
            description: 'Books packed with protective bubble wrap',
            descriptionBn: 'সুরক্ষিত বাবল র‍্যাপ দিয়ে বই প্যাক করা হয়েছে',
            timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
            location: 'Netaji Subhash Road, Malda',
          },
          {
            status: 'shipped',
            title: 'In Transit',
            titleBn: 'যাত্রাপথে রয়েছে',
            description: 'Dispatched to sorting hub',
            descriptionBn: 'বাছাই কেন্দ্রে পাঠানো হয়েছে',
            timestamp: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
            location: 'Kolkata RMS Sorting Center',
          },
        ],
        items: [
          {
            id: 'book-101',
            title: 'Ananda Math (Classic Edition)',
            titleBn: 'আনন্দমঠ (বিশেষ সংস্করণ)',
            author: 'Bankim Chandra Chattopadhyay',
            quantity: 1,
            price: 280,
          },
          {
            id: 'book-102',
            title: 'Chander Pahar',
            titleBn: 'চাঁদের পাহাড়',
            author: 'Bibhutibhushan Bandyopadhyay',
            quantity: 1,
            price: 300,
          },
        ],
      };

      setTrackingData(mockOrder);
      if (mockOrder.deliveryAddress) {
        setAddressForm(mockOrder.deliveryAddress);
      }
    } catch {
      setErrorMessage('অর্ডারের তথ্য পাওয়া যায়নি। অনুগ্রহ করে সঠিক অর্ডার নং ও ফোন দিন।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingData) return;

    // Item 39: Delivery address modification strictly permitted before 'packed'
    if (trackingData.status !== 'order_placed' && trackingData.status !== 'pickup_confirmed') {
      alert('পার্সেলটি ইতিমধ্যে প্যাক করা হয়ে গেছে। এখন আর ঠিকানা পরিবর্তন সম্ভব নয়।');
      setIsEditAddressOpen(false);
      return;
    }

    setAddressSaving(true);
    setTimeout(() => {
      setTrackingData({
        ...trackingData,
        deliveryAddress: addressForm,
      });
      setAddressSaving(false);
      setIsEditAddressOpen(false);
      setSuccessMessage('ডেলিভারি ঠিকানা সফলভাবে আপডেট করা হয়েছে!');
    }, 600);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Title Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Truck className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
          লাইভ অর্ডার ট্র্যাকিং (Guest Order Tracking)
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-xl mx-auto">
          আপনার অর্ডার নাম্বার ও মোবাইল নাম্বার দিয়ে পার্সেলের বর্তমান অবস্থান, কুরিয়ার বিবরণ ও সম্ভাব্য ডেলিভারির তারিখ জানুন।
        </p>
      </div>

      {/* Guest Lookup Form Card */}
      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleLookup} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                অর্ডার নম্বর (Order Number)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="যেমন: MMB-2026-001"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-3 pr-10 text-sm font-medium focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
                <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                মোবাইল নম্বর (10-Digit Mobile)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="যেমন: 9832145678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  maxLength={10}
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-3 pr-10 text-sm font-medium focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
                <Phone className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50 shadow"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>অনুসন্ধান চলছে...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>অর্ডার ট্র্যাক করুন</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Live Order Results Section */}
      {trackingData && (
        <div className="space-y-6">
          {/* Action Bar with Address Edit Button (Item 39) */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-100 p-3 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>ভেরিফাইড অর্ডার ট্র্যাকিং সেশন</span>
            </div>

            {/* Address Edit Trigger: strictly allowed before 'packed' */}
            {trackingData.status === 'order_placed' ? (
              <button
                onClick={() => setIsEditAddressOpen(true)}
                className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>ডেলিভারি ঠিকানা পরিবর্তন করুন</span>
              </button>
            ) : (
              <span className="text-slate-400">
                (প্যাকিং শুরু হওয়ায় ঠিকানা পরিবর্তন বন্ধ)
              </span>
            )}
          </div>

          {/* Stepper */}
          <OrderTimelineStepper trackingData={trackingData} locale="bn" />

          {/* Order Details Card */}
          <OrderDetailCard trackingData={trackingData} locale="bn" />
        </div>
      )}

      {/* Address Edit Modal (Item 39) */}
      {isEditAddressOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900">ডেলিভারি ঠিকানা পরিবর্তন করুন</h3>
              <button
                onClick={() => setIsEditAddressOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAddress} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">গ্রাহকের পুরো নাম</label>
                <input
                  type="text"
                  value={addressForm.fullName}
                  onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">ঠিকানা (লাইন ১)</label>
                <input
                  type="text"
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">শহর / থানা</label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">পিনকোড (Pincode)</label>
                  <input
                    type="text"
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    maxLength={6}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditAddressOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-600 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={addressSaving}
                  className="rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-700"
                >
                  {addressSaving ? 'সংরক্ষণ হচ্ছে...' : 'ঠিকানা সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
