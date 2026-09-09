'use client';

import React, { useState } from 'react';
import { StickyHeaderWrapper } from './StickyHeaderWrapper';
import { Logo } from './Logo';
import { DeliveryLocation } from './DeliveryLocation';
import { PincodeModal } from './PincodeModal';
import { SearchBar } from './SearchBar';
import { NotificationBell } from './NotificationBell';
import { TopNoticeBar } from './TopNoticeBar';
import { BulkOrderModal } from './BulkOrderModal';
import { SubnavBar } from '@/components/category-drawer/SubnavBar';
import { LanguageSelector } from './LanguageSelector';
import { AccountFlyout } from './AccountFlyout';
import { ReturnsOrdersLink } from './ReturnsOrdersLink';
import { CartButton } from './CartButton';
import { SellerAdminBadge } from './SellerAdminBadge';
import { HelplineQuickContact } from './HelplineQuickContact';
import { WishlistHeaderButton } from './WishlistHeaderButton';
import { OfflineStatusIndicator } from './OfflineStatusIndicator';
import { FestiveRibbon } from './FestiveRibbon';
import { useDeliveryLocation } from '@/hooks/useDeliveryLocation';
import { useCategoryDrawer } from '@/hooks/useCategoryDrawer';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useLanguage } from '@/hooks/useLanguage';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useFestiveTheme } from '@/hooks/useFestiveTheme';
import { getHeaderDictionary } from '@/lib/i18n/headerDictionary';
import { MapPin, Store, ChevronRight, Menu, Phone } from 'lucide-react';

