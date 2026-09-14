import { NotificationTrigger, WhatsAppButton } from '../../types/notifications';

/**
 * Module 18: Notification Template Service & Phone Sanitizer
 * M.M Book House Malda - Automated Transactional Engine
 * 
 * Complies with:
 * - Item 4: TRAI DLT Compliant SMS (Header MMBOOK, DLT IDs)
 * - Item 5: WhatsApp Interactive Buttons (Quick Reply & URL CTAs)
 * - Item 7: Dynamic URL Shortener generation
 * - Item 10: E.164 Phone Sanitizer (+91)
 * - Items 11-20: 10 Core Transactional Triggers with Bengali copy & emojis
 * - Item 46: DPDP Act 2023 Phone Number Masking (+91 9832***456)
 */

export interface PhoneSanitizeResult {
  valid: boolean;
  formatted: string; // E.164 (e.g. +919832123456)
  masked: string;    // Privacy masked (e.g. +91 9832***456)
  error?: string;
}

/**
 * Normalizes any Indian phone number into E.164 format (+919832XXXXXX)
 */
export function sanitizePhoneNumberE164(input: string): PhoneSanitizeResult {
  if (!input || typeof input !== 'string') {
    return {
      valid: false,
      formatted: '',
      masked: '',
      error: 'ফোন নম্বর প্রদান করা হয়নি',
    };
  }

  // Remove spaces, hyphens, parentheses, periods
  let cleaned = input.trim().replace(/[\s\-\(\)\.]/g, '');

  // Strip leading '+' if present for unified parsing
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Strip leading '91' if length is 12
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    // Strip leading '0' if length is 11
    cleaned = cleaned.substring(1);
  }

  // Now cleaned should be exactly 10 digits starting with 6, 7, 8, or 9
  if (!/^[6-9]\d{9}$/.test(cleaned)) {
    return {
      valid: false,
      formatted: '',
      masked: '',
      error: 'অবৈধ মোবাইল নম্বর। সঠিক ১০ সংখ্যার ভারতীয় নম্বর প্রদান করুন (যেমন: 9832123456)।',
    };
  }

  const formatted = `+91${cleaned}`;
  const masked = maskPhoneNumber(formatted);

  return {
    valid: true,
    formatted,
    masked,
  };
}

