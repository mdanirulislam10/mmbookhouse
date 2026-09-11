'use client';

/**
 * Module 11 Task 6: Delete Address Confirmation Modal
 * M.M Book House Malda - E-Commerce Platform
 * 
 * Implements architectural specifications from proposed_modules.md (Module 11, Item 28):
 * - Accident-prevention confirmation dialog
 * - Clear warning when deleting default address
 * - Clean modal with Cancel and Delete Address buttons
 */

import React, { useEffect, useId } from 'react';
import { AlertTriangle, X, Loader2, Trash2 } from 'lucide-react';
import type { CustomerAddress } from '@/types/address';
import { formatAddressSingleLine } from '@/lib/validations/address';

interface DeleteAddressConfirmModalProps {
  isOpen: boolean;
  address: CustomerAddress | null;
  onClose: () => void;
  onConfirmDelete: (addressId: string) => Promise<void> | void;
  isDeleting?: boolean;
}

export const DeleteAddressConfirmModal: React.FC<DeleteAddressConfirmModalProps> = ({
  isOpen,
  address,
  onClose,
  onConfirmDelete,
  isDeleting = false,
}) => {
  const headingId = useId();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !address) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 id={headingId} className="text-base font-bold text-slate-900">
                ঠিকানা মুছে ফেলবেন? (Delete Address)
              </h3>
              <p className="text-xs text-slate-500">
                দুর্ঘটনা প্রতিরোধে অনুগ্রহ করে নিশ্চিত করুন
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Address Card Preview */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
          <div className="font-bold text-slate-800 flex items-center justify-between">
            <span>{address.recipient_name}</span>
            {address.is_default && (
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                Default Address
              </span>
            )}
          </div>
          <p className="text-slate-600">{formatAddressSingleLine(address)}</p>
          <p className="text-slate-500">ফোন: {address.recipient_phone}</p>
        </div>

        {/* Warning if Default Address */}
        {address.is_default && (
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
            <strong>সতর্কতা:</strong> এটি আপনার প্রধান (Default) ঠিকানা। এটি মুছে ফেললে আপনার অবশিষ্ট ঠিকানাগুলোর মধ্যে প্রথমটি স্বয়ংক্রিয়ভাবে নতুন প্রধান ঠিকানা হিসেবে নির্ধারিত হবে।
          </div>
        )}

        <p className="text-xs text-slate-600">
          আপনি কি নিশ্চিতভাবে এই ঠিকানাটি আপনার অ্যাকাউন্ট থেকে স্থায়ীভাবে মুছে ফেলতে চান?
        </p>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            বাতিল (Cancel)
          </button>
          <button
            type="button"
            onClick={() => onConfirmDelete(address.id)}
            disabled={isDeleting}
            className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>মুছে ফেলা হচ্ছে...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>ঠিকানা মুছুন (Delete)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
