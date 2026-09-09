'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Package, Flame, Clock, Sparkles } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`নোটিফিকেশন: ${unreadCount}টি অপঠিত বার্তা আছে`}
        aria-expanded={isOpen}
        className="amazon-nav-box relative text-white focus:outline-none p-2 select-none"
      >
        <Bell className="w-5 h-5 text-gray-200 hover:text-white transition-colors" />

        {/* Task 10: Red Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-[#131921] animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Card */}
      {isOpen && (
        <div
          role="region"
          aria-label="নোটিফিকেশন তালিকা"
          className="absolute right-0 top-full mt-1.5 w-80 sm:w-96 bg-white rounded-lg shadow-2xl border border-gray-200 text-gray-900 z-[90] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="bg-[#f0f2f2] px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs sm:text-sm font-bold text-gray-800">
                নোটিফিকেশন ও অ্যালার্ট ({unreadCount} অপঠিত)
              </h4>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>সব পড়া হয়েছে</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => markAsRead(item.id)}
                className={`p-3.5 hover:bg-gray-50 transition-colors cursor-pointer text-left space-y-1 ${
                  !item.isRead ? 'bg-amber-50/40' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {item.type === 'order_status' && (
                      <Package className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    )}
                    {item.type === 'stock_alert' && (
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    )}
                    {item.type === 'deal' && (
                      <Flame className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    )}
                    <span className="text-xs font-bold text-gray-900 line-clamp-1">
                      {item.title}
                    </span>
                  </div>
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-red-600 shrink-0 mt-1" />
                  )}
                </div>

                <p className="text-[11px] text-gray-600 leading-snug">
                  {item.message}
                </p>

                <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.createdAt}
                  </span>
                  {item.badgeText && (
                    <span className="bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded font-medium">
                      {item.badgeText}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-2 border-t border-gray-100 text-center">
            <span className="text-[11px] text-gray-600 font-medium">
              আপনার সমস্ত অর্ডারের লাইভ ট্র্যাকিং প্রোফাইল পেজে দেখা যাবে।
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
