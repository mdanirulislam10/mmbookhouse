import {
  AdminOrderSummary,
  OrderPipelineStatus,
  DispatchManifest,
} from '../../types/sellerCentral';
import { defaultQueueService } from './notificationQueueService';

/**
 * Module 19: Order Dispatch Pipeline, Handover Manifest & Store Pickup Service
 * 
 * Complies with:
 * - Item 21: 4 Visual Dispatch Pipeline Tabs (Pending -> Processing -> Ready for Pickup -> Handed Over)
 * - Item 23: Smart Packing Slip Checklist (A5 with Rack Locations)
 * - Item 24: 1-Click "Request Courier Pickup" (Delhivery / Shiprocket API)
 * - Item 25: Daily Dispatch Handover Manifest Sheet
 * - Item 26: Super-Fast Global Multi-Field Search (Name, Phone, Order #, AWB)
 * - Item 27: Counter Store Pickup 4-Digit OTP Verification
 */

export class OrderPipelineService {
  private orders: Map<string, AdminOrderSummary> = new Map();

  constructor() {
    this.seedInitialOrders();
  }

  private seedInitialOrders() {
    const seedOrders: AdminOrderSummary[] = [
      {
        order_id: 'ord_malda_101',
        order_number: 'MMB-9021',
        customer_name: 'অমল কুমার দাস',
        customer_phone: '+919832112233',
        customer_email: 'amal.das@gmail.com',
        shipping_address_text: 'রবীন্দ্র এভিনিউ, নেতাজি সুভাষ রোড, মালদা, পশ্চিমবঙ্গ',
        district: 'Malda',
        pincode: '732101',
        items: [
          {
            book_id: 'book_wbcs_001',
            title: 'WBCS Preliminary General Studies Scanner 2026',
            sku: 'WBCS-SCAN-2026',
            rack_location: 'Rack A-2, Shelf 1',
            quantity: 1,
            unit_price: 520,
            wholesale_cost: 380,
          },
        ],
        total_amount: 520,
        payment_mode: 'UPI',
        payment_status: 'PAID',
        pipeline_status: 'pending',
        is_counter_pickup: false,
        courier_pickup_requested: false,
        customer_delivery_fee: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        order_id: 'ord_malda_102',
        order_number: 'MMB-9022',
        customer_name: 'সৌমেন অধিকারী',
        customer_phone: '+919832445566',
        shipping_address_text: 'এম.এম বুক হাউস মালদা শপ কাউন্টার',
        district: 'Malda',
        pincode: '732101',
        items: [
          {
            book_id: 'book_madh_002',
            title: 'Madhyamik All In One Suggestion 2026',
            sku: 'MADH-TEST-2026',
            rack_location: 'Rack B-1, Shelf 4',
            quantity: 2,
            unit_price: 350,
            wholesale_cost: 240,
          },
        ],
        total_amount: 700,
        payment_mode: 'Store Pickup Cash',
        payment_status: 'PENDING',
        pipeline_status: 'ready_for_pickup',
        is_counter_pickup: true,
        counter_pickup_otp: '7821', // Secret 4-digit OTP
        courier_pickup_requested: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        order_id: 'ord_murshidabad_103',
        order_number: 'MMB-9023',
        customer_name: 'প্রিয়াঙ্কা ভট্টাচার্য',
        customer_phone: '+919832778899',
        shipping_address_text: 'বহরমপুর টেক্সটাইল মোড়, মুর্শিদাবাদ',
        district: 'Murshidabad',
        pincode: '742101',
        items: [
          {
            book_id: 'book_hist_003',
            title: 'Bharatbarsher Itihas (Ancient India)',
            sku: 'HIST-HON-003',
            rack_location: 'Rack C-3, Shelf 2',
            quantity: 1,
            unit_price: 495,
            wholesale_cost: 350,
          },
        ],
        total_amount: 545,
        payment_mode: 'COD',
        payment_status: 'PENDING',
        pipeline_status: 'ready_for_pickup',
        is_counter_pickup: false,
        courier_name: 'Delhivery',
        awb_code: 'DEL-99023412',
        courier_pickup_requested: true,
        courier_freight_cost: 65,
        packaging_cost: 15,
        customer_delivery_fee: 50,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    seedOrders.forEach((o) => this.orders.set(o.order_id, o));
  }

  public getOrderById(orderId: string): AdminOrderSummary | null {
    return this.orders.get(orderId) || null;
  }

  /**
   * Item 21: Transition order along the visual dispatch pipeline
   */
  public updatePipelineStatus(
    orderId: string,
    newStatus: OrderPipelineStatus,
    metadata?: { awb_code?: string; courier_name?: string }
  ): { success: boolean; order?: AdminOrderSummary; error?: string } {
    const order = this.orders.get(orderId);
    if (!order) {
      return { success: false, error: 'অর্ডারটি খুঁজে পাওয়া যায়নি' };
    }

    order.pipeline_status = newStatus;
    if (metadata?.awb_code) order.awb_code = metadata.awb_code;
    if (metadata?.courier_name) order.courier_name = metadata.courier_name;
    order.updated_at = new Date().toISOString();

    // Trigger transactional notification update via Module 18 engine
    if (newStatus === 'processing') {
      defaultQueueService.enqueueNotification({
        order_id: order.order_id,
        recipient_name: order.customer_name,
        phone_number: order.customer_phone,
        trigger: 'order_packed',
        template_name: 'mmbook_order_packed_bn_v1',
        variables: {
          customer_name: order.customer_name,
          order_id: order.order_number,
          book_titles: order.items.map((i) => i.title).join(', '),
        },
      });
    } else if (newStatus === 'handed_over' && order.awb_code) {
      defaultQueueService.enqueueNotification({
        order_id: order.order_id,
        recipient_name: order.customer_name,
        phone_number: order.customer_phone,
        trigger: 'order_shipped',
        template_name: 'mmbook_order_shipped_bn_v1',
        variables: {
          customer_name: order.customer_name,
          order_id: order.order_number,
          courier_name: order.courier_name || 'Delhivery',
          awb_code: order.awb_code,
        },
      });
    }

    return { success: true, order };
  }

  /**
   * Item 23: Smart Packing Slip Checklist Generator (A5 format with rack locations)
   */
  public generatePackingSlip(orderId: string): {
    order_number: string;
    customer_name: string;
    customer_phone: string;
    shipping_address: string;
    items_checklist: Array<{
      book_id: string;
      title: string;
      sku: string;
      rack_location: string;
      quantity: number;
      checked: boolean;
    }>;
  } | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    return {
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      shipping_address: order.shipping_address_text,
      items_checklist: order.items.map((item) => ({
        book_id: item.book_id,
        title: item.title,
        sku: item.sku,
        rack_location: item.rack_location || 'Rack General',
        quantity: item.quantity,
        checked: false,
      })),
    };
  }

  /**
   * Item 24: 1-Click "Request Courier Pickup" (Delhivery / Shiprocket API trigger)
   */
  public requestCourierPickup(
    orderIds: string[],
    courierName = 'Delhivery'
  ): {
    success: boolean;
    pickup_token: string;
    scheduled_orders_count: number;
    scheduled_orders: string[];
  } {
    const scheduled: string[] = [];

    for (const id of orderIds) {
      const order = this.orders.get(id);
      if (order && !order.is_counter_pickup) {
        order.courier_pickup_requested = true;
        order.courier_name = courierName;
        if (!order.awb_code) {
          order.awb_code = `${courierName.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
        }
        if (order.pipeline_status === 'processing' || order.pipeline_status === 'pending') {
          order.pipeline_status = 'ready_for_pickup';
        }
        order.updated_at = new Date().toISOString();
        scheduled.push(order.order_number);
      }
    }

    const pickupToken = `PKUP_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    return {
      success: true,
      pickup_token: pickupToken,
      scheduled_orders_count: scheduled.length,
      scheduled_orders: scheduled,
    };
  }

  /**
   * Item 25: Daily Dispatch Handover Manifest Sheet
   */
  public generateDailyManifest(courierName = 'Delhivery'): DispatchManifest {
    const manifestOrders: DispatchManifest['orders'] = [];

    for (const order of this.orders.values()) {
      if (
        (order.pipeline_status === 'ready_for_pickup' || order.pipeline_status === 'handed_over') &&
        order.courier_name === courierName &&
        !order.is_counter_pickup
      ) {
        manifestOrders.push({
          order_id: order.order_id,
          order_number: order.order_number,
          awb: order.awb_code || 'N/A',
          recipient_name: order.customer_name,
          phone: order.customer_phone,
          cod_amount: order.payment_mode === 'COD' ? order.total_amount : 0,
        });
      }
    }

    return {
      manifest_id: `MNFST_${Date.now().toString().slice(-6)}`,
      manifest_date: new Date().toISOString().split('T')[0],
      courier_name: courierName,
      total_parcels: manifestOrders.length,
      orders: manifestOrders,
      driver_name: '',
      driver_phone: '',
    };
  }

  /**
   * Item 26: Super-Fast Global Multi-Field Search
   * Searches by customer name, 10-digit phone, order #, or AWB tracking code
   */
  public searchOrders(query: string, status?: OrderPipelineStatus): AdminOrderSummary[] {
    const q = query.trim().toLowerCase();
    const cleanPhone = q.replace(/[-\s]/g, '');

    return Array.from(this.orders.values()).filter((order) => {
      const matchStatus = !status || order.pipeline_status === status;
      if (!matchStatus) return false;

      if (!q) return true;

      return (
        order.order_id.toLowerCase().includes(q) ||
        order.customer_name.toLowerCase().includes(q) ||
        order.order_number.toLowerCase().includes(q) ||
        order.customer_phone.includes(cleanPhone) ||
        (order.awb_code && order.awb_code.toLowerCase().includes(q))
      );
    });
  }

  /**
   * Item 27: Counter Store Pickup (Click & Collect) 4-Digit OTP Verification Modal
   * Handover is completed upon typing the correct 4-digit customer OTP
   */
  public verifyCounterPickupOtp(
    orderId: string,
    inputOtp: string
  ): { success: boolean; order?: AdminOrderSummary; error?: string } {
    const order = this.orders.get(orderId);
    if (!order) {
      return { success: false, error: 'অর্ডারটি খুঁজে পাওয়া যায়নি' };
    }

    if (!order.is_counter_pickup) {
      return { success: false, error: 'এই অর্ডারটি হোম ডেলিভারির জন্য নির্ধারিত, কাউন্টার পিকআপ নয়' };
    }

    if (order.pipeline_status === 'delivered') {
      return { success: false, error: 'অর্ডারটি ইতিমধ্যে ডেলিভার্ড হয়ে গেছে' };
    }

    if (order.counter_pickup_otp !== inputOtp.trim()) {
      return { success: false, error: 'ভুল ওটিপি! অনুগ্রহ করে গ্রাহকের ৪-সংখ্যার গোপন ওটিপি পরীক্ষা করুন।' };
    }

    // OTP matched: update to delivered & paid
    order.pipeline_status = 'delivered';
    order.payment_status = 'PAID';
    order.updated_at = new Date().toISOString();

    // Trigger instant delivered confirmation notification
    defaultQueueService.enqueueNotification({
      order_id: order.order_id,
      recipient_name: order.customer_name,
      phone_number: order.customer_phone,
      trigger: 'order_delivered',
      template_name: 'mmbook_order_delivered_bn_v1',
      variables: {
        customer_name: order.customer_name,
        order_id: order.order_number,
      },
    });

    return { success: true, order };
  }

  /**
   * Get counts of orders in each pipeline status
   */
  public getPipelineCounts(): Record<OrderPipelineStatus, number> {
    const counts: Record<OrderPipelineStatus, number> = {
      pending: 0,
      processing: 0,
      ready_for_pickup: 0,
      handed_over: 0,
      delivered: 0,
      rto_returned: 0,
      cancelled: 0,
    };

    for (const o of this.orders.values()) {
      if (counts[o.pipeline_status] !== undefined) {
        counts[o.pipeline_status]++;
      }
    }

    return counts;
  }
}

export const defaultOrderPipelineService = new OrderPipelineService();
