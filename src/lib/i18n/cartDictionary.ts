import { AppLanguage } from '@/types/header';
import { toBengaliNumerals } from '@/lib/utils/currency';

export interface CartDictionary {
  breadcrumbs: {
    home: string;
    cart: string;
    ariaLabel: string;
  };
  pageTitle: string;
  subtitle: string;
  selectAll: string;
  deselectAll: string;
  priceHeader: string;
  itemsSelected: (count: number) => string;
  emptyCart: {
    title: string;
    subtitle: string;
    exploreBestsellers: string;
    todaysDeals: string;
    continueShopping: string;
    freeDeliveryPerk: string;
    genuineGuaranteePerk: string;
    fastDispatchPerk: string;
  };
  orderSummary: {
    title: string;
    subtotal: (count: number) => string;
    proceedToCheckout: string;
    freeDeliveryEligible: string;
    freeDeliveryQualified: string;
    addMoreForFreeDelivery: (needed: string) => string;
    giftOptionLabel: string;
    secureCheckoutNotice: string;
    fastDeliveryNotice: string;
    savingsBadge: (amount: string) => string;
  };
  savedForLater: {
    title: string;
    subtitle: string;
    emptyMessage: string;
    badgeCount: (count: number) => string;
    moveToCart: string;
  };
  itemsList: {
    cartItemsHeading: string;
    inStock: string;
    outOfStock: string;
    onlyLeft: (count: number) => string;
    qtyLabel: string;
    delete: string;
    saveForLater: string;
    share: string;
    linkCopied: string;
    saveAmount: (amount: string) => string;
    publisherLabel: string;
    paperback: string;
    hardcover: string;
  };
}

