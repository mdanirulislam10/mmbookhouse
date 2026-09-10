/**
 * Module 7: Look Inside Preview Engine Service
 * Tasks 14 & 18: Optimized WebP Stream Delivery & Cloud PDF Slicing Helper
 *
 * Provides:
 * 1. WebP image stream transformation and responsive sizing.
 * 2. Mobile hang prevention via lazy image streaming and in-memory preloading cache.
 * 3. High-fidelity SVG paper fallbacks for missing or 404 image URLs.
 * 4. Automated cloud PDF sample slicer simulation (Extracts first 5 pages: Cover, Preface, TOC, Sample Chapter).
 * 5. Graceful fallback validation for books with or without Look Inside preview data (Task 19).
 */

import { DetailedBookProduct, LookInsideSamplePage } from '@/types/pdp';
import { toBengaliNumerals } from '@/lib/utils/currency';

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
  dpr?: number;
}

export interface PdfSlicingResult {
  success: boolean;
  totalPagesExtracted: number;
  samplePages: LookInsideSamplePage[];
  processingTimeMs: number;
  sourcePdfUrl: string;
  watermarkApplied: boolean;
}

// Memory cache for preloaded images to ensure instant page flips
const PRELOAD_CACHE = new Set<string>();

/**
 * Task 14: Optimized WebP Image Stream Delivery
 * Transforms local or CDN image URLs with optimized WebP/AVIF parameters,
 * reducing mobile bandwidth and preventing memory bloat.
 */
