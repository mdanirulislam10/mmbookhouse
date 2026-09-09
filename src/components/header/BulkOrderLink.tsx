'use client';

import React, { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { BulkOrderModal } from './BulkOrderModal';

interface BulkOrderLinkProps {
  className?: string;
}

export const BulkOrderLink: React.FC<BulkOrderLinkProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="স্কুল ও কোচিং বাল্ক বুকিং কোটেশন অনুরোধ"
        className={`flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 transition-colors font-semibold py-1 px-2 rounded hover:bg-white/10 ${className}`}
      >
        <GraduationCap className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="hidden sm:inline">স্কুল ও কোচিং বাল্ক বুকিং (Request-a-Quote)</span>
        <span className="sm:hidden">বাল্ক বুকিং</span>
      </button>

      <BulkOrderModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
