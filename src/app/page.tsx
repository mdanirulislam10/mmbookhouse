'use client';

import React, { useState } from 'react';
import { useDeliveryLocation } from '@/hooks/useDeliveryLocation';
import { useNotifications } from '@/hooks/useNotifications';
import { useNoticeBar } from '@/hooks/useNoticeBar';
import { useUserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useCart, SAMPLE_BOOKS } from '@/hooks/useCartStore';
import { useWishlist } from '@/hooks/useWishlistStore';
import { formatINR, toBengaliNumerals } from '@/lib/utils/currency';
import { BulkOrderModal } from '@/components/header/BulkOrderModal';
import { PincodeModal } from '@/components/header/PincodeModal';
import { OfflineStatusIndicator } from '@/components/header/OfflineStatusIndicator';
import { useFestiveTheme, FESTIVE_THEMES, FestiveThemeMode } from '@/hooks/useFestiveTheme';
import { HeroBannerSlider } from '@/components/banner';
import { FloatingCardGrid, ProductCarousel } from '@/components/home';
import { DealOfTheDayWidget } from '@/components/deals';
import { CAROUSEL_COLLECTIONS } from '@/lib/data/carouselBooks';
import {
  MapPin,
  CheckCircle,
  ShieldCheck,
  Sparkles,
  Search,
  Bell,
  Store,
  Layers,
  Truck,
  BookOpen,
  GraduationCap,
  Shield,
  AlertCircle,
  Globe,
  User,
  Package,
  ShoppingCart,
  PlusCircle,
  Trash2,
  Zap,
  ArrowUpDown,
  Headset,
  RefreshCw,
  Radio,
  Coins,
  Keyboard,
  Heart,
  WifiOff,
  Cpu,
  Palette,
  Smartphone,
  Flame,
  Check,
  PhoneCall,
  Award,
  ShoppingBag
} from 'lucide-react';