/**
 * Masks phone number for DPDP Act 2023 compliance (+91 9832***456)
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 13) return phone;
  // +919832123456 -> +91 9832***456
  const country = phone.substring(0, 3);
  const firstFour = phone.substring(3, 7);
  const lastThree = phone.substring(10);
  return `${country} ${firstFour}***${lastThree}`;
}

export interface TemplateDefinition {
  trigger: NotificationTrigger;
  templateNameWhatsApp: string;
  dltTemplateId: string;
  dltHeader: string;
  titleBn: string;
  renderWhatsApp: (vars: Record<string, string | number>) => string;
  renderSms: (vars: Record<string, string | number>) => string;
  defaultButtons: (vars: Record<string, string | number>) => WhatsAppButton[];
}

export const DLT_SENDER_HEADER = 'MMBOOK';
export const DLT_PRINCIPAL_ENTITY_ID = '1701158291000010482';

export const NOTIFICATION_TEMPLATES: Record<NotificationTrigger, TemplateDefinition> = {
  // 1. Order Confirmed
  order_confirmed: {
    trigger: 'order_confirmed',
    templateNameWhatsApp: 'mmbook_order_confirmed_bn_v1',
    dltTemplateId: '1007161200000192801',
    dltHeader: DLT_SENDER_HEADER,
    titleBn: '🛍️ অর্ডার কনফার্মড!',
    renderWhatsApp: (vars) => 
`🛍️ *অর্ডার কনফার্মড! - M.M Book House Malda*

নমস্কার ${vars.customer_name || 'গ্রাহক'},
আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে! 📚

📦 *অর্ডার আইডি:* #${vars.order_id}
💰 *মোট মূল্য:* ₹${vars.total_amount}
💳 *পেমেন্ট মোড:* ${vars.payment_mode || 'অনলাইন/COD'}
📍 *ডেলিভারি ঠিকানা:* ${vars.delivery_address || 'আপনার নিবন্ধিত ঠিকানা'}

আমরা বইটি প্যাকিংয়ের কাজ শুরু করেছি। কুরিয়ারে হ্যান্ডওভার হলে আপনাকে ট্র্যাকিং লিঙ্ক পাঠানো হবে।`,
    renderSms: (vars) =>
`MMBOOK: প্রিয় ${vars.customer_name}, আপনার অর্ডার #${vars.order_id} (মূল্য: Rs.${vars.total_amount}) নিশ্চিত হয়েছে। ট্র্যাক করুন: mmbook.in/t/${vars.order_id} - M.M Book House`,
    defaultButtons: (vars) => [
      {
        type: 'url',
        label: '📦 ট্র্যাক করুন',
        url: `https://mmbook.in/account/orders/${vars.order_id || ''}`,
      },
    ],
  },

  // 2. COD Verification
  cod_verification: {
    trigger: 'cod_verification',
    templateNameWhatsApp: 'mmbook_cod_verify_bn_v1',
    dltTemplateId: '1007161200000192802',
    dltHeader: DLT_SENDER_HEADER,
    titleBn: '⚠️ COD অর্ডার যাচাইকরণ',
    renderWhatsApp: (vars) =>
`⚠️ *ক্যাশ অন ডেলিভারি (COD) অর্ডার নিশ্চিতকরণ*

প্রিয় ${vars.customer_name || 'গ্রাহক'},
M.M Book House-এ আপনার ₹${vars.total_amount} মূল্যের COD অর্ডার #${vars.order_id} প্লেস করা হয়েছে।

পার্সেলটি মালদা শপ থেকে আপনার ঠিকানায় পাঠাতে অনুগ্রহ করে নিচের বাটনে চাপ দিয়ে অর্ডারটি ১-ট্যাপে নিশ্চিত করুন। 

_ভুলবশত অর্ডার করে থাকলে বাতিল করতে পারেন।_`,
    renderSms: (vars) =>
`MMBOOK: প্রিয় ${vars.customer_name}, আপনার COD অর্ডার #${vars.order_id} (Rs.${vars.total_amount}) নিশ্চিত করতে ভিজিট করুন: mmbook.in/cod/${vars.order_id} - M.M Book House`,
    defaultButtons: (vars) => [
      {
        type: 'quick_reply',
        label: '✔ হ্যাঁ, অর্ডার নিশ্চিত করুন',
        payload: `CONFIRM_COD_${vars.order_id}`,
      },
      {
        type: 'quick_reply',
        label: '❌ অর্ডার বাতিল করুন',
        payload: `CANCEL_COD_${vars.order_id}`,
      },
    ],
  },

  // 3. Order Packed & Ready
  order_packed: {
    trigger: 'order_packed',
    templateNameWhatsApp: 'mmbook_order_packed_bn_v1',
    dltTemplateId: '1007161200000192803',
    dltHeader: DLT_SENDER_HEADER,
    titleBn: '📦 পার্সেল প্যাক সম্পন্ন!',
    renderWhatsApp: (vars) =>
`📦 *বই প্যাকিং সম্পন্ন হয়েছে!*

প্রিয় ${vars.customer_name || 'গ্রাহক'},
আপনার অর্ডার #${vars.order_id}-এর বইগুলো ওয়াটারপ্রুফ বাব্ল র‍্যাপ সহ যত্নসহকারে প্যাক করা হয়েছে। 

📚 *বইসমূহ:* ${vars.book_titles || 'অর্ডারকৃত বইসমূহ'}
🏪 *শাখা:* রবীন্দ্র এভিনিউ, মালদা

আজই আমাদের কুরিয়ার পার্টনারের নিকট পার্সেলটি হ্যান্ডওভার করা হবে।`,
    renderSms: (vars) =>
`MMBOOK: আপনার অর্ডার #${vars.order_id} ওয়াটারপ্রুফ প্যাক সম্পন্ন হয়েছে এবং কুরিয়ার হ্যান্ডওভারের অপেক্ষায় রয়েছে। - M.M Book House Malda`,
    defaultButtons: (vars) => [
      {
        type: 'url',
        label: '📦 অর্ডার স্ট্যাটাস',
        url: `https://mmbook.in/account/orders/${vars.order_id || ''}`,
      },
    ],
  },

  // 4. Order Shipped & Courier AWB Live Tracking
  order_shipped: {
    trigger: 'order_shipped',
    templateNameWhatsApp: 'mmbook_order_shipped_bn_v1',
    dltTemplateId: '1007161200000192804',
    dltHeader: DLT_SENDER_HEADER,
    titleBn: '🚚 পার্সেল রওনা দিয়েছে!',
    renderWhatsApp: (vars) =>
`🚚 *আপনার পার্সেল রওনা দিয়েছে!*

প্রিয় ${vars.customer_name || 'গ্রাহক'},
আপনার অর্ডার #${vars.order_id} সফলভাবে কুরিয়ারে পাঠানো হয়েছে।

🚚 *কুরিয়ার পার্টনার:* ${vars.courier_name || 'Blue Dart / Delhivery'}
🔖 *AWB ট্র্যাকিং নং:* \`${vars.awb_code}\`
📅 *সম্ভাব্য ডেলিভারি:* ${vars.est_delivery_date || '২-৩ কার্যদিবসের মধ্যে'}

পার্সেলের বর্তমান লোকেশন দেখতে নিচের লাইভ ট্র্যাকিং বাটনে চাপুন।`,
    renderSms: (vars) =>
`MMBOOK: অর্ডার #${vars.order_id} dispatched by ${vars.courier_name}. AWB: ${vars.awb_code}. Track: mmbook.in/t/${vars.awb_code} - M.M Book House`,
    defaultButtons: (vars) => [
      {
        type: 'url',
        label: '📍 লাইভ ট্র্যাকিং',
        url: vars.tracking_url ? String(vars.tracking_url) : `https://mmbook.in/track/${vars.awb_code || vars.order_id}`,
      },
    ],
  },

  // 5. Out for Delivery with Secret OTP
  out_for_delivery: {
    trigger: 'out_for_delivery',
    templateNameWhatsApp: 'mmbook_out_for_delivery_bn_v1',
    dltTemplateId: '1007161200000192805',
    dltHeader: DLT_SENDER_HEADER,
    titleBn: '🛵 আজই পৌঁছাবে আপনার বই!',
    renderWhatsApp: (vars) =>
`🛵 *আজই পৌঁছাবে আপনার বই!*

প্রিয় ${vars.customer_name || 'গ্রাহক'},
আমাদের ডেলিভারি পার্টনার আজ আপনার অর্ডার #${vars.order_id} ডেলিভারি করতে আসছে।

👤 *ডেলিভারি বয়:* ${vars.delivery_agent_name || 'ডেলিভারি এক্সিকিউটিভ'} (${vars.delivery_agent_phone || 'নম্বর শীঘ্রই আপডেট হবে'})
🔑 *গোপন ডেলিভারি OTP:* *${vars.otp_code}*
💰 *পরিশোধযোগ্য টাকা:* ₹${vars.collect_amount || '০ (প্রিপেইড)'}

⚠️ *সতর্কতা:* পার্সেলটি অক্ষত অবস্থায় হাতে পেয়ে তবেই ডেলিভারি বয়কে ওটিপি বলবেন।`,
    renderSms: (vars) =>
`MMBOOK: অর্ডার #${vars.order_id} আজ পৌঁছাবে। OTP: ${vars.otp_code}। পার্সেল বুঝে পেয়ে তবেই OTP দিন। প্রদেয়: Rs.${vars.collect_amount || '0'}. - M.M Book House`,
    defaultButtons: (vars) => [
      {
        type: 'url',
        label: '📞 ডেলিভারি বয়কে কল',
        url: vars.delivery_agent_phone ? `tel:${vars.delivery_agent_phone}` : `https://mmbook.in/track/${vars.order_id}`,
      },
    ],
  },

  // 6. Delivered Successfully & Invoice PDF Download
  order_delivered: {
    trigger: 'order_delivered',
    templateNameWhatsApp: 'mmbook_order_delivered_bn_v1',
    dltTemplateId: '1007161200000192806',
    dltHeader: DLT_SENDER_HEADER,
    titleBn: '🎉 ডেলিভারি সম্পন্ন!',
    renderWhatsApp: (vars) =>
`🎉 *ডেলিভারি সম্পন্ন হয়েছে!*

প্রিয় ${vars.customer_name || 'গ্রাহক'},
আপনার অর্ডার #${vars.order_id} সফলভাবে ডেলিভারি করা হয়েছে! 📚

আশা করি আপনার বইপড়ার অভিজ্ঞতা চমৎকার হবে। 
আপনার অফিশিয়াল জিএসটি ট্যাক্স ইনভয়েসটি ডাউনলোড করে সংরক্ষণ করতে পারেন।

ধন্যবাদ,
M.M Book House, Malda`,
    renderSms: (vars) =>
`MMBOOK: প্রিয় ${vars.customer_name}, অর্ডার #${vars.order_id} সফলভাবে ডেলিভারি হয়েছে। ইনভয়েস ডাউনলোড: mmbook.in/inv/${vars.order_id} - M.M Book House`,
    defaultButtons: (vars) => [
      {
        type: 'url',
        label: '📄 ইনভয়েস PDF',
        url: vars.invoice_url ? String(vars.invoice_url) : `https://mmbook.in/account/orders/${vars.order_id}/invoice`,
      },
    ],
  },

  // 7. Delivery Attempted & Reschedule Alert
  delivery_attempted: {
    trigger: 'delivery_attempted',
    templateNameWhatsApp: 'mmbook_delivery_failed_bn_v1',
    dltTemplateId: '1007161200000192807',
    dltHeader: DLT_SENDER_HEADER,
    titleBn: '⚠️ ডেলিভারি অপূর্ণ (Attempt Failed)',
    renderWhatsApp: (vars) =>
`⚠️ *ডেলিভারি সফল করা যায়নি!*

প্রিয় ${vars.customer_name || 'গ্রাহক'},
আজ আমাদের ডেলিভারি এক্সিকিউটিভ আপনার ঠিকানায় পৌঁছালেও পার্সেল হস্তান্তর করা যায়নি।
📌 *কারণ:* ${vars.failure_reason || 'গ্রাহকের ফোন নট রিচেবল / ঠিকানা বন্ধ'}

📅 *পরবর্তী প্রচেষ্টা:* ${vars.next_attempt_date || 'আগামীকাল'}
আপনি চাইলে আপনার সুবিধাজনক ডেলিভারি সময় এখনই নির্ধারণ করতে পারেন।`,
    renderSms: (vars) =>
`MMBOOK: অর্ডার #${vars.order_id} ডেলিভারি চেষ্টা ব্যর্থ হয়েছে (${vars.failure_reason || 'নট রিচেবল'})। রিসিডিউল করুন: mmbook.in/reschedule/${vars.order_id} - M.M Book House`,
    defaultButtons: (vars) => [
      {
        type: 'url',
        label: '🔄 রিসিডিউল করুন',
        url: `https://mmbook.in/account/orders/${vars.order_id}/reschedule`,
      },
    ],
  },

  // 8. Order Cancelled & Refund UTR Confirmation
  order_cancelled_refund: {
    trigger: 'order_cancelled_refund',
    templateNameWhatsApp: 'mmbook_order_refund_bn_v1',
    dltTemplateId: '1007161200000192808',
    dltHeader: DLT_SENDER_HEADER,
    titleBn: '💸 অর্ডার বাতিল ও রিফান্ড আপডেট',
    renderWhatsApp: (vars) =>
`💸 *অর্ডার বাতিল ও রিফান্ড তথ্য*

প্রিয় ${vars.customer_name || 'গ্রাহক'},
আপনার অর্ডার #${vars.order_id} বাতিলকরণ সফলভাবে গৃহীত হয়েছে।

💰 *রিফান্ড পরিমাণ:* ₹${vars.refund_amount}
🏦 *ব্যাঙ্ক UTR নম্বর:* \`${vars.refund_utr || 'শীঘ্রই প্রক্রিয়াধীন'}\`
⏱️ *সময়কাল:* ২-৪ ঘণ্টার মধ্যে মূল পেমেন্ট মাধ্যমে জমা হবে।

কোনো সমস্যায় আমাদের সাথে যোগাযোগ করুন: +91 98320 00000`,
    renderSms: (vars) =>
`MMBOOK: অর্ডার #${vars.order_id} বাতিল হয়েছে। Rs.${vars.refund_amount} রিফান্ড করা হয়েছে (UTR: ${vars.refund_utr || 'In Process'})। - M.M Book House`,
    defaultButtons: (vars) => [
      {
        type: 'url',
        label: '💳 রিফান্ড হিস্ট্রি',
        url: `https://mmbook.in/account/refunds?order_id=${vars.order_id}`,
      },
    ],
  },

  // 9. Day 3 Review Request with ₹20 Coin Incentive
  review_request: {
    trigger: 'review_request',
    templateNameWhatsApp: 'mmbook_review_request_bn_v1',
    dltTemplateId: '1007161200000192809',
    dltHeader: DLT_SENDER_HEADER,
    titleBn: '⭐ আপনার মতামত আমাদের অনুপ্রেরণা!',
    renderWhatsApp: (vars) =>
`⭐ *বইটি পড়ে আপনার কেমন লাগলো?*

প্রিয় ${vars.customer_name || 'গ্রাহক'},
কয়েকদিন আগে আপনি M.M Book House থেকে *${vars.book_name || 'বই'}* সংগ্রহ করেছেন।

বইটির গুণমান ও বিষয়বস্তু নিয়ে আপনার একটি ছোট্ট রিভিউ আমাদের এবং অন্যান্য পাঠকদের জন্য অত্যন্ত মূল্যবান!
🎁 *একটি সৎ রিভিউ দিলেই পাবেন ₹২০ ডিসকাউন্ট কয়েন।*`,
    renderSms: (vars) =>
`MMBOOK: প্রিয় ${vars.customer_name}, '${vars.book_name || 'বই'}' নিয়ে আপনার রিভিউ দিন এবং জিতে নিন ২০ ডিসকাউন্ট কয়েন! লিঙ্ক: mmbook.in/rev/${vars.order_id} - M.M Book House`,
    defaultButtons: (vars) => [
      {
        type: 'url',
        label: '⭐ রিভিউ দিন (₹২০ কয়েন)',
        url: vars.review_url ? String(vars.review_url) : `https://mmbook.in/reviews/new?order_id=${vars.order_id}`,
      },
    ],
  },

  // 10. 2-Hour Abandoned Cart Recovery Reminder
  abandoned_cart: {
    trigger: 'abandoned_cart',
    templateNameWhatsApp: 'mmbook_abandoned_cart_bn_v1',
    dltTemplateId: '1007161200000192810',
    dltHeader: DLT_SENDER_HEADER,
    titleBn: '🛒 আপনার কার্টের বইগুলো অপেক্ষা করছে!',
    renderWhatsApp: (vars) =>
`🛒 *আপনার পছন্দের বইগুলো কার্টে অপেক্ষা করছে!*

প্রিয় ${vars.customer_name || 'পাঠক'},
আপনার নির্বাচিত বইসমূহ (${vars.cart_items_preview || 'সেরা বই'}) কার্টে যুক্ত রয়েছে। মালদা স্টোরে এগুলোর সীমিত স্টক অবশিষ্ট রয়েছে!

🎁 *বিশেষ অফার:* অর্ডার সম্পন্ন করতে ব্যবহার করুন কুপন কোড: *${vars.coupon_code || 'READ5'}* এবং পান অতিরিক্ত ৫% তাৎক্ষণিক ছাড়!`,
    renderSms: (vars) =>
`MMBOOK: প্রিয় ${vars.customer_name}, কার্টে থাকা বইয়ের স্টক শেষ হওয়ার আগে অর্ডার সম্পন্ন করুন 'READ5' কুপনে ৫% ছাড়ে: mmbook.in/cart - M.M Book House`,
    defaultButtons: (vars) => [
      {
        type: 'url',
        label: '⚡ অর্ডার সম্পন্ন করুন',
        url: vars.checkout_url ? String(vars.checkout_url) : 'https://mmbook.in/cart',
      },
    ],
  },
};

/**
 * Render notification text for a specific trigger and variables
 */
export function renderNotificationMessage(
  trigger: NotificationTrigger,
  channel: 'whatsapp' | 'sms',
  variables: Record<string, string | number>
): string {
  const tpl = NOTIFICATION_TEMPLATES[trigger];
  if (!tpl) {
    throw new Error(`Unknown notification trigger: ${trigger}`);
  }
  return channel === 'whatsapp' ? tpl.renderWhatsApp(variables) : tpl.renderSms(variables);
}

/**
 * Get WhatsApp buttons for a trigger, with optional override
 */
export function getNotificationButtons(
  trigger: NotificationTrigger,
  variables: Record<string, string | number>,
  customButtons?: WhatsAppButton[]
): WhatsAppButton[] {
  if (customButtons && customButtons.length > 0) {
    return customButtons;
  }
  const tpl = NOTIFICATION_TEMPLATES[trigger];
  return tpl ? tpl.defaultButtons(variables) : [];
}
