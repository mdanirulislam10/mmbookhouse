'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  BookOpen,
  CheckCircle2,
  ListOrdered,
  FileText,
  HelpCircle,
  GraduationCap,
} from 'lucide-react';
import { TableOfContentChapter } from '@/types/pdp';
import { toBengaliNumerals } from '@/lib/utils/currency';
import { useLanguage } from '@/hooks/useLanguage';

interface SyllabusAccordionProps {
  chapters?: TableOfContentChapter[];
  bookTitle?: string;
  categoryName?: string;
  className?: string;
}

const DEFAULT_CHAPTERS: TableOfContentChapter[] = [
  {
    chapterNumber: 'অধ্যায় ১',
    title: 'Ancient & Medieval Indian History',
    titleBn: 'প্রাচীন ও মধ্যযুগীয় ভারতের ইতিহাস',
    pageRange: '১–১১০',
    topics: [
      'সিন্ধু সভ্যতা ও হরপ্পা সংস্কৃতি',
      'বৈদিক সাহিত্য ও মহাজনপদ',
      'মৌর্য ও গুপ্ত সাম্রাজ্যের বিস্তার ও প্রশাসন',
      'দিল্লি সুলতানি যুগ ও ভক্তি-সুফি আন্দোলন',
      'মুঘল সাম্রাজ্য ও মনসবদারি প্রথা',
    ],
  },
  {
    chapterNumber: 'অধ্যায় ২',
    title: 'Indian National Movement (Civil Services Focus)',
    titleBn: 'ভারতের জাতীয় মুক্তি সংগ্রাম ও স্বাধীনতা আন্দোলন',
    pageRange: '১১১–২৪০',
    topics: [
      '১৮৫৭ সালের মহাবিদ্রোহ ও তার প্রভাব',
      'জাতীয় কংগ্রেসের প্রতিষ্ঠা ও নরমপন্থী-চরমপন্থী পর্ব',
      'স্বদেশী আন্দোলন ও বঙ্গভঙ্গ বিরোধী সংগ্রাম',
      'গান্ধী যুগ: অসহযোগ, আইন অমান্য ও ভারত ছাড়ো',
      'নেতাজি সুভাষচন্দ্র বসু ও আজাদ হিন্দ ফৌজ',
    ],
  },
  {
    chapterNumber: 'অধ্যায় ৩',
    title: 'Geography of India with West Bengal & Malda Special',
    titleBn: 'ভারতের ভূগোল ও পশ্চিমবঙ্গের ভৌগোলিক রূপরেখা',
    pageRange: '২৪১–৩৯০',
    topics: [
      'ভারতের প্রাকৃতিক বিভাগ ও নদনদী',
      'পশ্চিমবঙ্গের ভূ-প্রকৃতি, মাটি ও জলবায়ু',
      'মালদা ও উত্তরবঙ্গের ভৌগোলিক ও কৃষিজ বৈশিষ্ট্য',
      'শিল্প, খনিজ সম্পদ ও পরিবহন ব্যবস্থা',
      '২০১১ জনগণনা ও জনমিতি বিশ্লেষণ',
    ],
  },
  {
    chapterNumber: 'অধ্যায় ৪',
    title: 'Indian Polity & Constitution of India',
    titleBn: 'ভারতীয় সংবিধান ও শাসনব্যবস্থা',
    pageRange: '৩৯১–৫২০',
    topics: [
      'সংবিধানের প্রস্তাবনা ও মৌলিক অধিকার',
      'নির্দেশমূলক নীতি ও মৌলিক কর্তব্য',
      'রাষ্ট্রপতি, প্রধানমন্ত্রী ও সংসদীয় কাঠামো',
      'সুপ্রিম কোর্ট ও বিচার বিভাগীয় সক্রিয়তা',
      'পশ্চিমবঙ্গের পঞ্চায়েতি রাজ ও স্থানীয় স্বায়ত্তশাসন',
    ],
  },
  {
    chapterNumber: 'অধ্যায় ৫',
    title: 'Previous Years Solved Papers & Model Mocks (2010–2025)',
    titleBn: 'বিগত ১৫ বছরের প্রিলিমিনারি ও মেইনস সমাধান',
    pageRange: '৫২১–৮৬৪',
    topics: [
      'অধ্যায়ভিত্তিক বিগত ১৫ বছরের প্রশ্ন সমাধান',
      'মডেল ওএমআর টেস্ট পেপারস ও স্ব-মূল্যায়ন শিট',
      'এক্সক্লুসিভ ২০২৬ সম্ভাব্য প্রশ্নাবলি',
    ],
  },
];

// Sample paper weightages mapped to chapters for competitive examinations
const CHAPTER_WEIGHTAGES: Record<number, { prelimsMarks: string; mainsMarks: string; yield: 'Very High' | 'High' | 'Medium' }> = {
  0: { prelimsMarks: '১২–১৫ নম্বর', mainsMarks: '৩৫–৪০ নম্বর', yield: 'Very High' },
  1: { prelimsMarks: '২৫ নম্বর (পূর্ণাঙ্গ)', mainsMarks: '৫০ নম্বর', yield: 'Very High' },
  2: { prelimsMarks: '১২–১৫ নম্বর', mainsMarks: '৩০–৩৫ নম্বর', yield: 'High' },
  3: { prelimsMarks: '১২ নম্বর', mainsMarks: '২৫–৩০ নম্বর', yield: 'High' },
  4: { prelimsMarks: 'সর্বশেষ ১৫ বছর', mainsMarks: 'বিশ্লেষণসহ উত্তর', yield: 'Very High' },
};

