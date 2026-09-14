/**
 * Module 16: Order Live Tracking & Customer Action API
 * M.M Book House Malda - Live Order Tracking
 * 
 * Handles:
 * - GET: Retrieves live tracking data, shipment details, milestones, and EDD
 * - POST: Handles customer actions (self-cancellation, 7-day replacement, delivery OTP verification)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  cancelOrderSchema,
  replacementRequestSchema,
  verifyDeliveryOtpSchema,
} from '@/lib/validations/tracking';
import {
  canCancelOrder,
  canRequestReplacement,
  validateStatusTransition,
  validateStorePickupOtp,
} from '@/lib/services/trackingStateMachine';
import { calculateLiveEdd, getDeliveryOtpDisplay } from '@/lib/services/trackingEddService';
import { LiveTrackingData, OrderStatus } from '@/types/tracking';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const cleanId = id.trim();

    // In a production setup, this queries Prisma/DB for order + tracking_history
    const orderStatus: OrderStatus = 'shipped';
    const isStorePickup = false;
    const edd = calculateLiveEdd({
      destinationPincode: '732101',
      status: orderStatus,
      isStorePickup,
    });

    const otpDisplay = getDeliveryOtpDisplay({
      status: orderStatus,
      otp: '7482',
      phone: '9832145678',
    });

    const trackingData: LiveTrackingData = {
      orderId: cleanId,
      orderNumber: cleanId.toUpperCase().startsWith('MMB-') ? cleanId.toUpperCase() : `MMB-${cleanId.toUpperCase()}`,
      status: orderStatus,
      statusLabelEn: 'Shipped & In Transit',
      statusLabelBn: 'শিপমেন্ট প্রেরণ করা হয়েছে',
      statusDescriptionEn: 'Your package is on its way via Delhivery Surface Express.',
      statusDescriptionBn: 'আপনার পার্সেলটি দিল্লিভেরি এক্সপ্রেস কুরিয়ারে ট্রানজিটে রয়েছে।',
      isStorePickup,
      isCancellable: canCancelOrder(orderStatus).allowed,
      isReturnable: canRequestReplacement(orderStatus).allowed,
      estimatedDeliveryDate: edd,
      deliveryOtp: otpDisplay,
      shipment: {
        carrier: 'delhivery',
        awb: `DEL${cleanId.replace(/\D/g, '') || '88392019'}`,
        trackingUrl: `https://www.delhivery.com/track/package/DEL${cleanId.replace(/\D/g, '') || '88392019'}`,
      },
      deliveryAddress: {
        fullName: 'Anirul Islam',
        phone: '9832145678',
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
          id: 'b-1',
          title: 'Ananda Math (Classic Edition)',
          titleBn: 'আনন্দমঠ (বিশেষ সংস্করণ)',
          author: 'Bankim Chandra Chattopadhyay',
          quantity: 1,
          price: 280,
        },
        {
          id: 'b-2',
          title: 'Chander Pahar',
          titleBn: 'চাঁদের পাহাড়',
          author: 'Bibhutibhushan Bandyopadhyay',
          quantity: 1,
          price: 300,
        },
      ],
    };

    return NextResponse.json({ success: true, tracking: trackingData });
  } catch (error) {
    console.error('Order tracking fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tracking data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const action = body.action;

    // Action 1: Customer Self-Cancellation (Item 9)
    if (action === 'cancel') {
      const parsed = cancelOrderSchema.safeParse({
        order_id: id,
        reason: body.reason,
        notes: body.notes,
      });

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.issues[0]?.message },
          { status: 422 }
        );
      }

      // Check state machine cancellation window
      const currentStatus: OrderStatus = body.currentStatus || 'order_placed';
      const check = canCancelOrder(currentStatus);

      if (!check.allowed) {
        return NextResponse.json(
          { success: false, error: check.reason, errorBn: check.reasonBn },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        orderId: id,
        newStatus: 'cancelled_by_user',
        message: 'Order cancelled successfully. Refund initiated if prepaid.',
        messageBn: 'অর্ডার সফলভাবে বাতিল করা হয়েছে।',
      });
    }

    // Action 2: 7-Day Replacement Request (Item 10)
    if (action === 'replacement') {
      const parsed = replacementRequestSchema.safeParse({
        order_id: id,
        product_id: body.product_id || 'item-all',
        reason: body.reason || body.defect_category || 'printing_defect',
        description: body.description || 'Defect reported by customer within replacement window',
        images: body.images || body.proof_images,
      });

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.issues[0]?.message },
          { status: 422 }
        );
      }

      const currentStatus: OrderStatus = body.currentStatus || 'delivered';
      const deliveredAt = body.deliveredAt || new Date().toISOString();
      const check = canRequestReplacement(currentStatus, deliveredAt, 7);

      if (!check.allowed) {
        return NextResponse.json(
          { success: false, error: check.reason, errorBn: check.reasonBn },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        orderId: id,
        replacementStatus: 'replacement_requested',
        daysRemaining: check.daysRemaining,
        message: 'Replacement request submitted successfully. Our Malda team will contact you within 24 hours.',
        messageBn: 'রিপ্লেসমেন্ট অনুরোধ গৃহীত হয়েছে। ২৪ ঘণ্টার মধ্যে আমাদের টিম যোগাযোগ করবে।',
      });
    }

    // Action 3: Verify Delivery / Pickup OTP (Items 8 & 40)
    if (action === 'verify_otp') {
      const parsed = verifyDeliveryOtpSchema.safeParse({
        order_id: id,
        otp: body.otp,
        verification_type: body.verification_type || 'home_delivery',
      });

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.issues[0]?.message },
          { status: 422 }
        );
      }

      const expectedOtp = body.expectedOtp || '7482';
      const otpRes = validateStorePickupOtp(expectedOtp, parsed.data.otp);

      if (!otpRes.success) {
        return NextResponse.json(
          { success: false, error: otpRes.error, errorBn: otpRes.errorBn },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        orderId: id,
        verified: true,
        verifiedAt: new Date().toISOString(),
        message: 'Delivery handover OTP successfully verified.',
        messageBn: 'ডেলিভারি ওটিপি সফলভাবে যাচাই করা হয়েছে।',
      });
    }

    return NextResponse.json(
      { success: false, error: `Unsupported action '${action}'` },
      { status: 400 }
    );
  } catch (error) {
    console.error('Order action error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error processing order action' },
      { status: 500 }
    );
  }
}
