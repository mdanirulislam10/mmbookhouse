'use client';

import React, { useState, useMemo } from 'react';
import { ProductBundle, BundleItem, BundleDiscountType, BundleSourceType } from '../../types/bundle';
import { calculateBundlePricing } from '../../lib/services/bundlePricingService';
import { isAntiCannibalized, isPriceAsymmetricValid } from '../../lib/services/bundleRecommendationService';
import {
  PackagePlus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Search,
  Filter,
  Layers,
  ArrowRight,
  TrendingUp,
  Tag,
  ShieldCheck,
  Percent,
} from 'lucide-react';

export interface AdminBundleManagerProps {
  initialBundles?: ProductBundle[];
  availableBooksCatalog?: BundleItem[];
  onSaveBundle?: (bundle: ProductBundle) => Promise<void> | void;
  onDeleteBundle?: (bundleId: string) => Promise<void> | void;
}

export const AdminBundleManager: React.FC<AdminBundleManagerProps> = ({
  initialBundles = [],
  availableBooksCatalog = [],
  onSaveBundle,
  onDeleteBundle,
}) => {
  const [bundles, setBundles] = useState<ProductBundle[]>(initialBundles);
  const [filterSource, setFilterSource] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Builder Modal / Form State
  const [isCreating, setIsCreating] = useState(false);
  const [bundleTitle, setBundleTitle] = useState('');
  const [bundleTitleBn, setBundleTitleBn] = useState('');
  const [selectedPrimaryId, setSelectedPrimaryId] = useState<string>('');
  const [selectedCompIds, setSelectedCompIds] = useState<string[]>([]);
  const [discountType, setDiscountType] = useState<BundleDiscountType>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [campaignTag, setCampaignTag] = useState<string>('GENERAL');
  const [priorityScore, setPriorityScore] = useState<number>(100);

  // Filtered bundle list
  const filteredBundles = useMemo(() => {
    return bundles.filter((b) => {
      const matchSource = filterSource === 'ALL' || b.bundle_source === filterSource;
      const matchQuery =
        searchQuery === '' ||
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.title_bn && b.title_bn.includes(searchQuery));
      return matchSource && matchQuery;
    });
  }, [bundles, filterSource, searchQuery]);

  // Selected primary book object
  const primaryBook = useMemo(
    () => availableBooksCatalog.find((b) => b.product_id === selectedPrimaryId),
    [availableBooksCatalog, selectedPrimaryId]
  );

  // Selected complementary books array
  const compBooks = useMemo(
    () => availableBooksCatalog.filter((b) => selectedCompIds.includes(b.product_id)),
    [availableBooksCatalog, selectedCompIds]
  );

  // Constructed bundle preview object
  const previewBundle = useMemo<ProductBundle | null>(() => {
    if (!primaryBook) return null;

    const items: BundleItem[] = [
      { ...primaryBook, is_primary: true },
      ...compBooks.map((b) => ({ ...b, is_primary: false })),
    ];

    return {
      id: `bundle-preview-${Date.now()}`,
      primary_product_id: primaryBook.product_id,
      title: bundleTitle || `${primaryBook.title} Special Combo`,
      title_bn: bundleTitleBn || `${primaryBook.title_bn || primaryBook.title} স্পেশাল কম্বো`,
      items,
      discount_type: discountType,
      discount_value: discountValue,
      bundle_source: 'CURATED',
      priority_score: priorityScore,
      is_active: true,
      created_at: new Date().toISOString(),
    };
  }, [primaryBook, compBooks, bundleTitle, bundleTitleBn, discountType, discountValue, priorityScore]);

  // Live pricing breakdown for preview
  const livePricing = useMemo(() => {
    if (!previewBundle) return null;
    return calculateBundlePricing({
      bundle: previewBundle,
      selectedItemIds: previewBundle.items.map((i) => i.product_id),
      locale: 'bn',
    });
  }, [previewBundle]);

  // Anti-Cannibalization & Asymmetric Price Validation checks (Items 23, 26)
  const validationWarnings = useMemo(() => {
    const warnings: string[] = [];
    if (!primaryBook) return warnings;

    for (const comp of compBooks) {
      if (!isAntiCannibalized(primaryBook, comp)) {
        warnings.push(
          `⚠️ Anti-Cannibalization Warning: "${comp.title}" appears to be a direct textbook substitute for the same subject/class.`
        );
      }
      if (!isPriceAsymmetricValid(primaryBook, comp, 2.0)) {
        warnings.push(
          `⚠️ Asymmetric Pricing Warning: "${comp.title}" price (₹${comp.unit_selling_price}) exceeds 2.0x primary price (₹${primaryBook.unit_selling_price}).`
        );
      }
    }

    if (compBooks.length > 2) {
      warnings.push('⚠️ Cognitive Overload: Maximum 2 complementary items allowed (total 3 items).');
    }

    return warnings;
  }, [primaryBook, compBooks]);

  const handleCreateBundle = async () => {
    if (!previewBundle || !primaryBook || compBooks.length === 0) return;

    const newBundle: ProductBundle = {
      ...previewBundle,
      id: `curated-${Date.now()}`,
      description: campaignTag !== 'GENERAL' ? `Campaign: ${campaignTag}` : undefined,
    };

    setBundles((prev) => [newBundle, ...prev]);
    if (onSaveBundle) {
      await onSaveBundle(newBundle);
    }

    // Reset Form
    setIsCreating(false);
    setSelectedPrimaryId('');
    setSelectedCompIds([]);
    setBundleTitle('');
    setBundleTitleBn('');
  };

  const handleToggleStatus = (bundleId: string) => {
    setBundles((prev) =>
      prev.map((b) => (b.id === bundleId ? { ...b, is_active: !b.is_active } : b))
    );
  };

  const handleDelete = async (bundleId: string) => {
    setBundles((prev) => prev.filter((b) => b.id !== bundleId));
    if (onDeleteBundle) {
      await onDeleteBundle(bundleId);
    }
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen p-4 md:p-8 font-sans text-slate-800">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl md:text-2xl font-black text-slate-900">
              Frequently Bought Together (FBT) Merchandising Manager
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Curate 2-3 item high-margin cross-sell combos, pin admin overrides, and track AOV basket expansions.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow transition active:scale-95"
        >
          <PackagePlus className="w-4 h-4" />
          Create Curated Bundle (P1)
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search bundles by title or book..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="border border-slate-300 rounded-lg py-2 px-3 text-xs md:text-sm font-medium bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Sources</option>
            <option value="CURATED">Curated (Admin Overrides)</option>
            <option value="ALGORITHMIC">Algorithmic Co-Purchases</option>
            <option value="CATEGORY_FALLBACK">Category Fallback</option>
          </select>
        </div>
      </div>

      {/* Bundle Creation Modal Form */}
      {isCreating && (
        <div className="bg-white border-2 border-blue-500 rounded-2xl p-6 shadow-xl mb-8 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-slate-900">
                New Curated Bundle Builder (Items 21, 24, 25)
              </h2>
            </div>
            <button
              onClick={() => setIsCreating(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-700"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Form Fields */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bundle Title (English) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Madhyamik Class 10 Math & Question Bank Master Combo"
                  value={bundleTitle}
                  onChange={(e) => setBundleTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bundle Title (Bengali)
                </label>
                <input
                  type="text"
                  placeholder="e.g. মাধ্যমিক গণিত ও সহায়িকা স্পেশাল কম্বো"
                  value={bundleTitleBn}
                  onChange={(e) => setBundleTitleBn(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              {/* Select Primary Product */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Select Primary PDP Book (Anchor Item) *
                </label>
                <select
                  value={selectedPrimaryId}
                  onChange={(e) => setSelectedPrimaryId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium"
                >
                  <option value="">-- Choose Primary Book --</option>
                  {availableBooksCatalog.map((book) => (
                    <option key={book.product_id} value={book.product_id}>
                      {book.title} (₹{book.unit_selling_price})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Complementary Products */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Select Complementary Books (1 or 2 items maximum) *
                </label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50">
                  {availableBooksCatalog
                    .filter((b) => b.product_id !== selectedPrimaryId)
                    .map((b) => {
                      const isChecked = selectedCompIds.includes(b.product_id);
                      return (
                        <label
                          key={b.product_id}
                          className="flex items-center gap-2 p-1.5 hover:bg-white rounded cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                if (selectedCompIds.length < 2) {
                                  setSelectedCompIds([...selectedCompIds, b.product_id]);
                                }
                              } else {
                                setSelectedCompIds(selectedCompIds.filter((id) => id !== b.product_id));
                              }
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-medium text-slate-800">{b.title}</span>
                          <span className="text-slate-400">₹{b.unit_selling_price}</span>
                        </label>
                      );
                    })}
                </div>
              </div>

              {/* Discount Controls */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as BundleDiscountType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Discount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Discount Value {discountType === 'PERCENTAGE' ? '(Max 50%)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={discountType === 'PERCENTAGE' ? 50 : 500}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Campaign & Priority Tags (Items 25, 37) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Promotional Tag (Item 25 & 37)
                  </label>
                  <select
                    value={campaignTag}
                    onChange={(e) => setCampaignTag(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="GENERAL">General Cross-Sell</option>
                    <option value="MADHYAMIK_BOOST">Madhyamik Board Boost</option>
                    <option value="HS_EXAM_SPECIAL">Higher Secondary Special</option>
                    <option value="CLEARANCE_COMBO">Clearance / Slow-Moving Pair</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Priority Score (1-100)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={priorityScore}
                    onChange={(e) => setPriorityScore(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Live Pricing Preview & Anti-Cannibalization Warnings */}
            <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Live Combo Pricing Breakdown
                </h3>

                {livePricing ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Total MRP:</span>
                      <span className="font-mono">₹{livePricing.total_mrp}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Individual Selling Price:</span>
                      <span className="font-mono">₹{livePricing.total_selling_price}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Combo Extra Savings:</span>
                      <span className="font-mono">-₹{livePricing.combo_discount}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-900">
                      <span>Customer Pays:</span>
                      <span className="font-mono text-emerald-600">₹{livePricing.final_payable_amount}</span>
                    </div>
                    <div className="bg-emerald-50 text-emerald-800 p-2 rounded text-[11px] font-semibold mt-2">
                      Total customer savings: ₹{livePricing.total_savings} (regular discount + combo savings)
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Select a primary item and at least 1 complementary item to view pricing preview.
                  </p>
                )}

                {/* Validation Warnings (Anti-Cannibalization / Asymmetric Ratio) */}
                {validationWarnings.length > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1.5">
                    {validationWarnings.map((w, i) => (
                      <p key={i} className="text-[11px] font-medium text-amber-800 flex items-start gap-1">
                        <span>{w}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="mt-6">
                <button
                  onClick={handleCreateBundle}
                  disabled={!primaryBook || compBooks.length === 0}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm shadow transition flex items-center justify-center gap-2 ${
                    primaryBook && compBooks.length > 0
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Save & Publish Bundle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bundles Grid Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm md:text-base">
            Active Product Bundles ({filteredBundles.length})
          </h2>
          <span className="text-xs text-slate-400">Showing all registered bundles</span>
        </div>

        {filteredBundles.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No product bundles found matching your filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredBundles.map((b) => {
              const primary = b.items.find((it) => it.is_primary) || b.items[0];
              const comps = b.items.filter((it) => !it.is_primary);

              return (
                <div
                  key={b.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  {/* Info Column */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          b.bundle_source === 'CURATED'
                            ? 'bg-blue-100 text-blue-700'
                            : b.bundle_source === 'ALGORITHMIC'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {b.bundle_source} (P{b.priority_score})
                      </span>
                      {b.description && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                          <Tag className="w-2.5 h-2.5" />
                          {b.description}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          b.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {b.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm md:text-base">{b.title}</h3>
                    {b.title_bn && <p className="text-xs text-slate-500">{b.title_bn}</p>}

                    {/* Items chips */}
                    <div className="flex items-center flex-wrap gap-2 mt-2">
                      <span className="text-[11px] bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-blue-600" />
                        Primary: {primary.title}
                      </span>
                      {comps.map((c) => (
                        <span
                          key={c.product_id}
                          className="text-[11px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-medium"
                        >
                          + {c.title}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Pricing & Actions Column */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-600 flex items-center justify-end gap-1">
                        <Percent className="w-3.5 h-3.5" />
                        {b.discount_type === 'PERCENTAGE'
                          ? `${b.discount_value}% Combo Off`
                          : `₹${b.discount_value} Flat Off`}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {b.items.length} items bundle
                      </div>
                    </div>

                    {/* Toggle Active Button */}
                    <button
                      onClick={() => handleToggleStatus(b.id)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                        b.is_active
                          ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                          : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {b.is_active ? 'Disable' : 'Enable'}
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete bundle"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
