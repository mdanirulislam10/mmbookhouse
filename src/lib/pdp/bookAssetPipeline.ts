import { BookAngleAsset, BookImageAngle, DetailedBookProduct } from '@/types/pdp';
import { BookProduct } from '@/types/catalog-filter';

/**
 * Task 6: Multi-angle book asset pipeline
 *
 * Handles:
 * 1. Front cover (মুখ্য প্রচ্ছদ)
 * 2. Back cover (পেছনের প্রচ্ছদ - blurb & price)
 * 3. Spine (বইয়ের স্পাইন - thickness & binding)
 * 4. Table of contents snapshot (সূচিপত্র স্ন্যাপশট)
 * 5. Sample interior page (নমুনা পাতা)
 */

interface AngleDefinition {
  angle: BookImageAngle;
  label: string;
  labelBn: string;
  altText: string;
  altTextBn: string;
}

const ANGLE_METADATA: Record<BookImageAngle, AngleDefinition> = {
  front: {
    angle: 'front',
    label: 'Front Cover',
    labelBn: 'মুখ্য প্রচ্ছদ',
    altText: 'Front cover of the book showing title and author',
    altTextBn: 'বইয়ের সামনের মুখ্য প্রচ্ছদ ও শিরোনাম',
  },
  back: {
    angle: 'back',
    label: 'Back Cover',
    labelBn: 'পেছনের প্রচ্ছদ',
    altText: 'Back cover showing synopsis, blurb and price',
    altTextBn: 'বইয়ের পেছনের প্রচ্ছদ, ব্লার্ব ও মূল্য',
  },
  spine: {
    angle: 'spine',
    label: 'Book Spine',
    labelBn: 'বইয়ের স্পাইন',
    altText: 'Spine showing thickness, binding and title',
    altTextBn: 'বইয়ের স্পাইন, বাঁধাই ও বেধ',
  },
  toc: {
    angle: 'toc',
    label: 'Table of Contents',
    labelBn: 'সূচিপত্র স্ন্যাপশট',
    altText: 'Table of contents high-resolution snapshot',
    altTextBn: 'বইয়ের বিস্তারিত সূচিপত্রের স্পষ্ট স্ন্যাপশট',
  },
  sample: {
    angle: 'sample',
    label: 'Sample Page',
    labelBn: 'নমুনা ভেতরের পাতা',
    altText: 'Sample reading page showing print quality',
    altTextBn: 'ছাপার মান ও ফন্ট বোঝার নমুনা পাতা',
  },
  other: {
    angle: 'other',
    label: 'Book Preview',
    labelBn: 'বইয়ের ছবি',
    altText: 'Additional view of the book',
    altTextBn: 'বইয়ের অতিরিক্ত ছবি',
  },
};

/**
 * Detect angle type from image URL or position
 */
export function detectAngleFromUrl(url: string, index: number): BookImageAngle {
  const lower = url.toLowerCase();

  if (lower.includes('front') || (index === 0 && !lower.includes('back') && !lower.includes('spine') && !lower.includes('toc'))) {
    return 'front';
  }
  if (lower.includes('back') || lower.includes('rear')) {
    return 'back';
  }
  if (lower.includes('spine') || lower.includes('side') || lower.includes('thickness')) {
    return 'spine';
  }
  if (lower.includes('toc') || lower.includes('contents') || lower.includes('index')) {
    return 'toc';
  }
  if (lower.includes('sample') || lower.includes('page') || lower.includes('preview')) {
    return 'sample';
  }

  // Positional fallback
  if (index === 1) return 'back';
  if (index === 2) return 'spine';
  if (index === 3) return 'toc';
  if (index === 4) return 'sample';

  return 'other';
}

/**
 * Normalizes and builds a multi-angle asset list for a book
 */
export function buildBookAngleAssets(book: DetailedBookProduct | BookProduct): BookAngleAsset[] {
  const assets: BookAngleAsset[] = [];
  const processedUrls = new Set<string>();

  // 1. Primary cover image
  const primaryCover = book.coverImage || '/images/books/wbcs-manual.webp';
  assets.push({
    id: `${book.id}-asset-front`,
    url: primaryCover,
    zoomUrl: primaryCover,
    angle: 'front',
    label: ANGLE_METADATA.front.label,
    labelBn: ANGLE_METADATA.front.labelBn,
    altText: `${book.title} - ${ANGLE_METADATA.front.altText}`,
    altTextBn: `${book.titleBn || book.title} - ${ANGLE_METADATA.front.altTextBn}`,
  });
  processedUrls.add(primaryCover);

  // 2. Multi-angle images from galleryImages if present
  const galleryImages = (book as DetailedBookProduct).galleryImages || [];
  galleryImages.forEach((imgUrl, idx) => {
    if (!processedUrls.has(imgUrl)) {
      processedUrls.add(imgUrl);
      const angle = detectAngleFromUrl(imgUrl, assets.length);
      const meta = ANGLE_METADATA[angle] || ANGLE_METADATA.other;

      assets.push({
        id: `${book.id}-asset-${angle}-${idx}`,
        url: imgUrl,
        zoomUrl: imgUrl,
        angle,
        label: meta.label,
        labelBn: meta.labelBn,
        altText: `${book.title} - ${meta.altText}`,
        altTextBn: `${book.titleBn || book.title} - ${meta.altTextBn}`,
      });
    }
  });

  // 3. Fallback: if only 1 image exists, generate back and spine angle fallbacks from book covers
  // to ensure multi-angle UI displays rich Amazon-like experience
  if (assets.length === 1) {
    const baseSlug = (book as DetailedBookProduct).slug || book.bookId || 'wbcs-manual';
    const isScanner = baseSlug.includes('scanner');

    const backFallback = isScanner
      ? '/images/books/wbcs-scanner-back.webp'
      : '/images/books/wbcs-manual-back.webp';
    const spineFallback = '/images/books/wbcs-manual-spine.webp';
    const tocFallback = '/images/books/wbcs-manual-toc.webp';

    assets.push({
      id: `${book.id}-asset-back-fallback`,
      url: backFallback,
      zoomUrl: backFallback,
      angle: 'back',
      label: ANGLE_METADATA.back.label,
      labelBn: ANGLE_METADATA.back.labelBn,
      altText: `${book.title} - ${ANGLE_METADATA.back.altText}`,
      altTextBn: `${book.titleBn || book.title} - ${ANGLE_METADATA.back.altTextBn}`,
    });

    assets.push({
      id: `${book.id}-asset-spine-fallback`,
      url: spineFallback,
      zoomUrl: spineFallback,
      angle: 'spine',
      label: ANGLE_METADATA.spine.label,
      labelBn: ANGLE_METADATA.spine.labelBn,
      altText: `${book.title} - ${ANGLE_METADATA.spine.altText}`,
      altTextBn: `${book.titleBn || book.title} - ${ANGLE_METADATA.spine.altTextBn}`,
    });

    assets.push({
      id: `${book.id}-asset-toc-fallback`,
      url: tocFallback,
      zoomUrl: tocFallback,
      angle: 'toc',
      label: ANGLE_METADATA.toc.label,
      labelBn: ANGLE_METADATA.toc.labelBn,
      altText: `${book.title} - ${ANGLE_METADATA.toc.altText}`,
      altTextBn: `${book.titleBn || book.title} - ${ANGLE_METADATA.toc.altTextBn}`,
    });
  }

  return assets;
}
