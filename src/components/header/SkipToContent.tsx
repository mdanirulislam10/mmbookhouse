import React from 'react';

export const SkipToContent: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[999] focus:px-4 focus:py-2.5 focus:bg-[#ffd814] focus:text-gray-950 focus:font-bold focus:shadow-2xl focus:rounded-md focus:border-2 focus:border-black focus:outline-none transition-all"
    >
      মূল কন্টেন্টে যান (Skip to main content)
    </a>
  );
};
