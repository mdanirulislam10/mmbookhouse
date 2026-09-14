'use client';

/**
 * Module 16: Comprehensive Order Details & Action Cards
 * M.M Book House Malda - Live Order Tracking & Customer Dashboard
 * 
 * Implements architectural specifications from proposed_modules.md:
 * - Item 17: Ordered books list, itemized pricing, delivery address, #MMB-XXXX badge
 * - Item 18: Delivery rider handover callout with direct phone dialer
 * - Item 26: 1-Click WhatsApp customer support button with pre-filled context
 * - Item 28: 1-Click "Buy Again" (পুনরায় কিনুন) button
 * - Item 29: 1-Click Tax Invoice download / print button
 * - Item 37: Post-delivery "Rate & Review This Book" star rating prompt
 */

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Copy,
  Check,
  Phone,
  MessageCircle,
  FileText,
  RotateCcw,
  ShoppingBag,
  Star,
  MapPin,
  Store,
  ShieldCheck,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { LiveTrackingData, TrackingOrderItem } from '@/types/tracking';

interface OrderDetailCardProps {
  trackingData: LiveTrackingData;
  locale?: 'bn' | 'en';
  onCancelClick?: () => void;
  onReplacementClick?: () => void;
  onBuyAgainClick?: (items: TrackingOrderItem[]) => void;
}

