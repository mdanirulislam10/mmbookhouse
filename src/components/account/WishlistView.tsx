'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Heart,
  ShoppingCart,
  Trash2,
  Share2,
  FolderPlus,
  Folder,
  Check,
  BookOpen,
  ArrowRight,
  TrendingDown,
  Copy,
  ChevronRight,
  Home,
  X,
  MessageCircle,
} from 'lucide-react';
import { useWishlist, WishlistItem, WishlistFolder } from '@/hooks/useWishlistStore';
import { useCartActions } from '@/hooks/useCartStore';
import { useLanguage } from '@/hooks/useLanguage';
import { formatINR, toBengaliNumerals } from '@/lib/utils/currency';

export const WishlistView: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderNameBn, setNewFolderNameBn] = useState('');
  const [copied, setCopied] = useState(false);
  const [addedAllSuccess, setAddedAllSuccess] = useState(false);

  const {
    items,
    activeFolderItems,
    folders,
    selectedFolderId,
    setSelectedFolderId,
    removeItem,
    createFolder,
    moveToFolder,
    addAllToCart,
    getShareableLink,
  } = useWishlist();

  const { addItem: addCartItem, openDrawer } = useCartActions();
  const { language, isBengali } = useLanguage();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div
        aria-label={isBengali ? 'পছন্দের তালিকা লোড হচ্ছে...' : 'Loading Wishlist...'}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse font-bengali"
      >
        <div className="h-4 bg-gray-200 rounded w-48 mb-6" />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-300 mb-8">
          {isBengali ? 'পছন্দের তালিকা (Wishlist)' : 'Your Wishlist'}
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg h-64 border border-gray-200" />
          <div className="bg-white rounded-lg h-64 border border-gray-200" />
          <div className="bg-white rounded-lg h-64 border border-gray-200" />
        </div>
      </div>
    );
  }

  const activeFolder = folders.find((f) => f.id === selectedFolderId);

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const newId = createFolder(newFolderName.trim(), newFolderNameBn.trim());
    setSelectedFolderId(newId);
    setNewFolderName('');
    setNewFolderNameBn('');
    setIsFolderModalOpen(false);
  };

  const handleAddAllToCart = () => {
    const res = addAllToCart(selectedFolderId);
    if (res.addedCount > 0) {
      setAddedAllSuccess(true);
      setTimeout(() => setAddedAllSuccess(false), 3000);
      openDrawer();
    }
  };

  const handleCopyShareLink = async () => {
    const link = getShareableLink(selectedFolderId);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWhatsAppShare = () => {
    const link = getShareableLink(selectedFolderId);
    const folderTitle = activeFolder
      ? isBengali
        ? activeFolder.nameBn
        : activeFolder.name
      : isBengali
      ? 'আমার পছন্দের বইয়ের তালিকা'
      : 'My Book Wishlist';

    const text = isBengali
      ? `📚 *${folderTitle}* - M.M Book House Malda\nআমার পছন্দের বইগুলোর তালিকা দেখে নিন:\n${link}`
      : `📚 *${folderTitle}* - M.M Book House Malda\nCheck out my curated book list:\n${link}`;

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-[75vh] bg-[#eaeded] py-6 font-bengali">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-gray-600 mb-4 select-none"
        >
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-amber-800 transition-colors font-medium"
          >
            <Home className="w-3.5 h-3.5 text-gray-500" />
            <span>{isBengali ? 'হোম' : 'Home'}</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
          <Link
            href="/account"
            className="hover:text-amber-800 transition-colors font-medium"
          >
            <span>{isBengali ? 'আমার অ্যাকাউন্ট' : 'Your Account'}</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
          <span className="font-semibold text-gray-900" aria-current="page">
            {isBengali ? 'পছন্দের তালিকা (উইশলিস্ট)' : 'Wishlist'}
          </span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-gray-300 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center border border-red-200 shadow-2xs">
                <Heart className="w-5 h-5 fill-red-500 text-red-500" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {isBengali ? 'পছন্দের তালিকা (Wishlist)' : 'Your Wishlist'}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {isBengali
                ? 'আপনার পছন্দের বইগুলো সংরক্ষণ করুন, সিলেবাস অনুযায়ী ফোল্ডার বানান এবং বন্ধুদের সাথে শেয়ার করুন।'
                : 'Save your favorite books, organize them by exam syllabus, and share with friends.'}
            </p>
          </div>

          {/* Top Actions Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Task 29: Add All to Cart Button */}
            <button
              type="button"
              onClick={handleAddAllToCart}
              disabled={activeFolderItems.length === 0}
              className="py-2 px-4 bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-950 text-xs sm:text-sm font-bold rounded-lg border border-[#fcd200] shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>
                {isBengali
                  ? `সকল বই কার্টে যোগ করুন (${toBengaliNumerals(activeFolderItems.length)})`
                  : `Add All to Cart (${activeFolderItems.length})`}
              </span>
            </button>

            {/* Task 27: Share Wishlist Button */}
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="py-2 px-3.5 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 text-xs sm:text-sm font-semibold rounded-lg border border-gray-300 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span>{isBengali ? 'তালিকা শেয়ার করুন' : 'Share List'}</span>
            </button>
          </div>
        </div>

        {/* Task 29 Success Toast Notification */}
        {addedAllSuccess && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg flex items-center gap-2 text-xs sm:text-sm animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {isBengali
                ? 'এই তালিকার সমস্ত বই সফলভাবে আপনার কার্টে যোগ করা হয়েছে!'
                : 'All items from this list have been added to your shopping cart!'}
            </span>
          </div>
        )}

        {/* Task 30: Custom Wishlist Folders / Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 slim-scrollbar">
          {folders.map((folder) => {
            const isSelected = folder.id === selectedFolderId;
            const folderCount =
              folder.id === 'folder-all'
                ? items.length
                : items.filter((i) => i.folderId === folder.id).length;

            return (
              <button
                key={folder.id}
                type="button"
                onClick={() => setSelectedFolderId(folder.id)}
                className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold shrink-0 flex items-center gap-2 transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-amber-900 text-white shadow-xs'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Folder className={`w-4 h-4 ${isSelected ? 'text-amber-300' : 'text-gray-400'}`} />
                <span>{isBengali ? folder.nameBn : folder.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isSelected ? 'bg-amber-800 text-amber-100' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {isBengali ? toBengaliNumerals(folderCount) : folderCount}
                </span>
              </button>
            );
          })}

          {/* "+ নতুন ফোল্ডার তৈরি করুন" Trigger Button */}
          <button
            type="button"
            onClick={() => setIsFolderModalOpen(true)}
            className="px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300/80 shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-amber-700" />
            <span>{isBengali ? '+ নতুন ফোল্ডার' : '+ New Folder'}</span>
          </button>
        </div>

        {/* Wishlist Items Grid */}
        {activeFolderItems.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <BookOpen className="w-8 h-8 opacity-70" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">
                {isBengali ? 'এই তালিকায় কোনো বই নেই' : 'No books in this list'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500">
                {isBengali
                  ? 'বইয়ের ক্যাটালগ ঘুরে পছন্দের বইয়ের পাশে থাকা হার্ট আইকনে ক্লিক করে তালিকায় যোগ করুন।'
                  : 'Browse our catalog and tap the heart icon on any book to add it to this list.'}
              </p>
            </div>
            <Link
              href="/"
              className="mt-2 inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#ffd814] hover:bg-[#f7ca00] text-gray-950 font-bold rounded-lg text-xs sm:text-sm shadow-xs transition-all"
            >
              <span>{isBengali ? 'বইয়ের ক্যাটালগ দেখুন' : 'Explore Books'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Grid of Saved Books */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {activeFolderItems.map((item) => {
              const title = isBengali ? item.titleBn || item.title : item.title;
              const hasSavings = item.mrp > item.price;
              const discountPercent = hasSavings
                ? Math.round(((item.mrp - item.price) / item.mrp) * 100)
                : 0;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 shadow-2xs hover:border-amber-400 hover:shadow-sm transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Task 28: Price Drop Alert Badge */}
                    {item.priceDropAlert && item.originalPrice && item.originalPrice > item.price && (
                      <div className="mb-3 px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-md flex items-center gap-1.5 text-xs text-blue-900 font-semibold">
                        <TrendingDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>
                          {isBengali
                            ? `সুসংবাদ! দাম ₹${toBengaliNumerals(item.originalPrice - item.price)} কমেছে!`
                            : `Price dropped by ${formatINR(item.originalPrice - item.price, language)}!`}
                        </span>
                      </div>
                    )}

                    <div className="flex gap-3 items-start">
                      {/* Thumbnail */}
                      <Link
                        href={`/book/${item.bookId}`}
                        className="relative w-20 h-28 bg-amber-50/70 rounded border border-amber-200/80 overflow-hidden shrink-0 group-hover:border-amber-400 transition-all"
                      >
                        {item.coverImage ? (
                          <Image
                            src={item.coverImage}
                            alt={title}
                            fill
                            sizes="80px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-amber-700">
                            <BookOpen className="w-6 h-6 opacity-60" />
                          </div>
                        )}
                      </Link>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/book/${item.bookId}`}
                          className="group-hover:text-amber-800 transition-colors"
                        >
                          <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug">
                            {title}
                          </h3>
                        </Link>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{item.author}</p>

                        {/* Stock status */}
                        <div className="mt-1.5">
                          {item.inStock ? (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              {isBengali ? 'ইন স্টক (In Stock)' : 'In Stock'}
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                              {isBengali ? 'স্টক শেষ' : 'Out of Stock'}
                            </span>
                          )}
                        </div>

                        {/* Price */}
                        <div className="mt-2 flex items-baseline gap-1.5">
                          <span className="text-base font-bold text-gray-950 font-mono">
                            {formatINR(item.price, language)}
                          </span>
                          {hasSavings && (
                            <>
                              <span className="text-xs text-gray-400 line-through font-mono">
                                {formatINR(item.mrp, language)}
                              </span>
                              <span className="text-[10px] font-bold text-red-700 bg-red-50 px-1 rounded border border-red-100">
                                -{discountPercent}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    {/* Move to Folder Dropdown */}
                    <div className="flex items-center gap-1 text-xs">
                      <select
                        value={item.folderId || 'folder-all'}
                        onChange={(e) => moveToFolder(item.bookId, e.target.value)}
                        aria-label="Move to folder"
                        className="text-[11px] py-1 px-1.5 bg-gray-50 border border-gray-200 rounded text-gray-700 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                      >
                        {folders.map((f) => (
                          <option key={f.id} value={f.id}>
                            {isBengali ? f.nameBn : f.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.bookId)}
                        aria-label="Remove from wishlist"
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                        title={isBengali ? 'তালিকা থেকে মুছুন' : 'Remove from list'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Add to Cart */}
                      <button
                        type="button"
                        onClick={() => {
                          addCartItem({
                            id: `cart-${item.bookId}-${Date.now().toString(36)}`,
                            bookId: item.bookId,
                            title: item.title,
                            titleBn: item.titleBn,
                            author: item.author,
                            price: item.price,
                            mrp: item.mrp,
                            coverImage: item.coverImage,
                            quantity: 1,
                          });
                          openDrawer();
                        }}
                        className="py-1.5 px-3 bg-[#ffd814] hover:bg-[#f7ca00] text-gray-950 font-bold rounded text-xs shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>{isBengali ? 'কার্ট' : 'Add'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Task 27: Shareable Wishlist Modal */}
        {isShareModalOpen && (
          <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-gray-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-bold text-gray-900">
                    {isBengali ? 'পছন্দের তালিকা শেয়ার করুন' : 'Share Your Wishlist'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-gray-600">
                {isBengali
                  ? 'এই পাবলিক লিঙ্কটি আপনার বন্ধু, সহপাঠী বা অভিভাবকদের শেয়ার করুন যাতে তারা এক ক্লিকে আপনার সিলেবাসের বই দেখতে ও উপহার হিসেবে পাঠাতে পারে।'
                  : 'Share this public link with friends, classmates, or guardians so they can view and order your syllabus books.'}
              </p>

              {/* Link Box */}
              <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-300 rounded-lg">
                <input
                  type="text"
                  readOnly
                  value={getShareableLink(selectedFolderId)}
                  className="flex-1 bg-transparent text-xs text-gray-700 font-mono select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isBengali ? 'কপি হয়েছে' : 'Copied'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{isBengali ? 'কপি' : 'Copy'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Direct WhatsApp Share Action */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="w-full py-2.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs sm:text-sm rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>{isBengali ? 'হোয়াটসঅ্যাপে সরাসরি পাঠান' : 'Share directly on WhatsApp'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Task 30: Create New Folder Modal */}
        {isFolderModalOpen && (
          <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-gray-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-amber-700" />
                  <h3 className="text-base font-bold text-gray-900">
                    {isBengali ? 'নতুন উইশলিস্ট ফোল্ডার তৈরি করুন' : 'Create New Wishlist Folder'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFolderModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateFolder} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">
                    {isBengali ? 'ফোল্ডারের নাম (ইংরেজি):' : 'Folder Name (English):'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. WBCS Mains Exam, Semester 4"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="w-full p-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">
                    {isBengali ? 'ফোল্ডারের নাম (বাংলা - ঐচ্ছিক):' : 'Folder Name (Bengali - Optional):'}
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: WBCS মেইনস পরীক্ষা, ৪র্থ সেমিস্টার"
                    value={newFolderNameBn}
                    onChange={(e) => setNewFolderNameBn(e.target.value)}
                    className="w-full p-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFolderModalOpen(false)}
                    className="px-3.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded cursor-pointer"
                  >
                    {isBengali ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded cursor-pointer transition-colors"
                  >
                    {isBengali ? 'ফোল্ডার সংরক্ষণ করুন' : 'Save Folder'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistView;
