import {
  CouponConfig,
  FlashDealConfig,
  BookComboBundle,
  AbandonedCartRecovery,
} from '../../types/sellerCentral';
import { defaultQueueService } from './notificationQueueService';

/**
 * Module 19 - Task 8: Store Marketing Hub, Coupons, Flash Deals & Combos Service
 * 
 * Complies with:
 * - Item 41: Custom Discount Coupon Engine (Flat / Percentage, Min Order, Max Cap, Expiry)
 * - Item 42: Flash Deal Countdown Scheduler (Start/End window, promotional price banner)
 * - Item 43: Frequently Bought Together Combo Linker (Bundled savings calculator)
 * - Item 44: Abandoned Cart 1-Click WhatsApp Follow-up (Triggering template recovery)
 */

export class StoreMarketingService {
  private coupons: Map<string, CouponConfig> = new Map();
  private flashDeals: Map<string, FlashDealConfig> = new Map();
  private combos: Map<string, BookComboBundle> = new Map();
  private abandonedCarts: Map<string, AbandonedCartRecovery> = new Map();

  constructor() {
    this.seedMarketingData();
  }

  private seedMarketingData() {
    // 1. Seed Coupons (Item 41)
    const seedCoupons: CouponConfig[] = [
      {
        code: 'MADHYAMIK50',
        discount_type: 'flat',
        discount_value: 50,
        min_order_value: 400,
        expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
        max_usages_per_user: 1,
        is_active: true,
      },
      {
        code: 'WBCS10',
        discount_type: 'percentage',
        discount_value: 10,
        min_order_value: 800,
        max_discount_amount: 150,
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
        max_usages_per_user: 2,
        is_active: true,
      },
      {
        code: 'EXPIRED10',
        discount_type: 'flat',
        discount_value: 20,
        min_order_value: 100,
        expires_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Expired 5 days ago
        max_usages_per_user: 1,
        is_active: false,
      },
    ];

    seedCoupons.forEach((c) => this.coupons.set(c.code.toUpperCase(), c));

    // 2. Seed Flash Deals (Item 42)
    const now = Date.now();
    const seedDeals: FlashDealConfig[] = [
      {
        deal_id: 'deal_wbcs_2026',
        title: 'WBCS 2026 Prelims Mega Flash Sale',
        title_bn: 'ডব্লিউবিসিএস ২০২৬ প্রিলিমিনারি মেগা ফ্ল্যাশ সেল (সীমিত সময়)',
        book_ids: ['book_wbcs_001'],
        discount_percentage: 25,
        start_time: new Date(now - 1 * 60 * 60 * 1000).toISOString(), // Started 1 hour ago
        end_time: new Date(now + 23 * 60 * 60 * 1000).toISOString(), // Ends in 23 hours
        is_active: true,
      },
    ];

    seedDeals.forEach((d) => this.flashDeals.set(d.deal_id, d));

    // 3. Seed Combos (Item 43)
    const seedCombos: BookComboBundle[] = [
      {
        combo_id: 'combo_wbcs_hist',
        title: 'WBCS Scanner + Ancient India Honours Combo',
        title_bn: 'ডব্লিউবিসিএস স্ক্যানার + প্রাচীন ভারতের ইতিহাস স্পেশাল কম্বো',
        book_skus: ['WBCS-SCAN-2026', 'HIST-HON-003'],
        combo_price: 890,
        original_total_price: 1015,
        savings_inr: 125,
        is_active: true,
      },
    ];

    seedCombos.forEach((c) => this.combos.set(c.combo_id, c));

    // 4. Seed Abandoned Carts (Item 44)
    const seedCarts: AbandonedCartRecovery[] = [
      {
        cart_id: 'cart_malda_801',
        customer_name: 'তানভীর হোসেন',
        customer_phone: '+919832889900',
        book_titles: ['WBCS Preliminary General Studies Scanner 2026'],
        cart_total: 520,
        hours_dormant: 3,
        recovery_sent: false,
      },
    ];

    seedCarts.forEach((cart) => this.abandonedCarts.set(cart.cart_id, cart));
  }

  /**
   * Item 41: Create or update coupon
   */
  public createCoupon(config: CouponConfig): CouponConfig {
    const formatted: CouponConfig = {
      ...config,
      code: config.code.trim().toUpperCase(),
    };
    this.coupons.set(formatted.code, formatted);
    return formatted;
  }

