import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { GuestOrderTrackView } from '@/components/tracking/GuestOrderTrackView';
import { OrderTimelineStepperSkeleton } from '@/components/tracking/OrderTimelineStepper';

export const metadata: Metadata = {
  title: 'লাইভ অর্ডার ট্র্যাকিং | M.M Book House Malda',
  description:
    'এম.এম বুক হাউস মালদা লাইভ অর্ডার ট্র্যাকিং। আপনার পার্সেলের বর্তমান অবস্থান, কুরিয়ার বিবরণ ও ডেলিভারির সর্বশেষ আপডেট জানুন।',
  keywords: [
    'order tracking',
    'live parcel track',
    'MM Book House Malda',
    'delhivery malda tracking',
    'india post tracking',
  ],
};

export default function TrackPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-8">
      <Suspense
        fallback={
          <div className="mx-auto max-w-4xl px-4 py-8">
            <OrderTimelineStepperSkeleton />
          </div>
        }
      >
        <GuestOrderTrackView />
      </Suspense>
    </main>
  );
}