export const SyllabusAccordion: React.FC<SyllabusAccordionProps> = ({
  chapters = DEFAULT_CHAPTERS,
  bookTitle,
  categoryName,
  className = '',
}) => {
  const { isBengali } = useLanguage();
  const list = chapters && chapters.length > 0 ? chapters : DEFAULT_CHAPTERS;

  // Track expanded items (default first 2 open)
  const [expandedIndices, setExpandedIndices] = useState<number[]>([0, 1]);

  const toggleChapter = (index: number) => {
    setExpandedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const isAllExpanded = expandedIndices.length === list.length;

  const handleToggleAll = () => {
    if (isAllExpanded) {
      setExpandedIndices([]);
    } else {
      setExpandedIndices(list.map((_, i) => i));
    }
  };

  return (
    <section
      id="syllabus-guide"
      aria-label="অধ্যায়ভিত্তিক সিলেবাস গাইড ও সূচিপত্র"
      className={`bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 md:p-8 shadow-xs ${className}`}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
              <span>{isBengali ? 'অধ্যায়ভিত্তিক সিলেবাস ও নম্বর বিভাজন' : 'Chapter-wise Syllabus & Paper Weightage'}</span>
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              {isBengali ? `${toBengaliNumerals(list.length)}টি অধ্যায়` : `${list.length} Chapters`}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {isBengali
              ? 'পশ্চিমবঙ্গ পাবলিক সার্ভিস কমিশন ও ২০২৬ সালের হালনাগাদ পাঠ্যক্রম অনুযায়ী সাজানো'
              : 'Strictly aligned with latest 2026 exam pattern & question distribution'}
          </p>
        </div>

        {/* Expand/Collapse All Button */}
        <button
          type="button"
          onClick={handleToggleAll}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 hover:border-amber-400 bg-gray-50 hover:bg-amber-50/60 text-gray-700 hover:text-amber-900 font-semibold text-xs transition-all cursor-pointer self-start sm:self-auto shrink-0"
        >
          <ListOrdered className="w-3.5 h-3.5 text-amber-600" />
          <span>
            {isAllExpanded
              ? (isBengali ? 'সবগুলো বন্ধ করুন' : 'Collapse All')
              : (isBengali ? 'সবগুলো খুলুন' : 'Expand All')}
          </span>
        </button>
      </div>

      {/* Syllabus Assurance Banner */}
      <div className="my-4 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between gap-3 text-xs text-amber-900">
        <div className="flex items-center gap-2 font-medium">
          <GraduationCap className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            {isBengali
              ? '২০২৬ সালের নতুন সিলেবাস ও নম্বর বিভাজন অনুযায়ী ১০০% মেলানো।'
              : '100% verified against revised 2026 exam syllabus guidelines.'}
          </span>
        </div>
        <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>{isBengali ? 'হালনাগাদ সংস্করণ' : 'Updated Edition'}</span>
        </span>
      </div>

      {/* Accordion Items List */}
      <div className="space-y-3">
        {list.map((chapter, idx) => {
          const isOpen = expandedIndices.includes(idx);
          const weightage = CHAPTER_WEIGHTAGES[idx] || {
            prelimsMarks: '১০–১২ নম্বর',
            mainsMarks: '২৫ নম্বর',
            yield: 'High',
          };

          return (
            <div
              key={idx}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? 'border-amber-300 bg-amber-50/20 shadow-2xs'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {/* Accordion Header Trigger */}
              <button
                type="button"
                onClick={() => toggleChapter(idx)}
                aria-expanded={isOpen}
                className="w-full text-left p-4 sm:p-4.5 flex items-start sm:items-center justify-between gap-3 cursor-pointer focus:outline-hidden"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                      {chapter.chapterNumber}
                    </span>

                    {chapter.pageRange && (
                      <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {isBengali ? `পৃঃ ${chapter.pageRange}` : `Pages: ${chapter.pageRange}`}
                      </span>
                    )}

                    {/* Weightage Badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        weightage.yield === 'Very High'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {isBengali ? `প্রিলিমস: ${weightage.prelimsMarks}` : `Prelims: ${weightage.prelimsMarks}`}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-snug">
                    {isBengali ? chapter.titleBn || chapter.title : chapter.title}
                  </h3>

                  {isBengali && chapter.title && chapter.titleBn && chapter.title !== chapter.titleBn && (
                    <p className="text-xs text-gray-500 mt-0.5 italic">
                      {chapter.title}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-amber-200 text-amber-900' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {/* Accordion Content Panel */}
              {isOpen && (
                <div className="px-4 pb-4 pt-1 sm:px-5 sm:pb-5 border-t border-amber-200/50 space-y-3 bg-white/70">
                  {/* Paper Weightage Breakdown Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2">
                    <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between">
                      <span className="text-gray-600 font-medium">
                        {isBengali ? 'প্রিলিমিনারি সম্ভাব্য ওয়েটেজ:' : 'Prelims Weightage:'}
                      </span>
                      <span className="font-bold text-gray-900">
                        {weightage.prelimsMarks}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between">
                      <span className="text-gray-600 font-medium">
                        {isBengali ? 'মেইনস বাধ্যতামূলক পেপার:' : 'Mains Compulsory:'}
                      </span>
                      <span className="font-bold text-gray-900">
                        {weightage.mainsMarks}
                      </span>
                    </div>
                  </div>

                  {/* Topic Checklist */}
                  {chapter.topics && chapter.topics.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                        <span>{isBengali ? 'এই অধ্যায়ের অন্তর্ভুক্ত প্রধান বিষয়বস্তু:' : 'Core Topics Covered:'}</span>
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                        {chapter.topics.map((topic, tIdx) => (
                          <div
                            key={tIdx}
                            className="flex items-start gap-2 p-2 rounded-lg bg-white border border-gray-100 text-xs text-gray-800"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                            <span className="leading-snug">{topic}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
