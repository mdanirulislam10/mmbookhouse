export type FulfillmentMode = 'delivery' | 'pickup';

export type UserRole = 'customer' | 'merchant' | 'admin' | 'pos_staff' | 'seller' | 'pos_operator';

export type AppLanguage = 'bn' | 'en';

export interface AuthProfile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  isLoggedIn: boolean;
}

export interface DeliveryLocationState {
  pincode: string;
  area: string;
  district: string;
  state: string;
  isDetecting: boolean;
  source: 'default' | 'ip' | 'user_input' | 'user_profile';
  customerName?: string;
  fulfillmentMode: FulfillmentMode;
}

export interface PincodeInfo {
  pincode: string;
  area: string;
  district: string;
  state: string;
  isDeliverable: boolean;
  isCodAvailable: boolean;
  estimatedDeliveryText: string;
}

export interface UserAddress {
  id: string;
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  addressType: 'home' | 'work' | 'other';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'order_status' | 'stock_alert' | 'deal' | 'system';
  createdAt: string;
  isRead: boolean;
  actionUrl?: string;
  badgeText?: string;
}

export interface StoreNotice {
  id: string;
  message: string;
  messageBn: string;
  type: 'emergency' | 'holiday' | 'offer';
  isActive: boolean;
  linkText?: string;
  linkUrl?: string;
}

export interface BulkQuoteRequest {
  institutionName: string;
  contactPerson: string;
  phone: string;
  email?: string;
  category: string;
  estimatedCopies: number;
  notes?: string;
}

export interface CartItem {
  id: string;
  bookId: string;
  title: string;
  titleBn: string;
  author: string;
  price: number;
  mrp: number;
  quantity: number;
  coverImage?: string;
  variantId?: string;
  maxQuantity?: number;
}

