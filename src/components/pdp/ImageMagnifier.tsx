'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ZoomIn } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export interface ImageMagnifierProps {
  src: string;
  zoomSrc?: string;
  alt: string;
  zoomLevel?: number;
  className?: string;
  onImageClick?: () => void;
  priority?: boolean;
}

/**
 * Task 4: Desktop Floating Magnifier Lens Zoom
 *
 * Provides ultra-sharp pixel zoom on hover next to the cover.
 * - Semi-transparent lens tracks cursor over the image
 * - High-resolution floating zoom box appears adjacent to the preview (Amazon pattern)
 * - Click triggers lightbox
 */
export const ImageMagnifier: React.FC<ImageMagnifierProps> = ({
  src,
  zoomSrc,
  alt,
  zoomLevel = 2.5,
  className = '',
  onImageClick,
  priority = false,
}) => {
  const { language } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  const [isActive, setIsActive] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const LENS_WIDTH = 120;
  const LENS_HEIGHT = 150;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      // Clamp lens position inside container
      const halfW = LENS_WIDTH / 2;
      const halfH = LENS_HEIGHT / 2;

      const clampedX = Math.max(0, Math.min(clientX - halfW, rect.width - LENS_WIDTH));
      const clampedY = Math.max(0, Math.min(clientY - halfH, rect.height - LENS_HEIGHT));

      setLensPos({ x: clampedX, y: clampedY });

      // Percentage position for zoom box (0% to 100%)
      const percentX = Math.max(0, Math.min((clientX / rect.width) * 100, 100));
      const percentY = Math.max(0, Math.min((clientY / rect.height) * 100, 100));

      setZoomPos({ x: percentX, y: percentY });
    },
    [LENS_WIDTH, LENS_HEIGHT]
  );

  const handleMouseEnter = () => {
    setIsActive(true);
  };

  const handleMouseLeave = () => {
    setIsActive(false);
  };

  const highResSrc = zoomSrc || src;

  return (
    <div className={`relative select-none ${className}`}>
      {/* Primary Image Container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onImageClick}
        className="relative w-full aspect-[3/4] max-h-[500px] flex items-center justify-center bg-white rounded-xl border border-gray-200 overflow-hidden cursor-crosshair group shadow-sm transition-shadow hover:shadow-md"
        role="button"
        tabIndex={0}
        aria-label={language === 'bn' ? 'বইয়ের বড় ছবি দেখতে ট্যাপ করুন' : 'Tap to expand book image'}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onImageClick?.();
          }
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 45vw, 420px"
          className="object-contain p-4 transition-transform duration-200 group-hover:scale-[1.02]"
        />

        {/* Hover-to-zoom Instruction Pill */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-1.5 px-3 py-1 bg-gray-900/80 backdrop-blur-sm text-white text-xs font-medium rounded-full opacity-90 transition-opacity pointer-events-none group-hover:opacity-0">
          <ZoomIn className="w-3.5 h-3.5 text-amber-400" />
          <span>{language === 'bn' ? 'হোভার করে জুম করুন' : 'Hover to zoom'}</span>
        </div>

        {/* Floating Lens Box over the target area (Desktop only) */}
        {isActive && (
          <div
            className="absolute border-2 border-amber-500 bg-amber-300/20 backdrop-brightness-110 pointer-events-none rounded transition-opacity duration-75 shadow-sm hidden lg:block"
            style={{
              left: `${lensPos.x}px`,
              top: `${lensPos.y}px`,
              width: `${LENS_WIDTH}px`,
              height: `${LENS_HEIGHT}px`,
            }}
          />
        )}
      </div>

      {/* Floating Magnified Window (Amazon Pattern) */}
      {/* Appears beside the main cover preview on desktop */}
      {isActive && (
        <div
          className="absolute left-[calc(100%+16px)] top-0 w-[460px] h-[500px] z-50 rounded-xl border-2 border-amber-500/80 bg-white shadow-2xl overflow-hidden pointer-events-none hidden lg:block animate-in fade-in duration-150"
          style={{
            backgroundImage: `url(${highResSrc})`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
            backgroundSize: `${zoomLevel * 100}%`,
          }}
        >
          {/* Header watermark in zoom view */}
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 text-[10px] text-white rounded font-mono tracking-wider uppercase">
            M.M Book House • HD Zoom {zoomLevel}x
          </div>
        </div>
      )}
    </div>
  );
};