export default function HomePage() {
  const { location, updatePincode, setFulfillmentMode, resetToDefault } = useDeliveryLocation();
  const { addNotification } = useNotifications();
  const { resetNotice, nextNotice, prevNotice, isVisible: isNoticeVisible, currentIndex, totalNotices } = useNoticeBar();
  const { role, setRole, activeView, isStaffOrAdmin } = useUserRole();
  const { language, toggleLanguage, isBengali } = useLanguage();
  const { isLoggedIn, fullName, avatarUrl, toggleAuthStatus } = useAuthSession();
  const { totalCount, subtotal, addItem, clearCart, triggerBounce, isAnimating } = useCart();
  const { count: wishlistCount, toggleItem: toggleWishlistItem, isInWishlist } = useWishlist();
  const { theme, setTheme, themeConfig, isFestive } = useFestiveTheme();
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isPincodeModalOpen, setIsPincodeModalOpen] = useState(false);
  const [forceOfflineSimulation, setForceOfflineSimulation] = useState(false);

  const handleTriggerMockNotification = () => {
    addNotification({
      title: '🚀 পার্সেল ডেলিভারিতে বের হয়েছে (Out for Delivery)',
      message: 'আপনার অর্ডারকৃত বইয়ের পার্সেলটি নিয়ে ডেলিভারি পার্টনার মালদা টাউন থেকে রওনা হয়েছেন।',
      type: 'order_status',
      badgeText: 'লাইভ ট্র্যাকিং',
    });
  };

  const handleAddSampleBook = (index: number) => {
    if (SAMPLE_BOOKS[index]) {
      addItem(SAMPLE_BOOKS[index]);
    }
  };

  const cycleRole = () => {
    if (role === 'admin') setRole('seller');
    else if (role === 'seller') setRole('pos_staff');
    else if (role === 'pos_staff') setRole('customer');
    else setRole('admin');
  };

  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-8">
      {/* Simulation banner for offline test */}
      {forceOfflineSimulation && (
        <OfflineStatusIndicator forceOffline={true} />
      )}

      {/* Module 4: Amazon Hero Banner Slider Component (Tasks 1 to 5) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-amber-500 text-gray-950 font-bold text-xs">
              মডিউল ৪: ভাগ ১
            </span>
            <span className="text-xs sm:text-sm font-bold text-gray-800">
              হিরো ব্যানার স্লাইডার ও কোর মেকানিক্স (কাজ ১–৫)
            </span>
          </div>
          <span className="text-[11px] font-mono bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
            ৫/৫ কাজ প্রস্তুত
          </span>
        </div>
        <HeroBannerSlider />
      </div>

      {/* Module 4 Part 3: Amazon Signature Floating Quad Card Grid Overlap (Tasks 11-15) */}
      <FloatingCardGrid className="mb-6 sm:mb-8" />

      {/* Module 4 Part 5: Amazon "Deal of the Day" & Flash Deals Engine (Tasks 21-25) */}
      <DealOfTheDayWidget className="mb-6 sm:mb-8" />

      {/* Module 4 Part 7: Horizontal Product Row Carousels (Tasks 31 to 35) */}
      <div className="space-y-6 sm:space-y-8 mb-6 sm:mb-8">
        <ProductCarousel collection={CAROUSEL_COLLECTIONS[0]} />
        <ProductCarousel collection={CAROUSEL_COLLECTIONS[1]} />
      </div>

      {/* Module 4: Part 3 Verification & Quad Widget Architecture Highlights (Tasks 11 to 15) */}
      <section className="bg-white rounded-xl p-5 sm:p-6 border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
          <div className="flex items-center gap-2 text-gray-900 font-extrabold text-base">
            <Layers className="w-5 h-5 text-amber-600" />
            <span>মডিউল ৪ (ভাগ ৩: কাজ ১১ থেকে ১৫) ভাসমান কার্ড গ্রিড ও ৪-ইন-১ কোয়াড উইজেট মেট্রিক্স</span>
          </div>
          <span className="text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full w-fit">
            ৫/৫ কাজ বাস্তবায়িত ও সক্রিয়
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Task 11 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-amber-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">
                ১১
              </span>
              <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                -mt-16 to -mt-32
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">নেগেটিভ মার্জিন ওভারল্যাপ</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              ব্যানারের বটম ফেডের ওপর `-mt-16 sm:-mt-24 md:-mt-32` মার্জিন দিয়ে স্ট্যাকিং এবং জিরো-ক্লিপিং ওভারলে আর্কিটেকচার।
            </p>
          </div>

          {/* Task 12 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-amber-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">
                ১২
              </span>
              <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                2x2 Multi-Tile
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">৪-ইন-১ কোয়াড কার্ড উইজেট</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              হোয়াইট কন্টেইনারে ২×২ গ্রিডে ৪টি সাব-টপিক বইয়ের থাম্বনেইল, শিমার ব্লার প্রিভিউ ও ক্যাপশন লেআউট।
            </p>
          </div>

          {/* Task 13 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-amber-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">
                ১৩
              </span>
              <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                ৪ Curated Blocks
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">টপ কিউরেটেড কার্ড ব্লকস</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              WBCS স্পেশাল, কলেজ সেমিস্টার ১-৬, ৫০% ছাড়ের ধামাকা ডিলস ও স্কুল টেস্ট পেপারস ২০২৬ সংকলন ম্যাপিং।
            </p>
          </div>

          {/* Task 14 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-amber-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">
                ১৪
              </span>
              <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                Auth Spotlight
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">স্পটলাইট ও অথেন্টিকেশন</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              গেস্টদের জন্য ১-ক্লিক সাইন-ইন প্রম্পট এবং লগইন ব্যবহারকারীদের জন্য পার্সোনালাইজড অর্ডার ও বুক রেকমেন্ডেশন।
            </p>
          </div>

          {/* Task 15 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-amber-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">
                ১৫
              </span>
              <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                See More Routing
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">"আরও দেখুন" ডিরেক্ট রাউটিং</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              প্রতিটি কার্ডের পাদদেশ থেকে সংশ্লিষ্ট বিভাগের সম্পূর্ণ ক্যাটালগে (`/category/*`, `/deals`) ইনস্ট্যান্ট প্রিফেচড লিংক।
            </p>
          </div>
        </div>
      </section>

      {/* Module 4: Part 4 Verification & Backend Architecture Highlights (Tasks 16 to 20) */}
      <section className="bg-white rounded-xl p-5 sm:p-6 border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
          <div className="flex items-center gap-2 text-gray-900 font-extrabold text-base">
            <Cpu className="w-5 h-5 text-indigo-600" />
            <span>মডিউল ৪ (ভাগ ৪: কাজ ১৬ থেকে ২০) রেসপন্সিভ লেআউট, ব্যাকএন্ড স্কিমা ও স্টাইলিং মেট্রিক্স</span>
          </div>
          <span className="text-xs font-bold text-indigo-900 bg-indigo-100 px-3 py-1 rounded-full w-fit">
            ৫/৫ কাজ বাস্তবায়িত ও সক্রিয়
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Task 16 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-indigo-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                ১৬
              </span>
              <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                4 / 2 / 1 Col
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">মাল্টি-ডিভাইস গ্রিড আর্কিটেকচার</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              ডেস্কটপে ৪-কলাম, ট্যাবলেটে ২-কলাম ও মোবাইলে ১-কলামের সাথে নিখুঁত হাইট ব্যালেন্স ও নো-টেক্সট-ক্লিপিং।
            </p>
          </div>

          {/* Task 17 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-indigo-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                ১৭
              </span>
              <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                CMS Service
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">ডায়নামিক ব্যানার অ্যাডমিন সার্ভিস</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              দোকানদার সেলার প্যানেল থেকে ব্যানার আপলোড, রি-অর্ডার ও সক্রিয়করণের জন্য `bannerService` ও অফলাইন ফলব্যাক।
            </p>
          </div>

          {/* Task 18 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-indigo-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                ১৮
              </span>
              <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                PostgreSQL RLS
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">Supabase স্কিমা ও মাইগ্রেশন</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              `hero_banners` ও `homepage_sections` টেবিল, B-Tree ইনডেক্স, স্বয়ংক্রিয় ট্রিগার ও কঠোর RLS নিরাপত্তা।
            </p>
          </div>

          {/* Task 19 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-indigo-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                ১৯
              </span>
              <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                Zero CLS
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">জিরো-CLS স্কেলিটন লোডার</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              `QuadCardSkeleton` ও `HeroBannerSkeleton` দ্বারা পিকচার লোডিং ও ডেটা ফেচিংয়ের লেআউট শিফট নির্মূল।
            </p>
          </div>

          {/* Task 20 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-indigo-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                ২০
              </span>
              <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                #eaeded Theme
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">অ্যামাজন ক্লাসিক ভিজ্যুয়াল থিম</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              হোমপেজের সফট গ্রে ব্যাকগ্রাউন্ড (`#eaeded`), ধবধবে সাদা কার্ড (`#ffffff`), ১px বর্ডার ও প্রিমিয়াম ড্রপ শ্যাডো।
            </p>
          </div>
        </div>
      </section>

      {/* Module 4: Part 5 Verification & Flash Deals Engine Highlights (Tasks 21 to 25) */}
      <section className="bg-white rounded-xl p-5 sm:p-6 border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
          <div className="flex items-center gap-2 text-gray-900 font-extrabold text-base">
            <Flame className="w-5 h-5 text-rose-600" />
            <span>মডিউল ৪ (ভাগ ৫: কাজ ২১ থেকে ২৫) "Deal of the Day" ও ফ্ল্যাশ ডিলস ইঞ্জিন মেট্রিক্স</span>
          </div>
          <span className="text-xs font-bold text-rose-900 bg-rose-100 px-3 py-1 rounded-full w-fit">
            ৫/৫ কাজ বাস্তবায়িত ও সক্রিয়
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Task 21 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-rose-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold">
                ২১
              </span>
              <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                Live Ticker
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">লাইভ কাউন্টডাউন ও FOMO</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              প্রতি সেকেন্ডে কমতে থাকা মেমরি-লিক মুক্ত লাইভ কাউন্টডাউন টাইমার (`useDealCountdown`) ও বাংলা সংখ্যা সাপোর্ট।
            </p>
          </div>

          {/* Task 22 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-rose-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold">
                ২২
              </span>
              <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                #cc0c39 Badge
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">অ্যামাজন ডিসকাউন্ট ব্যাজ</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              দৃষ্টি আকর্ষণকারী ক্রিমসন রেড পটভূমি (`bg-[#cc0c39]`), বোল্ড হোয়াইট টেক্সট ও পার্সেন্টেজ অফ ব্যাজ আর্কিটেকচার।
            </p>
          </div>

          {/* Task 23 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-rose-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold">
                ২৩
              </span>
              <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                Claim Meter
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">লিমিটেড স্টক ক্লেইম মিটার</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              অ্যামাজন সিগনেচার অরেঞ্জ প্রগ্রেস বার (`DealClaimBar`) ও ৮০%+ স্টকে "দ্রুত শেষ হচ্ছে!" আর্জেন্সি অ্যালার্ট।
            </p>
          </div>

          {/* Task 24 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-rose-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold">
                ২৪
              </span>
              <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                Price Restore
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">ডিল এক্সপায়ারি ও প্রাইস রিস্টোর</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              টাইমার শেষ হওয়ামাত্র পেজ রিলোড ছাড়াই আসল মূল্যে (MRP) রূপান্তর ও বোতাম স্টেট "Deal Expired" এ পরিবর্তন।
            </p>
          </div>

          {/* Task 25 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-rose-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold">
                ২৫
              </span>
              <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                Max 1 Limit
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">অপব্যবহার রোধ ও ১ কপি লিমিট</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              বাল্ক বাই প্রতিরোধে প্রতি অর্ডারে সর্বোচ্চ ১ কপি কেনার কঠোর ভ্যালিডেশন এবং কার্ট ক্যাপ এনফোর্সমেন্ট।
            </p>
          </div>
        </div>
      </section>

      {/* Module 4: Part 6 Verification & Deal Categories, Scheduling & Server Time Sync (Tasks 26 to 30) */}
      <section className="bg-white rounded-xl p-5 sm:p-6 border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
          <div className="flex items-center gap-2 text-gray-900 font-extrabold text-base">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span>মডিউল ৪ (ভাগ ৬: কাজ ২৬ থেকে ৩০) ডিল ক্যাটাগরি, শিডিউলিং ও সার্ভার টাইম সিঙ্ক মেট্রিক্স</span>
          </div>
          <span className="text-xs font-bold text-purple-900 bg-purple-100 px-3 py-1 rounded-full w-fit">
            ৫/৫ কাজ বাস্তবায়িত ও সক্রিয়
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Task 26 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-purple-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
                ২৬
              </span>
              <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                Multi-Tier
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">মাল্টি-টায়ার ডিল ট্যাক্সোনমি</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              `deal_of_the_day`, `lightning_deal`, `weekend_special` ও `limited_time` ট্যাক্সোনমি এবং থিমভিত্তিক ব্যাজ ডিজাইন।
            </p>
          </div>

          {/* Task 27 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-purple-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
                ২৭
              </span>
              <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                Scheduling
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">ডিল শিডিউলিং ও টাইম-উইন্ডো</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              `startTime` ও `endTime` ভিত্তিক 'upcoming', 'active' ও 'expired' ডায়নামিক স্টেট ম্যানেজমেন্ট ও টাইম-টু-স্টার্ট রিভার্স কাউন্টডাউন।
            </p>
          </div>

          {/* Task 28 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-purple-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
                ২৮
              </span>
              <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                Cross-Page Sync
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">ক্রস-পেজ গ্লোবাল ডিল সিঙ্ক</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              সার্চ পেজ (`/search`) ও ক্যাটালগে `getActiveDealForBook()` ইন্টিগ্রেশন, লাইভ ডিল প্রাইস ও `AmazonDealBadge` গ্লোবাল সিঙ্ক।
            </p>
          </div>

          {/* Task 29 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-purple-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
                ২৯
              </span>
              <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                Deals Hub & Alert
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">"See All Deals" পোর্টাল হাব</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              সম্পূর্ণ রি-ডিজাইনড `/deals` পোর্টাল হাব, মাল্টি-টায়ার ক্যাটাগরি ফিল্টার এবং আসন্ন ডিলের জন্য "🔔 মনে করিয়ে দিন" অ্যালার্ট।
            </p>
          </div>

          {/* Task 30 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-purple-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
                ৩০
              </span>
              <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                IST Clock Sync
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">সার্ভার ক্লক সিঙ্ক ও টাইম ড্রাফট</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              `/api/server-time` এপিআই এন্ডপয়েন্ট, ইন-ফ্লাইট প্রমিজ ডি-ডুপ্লিকেশন ও অফসেট সিঙ্ক—ভুল ডিভাইজ টাইমেও নিখুঁত IST টাইমার।
            </p>
          </div>
        </div>
      </section>

      {/* Module 4: Part 7 Verification & Horizontal Product Carousel & Quick Shopping Cards (Tasks 31 to 35) */}
      <section className="bg-white rounded-xl p-5 sm:p-6 border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
          <div className="flex items-center gap-2 text-gray-900 font-extrabold text-base">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <span>মডিউল ৪ (ভাগ ৭: কাজ ৩১ থেকে ৩৫) হরাইজন্টাল প্রোডাক্ট ক্যারোজেল ও কুইক শপিং কার্ডস মেট্রিক্স</span>
          </div>
          <span className="text-xs font-bold text-emerald-900 bg-emerald-100 px-3 py-1 rounded-full w-fit">
            ৫/৫ কাজ বাস্তবায়িত ও সক্রিয়
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Task 31 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-emerald-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                ৩১
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                Horizontal Row
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">হরাইজন্টাল রো ক্যারোজেল</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              ৮-১০টি কিউরেটেড বই প্রদর্শনী, `overflow-x-auto`, CSS `snap-x snap-mandatory` ও নো-স্ক্রোলবার আর্কিটেকচার।
            </p>
          </div>

          {/* Task 32 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-emerald-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                ৩২
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                Smart Page Jump
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">স্মার্ট পেজ জাম্প কন্ট্রোলস</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              ডেস্কটপ সাইড ভাসমান বোতাম, প্রতি ক্লিকে ৩-৪টি বই স্মুথ জাম্প এবং শুরু ও শেষ পয়েন্টে স্বয়ংক্রিয় হাইড/ডিজেবল লজিক।
            </p>
          </div>

          {/* Task 33 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-emerald-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                ৩৩
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                6-Point Card
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">৬-পয়েন্ট সমৃদ্ধ প্রোডাক্ট কার্ড</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              কভার থাম্বনেইল ও জুম, টাইটেল, লেখক/প্রকাশক, স্টার রেটিং ও রিভিউ, বিক্রয়মূল্য এবং কাটা MRP সহ পূর্ণাঙ্গ লেআউট।
            </p>
          </div>

          {/* Task 34 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-emerald-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                ৩৪
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                1-Click Add
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">১-ক্লিক "Add to Cart"</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              সিগনেচার অ্যামাজন লাইট ইয়েলো বাটন (`#ffd814`), সরাসরি কার্ট স্টেট আপডেট ও লাইভ বাউন্স ফিডব্যাক অ্যানিমেশন।
            </p>
          </div>

          {/* Task 35 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-emerald-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                ৩৫
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                Lightbox Modal
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">ইন্টারঅ্যাক্টিভ "Quick View"</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              কভার ক্লিকে লাইটবক্স মডাল পপআপ, সূচিপত্র, পৃষ্ঠা সংখ্যা, বাঁধাই স্পেসিফিকেশন ও ইনস্ট্যান্ট কেনাকাটার অপশন।
            </p>
          </div>
        </div>
      </section>

      {/* Module 4: Part 1 Verification & Task Highlights */}
      <section className="bg-white/95 backdrop-blur-md rounded-xl p-5 sm:p-6 border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
          <div className="flex items-center gap-2 text-gray-900 font-extrabold text-base">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>মডিউল ৪ (ভাগ ১: কাজ ১ থেকে ৫) বাস্তবায়ন ও স্থাপত্য মেট্রিক্স</span>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full w-fit">
            ৫/৫ কাজ বাস্তবায়িত ও সক্রিয় (অডিট সংশোধিত)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Task 1 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-amber-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">
                ১
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                16:7 / 4:3
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">ডুয়াল-রেশিও ডাইমেনশন</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              ডেস্কটপে ১৬:৭ ও মোবাইলে ৪:৩ রেশিও সমৃদ্ধ রেসপন্সিভ ফ্রেম, যা ব্রাউজার রিসাইজে জিরো-CLS নিশ্চিত করে।
            </p>
          </div>

          {/* Task 2 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-amber-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">
                ২
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                translate3d
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">GPU এক্সিলারেটেড স্লাইড</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              `translate3d` ও ৪০০ms কিউবিক-বেজিয়ার মসৃণ ট্রানজিশন ইঞ্জিন যা ল্যাগ ছাড়া স্লাইড পরিবর্তন করে।
            </p>
          </div>

          {/* Task 3 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-amber-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">
                ৩
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                5000ms
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">৫-সেকেন্ড অটো-রোটেটর</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              স্বয়ংক্রিয়ভাবে প্রতি ৫ সেকেন্ডে স্লাইড পরিবর্তন ও আনমাউন্টে টাইমার মেমরি লিক রোধে স্বয়ংক্রিয় ক্লিনআপ।
            </p>
          </div>

          {/* Task 4 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-amber-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">
                ৪
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                Auto-Pause
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">হোভার ও টাচ পজ</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              মাউস হোভার বা মোবাইলে স্ক্রিন টাচ করলে রোটেশন পজ এবং সরালে রিস্টার্ট হওয়ার স্টেট হ্যান্ডলিং।
            </p>
          </div>

          {/* Task 5 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-amber-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">
                ৫
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                Touch-Swipe
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">নেটিভ টাচ সোয়াইপ</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              মোবাইলে ডানে/বাঁয়ে সোয়াইপ (৫০px থ্রেশহোল্ড) দিয়ে স্লাইড পরিবর্তন এবং অক্ষীয় স্ক্যান ফিল্টারিং।
            </p>
          </div>
        </div>
      </section>

      {/* Module 4: Part 2 Verification & Optimization Highlights (Tasks 6 to 10) */}
      <section className="bg-white rounded-xl p-5 sm:p-6 border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
          <div className="flex items-center gap-2 text-gray-900 font-extrabold text-base">
            <Award className="w-5 h-5 text-emerald-600" />
            <span>মডিউল ৪ (ভাগ ২: কাজ ৬ থেকে ১০) ব্যানার কন্ট্রোলস ও অপ্টিমাইজেশন মেট্রিক্স</span>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full w-fit">
            ৫/৫ কাজ বাস্তবায়িত ও সক্রিয় (অডিট সংশোধিত)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Task 6 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-emerald-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                ৬
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                Side & Dots
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">সাইড অ্যারো ও বটম ডটস</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              অ্যামাজন সিগনেচার সেমি-ট্রান্সপারেন্ট বড় ন্যাভিগেশন তীর, এক্সপ্যান্ডেবল বটম ডটস, স্লাইড কাউন্টার ও প্লে/পজ টগল বোতাম।
            </p>
          </div>

          {/* Task 7 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-emerald-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                ৭
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                mobileImageUrl
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">রেসপন্সিভ মোবাইল আর্ট ডেলিভারি</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              মোবাইলের জন্য ডেডিকেটেড `mobileImageUrl` (৮০০px) এবং বড় স্ক্রিনে ১৫০০px ইমেজ লোডিং লজিক ও ব্যান্ডউইথ সাশ্রয়।
            </p>
          </div>

          {/* Task 8 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-emerald-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                ৮
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                Shimmer Blur & LCP
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">LCP প্রায়োরিটি ও শিimmer ব্লার</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              ১ম ব্যানারে `priority` ও `fetchPriority="high"` এবং এসভিজি বেস৬৪ শিimmer ব্লার প্লেসহোল্ডার (`placeholder="blur"`)।
            </p>
          </div>

          {/* Task 9 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-emerald-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                ৯
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                Full-Slide Click
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">ফুল-স্লাইড ক্লিকেবল লিঙ্ক ওভারলে</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              পুরো ব্যানার স্লাইড ক্লিকেবল লিঙ্ক ওভারলে (`prefetch={true}`) এবং অ্যাক্সেসিবল কীবোর্ড-ফোকাসড CTA বাটন।
            </p>
          </div>

          {/* Task 10 */}
          <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 hover:border-emerald-400 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                ১০
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                -mt Overlap & z-[4]
              </span>
            </div>
            <h4 className="text-xs font-bold text-gray-900">অ্যামাজন বটম ফেড ও ওভারল্যাপ</h4>
            <p className="text-[11px] text-gray-600 leading-tight">
              মাল্টি-স্টপ `#eaeded` ফেড (`z-[4]`) এবং `-mt-12 sm:-mt-20 md:-mt-28` নেগেটিভ মার্জিন দ্বারা কার্ড গ্রিড ওভারল্যাপ ইফেক্ট।
            </p>
          </div>
        </div>
      </section>

      {/* Hero Banner: 100% Milestone Celebration */}
      <section className="bg-gradient-to-r from-[#131921] via-[#232f3e] to-[#131921] rounded-xl p-6 sm:p-8 text-white shadow-xl border border-gray-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold tracking-wide border border-emerald-500/30">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>মডিউল ২: অ্যামাজন গ্লোবাল হেডার — ৫০/৫০ কাজ সম্পূর্ণ (১০০% সমাপ্তি)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              M.M Book House Malda — অ্যামাজন গ্লোবাল নেভিগেশন বার পূর্ণাঙ্গ সমাপ্তি
            </h1>
            <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
              মডিউল ২-এর ১০টি ভাগের মোট ৫০টি কাজ (কাজ ১ থেকে ৫০) সফলভাবে সম্পন্ন হয়েছে। সিগনেচার ডার্ক লাক্সারি প্যালেট (`#131921`), জিরো-রানটাইম সিএসএস অপ্টিমাইজেশন, Zustand এটমিক সিলেক্টর দ্বারা মেমরি লিক ও রি-রেন্ডার নিয়ন্ত্রণ, ইনস্ট্যান্ট ৬-সংখ্যার পিনকোড ভ্যালিডেশন এবং মোবাইলে ১-ট্যাপ ডিরেক্ট কল হেল্পলাইন সংযুক্ত হয়েছে।
            </p>
          </div>

          {/* Active Status Badge */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20 min-w-[280px] space-y-2">
            <span className="text-[11px] text-gray-300 font-semibold block">
              সিস্টেম ও লাইভ মেট্রিক্স (৫০/৫০ সম্পূর্ণ):
            </span>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <ShoppingCart className="w-4 h-4" />
                <span>কার্ট: {isBengali ? toBengaliNumerals(totalCount) : totalCount}টি</span>
              </div>
              <span className="text-xs bg-amber-400 text-gray-950 font-mono font-bold px-2 py-0.5 rounded">
                {formatINR(subtotal, language)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-red-300 font-semibold pt-1 border-t border-white/10">
              <div className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-red-400 fill-current" />
                <span>উইশলিস্ট: {isBengali ? toBengaliNumerals(wishlistCount) : wishlistCount}টি বই</span>
              </div>
              <span className="text-amber-300 font-mono">{language.toUpperCase()}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold pt-1 border-t border-white/10">
              <div className="flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-emerald-400" />
                <span>থিম: {themeConfig.nameBn}</span>
              </div>
              <span className="text-[10px] bg-emerald-900/60 text-emerald-200 px-1.5 py-0.5 rounded font-mono">
                {theme}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Part 10: Feature Matrix (Tasks 46 to 50) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>ভাগ ১০ (কাজ ৪৬ থেকে ৫০) বাস্তবায়ন মেট্রিক্স</span>
          </h2>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
            ৫০/৫০ কাজ প্রস্তুত (১০০% সমাপ্তি)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Task 46 Card */}
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
                ৪৬
              </span>
              <h3 className="font-bold text-sm text-gray-900">অ্যামাজন সিগনেচার ডার্ক লাক্সারি এসথেটিক</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              প্রাইমারি হেডার `#131921`, সাব-ন্যাভ `#232f3e` এবং ড্রয়ার ফুটার `#0f141a`—অ্যামাজনের নিজস্ব কালার প্যালেটের নিখুঁত সমন্বয়। হাই-কনট্রাস্ট টেক্সট এবং ১px প্রিমিয়াম হোভার বক্স এফেক্ট (`.amazon-nav-box`)।
            </p>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-green-700 font-semibold">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Uniform Amazon Dark Palette
              </span>
              <span className="text-gray-500 text-[10px] font-mono font-bold">#131921 / #232f3e</span>
            </div>
          </div>

          {/* Task 47 Card */}
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
                ৪৭
              </span>
              <h3 className="font-bold text-sm text-gray-900">জিরো-রানটাইম CSS অপ্টিমাইজেশন ও ট্রি-শেকিং</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              কোনো বাহ্যিক সিএসএস ফ্রেমওয়ার্ক বা অপ্রয়োজনীয় রানটাইম ব্লট নেই। বিশুদ্ধ Tailwind CSS v4 ইউটিলিটি ক্লাস ও নেক্সট.জেএস কম্পাইলার ট্রি-শেকিং দ্বারা হেডার বান্ডল সাইজ ন্যূনতম ও বিদ্যুতগতির রাখা হয়েছে।
            </p>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-green-700 font-semibold">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Pure Tailwind CSS Tree-Shaking
              </span>
              <span className="text-gray-500 text-[10px] font-mono">Zero Bloat</span>
            </div>
          </div>

          {/* Task 48 Card */}
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
                ৪৮
              </span>
              <h3 className="font-bold text-sm text-gray-900">মেমরি লিক ও রি-রেন্ডার নিয়ন্ত্রণ (Zustand Selectors)</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              `useCartCount` ও `useWishlistCount` এটমিক সিলেক্টর যোগ করা হয়েছে। কার্টের সাবটোটাল বা লাস্ট-অ্যাডেড আইটেম পরিবর্তিত হলেও কার্ট বাটন অহেতুক সম্পূর্ণ রি-রেন্ডার হয় না। সমস্ত লিসেনারের পরিচ্ছন্ন আনমাউন্ট ক্লিনআপ রয়েছে।
            </p>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-green-700 font-semibold">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Atomic Selectors & Leak Prevention
              </span>
              <span className="text-gray-500 text-[10px] font-mono">Isolated Renders</span>
            </div>
          </div>

          {/* Task 49 Card */}
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
                ৪৯
              </span>
              <h3 className="font-bold text-sm text-gray-900">ইনস্ট্যান্ট ৬-সংখ্যার পিনকোড ভ্যালিডেশন</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              গ্রাহক ৬ সংখ্যার পিনকোড টাইপ করামাত্র সরাসরি এরিয়া ও হোম ডেলিভারি স্ট্যাটাস ভ্যালিডেট হয় এবং `Enter ↵` চাপলেই মাউস ছাড়া সাথে সাথে ডেলিভারি লোকেশন সক্রিয় হয়ে যায়।
            </p>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-green-700 font-semibold">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> 6-Digit Auto-Check & Enter Key
              </span>
              <span className="text-gray-500 text-[10px] font-mono">Instant A11y</span>
            </div>
          </div>

          {/* Task 50 Card */}
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
                ৫০
              </span>
              <h3 className="font-bold text-sm text-gray-900">মোবাইল ডিরেক্ট ক্লিক-টু-কল হেল্পলাইন</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              মোবাইল ক্যাটাগরি ড্রয়ারের ভেতরে সরাসরি ১-ট্যাপ কল বাটন (`tel:+919800123456`), হোয়াটসঅ্যাপ সাপোর্ট লিঙ্ক এবং মালদা নেতাজি সুভাষ রোড স্টোরের কর্মঘণ্টা (সকাল ১০টা - রাত ৯টা) কার্ড সংযুক্ত।
            </p>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-green-700 font-semibold">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> 1-Tap Call & Store Hours
              </span>
              <span className="text-gray-500 text-[10px] font-mono">tel:+919800123456</span>
            </div>
          </div>

          {/* Interactive Simulation Controls for Part 10 */}
          <div className="bg-amber-50/80 rounded-lg p-5 shadow-sm border border-amber-200 space-y-3">
            <h3 className="font-bold text-sm text-amber-900 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>ভাগ ১০ লাইভ ইন্টারঅ্যাক্টিভ টেস্টিং কনসোল</span>
            </h3>
            <p className="text-xs text-amber-800 leading-relaxed">
              পিনকোড ভ্যালিডেশন, ১-ট্যাপ হেল্পলাইন কল ও থিম সুইচ পরীক্ষা করতে নিচের বোতামগুলি ব্যবহার করুন:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setIsPincodeModalOpen(true)}
                className="px-2.5 py-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded font-bold shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>পিনকোড টেস্ট মডাল (কাজ ৪৯)</span>
              </button>

              <a
                href="tel:+919800123456"
                className="px-2.5 py-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>১-ট্যাপ কল টেস্ট (কাজ ৫০)</span>
              </a>

              <button
                onClick={() => setTheme('default')}
                className={`px-2.5 py-1.5 text-xs rounded font-bold shadow-2xs flex items-center gap-1 cursor-pointer transition-colors ${
                  theme === 'default'
                    ? 'bg-[#131921] text-amber-400 border-2 border-amber-400'
                    : 'bg-gray-800 hover:bg-black text-white'
                }`}
              >
                <span>স্ট্যান্ডার্ড ডার্ক</span>
                {theme === 'default' && <Check className="w-3 h-3" />}
              </button>

              <button
                onClick={() => setTheme('durga_puja')}
                className={`px-2.5 py-1.5 text-xs rounded font-bold shadow-2xs flex items-center gap-1 cursor-pointer transition-colors ${
                  theme === 'durga_puja'
                    ? 'bg-red-700 text-white border-2 border-amber-300'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                <span>🌸 দুর্গোৎসব</span>
                {theme === 'durga_puja' && <Check className="w-3 h-3" />}
              </button>

              <button
                onClick={() => setTheme('eid')}
                className={`px-2.5 py-1.5 text-xs rounded font-bold shadow-2xs flex items-center gap-1 cursor-pointer transition-colors ${
                  theme === 'eid'
                    ? 'bg-emerald-800 text-white border-2 border-emerald-300'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                }`}
              >
                <span>🌙 ঈদ মুবারক</span>
                {theme === 'eid' && <Check className="w-3 h-3" />}
              </button>

              <button
                onClick={() => setTheme('malda_book_fair')}
                className={`px-2.5 py-1.5 text-xs rounded font-bold shadow-2xs flex items-center gap-1 cursor-pointer transition-colors ${
                  theme === 'malda_book_fair'
                    ? 'bg-purple-800 text-white border-2 border-amber-300'
                    : 'bg-purple-700 hover:bg-purple-800 text-white'
                }`}
              >
                <span>📚 বইমেলা</span>
                {theme === 'malda_book_fair' && <Check className="w-3 h-3" />}
              </button>
            </div>

            <div className="pt-2 border-t border-amber-200/60 flex flex-wrap gap-2">
              <button
                onClick={() => setForceOfflineSimulation(!forceOfflineSimulation)}
                className={`px-2.5 py-1.5 text-xs rounded font-bold shadow-2xs flex items-center gap-1 cursor-pointer transition-colors ${
                  forceOfflineSimulation
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-800 hover:bg-black text-white'
                }`}
              >
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span>{forceOfflineSimulation ? 'অফলাইন মোড বন্ধ' : 'অফলাইন মোড টেস্ট'}</span>
              </button>

              <button
                onClick={() => toggleWishlistItem('book-wbcs-manual-2026')}
                className="px-2.5 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded font-bold shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>{isInWishlist('book-wbcs-manual-2026') ? 'WBCS উইশলিস্ট থেকে সরান' : '+ WBCS উইশলিস্টে যোগ'}</span>
              </button>

              <button
                onClick={toggleAuthStatus}
                className="px-2.5 py-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <User className="w-3.5 h-3.5 text-amber-300" />
                <span>{isLoggedIn ? 'গেস্ট ভিউতে যান' : 'লগইন করুন (সাবির - ছবিসহ)'}</span>
              </button>

              <button
                onClick={toggleLanguage}
                className="px-2.5 py-1.5 text-xs bg-white hover:bg-amber-100 border border-amber-300 rounded font-bold text-gray-800 shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-amber-600" />
                <span>ভাষা: {language === 'bn' ? 'English (EN)' : 'বাংলা (BN)'}</span>
              </button>

              <button
                onClick={() => handleAddSampleBook(0)}
                className="px-2.5 py-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded font-bold shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ কার্ট ({formatINR(650, language)})</span>
              </button>

              <button
                onClick={clearCart}
                className="px-2.5 py-1.5 text-xs bg-white hover:bg-red-50 text-red-700 border border-red-300 rounded font-bold shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>কার্ট ক্লিয়ার</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Grand 10-Part Completion Status Overview (Tasks 1 to 50) */}
      <section className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2 text-gray-900 font-extrabold text-base">
            <Award className="w-5 h-5 text-emerald-600" />
            <span>মডিউল ২: অ্যামাজন গ্লোবাল হেডার — ১০টি ভাগের পূর্ণাঙ্গ সম্পন্নতার সারসংক্ষেপ (৫০/৫০)</span>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">
            ১০০% কমপ্লিট
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 bg-gray-50 rounded border border-gray-200 text-center space-y-1">
            <span className="text-xs font-bold text-gray-800 block">ভাগ ১ (কাজ ১-৫)</span>
            <span className="text-[11px] text-emerald-600 font-semibold block">✓ লোগো ও ডেলিভারি</span>
          </div>
          <div className="p-3 bg-gray-50 rounded border border-gray-200 text-center space-y-1">
            <span className="text-xs font-bold text-gray-800 block">ভাগ ২ (কাজ ৬-১০)</span>
            <span className="text-[11px] text-emerald-600 font-semibold block">✓ সার্চ ও নোটিফিকেশন</span>
          </div>
          <div className="p-3 bg-gray-50 rounded border border-gray-200 text-center space-y-1">
            <span className="text-xs font-bold text-gray-800 block">ভাগ ৩ (কাজ ১১-১৫)</span>
            <span className="text-[11px] text-emerald-600 font-semibold block">✓ নোটিশ ও বটম ন্যাভ</span>
          </div>
          <div className="p-3 bg-gray-50 rounded border border-gray-200 text-center space-y-1">
            <span className="text-xs font-bold text-gray-800 block">ভাগ ৪ (কাজ ১৬-২০)</span>
            <span className="text-[11px] text-emerald-600 font-semibold block">✓ ভাষা ও অ্যাকাউন্ট ফ্লাইআউট</span>
          </div>
          <div className="p-3 bg-gray-50 rounded border border-gray-200 text-center space-y-1">
            <span className="text-xs font-bold text-gray-800 block">ভাগ ৫ (কাজ ২১-২৫)</span>
            <span className="text-[11px] text-emerald-600 font-semibold block">✓ কার্ট ও স্ক্রোল হাইড</span>
          </div>
          <div className="p-3 bg-gray-50 rounded border border-gray-200 text-center space-y-1">
            <span className="text-xs font-bold text-gray-800 block">ভাগ ৬ (কাজ ২৬-৩০)</span>
            <span className="text-[11px] text-emerald-600 font-semibold block">✓ ডার্ক থিম ও Zero-CLS</span>
          </div>
          <div className="p-3 bg-gray-50 rounded border border-gray-200 text-center space-y-1">
            <span className="text-xs font-bold text-gray-800 block">ভাগ ৭ (কাজ ৩১-৩৫)</span>
            <span className="text-[11px] text-emerald-600 font-semibold block">✓ ট্যাব সিঙ্ক ও রুপি/বাংলা</span>
          </div>
          <div className="p-3 bg-gray-50 rounded border border-gray-200 text-center space-y-1">
            <span className="text-xs font-bold text-gray-800 block">ভাগ ৮ (কাজ ৩৬-৪০)</span>
            <span className="text-[11px] text-emerald-600 font-semibold block">✓ অফলাইন ও উইশলিস্ট</span>
          </div>
          <div className="p-3 bg-gray-50 rounded border border-gray-200 text-center space-y-1">
            <span className="text-xs font-bold text-gray-800 block">ভাগ ৯ (কাজ ৪১-৪৫)</span>
            <span className="text-[11px] text-emerald-600 font-semibold block">✓ ফেস্টিভ থিম ও ৪৪px টাচ</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded border border-emerald-300 text-center space-y-1">
            <span className="text-xs font-bold text-emerald-900 block">ভাগ ১০ (কাজ ৪৬-৫০)</span>
            <span className="text-[11px] text-emerald-700 font-bold block">✓ এসথেটিক ও হেল্পলাইন</span>
          </div>
        </div>
      </section>

      {/* Long Scroll Content for Testing Auto-Hide & Compact Scroll */}
      <section className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-gray-800 font-bold text-sm pb-2 border-b border-gray-100">
          <ArrowUpDown className="w-4 h-4 text-amber-600" />
          <span>স্ক্রোল টেস্ট এরিয়া (কাজ ২৫ ও ৩১: ডিরেকশনাল স্ক্রোল ডিটেকশন ও কমপ্যাক্ট হেডার)</span>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          নিচের দিকে পেজ স্ক্রোল করুন (&gt;২০০px)। লক্ষ্য করুন—মোবাইল স্ক্রিনে সার্চ বার ও ডেলিভারি স্ট্রিপ স্বয়ংক্রিয়ভাবে সংকুচিত হয়ে মূল্যবান উল্লম্ব স্থান সংরক্ষণ করে। আবার সামান্য উপরে স্ক্রোল করলেই সমস্ত উপাদান মসৃণ ট্রানজিশনে পুনরায় দৃশ্যমান হবে।
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="p-4 rounded border border-gray-100 bg-gray-50/70 space-y-1.5 text-center">
              <div className="w-12 h-16 mx-auto bg-amber-100/60 rounded border border-amber-200 flex items-center justify-center text-amber-800">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-gray-800 block">বইয়ের ক্যাটালগ আইটেম #{idx + 1}</span>
              <span className="text-[11px] text-gray-500 block">মালদা বুক হাউস এক্সক্লুসিভ</span>
            </div>
          ))}
        </div>
      </section>

      {/* Bulk Order Modal */}
      <BulkOrderModal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} />

      {/* Pincode Test Modal */}
      <PincodeModal
        isOpen={isPincodeModalOpen}
        onClose={() => setIsPincodeModalOpen(false)}
        currentPincode={location.pincode}
        onSelectPincode={(code) => updatePincode(code)}
        fulfillmentMode={location.fulfillmentMode}
        onSelectFulfillmentMode={setFulfillmentMode}
      />
    </div>
  );
}
