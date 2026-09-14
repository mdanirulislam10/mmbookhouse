'use client';

import React, { useState, useMemo } from 'react';
import {
  Bell,
  MessageCircle,
  Smartphone,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Download,
  IndianRupee,
  Eye,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { NotificationLog, NotificationChannel, NotificationStatus } from '@/types/notifications';
import { maskPhoneNumber } from '@/lib/services/notificationTemplateService';

export interface NotificationAnalyticsDashboardProps {
  initialLogs?: NotificationLog[];
  className?: string;
  onRefresh?: () => void;
}

export const NotificationAnalyticsDashboard: React.FC<NotificationAnalyticsDashboardProps> = ({
  initialLogs = [],
  className = '',
  onRefresh,
}) => {
  const [logs, setLogs] = useState<NotificationLog[]>(initialLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activePreviewLog, setActivePreviewLog] = useState<NotificationLog | null>(null);

  // Sync if initialLogs updates
  React.useEffect(() => {
    setLogs(initialLogs);
  }, [initialLogs]);

  // Derived Analytics KPIs (Item 41 & Item 49)
  const stats = useMemo(() => {
    const total = logs.length;
    if (total === 0) {
      return {
        total: 0,
        deliveredCount: 0,
        deliveryRate: 100,
        readCount: 0,
        readRate: 0,
        fallbackCount: 0,
        fallbackRate: 0,
        totalCostInr: 0,
        whatsappCost: 0,
        smsCost: 0,
      };
    }

    const deliveredCount = logs.filter(
      (l) => l.status === 'delivered' || l.status === 'read' || l.status === 'sent' || l.status === 'fallback_sms'
    ).length;
    const readCount = logs.filter((l) => l.status === 'read').length;
    const fallbackCount = logs.filter((l) => l.status === 'fallback_sms' || l.channel === 'sms').length;

    let totalCost = 0;
    let waCost = 0;
    let smsCost = 0;

    for (const log of logs) {
      totalCost += log.cost_estimate_inr || 0;
      if (log.channel === 'whatsapp') {
        waCost += log.cost_estimate_inr || 0;
      } else if (log.channel === 'sms') {
        smsCost += log.cost_estimate_inr || 0;
      }
    }

    const deliveryRate = total > 0 ? (deliveredCount / total) * 100 : 0;
    const readRate = total > 0 ? (readCount / total) * 100 : 0;
    const fallbackRate = total > 0 ? (fallbackCount / total) * 100 : 0;

    return {
      total,
      deliveredCount,
      deliveryRate: Math.round(deliveryRate * 10) / 10,
      readCount,
      readRate: Math.round(readRate * 10) / 10,
      fallbackCount,
      fallbackRate: Math.round(fallbackRate * 10) / 10,
      totalCostInr: Math.round(totalCost * 100) / 100,
      whatsappCost: Math.round(waCost * 100) / 100,
      smsCost: Math.round(smsCost * 100) / 100,
    };
  }, [logs]);

  // Filtered Logs for Table
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (log.order_id && log.order_id.toLowerCase().includes(q)) ||
        log.recipient_phone.includes(q) ||
        log.template_name.toLowerCase().includes(q) ||
        log.trigger.toLowerCase().includes(q);

      const matchesChannel = selectedChannel === 'all' || log.channel === selectedChannel;
      const matchesStatus = selectedStatus === 'all' || log.status === selectedStatus;

      return matchesSearch && matchesChannel && matchesStatus;
    });
  }, [logs, searchQuery, selectedChannel, selectedStatus]);

  const handleExportCsv = () => {
    const headers = ['Log ID', 'Order ID', 'Recipient', 'Channel', 'Trigger', 'Status', 'Cost (INR)', 'Sent At'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.order_id || 'N/A',
      l.recipient_phone,
      l.channel,
      l.trigger,
      l.status,
      l.cost_estimate_inr,
      l.created_at,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `mmbook_notification_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <MessageCircle className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              অটোমেটেড নোটিফিকেশন ইঞ্জিন ও ট্রানজ্যাকশন মনিটর
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Meta Cloud WhatsApp Business ও TRAI DLT SMS মাল্টি-চ্যানেল লাইভ ট্র্যাকিং এবং খরচ নিরীক্ষণ
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>রিফ্রেশ</span>
            </button>
          )}
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>রিপোর্ট এক্সপোর্ট (CSV)</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid (Item 41) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sent */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 text-xs mb-2">
            <span>মোট প্রেরিত নোটিফিকেশন</span>
            <Bell className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 font-mono">
            {stats.total.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold">{stats.deliveredCount}টি</span> সফলভাবে পৌঁছানো হয়েছে
          </div>
        </div>

        {/* Delivery Rate */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 text-xs mb-2">
            <span>ডেলিভারি সাকসেস রেট</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
            {stats.deliveryRate}%
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
            <span>সফল ট্রানজ্যাকশনাল বিতরণ</span>
          </div>
        </div>

        {/* WhatsApp Read Rate */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 text-xs mb-2">
            <span>WhatsApp রিড রেট (Open Rate)</span>
            <Eye className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
            {stats.readRate}%
          </div>
          <div className="mt-2 text-[11px] text-zinc-500">
            {stats.readCount} জন গ্রাহক বার্তাটি পড়েছেন
          </div>
        </div>

        {/* Cost & Spend (Item 49) */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 text-xs mb-2">
            <span>মোট গেটওয়ে খরচ (Est. Spend)</span>
            <IndianRupee className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            ₹{stats.totalCostInr}
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 flex justify-between">
            <span>WA: ₹{stats.whatsappCost}</span>
            <span>SMS: ₹{stats.smsCost}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="অর্ডার আইডি, ফোন বা টেমপ্লেট খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Channel Filter */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none"
            >
              <option value="all">সকল চ্যানেল (All)</option>
              <option value="whatsapp">WhatsApp (Meta Cloud)</option>
              <option value="sms">SMS (TRAI DLT MMBOOK)</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none"
          >
            <option value="all">সকল স্ট্যাটাস (All)</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="read">Read (দেখা হয়েছে)</option>
            <option value="fallback_sms">Fallback SMS</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Live Logs Table (Item 47) */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                <th className="py-3 px-4">তারিখ ও সময়</th>
                <th className="py-3 px-4">অর্ডার আইডি</th>
                <th className="py-3 px-4">গ্রাহক নম্বর</th>
                <th className="py-3 px-4">চ্যানেল</th>
                <th className="py-3 px-4">ট্রিগার</th>
                <th className="py-3 px-4">স্ট্যাটাস</th>
                <th className="py-3 px-4">খরচ</th>
                <th className="py-3 px-4 text-right">মেসেজ প্রিভিউ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-400 text-xs">
                    কোনো নোটিফিকেশন লগ পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString('bn-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                      #{log.order_id || 'GENERAL'}
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-600 dark:text-zinc-300">
                      {maskPhoneNumber(log.recipient_phone)}
                    </td>
                    <td className="py-3 px-4">
                      {log.channel === 'whatsapp' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <MessageCircle className="w-3 h-3 text-emerald-500" />
                          WhatsApp
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          <Smartphone className="w-3 h-3 text-blue-500" />
                          DLT SMS
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300 font-medium">
                      {log.trigger}
                    </td>
                    <td className="py-3 px-4">
                      {log.status === 'read' ? (
                        <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md">
                          ✔✔ Read
                        </span>
                      ) : log.status === 'delivered' ? (
                        <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
                          ✔ Delivered
                        </span>
                      ) : log.status === 'fallback_sms' ? (
                        <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                          ⚡ Fallback SMS
                        </span>
                      ) : log.status === 'sent' ? (
                        <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                          Sent
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-md">
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                      ₹{log.cost_estimate_inr}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setActivePreviewLog(log)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        title="মেসেজ প্রিভিউ"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Preview Modal */}
      {activePreviewLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  মেসেজ প্রিভিউ (#{activePreviewLog.order_id || 'অর্ডার'})
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  {activePreviewLog.channel}
                </span>
              </div>
              <button
                onClick={() => setActivePreviewLog(null)}
                className="text-zinc-400 hover:text-zinc-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* WhatsApp Phone Mockup Bubble */}
            <div className="p-4 bg-emerald-50/50 dark:bg-zinc-800/80 rounded-xl border border-emerald-100 dark:border-zinc-700 text-xs whitespace-pre-wrap font-sans text-zinc-800 dark:text-zinc-200 leading-relaxed">
              {activePreviewLog.rendered_message}
            </div>

            <div className="text-[11px] text-zinc-500 space-y-1 font-mono">
              <div>গেটওয়ে আইডি: {activePreviewLog.gateway_message_id || 'N/A'}</div>
              <div>প্রাপক: {maskPhoneNumber(activePreviewLog.recipient_phone)}</div>
              <div>খরচ: ₹{activePreviewLog.cost_estimate_inr}</div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setActivePreviewLog(null)}
                className="px-4 py-2 text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-xl hover:opacity-90 transition-opacity"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