export function getOptimizedPageUrl(
  url: string,
  options: ImageOptimizationOptions = {}
): string {
  if (!url || typeof url !== 'string') return '';

  // Return SVG data URIs as-is
  if (url.startsWith('data:image/svg')) {
    return url;
  }

  const { width = 900, quality = 82, format = 'webp' } = options;

  // If already Cloudinary URL, append transformation flags
  if (url.includes('res.cloudinary.com')) {
    const transformations = `f_${format},q_${quality},w_${width},c_limit`;
    return url.replace('/upload/', `/upload/${transformations}/`);
  }

  // If standard Supabase storage URL, apply render transformations if supported
  if (url.includes('supabase.co/storage/v1/object/public')) {
    return `${url}?width=${width}&quality=${quality}&format=${format}`;
  }

  // For Next.js public static or local assets, append optimization query hints
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}w=${width}&q=${quality}&fmt=${format}`;
}

/**
 * Task 14 & 18: Generates lightweight thumbnail URLs for page filmstrips
 */
export function getPageThumbnailUrl(
  pageOrUrl: string | { imageUrl?: string; thumbnailUrl?: string },
  width = 160
): string {
  const url =
    typeof pageOrUrl === 'string'
      ? pageOrUrl
      : pageOrUrl?.thumbnailUrl || pageOrUrl?.imageUrl || '';
  return getOptimizedPageUrl(url, { width, quality: 65, format: 'webp' });
}

/**
 * Task 14: Preload adjacent pages in the background
 * Helps eliminate page-turn lag on mobile & low-bandwidth networks
 */
export function preloadAdjacentPages(
  pages: LookInsideSamplePage[],
  currentIndex: number,
  lookahead = 2
): void {
  if (typeof window === 'undefined' || !pages || pages.length === 0) return;

  const indicesToPreload: number[] = [];
  for (let i = 1; i <= lookahead; i++) {
    if (currentIndex + i < pages.length) indicesToPreload.push(currentIndex + i);
    if (currentIndex - i >= 0) indicesToPreload.push(currentIndex - i);
  }

  indicesToPreload.forEach((idx) => {
    const page = pages[idx];
    if (!page?.imageUrl) return;

    const optUrl = getOptimizedPageUrl(page.imageUrl, { width: 900 });
    if (!PRELOAD_CACHE.has(optUrl)) {
      PRELOAD_CACHE.add(optUrl);
      const img = new Image();
      img.decoding = 'async';
      img.src = optUrl;
    }
  });
}

/**
 * Task 14 & 20: High-fidelity realistic SVG paper page generator
 * Used as fallback if an image 404s or while preview loads,
 * rendering crisp Bengali book typography, borders, and book metadata.
 */
export function generateBookPageSvgFallback(
  page: Partial<LookInsideSamplePage>,
  bookOrTitle: string | Partial<DetailedBookProduct> = 'M.M Book House Malda',
  authorParam = 'এম.এম রিসার্চ টিম'
): string {
  const pageNum = page.pageNumber || 1;
  const pageTitle = page.title || `নমুনা পাতা ${pageNum}`;
  const bnNum = toBengaliNumerals(pageNum);

  let bookTitle = 'M.M Book House Malda';
  let author = authorParam;

  if (typeof bookOrTitle === 'object' && bookOrTitle !== null) {
    bookTitle = bookOrTitle.titleBn || bookOrTitle.title || bookTitle;
    author = bookOrTitle.authorBn || bookOrTitle.author || author;
  } else if (typeof bookOrTitle === 'string') {
    bookTitle = bookOrTitle;
  }

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 850" width="100%" height="100%">
  <defs>
    <linearGradient id="paperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fffdfa"/>
      <stop offset="50%" stop-color="#fcf8f2"/>
      <stop offset="100%" stop-color="#f7f2ea"/>
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.08"/>
    </filter>
  </defs>

  <!-- Paper background -->
  <rect width="600" height="850" fill="url(#paperGrad)" />

  <!-- Book Spine Border Simulation -->
  <line x1="20" y1="30" x2="20" y2="820" stroke="#e8dec8" stroke-width="2" stroke-dasharray="4,4"/>
  <rect x="25" y="25" width="550" height="800" fill="none" stroke="#d5c8ad" stroke-width="1.2" rx="4"/>

  <!-- Running Header -->
  <text x="50" y="65" font-family="'Hind Siliguri', sans-serif" font-size="13" font-weight="600" fill="#716040">
    M.M BOOK HOUSE • MALDA
  </text>
  <text x="550" y="65" text-anchor="end" font-family="'Hind Siliguri', sans-serif" font-size="13" font-weight="600" fill="#716040">
    নমুনা পাতা ${bnNum}
  </text>
  <line x1="50" y1="78" x2="550" y2="78" stroke="#d5c8ad" stroke-width="0.8"/>

  <!-- Section Badge -->
  <rect x="50" y="110" width="120" height="26" rx="4" fill="#007185" />
  <text x="110" y="127" text-anchor="middle" font-family="'Hind Siliguri', sans-serif" font-size="12" font-weight="bold" fill="#ffffff">
    Look Inside
  </text>

  <!-- Page Title -->
  <text x="50" y="180" font-family="'Hind Siliguri', sans-serif" font-size="24" font-weight="bold" fill="#1e293b">
    ${escapeXml(pageTitle)}
  </text>
  <text x="50" y="212" font-family="'Hind Siliguri', sans-serif" font-size="14" fill="#64748b">
    বই: ${escapeXml(bookTitle)} | লেখক: ${escapeXml(author)}
  </text>

  <!-- Simulated Content Paragraphs -->
  <g fill="#334155" font-family="'Hind Siliguri', sans-serif" font-size="13.5" letter-spacing="0.2">
    <!-- Para 1 -->
    <text x="50" y="270">পশ্চিমবঙ্গ পাবলিক সার্ভিস কমিশন (WBCS) ও রাজ্য স্তরের অন্যান্য প্রতিযোগিতামূলক</text>
    <text x="50" y="295">পরীক্ষার পাঠ্যক্রম ও বিগত বছরগুলির প্রশ্নপত্রের গভীর বিশ্লেষণের ওপর ভিত্তি করে</text>
    <text x="50" y="320">এই পুস্তকটি ছাত্রছাত্রীদের উপযোগী করে সংকলন ও প্রস্তুত করা হয়েছে।</text>

    <!-- Decorative divider -->
    <circle cx="300" cy="360" r="3" fill="#007185"/>
    <circle cx="280" cy="360" r="2" fill="#c7511f"/>
    <circle cx="320" cy="360" r="2" fill="#c7511f"/>
    <line x1="180" y1="360" x2="260" y2="360" stroke="#d5c8ad" stroke-width="1"/>
    <line x1="340" y1="360" x2="420" y2="360" stroke="#d5c8ad" stroke-width="1"/>

    <!-- Key Topics Box -->
    <rect x="50" y="395" width="500" height="210" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
    <text x="75" y="430" font-size="15" font-weight="bold" fill="#0f172a">📌 এই অধ্যায়ের গুরুত্বপূর্ণ আলোচ্য বিষয়সমূহ:</text>
    <text x="85" y="465">• ঐতিহাসিক পটভূমি ও ধারণার সহজ ও বোধগম্য সরল ব্যাখ্যা</text>
    <text x="85" y="495">• বিগত ২০ বছরের প্রিলিমস ও মেইনস পরীক্ষার প্রশ্ন ও পূর্ণ সমাধান</text>
    <text x="85" y="525">• মালদা ও উত্তরবঙ্গ অঞ্চলের ছাত্রছাত্রীদের জন্য বিশেষ নোটস</text>
    <text x="85" y="555">• অধ্যায়ভিত্তিক দ্রুত রিভিশন চার্ট ও সেলফ-অ্যাসেসমেন্ট মক টেস্ট</text>
    <text x="85" y="585">• পরীক্ষার্থীদের সাধারণ ভুলভ্রান্তি ও টপারদের স্ট্র্যাটেজি টিপস</text>

    <!-- Additional text -->
    <text x="50" y="650">নমুনা পাঠ শেষ হলে মূল বইটি সংগ্রহ করে পূর্ণাঙ্গ অধ্যয়ন চালিয়ে যান।</text>
    <text x="50" y="675">M.M Book House মালদা থেকে দ্রুত ডেলিভারি বা সরাসরি দোকান সংগ্রহ সম্ভব।</text>
  </g>

  <!-- Watermark Diagonal -->
  <g transform="rotate(-30 300 450)" opacity="0.09">
    <text x="300" y="440" text-anchor="middle" font-family="'Hind Siliguri', sans-serif" font-size="34" font-weight="900" fill="#000000">
      M.M BOOK HOUSE • MALDA
    </text>
    <text x="300" y="480" text-anchor="middle" font-family="'Hind Siliguri', sans-serif" font-size="18" font-weight="bold" fill="#000000">
      ONLY FOR SAMPLE PREVIEW
    </text>
  </g>

  <!-- Running Footer -->
  <line x1="50" y1="785" x2="550" y2="785" stroke="#d5c8ad" stroke-width="0.8"/>
  <text x="50" y="805" font-family="'Hind Siliguri', sans-serif" font-size="12" fill="#94a3b8">
    M.M Book House Malda © ২০২৬ • কপিরাইট সংরক্ষিত
  </text>
  <text x="300" y="805" text-anchor="middle" font-family="'Hind Siliguri', sans-serif" font-size="13" font-weight="bold" fill="#334155">
    - ${bnNum} -
  </text>
  <text x="550" y="805" text-anchor="end" font-family="'Hind Siliguri', sans-serif" font-size="12" fill="#007185">
    www.mmbookhouse.in
  </text>
</svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(str: any): string {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Task 18: Automated Sample PDF Slicing Helper
 * Simulates a cloud worker (Edge function / Cloudinary / Supabase Storage)
 * that ingests an uploaded book PDF and extracts the first 5 essential pages:
 * Page 1: Cover (প্রচ্ছদ)
 * Page 2: Preface (ভূমিকা)
 * Page 3: Syllabus / Scheme (সিলেবাস ও ওয়েটেজ)
 * Page 4: Table of Contents (সূচিপত্র)
 * Page 5: Sample Chapter 1 (প্রথম অধ্যায় নমুনা)
 */
export async function simulateCloudPdfSlicing(
  pdfUrl: string,
  book: Partial<DetailedBookProduct>
): Promise<PdfSlicingResult> {
  const startTime = Date.now();

  // Simulate network round-trip for cloud serverless PDF processor
  await new Promise((resolve) => setTimeout(resolve, 600));

  const bookTitle = book.title || 'পুস্তক নমুনা';
  const author = book.author || 'M.M Research Team';
  const coverImage = book.coverImage || '/images/books/wbcs-manual.webp';

  const samplePages: LookInsideSamplePage[] = [
    {
      pageNumber: 1,
      title: 'প্রচ্ছদ ও শিরোনাম (Cover Page)',
      titleBn: 'বইয়ের মূল প্রচ্ছদ ও সংস্করণ শিরোনাম',
      imageUrl: coverImage,
      type: 'cover',
    },
    {
      pageNumber: 2,
      title: 'ভূমিকা ও লেখকের বার্তা (Preface)',
      titleBn: 'বইয়ের ভূমিকা ও গ্রন্থকারের বার্তা',
      imageUrl: generateBookPageSvgFallback(
        { pageNumber: 2, title: 'ভূমিকা ও লেখকের বার্তা (Preface)' },
        bookTitle,
        author
      ),
      type: 'preface',
    },
    {
      pageNumber: 3,
      title: 'সম্পূর্ণ সিলেবাস ও নম্বর বিভাজন (Syllabus & Weightage)',
      titleBn: 'পাঠ্যক্রম ও অধ্যায়ভিত্তিক নম্বর বিন্যাস',
      imageUrl: generateBookPageSvgFallback(
        { pageNumber: 3, title: 'সম্পূর্ণ সিলেবাস ও নম্বর বিভাজন (Syllabus)' },
        bookTitle,
        author
      ),
      type: 'toc',
    },
    {
      pageNumber: 4,
      title: 'সূচিপত্র: খণ্ড ১ ও ২ (Table of Contents)',
      titleBn: 'অধ্যায়ভিত্তিক বিস্তারিত সূচিপত্র',
      imageUrl: generateBookPageSvgFallback(
        { pageNumber: 4, title: 'সূচিপত্র: খণ্ড ১ ও ২ (Table of Contents)' },
        bookTitle,
        author
      ),
      type: 'toc',
    },
    {
      pageNumber: 5,
      title: 'প্রথম অধ্যায় নমুনা: পাঠ ও প্রশ্নোত্তর (Sample Chapter)',
      titleBn: 'প্রথম অধ্যায়: মূল পাঠ ও প্রশ্নোত্তর সংকলন',
      imageUrl: generateBookPageSvgFallback(
        { pageNumber: 5, title: 'প্রথম অধ্যায় নমুনা: মূল পাঠ' },
        bookTitle,
        author
      ),
      type: 'chapter',
    },
  ];

  return {
    success: true,
    totalPagesExtracted: samplePages.length,
    samplePages,
    processingTimeMs: Date.now() - startTime,
    sourcePdfUrl: pdfUrl,
    watermarkApplied: true,
  };
}

/**
 * Task 19: Smart Graceful Fallback Helper
 * Checks if a book has valid sample pages available for Look Inside.
 * When false, the Look Inside ribbon & action buttons are cleanly hidden with zero broken links.
 */
export function hasLookInsidePreview(
  book?: Partial<DetailedBookProduct> | null
): boolean {
  if (!book) return false;
  if (!book.lookInside) return false;
  if (book.lookInside.enabled === false) return false;
  if (!Array.isArray(book.lookInside.samplePages)) return false;
  return book.lookInside.samplePages.length > 0;
}

/**
 * Task 19: Get sanitized sample pages or safe empty array
 */
export function getSanitizedSamplePages(
  book?: Partial<DetailedBookProduct> | null
): LookInsideSamplePage[] {
  if (!hasLookInsidePreview(book)) return [];
  return book!.lookInside!.samplePages;
}