export const OrderDetailCard: React.FC<OrderDetailCardProps> = ({
  trackingData,
  locale = 'bn',
  onCancelClick,
  onReplacementClick,
  onBuyAgainClick,
}) => {
  const [copied, setCopied] = useState(false);
  const isBn = locale === 'bn';

  const {
    orderId,
    orderNumber,
    status,
    items = [],
    deliveryAddress,
    isStorePickup,
    isCancellable,
    isReturnable,
    subtotal = 0,
    shippingFee = 0,
    discount = 0,
    grandTotal = 0,
    paymentMethod = 'cod',
    riderInfo,
    deliveredAt,
  } = trackingData;

  const handleCopyOrderNumber = () => {
    navigator.clipboard?.writeText(orderNumber || orderId || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // WhatsApp pre-filled support link (Item 26)
  const supportPhone = '919832145678';
  const waText = encodeURIComponent(
    `নমস্কার M.M Book House Malda, আমি আমার অর্ডার #${orderNumber || orderId} (স্ট্যাটাস: ${
      isBn ? trackingData.statusLabelBn : trackingData.statusLabelEn
    }) সম্পর্কে সাহায্য চাইছি।`
  );
  const waUrl = `https://wa.me/${supportPhone}?text=${waText}`;

  // Invoice URL (Item 29)
  const invoiceUrl = `/api/orders/${orderId}/invoice`;

  return (
    <div className="space-y-6">
      {/* 1. Header Card: Order ID Badge, Meta & Top CTAs */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold text-slate-900 sm:text-lg">
                #{orderNumber || orderId}
              </span>
              <button
                onClick={handleCopyOrderNumber}
                aria-label="Copy Order Number"
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </button>
              {copied && (
                <span className="text-[11px] font-medium text-emerald-600">
                  {isBn ? 'কপি হয়েছে!' : 'Copied!'}
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>
                {isBn ? 'পেমেন্ট পদ্ধতি:' : 'Payment:'}{' '}
                <span className="font-semibold uppercase text-slate-700">{paymentMethod}</span>
              </span>
              <span>•</span>
              <span>
                {isStorePickup
                  ? isBn
                    ? 'স্টোর পিকআপ (নেতাজি সুভাষ রোড)'
                    : 'Store Pickup (Netaji Subhash Rd)'
                  : isBn
                  ? 'হোম ডেলিভারি'
                  : 'Home Delivery'}
              </span>
            </div>
          </div>

          {/* Action Buttons: WhatsApp & Invoice */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition shadow-sm"
            >
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              <span>{isBn ? 'হোয়াটসঅ্যাপ সাপোর্ট' : 'WhatsApp Support'}</span>
            </a>

            <a
              href={invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              <FileText className="h-4 w-4 text-slate-600" />
              <span>{isBn ? 'ট্যাক্স ইনভয়েস' : 'Tax Invoice'}</span>
            </a>
          </div>
        </div>

        {/* 2. Delivery Rider Handover Callout (Item 18) */}
        {status === 'out_for_delivery' && riderInfo && (
          <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50/70 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white font-bold">
                  {riderInfo.name ? riderInfo.name[0] : 'R'}
                </div>
                <div>
                  <div className="text-xs font-medium text-indigo-700">
                    {isBn ? 'মালদা এক্সপ্রেস ডেলিভারি পার্টনার' : 'Malda Express Delivery Partner'}
                  </div>
                  <div className="font-bold text-slate-900">{riderInfo.name}</div>
                </div>
              </div>

              {riderInfo.phone && (
                <a
                  href={`tel:${riderInfo.phone}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition shadow"
                >
                  <Phone className="h-4 w-4" />
                  <span>{isBn ? 'রাইডারকে কল করুন' : 'Call Delivery Agent'}</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Ordered Books List (Item 17 & 28) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900">
            {isBn ? `অর্ডারকৃত বইসমূহ (${items.length}টি)` : `Ordered Items (${items.length})`}
          </h3>
          {onBuyAgainClick && items.length > 0 && (
            <button
              onClick={() => onBuyAgainClick(items)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>{isBn ? 'সবগুলো পুনরায় কিনুন' : 'Buy All Again'}</span>
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded border border-slate-200 bg-slate-50">
                  {item.thumbnail ? (
                    <Image
                      src={item.thumbnail}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xs text-slate-400">
                      বই
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm hover:text-indigo-600">
                    {isBn ? item.titleBn || item.title : item.title}
                  </h4>
                  {item.author && (
                    <p className="text-xs text-slate-500">
                      {isBn ? `লেখক: ${item.author}` : `By ${item.author}`}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isBn ? 'পরিমাণ:' : 'Qty:'} <span className="font-semibold text-slate-700">{item.quantity}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                <div className="font-bold text-slate-900 text-sm">
                  ₹{(item.price ?? item.unit_price ?? 0) * item.quantity}
                </div>
                {onBuyAgainClick && (
                  <button
                    onClick={() => onBuyAgainClick([item])}
                    className="inline-flex items-center gap-1 rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>{isBn ? 'পুনরায় কিনুন' : 'Buy Again'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 4. Post-Delivery Rate & Review Prompt (Item 37) */}
        {status === 'delivered' && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-center sm:text-left">
            <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
              <div>
                <span className="font-semibold text-amber-900 text-xs">
                  {isBn ? 'বইটি পড়া হয়েছে? আপনার মূল্যবান মতামত জানান' : 'Finished reading? Share your book review'}
                </span>
                <p className="text-[11px] text-amber-700">
                  {isBn
                    ? 'আপনার রিভিউ অন্য শিক্ষার্থীদের সঠিক বই বাছাই করতে সাহায্য করবে।'
                    : 'Your review helps other students in Malda choose the right books.'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    aria-label={`Rate ${star} Stars`}
                    className="text-amber-400 hover:scale-110 hover:text-amber-500 transition"
                  >
                    <Star className="h-4 w-4 fill-amber-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Delivery Address & Price Breakdown Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Delivery / Pickup Address */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            {isStorePickup ? <Store className="h-4 w-4 text-slate-600" /> : <MapPin className="h-4 w-4 text-slate-600" />}
            <span>{isStorePickup ? (isBn ? 'পিকআপের ঠিকানা' : 'Pickup Location') : (isBn ? 'ডেলিভারি ঠিকানা' : 'Delivery Address')}</span>
          </h3>

          {isStorePickup ? (
            <div className="mt-3 space-y-1 text-xs text-slate-600">
              <div className="font-semibold text-slate-900 text-sm">
                {isBn ? 'এম.এম বুক হাউস (প্রধান শাখা)' : 'M.M Book House (Main Branch)'}
              </div>
              <p>
                {isBn
                  ? 'নেতাজি সুভাষ রোড (বৃন্দাবনী মাঠের বিপরীতে), ইংরেজবাজার, মালদা - ৭৩২১০১'
                  : 'Netaji Subhash Road (Opp. Brindabani Ground), English Bazar, Malda - 732101'}
              </p>
              <p className="text-slate-500 pt-1">
                {isBn ? 'কাউন্টার সময়সূচী: সোম-শনি সকাল ১০:০০ - রাত ৮:৩০' : 'Counter Hours: Mon-Sat 10:00 AM - 8:30 PM'}
              </p>
            </div>
          ) : deliveryAddress ? (
            <div className="mt-3 space-y-1 text-xs text-slate-600">
              <div className="font-semibold text-slate-900 text-sm">{deliveryAddress.fullName}</div>
              <p>{deliveryAddress.addressLine1}</p>
              {deliveryAddress.addressLine2 && <p>{deliveryAddress.addressLine2}</p>}
              <p>
                {deliveryAddress.city}, {deliveryAddress.state} - {deliveryAddress.pincode}
              </p>
              <p className="font-medium text-slate-700 pt-1">
                {isBn ? 'ফোন:' : 'Phone:'} {deliveryAddress.phone}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-400">
              {isBn ? 'ঠিকানার তথ্য উপলব্ধ নেই' : 'No address information available'}
            </p>
          )}
        </div>

        {/* Itemized Price Summary */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3">
            {isBn ? 'মূল্য তালিকা ও বিলিং' : 'Price Summary'}
          </h3>
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>{isBn ? 'আইটেম মোট:' : 'Items Subtotal:'}</span>
              <span className="font-medium">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>{isBn ? 'ডেলিভারি চার্জ:' : 'Delivery Fee:'}</span>
              <span className="font-medium">
                {shippingFee === 0 ? (
                  <span className="font-bold text-emerald-600">{isBn ? 'বিনামূল্যে (₹০)' : 'FREE'}</span>
                ) : (
                  `₹${shippingFee}`
                )}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>{isBn ? 'ছাড়:' : 'Discount:'}</span>
                <span>-₹{discount}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-slate-900 text-sm">
              <span>{isBn ? 'সর্বমোট প্রদেয়:' : 'Grand Total:'}</span>
              <span>₹{grandTotal}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Contextual Customer Actions (Cancellation & 7-Day Replacement) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="font-semibold text-slate-900 text-xs">
              {isBn ? 'অর্ডার পরিচালনা ও সহায়তা' : 'Order Management & Help'}
            </h4>
            <p className="text-[11px] text-slate-500">
              {isCancellable
                ? isBn
                  ? 'প্যাকিং শুরু হওয়ার পূর্বেই কেবল অর্ডার বাতিল করা সম্ভব।'
                  : 'Order can be cancelled prior to packaging.'
                : isReturnable
                ? isBn
                  ? 'ডেলিভারির ৭ দিনের মধ্যে ত্রুটিপূর্ণ বইয়ের জন্য রিপ্লেসমেন্ট অনুরোধ করা যাবে।'
                  : 'Defective books can be replaced within 7 days of delivery.'
                : isBn
                ? 'আপনার অর্ডারে কোনো সমস্যা হলে আমাদের সাথে সরাসরি যোগাযোগ করুন।'
                : 'Need assistance? Reach out to our Malda support desk.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isCancellable && onCancelClick && (
              <button
                onClick={onCancelClick}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
              >
                <XCircle className="h-4 w-4 text-red-600" />
                <span>{isBn ? 'অর্ডার বাতিল করুন' : 'Cancel Order'}</span>
              </button>
            )}

            {isReturnable && onReplacementClick && (
              <button
                onClick={onReplacementClick}
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
              >
                <RotateCcw className="h-4 w-4 text-indigo-600" />
                <span>{isBn ? '৭-দিনের রিপ্লেসমেন্ট অনুরোধ' : 'Request Replacement'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
