'use client';

/**
 * Module 16: Amazon-Style Visual Timeline Stepper Component
 * M.M Book House Malda - Live Order Tracking
 * 
 * Implements architectural specifications from proposed_modules.md:
 * - Item 21: Modern responsive timeline stepper (Horizontal on desktop, Vertical on mobile)
 * - Item 22: 5 Linear primary progress milestones (Placed, Packed, Shipped, OFD, Delivered)
 * - Item 23: Pulsating active milestone with color-coded completed checks
 * - Item 24: High-visibility exception & delay alert badges
 * - Item 25: Expandable transit hub milestones accordion ("See all updates ▾")
 * - Item 27: Zero Cumulative Layout Shift (CLS) skeleton loading placeholder
 * - Item 40: Store pickup Click & Collect 3-stage visual timeline
 */

import React, { useState } from 'react';
import {
  Check,
  Package,
  Truck,
  MapPin,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Store,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';
import { LiveTrackingData, TrackingMilestone } from '@/types/tracking';
import { getPrimaryPhaseProgress } from '@/lib/services/trackingStateMachine';

interface OrderTimelineStepperProps {
  trackingData: LiveTrackingData;
  locale?: 'bn' | 'en';
}

const PRIMARY_STEPS = [
  { id: 'order_placed', titleEn: 'Order Placed', titleBn: 'অর্ডার গৃহীত', icon: Package },
  { id: 'packed', titleEn: 'Packed & Ready', titleBn: 'প্যাকিং সম্পন্ন', icon: Package },
  { id: 'shipped', titleEn: 'Shipped & In Transit', titleBn: 'শিপমেন্ট প্রেরিত', icon: Truck },
  { id: 'out_for_delivery', titleEn: 'Out for Delivery', titleBn: 'ডেলিভারির পথে', icon: MapPin },
  { id: 'delivered', titleEn: 'Delivered', titleBn: 'ডেলিভারি সম্পন্ন', icon: Check },
];

const STORE_PICKUP_STEPS = [
  { id: 'pickup_confirmed', titleEn: 'Order Confirmed', titleBn: 'অর্ডার নিশ্চিত', icon: Package },
  { id: 'pickup_ready', titleEn: 'Ready at Store', titleBn: 'কাউন্টারে প্রস্তুত', icon: Store },
  { id: 'pickup_completed', titleEn: 'Picked Up', titleBn: 'সংগ্রহ সম্পন্ন', icon: Check },
];

export const OrderTimelineStepper: React.FC<OrderTimelineStepperProps> = ({
  trackingData,
  locale = 'bn',
}) => {
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const isBn = locale === 'bn';

  const {
    status = 'order_placed',
    shipment,
    milestones = [],
    isStorePickup = false,
    estimatedDeliveryDate,
    deliveryOtp,
  } = trackingData;
  const progressInfo = getPrimaryPhaseProgress(status);

  const steps = isStorePickup ? STORE_PICKUP_STEPS : PRIMARY_STEPS;
  const activeIndex = progressInfo.phaseIndex;
  const isException = progressInfo.isException;

  // Render Exception Banner if applicable
  const renderExceptionBadge = () => {
    if (status === 'delayed') {
      return (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 animate-pulse" />
          <div>
            <span className="font-semibold">
              {isBn ? 'যাত্রাপথে সাময়িক বিলম্ব:' : 'Transit Delay:'}
            </span>{' '}
            {isBn
              ? 'কুরিয়ার বাছাই কেন্দ্র বা প্রতিকূল আবহাওয়ার কারণে পৌঁছাতে কিছুটা বিলম্ব হতে পারে।'
              : 'Delivery delayed due to courier hub routing or weather advisory.'}
          </div>
        </div>
      );
    }
    if (status === 'delivery_attempted') {
      return (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-orange-300 bg-orange-50 p-3 text-sm text-orange-800">
          <Clock className="h-5 w-5 shrink-0 text-orange-600" />
          <div>
            <span className="font-semibold">
              {isBn ? 'ডেলিভারির চেষ্টা সম্পন্ন:' : 'Delivery Attempted:'}
            </span>{' '}
            {isBn
              ? 'গ্রাহক বা ফোন অনুপলব্ধ থাকায় ডেলিভারি সম্পন্ন হয়নি। পরবর্তী কার্যদিবসে পুনরায় চেষ্টা করা হবে।'
              : 'Delivery attempted but customer was unreachable. Re-attempt scheduled for next business day.'}
          </div>
        </div>
      );
    }
    if (status === 'rto_initiated' || status === 'rto_delivered') {
      return (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-purple-300 bg-purple-50 p-3 text-sm text-purple-800">
          <RotateCcw className="h-5 w-5 shrink-0 text-purple-600" />
          <div>
            <span className="font-semibold">
              {isBn ? 'রিটার্ন প্রক্রিয়া শুরু (RTO):' : 'Return to Origin (RTO):'}
            </span>{' '}
            {isBn
              ? 'পার্সেলটি মালদা প্রধান স্টোরে ফেরত পাঠানো হচ্ছে।'
              : 'Package is being returned back to our Malda main store.'}
          </div>
        </div>
      );
    }
    if (status === 'cancelled_by_user' || status === 'cancelled_by_seller') {
      return (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          <ShieldAlert className="h-5 w-5 shrink-0 text-red-600" />
          <div>
            <span className="font-semibold">
              {isBn ? 'অর্ডার বাতিল করা হয়েছে:' : 'Order Cancelled:'}
            </span>{' '}
            {isBn
              ? 'এই অর্ডারের প্রসেসিং বন্ধ করা হয়েছে। কোনো অর্থ প্রদেয় থাকলে রিফান্ড শুরু হয়েছে।'
              : 'This order has been cancelled. Any pre-paid amount has been queued for automatic refund.'}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      {/* Top Status & EDD Header */}
      <div className="mb-6 flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {isBn ? 'লাইভ স্ট্যাটাস' : 'Live Status'}
          </span>
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
            {isBn ? trackingData.statusLabelBn : trackingData.statusLabelEn}
          </h2>
        </div>

        {/* Estimated Delivery / Pickup Date Badge */}
        {estimatedDeliveryDate && (
          <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </span>
            <span>
              {isBn ? estimatedDeliveryDate.displayBn : estimatedDeliveryDate.displayEn}
            </span>
          </div>
        )}
      </div>

      {/* Exception Banner */}
      {renderExceptionBadge()}

      {/* 4-Digit Handover Delivery OTP Card (Items 8 & 19) */}
      {deliveryOtp?.shouldShowOtp && (
        <div className="mb-6 rounded-lg border-2 border-emerald-500 bg-emerald-50/60 p-4 text-center sm:text-left">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <span className="text-xs rounded bg-emerald-200 px-2 py-0.5 text-emerald-800 uppercase tracking-wider">
                  {isBn ? 'নিরাপত্তা কোড' : 'Security OTP'}
                </span>
                <span>{isBn ? 'ডেলিভারি হ্যান্ডওভার ওটিপি' : 'Delivery Handover OTP'}</span>
              </div>
              <p className="mt-1 text-xs text-emerald-800">
                {isBn ? deliveryOtp.securityNoticeBn : deliveryOtp.securityNoticeEn}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-white px-4 py-2 font-mono text-2xl font-black tracking-widest text-emerald-700 shadow-inner border border-emerald-300">
                {deliveryOtp.otpCode}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Stepper (Horizontal) */}
      <div className="hidden md:block my-6">
        <div className="relative flex items-center justify-between">
          {/* Connecting Track Line */}
          <div className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 bg-slate-100">
            <div
              className={`h-full transition-all duration-700 ease-out ${
                isException ? 'bg-amber-400' : 'bg-emerald-500'
              }`}
              style={{
                width: `${(activeIndex / (steps.length - 1)) * 100}%`,
              }}
            />
          </div>

          {/* Stepper Nodes */}
          {steps.map((step, idx) => {
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;
            const Icon = step.icon;

            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                    isCompleted
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                      : isCurrent
                      ? isException
                        ? 'border-amber-500 bg-white text-amber-600 ring-4 ring-amber-100 animate-pulse'
                        : 'border-emerald-600 bg-white text-emerald-600 ring-4 ring-emerald-100 animate-pulse'
                      : 'border-slate-300 bg-white text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span
                  className={`mt-2 text-xs font-semibold whitespace-nowrap ${
                    isCurrent
                      ? 'text-slate-900 font-bold'
                      : isCompleted
                      ? 'text-emerald-700'
                      : 'text-slate-400'
                  }`}
                >
                  {isBn ? step.titleBn : step.titleEn}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Stepper (Vertical) */}
      <div className="block md:hidden my-4 space-y-4">
        {steps.map((step, idx) => {
          const isCompleted = idx < activeIndex;
          const isCurrent = idx === activeIndex;
          const isLast = idx === steps.length - 1;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    isCompleted
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : isCurrent
                      ? isException
                        ? 'border-amber-500 bg-white text-amber-600 ring-4 ring-amber-100 animate-pulse'
                        : 'border-emerald-600 bg-white text-emerald-600 ring-4 ring-emerald-100 animate-pulse'
                      : 'border-slate-300 bg-white text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                {!isLast && (
                  <div
                    className={`w-0.5 grow mt-1 min-h-6 ${
                      isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
              <div className="pb-4">
                <div
                  className={`text-sm font-semibold ${
                    isCurrent ? 'text-slate-900 font-bold' : isCompleted ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  {isBn ? step.titleBn : step.titleEn}
                </div>
                {isCurrent && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    {isBn ? trackingData.statusDescriptionBn : trackingData.statusDescriptionEn}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Shipment & Courier Badge Details */}
      {shipment && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          <div>
            <span className="font-semibold text-slate-700">
              {isBn ? 'কুরিয়ার পার্টনার:' : 'Courier Partner:'}
            </span>{' '}
            <span className="uppercase font-medium text-slate-900">{shipment.carrier}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-700">
              {isBn ? 'ট্র্যাকিং / AWB নং:' : 'AWB Number:'}
            </span>{' '}
            <span className="font-mono font-medium text-slate-900">{shipment.awb}</span>
          </div>
          {shipment.trackingUrl && (
            <a
              href={shipment.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              {isBn ? 'কুরিয়ার পোর্টালে দেখুন ↗' : 'Carrier Portal ↗'}
            </a>
          )}
        </div>
      )}

      {/* Expandable Transit Hub Milestones Accordion (Item 25) */}
      {milestones.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <button
            onClick={() => setIsAccordionOpen(!isAccordionOpen)}
            className="flex w-full items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900 py-1"
          >
            <span>
              {isBn
                ? `সকল ট্রানজিট আপডেট ও চেকপয়েন্ট (${milestones.length}টি)`
                : `See all transit milestones & checkpoints (${milestones.length})`}
            </span>
            {isAccordionOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {isAccordionOpen && (
            <div className="mt-3 space-y-3 rounded-lg bg-slate-50/80 p-3 text-xs">
              {milestones.map((m, idx) => (
                <div key={idx} className="flex items-start gap-2.5 border-b border-slate-200/60 pb-2 last:border-0 last:pb-0">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <div className="grow">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>{isBn ? m.titleBn || m.title : m.title}</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        {m.timestamp
                          ? new Date(m.timestamp).toLocaleDateString(isBn ? 'bn-IN' : 'en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                    </div>
                    <p className="mt-0.5 text-slate-600">
                      {isBn ? m.descriptionBn || m.description : m.description}
                    </p>
                    {m.location && (
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        <span>{m.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Zero Cumulative Layout Shift (CLS) Skeleton Component (Item 27)
 */
export const OrderTimelineStepperSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="space-y-2">
          <div className="h-3 w-20 rounded bg-slate-200" />
          <div className="h-6 w-40 rounded bg-slate-200" />
        </div>
        <div className="h-8 w-36 rounded-lg bg-slate-200" />
      </div>
      <div className="my-8 hidden md:flex justify-between items-center px-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-slate-200" />
            <div className="h-3 w-16 rounded bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="h-12 w-full rounded-lg bg-slate-100" />
    </div>
  );
};