export const cartDictionary: Record<AppLanguage, CartDictionary> = {
  bn: {
    breadcrumbs: {
      home: 'হোম',
      cart: 'শপিং কার্ট',
      ariaLabel: 'ব্রেডক্রাম্ব নেভিগেশন',
    },
    pageTitle: 'শপিং কার্ট',
    subtitle: 'আপনার কার্টের নির্বাচিত বইসমূহ পর্যালোচনা করুন ও চেকআউটে এগিয়ে যান',
    selectAll: 'সব আইটেম নির্বাচন করুন',
    deselectAll: 'সমস্ত আইটেম আন-সিলেক্ট করুন',
    priceHeader: 'মূল্য',
    itemsSelected: (count: number) => `${toBengaliNumerals(count)}টি আইটেম নির্বাচিত`,
    emptyCart: {
      title: 'আপনার শপিং কার্ট বর্তমানে খালি',
      subtitle: 'আপনার কার্টে কোনো বই যুক্ত করা হয়নি। আমাদের সেরা বেস্টসেলার বই ও আজকের আকর্ষণীয় ডিলস দেখুন।',
      exploreBestsellers: 'বেস্টসেলার বই দেখুন',
      todaysDeals: 'আজকের সেরা ডিলস',
      continueShopping: 'বইয়ের ক্যাটালগ ব্রাউজ করুন',
      freeDeliveryPerk: '₹৪৯৯+ অর্ডারে ফ্রি ডেলিভারি',
      genuineGuaranteePerk: '১০০% আসল ও প্রামাণ্য বই',
      fastDispatchPerk: 'মালদা ও সংলগ্ন এলাকায় দ্রুত ডেলিভারি',
    },
    orderSummary: {
      title: 'অর্ডার সামারি',
      subtotal: (count: number) => `সাবটোটাল (${toBengaliNumerals(count)}টি আইটেম):`,
      proceedToCheckout: 'অর্ডার করতে এগিয়ে যান',
      freeDeliveryEligible: 'আপনার অর্ডার ফ্রি ডেলিভারির যোগ্য!',
      freeDeliveryQualified: 'অভিনন্দন! আপনি সম্পূর্ণ ফ্রি ডেলিভারি পেয়েছেন।',
      addMoreForFreeDelivery: (needed: string) => `আর মাত্র ${needed}-এর বই কিনলেই পাচ্ছেন ফ্রি ডেলিভারি!`,
      giftOptionLabel: 'এই অর্ডারে উপহারের সামগ্রী রয়েছে (This order contains a gift)',
      secureCheckoutNotice: '১০০% নিরাপদ ও সুরক্ষিত চেকআউট',
      fastDeliveryNotice: 'মালদা নেতাজি সুভাষ রোড কাউন্টার থেকে সরাসরি প্রেরিত',
      savingsBadge: (amount: string) => `মোট সাশ্রয়: ${amount}`,
    },
    savedForLater: {
      title: 'ভবিষ্যতের জন্য সংরক্ষিত বই (Saved for Later)',
      subtitle: 'কার্ট থেকে সাময়িকভাবে সরিয়ে রাখা বই এখানে জমা থাকবে। আপনি যেকোনো সময় এগুলো পুনরায় কার্টে যোগ করতে পারেন।',
      emptyMessage: 'বর্তমানে কোনো বই সেভ করা নেই।',
      badgeCount: (count: number) => `${toBengaliNumerals(count)}টি বই সংরক্ষিত`,
      moveToCart: 'পুনরায় কার্টে নিন',
    },
    itemsList: {
      cartItemsHeading: 'কার্টের সক্রিয় বইসমূহ',
      inStock: 'স্টকে আছে (In Stock)',
      outOfStock: 'স্টক শেষ (Out of Stock)',
      onlyLeft: (count: number) => `মাত্র ${toBengaliNumerals(count)} কপি বাকি - দ্রুত অর্ডার করুন!`,
      qtyLabel: 'পরিমাণ',
      delete: 'মুছে ফেলুন',
      saveForLater: 'পরে কেনার জন্য রাখুন',
      share: 'শেয়ার করুন',
      linkCopied: 'বইয়ের লিঙ্ক কপি করা হয়েছে!',
      saveAmount: (amount: string) => `${amount} সাশ্রয়`,
      publisherLabel: 'প্রকাশক:',
      paperback: 'পেপারব্যাক',
      hardcover: 'হার্ডকভার',
    },
  },
  en: {
    breadcrumbs: {
      home: 'Home',
      cart: 'Shopping Cart',
      ariaLabel: 'Breadcrumb Navigation',
    },
    pageTitle: 'Shopping Cart',
    subtitle: 'Review your selected books and proceed to fast checkout',
    selectAll: 'Select all items',
    deselectAll: 'Deselect all items',
    priceHeader: 'Price',
    itemsSelected: (count: number) => `${count} items selected`,
    emptyCart: {
      title: 'Your Shopping Cart is empty',
      subtitle: 'Your cart has no books yet. Check out our top-selling academic titles and flash deals.',
      exploreBestsellers: 'Explore Bestsellers',
      todaysDeals: "Today's Deals",
      continueShopping: 'Browse Catalog',
      freeDeliveryPerk: 'Free Delivery on orders ₹499+',
      genuineGuaranteePerk: '100% Genuine & Authentic Books',
      fastDispatchPerk: 'Fast Dispatch across Malda & WB',
    },
    orderSummary: {
      title: 'Order Summary',
      subtotal: (count: number) => `Subtotal (${count} items):`,
      proceedToCheckout: 'Proceed to Buy',
      freeDeliveryEligible: 'Your order is eligible for FREE Delivery!',
      freeDeliveryQualified: 'Congratulations! You unlocked FREE Delivery.',
      addMoreForFreeDelivery: (needed: string) => `Add ${needed} more of eligible items for FREE Delivery!`,
      giftOptionLabel: 'This order contains a gift',
      secureCheckoutNotice: '100% Secure & Encrypted Checkout',
      fastDeliveryNotice: 'Dispatched directly from Netaji Subhash Road, Malda',
      savingsBadge: (amount: string) => `Total Savings: ${amount}`,
    },
    savedForLater: {
      title: 'Saved for Later',
      subtitle: 'Items temporarily put aside from your cart stay here. You can move them back to your cart anytime.',
      emptyMessage: 'No items saved for later.',
      badgeCount: (count: number) => `${count} items saved`,
      moveToCart: 'Move to cart',
    },
    itemsList: {
      cartItemsHeading: 'Active Cart Items',
      inStock: 'In Stock',
      outOfStock: 'Out of Stock',
      onlyLeft: (count: number) => `Only ${count} left in stock - order soon!`,
      qtyLabel: 'Qty',
      delete: 'Delete',
      saveForLater: 'Save for later',
      share: 'Share',
      linkCopied: 'Book link copied to clipboard!',
      saveAmount: (amount: string) => `Save ${amount}`,
      publisherLabel: 'Publisher:',
      paperback: 'Paperback',
      hardcover: 'Hardcover',
    },
  },
};

export function getCartDictionary(language: AppLanguage): CartDictionary {
  return cartDictionary[language] || cartDictionary.bn;
}
