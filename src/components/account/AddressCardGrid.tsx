'use client';

/**
 * Module 11 Task 6: Amazon-Style Address Card Grid Component
 * M.M Book House Malda - E-Commerce Platform
 * 
 * Implements architectural specifications from proposed_modules.md (Module 11, Items 21-28, 30):
 * - Dashed "+ Add Address" tile (Item 25)
 * - Default address green badge & auto-styling (Item 22)
 * - 3 Clear actions: Edit, Remove, Set as Default (Item 26)
 * - Max 15 addresses counter (Item 21)
 * - Integrated Add/Edit Modal (Item 27) & Delete Confirmation Modal (Item 28)
 * - Instant reactive state updates
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Home,
  Briefcase,
  GraduationCap,
  Building,
  MapPin,
  CheckCircle,
  Edit2,
  Trash2,
  Star,
  Phone,
  Clock,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  getCustomerAddresses,
  addCustomerAddress,
  updateCustomerAddress,
  setDefaultAddress,
  deleteCustomerAddress,
} from '@/actions/address';
import { AddressFormModal } from '@/components/account/AddressFormModal';
import { DeleteAddressConfirmModal } from '@/components/account/DeleteAddressConfirmModal';
import { type AddressFormData, type CustomerAddress, MAX_ADDRESSES_PER_USER } from '@/types/address';

interface AddressCardGridProps {
  initialAddresses?: CustomerAddress[];
  userId?: string;
  className?: string;
}

export const AddressCardGrid: React.FC<AddressCardGridProps> = ({
  initialAddresses = [],
  userId,
  className = '',
}) => {
  const [addresses, setAddresses] = useState<CustomerAddress[]>(initialAddresses);
  const [isLoading, setIsLoading] = useState(initialAddresses.length === 0);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingAddress, setDeletingAddress] = useState<CustomerAddress | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load addresses on mount
  const refreshAddresses = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getCustomerAddresses(userId);
      setAddresses(data);
    } catch {
      setStatusMessage({ text: 'ঠিকানা লোড করতে ব্যর্থ হয়েছে', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshAddresses();
  }, [refreshAddresses]);

  // Flash status message auto-dismiss
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Open Add Address Modal
  const handleOpenAddModal = () => {
    if (addresses.length >= MAX_ADDRESSES_PER_USER) {
      setStatusMessage({
        text: `আপনি সর্বোচ্চ ${MAX_ADDRESSES_PER_USER}টি ঠিকানা সংরক্ষণ করতে পারবেন।`,
        type: 'error',
      });
      return;
    }
    setEditingAddress(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Address Modal
  const handleOpenEditModal = (address: CustomerAddress) => {
    setEditingAddress(address);
    setIsFormModalOpen(true);
  };

  // Handle Save (Add or Update)
  const handleSaveAddress = async (formData: AddressFormData) => {
    if (editingAddress) {
      // Update
      const res = await updateCustomerAddress(editingAddress.id, formData, userId);
      if (res.success && res.data) {
        setStatusMessage({ text: 'ঠিকানা সফলভাবে হালনাগাদ করা হয়েছে', type: 'success' });
        await refreshAddresses();
      } else {
        throw new Error(res.error || 'আপডেট ব্যর্থ হয়েছে');
      }
    } else {
      // Add
      const res = await addCustomerAddress(formData, userId);
      if (res.success && res.data) {
        setStatusMessage({ text: 'নতুন ঠিকানা সফলভাবে যোগ করা হয়েছে', type: 'success' });
        await refreshAddresses();
      } else {
        throw new Error(res.error || 'ঠিকানা যোগ করতে ব্যর্থ হয়েছে');
      }
    }
  };

  // Handle 1-Click Set as Default Switch
  const handleSetDefault = async (addressId: string) => {
    setActiveActionId(addressId);
    try {
      const res = await setDefaultAddress(addressId, userId);
      if (res.success) {
        setStatusMessage({ text: 'প্রধান ডেলিভারি ঠিকানা পরিবর্তিত হয়েছে', type: 'success' });
        await refreshAddresses();
      } else {
        setStatusMessage({ text: res.error || 'ডিফল্ট পরিবর্তনে ব্যর্থ হয়েছে', type: 'error' });
      }
    } finally {
      setActiveActionId(null);
    }
  };

  // Open Delete Confirmation Modal
  const handleOpenDeleteModal = (address: CustomerAddress) => {
    setDeletingAddress(address);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async (addressId: string) => {
    setIsDeleting(true);
    try {
      const res = await deleteCustomerAddress(addressId, userId);
      if (res.success) {
        setStatusMessage({ text: 'ঠিকানা মুছে ফেলা হয়েছে', type: 'success' });
        setIsDeleteModalOpen(false);
        setDeletingAddress(null);
        await refreshAddresses();
      } else {
        setStatusMessage({ text: res.error || 'মুছে ফেলতে ব্যর্থ হয়েছে', type: 'error' });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Render Category Icon & Badge
  const renderCategoryBadge = (type: CustomerAddress['address_type']) => {
    switch (type) {
      case 'work':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
            <Briefcase className="w-3 h-3" />
            <span>Work (অফিস)</span>
          </span>
        );
      case 'hostel':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
            <GraduationCap className="w-3 h-3" />
            <span>Hostel / Mess</span>
          </span>
        );
      case 'other':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
            <Building className="w-3 h-3" />
            <span>Other</span>
          </span>
        );
      case 'home':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            <Home className="w-3 h-3" />
            <span>Home (বাড়ি)</span>
          </span>
        );
    }
  };

  const isLimitReached = addresses.length >= MAX_ADDRESSES_PER_USER;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          role="alert"
          className={`p-3 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-medium animate-fadeIn ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs text-slate-400 hover:text-slate-700 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header & Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <span>আপনার সংরক্ষিত ঠিকানা</span>
            <span className="text-sm font-normal text-slate-500">(Your Addresses)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            অনলাইন বই ডেলিভারি ও দ্রুত ১-ক্লিক চেকআউটের জন্য আপনার ডেলিভারি ঠিকানা পরিচালনা করুন
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border ${
              isLimitReached
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            সংরক্ষিত ঠিকানা: {addresses.length} / {MAX_ADDRESSES_PER_USER}
          </span>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          <div className="h-64 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300" />
          <div className="h-64 rounded-2xl bg-slate-100 border border-slate-200" />
          <div className="h-64 rounded-2xl bg-slate-100 border border-slate-200" />
        </div>
      ) : (
        /* Amazon Pattern Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Tile 1: Amazon-Style Dashed + Add Address Card (Item 25) */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            disabled={isLimitReached}
            className={`group rounded-2xl border-2 border-dashed p-6 min-h-[260px] flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              isLimitReached
                ? 'border-slate-300 bg-slate-50 opacity-60 cursor-not-allowed'
                : 'border-slate-300 hover:border-amber-500 bg-slate-50/50 hover:bg-amber-50/30 hover:shadow-md'
            }`}
            aria-label="Add a new delivery address"
          >
            <div className="w-14 h-14 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-500 group-hover:text-amber-600 group-hover:border-amber-400 group-hover:scale-110 transition-all mb-3">
              <Plus className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-700 transition-colors">
              নতুন ঠিকানা যোগ করুন
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Add a new delivery address
            </p>
            {isLimitReached && (
              <span className="mt-3 text-[11px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                সর্বোচ্চ ১৫টি ঠিকানার সীমা পূর্ণ
              </span>
            )}
          </button>

          {/* Saved Address Cards */}
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`relative bg-white rounded-2xl border transition-all duration-200 p-5 flex flex-col justify-between shadow-xs hover:shadow-md ${
                address.is_default
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-gradient-to-b from-emerald-50/20 via-white to-white'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Card Top: Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  {renderCategoryBadge(address.address_type)}

                  {address.is_default ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2.5 py-0.5 rounded-full shadow-xs">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Default (ডিফল্ট)</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(address.id)}
                      disabled={activeActionId === address.id}
                      className="text-[11px] font-semibold text-slate-500 hover:text-amber-700 flex items-center gap-1 hover:underline transition-colors"
                    >
                      {activeActionId === address.id ? (
                        <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                      ) : (
                        <Star className="w-3 h-3 text-slate-400" />
                      )}
                      <span>Set as default</span>
                    </button>
                  )}
                </div>

                {/* Recipient Full Name */}
                <h3 className="font-bold text-slate-900 text-base mb-1.5 flex items-center gap-1.5">
                  <span>{address.recipient_name}</span>
                </h3>

                {/* Address Lines */}
                <div className="text-xs text-slate-600 space-y-1 leading-relaxed">
                  <p className="font-medium text-slate-800">
                    {address.address_line1 || address.street_address}
                  </p>
                  {address.address_line2 && <p>{address.address_line2}</p>}

                  {address.landmark && (
                    <p className="text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-600 flex-shrink-0" />
                      <span>ল্যান্ডমার্ক: {address.landmark}</span>
                    </p>
                  )}

                  <p className="font-semibold text-slate-700">
                    {address.city}, {address.district !== address.city ? `${address.district}, ` : ''}{address.state} - {address.pincode}
                  </p>

                  {/* Phone Details */}
                  <div className="pt-2 border-t border-slate-100 flex flex-col gap-0.5 text-slate-600">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span>ফোন: <strong>{address.recipient_phone}</strong></span>
                    </span>
                    {address.alternate_phone && (
                      <span className="text-[11px] text-slate-500 pl-4">
                        বিকল্প ফোন: {address.alternate_phone}
                      </span>
                    )}
                  </div>

                  {/* Delivery Preferences Tag */}
                  {address.delivery_preferences && (
                    <div className="pt-2 mt-2 border-t border-slate-100 flex flex-wrap gap-1">
                      {address.delivery_preferences.callBeforeDelivery && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          কল করে ডেলিভারি
                        </span>
                      )}
                      {address.delivery_preferences.isWeekendClosed && (
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                          শনি-রবি বন্ধ
                        </span>
                      )}
                      {address.delivery_preferences.preferredTimeSlot &&
                        address.delivery_preferences.preferredTimeSlot !== 'anytime' && (
                          <span className="text-[10px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {address.delivery_preferences.preferredTimeSlot === 'morning_10_to_1'
                              ? 'সকাল ১০-১টা'
                              : 'বিকেল ৪-৭টা'}
                          </span>
                        )}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer: 3 Clear Actions (Item 26) */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(address)}
                    className="font-semibold text-amber-700 hover:text-amber-800 hover:underline flex items-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => handleOpenDeleteModal(address)}
                    className="font-semibold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                </div>

                {!address.is_default && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(address.id)}
                    disabled={activeActionId === address.id}
                    className="font-bold text-slate-700 hover:text-amber-700 text-xs hover:underline transition-colors"
                  >
                    Set as Default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Embedded Modals */}
      <AddressFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveAddress}
        initialData={editingAddress}
        isFirstAddress={addresses.length === 0}
      />

      <DeleteAddressConfirmModal
        isOpen={isDeleteModalOpen}
        address={deletingAddress}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirmDelete={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};
