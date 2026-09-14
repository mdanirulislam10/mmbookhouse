import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Package } from 'lucide-react';
import { OrderTimelineStepper } from '@/components/tracking/OrderTimelineStepper';
import { OrderDetailCard } from '@/components/tracking/OrderDetailCard';
import { LiveTrackingData } from '@/types/tracking';

interface OrderTrackingPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: OrderTrackingPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `অর্ডার #${id} ট্র্যাকিং | M.M Book House Malda`,
    description: `অর্ডার #${id}-এর লাইভ ট্র্যাকিং স্ট্যাটাস ও শিপমেন্ট বিবরণ।`,
  };
}

export default async function OrderTrackingDetailPage({ params }: OrderTrackingPageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  // Live order tracking model for single order view
  const trackingData: LiveTrackingData = {
    orderId: id,
    orderNumber: id.toUpperCase().startsWith('MMB-') ? id.toUpperCase() : `MMB-${id.toUpperCase()}`,
    status: 'shipped',
    statusLabelEn: 'Shipped & In Transit',
    statusLabelBn: 'শিপমেন্ট প্রেরণ করা হয়েছে',
    statusDescriptionEn: 'Your package is on its way via Delhivery Express logistics.',
    statusDescriptionBn: 'আপনার পার্সেলটি দিল্লিভেরি এক্সপ্রেস কুরিয়ারে ট্রানজিটে রয়েছে।',
    isStorePickup: false,
    isCancellable: false, // Disallowed after packaging
    isReturnable: false,
    estimatedDeliveryDate: {
      displayEn: 'Tomorrow by 8:00 PM',
      displayBn: 'আগামীকাল রাত ৮:০০টার মধ্যে',
      isDelayed: false,
      isArrivingToday: false,
    },
    shipment: {
      carrier: 'delhivery',
      awb: `DEL${id.replace(/\D/g, '') || '987654321'}`,
      trackingUrl: `https://www.delhivery.com/track/package/DEL${id.replace(/\D/g, '') || '987654321'}`,
    },
    deliveryAddress: {
      fullName: 'Anirul Islam',
      phone: '9832145678',
      addressLine1: 'Rabindra Avenue, Rathbari',
      city: 'Malda',
      state: 'West Bengal',
      pincode: '732101',
    },
    subtotal: 620,
    shippingFee: 0,
    grandTotal: 620,
    paymentMethod: 'upi',
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
        title: 'Dispatched in Transit',
        titleBn: 'শিপমেন্ট প্রেরণ করা হয়েছে',
        description: 'Package moving through sorting hub',
        descriptionBn: 'বাছাই কেন্দ্রের মাধ্যমে ট্রানজিটে চলছে',
        timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        location: 'Kolkata RMS Sorting Hub',
      },
    ],
    items: [
      {
        id: 'item-1',
        title: 'Gitanjali (Bengali & English Edition)',
        titleBn: 'গীতাঞ্জলি (বিশেষ সংস্করণ)',
        author: 'Rabindranath Tagore',
        quantity: 1,
        price: 320,
      },
      {
        id: 'item-2',
        title: 'Feluda Samagra Volume 1',
        titleBn: 'ফেলুদা সমগ্র ১ম খণ্ড',
        author: 'Satyajit Ray',
        quantity: 1,
        price: 300,
      },
    ],
  };

  return (
    <main className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Back Link Breadcrumbs */}
        <div className="mb-6">
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>অর্ডারের তালিকায় ফিরে যান (Back to Orders)</span>
          </Link>
        </div>

        <div className="space-y-6">
          {/* Stepper */}
          <OrderTimelineStepper trackingData={trackingData} locale="bn" />

          {/* Details Card */}
          <OrderDetailCard trackingData={trackingData} locale="bn" />
        </div>
      </div>
    </main>
  );
}