interface HeaderProps {
  onSearch?: (query: string, category: string) => void;
  onOpenCategoriesDrawer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearch, onOpenCategoriesDrawer }) => {
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const { location, updatePincode, setFulfillmentMode } = useDeliveryLocation();
  const { isLoggedIn, fullName } = useAuthSession();
  const { language } = useLanguage();
  const dict = getHeaderDictionary(language);
  const { openDrawer, isOpen } = useCategoryDrawer();
  const { shouldHideSubHeader, isCompactMode } = useScrollDirection({ threshold: 200, compactThreshold: 200 });
  const { isFestive, currentConfig } = useFestiveTheme();

  const isPickup = location.fulfillmentMode === 'pickup';
  const customerDisplayName = isLoggedIn && fullName ? fullName.split(' ')[0] : location.customerName;

  const handleOpenCategories = () => {
    onOpenCategoriesDrawer?.();
    openDrawer();
  };

  return (
    <StickyHeaderWrapper className={isFestive ? `bg-gradient-to-r ${currentConfig.bgGradient}` : ''}>
      {/* Task 11: Dynamic Dismissible Top Store Alert Notice Bar (role="region") */}
      <TopNoticeBar
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        onOpenBulkModal={() => setIsBulkModalOpen(true)}
      />

      {/* Task 37: Real-Time Network Offline Status Warning Banner */}
      <OfflineStatusIndicator />

      {/* 1. Main Header Container (Task 31: Compact Mode on Directional Scroll) */}
      <div className={`max-w-[1500px] mx-auto px-2 sm:px-4 flex flex-col gap-1.5 text-white transition-all duration-200 ${
        isCompactMode ? 'py-1 sm:py-1' : 'pt-1.5 pb-1'
      }`}>
        {/* Row 1: Primary Navigation Bar (Task 24 & Task 30 Zero-CLS) */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 min-h-[50px] sm:min-h-[56px]">
          {/* Left: Mobile Drawer Trigger + Brand Logo & Desktop Delivery Location */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Task 24, 43 & 44: Mobile Hamburger Menu Trigger (Min 44px Touch Target with Full A11y) */}
            <button
              id="category-hamburger-trigger-mobile"
              type="button"
              onClick={handleOpenCategories}
              aria-expanded={isOpen}
              aria-haspopup="dialog"
              aria-controls="category-mega-drawer"
              aria-label="সকল বইয়ের বিভাগ ও মেগা মেনু খুলুন"
              className="md:hidden min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center text-gray-200 hover:text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 rounded-sm cursor-pointer transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Task 1 & 42: SVG Logo & Brand Name with Soft Glow & Scale Transition */}
            <Logo />

            {/* Task 45: Promotional Festive Ribbon Slot */}
            <FestiveRibbon className="hidden sm:inline-flex shrink-0 ml-1" />

            {/* Task 3, 4, 5, 9: Desktop Delivery Location Trigger */}
            <DeliveryLocation
              onOpenModal={() => setIsLocationModalOpen(true)}
              className="hidden md:flex"
            />
          </div>

          {/* Center (Desktop Only): Tasks 6, 7, 8, 34, 35, 43 - 3-Part Central Search Bar */}
          <div className="flex-1 max-w-3xl hidden sm:flex items-center">
            <SearchBar onSearch={onSearch} isMobile={false} />
          </div>

          {/* Right: Seller Badge, Helpline, Wishlist, Notifications, Language, Account, Orders & Cart */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Task 28: Seller / Admin Quick Status Badge (Desktop Large Viewport) */}
            <SellerAdminBadge className="hidden xl:flex" />

            {/* Task 29: WhatsApp & Phone Helpline Quick Contact (Desktop Viewport) */}
            <HelplineQuickContact className="hidden lg:inline-block" />

            {/* Task 50: Mobile/Tablet 1-Tap Direct Click-to-Call Helpline Button (tel:+919800123456) */}
            <a
              href="tel:+919800123456"
              aria-label="মালদা বুক হাউস সরাসরি কল করুন"
              title="দোকানে সরাসরি ফোন করুন: +919800123456"
              className="lg:hidden min-w-[40px] min-h-[40px] flex items-center justify-center text-amber-400 hover:text-white rounded transition-colors cursor-pointer"
            >
              <Phone className="w-4 h-4" />
            </a>

            {/* Task 40: Wishlist Quick Heart Counter Icon (hidden on tablet for wide search bar) */}
            <WishlistHeaderButton className="hidden lg:flex" />

            {/* Task 10: Real-time Notification Bell & Popover */}
            <NotificationBell />

            {/* Task 16: Language Selector (EN / বাংলা Toggle) */}
            <LanguageSelector className="hidden lg:block" />

            {/* Task 17, 18, 19, 39: Customer Account Flyout Menu with UserAvatar */}
            <AccountFlyout className="hidden sm:block" />

            {/* Task 20: 1-Click Returns & Orders Link */}
            <ReturnsOrdersLink />

            {/* Task 21, 22, 23, 33: Shopping Cart Button with Badge, Bounce & Flyout */}
            <CartButton />
          </div>
        </div>

        {/* Row 2 (Mobile Only): Full-width 3-part Search Bar with Task 25 Auto-Hide */}
        <div
          className={`sm:hidden w-full transition-all duration-300 ease-in-out ${
            shouldHideSubHeader
              ? 'max-h-0 opacity-0 -translate-y-2 overflow-hidden pointer-events-none'
              : 'max-h-16 opacity-100 translate-y-0'
          }`}
        >
          <SearchBar onSearch={onSearch} isMobile={true} />
        </div>
      </div>

      {/* 2. Sub-Navigation Bar: Unified Amazon Subnav with Hamburger Trigger */}
      <SubnavBar onOpenCategories={handleOpenCategories} />

      {/* 3. Row 3 (Mobile Only): Amazon Signature Slim Delivery Strip with Task 25 Auto-Hide */}
      <button
        type="button"
        onClick={() => setIsLocationModalOpen(true)}
        aria-label={isPickup ? dict.delivery.ariaPickup : dict.delivery.ariaDelivery(location.area, location.pincode)}
        className={`md:hidden w-full bg-[#19222d] hover:bg-[#202b38] text-gray-200 px-3 py-1.5 flex items-center justify-between text-xs select-none transition-all duration-300 border-t border-black/30 cursor-pointer ${
          shouldHideSubHeader
            ? 'max-h-0 opacity-0 overflow-hidden py-0 border-t-0 pointer-events-none'
            : 'max-h-12 opacity-100'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          {isPickup ? (
            <Store className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          ) : (
            <MapPin className="w-3.5 h-3.5 text-gray-300 shrink-0" />
          )}
          <span className="text-[11px] text-gray-300 truncate">
            {isPickup ? (
              <span className="font-semibold text-amber-400">
                {dict.delivery.pickupMode}: {dict.delivery.pickupCounterFree}
              </span>
            ) : (
              <>
                {dict.delivery.deliveryTo}:{' '}
                <strong className="text-white">
                  {customerDisplayName ? `${customerDisplayName} - ` : ''}{location.area} ({location.pincode})
                </strong>
              </>
            )}
          </span>
        </div>
        <div className="flex items-center gap-0.5 text-amber-400 text-[10px] font-bold shrink-0 ml-1">
          <span>{dict.delivery.changeLocation}</span>
          <ChevronRight className="w-3 h-3" />
        </div>
      </button>

      {/* 4. Single Centralized Pincode & Pickup Modal */}
      <PincodeModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentPincode={location.pincode}
        onSelectPincode={(code) => updatePincode(code)}
        fulfillmentMode={location.fulfillmentMode}
        onSelectFulfillmentMode={setFulfillmentMode}
      />

      {/* 5. Institutional B2B Bulk Order Quote Modal */}
      <BulkOrderModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
      />
    </StickyHeaderWrapper>
  );
};
