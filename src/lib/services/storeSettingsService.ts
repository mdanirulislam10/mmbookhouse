import {
  StoreProfileSettings,
  AdminRole,
} from '../../types/sellerCentral';
import { defaultQueueService } from './notificationQueueService';
import { OrderPipelineService, defaultOrderPipelineService } from './orderPipelineService';

/**
 * Module 19 - Task 9: Store Settings, Maintenance Mode & Live Notice Bar Service
 * 
 * Complies with:
 * - Item 45: 1-Click Store Maintenance Mode Switch (with super_admin bypass token)
 * - Item 46: Live Header Announcement Notice Bar Editor
 * - Item 47: Physical Shophouse Profile & Official UPI QR Settings
 * - Item 48: High-Security Customer Data Export with 6-Digit OTP Gate
 */

export class StoreSettingsService {
  private settings: StoreProfileSettings;
  private pipelineService: OrderPipelineService;
  private exportOtpStore: { otp: string; expires_at: number } | null = null;

  constructor(pipelineService = defaultOrderPipelineService) {
    this.pipelineService = pipelineService;
    this.settings = {
      store_name: 'M.M Book House (এম.এম বুক হাউস)',
      address: 'রবীন্দ্র এভিনিউ, নেতাজি সুভাষ রোড, মালদা, পশ্চিমবঙ্গ - ৭৩২১০১',
      phone: '+919832000000',
      whatsapp: '+919832000000',
      email: 'support@mmbookhouse.com',
      upi_id: 'mmbookhouse@icici',
      upi_qr_url: '/images/mmbook_upi_qr.png',
      announcement_notice: '📢 মাধ্যমিক ও উচ্চমাধ্যমিকের সব টেস্ট পেপারে ফ্ল্যাট ২০% বিশেষ ছাড় চলছে! মালদা শপ কাউন্টারেও স্টক উপলভ্য!',
      announcement_bg_color: '#1e3a8a',
      announcement_link: '/category/test-papers',
      is_announcement_active: true,
      is_maintenance_mode: false,
      maintenance_message: 'দোকানের বার্ষিক স্টক অডিট চলছে, খুব শীঘ্রই ওয়েবসাইট চালু হবে। জরুরি প্রয়োজনে কল করুন: +91 98320 00000',
    };
  }

  /**
   * Item 47: Get current store settings
   */
  public getSettings(): StoreProfileSettings {
    return { ...this.settings };
  }

  /**
   * Item 45, 46, 47: Update store settings with RBAC check
   */
  public updateSettings(
    updates: Partial<StoreProfileSettings>,
    role: AdminRole
  ): { success: boolean; settings?: StoreProfileSettings; error?: string } {
    // Maintenance mode and UPI changes require super_admin
    if (updates.is_maintenance_mode !== undefined || updates.upi_id !== undefined) {
      if (role !== 'super_admin') {
        return {
          success: false,
          error: 'শুধুমাত্র সুপার অ্যাডমিন স্টোর মেইন্টেন্যান্স মোড বা ইউপিআই আইডি পরিবর্তন করতে পারবেন।',
        };
      }
    }

    this.settings = {
      ...this.settings,
      ...updates,
    };

    return { success: true, settings: { ...this.settings } };
  }

  /**
   * Item 45: Check if maintenance mode is active
   * Allows bypass if valid admin token is passed
   */
  public isMaintenanceModeActive(bypassToken?: string): boolean {
    if (!this.settings.is_maintenance_mode) return false;
    if (bypassToken === 'SUPER_ADMIN_BYPASS_KEY') return false;
    return true;
  }

