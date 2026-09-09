/**
 * Network-Aware Adaptive Image Helper
 * Adapts image quality and dimensions based on real-time client connection speeds (Task 44).
 */

interface AdaptiveImageOptions {
  width?: number;
  quality?: number;
  isSlowConnection?: boolean;
  saveData?: boolean;
}

export function getAdaptiveImageUrl(
  src: string,
  options: AdaptiveImageOptions = {}
): string {
  if (!src) return '';

  const {
    width = 600,
    quality = 80,
    isSlowConnection = false,
    saveData = false,
  } = options;

  // If slow connection or user requested Data Saver, compress aggressively
  const effectiveQuality = isSlowConnection || saveData ? 50 : quality;
  const effectiveWidth = isSlowConnection || saveData ? Math.round(width * 0.7) : width;

  // Handle Unsplash image URLs
  if (src.includes('images.unsplash.com')) {
    try {
      const url = new URL(src);
      url.searchParams.set('w', effectiveWidth.toString());
      url.searchParams.set('q', effectiveQuality.toString());
      url.searchParams.set('auto', 'format');
      url.searchParams.set('fit', 'crop');
      return url.toString();
    } catch {
      return src;
    }
  }

  return src;
}
