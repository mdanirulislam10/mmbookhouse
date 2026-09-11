'use client';

/**
 * Module 11 Task 4: Amazon-Style Multi-Purpose Address Form Modal
 * M.M Book House Malda - E-Commerce Platform
 * 
 * Implements architectural specifications from proposed_modules.md (Module 11, Items 1-7, 10-17, 27, 43, 47):
 * - 7 Mandatory Fields + Optional Secondary Phone
 * - Integrated GPS "📍 Use my current location" Button
 * - Sub-15ms Pincode Auto-fill with Sub-Post Office Dropdown
 * - 4 Address Category Tags: Home, Work, Hostel/Mess, Other
 * - Work weekend lock & Hostel/Mess gate instructions
 * - Delivery instruction preferences & Malda time slots
 * - Strict Zod validation with inline error feedback (CLS-free)
 * - Dual-mode: Add new address or Edit existing address
 */

import React, { useState, useEffect, useCallback, useId } from 'react';
import {
  X,
  Home,
  Briefcase,
  GraduationCap,
  MapPin,
  Clock,
  User,
  Phone,
  Building,
  Navigation,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  addressFormSchema,
  splitStreetAddress,
  type ValidatedAddressFormData,
} from '@/lib/validations/address';
import { lookupPostalPincode, isMaldaPincode } from '@/lib/services/pincodeService';
import { CurrentLocationButton } from '@/components/account/CurrentLocationButton';
import type {
  AddressFormData,
  AddressType,
  CustomerAddress,
  DeliveryTimeSlot,
  PostalLookupResult,
} from '@/types/address';
import type { DetectedLocationResult } from '@/hooks/useGeolocationAddress';

export interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AddressFormData) => Promise<void> | void;
  initialData?: Partial<CustomerAddress> | Partial<AddressFormData> | null;
  title?: string;
  isFirstAddress?: boolean;
}

