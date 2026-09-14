'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  MapPin,
  Truck,
  CreditCard,
  CheckCircle2,
  Lock,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
  Package,
  BookOpen,
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useCartStore } from '@/hooks/useCartStore';
import {
  CheckoutStep,
  CheckoutMode,
  CheckoutItem,
  DeliverySpeedId,
  PaymentMethodType,
  GstBillingDetails,
  CheckoutPricingBreakdown,
  PlaceOrderPayload,
} from '@/types/checkout';
import { CustomerAddress, AddressSnapshot } from '@/types/address';
import {
  getBuyNowSession,
  generateCheckoutIdempotencyKey,
  clearBuyNowSession,
  updateBuyNowQuantity,
} from '@/lib/services/buyNowService';
import { reserveStock, releaseSessionReservations } from '@/lib/services/stockReservationService';
import { calculateCheckoutPricing } from '@/lib/services/checkoutPricingService';
import { getAvailableDeliverySpeeds } from '@/lib/services/deliverySpeedService';
import { toBengaliNumerals, formatINR } from '@/lib/utils/currency';
import { CheckoutHeader } from './CheckoutHeader';
import { CheckoutAddressSelector } from './CheckoutAddressSelector';
import { DeliverySpeedSelector } from './DeliverySpeedSelector';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { CheckoutOrderSummary } from './CheckoutOrderSummary';
import { CodVerificationModal } from './CodVerificationModal';
import { DynamicUpiQrModal } from './DynamicUpiQrModal';
import { PaymentGatewayModal } from './PaymentGatewayModal';
import { PaymentFailureRecoveryModal } from './PaymentFailureRecoveryModal';
import { placeOrderAction } from '@/actions/checkout';
import { getCustomerAddresses } from '@/actions/address';
import { trackDraftCheckoutAction } from '@/actions/abandonedCheckout';
import { reserveStockAction, releaseStockAction } from '@/actions/stockReservation';
import { DEFAULT_USER_ID } from '@/types/address';

export interface AmazonAccordionCheckoutProps {
  initialMode?: CheckoutMode;
  className?: string;
}

/**
 * Module 12 - Task 8: Amazon 3-Step Accordion Checkout Engine
 * 
 * Features:
 * - 70:30 Split Layout on Desktop & Vertical Stack on Mobile (Item 3, 4).
 * - 3 Progressive Accordion Steps: Address ➔ Delivery Speed ➔ Payment & Review (Item 5).
 * - 1-Click Reversible "Change" Links (Item 6).
 * - Smooth Auto-Scroll to Next Step on Step Completion (Item 7).
 * - State-Aware Back Button Interception (Item 8).
 * - Ultra-Fast Server Architecture (<300ms) (Item 9).
 * - Anti-Fraud COD OTP Integration (Item 26).
 */
