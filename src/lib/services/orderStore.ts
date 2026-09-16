import { supabaseAdmin } from '../supabase/admin';
import { defaultOrderPipelineService } from './orderPipelineService';

/**
 * Unified Order Representation across the entire platform
 * Unifies checkout, merchant pipeline, customer account, and Supabase database.
 */
export interface UnifiedOrderData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  streetAddress: string;
  landmark?: string;
  city: string;
  district: string;
  state: string;
  stateCode: string;
  pincode: string;
  paymentMethod: 'upi' | 'card' | 'netbanking' | 'cod' | 'wallet';
  paymentStatus: 'PAID' | 'COD_COLLECT';
  utrOrRrn?: string;
  itemsSubtotal: number;
  totalPayable: number;
  shippingFee: number;
  couponDiscount: number;
  createdAt: string;
  items: Array<{
    itemId: string;
    title: string;
    titleBn?: string;
    author?: string;
    quantity: number;
    unitPrice: number;
    unitMrp: number;
    hsnCode: string;
  }>;
}

// In-memory cache for live active checkout sessions
const activeOrdersStore = new Map<string, any>();

/**
 * Registers an active order placed during checkout
 */
export function registerActiveOrder(idOrNumber: string, orderData: any): void {
  if (!idOrNumber) return;
  const cleanKey = idOrNumber.replace(/^#/, '').trim().toLowerCase();
  activeOrdersStore.set(cleanKey, orderData);
}

/**
 * Retrieves an active order from checkout cache
 */
export function getActiveOrder(idOrNumber: string): any | null {
  if (!idOrNumber) return null;
  const cleanKey = idOrNumber.replace(/^#/, '').trim().toLowerCase();
  return activeOrdersStore.get(cleanKey) || null;
}

// Seed orders for Customer Account Hub (Items 30-34)
export const DEFAULT_CUSTOMER_ORDERS: UnifiedOrderData[] = [
  {
    orderId: 'MMB-2026-101',
    orderNumber: 'MMB-2026-101',
    customerName: 'অনির্বাণ সেন (Anirban Sen)',
    customerPhone: '+91 98321 01234',
    customerEmail: 'anirban.sen@gmail.com',
    streetAddress: 'রবীন্দ্র এভিনিউ, রথবাড়ি মোড়',
    landmark: 'নেতাজি মূর্তির বিপরীতে',
    city: 'English Bazar',
    district: 'Malda',
    state: 'West Bengal',
    stateCode: '19',
    pincode: '732101',
    paymentMethod: 'upi',
    paymentStatus: 'PAID',
    utrOrRrn: 'UPI/202609051030',
    itemsSubtotal: 620,
    shippingFee: 0,
    couponDiscount: 0,
    totalPayable: 620,
    createdAt: '2026-09-05T10:30:00Z',
    items: [
      {
        itemId: 'b1',
        title: 'Gitanjali (Bengali & English Edition)',
        titleBn: 'গীতাঞ্জলি (বিশেষ সংস্করণ)',
        author: 'Rabindranath Tagore',
        quantity: 1,
        unitPrice: 320,
        unitMrp: 400,
        hsnCode: '4901',
      },
      {
        itemId: 'b2',
        title: 'Feluda Samagra Volume 1',
        titleBn: 'ফেলুদা সমগ্র ১ম খণ্ড',
        author: 'Satyajit Ray',
        quantity: 1,
        unitPrice: 300,
        unitMrp: 380,
        hsnCode: '4901',
      },
    ],
  },
  {
    orderId: 'MMB-2026-102',
    orderNumber: 'MMB-2026-102',
    customerName: 'সৌম্য সরকার (Soumya Sarkar)',
    customerPhone: '+91 97330 11223',
    streetAddress: 'নেতাজি সুভাষ রোড',
    city: 'English Bazar',
    district: 'Malda',
    state: 'West Bengal',
    stateCode: '19',
    pincode: '732101',
    paymentMethod: 'upi',
    paymentStatus: 'PAID',
    itemsSubtotal: 450,
    shippingFee: 0,
    couponDiscount: 0,
    totalPayable: 450,
    createdAt: '2026-09-06T14:20:00Z',
    items: [
      {
        itemId: 'b3',
        title: 'WBCHSE Higher Secondary Physics Guide',
        titleBn: 'উচ্চ মাধ্যমিক পদার্থবিদ্যা সহায়িকা',
        author: 'D. C. Ghosh',
        quantity: 1,
        unitPrice: 450,
        unitMrp: 550,
        hsnCode: '4901',
      },
    ],
  },
  {
    orderId: 'MMB-2026-103',
    orderNumber: 'MMB-2026-103',
    customerName: 'প্রিয়াঙ্কা রায় (Priyanka Roy)',
    customerPhone: '+91 94340 55667',
    streetAddress: 'গৌড় কলেজ মোড়, রাজমহল রোড',
    city: 'English Bazar',
    district: 'Malda',
    state: 'West Bengal',
    stateCode: '19',
    pincode: '732103',
    paymentMethod: 'cod',
    paymentStatus: 'COD_COLLECT',
    itemsSubtotal: 890,
    shippingFee: 0,
    couponDiscount: 0,
    totalPayable: 890,
    createdAt: '2026-09-07T16:45:00Z',
    items: [
      {
        itemId: 'b4',
        title: 'Byomkesh Samagra (Complete Stories)',
        titleBn: 'ব্যোমকেশ সমগ্র (সম্পূর্ণ)',
        author: 'Saradindu Bandyopadhyay',
        quantity: 1,
        unitPrice: 890,
        unitMrp: 1100,
        hsnCode: '4901',
      },
    ],
  },
  {
    orderId: 'MMB-2026-104',
    orderNumber: 'MMB-2026-104',
    customerName: 'কৌশিক মণ্ডল (Kaushik Mondal)',
    customerPhone: '+91 98322 77889',
    streetAddress: 'কোলকাতা বাস স্ট্যান্ড সংলগ্ন',
    city: 'English Bazar',
    district: 'Malda',
    state: 'West Bengal',
    stateCode: '19',
    pincode: '732101',
    paymentMethod: 'cod',
    paymentStatus: 'COD_COLLECT',
    itemsSubtotal: 350,
    shippingFee: 40,
    couponDiscount: 0,
    totalPayable: 390,
    createdAt: '2026-09-08T11:15:00Z',
    items: [
      {
        itemId: 'b5',
        title: 'Bengali Grammar & Composition',
        titleBn: 'বাংলা ব্যাকরণ ও রচনা',
        author: 'B. Bhattacharya',
        quantity: 1,
        unitPrice: 350,
        unitMrp: 420,
        hsnCode: '4901',
      },
    ],
  },
];

/**
 * Searches in-memory stores (Active checkout cache, Customer Orders, Seller Central Pipeline)
 */
export function findInMemoryOrder(idOrNumber: string): UnifiedOrderData | null {
  if (!idOrNumber) return null;
  const q = idOrNumber.replace(/^#/, '').trim().toLowerCase();

  // 1. Check Active Checkout Cache
  const active = activeOrdersStore.get(q);
  if (active) {
    const snap = active.shippingAddressSnapshot || active.shipping_address_snapshot || {};
    const items = (active.items || active.order_items || []).map((it: any, idx: number) => ({
      itemId: it.bookId || it.id || it.variant_id || `item_${idx + 1}`,
      title: it.title || it.book_title || 'বই',
      titleBn: it.titleBn || it.book_title_bn,
      author: it.author || it.author_name || 'M.M. Editorial',
      quantity: it.quantity || 1,
      unitPrice: Number(it.price || it.unit_selling_price || 0),
      unitMrp: Number(it.mrp || it.unit_mrp || Math.round((it.price || 300) * 1.25)),
      hsnCode: '4901',
    }));

    const isCod = (active.paymentMethod || active.payment_method) === 'cod';
    return {
      orderId: active.orderId || active.id || idOrNumber,
      orderNumber: active.orderNumber || active.order_number || idOrNumber,
      customerName: snap.recipient_name || 'সম্মানিত ক্রেতা (Valued Customer)',
      customerPhone: snap.recipient_phone || '+91 98321 00000',
      customerEmail: snap.recipient_email,
      streetAddress: snap.street_address || 'নেতাজি সুভাষ রোড, ইংরেজবাজার',
      landmark: snap.landmark,
      city: snap.city || 'মালদা',
      district: snap.district || snap.city || 'Malda',
      state: snap.state || 'West Bengal',
      stateCode: '19',
      pincode: snap.pincode || '732101',
      paymentMethod: (active.paymentMethod || active.payment_method || 'upi') as any,
      paymentStatus: isCod ? 'COD_COLLECT' : 'PAID',
      utrOrRrn: active.utr,
      itemsSubtotal: Number(active.pricing?.itemsSubtotal || active.total_items_price || 0),
      shippingFee: Number(active.pricing?.totalShippingFee || active.delivery_fee || 0),
      couponDiscount: Number(active.pricing?.couponDiscount || active.discount_amount || 0),
      totalPayable: Number(active.pricing?.finalPayable || active.total_payable_amount || 0),
      createdAt: active.createdAt || active.created_at || new Date().toISOString(),
      items,
    };
  }

  // 2. Check Customer Account default orders
  const foundCust = DEFAULT_CUSTOMER_ORDERS.find(
    (o) => o.orderId.toLowerCase() === q || o.orderNumber.toLowerCase() === q
  );
  if (foundCust) return foundCust;

  // 3. Check Merchant Seller Central Order Pipeline
  const pipelineOrder = defaultOrderPipelineService.getOrderById(idOrNumber);
  if (pipelineOrder) {
    return {
      orderId: pipelineOrder.order_id,
      orderNumber: pipelineOrder.order_number,
      customerName: pipelineOrder.customer_name,
      customerPhone: pipelineOrder.customer_phone,
      customerEmail: pipelineOrder.customer_email,
      streetAddress: pipelineOrder.shipping_address_text,
      city: pipelineOrder.district || 'Malda',
      district: pipelineOrder.district || 'Malda',
      state: 'West Bengal',
      stateCode: '19',
      pincode: pipelineOrder.pincode || '732101',
      paymentMethod: (pipelineOrder.payment_mode?.toLowerCase() as any) || 'upi',
      paymentStatus: pipelineOrder.payment_mode === 'COD' ? 'COD_COLLECT' : 'PAID',
      itemsSubtotal: pipelineOrder.total_amount,
      shippingFee: pipelineOrder.customer_delivery_fee || 0,
      couponDiscount: 0,
      totalPayable: pipelineOrder.total_amount,
      createdAt: pipelineOrder.created_at,
      items: pipelineOrder.items.map((it, idx) => ({
        itemId: it.book_id || `book_${idx + 1}`,
        title: it.title,
        quantity: it.quantity,
        unitPrice: it.unit_price,
        unitMrp: Math.round(it.unit_price * 1.2),
        hsnCode: '4901',
      })),
    };
  }

  // Also check pipeline search
  const pipelineSearchResults = defaultOrderPipelineService.searchOrders(idOrNumber);
  if (pipelineSearchResults.length > 0) {
    const pOrder = pipelineSearchResults[0];
    return {
      orderId: pOrder.order_id,
      orderNumber: pOrder.order_number,
      customerName: pOrder.customer_name,
      customerPhone: pOrder.customer_phone,
      customerEmail: pOrder.customer_email,
      streetAddress: pOrder.shipping_address_text,
      city: pOrder.district || 'Malda',
      district: pOrder.district || 'Malda',
      state: 'West Bengal',
      stateCode: '19',
      pincode: pOrder.pincode || '732101',
      paymentMethod: (pOrder.payment_mode?.toLowerCase() as any) || 'upi',
      paymentStatus: pOrder.payment_mode === 'COD' ? 'COD_COLLECT' : 'PAID',
      itemsSubtotal: pOrder.total_amount,
      shippingFee: pOrder.customer_delivery_fee || 0,
      couponDiscount: 0,
      totalPayable: pOrder.total_amount,
      createdAt: pOrder.created_at,
      items: pOrder.items.map((it, idx) => ({
        itemId: it.book_id || `book_${idx + 1}`,
        title: it.title,
        quantity: it.quantity,
        unitPrice: it.unit_price,
        unitMrp: Math.round(it.unit_price * 1.2),
        hsnCode: '4901',
      })),
    };
  }

  return null;
}

/**
 * Checks PostgreSQL Supabase Database for live orders (orders + order_items)
 */
export async function findSupabaseOrder(idOrNumber: string): Promise<UnifiedOrderData | null> {
  if (!idOrNumber) return null;
  const clean = idOrNumber.replace(/^#/, '').trim();

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);
    let query = supabaseAdmin.from('orders').select('*, order_items(*)');

    if (isUuid) {
      query = query.eq('id', clean);
    } else {
      query = query.or(`order_number.eq.${clean},id.eq.${clean}`);
    }

    const { data: order, error } = await query.maybeSingle();
    if (!order || error) {
      return null;
    }

    const snap = (order.shipping_address_snapshot || {}) as any;
    const items = (order.order_items || []).map((oi: any, idx: number) => ({
      itemId: oi.variant_id || oi.id || `item_${idx + 1}`,
      title: oi.book_title || 'বই',
      titleBn: oi.book_title_bn,
      author: 'M.M Book House Editorial',
      quantity: oi.quantity || 1,
      unitPrice: Number(oi.unit_selling_price || 0),
      unitMrp: Number(oi.unit_mrp || oi.unit_selling_price || 0),
      hsnCode: '4901',
    }));

    const isCod = order.payment_method === 'cod';

    return {
      orderId: order.id,
      orderNumber: order.order_number || order.id,
      customerName: snap.recipient_name || 'সম্মানিত ক্রেতা (Valued Customer)',
      customerPhone: snap.recipient_phone || '+91 98321 00000',
      customerEmail: snap.recipient_email,
      streetAddress: snap.street_address || 'নেতাজি সুভাষ রোড, ইংরেজবাজার',
      landmark: snap.landmark,
      city: snap.city || 'English Bazar',
      district: snap.district || snap.city || 'Malda',
      state: snap.state || 'West Bengal',
      stateCode: '19',
      pincode: snap.pincode || '732101',
      paymentMethod: (order.payment_method || 'upi') as any,
      paymentStatus: isCod ? 'COD_COLLECT' : 'PAID',
      itemsSubtotal: Number(order.total_items_price || 0),
      shippingFee: Number(order.delivery_fee || 0),
      couponDiscount: Number(order.discount_amount || 0),
      totalPayable: Number(order.total_payable_amount || 0),
      createdAt: order.created_at || new Date().toISOString(),
      items,
    };
  } catch (err) {
    console.warn('Supabase order retrieval error (fallback to local stores):', err);
    return null;
  }
}
