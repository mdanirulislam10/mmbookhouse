'use client';

import React from 'react';
import { AttachRateStats } from '../../types/bundle';
import { AbTestVariantStats } from '../../lib/services/bundleAnalyticsService';
import {
  TrendingUp,
  Percent,
  ShoppingBag,
  Eye,
  Award,
  BarChart3,
  CheckCircle,
  FlaskConical,
  Sparkles,
} from 'lucide-react';

export interface AdminBundleAnalyticsViewProps {
  stats: AttachRateStats;
  abTestResults?: Record<'A' | 'B' | 'C', AbTestVariantStats>;
  topBundles?: Array<{
    id: string;
    title: string;
    impressions: number;
    conversions: number;
    attach_rate: number;
    revenue: number;
  }>;
}

export const AdminBundleAnalyticsView: React.FC<AdminBundleAnalyticsViewProps> = ({
  stats,
  abTestResults,
  topBundles = [
    {
      id: 'bundle-wb-math-10',
      title: 'Madhyamik Class 10 Math + Solved Paper + OMR Bundle',
      impressions: 1420,
      conversions: 326,
      attach_rate: 23.0,
      revenue: 97800,
    },
    {
      id: 'bundle-wb-science-10',
      title: 'Madhyamik Physical Science + Question Bank Combo',
      impressions: 1180,
      conversions: 248,
      attach_rate: 21.0,
      revenue: 69440,
    },
    {
      id: 'bundle-hs-biology-12',
      title: 'Higher Secondary Class 12 Biology + Practical Handbook',
      impressions: 890,
      conversions: 172,
      attach_rate: 19.3,
      revenue: 55040,
    },
  ],
}) => {
  const isTargetAchieved = stats.attach_rate_percentage >= 15;

  return (
    <div className="w-full bg-slate-50 min-h-screen p-4 md:p-8 font-sans text-slate-800">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl md:text-2xl font-black text-slate-900">
              Bundle Analytics & Cross-Sell Conversion Engine
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Real-time monitoring of Attach Rate (15–25% benchmark), AOV Uplift, and A/B Test Variants.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2 rounded-xl text-xs md:text-sm font-bold shadow-sm">
          <Award className="w-4 h-4 text-emerald-600" />
          <span>AOV Expansion Target: +25% to +40%</span>
        </div>
      </div>

      {/* Primary KPI Cards Grid (Items 45, 46) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {/* KPI 1: Attach Rate */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Attach Rate (Item 45)</span>
            <Percent className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {stats.attach_rate_percentage.toFixed(1)}%
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isTargetAchieved
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {isTargetAchieved ? 'Target Met (15-25%)' : 'Below Target (<15%)'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {stats.total_bundle_conversions} of total primary buyers added cross-sell bundle.
          </p>
        </div>

        {/* KPI 2: AOV Uplift */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">AOV Uplift (Item 46)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 font-mono">
              +{stats.aov_uplift_percentage.toFixed(1)}%
            </span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
              Basket Expansion
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex justify-between">
            <span>Bundle: ₹{stats.average_order_value_bundle.toFixed(0)}</span>
            <span>Single: ₹{stats.average_order_value_standard.toFixed(0)}</span>
          </div>
        </div>

        {/* KPI 3: Total Bundle Conversions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Bundle Orders</span>
            <ShoppingBag className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">
            {stats.total_bundle_conversions.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Total cross-sell bundles successfully checked out.
          </p>
        </div>

        {/* KPI 4: Bundle Click-Through Rate */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">PDP Impressions</span>
            <Eye className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">
            {stats.total_pdp_impressions.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {stats.total_bundle_clicks} total bundle clicks ({((stats.total_bundle_clicks / (stats.total_pdp_impressions || 1)) * 100).toFixed(1)}% CTR)
          </p>
        </div>
      </div>

      {/* A/B Testing Telemetry Breakdown (Item 47) */}
      {abTestResults && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-5">
            <FlaskConical className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base md:text-lg font-bold text-slate-900">
              A/B Testing Cohort Comparison (Item 47)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Variant A: Control */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Variant A (Control)</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                  No FBT
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono mb-3">
                ₹{abTestResults.A.total_revenue.toLocaleString()}
              </div>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Conv. Rate:</span>
                  <span className="font-mono font-bold">{abTestResults.A.conversion_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Order Value:</span>
                  <span className="font-mono font-bold">₹{abTestResults.A.average_order_value}</span>
                </div>
              </div>
            </div>

            {/* Variant B: Algorithmic */}
            <div className="border border-purple-200 rounded-xl p-4 bg-purple-50/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-purple-700 uppercase">Variant B (Apriori Algo)</span>
                <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold">
                  Algorithmic
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono mb-3">
                ₹{abTestResults.B.total_revenue.toLocaleString()}
              </div>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Conv. Rate:</span>
                  <span className="font-mono font-bold text-purple-700">{abTestResults.B.conversion_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Order Value:</span>
                  <span className="font-mono font-bold text-purple-700">₹{abTestResults.B.average_order_value}</span>
                </div>
              </div>
            </div>

            {/* Variant C: Curated + 10% Discount */}
            <div className="border-2 border-emerald-500 rounded-xl p-4 bg-emerald-50/40 relative shadow-sm">
              <div className="absolute -top-2.5 right-3 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Best Performer
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-800 uppercase">Variant C (Curated + Discount)</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-bold">
                  Curated P1
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-700 font-mono mb-3">
                ₹{abTestResults.C.total_revenue.toLocaleString()}
              </div>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Conv. Rate:</span>
                  <span className="font-mono font-bold text-emerald-800">{abTestResults.C.conversion_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Order Value:</span>
                  <span className="font-mono font-bold text-emerald-800">₹{abTestResults.C.average_order_value}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Performing Bundles Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm md:text-base">
            Top Performing Cross-Sell Bundles
          </h3>
          <span className="text-xs text-slate-400">Ranked by revenue generation</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-6 py-3">Bundle Title</th>
                <th className="px-6 py-3 text-center">Impressions</th>
                <th className="px-6 py-3 text-center">Conversions</th>
                <th className="px-6 py-3 text-center">Attach Rate</th>
                <th className="px-6 py-3 text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topBundles.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4 font-bold text-slate-900">{b.title}</td>
                  <td className="px-6 py-4 text-center font-mono text-slate-600">
                    {b.impressions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center font-mono font-bold text-slate-900">
                    {b.conversions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded text-xs">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      {b.attach_rate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-black text-slate-900">
                    ₹{b.revenue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
