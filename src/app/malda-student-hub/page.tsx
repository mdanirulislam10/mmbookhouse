import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, GraduationCap, Award, Bell, BookOpen, ChevronRight, Home, CheckCircle2, PhoneCall, MessageSquare } from 'lucide-react';

export const metadata: Metadata = {
  title: 'মালদা স্টুডেন্ট হাব ও এক্সাম কর্নার | M.M Book House Malda',
  description: 'গৌড়বঙ্গ বিশ্ববিদ্যালয় (UGB) এবং মালদা জেলার সমস্ত কলেজ ও স্কুল শিক্ষার্থীদের জন্য বিশেষ স্টুডেন্ট কর্নার। সেমিস্টার রুটিন, পরীক্ষার বই ও স্থানীয় স্পেশাল ছাড়।',
  keywords: ['মালদা স্টুডেন্ট হাব', 'UGB গৌড়বঙ্গ বিশ্ববিদ্যালয়', 'Malda College Books', 'M.M Book House Malda Hub'],
};

const LOCAL_COLLEGES = [
  'মালদা কলেজ (Malda College)',
  'গৌড় মহাবিদ্যালয় (Gour Mahavidyalaya, Mangalbari)',
  'সামসী কলেজ (Samsi College)',
  'সাউথ মালদা কলেজ (South Malda College)',
  'হরিশচন্দ্রপুর কলেজ (Harishchandrapur College)',
  'কালিয়াচক কলেজ (Kaliachak College)',
  'মানিকচক কলেজ (Manikchak College)',
  'চাঁচল কলেজ (Chanchal College)',
];

export default function MaldaStudentHubPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 min-h-[75vh]">
      {/* Breadcrumb */}
      <nav aria-label="ব্রেডক্রাম্ব" className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 select-none">
        <Link href="/" className="hover:text-amber-600 flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>হোম</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="font-bold text-gray-900">মালদা স্টুডেন্ট হাব</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#131921] via-[#1c2836] to-[#232f3e] text-white rounded-2xl p-6 sm:p-10 mb-8 border border-amber-500/30 shadow-xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
            <MapPin className="w-4 h-4 text-amber-400" />
            <span>মালদা জেলা স্পেশাল কর্নার</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-3">
            মালদা স্টুডেন্ট হাব <span className="text-amber-400">(Malda Student Hub)</span>
          </h1>
          <p className="text-sm text-gray-300 leading-relaxed">
            গৌড়বঙ্গ বিশ্ববিদ্যালয় (UGB) অধিভুক্ত সমস্ত কলেজ এবং মালদার প্রতিযোগিতামূলক পরীক্ষার্থীদের জন্য প্রামাণ্য সিলেবাস গাইড, মডেল প্রশ্ন ও স্থানীয় ছাত্রবান্ধব সুবিধা।
          </p>
        </div>
      </div>

      {/* Highlights & Student Perks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
            <GraduationCap className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-gray-900 mb-1">UGB সেমিস্টার ১-৬ কমপ্লিট বুকস</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            CBCS এবং NEP সিলেবাসের সমস্ত মেজর ও মাইনর পেপারের প্রামাণ্য বই ও সহায়িকা সহজলভ্য।
          </p>
          <Link
            href="/category/college/ugb"
            className="text-xs font-bold text-amber-600 hover:underline mt-3 inline-block"
          >
            UGB ক্যাটালগ দেখুন →
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-gray-900 mb-1">কাউন্টার স্টুডেন্ট ডিসকাউন্ট</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            কলেজ বা স্কুলের আইডি কার্ড দেখালে সরাসরি নেতাজি সুভাষ রোড কাউন্টারে অতিরিক্ত স্পেশাল ছাড় পাওয়া যাবে।
          </p>
          <span className="text-xs font-bold text-emerald-700 mt-3 inline-block">
            ✓ বৈধ স্টুডেন্ট আইডি প্রযোজ্য
          </span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
            <Bell className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-gray-900 mb-1">হোয়াটসঅ্যাপ সিলেবাস ইনকোয়ারি</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            আপনার বিষয় ও সেমিস্টার লিখে হোয়াটসঅ্যাপ মেসেজ করলেই বইয়ের তালিকা ও মূল্য তালিকা পাঠানো হবে।
          </p>
          <a
            href="https://wa.me/919733000000?text=UGB%20Syllabus%20Book%20Inquiry"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-emerald-600 hover:underline mt-3 inline-block"
          >
            মেসেজ পাঠান (WhatsApp) →
          </a>
        </div>
      </div>

      {/* Affiliated Colleges List */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 shadow-sm mb-8">
        <h2 className="text-base font-black text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-600" />
          <span>মালদা জেলার কলেজসমূহ (আমরা যাদের বই সরবরাহ করি)</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {LOCAL_COLLEGES.map((college, idx) => (
            <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs font-medium text-gray-800 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{college}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Local Store Location Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm text-gray-900 mb-1">
            সরাসরি দোকানে আসতে চান?
          </h4>
          <p className="text-xs text-gray-600">
            ঠিকানা: নেতাজি সুভাষ রোড, ইংলিশ বাজার, মালদা - ৭৩২১০১ (সকাল ১০টা থেকে রাত ৯টা)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="tel:+919800123456"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold text-xs rounded shadow-xs transition-colors flex items-center gap-1.5"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>কল করুন</span>
          </a>
          <a
            href="https://wa.me/919733000000"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded shadow-xs transition-colors flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
