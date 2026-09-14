import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CheckoutHeader } from '@/components/checkout/CheckoutHeader';
import { CheckoutFooter } from '@/components/checkout/CheckoutFooter';
import { OrderSuccessView } from '@/components/checkout/OrderSuccessView';
import { getOrderDetailsAction } from '@/actions/checkout';
import { AddressSnapshot } from '@/types/address';
import { CheckoutPricingBreakdown } from '@/types/checkout';

interface PageProps {
  params: Promise<{
    order_id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `Order Placed Successfully | M.M Book House Malda`,
    description: `Order ${resolvedParams.order_id} confirmation and live tracking timeline.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function OrderSuccessPage({ params }: PageProps) {
  const resolvedParams = await params;
  const orderId = resolvedParams.order_id;

  // Retrieve placed order record from Database / Server Action store
  const orderData = await getOrderDetailsAction(orderId);

  // If order does not exist, trigger 404 cleanly (No fake data fallbacks - Bug 2)
  if (!orderData) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {/* 1. Distraction-Free Header (Item 1, 2) */}
      <CheckoutHeader returnUrl="/account/orders" />

      {/* 2. Success Hub (Item 41 - 50) */}
      <main className="flex-1">
        <OrderSuccessView
          orderId={orderId}
          orderNumber={orderData.orderNumber}
          items={orderData.items}
          pricing={orderData.pricing}
          shippingAddressSnapshot={orderData.shippingAddressSnapshot}
          deliverySpeed={orderData.deliverySpeed || 'standard'}
          guaranteedDeliveryDateBn={orderData.guaranteedDeliveryDateBn}
          paymentMethod={orderData.paymentMethod || 'upi'}
          status={orderData.status || 'confirmed'}
          createdAt={orderData.createdAt}
          utr={orderData.utr}
          paymentTransactionId={orderData.paymentTransactionId}
        />
      </main>

      {/* 3. Minimal Compliance Footer (Item 10) */}
      <CheckoutFooter />
    </div>
  );
}