export const AmazonAccordionCheckout: React.FC<AmazonAccordionCheckoutProps> = ({
  initialMode,
  className = '',
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isBengali } = useLanguage();
  const { isLoggedIn, profile, email } = useAuthSession();
  const { items: cartItems, clearCart, updateQuantity: updateCartQuantity } = useCartStore();

  // Determine Checkout Mode (Cart vs 1-Click Buy Now) (Item 11, 12)
  const mode: CheckoutMode =
    initialMode || (searchParams?.get('mode') === 'buy_now' ? 'buy_now' : 'cart');

  // Checkout Items (Isolated Buy Now or Selected Cart Items)
  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Step 1: Address & Saved Addresses List
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(null);
  const [billingAddressId, setBillingAddressId] = useState<string | undefined>(undefined);

  // Step 2: Delivery Speed
  const [deliverySpeed, setDeliverySpeed] = useState<DeliverySpeedId>('standard');
  const [speedFee, setSpeedFee] = useState<number>(0);

  // Step 3: Payment, GST & Coupons
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('upi');
  const [useGstInvoice, setUseGstInvoice] = useState<boolean>(false);
  const [gstDetails, setGstDetails] = useState<GstBillingDetails | undefined>(undefined);
  const [couponCode, setCouponCode] = useState<string>('');
  const [isGiftOrder, setIsGiftOrder] = useState<boolean>(false);
  const [giftMessage, setGiftMessage] = useState<string>('');

  // In-checkout quantity modifier handler (Item 17)
  const handleQuantityChange = (bookId: string, newQty: number) => {
    let updatedItems: CheckoutItem[] = [];
    if (mode === 'buy_now') {
      const updated = updateBuyNowQuantity(newQty);
      if (updated) {
        updatedItems = [updated.item];
        setItems(updatedItems);
      }
    } else {
      updatedItems = items.map((i) => (i.bookId === bookId ? { ...i, quantity: newQty } : i));
      setItems(updatedItems);
      updateCartQuantity(bookId, newQty);
    }

    // Sync 5-minute stock hold reservation if on step 3 (Item 31)
    if (currentStep === 3 && updatedItems.length > 0) {
      reserveStockAction({
        sessionId,
        items: updatedItems.map((i) => ({
          bookId: i.bookId,
          quantity: i.quantity,
          maxQuantity: i.maxQuantity || 10,
        })),
      });
    }
  };

  // Payment Channel Modals (Item 25, 26)
  const [showCodModal, setShowCodModal] = useState<boolean>(false);
  const [showUpiModal, setShowUpiModal] = useState<boolean>(false);
  const [showGatewayModal, setShowGatewayModal] = useState<boolean>(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState<boolean>(false);
  const [paymentErrorCode, setPaymentErrorCode] = useState<string | undefined>(undefined);
  const [codOtpCode, setCodOtpCode] = useState<string>('');

  // Idempotency & Session
  const [sessionId] = useState<string>(() => `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const [idempotencyKey] = useState<string>(() => generateCheckoutIdempotencyKey('checkout'));
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Step DOM references for smooth auto-scroll (Item 7)
  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);

  // 1. Initialize Items based on Mode
  useEffect(() => {
    if (mode === 'buy_now') {
      const bnSession = getBuyNowSession();
      if (bnSession) {
        setItems([bnSession.item]);
      } else {
        // Fallback: If no buy now session in storage, fallback to regular cart
        setItems(
          cartItems.map((c) => ({
            id: c.id,
            bookId: c.bookId,
            title: c.title,
            titleBn: c.titleBn,
            author: c.author,
            price: c.price,
            mrp: c.mrp,
            quantity: c.quantity,
            coverImage: c.coverImage,
            binding: c.binding,
            condition: c.condition,
          }))
        );
      }
    } else {
      // Cart Mode: Filter items
      const activeCart = cartItems.filter((item) => item.isSelected !== false);
      setItems(
        activeCart.map((c) => ({
          id: c.id,
          bookId: c.bookId,
          title: c.title,
          titleBn: c.titleBn,
          author: c.author,
          price: c.price,
          mrp: c.mrp,
          quantity: c.quantity,
          coverImage: c.coverImage,
          binding: c.binding,
          condition: c.condition,
        }))
      );
    }
  }, [mode, cartItems]);

  // Load saved customer addresses
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const addrs = await getCustomerAddresses(profile.id || DEFAULT_USER_ID);
        setSavedAddresses(addrs);
        if (addrs.length > 0 && !selectedAddressId) {
          const defaultAddr = addrs.find((a) => a.is_default) || addrs[0];
          setSelectedAddressId(defaultAddr.id);
          setSelectedAddress(defaultAddr);
        }
      } catch {
        // Fallback
      }
    };
    loadAddresses();
  }, [profile.id, selectedAddressId]);

  // 2. Pricing Recalculation Engine (Zero Client Trust - Item 39)
  const pricing: CheckoutPricingBreakdown = useMemo(() => {
    const pincode = selectedAddress?.pincode || '732101';
    return calculateCheckoutPricing({
      items,
      pincode,
      deliverySpeed,
      paymentMethod,
      couponCode,
      isGiftOrder,
    });
  }, [items, selectedAddress, deliverySpeed, paymentMethod, couponCode, isGiftOrder]);

  // 3. Auto-scroll focus to active step (Item 7)
  const scrollToStep = useCallback((step: CheckoutStep) => {
    const targetRef = step === 1 ? step1Ref : step === 2 ? step2Ref : step3Ref;
    if (targetRef.current) {
      setTimeout(() => {
        targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, []);

  // 4. Back button navigation handling (Item 8 - state-aware routing)
  useEffect(() => {
    const handlePopState = () => {
      if (currentStep > 1) {
        setCurrentStep((prev) => Math.max(1, prev - 1) as CheckoutStep);
      } else {
        const returnTarget =
          mode === 'buy_now'
            ? items[0]?.bookId
              ? `/book/${items[0].bookId}`
              : '/'
            : '/cart';
        router.push(returnTarget);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentStep, mode, items, router]);

  // Handle Step 1 Completion: Address Selected
  const handleAddressContinue = (address: CustomerAddress) => {
    setSelectedAddress(address);
    setSelectedAddressId(address.id);
    if (!completedSteps.includes(1)) {
      setCompletedSteps((prev) => [...prev, 1]);
    }
    setCurrentStep(2);
    scrollToStep(2);
    window.history.pushState({ step: 2 }, '', '#step2');

    // Item 30 & 35: Track draft checkout session for abandoned cart recovery
    trackDraftCheckoutAction({
      sessionId,
      customerPhone: address.recipient_phone,
      customerName: address.recipient_name,
      mode,
      items,
      totalAmount: pricing.finalPayable,
      shippingPincode: address.pincode,
      deliverySpeed,
      lastStepReached: 2,
    });
  };

  // Handle Step 2 Completion: Delivery Speed Selected
  const handleDeliverySpeedContinue = () => {
    if (!completedSteps.includes(2)) {
      setCompletedSteps((prev) => [...prev, 2]);
    }

    // 5-Minute Stock Hold Reservation triggered on entering Step 3 (Item 31, 36)
    if (items.length > 0) {
      reserveStockAction({
        sessionId,
        items: items.map((i) => ({
          bookId: i.bookId,
          quantity: i.quantity,
          maxQuantity: i.maxQuantity || 10,
        })),
      });
    }

    setCurrentStep(3);
    scrollToStep(3);
    window.history.pushState({ step: 3 }, '', '#step3');

    // Item 30: Update draft progress
    if (selectedAddress) {
      trackDraftCheckoutAction({
        sessionId,
        customerPhone: selectedAddress.recipient_phone,
        customerName: selectedAddress.recipient_name,
        mode,
        items,
        totalAmount: pricing.finalPayable,
        shippingPincode: selectedAddress.pincode,
        deliverySpeed,
        lastStepReached: 3,
      });
    }
  };

  // Handle 1-Click "Change" Link (Item 6)
  const handleStepRewind = (targetStep: CheckoutStep) => {
    setCurrentStep(targetStep);
    // When returning to earlier step, future steps require re-confirmation
    setCompletedSteps((prev) => prev.filter((s) => s < targetStep));
    scrollToStep(targetStep);
  };

  // Order Placement Handler (Item 28, 40)
  const executeOrderPlacement = async (
    otpOverride?: string,
    isPaymentVerified = false,
    txnId?: string
  ) => {
    if (!selectedAddressId || !selectedAddress) {
      setOrderError(isBengali ? 'অনুগ্রহ করে ডেলিভারি ঠিকানা নির্বাচন করুন' : 'Please select delivery address');
      setCurrentStep(1);
      return;
    }

    // 1. If COD selected and no OTP verified yet, challenge with COD OTP modal (Item 26)
    if (paymentMethod === 'cod' && !codOtpCode && !otpOverride) {
      setShowCodModal(true);
      return;
    }

    // 2. If UPI selected and payment not yet confirmed, open Dynamic UPI QR Modal (Item 25)
    if (paymentMethod === 'upi' && !isPaymentVerified) {
      setShowUpiModal(true);
      return;
    }

    // 3. If Card or NetBanking selected and not yet verified, open Gateway Modal (Item 25)
    if ((paymentMethod === 'card' || paymentMethod === 'netbanking') && !isPaymentVerified) {
      setShowGatewayModal(true);
      return;
    }

    setIsSubmitting(true);
    setOrderError(null);

    try {
      const payload: PlaceOrderPayload = {
        sessionId,
        idempotencyKey,
        mode,
        items: items.map((i) => ({
          bookId: i.bookId,
          variantId: i.variantId,
          quantity: i.quantity,
          binding: i.binding,
          condition: i.condition,
          giftOptions: i.giftOptions,
        })),
        shippingAddressId: selectedAddressId,
        billingAddressId: billingAddressId || selectedAddressId,
        deliverySpeed,
        paymentMethod,
        couponCode: pricing.couponCode,
        useGstInvoice,
        gstDetails: useGstInvoice ? gstDetails : undefined,
        isGiftOrder,
        giftMessage: isGiftOrder ? giftMessage : undefined,
        codOtpCode: otpOverride || codOtpCode,
        isPaymentVerified,
        paymentTransactionId: txnId || undefined,
      };

      const result = await placeOrderAction(payload);

      if (result.success && result.redirectUrl) {
        // Clear active carts upon successful order (Bug 9 & Item 20)
        if (mode === 'cart') {
          clearCart();
        } else {
          clearBuyNowSession();
        }
        router.push(result.redirectUrl);
      } else {
        setOrderError(result.errorBn || result.error || 'Order placement failed. Please try again.');
      }
    } catch (err: any) {
      setOrderError(err?.message || 'Unexpected connection error while placing order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clean up reservations if user unmounts/navigates away
  useEffect(() => {
    return () => {
      releaseStockAction(sessionId);
    };
  }, [sessionId]);

  const deliverySlaPromise = useMemo(() => {
    const pincode = selectedAddress?.pincode || '732101';
    const speeds = getAvailableDeliverySpeeds(pincode);
    const matched = speeds.find((s) => s.id === deliverySpeed);
    return matched?.guaranteedDeliveryDateBn || '';
  }, [selectedAddress, deliverySpeed]);

  return (
    <div className="w-full">
      {/* 1. Synchronized Distraction-Free Header (Item 1, 2, 4, 18) */}
      <CheckoutHeader
        itemCount={items.reduce((acc, i) => acc + i.quantity, 0)}
        currentStep={currentStep}
        isBuyNow={mode === 'buy_now'}
        returnUrl={
          mode === 'buy_now'
            ? items[0]?.bookId
              ? `/book/${items[0].bookId}`
              : '/deals'
            : '/cart'
        }
      />

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${className}`}>
        {/* Top Error Alert Banner */}
        {orderError && (
          <div className="mb-6 bg-red-50 border border-red-300 rounded-2xl p-4 text-xs sm:text-sm text-red-800 flex items-start gap-3 shadow-xs animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">{isBengali ? 'অর্ডার সম্পন্ন করতে সমস্যা হয়েছে' : 'Order Issue'}</p>
              <p>{orderError}</p>
            </div>
          </div>
        )}

      {/* Amazon Classic 70:30 Split Layout (Item 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: 3 Progressive Accordion Steps (70% on desktop) */}
        <div className="lg:col-span-8 space-y-4">
          {/* ================= STEP 1: DELIVERY ADDRESS ================= */}
          <section
            ref={step1Ref}
            aria-label="ধাপ ১: ডেলিভারি ঠিকানা"
            className={`border rounded-2xl transition-all duration-200 overflow-hidden bg-white ${
              currentStep === 1
                ? 'border-emerald-600 shadow-md ring-2 ring-emerald-500/10'
                : 'border-gray-200 shadow-xs'
            }`}
          >
            {/* Step Header */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs sm:text-sm ${
                    completedSteps.includes(1)
                      ? 'bg-emerald-600 text-white'
                      : currentStep === 1
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {completedSteps.includes(1) ? '✓' : '১'}
                </span>
                <h2 className="text-base sm:text-lg font-black text-gray-900">
                  {isBengali ? 'ডেলিভারি ঠিকানা নির্বাচন' : 'Delivery Address'}
                </h2>
              </div>

              {/* 1-Click Reversible "Change" Link (Item 6) */}
              {currentStep !== 1 && completedSteps.includes(1) && (
                <button
                  type="button"
                  onClick={() => handleStepRewind(1)}
                  className="text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                >
                  {isBengali ? 'পরিবর্তন করুন (Change)' : 'Change'}
                </button>
              )}
            </div>

            {/* Step Body */}
            <div className="p-4 sm:p-5">
              {currentStep === 1 ? (
                <div className="space-y-4">
                  <CheckoutAddressSelector
                    addresses={savedAddresses}
                    selectedAddressId={selectedAddressId}
                    onSelectAddress={(addr) => {
                      setSelectedAddress(addr);
                      setSelectedAddressId(addr.id);
                    }}
                    onAddressMutated={(mutatedAddr) => {
                      setSavedAddresses((prev) => {
                        const exists = prev.some((a) => a.id === mutatedAddr.id);
                        if (exists) return prev.map((a) => (a.id === mutatedAddr.id ? mutatedAddr : a));
                        return [mutatedAddr, ...prev];
                      });
                      setSelectedAddress(mutatedAddr);
                      setSelectedAddressId(mutatedAddr.id);
                    }}
                    orderSubtotal={pricing.itemsSubtotal}
                    userId={profile.id || DEFAULT_USER_ID}
                    isGiftOrder={isGiftOrder}
                    onToggleGiftOrder={setIsGiftOrder}
                    giftMessage={giftMessage}
                    onChangeGiftMessage={setGiftMessage}
                    onConfirmAddressStep={handleAddressContinue}
                  />
                </div>
              ) : selectedAddress ? (
                /* Collapsed Summary Card (Item 5) */
                <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-700">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-gray-900">{selectedAddress.recipient_name}</span> •{' '}
                    <span>
                      {selectedAddress.street_address}, {selectedAddress.city} - {selectedAddress.pincode}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          {/* ================= STEP 2: DELIVERY SPEED & SLA ================= */}
          <section
            ref={step2Ref}
            aria-label="ধাপ ২: ডেলিভারির গতি ও তারিখ"
            className={`border rounded-2xl transition-all duration-200 overflow-hidden bg-white ${
              currentStep === 2
                ? 'border-emerald-600 shadow-md ring-2 ring-emerald-500/10'
                : 'border-gray-200 shadow-xs'
            }`}
          >
            {/* Step Header */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs sm:text-sm ${
                    completedSteps.includes(2)
                      ? 'bg-emerald-600 text-white'
                      : currentStep === 2
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {completedSteps.includes(2) ? '✓' : '২'}
                </span>
                <h2 className="text-base sm:text-lg font-black text-gray-900">
                  {isBengali ? 'ডেলিভারির গতি ও সময় নির্বাচন' : 'Delivery Options & Speed'}
                </h2>
              </div>

              {currentStep !== 2 && completedSteps.includes(2) && (
                <button
                  type="button"
                  onClick={() => handleStepRewind(2)}
                  className="text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                >
                  {isBengali ? 'পরিবর্তন করুন (Change)' : 'Change'}
                </button>
              )}
            </div>

            {/* Step Body */}
            <div className="p-4 sm:p-5">
              {currentStep === 2 ? (
                <DeliverySpeedSelector
                  pincode={selectedAddress?.pincode || '732101'}
                  baseShippingFee={pricing.baseShippingFee}
                  selectedSpeed={deliverySpeed}
                  onSelectSpeed={(speed, fee) => {
                    setDeliverySpeed(speed);
                    setSpeedFee(fee);
                  }}
                  onContinueToPayment={handleDeliverySpeedContinue}
                />
              ) : completedSteps.includes(2) ? (
                /* Collapsed Summary */
                <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-700">
                  <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-gray-900">
                      {deliverySpeed === 'express_sameday'
                        ? (isBengali ? 'সেইম-ডে এক্সপ্রেস' : 'Same-Day Express')
                        : deliverySpeed === 'store_pickup'
                        ? (isBengali ? 'স্টোর পিকআপ (দোকান থেকে সংগ্রহ)' : 'Store Pickup')
                        : (isBengali ? 'স্ট্যান্ডার্ড ডেলিভারি' : 'Standard Delivery')}
                    </span>
                    <span className="text-emerald-700 font-bold ml-2">
                      ({deliverySlaPromise})
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400">
                  {isBengali ? 'প্রথমে ঠিকানা নির্বাচন সম্পন্ন করুন।' : 'Complete address selection first.'}
                </p>
              )}
            </div>
          </section>

          {/* ================= STEP 3: PAYMENT METHOD & REVIEW ================= */}
          <section
            ref={step3Ref}
            aria-label="ধাপ ৩: পেমেন্ট ও অর্ডার রিভিউ"
            className={`border rounded-2xl transition-all duration-200 overflow-hidden bg-white ${
              currentStep === 3
                ? 'border-emerald-600 shadow-md ring-2 ring-emerald-500/10'
                : 'border-gray-200 shadow-xs'
            }`}
          >
            {/* Step Header */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs sm:text-sm ${
                    currentStep === 3
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  ৩
                </span>
                <h2 className="text-base sm:text-lg font-black text-gray-900">
                  {isBengali ? 'পেমেন্ট মেথড ও ফাইনাল রিভিউ' : 'Payment Method & Order Review'}
                </h2>
              </div>
            </div>

            {/* Step Body */}
            <div className="p-4 sm:p-5 space-y-5">
              {currentStep === 3 ? (
                <>
                  {/* Item 17: Review Items & In-Checkout Quantity Dropdown */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                      <h3 className="text-xs sm:text-sm font-black text-gray-900 flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-emerald-600" />
                        <span>{isBengali ? 'অর্ডার পর্যালোচনা ও বইয়ের সংখ্যা' : 'Review Items & Quantity'}</span>
                      </h3>
                      <span className="text-xs font-semibold text-gray-500">
                        {items.length} {isBengali ? 'টি আইটেম' : items.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>

                    <div className="divide-y divide-gray-100">
                      {items.map((item) => (
                        <div key={item.id || item.bookId} className="py-2.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {item.coverImage ? (
                              <img
                                src={item.coverImage}
                                alt={item.title}
                                className="w-12 h-16 object-cover rounded-md border border-gray-200 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-16 bg-gray-200 rounded-md flex items-center justify-center shrink-0 text-gray-400">
                                <BookOpen className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                                {isBengali ? item.titleBn : item.title}
                              </h4>
                              <p className="text-[11px] text-gray-500 truncate">{item.author}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="font-black text-xs text-gray-950">₹{item.price}</span>
                                {item.mrp > item.price && (
                                  <span className="text-[10px] text-gray-400 line-through">₹{item.mrp}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* In-Checkout Quantity Modifier Dropdown (Item 17) */}
                          <div className="flex items-center gap-1.5 shrink-0 bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-2xs">
                            <label htmlFor={`qty-${item.bookId}`} className="text-xs font-bold text-gray-600">
                              {isBengali ? 'সংখ্যা:' : 'Qty:'}
                            </label>
                            <select
                              id={`qty-${item.bookId}`}
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(item.bookId, Number(e.target.value))}
                              className="bg-transparent font-black text-xs text-gray-900 focus:outline-hidden cursor-pointer"
                            >
                              {Array.from({ length: Math.min(10, item.maxQuantity || 10) }, (_, i) => i + 1).map((q) => (
                                <option key={q} value={q}>
                                  {isBengali ? toBengaliNumerals(q) : q}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <PaymentMethodSelector
                    selectedMethod={paymentMethod}
                    onSelectMethod={(method) => setPaymentMethod(method)}
                    finalPayable={pricing.finalPayable}
                    useGstInvoice={useGstInvoice}
                    onToggleUseGst={setUseGstInvoice}
                    gstDetails={gstDetails}
                    onChangeGstDetails={(details) => setGstDetails(details)}
                    onPlaceOrder={() => executeOrderPlacement()}
                    isSubmitting={isSubmitting}
                  />
                </>
              ) : (
                <p className="text-xs text-gray-400">
                  {isBengali
                    ? 'পূর্ববর্তী ধাপগুলো সম্পন্ন করার পর পেমেন্ট বিকল্প উন্মুক্ত হবে।'
                    : 'Payment channels will unlock after completing previous steps.'}
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Sticky Order Summary (30% on desktop) (Item 3) */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
          <CheckoutOrderSummary
            pricing={pricing}
            itemCount={items.reduce((acc, i) => acc + i.quantity, 0)}
            onApplyCoupon={(code) => setCouponCode(code)}
            onRemoveCoupon={() => setCouponCode('')}
            onPlaceOrder={() => currentStep === 3 && executeOrderPlacement()}
            isSubmitting={isSubmitting}
            canPlaceOrder={currentStep === 3}
          />
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar (Item 4) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 px-4 shadow-lg flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
            {isBengali ? 'মোট প্রদেয়' : 'Total Payable'}
          </p>
          <p className="text-lg font-black text-gray-950">₹{pricing.finalPayable}</p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (currentStep === 1 && selectedAddress) {
              handleAddressContinue(selectedAddress);
            } else if (currentStep === 2) {
              handleDeliverySpeedContinue();
            } else if (currentStep === 3) {
              executeOrderPlacement();
            }
          }}
          disabled={isSubmitting}
          className="flex-1 py-3 px-4 rounded-full font-black text-xs sm:text-sm bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] text-gray-950 border border-[#fcd200] shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
          ) : currentStep === 1 ? (
            <span>{isBengali ? 'ডেলিভারি স্পিড নির্বাচন করুন ➔' : 'Select Delivery Speed ➔'}</span>
          ) : currentStep === 2 ? (
            <span>{isBengali ? 'পেমেন্ট ও রিভিউ ধাপে যান ➔' : 'Continue to Payment ➔'}</span>
          ) : (
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>
                {isBengali
                  ? `অর্ডার নিশ্চিত করুন (₹${toBengaliNumerals(pricing.finalPayable)})`
                  : `Place Order & Pay (₹${pricing.finalPayable.toFixed(2)})`}
              </span>
            </div>
          )}
        </button>
      </div>

      {/* COD Anti-Fraud OTP Verification Modal (Item 26) */}
      <CodVerificationModal
        isOpen={showCodModal}
        sessionId={sessionId}
        phone={selectedAddress?.recipient_phone || ''}
        onVerifySuccess={(otp) => {
          setCodOtpCode(otp);
          setShowCodModal(false);
          executeOrderPlacement(otp);
        }}
        onClose={() => setShowCodModal(false)}
      />

      {/* Dynamic UPI QR Modal (Item 25) */}
      <DynamicUpiQrModal
        isOpen={showUpiModal}
        onClose={() => setShowUpiModal(false)}
        orderId={sessionId}
        amount={pricing.finalPayable}
        onPaymentSuccess={(paymentId) => {
          setShowUpiModal(false);
          executeOrderPlacement(undefined, true, paymentId);
        }}
      />

      {/* In-Page Payment Gateway Modal (Item 25, 46) */}
      <PaymentGatewayModal
        isOpen={showGatewayModal}
        onClose={() => setShowGatewayModal(false)}
        orderId={sessionId}
        amount={pricing.finalPayable}
        customerName={selectedAddress?.recipient_name}
        customerPhone={selectedAddress?.recipient_phone}
        onPaymentSuccess={(paymentId) => {
          setShowGatewayModal(false);
          executeOrderPlacement(undefined, true, paymentId);
        }}
        onPaymentFailure={(errCode) => {
          setShowGatewayModal(false);
          setPaymentErrorCode(errCode);
          setShowRecoveryModal(true);
        }}
      />

      {/* Payment Failure Grace & Recovery Modal (Item 47) */}
      <PaymentFailureRecoveryModal
        isOpen={showRecoveryModal}
        onClose={() => setShowRecoveryModal(false)}
        orderId={sessionId}
        amount={pricing.finalPayable}
        phone={selectedAddress?.recipient_phone}
        errorCode={paymentErrorCode}
        onRetryUpi={() => {
          setShowRecoveryModal(false);
          setPaymentMethod('upi');
          setShowUpiModal(true);
        }}
        onTryCard={() => {
          setShowRecoveryModal(false);
          setPaymentMethod('card');
          setShowGatewayModal(true);
        }}
        onConvertToCod={() => {
          setShowRecoveryModal(false);
          setPaymentMethod('cod');
          setShowCodModal(true);
        }}
      />
    </div>
  </div>
  );
};

export default AmazonAccordionCheckout;
