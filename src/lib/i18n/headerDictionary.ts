import { AppLanguage } from '@/types/header';
import { toBengaliNumerals } from '@/lib/utils/currency';

export interface HeaderDictionary {
  search: {
    placeholders: string[];
    clear: string;
    submit: string;
    formAria: string;
    inputAria: string;
  };
  delivery: {
    pickupMode: string;
    pickupCounter: string;
    pickupCounterFree: string;
    deliveryTo: string;
    deliveryLocation: string;
    changeLocation: string;
    ariaPickup: string;
    ariaDelivery: (area: string, pincode: string) => string;
  };
  language: {
    title: string;
    bnOption: string;
    enOption: string;
    savedNotice: string;
    ariaLabel: (currentLang: string) => string;
  };
  account: {
    helloGuest: string;
    helloUser: (name: string) => string;
    accountAndLists: string;
    signInBtn: string;
    newCustomer: string;
    startHere: string;
    yourLists: string;
    createWishlist: string;
    savedBooks: string;
    favoritesWishlist: string;
    recentBrowsed: string;
    yourAccount: string;
    profileSettings: string;
    ordersAndTracking: string;
    yourOrders: string;
    savedAddresses: string;
    gstInvoices: string;
    customerSupport: string;
    signOut: string;
  };
  returnsOrders: {
    returns: string;
    orders: string;
    ariaLabel: string;
  };
  cart: {
    label: string;
    ariaLabel: (count: number) => string;
    subtotal: string;
    emptyCartTitle: string;
    emptyCartSubtitle: string;
    viewCart: string;
    proceedToCheckout: string;
    itemsCount: (count: number) => string;
    qty: string;
    remove: string;
  };
  mobileNav: {
    home: string;
    categories: string;
    wishlist: string;
    orders: string;
    profile: string;
  };
  drawer: {
    greetingGuest: string;
    greetingPrefix: string;
    languageToggle: string;
    signOut: string;
  };
  sellerAdmin: {
    adminPanel: string;
    sellerCentral: string;
    posCounter: string;
    roleLabel: (role: string) => string;
    ariaLabel: string;
  };
  helpline: {
    title: string;
    subtitle: string;
    whatsappTitle: string;
    whatsappDesc: string;
    whatsappAction: string;
    callTitle: string;
    callDesc: string;
    callAction: string;
    storeTiming: string;
    ariaLabel: string;
    close: string;
  };
}

