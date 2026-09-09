import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Headset, PhoneCall, MessageSquare, MapPin, Clock, HelpCircle, ChevronRight, Home, ShieldCheck, Truck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'গ্রাহক সেবা ও সহায়তা (Customer Care) | M.M Book House Malda',
  description: 'M.M Book House Malda হেল্পলাইন ও কাস্টমার সাপোর্ট। সরাসরি কল, হোয়াটসঅ্যাপ চ্যাট, স্টোর ঠিকানা ও সচরাচর জিজ্ঞাসিত প্রশ্নোত্তর (FAQ)।',
  keywords: ['গ্রাহক সেবা', 'Customer Support Malda', 'M.M Book House Helpline', 'বইয়ের দোকান মালদা যোগাযোগ'],
};

const FAQS = [
  {
    q: 'মালদা শহরের মধ্যে কি হোম ডেলিভারি পাওয়া যায়?',
    a: 'হ্যাঁ, মালদা শহর ও সংলগ্ন এলাকায় (ইংলিশ বাজার, ওল্ড মালদা) ২৪ ঘণ্টার মধ্যে দ্রুত হোম ডেলিভারি পৌঁছে দেওয়া হয়। ৫০৯ টাকার বেশি অর্ডারে ফ্রি ডেলিভারি সুবিধা রয়েছে।',
  },
  {
    q: 'কাউন্টার থেকে সরাসরি বই সংগ্রহ (Store Pickup) করার নিয়ম কী?',
    a: 'অনলাইনে বা ফোনে অর্ডার কনফার্ম করে আপনি আমাদের নেতাজি সুভাষ রোড কাউন্টারে এসে বিনা অতিরিক্ত ডেলিভারি ফিতে সরাসরি বই সংগ্রহ করতে পারেন।',
  },
  {
    q: 'যদি কোনো বইয়ের পৃষ্ঠা ছেঁড়া বা মিসপ্রিন্ট থাকে, তবে কি বদলানো সম্ভব?',
    a: 'অবশ্যই! বই পাওয়ার ৩ দিনের মধ্যে রসিদ সহ জানালে আমরা সম্পূর্ণ বিনামূল্যে ত্রুটিপূর্ণ বই বদল (Replacement) করে নতুন কপি সরবরাহ করি।',
  },
  {
    q: 'স্কুল, কোচিং বা লাইব্রেরির জন্য বাল্ক অর্ডারে কী ছাড় পাওয়া যায়?',
    a: 'প্রাতিষ্ঠানিক অর্ডারে আমরা ২৫% থেকে ৪০% পর্যন্ত বিশেষ পাইকারি ছাড় এবং অফিসিয়াল জিএসটি ইনভয়েস প্রদান করি। আমাদের বাল্ক অর্ডার পেজ থেকে কোটেশন চাইতে পারেন।',
  },
];

export default function SupportPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 min-h-[75vh]">
      {/* Breadcrumb */}
      <nav aria-label="ব্রেডক্রাম্ব" className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 select-none">
        <Link href="/" className="hover:text-amber-600 flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>হোম</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="font-bold text-gray-900">গ্রাহক সেবা ও সহায়তা</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#131921] via-[#1e2a38] to-[#232f3e] text-white rounded-2xl p-6 sm:p-10 mb-8 border border-amber-500/20 shadow-xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Headset className="w-4 h-4 text-amber-400" />
            <span>আমরা আপনার সহায়তায় প্রস্তুত</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-3">
            M.M Book House <span className="text-amber-400">গ্রাহক সেবা কেন্দ্র</span>
          </h1>
          <p className="text-sm text-gray-300 leading-relaxed">
            বইয়ের খোঁজ, ডেলিভারি স্ট্যাটাস, ভুল বই সংশোধন অথবা বাল্ক বুকিং সংক্রান্ত যে কোনো প্রয়োজনে সরাসরি আমাদের সাথে যোগাযোগ করুন।
          </p>
        </div>
      </div>

      {/* Contact Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Phone Call Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <PhoneCall className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">সরাসরি ফোন করুন</h3>
            <p className="text-xs text-gray-500 mb-4">
              যে কোনো বইয়ের সহজলভ্যতা ও জরুরি অর্ডারের জন্য কল করুন।
            </p>
            <div className="text-lg font-black text-gray-900 mb-1">+91 98001 23456</div>
            <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>সকাল ১০:০০ - রাত ৯:০০ (প্রতিদিন)</span>
            </div>
          </div>
          <a
            href="tel:+919800123456"
            className="mt-6 w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-gray-950 text-xs font-bold rounded flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>এখনই কল করুন</span>
          </a>
        </div>

        {/* WhatsApp Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">হোয়াটসঅ্যাপ চ্যাট সাপোর্ট</h3>
            <p className="text-xs text-gray-500 mb-4">
              বইয়ের ছবি বা লিস্ট পাঠিয়ে সহজে ইনকোয়ারি ও অর্ডার করুন।
            </p>
            <div className="text-lg font-black text-gray-900 mb-1">+91 97330 00000</div>
            <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <span>অনলাইন রেসপন্স সাধারণত ১৫ মিনিটে</span>
            </div>
          </div>
          <a
            href="https://wa.me/919733000000"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>হোয়াটসঅ্যাপে চ্যাট করুন</span>
          </a>
        </div>

        {/* Store Counter Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">মালদা প্রধান কাউন্টার</h3>
            <p className="text-xs text-gray-500 mb-2">
              সরাসরি দোকানে এসে বই দেখে কেনার জন্য উপস্থিত হন:
            </p>
            <address className="text-xs text-gray-800 not-italic font-medium leading-relaxed mb-2">
              নেতাজি সুভাষ রোড, ইংলিশ বাজার,<br />
              মালদা - ৭৩২১০১, পশ্চিমবঙ্গ
            </address>
            <div className="text-xs text-blue-700 font-semibold">ল্যান্ডমার্ক: পুরাতন ডাকঘরের নিকটে</div>
          </div>
          <a
            href="https://maps.google.com/?q=English+Bazar+Malda"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>গুগল ম্যাপে দেখুন</span>
          </a>
        </div>
      </div>

      {/* FAQs Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-amber-600" />
          <span>সচরাচর জিজ্ঞাসিত প্রশ্নোত্তর (FAQ)</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FAQS.map((faq, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <h4 className="font-bold text-sm text-gray-900 mb-2 flex items-start gap-2">
                <span className="text-amber-600 font-black">প্র:</span>
                <span>{faq.q}</span>
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed pl-5">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
