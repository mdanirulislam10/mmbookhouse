import React from 'react';
import Link from 'next/link';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = React.memo(({ className = '' }) => {
  return (
    <Link
      href="/"
      aria-label="M.M Book House Malda - হোমপেজ"
      className={`amazon-nav-box group flex items-center gap-2 select-none text-white transition-all duration-300 transform hover:scale-[1.02] hover:drop-shadow-[0_0_12px_rgba(251,191,36,0.4)] active:scale-[0.99] ${className}`}
    >
      {/* Brand Vector Icon (Open Book with Golden Bookmark) */}
      <div className="relative flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
        <svg
          className="w-8 h-8 text-amber-400 drop-shadow-[0_2px_4px_rgba(245,158,11,0.3)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Open Book Wings */}
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          {/* Bookmark Ribbon */}
          <path
            d="M12 2v8l3-2 3 2V2"
            fill="#febd69"
            stroke="#f08804"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* Desktop Full Brand Typography */}
      <div className="hidden sm:flex flex-col leading-none">
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-black tracking-wider text-white">
            M.M
          </span>
          <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">
            Book House
          </span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[10px] font-semibold tracking-wider text-gray-300 uppercase">
            Malda &bull; নেতাজি সুভাষ রোড
          </span>
        </div>
      </div>

      {/* Mobile Compact Brand Typography */}
      <div className="flex sm:hidden flex-col leading-none">
        <span className="text-base font-black tracking-tight text-white">
          M.M<span className="text-amber-400">.</span>
        </span>
        <span className="text-[9px] font-bold text-gray-300">BOOKS</span>
      </div>
    </Link>
  );
});

Logo.displayName = 'Logo';
