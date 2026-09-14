'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Clock,
  ShieldCheck,
  Search,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Copy,
  Check,
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { PaymentTransaction } from '@/types/payment';

export interface AdminPaymentAuditTableProps {
  transactions: PaymentTransaction[];
  grossSales: number;
  projectedSettlementDate: string;
  projectedSettlementAmount: number;
  onInitiateRefund?: (paymentId: string) => void;
  className?: string;
}

export const AdminPaymentAuditTable: React.FC<AdminPaymentAuditTableProps> = ({
  transactions,
  grossSales,
  projectedSettlementDate,
  projectedSettlementAmount,
  onInitiateRefund,
  className = '',
}) => {
  const { isBengali } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  const filteredTransactions = transactions.filter((t) => {
    const matchesQuery =
      t.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.transaction_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.utr && t.utr.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
    return matchesQuery && matchesStatus;
  });

  const handleCopyUtr = (utr: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(utr);
      setCopiedUtr(utr);
      setTimeout(() => setCopiedUtr(null), 2000);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            PAID
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300">
            <XCircle className="w-3 h-3" />
            FAILED
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
            <RotateCcw className="w-3 h-3" />
            REFUNDED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
            <Clock className="w-3 h-3" />
            PENDING
          </span>
        );
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 4 Finance Overview Metric Cards (Item 28 & 29) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gross Sales */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {isBengali ? 'অনলাইন বিক্রয় (মোট)' : 'Gross Online Sales'}
            </span>
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-zinc-100">
            ₹{grossSales.toFixed(2)}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            {isBengali ? 'সফল অনলাইন লেনদেন' : 'From successful prepaid orders'}
          </span>
        </div>

        {/* Card 2: T+1 Bank Settlement */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {isBengali ? 'T+1 ব্যাঙ্ক জমা (প্রজেকশন)' : 'T+1 Bank Settlement'}
            </span>
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            ₹{projectedSettlementAmount.toFixed(2)}
          </div>
          <span className="text-[11px] text-gray-500 dark:text-zinc-400">
            {isBengali
              ? `জমা হবে: ${projectedSettlementDate} (সকাল ১০টা)`
              : `Expected: ${projectedSettlementDate} (10:00 AM)`}
          </span>
        </div>

        {/* Card 3: Active Dual Gateways */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {isBengali ? 'গেটওয়ে স্ট্যাটাস' : 'Gateway Architecture'}
            </span>
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-sm font-bold text-gray-900 dark:text-zinc-100">
            Razorpay <span className="text-emerald-600 font-mono text-xs">(Primary)</span>
          </div>
          <span className="text-[11px] text-gray-500 dark:text-zinc-400 block mt-1">
            Cashfree <span className="text-blue-600 font-mono text-[10px]">(Auto-Failover Ready)</span>
          </span>
        </div>

        {/* Card 4: B2B GST Compliance */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {isBengali ? 'জিএসটি ট্যাক্স ইনভয়েসিং' : 'Gateway GST Invoicing'}
            </span>
            <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-sm font-bold text-gray-900 dark:text-zinc-100">
            18% GST Input Credit
          </div>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
            {isBengali ? 'GSTR-2B কমপ্লায়েন্ট' : 'Automatic GSTR-2B Claim'}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isBengali ? 'অর্ডার, পেমেন্ট আইডি বা UTR খুঁজুন...' : 'Search Order, Payment ID or UTR...'}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">PAID</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>

          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export B2B CSV</span>
          </button>
        </div>
      </div>

      {/* Relational Payments Table (Item 26 & 28) */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 dark:bg-zinc-800/60 text-gray-600 dark:text-zinc-400 font-semibold border-b border-gray-200 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Payment ID</th>
              <th className="px-4 py-3">12-Digit UTR (RRN)</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Gateway</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-zinc-400">
                  {isBengali ? 'কোনো লেনদেন পাওয়া যায়নি' : 'No transactions found'}
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => (
                <tr key={tx.id || tx.transaction_id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition">
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-zinc-100">
                    #{tx.order_id}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-gray-600 dark:text-zinc-300">
                    {tx.transaction_id}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-gray-600 dark:text-zinc-300">
                    {tx.utr ? (
                      <button
                        type="button"
                        onClick={() => handleCopyUtr(tx.utr!)}
                        className="inline-flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400"
                        title="Copy UTR"
                      >
                        <span>{tx.utr}</span>
                        {copiedUtr === tx.utr ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-gray-400" />
                        )}
                      </button>
                    ) : (
                      <span className="text-gray-400 italic">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 uppercase text-[10px] font-bold text-gray-500 dark:text-zinc-400">
                    {tx.payment_method}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-medium text-gray-700 dark:text-zinc-300">
                      {tx.payment_gateway}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-zinc-100">
                    ₹{tx.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(tx.status)}</td>
                  <td className="px-4 py-3 text-right">
                    {tx.status === 'PAID' && onInitiateRefund && (
                      <button
                        type="button"
                        onClick={() => onInitiateRefund(tx.transaction_id)}
                        className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                      >
                        Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