  /**
   * Item 41: Validate and apply coupon to cart
   */
  public validateAndApplyCoupon(
    code: string,
    cartTotal: number
  ): {
    valid: boolean;
    discount_amount: number;
    final_total: number;
    coupon?: CouponConfig;
    error?: string;
  } {
    const clean = code.trim().toUpperCase();
    const coupon = this.coupons.get(clean);

    if (!coupon) {
      return {
        valid: false,
        discount_amount: 0,
        final_total: cartTotal,
        error: 'কুপন কোডটি সঠিক নয়',
      };
    }

    if (!coupon.is_active) {
      return {
        valid: false,
        discount_amount: 0,
        final_total: cartTotal,
        error: 'এই কুপন কোডটির মেয়াদ শেষ বা নিষ্ক্রিয় করা হয়েছে',
      };
    }

    const expiryTime = new Date(coupon.expires_at).getTime();
    if (Date.now() > expiryTime) {
      return {
        valid: false,
        discount_amount: 0,
        final_total: cartTotal,
        error: 'কুপনটির ব্যবহারের সময়সীমা উত্তীর্ণ হয়ে গেছে',
      };
    }

    if (cartTotal < coupon.min_order_value) {
      return {
        valid: false,
        discount_amount: 0,
        final_total: cartTotal,
        error: `এই কুপনটি ব্যবহার করতে ন্যূনতম ₹${coupon.min_order_value}-এর বই অর্ডার করতে হবে`,
      };
    }

    let discount = 0;
    if (coupon.discount_type === 'flat') {
      discount = coupon.discount_value;
    } else {
      discount = Math.round((cartTotal * coupon.discount_value) / 100);
      if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
        discount = coupon.max_discount_amount;
      }
    }

    // Ensure discount does not exceed cart total
    discount = Math.min(discount, cartTotal);
    const finalTotal = Math.max(0, cartTotal - discount);

    return {
      valid: true,
      discount_amount: discount,
      final_total: finalTotal,
      coupon,
    };
  }

  public listCoupons(): CouponConfig[] {
    return Array.from(this.coupons.values());
  }

  /**
   * Item 42: Schedule Flash Deal
   */
  public scheduleFlashDeal(deal: FlashDealConfig): FlashDealConfig {
    this.flashDeals.set(deal.deal_id, deal);
    return deal;
  }

  /**
   * Item 42: Get currently running flash deals
   */
  public getActiveFlashDeals(): FlashDealConfig[] {
    const now = Date.now();
    return Array.from(this.flashDeals.values()).filter((deal) => {
      if (!deal.is_active) return false;
      const start = new Date(deal.start_time).getTime();
      const end = new Date(deal.end_time).getTime();
      return now >= start && now <= end;
    });
  }

  /**
   * Item 42: Flash Deal Countdown Evaluator
   */
  public getDealCountdown(dealId: string): {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    is_active: boolean;
    is_ended: boolean;
  } | null {
    const deal = this.flashDeals.get(dealId);
    if (!deal) return null;

    const now = Date.now();
    const end = new Date(deal.end_time).getTime();
    const diff = end - now;

    if (diff <= 0 || !deal.is_active) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        is_active: false,
        is_ended: true,
      };
    }

    const seconds = Math.floor((diff / 1000) % 60);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    return {
      days,
      hours,
      minutes,
      seconds,
      is_active: true,
      is_ended: false,
    };
  }

  /**
   * Item 43: Create or update Book Combo Bundle
   */
  public createCombo(bundle: BookComboBundle): BookComboBundle {
    const savings = Math.max(0, bundle.original_total_price - bundle.combo_price);
    const formatted: BookComboBundle = {
      ...bundle,
      savings_inr: savings,
    };
    this.combos.set(bundle.combo_id, formatted);
    return formatted;
  }

  public getActiveCombos(): BookComboBundle[] {
    return Array.from(this.combos.values()).filter((c) => c.is_active);
  }

  /**
   * Item 44: Abandoned Cart Follow-up via WhatsApp
   */
  public getDormantCarts(minHours = 2): AbandonedCartRecovery[] {
    return Array.from(this.abandonedCarts.values()).filter(
      (c) => c.hours_dormant >= minHours && !c.recovery_sent
    );
  }

  public sendWhatsAppCartRecovery(
    cartId: string,
    couponCode = 'READ5'
  ): { success: boolean; cart?: AbandonedCartRecovery; error?: string } {
    const cart = this.abandonedCarts.get(cartId);
    if (!cart) {
      return { success: false, error: 'কার্ট খুঁজে পাওয়া যায়নি' };
    }

    if (cart.recovery_sent) {
      return { success: false, error: 'ইতিমধ্যে রিকভারি নোটিফিকেশন পাঠানো হয়েছে' };
    }

    // Trigger transactional template via Module 18 engine
    defaultQueueService.enqueueNotification({
      recipient_name: cart.customer_name,
      phone_number: cart.customer_phone,
      trigger: 'abandoned_cart',
      template_name: 'mmbook_abandoned_cart_bn_v1',
      variables: {
        customer_name: cart.customer_name,
        cart_items_preview: cart.book_titles.join(', '),
        coupon_code: couponCode,
      },
    });

    cart.recovery_sent = true;
    cart.sent_at = new Date().toISOString();

    return { success: true, cart };
  }
}

export const defaultStoreMarketingService = new StoreMarketingService();
