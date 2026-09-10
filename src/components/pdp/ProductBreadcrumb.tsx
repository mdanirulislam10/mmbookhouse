'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { DetailedBookProduct } from '@/types/pdp';
import { useLanguage } from '@/hooks/useLanguage';

export interface BreadcrumbItem {
  label: string;
  labelBn?: string;
  href: string;
}

export interface ProductBreadcrumbProps {
  book?: DetailedBookProduct;
  category?: string;
  categoryName?: string;
  subCategory?: string;
  subCategoryName?: string;
  bookTitle?: string;
  bookTitleBn?: string;
  customCrumbs?: BreadcrumbItem[];
  className?: string;
}

/**
 * Task 7: Hierarchical SEO Breadcrumb Trail
 *
 * e.g. Home > Category > Subcategory > Book Title
 * Supports:
 * - Direct pass of `book: DetailedBookProduct` OR individual category/title props
 * - Schema.org BreadcrumbList JSON-LD & microdata
 * - 1-click parent navigation
 * - Responsive truncation
 */
export const ProductBreadcrumb: React.FC<ProductBreadcrumbProps> = ({
  book,
  category: propCat,
  categoryName: propCatName,
  subCategory: propSubCat,
  subCategoryName: propSubCatName,
  bookTitle: propTitle,
  bookTitleBn: propTitleBn,
  customCrumbs,
  className = '',
}) => {
  const { language } = useLanguage();
  const isBengali = language === 'bn';

  const category = propCat || book?.category;
  const categoryName = propCatName || book?.categoryName;
  const subCategory = propSubCat || book?.subCategory;
  const subCategoryName = propSubCatName || book?.subCategoryName;
  const title = propTitle || book?.title || '';
  const titleBn = propTitleBn || book?.titleBn;

  // Build trail
  let crumbs: BreadcrumbItem[] = [];

  if (customCrumbs && customCrumbs.length > 0) {
    crumbs = customCrumbs;
  } else {
    crumbs.push({
      label: 'Home',
      labelBn: 'হোম',
      href: '/',
    });

    if (category) {
      crumbs.push({
        label: categoryName || category,
        labelBn: categoryName || category,
        href: `/category/${category}`,
      });
    }

    if (subCategory && category) {
      crumbs.push({
        label: subCategoryName || subCategory,
        labelBn: subCategoryName || subCategory,
        href: `/category/${category}/${subCategory}`,
      });
    }
  }

  const currentTitle = isBengali ? (titleBn || title) : title;

  // JSON-LD structured data for Google Search rich snippet
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      ...crumbs.map((crumb, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: isBengali ? (crumb.labelBn || crumb.label) : crumb.label,
        item: `https://mmbookhouse.in${crumb.href}`,
      })),
      {
        '@type': 'ListItem',
        position: crumbs.length + 1,
        name: currentTitle,
        item: `https://mmbookhouse.in/book/${book?.slug || book?.bookId || ''}`,
      },
    ],
  };

  return (
    <nav
      aria-label="Breadcrumb"
      className={`text-xs text-gray-500 py-2.5 overflow-x-auto scrollbar-none select-none ${className}`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <ol
        className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {crumbs.map((crumb, idx) => {
          const crumbLabel = isBengali ? (crumb.labelBn || crumb.label) : crumb.label;
          const isFirst = idx === 0;

          return (
            <li
              key={crumb.href}
              className="flex items-center gap-1.5"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              <Link
                href={crumb.href}
                itemProp="item"
                className="flex items-center gap-1 hover:text-amber-700 hover:underline transition-colors font-medium text-gray-600"
              >
                {isFirst && <Home className="w-3.5 h-3.5 text-gray-400" />}
                <span itemProp="name">{crumbLabel}</span>
              </Link>
              <meta itemProp="position" content={String(idx + 1)} />
              <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
            </li>
          );
        })}

        {/* Current Book Title (Leaf) */}
        <li
          className="flex items-center text-gray-900 font-semibold truncate max-w-[180px] sm:max-w-[320px] md:max-w-[420px]"
          aria-current="page"
          itemProp="itemListElement"
          itemScope
          itemType="https://schema.org/ListItem"
        >
          <span itemProp="name" title={currentTitle} className="truncate">
            {currentTitle}
          </span>
          <meta itemProp="position" content={String(crumbs.length + 1)} />
        </li>
      </ol>
    </nav>
  );
};