  /**
   * Item 48: High-Security Customer Data Export - Step 1: Request 6-Digit OTP
   */
  public requestExportOtp(
    role: AdminRole,
    ownerPhone = '+919832000000'
  ): { success: boolean; message: string; otpForTest?: string } {
    if (role !== 'super_admin') {
      return {
        success: false,
        message: 'অননুমোদিত অ্যাক্সেস। শুধুমাত্র সুপার অ্যাডমিন ডেটাবেস এক্সপোর্ট ওটিপি চাইতে পারেন।',
      };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    this.exportOtpStore = {
      otp,
      expires_at: Date.now() + 5 * 60 * 1000, // 5 minutes validity
    };

    // Dispatches WhatsApp security alert to shop owner
    defaultQueueService.enqueueNotification({
      order_id: 'AUDIT-EXPORT',
      recipient_name: 'Shop Owner (Super Admin)',
      phone_number: ownerPhone,
      trigger: 'cod_verification', // Using high-priority template format
      template_name: 'mmbook_admin_export_otp_v1',
      variables: {
        customer_name: 'Owner',
        order_id: 'AUDIT-EXPORT',
        amount: '0',
        action_name: 'Customer DB Export OTP',
        code: otp,
      },
    });

    return {
      success: true,
      message: '৬-সংখ্যার গোপন এক্সপোর্ট ওটিপি স্বত্বাধিকারীর রেজিস্টার্ড হোয়াটসঅ্যাপে পাঠানো হয়েছে।',
      otpForTest: otp,
    };
  }

  /**
   * Item 48: High-Security Customer Data Export - Step 2: Verify OTP and Generate CSV
   */
  public verifyOtpAndExportCustomers(
    inputOtp: string,
    role: AdminRole
  ): { success: boolean; csv?: string; error?: string } {
    if (role !== 'super_admin') {
      return {
        success: false,
        error: 'অননুমোদিত চেষ্টা! শুধুমাত্র সুপার অ্যাডমিন গ্রাহক তালিকা ডাউনলোড করতে পারেন।',
      };
    }

    if (!this.exportOtpStore) {
      return {
        success: false,
        error: 'কোনো সক্রিয় এক্সপোর্ট ওটিপি অনুরোধ নেই। অনুগ্রহ করে প্রথমে ওটিপি জেনারেট করুন।',
      };
    }

    if (Date.now() > this.exportOtpStore.expires_at) {
      this.exportOtpStore = null;
      return {
        success: false,
        error: 'ওটিপির মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে পুনরায় নতুন ওটিপি অনুরোধ করুন।',
      };
    }

    if (this.exportOtpStore.otp !== inputOtp.trim()) {
      return {
        success: false,
        error: 'ভুল ওটিপি কোড! সুরক্ষার জন্য এক্সপোর্ট অনুরোধ বাতিল করা হয়েছে।',
      };
    }

    // OTP verified successfully: Clear OTP store
    this.exportOtpStore = null;

    // Aggregate unique customer metrics from orders
    const allOrders = this.pipelineService.searchOrders('');
    const customerMap = new Map<
      string,
      {
        name: string;
        phone: string;
        email: string;
        district: string;
        total_orders: number;
        total_spent: number;
        last_order_date: string;
      }
    >();

    for (const order of allOrders) {
      const phoneKey = order.customer_phone.trim();
      const existing = customerMap.get(phoneKey) || {
        name: order.customer_name,
        phone: order.customer_phone,
        email: order.customer_email || 'N/A',
        district: order.district || 'Malda',
        total_orders: 0,
        total_spent: 0,
        last_order_date: order.created_at.split('T')[0],
      };

      existing.total_orders++;
      existing.total_spent += order.total_amount;
      customerMap.set(phoneKey, existing);
    }

    const headers = [
      'Customer Name',
      'Phone Number',
      'Email',
      'District',
      'Total Orders Count',
      'Total Spent (INR)',
      'Last Order Date',
    ];

    const rows = Array.from(customerMap.values()).map((c) => [
      `"${c.name}"`,
      `"${c.phone}"`,
      `"${c.email}"`,
      `"${c.district}"`,
      c.total_orders,
      c.total_spent,
      c.last_order_date,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return { success: true, csv };
  }
}

export const defaultStoreSettingsService = new StoreSettingsService();
