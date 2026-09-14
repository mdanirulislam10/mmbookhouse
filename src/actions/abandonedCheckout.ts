'use server';

/**
 * Module 12: Server Action for Tracking Draft/Abandoned Checkouts (Item 30 & 35)
 */
import { trackDraftCheckout } from '@/lib/services/abandonedCheckoutService';
import { CheckoutItem, CheckoutMode, DeliverySpeedId } from '@/types/checkout';

export async function trackDraftCheckoutAction(payload: {
  sessionId: string;
  customerPhone?: string;
  customerEmail?: string;
  customerName?: string;
  mode?: CheckoutMode;
  items: CheckoutItem[];
  totalAmount: number;
  shippingPincode?: string;
  deliverySpeed?: DeliverySpeedId;
  lastStepReached?: 1 | 2 | 3;
}) {
  try {
    const record = trackDraftCheckout(payload);
    return { success: true, id: record.id };
  } catch (e: any) {
    return { success: false, error: e?.message };
  }
}
