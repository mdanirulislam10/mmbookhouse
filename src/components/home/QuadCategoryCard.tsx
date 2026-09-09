'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { QuadCardBlock } from '@/types/quadCard';

// Shimmer effect placeholder for blur image loading
const shimmerSvg = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f3f4f6" offset="20%" />
      <stop stop-color="#e5e7eb" offset="50%" />
      <stop stop-color="#f3f4f6" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f3f4f6" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === 'undefined' ? Buffer.from(str).toString('base64') : window.btoa(str);

const SHIMMER_BLUR_DATA_URL = `data:image/svg+xml;base64,${toBase64(shimmerSvg(300, 225))}`;

interface QuadCategoryCardProps {
  block: QuadCardBlock;
  priority?: boolean;
}

export const QuadCategoryCard: React.FC<QuadCategoryCardProps> = ({ block, priority = false }) => {
  return (
    <div className="bg-white rounded-lg p-4 sm:p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full group/card relative z-0">
      {/* Card Header (Title & Subtitle) */}
      <div className="mb-2.5">
        <h3 className="text-lg sm:text-xl font-bold text-gray-950 font-bengali leading-snug line-clamp-1 group-hover/card:text-amber-700 transition-colors">
          {block.titleBn}
        </h3>
        {block.subtitleBn && (
          <p className="text-[11px] sm:text-xs text-gray-500 font-bengali line-clamp-1 mt-0.5">
            {block.subtitleBn}
          </p>
        )}
      </div>

      {/* Task 12: 2x2 Multi-Tile Grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 my-auto">
        {block.items.map((item, index) => (
          <Link
            key={item.id}
            href={item.targetUrl}
            prefetch={true}
            className="group/item flex flex-col space-y-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-md"
            aria-label={`${item.titleBn} - ${item.badgeTextBn || ''}`}
          >
            {/* Tile Image with Responsive Aspect Ratio */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-gray-100 border border-gray-100">
              <Image
                src={item.imageUrl}
                alt={item.titleBn}
                fill
                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 240px"
                placeholder="blur"
                blurDataURL={SHIMMER_BLUR_DATA_URL}
                priority={priority && index < 2}
                className="object-cover object-center group-hover/item:scale-105 transition-transform duration-300"
              />

              {/* Optional Item Badge */}
              {item.badgeTextBn && (
                <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-gray-950/75 text-amber-300 text-[9px] font-bold rounded shadow-xs backdrop-blur-xs font-bengali">
                  {item.badgeTextBn}
                </span>
              )}
            </div>

            {/* Tile Caption */}
            <span className="text-[11px] sm:text-xs text-gray-800 font-medium font-bengali line-clamp-1 group-hover/item:text-amber-800 transition-colors">
              {item.titleBn}
            </span>
          </Link>
        ))}
      </div>

      {/* Task 15: "See more / আরও দেখুন" Direct Navigation Link */}
      <div className="mt-3.5 pt-2.5 border-t border-gray-100">
        <Link
          href={block.seeMoreUrl}
          prefetch={true}
          className="text-xs sm:text-sm font-semibold text-sky-700 hover:text-amber-700 hover:underline inline-flex items-center gap-1 font-bengali group/link focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500 rounded"
          aria-label={`${block.titleBn} এর ${block.seeMoreTextBn}`}
        >
          <span>{block.seeMoreTextBn}</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-1" />
        </Link>
      </div>
    </div>
  );
};
