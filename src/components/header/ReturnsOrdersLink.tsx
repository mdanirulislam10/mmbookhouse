'use client';

import React from 'react';
import Link from 'next/link';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useLanguage } from '@/hooks/useLanguage';
import { getHeaderDictionary } from '@/lib/i18n/headerDictionary';

interface ReturnsOrdersLinkProps {
  className?: string;
}

export const ReturnsOrdersLink: React.FC<ReturnsOrdersLinkProps> = React.memo(({ className = '' }) => {
  const { isLoggedIn } = useAuthSession();
  const { language } = useLanguage();
  const dict = getHeaderDictionary(language);

  const destinationHref = isLoggedIn ? '/orders' : '/login?redirect=/orders';

  return (
    <Link
      href={destinationHref}
      aria-label={dict.returnsOrders.ariaLabel}
      className={`amazon-nav-box hidden md:flex flex-col leading-tight select-none text-white cursor-pointer ${className}`}
    >
      <span className="text-[11px] text-gray-300 font-normal tracking-tight">
        {dict.returnsOrders.returns}
      </span>
      <span className="text-xs font-bold text-white tracking-tight group-hover:text-amber-300">
        {dict.returnsOrders.orders}
      </span>
    </Link>
  );
});

ReturnsOrdersLink.displayName = 'ReturnsOrdersLink';