export const headerDictionary: Record<AppLanguage, HeaderDictionary> = {
  bn: {
    search: {
      placeholders: [
        'বইয়ের নাম, লেখক বা বিষয় দিয়ে খুঁজুন...',
        'WBCS ও সিভিল সার্ভিস বই খুঁজুন...',
        'কলেজ সেমিস্টার (১-৬) সহায়িকা খুঁজুন...',
        'প্রাইমারি ও আপার প্রাইমারি TET গাইড...',
        'বাংলা সাহিত্য ও গল্পের বই খুঁজুন...',
      ],
      clear: 'সার্চ ক্লিয়ার করুন',
      submit: 'খুঁজুন',
      formAria: 'বই অনুসন্ধান ফর্ম',
      inputAria: 'বই বা লেখকের নাম লিখুন',
    },
    delivery: {
      pickupMode: 'কাউন্টার পিকআপ',
      pickupCounter: 'নেতাজি সুভাষ রোড',
      pickupCounterFree: 'নেতাজি সুভাষ রোড (ফ্রি)',
      deliveryTo: 'ডেলিভারি',
      deliveryLocation: 'ডেলিভারি লোকেশন',
      changeLocation: 'বদলান',
      ariaPickup: 'পিকআপ মোড: নেতাজি সুভাষ রোড কাউন্টার (মালদা)। পরিবর্তন করতে ক্লিক করুন।',
      ariaDelivery: (area, pincode) => `ডেলিভারি লোকেশন: ${area}, পিনকোড ${pincode}। পরিবর্তন করতে ক্লিক করুন।`,
    },
    language: {
      title: 'ভাষা বেছে নিন (Change Language)',
      bnOption: 'বাংলা (BN)',
      enOption: 'English (EN)',
      savedNotice: 'পছন্দটি ব্রাউজারে সংরক্ষিত থাকবে',
      ariaLabel: (curr) => `ভাষা পরিবর্তন: বর্তমান ভাষা ${curr === 'bn' ? 'বাংলা' : 'English'}`,
    },
    account: {
      helloGuest: 'নমস্কার, সাইন ইন',
      helloUser: (name) => `হ্যালো, ${name}`,
      accountAndLists: 'অ্যাকাউন্ট ও তালিকা',
      signInBtn: 'সাইন ইন করুন (Sign In)',
      newCustomer: 'নতুন গ্রাহক?',
      startHere: 'এখান থেকে শুরু করুন',
      yourLists: 'আপনার তালিকা',
      createWishlist: 'উইশলিস্ট তৈরি করুন',
      savedBooks: 'সংরক্ষিত বইসমূহ',
      favoritesWishlist: 'পছন্দের উইশলিস্ট',
      recentBrowsed: 'সম্প্রতি ব্রাউজ করা বই',
      yourAccount: 'আপনার অ্যাকাউন্ট',
      profileSettings: 'প্রোফাইল সেটিংস',
      ordersAndTracking: 'অর্ডার ও লাইভ ট্র্যাকিং',
      yourOrders: 'আপনার অর্ডারসমূহ',
      savedAddresses: 'সংরক্ষিত ঠিকানা বুক',
      gstInvoices: 'GST ইনভয়েস ডাউনলোড',
      customerSupport: 'গ্রাহক সহায়তা',
      signOut: 'সাইন আউট (Sign Out)',
    },
    returnsOrders: {
      returns: 'রিটার্ন ও',
      orders: 'অর্ডার',
      ariaLabel: 'আপনার অতীত অর্ডার ও রিটার্ন হিস্ট্রি দেখুন',
    },
    cart: {
      label: 'কার্ট',
      ariaLabel: (c) => `শপিং কার্ট, মোট আইটেম: ${toBengaliNumerals(c)}টি`,
      subtotal: 'সাবটোটাল',
      emptyCartTitle: 'আপনার কার্ট বর্তমানে খালি',
      emptyCartSubtitle: 'পছন্দের বই খুঁজে কার্টে যোগ করুন',
      viewCart: 'কার্ট দেখুন',
      proceedToCheckout: 'অর্ডার করুন (Checkout)',
      itemsCount: (c) => `${toBengaliNumerals(c)}টি বই`,
      qty: 'পরিমাণ',
      remove: 'মুছে ফেলুন',
    },
    mobileNav: {
      home: 'হোম',
      categories: 'বিভাগ',
      wishlist: 'উইশলিস্ট',
      orders: 'অর্ডার',
      profile: 'প্রোফাইল',
    },
    drawer: {
      greetingGuest: 'সাইন ইন করুন',
      greetingPrefix: 'নমস্কার,',
      languageToggle: 'ভাষা / Language',
      signOut: 'সাইন আউট (Sign Out)',
    },
    sellerAdmin: {
      adminPanel: 'অ্যাডমিন প্যানেল',
      sellerCentral: 'সেলার সেন্ট্রাল',
      posCounter: 'পিওএস কাউন্টার',
      roleLabel: (role) => `ভূমিকা: ${role}`,
      ariaLabel: 'দোকানদার ও স্টাফ ড্যাশবোর্ডে যান',
    },
    helpline: {
      title: 'হেল্পলাইন',
      subtitle: 'সরাসরি সহায়তা',
      whatsappTitle: 'হোয়াটসঅ্যাপে বই খুঁজুন',
      whatsappDesc: '১-ক্লিকে হোয়াটসঅ্যাপে যেকোনো বই অর্ডার বা অনুসন্ধান করুন',
      whatsappAction: 'চ্যাট শুরু করুন',
      callTitle: 'সরাসরি ফোন করুন',
      callDesc: 'মালদা নেতাজি সুভাষ রোড দোকানে সরাসরি কথা বলুন',
      callAction: 'ফোন করুন',
      storeTiming: 'দোকান খোলা: সকাল ১০:০০ - রাত ৯:০০ (প্রতিদিন)',
      ariaLabel: 'জরুরি কন্টাক্ট ও হেল্পলাইন মেনু',
      close: 'বন্ধ করুন',
    },
  },
  en: {
    search: {
      placeholders: [
        'Search by title, author, or subject...',
        'Search WBCS & Civil Services books...',
        'Search College Semester (1-6) guides...',
        'Primary & Upper Primary TET guides...',
        'Search Bengali literature & fiction books...',
      ],
      clear: 'Clear search',
      submit: 'Search',
      formAria: 'Book search form',
      inputAria: 'Enter book title or author name',
    },
    delivery: {
      pickupMode: 'Counter Pickup',
      pickupCounter: 'Netaji Subhash Road',
      pickupCounterFree: 'Netaji Subhash Rd (Free)',
      deliveryTo: 'Deliver to',
      deliveryLocation: 'Delivery Location',
      changeLocation: 'Change',
      ariaPickup: 'Pickup mode: Netaji Subhash Road Counter (Malda). Click to change.',
      ariaDelivery: (area, pincode) => `Delivery Location: ${area}, Pincode ${pincode}. Click to change.`,
    },
    language: {
      title: 'Change Language / ভাষা বেছে নিন',
      bnOption: 'বাংলা (BN)',
      enOption: 'English (EN)',
      savedNotice: 'Preference will be saved in your browser',
      ariaLabel: (curr) => `Change language: current language is ${curr === 'bn' ? 'Bengali' : 'English'}`,
    },
    account: {
      helloGuest: 'Hello, Sign In',
      helloUser: (name) => `Hello, ${name}`,
      accountAndLists: 'Account & Lists',
      signInBtn: 'Sign In',
      newCustomer: 'New customer?',
      startHere: 'Start here',
      yourLists: 'Your Lists',
      createWishlist: 'Create a Wish List',
      savedBooks: 'Saved Books',
      favoritesWishlist: 'Your Wish List',
      recentBrowsed: 'Recently Viewed Books',
      yourAccount: 'Your Account',
      profileSettings: 'Profile Settings',
      ordersAndTracking: 'Orders & Live Tracking',
      yourOrders: 'Your Orders',
      savedAddresses: 'Saved Address Book',
      gstInvoices: 'Download GST Invoices',
      customerSupport: 'Customer Support',
      signOut: 'Sign Out',
    },
    returnsOrders: {
      returns: 'Returns &',
      orders: 'Orders',
      ariaLabel: 'View your order history and returns',
    },
    cart: {
      label: 'Cart',
      ariaLabel: (c) => `Shopping Cart, ${c} items`,
      subtotal: 'Subtotal',
      emptyCartTitle: 'Your Cart is empty',
      emptyCartSubtitle: 'Explore books and add to your cart',
      viewCart: 'View Cart',
      proceedToCheckout: 'Proceed to Checkout',
      itemsCount: (c) => `${c} items`,
      qty: 'Qty',
      remove: 'Remove',
    },
    mobileNav: {
      home: 'Home',
      categories: 'Categories',
      wishlist: 'Wishlist',
      orders: 'Orders',
      profile: 'Profile',
    },
    drawer: {
      greetingGuest: 'Sign In',
      greetingPrefix: 'Hello,',
      languageToggle: 'Language / ভাষা',
      signOut: 'Sign Out',
    },
    sellerAdmin: {
      adminPanel: 'Admin Panel',
      sellerCentral: 'Seller Central',
      posCounter: 'POS Counter',
      roleLabel: (role) => `Role: ${role}`,
      ariaLabel: 'Go to Seller & Staff Dashboard',
    },
    helpline: {
      title: 'Helpline',
      subtitle: 'Direct Assistance',
      whatsappTitle: 'WhatsApp Book Enquiry',
      whatsappDesc: 'Instant WhatsApp chat for book orders and questions',
      whatsappAction: 'Start Chat',
      callTitle: 'Call Store Directly',
      callDesc: 'Speak directly with our Malda Netaji Subhash Rd counter',
      callAction: 'Call Now',
      storeTiming: 'Store Hours: 10:00 AM - 9:00 PM (Daily)',
      ariaLabel: 'Emergency contact and helpline menu',
      close: 'Close',
    },
  },
};

export function getHeaderDictionary(language: AppLanguage): HeaderDictionary {
  return headerDictionary[language] || headerDictionary.bn;
}
