/** Shapes returned by our Postgres views / RPCs (numbers are already numbers over PostgREST). */

export interface BookCard {
  id: string;
  slug: string;
  title: string;
  title_bn: string | null;
  cover_url: string | null;
  mrp: number;
  price: number;
  discount_pct: number;
  rating_avg: number;
  rating_count: number;
  in_stock: boolean;
  low_stock: boolean;
  on_hand: number;
  author_names: string | null;
  author_names_bn: string | null;
  publisher_name: string | null;
  language: string;
  deal_ends_at: string | null;
}

export interface SearchRow extends BookCard {
  total_count: number;
}

export interface Category {
  id: string;
  parent_id: string | null;
  slug: string;
  name: string;
  name_bn: string | null;
  image_url: string | null;
  sort_order: number;
  show_on_home: boolean;
}

export interface CategoryNode extends Category {
  children: CategoryNode[];
}

export interface Banner {
  id: string;
  placement: "hero" | "strip";
  title: string;
  title_bn: string | null;
  subtitle: string | null;
  subtitle_bn: string | null;
  image_url: string | null;
  mobile_image_url: string | null;
  link_url: string | null;
  cta_label: string | null;
  cta_label_bn: string | null;
  bg_color: string | null;
  sort_order: number;
}

export interface Address {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  district: string | null;
  state: string;
  pincode: string;
  is_default: boolean;
}

export interface DeliveryQuote {
  rule_id: string;
  label: string;
  label_bn: string | null;
  fee: number;
  eta_min_days: number;
  eta_max_days: number;
  cod_available: boolean;
}

export type OrderStatus = "pending" | "confirmed" | "processing" | "ready" | "dispatched" | "delivered" | "cancelled" | "returned";
export type PaymentStatus = "unpaid" | "pending_verification" | "paid" | "failed" | "refunded";

export interface OrderRow {
  id: string;
  order_no: string;
  user_id: string | null;
  status: OrderStatus;
  channel: "online" | "pos";
  payment_method: "cod" | "upi" | "online" | "cash";
  payment_status: PaymentStatus;
  fulfillment: "delivery" | "pickup";
  subtotal: number;
  discount_total: number;
  delivery_fee: number;
  total: number;
  coupon_code: string | null;
  customer_email: string | null;
  ship_name: string;
  ship_phone: string;
  ship_line1: string | null;
  ship_line2: string | null;
  ship_landmark: string | null;
  ship_city: string | null;
  ship_district: string | null;
  ship_state: string | null;
  ship_pincode: string | null;
  notes: string | null;
  pickup_otp: string | null;
  courier_name: string | null;
  awb: string | null;
  tracking_url: string | null;
  cancel_reason: string | null;
  placed_at: string;
  updated_at: string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  book_id: string | null;
  title: string;
  slug: string | null;
  isbn: string | null;
  cover_url: string | null;
  unit_price: number;
  mrp: number;
  qty: number;
  line_total: number;
}

export interface OrderEventRow {
  id: number;
  order_id: string;
  status: string;
  note: string | null;
  created_at: string;
}

export interface StoreProfile {
  name: string;
  name_bn: string;
  tagline: string;
  tagline_bn: string;
  address: string;
  address_bn: string;
  pincode: string;
  phone: string;
  whatsapp: string;
  email: string;
  hours: string;
}

export interface NoticeBar {
  enabled: boolean;
  text: string;
  text_bn: string;
  href: string;
}

export interface MaintenanceSetting {
  enabled: boolean;
  message: string;
  message_bn: string;
}

export interface PaymentSettings {
  cod_enabled: boolean;
  cod_max_order: number;
  upi_enabled: boolean;
  upi_id: string;
  upi_payee_name: string;
}

export interface CheckoutSettings {
  pickup_enabled: boolean;
  pickup_address: string;
  max_qty_per_item: number;
}

export interface PublicSettings {
  store_profile: StoreProfile;
  notice_bar: NoticeBar;
  maintenance: MaintenanceSetting;
  payment: PaymentSettings;
  checkout: CheckoutSettings;
}

export type StaffRole = "super_admin" | "inventory_manager" | "dispatch_staff";
