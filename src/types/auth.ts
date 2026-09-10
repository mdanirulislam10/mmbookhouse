export type OtpDeliveryChannel = 'sms' | 'whatsapp';

export type OtpVerificationState =
  | 'idle'
  | 'sending'
  | 'sent'
  | 'verifying'
  | 'verified'
  | 'error'
  | 'locked';

export type CustomerExamPreference =
  | 'wbcs'
  | 'ugb'
  | 'primary_tet'
  | 'wb_police'
  | 'ssc_csl'
  | 'railway'
  | 'madhyamik'
  | 'higher_secondary'
  | 'general';

export interface RateLimitState {
  remainingCooldownSeconds: number;
  attemptsLeft: number;
  isLocked: boolean;
  lockRemainingMinutes: number;
}

export interface UserProfile {
  id: string;
  fullName: string;
  phoneNumber: string;
  altPhoneNumber?: string;
  email?: string;
  isEmailVerified?: boolean;
  avatarUrl?: string;
  role: 'customer' | 'merchant' | 'admin' | 'pos_staff';
  examPreferences: CustomerExamPreference[];
  gstin?: string;
  businessName?: string;
  institutionType?: 'coaching_center' | 'school_college' | 'library' | 'bookstore_reseller' | 'other_enterprise';
  whatsappOptIn: boolean;
  promoNotificationEnabled: boolean;
  notificationPreferences?: GranularNotificationPreferences;
  securityPasswordSet?: boolean;
  referralCode: string;
  referralPoints: number;
  createdAt: string;
  updatedAt: string;
}

export interface GranularNotificationPreferences {
  transactionalSms: boolean; // Always true for OTP & orders
  transactionalEmail: boolean; // Always true for invoices
  promotionalSms: boolean;
  promotionalEmail: boolean;
  promotionalWhatsApp: boolean;
  priceDropAlerts: boolean;
  examSyllabusUpdates: boolean;
}

export interface WebOtpCredential {
  code?: string;
  type?: string;
}

export interface DeviceSession {
  id: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  location: string;
  ipAddress: string;
  lastActive: string;
  isCurrentDevice: boolean;
}

// Task 30: DPDP Act 2023 Compliance & Consent Architecture
export type ConsentPurpose =
  | 'essential_auth'
  | 'order_delivery'
  | 'whatsapp_notifications'
  | 'promotional_updates';

export interface DpdpConsentRecord {
  purpose: ConsentPurpose;
  isGranted: boolean;
  timestamp: string;
  consentNoticeVersion: string;
}

export interface DataErasureRequest {
  id: string;
  userId: string;
  phoneNumber: string;
  status: 'pending' | 'otp_verified' | 'completed';
  requestedAt: string;
  completedAt?: string;
  retentionNotes: string;
}

export interface DpoGrievanceContact {
  name: string;
  designation: string;
  email: string;
  phone: string;
  address: string;
  grievanceSlaHours: number;
}

// Task 39: DPDP Act 2023 Section 11 Data Portability Architecture
export interface CustomerPortableData {
  exportMetadata: {
    exportId: string;
    generatedAt: string;
    legalFramework: string;
    dataFiduciary: {
      name: string;
      brand: string;
      dpo: DpoGrievanceContact;
    };
  };
  profile: UserProfile;
  examPreferences: Array<{
    code: CustomerExamPreference;
    nameBn: string;
    nameEn: string;
    taglineBn?: string;
  }>;
  businessGst: {
    gstin?: string;
    businessName?: string;
    institutionType?: string;
    stateName?: string;
    pan?: string;
    isVerified: boolean;
  } | null;
  savedAddresses: Array<{
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
  }>;
  orderHistory: Array<{
    orderId: string;
    date: string;
    status: string;
    statusCode: string;
    totalAmount: number;
    items: Array<{
      title: string;
      qty: number;
      price: number;
    }>;
    deliveryAddress: string;
  }>;
  dpdpConsents: Record<ConsentPurpose, DpdpConsentRecord>;
  activeSessions: DeviceSession[];
  notificationPreferences?: GranularNotificationPreferences;
}

