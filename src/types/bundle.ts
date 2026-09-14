/**
 * Module 15: Core Types for Frequently Bought Together & Cross-Sell Engine
 * 
 * Complies with:
 * - Item 1: Average Order Value (AOV) & basket size expansion.
 * - Item 2: Complementary bundle vs discovery carousel distinction.
 * - Item 6: Compact 2 to 3 item bundle constraints.
 * - Item 21: `product_bundles` & `bundle_items` relational schema.
 * - Item 22: `product_co_purchases` metric data model.
 * - Item 28: `bundle_analytics_log` conversion tracking.
 * - Item 41: Atomic multi-item cart integration.
 */

export interface BundleItem {
  product_id: string;
  title: string;
  title_bn?: string;
  author?: string;
  publisher?: string;
  isbn13?: string;
  cover_image_url: string;
  unit_mrp: number;
  unit_selling_price: number;
  is_primary: boolean;
  is_in_stock: boolean;
  stock_quantity: number;
  rating?: number;
  total_reviews?: number;
  edition?: string;
  category_id?: string;
  subject?: string;
  page_count?: number;
  synopsis?: string;
}

export type BundleSourceType = 'CURATED' | 'ALGORITHMIC' | 'CATEGORY_FALLBACK';
export type BundleDiscountType = 'PERCENTAGE' | 'FLAT';

export interface ProductBundle {
  id: string;
  primary_product_id: string;
  title: string;
  title_bn?: string;
  description?: string;
  items: BundleItem[];
  discount_type: BundleDiscountType;
  discount_value: number; // e.g. 5 for 5% or 50 for flat ₹50
  bundle_source: BundleSourceType;
  is_active: boolean;
  priority_score: number;
  created_at: string;
}

export interface CoPurchaseMetric {
  product_a_id: string;
  product_b_id: string;
  co_purchase_count: number;
  support: number; // e.g. 0.025 = 2.5% of all orders
  confidence: number; // e.g. 0.35 = 35% of orders containing A also contain B
  lift_score: number; // > 1.0 indicates strong positive correlation
  last_calculated_at: string;
}

export interface BundleCalculationResult {
  total_mrp: number;
  total_selling_price: number;
  combo_discount: number;
  final_payable_amount: number;
  total_savings: number;
  button_label: string;
  item_count: number;
  selected_item_ids: string[];
}

export interface BundleAnalyticsEvent {
  id: string;
  bundle_id: string;
  primary_product_id: string;
  event_type: 'IMPRESSION' | 'CLICK' | 'CONVERT';
  item_ids: string[];
  total_amount?: number;
  user_id?: string;
  timestamp: string;
}

export interface AttachRateStats {
  total_pdp_impressions: number;
  total_bundle_clicks: number;
  total_bundle_conversions: number;
  attach_rate_percentage: number; // (total_bundle_conversions / total_orders) * 100
  average_order_value_bundle: number;
  average_order_value_standard: number;
  aov_uplift_percentage: number;
}
