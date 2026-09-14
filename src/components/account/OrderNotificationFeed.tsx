'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  Smartphone,
  Check,
  CheckCheck,
  Send,
  ExternalLink,
  Clock,
  ShieldCheck,
  RotateCw,
  BellRing,
} from 'lucide-react';
import { NotificationLog, NotificationStatus, NotificationTrigger } from '@/types/notifications';
import { maskPhoneNumber } from '@/lib/services/notificationTemplateService';

export interface OrderNotificationFeedProps {
  orderId: string;
  recipientPhone: string;
  notifications?: NotificationLog[];
  onResendNotification?: (orderId: string) => Promise<boolean>;
  className?: string;
}

export const OrderNotificationFeed: React.FC<OrderNotificationFeedProps> = ({
  orderId,
  recipientPhone,
  notifications = [],
  onResendNotification,
  className = '',
}) => {
  const [logs, setLogs] = useState<NotificationLog[]>(notifications);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setLogs(notifications);
  }, [notifications]);

  // Cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);

    try {
      if (onResendNotification) {
        await onResendNotification(orderId);
      } else {
        // Simulated local fallback if prop not passed
        await new Promise((resolve) => setTimeout(resolve, 600));
      }

      setResendCooldown(60); // 60s cooldown
      setToastMessage('হোয়াটসঅ্যাপে নোটিফিকেশন পুনরায় পাঠানো হয়েছে!');
      setTimeout(() => setToastMessage(null), 4000);
    } catch {
      setToastMessage('পুনরায় পাঠাতে সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।');
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsResending(false);
    }
  };

  const renderStatusTicks = (status: NotificationStatus) => {
    switch (status) {
      case 'read':
        return (
          <span className="inline-flex items-center text-purple-600 dark:text-purple-400" title="গ্রাহক বার্তাটি দেখেছেন">
            <CheckCheck className="w-3.5 h-3.5 stroke-[2.5]" />
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center text-zinc-500 dark:text-zinc-400" title="ডেলিভারি হয়েছে">
            <CheckCheck className="w-3.5 h-3.5" />
          </span>
        );
      case 'sent':
      case 'fallback_sms':
        return (
          <span className="inline-flex items-center text-zinc-400" title="সার্ভার থেকে প্রেরিত">
            <Check className="w-3.5 h-3.5" />
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-800/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <MessageCircle className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              অর্ডার নোটিফিকেশন হিস্ট্রি (#{orderId})
            </h3>
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-2">
            <span>প্রাপক: <strong className="font-mono text-zinc-700 dark:text-zinc-300">{maskPhoneNumber(recipientPhone)}</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3 h-3" />
              Meta ও DLT যাচাইকৃত
            </span>
          </div>
        </div>

        {/* Resend Action Button */}
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0 || isResending}
          className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
        >
          {isResending ? (
            <RotateCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <BellRing className="w-3.5 h-3.5" />
          )}
          <span>
            {resendCooldown > 0
              ? `অপেক্ষা করুন (${resendCooldown}s)`
              : 'WhatsApp অ্যালার্ট পুনরায় পাঠান'}
          </span>
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-500 text-white text-xs text-center font-medium transition-all">
          {toastMessage}
        </div>
      )}

      {/* Feed Messages List */}
      <div className="p-5 space-y-4 max-h-96 overflow-y-auto bg-zinc-50/30 dark:bg-zinc-900/50">
        {logs.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400 space-y-1">
            <Clock className="w-6 h-6 mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
            <p>এই অর্ডারের জন্য এখনো কোনো নোটিফিকেশন পাঠানো হয়নি।</p>
            <p className="text-[11px] text-zinc-400">অর্ডার প্রক্রিয়াকরণের সাথে সাথে এখানে নোটিফিকেশন আপডেট হবে।</p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`p-4 rounded-2xl border text-xs leading-relaxed max-w-xl ${
                log.channel === 'whatsapp'
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 ml-auto'
                  : 'bg-zinc-100/70 dark:bg-zinc-800/60 border-zinc-200/80 dark:border-zinc-700 ml-auto'
              }`}
            >
              {/* Channel Pill & Trigger */}
              <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-zinc-200/40 dark:border-zinc-700/40">
                <div className="flex items-center gap-1.5">
                  {log.channel === 'whatsapp' ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 text-[11px]">
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp Business
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-400 text-[11px]">
                      <Smartphone className="w-3.5 h-3.5" />
                      TRAI DLT SMS (MMBOOK)
                    </span>
                  )}
                </div>

                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                  {new Date(log.created_at).toLocaleTimeString('bn-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {/* Rendered Text */}
              <div className="whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">
                {log.rendered_message}
              </div>

              {/* Footer Ticks */}
              <div className="mt-2.5 pt-2 border-t border-zinc-200/30 dark:border-zinc-700/30 flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
                <span className="font-mono">আইডি: {log.gateway_message_id?.slice(0, 16) || log.id}</span>
                <div className="flex items-center gap-1">
                  <span className="capitalize">{log.status}</span>
                  {renderStatusTicks(log.status)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