export const AddressFormModal: React.FC<AddressFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  title,
  isFirstAddress = false,
}) => {
  const isEditing = Boolean(initialData && ('id' in initialData || initialData.recipient_name));
  const modalHeading = title || (isEditing ? 'ঠিকানা পরিবর্তন করুন (Edit Address)' : 'নতুন ডেলিভারি ঠিকানা যোগ করুন (Add Address)');
  const headingId = useId();

  // Form State
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [pincode, setPincode] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Malda');
  const [district, setDistrict] = useState('Malda');
  const [state, setState] = useState('West Bengal');
  const [addressType, setAddressType] = useState<AddressType>('home');
  const [isDefault, setIsDefault] = useState(isFirstAddress);

  // Delivery Preferences State
  const [callBeforeDelivery, setCallBeforeDelivery] = useState(true);
  const [leaveWithSecurity, setLeaveWithSecurity] = useState(false);
  const [doNotRingBell, setDoNotRingBell] = useState(false);
  const [isWeekendClosed, setIsWeekendClosed] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [preferredTimeSlot, setPreferredTimeSlot] = useState<DeliveryTimeSlot>('anytime');
  const [leaveWithNeighborEnabled, setLeaveWithNeighborEnabled] = useState(false);
  const [neighborName, setNeighborName] = useState('');
  const [neighborFlat, setNeighborFlat] = useState('');

  // UI Flow States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [availablePostOffices, setAvailablePostOffices] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreferences, setShowPreferences] = useState(false);

  // Populate data when modal opens or initialData changes
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setRecipientName(initialData.recipient_name || '');
      setRecipientPhone(initialData.recipient_phone || '');
      setAlternatePhone(initialData.alternate_phone || '');
      setPincode(initialData.pincode || '');

      let line1 = ('address_line1' in initialData && initialData.address_line1) || '';
      let line2 = ('address_line2' in initialData && initialData.address_line2) || '';

      if (!line1 && !line2 && 'street_address' in initialData && initialData.street_address) {
        const split = splitStreetAddress(initialData.street_address);
        line1 = split.address_line1;
        line2 = split.address_line2;
      }

      setAddressLine1(line1);
      setAddressLine2(line2);
      setLandmark(initialData.landmark || '');
      setCity(initialData.city || 'Malda');
      setDistrict(initialData.district || 'Malda');
      setState(initialData.state || 'West Bengal');
      setAddressType((initialData.address_type as AddressType) || 'home');
      setIsDefault(Boolean(initialData.is_default || isFirstAddress));

      // Delivery preferences
      const prefs = initialData.delivery_preferences;
      if (prefs) {
        setCallBeforeDelivery(prefs.callBeforeDelivery ?? true);
        setLeaveWithSecurity(Boolean(prefs.leaveWithSecurity));
        setDoNotRingBell(Boolean(prefs.doNotRingBell));
        setIsWeekendClosed(Boolean(prefs.isWeekendClosed));
        setSpecialInstructions(prefs.specialInstructions || '');
        setPreferredTimeSlot(prefs.preferredTimeSlot || 'anytime');
        if (prefs.leaveWithNeighbor?.enabled) {
          setLeaveWithNeighborEnabled(true);
          setNeighborName(prefs.leaveWithNeighbor.neighborName || '');
          setNeighborFlat(prefs.leaveWithNeighbor.neighborFlat || '');
        }
      }
    } else {
      // Reset to defaults
      setRecipientName('');
      setRecipientPhone('');
      setAlternatePhone('');
      setPincode('732101');
      setAddressLine1('');
      setAddressLine2('');
      setLandmark('');
      setCity('Malda');
      setDistrict('Malda');
      setState('West Bengal');
      setAddressType('home');
      setIsDefault(isFirstAddress);
      setCallBeforeDelivery(true);
      setLeaveWithSecurity(false);
      setDoNotRingBell(false);
      setIsWeekendClosed(false);
      setSpecialInstructions('');
      setPreferredTimeSlot('anytime');
      setLeaveWithNeighborEnabled(false);
      setNeighborName('');
      setNeighborFlat('');
      setAvailablePostOffices([]);
    }
    setErrors({});
  }, [isOpen, initialData, isFirstAddress]);

  // Handle Pincode Auto-fill (Task 2 integration)
  const handlePincodeLookup = useCallback(async (pinToSearch: string) => {
    const cleaned = pinToSearch.trim();
    if (!/^[1-9][0-9]{5}$/.test(cleaned)) {
      setAvailablePostOffices([]);
      return;
    }

    setPincodeLoading(true);
    try {
      const result: PostalLookupResult = await lookupPostalPincode(cleaned);
      if (result && result.city) {
        setCity(result.city);
        setDistrict(result.district || result.city);
        setState(result.state || 'West Bengal');
        setAvailablePostOffices(result.postOffices || []);

        // Clear pincode error if present
        setErrors((prev) => {
          const next = { ...prev };
          delete next.pincode;
          return next;
        });
      }
    } finally {
      setPincodeLoading(false);
    }
  }, []);

  // Handle GPS location detection (Task 3 integration)
  const handleLocationDetected = useCallback((location: DetectedLocationResult) => {
    if (location.pincode) {
      setPincode(location.pincode);
      setCity(location.city);
      setDistrict(location.district);
      setState(location.state);
      setAvailablePostOffices(location.postOffices);

      if (location.area && !addressLine2) {
        setAddressLine2(location.area);
      }
      if (location.landmark && !landmark) {
        setLandmark(location.landmark);
      }

      setErrors((prev) => {
        const next = { ...prev };
        delete next.pincode;
        delete next.city;
        delete next.state;
        return next;
      });
    }
  }, [addressLine2, landmark]);

  // Handle Sub-post office selection
  const handlePostOfficeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected) {
      // If address line 2 doesn't have it, append or set it
      if (!addressLine2.includes(selected)) {
        setAddressLine2((prev) => (prev ? `${prev}, ${selected}` : selected));
      }
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const formDataToValidate = {
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      alternate_phone: alternatePhone || undefined,
      pincode,
      address_line1: addressLine1,
      address_line2: addressLine2,
      landmark,
      city,
      district,
      state,
      address_type: addressType,
      is_default: isDefault,
      delivery_preferences: {
        callBeforeDelivery,
        leaveWithSecurity,
        doNotRingBell,
        isWeekendClosed: addressType === 'work' ? isWeekendClosed : false,
        specialInstructions: specialInstructions || undefined,
        preferredTimeSlot,
        leaveWithNeighbor: leaveWithNeighborEnabled
          ? {
              enabled: true,
              neighborName: neighborName || undefined,
              neighborFlat: neighborFlat || undefined,
            }
          : undefined,
      },
    };

    const parseResult = addressFormSchema.safeParse(formDataToValidate);

    if (!parseResult.success) {
      const fieldErrors: Record<string, string> = {};
      parseResult.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (path && !fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    const validated: ValidatedAddressFormData = parseResult.data;

    const finalAddressPayload: AddressFormData = {
      recipient_name: validated.recipient_name,
      recipient_phone: validated.recipient_phone,
      alternate_phone: validated.alternate_phone,
      address_line1: validated.address_line1,
      address_line2: validated.address_line2,
      landmark: validated.landmark,
      city: validated.city,
      district: validated.district,
      state: validated.state,
      pincode: validated.pincode,
      address_type: validated.address_type,
      is_default: validated.is_default,
      delivery_preferences: validated.delivery_preferences,
    };

    setIsSubmitting(true);
    try {
      await onSave(finalAddressPayload);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ঠিকানা সংরক্ষণে ব্যর্থ হয়েছে';
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCurrentMalda = isMaldaPincode(pincode);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50/70 via-white to-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h2 id={headingId} className="text-base sm:text-lg font-bold text-slate-800">
                {modalHeading}
              </h2>
              <p className="text-xs text-slate-500">
                নির্ভুল ডেলিভারির জন্য অনুগ্রহ করে সমস্ত ফিল্ড সঠিকভাবে পূরণ করুন
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4 flex-1">
          {/* Quick Location Action */}
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="text-xs text-amber-900">
              <span className="font-bold block sm:inline">দ্রুত পূরণ করুন:</span> বর্তমান ডিভাইস লোকেশন দিয়ে পিনকোড ও এলাকা অটো-ফিল করতে চান?
            </div>
            <CurrentLocationButton
              onLocationDetected={handleLocationDetected}
              variant="outline"
              className="w-full sm:w-auto text-xs py-1.5"
            />
          </div>

          {errors.form && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
              {errors.form}
            </div>
          )}

          {/* Section 1: Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Recipient Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                প্রাপকের নাম (Full Name) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="যেমন: সুবীর দাস"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    errors.recipient_name ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                  } focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all pl-9`}
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              <div className="min-h-[16px] mt-0.5">
                {errors.recipient_name && (
                  <p className="text-[11px] text-red-600">{errors.recipient_name}</p>
                )}
              </div>
            </div>

            {/* Recipient Primary Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                মোবাইল নম্বর (10-digit Mobile) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  autoComplete="tel"
                  maxLength={10}
                  placeholder="১০-ডিজিট নম্বর (যেমন: 9832145678)"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value.replace(/\D/g, ''))}
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    errors.recipient_phone ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                  } focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all pl-9`}
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              <div className="min-h-[16px] mt-0.5">
                {errors.recipient_phone && (
                  <p className="text-[11px] text-red-600">{errors.recipient_phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Alternate Phone & Pincode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Alternate Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                বিকল্প ফোন নম্বর (Alternate Mobile - ঐচ্ছিক)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="জরুরি যোগাযোগের জন্য বিকল্প নম্বর"
                  value={alternatePhone}
                  onChange={(e) => setAlternatePhone(e.target.value.replace(/\D/g, ''))}
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    errors.alternate_phone ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                  } focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all pl-9`}
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              <div className="min-h-[16px] mt-0.5">
                {errors.alternate_phone && (
                  <p className="text-[11px] text-red-600">{errors.alternate_phone}</p>
                )}
              </div>
            </div>

            {/* Pincode with Auto-fill */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                পিনকোড (6-Digit PIN Code) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  autoComplete="postal-code"
                  maxLength={6}
                  placeholder="যেমন: 732101"
                  value={pincode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setPincode(val);
                    if (val.length === 6) {
                      handlePincodeLookup(val);
                    }
                  }}
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    errors.pincode ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                  } focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all pl-9`}
                />
                <Navigation className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                {pincodeLoading && (
                  <Loader2 className="w-4 h-4 text-amber-600 absolute right-3 top-2.5 animate-spin" />
                )}
              </div>
              <div className="min-h-[16px] mt-0.5 flex items-center justify-between">
                {errors.pincode ? (
                  <p className="text-[11px] text-red-600">{errors.pincode}</p>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    {pincode.length === 6 && !pincodeLoading
                      ? `✓ ${city}, ${state}`
                      : '৬ সংখ্যা লিখলেই শহর ও রাজ্য স্বয়ংক্রিয়ভাবে পূরণ হবে'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sub-Post Office Dropdown (Item 3) */}
          {availablePostOffices.length > 0 && (
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                ডাকঘর / সাব-পোস্ট অফিস নির্বাচন করুন (Select Area / Post Office):
              </label>
              <select
                onChange={handlePostOfficeSelect}
                defaultValue=""
                className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white text-slate-700 outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="" disabled>
                  -- তালিকা থেকে আপনার সঠিক পোস্ট অফিস বেছে নিন --
                </option>
                {availablePostOffices.map((po) => (
                  <option key={po} value={po}>
                    {po}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Section 3: Address Lines */}
          <div className="space-y-3">
            {/* Address Line 1 */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ফ্ল্যাট, বাড়ি বা বিল্ডিং নম্বর (Flat / House No. / Building) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                autoComplete="address-line1"
                placeholder="যেমন: Flat 3B, আনন্দম অ্যাপার্টমেন্ট / বাড়ি নং ১২"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-lg border ${
                  errors.address_line1 ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                } focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all`}
              />
              <div className="min-h-[16px] mt-0.5">
                {errors.address_line1 && (
                  <p className="text-[11px] text-red-600">{errors.address_line1}</p>
                )}
              </div>
            </div>

            {/* Address Line 2 */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                রাস্তা, এলাকা বা গ্রামের নাম (Area / Colony / Street / Village) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                autoComplete="address-line2"
                placeholder="যেমন: রথবাড়ি মোড়, পুরাতন জেল রোড"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-lg border ${
                  errors.address_line2 ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                } focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all`}
              />
              <div className="min-h-[16px] mt-0.5">
                {errors.address_line2 && (
                  <p className="text-[11px] text-red-600">{errors.address_line2}</p>
                )}
              </div>
            </div>

            {/* Landmark (Prominent as per Item 4) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ল্যান্ডমার্ক / পরিচিত স্থান (Landmark) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="ডেলিভারি সহজ করতে পরিচিত স্থান লিখুন (যেমন: গৌড় কলেজ গেটের উল্টোদিকে)"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-lg border ${
                  errors.landmark ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                } focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all`}
              />
              <div className="min-h-[16px] mt-0.5">
                {errors.landmark ? (
                  <p className="text-[11px] text-red-600">{errors.landmark}</p>
                ) : (
                  <p className="text-[10px] text-slate-500">
                    মালদা ও গ্রামীণ এলাকায় সঠিক সময়ে পার্সেল পৌঁছানোর জন্য ল্যান্ডমার্ক অপরিহার্য।
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: City, District, State (Pre-filled from Pincode) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                শহর (Town / City) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                জেলা (District) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                রাজ্য (State) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Section 5: 4 Address Category Tags (Item 11) */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-800 mb-2">
              ঠিকানার ধরন নির্বাচন করুন (Address Type Tag):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setAddressType('home')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs transition-all ${
                  addressType === 'home'
                    ? 'border-amber-500 bg-amber-50/80 text-amber-900 font-bold shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Home className="w-4 h-4 mb-1 text-amber-600" />
                <span>Home (বাড়ি)</span>
                <span className="text-[10px] text-slate-400">সকাল ৭টা - রাত ৯টা</span>
              </button>

              <button
                type="button"
                onClick={() => setAddressType('work')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs transition-all ${
                  addressType === 'work'
                    ? 'border-amber-500 bg-amber-50/80 text-amber-900 font-bold shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Briefcase className="w-4 h-4 mb-1 text-amber-600" />
                <span>Work (অফিস)</span>
                <span className="text-[10px] text-slate-400">সকাল ১০টা - সন্ধ্যা ৬টা</span>
              </button>

              <button
                type="button"
                onClick={() => setAddressType('hostel')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs transition-all ${
                  addressType === 'hostel'
                    ? 'border-amber-500 bg-amber-50/80 text-amber-900 font-bold shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <GraduationCap className="w-4 h-4 mb-1 text-amber-600" />
                <span>Hostel / Mess</span>
                <span className="text-[10px] text-slate-400">মেস বা হোস্টেল</span>
              </button>

              <button
                type="button"
                onClick={() => setAddressType('other')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs transition-all ${
                  addressType === 'other'
                    ? 'border-amber-500 bg-amber-50/80 text-amber-900 font-bold shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building className="w-4 h-4 mb-1 text-amber-600" />
                <span>Other (অন্যান্য)</span>
                <span className="text-[10px] text-slate-400">উপহার / আত্মীয়</span>
              </button>
            </div>

            {/* Contextual Notice for Work (Item 14) */}
            {addressType === 'work' && (
              <div className="mt-2.5 p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chk-weekend-closed"
                  checked={isWeekendClosed}
                  onChange={(e) => setIsWeekendClosed(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="chk-weekend-closed" className="text-xs text-blue-900 cursor-pointer">
                  শনি ও রবিবার অফিস বন্ধ থাকে (উইকএন্ডে পার্সেল ডেলিভারি করবেন না)
                </label>
              </div>
            )}

            {/* Contextual Notice for Hostel/Mess (Item 12) */}
            {addressType === 'hostel' && (
              <div className="mt-2.5 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>মেস/হোস্টেল ডেলিভারি নোট:</strong> ডেলিভারি বয় রুমে না গিয়ে সরাসরি মেইন গেটে পৌঁছে আপনাকে কল করবে।
                </span>
              </div>
            )}
          </div>

          {/* Section 6: Delivery Preferences Accordion (Items 13-17) */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowPreferences(!showPreferences)}
              className="w-full flex items-center justify-between py-2 text-xs font-semibold text-slate-700 hover:text-amber-800 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>ডেলিভারি নির্দেশিকা ও বিশেষ সুবিধা (Delivery Preferences)</span>
              </div>
              {showPreferences ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showPreferences && (
              <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-fadeIn text-xs">
                {/* Checkbox instructions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={callBeforeDelivery}
                      onChange={(e) => setCallBeforeDelivery(e.target.checked)}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span>ডেলিভারির পূর্বে কল করুন (Call before delivery)</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={leaveWithSecurity}
                      onChange={(e) => setLeaveWithSecurity(e.target.checked)}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span>গেট সিকিউরিটি বা কেয়ারটেকারকে দিন</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={doNotRingBell}
                      onChange={(e) => setDoNotRingBell(e.target.checked)}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span>ডোরবেল বাজাবেন না</span>
                  </label>
                </div>

                {/* Local Malda Delivery Slot (Item 16) */}
                {isCurrentMalda && (
                  <div className="pt-2 border-t border-slate-200">
                    <label className="block font-semibold text-slate-700 mb-1">
                      মালদা শহরের জন্য ডেলিভারি সময়সূচি (Preferred Time Slot):
                    </label>
                    <select
                      value={preferredTimeSlot}
                      onChange={(e) => setPreferredTimeSlot(e.target.value as DeliveryTimeSlot)}
                      className="w-full px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-700 outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="anytime">যেকোনো সুবিধাজনক সময় (Anytime 9 AM - 8 PM)</option>
                      <option value="morning_10_to_1">সকাল ১০টা থেকে দুপুর ১টা (Morning Slot)</option>
                      <option value="evening_4_to_7">বিকেল ৪টা থেকে সন্ধ্যা ৭টা (Evening Slot)</option>
                    </select>
                  </div>
                )}

                {/* Leave with neighbor (Item 17) */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="flex items-center gap-2 text-slate-700 font-semibold cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      checked={leaveWithNeighborEnabled}
                      onChange={(e) => setLeaveWithNeighborEnabled(e.target.checked)}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span>বাড়িতে না থাকলে প্রতিবেশীর কাছে পার্সেল দিন (Leave with Neighbor)</span>
                  </label>
                  {leaveWithNeighborEnabled && (
                    <div className="grid grid-cols-2 gap-2 pl-6">
                      <input
                        type="text"
                        placeholder="প্রতিবেশীর নাম"
                        value={neighborName}
                        onChange={(e) => setNeighborName(e.target.value)}
                        className="px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs"
                      />
                      <input
                        type="text"
                        placeholder="ফ্ল্যাট / রুম নম্বর"
                        value={neighborFlat}
                        onChange={(e) => setNeighborFlat(e.target.value)}
                        className="px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs"
                      />
                    </div>
                  )}
                </div>

                {/* Additional instructions box (Item 15) */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="block font-semibold text-slate-700 mb-1">
                    অতিরিক্ত নির্দেশিকা (Additional Instructions):
                  </label>
                  <textarea
                    rows={2}
                    maxLength={300}
                    placeholder="গেট পাসওয়ার্ড, দিকনির্দেশ বা বিশেষ কোনো অনুরোধ থাকলে লিখুন..."
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="w-full px-3 py-1.5 rounded border border-slate-300 bg-white text-xs outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Default Address Checkbox (Items 22, 23) */}
          <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
            <input
              type="checkbox"
              id="chk-default-address"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="chk-default-address" className="text-xs font-semibold text-slate-700 cursor-pointer">
              এই ঠিকানাটিকে আমার প্রধান ডেলিভারি ঠিকানা হিসেবে নির্ধারণ করুন (Make this my default address)
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              বাতিল (Cancel)
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-slate-900 bg-amber-400 hover:bg-amber-500 rounded-lg shadow transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>সংরক্ষণ হচ্ছে...</span>
                </>
              ) : (
                <span>{isEditing ? 'পরিবর্তন সংরক্ষণ করুন' : 'ঠিকানা যোগ করুন (Save Address)'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
