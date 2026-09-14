/**
 * Module 17: Review Moderation, Profanity Filter & Abuse Quarantine Service
 * M.M Book House Malda - E-Commerce Platform
 * 
 * Implements architectural specifications from proposed_modules.md:
 * - Item 10: Auto-publishing with automated AI/Regex profanity filter & moderation queue
 * - Item 18: 1-Click community abuse report & auto-quarantine threshold (3+ flags)
 * - Item 28: Anti-spam contact info & external link sanitization
 * - Item 41: Review bombing detection algorithm for negative spikes
 */

import { ReviewStatus } from '@/types/reviews';
import { PHONE_NUMBER_REGEX, EXTERNAL_URL_REGEX } from '@/lib/validations/reviews';

// Bilingual profanity word list (Bengali & English)
const BANNED_TERMS = [
  // English common offensive terms
  'scam',
  'fraud',
  'cheat',
  'bastard',
  'idiot',
  'fake product',
  'thief',
  'harami',
  'fuck',
  'bullshit',
  // Bengali slang & abusive terms
  'শালা',
  'হারামি',
  'চোর',
  'প্রতারক',
  'জোচ্চোর',
  'দালাল',
  'বদমাইশ',
  'কুত্তা',
  'শুয়োর',
];

export interface ProfanityCheckResult {
  hasProfanity: boolean;
  flaggedTerms: string[];
}

export interface SanitizationResult {
  isClean: boolean;
  hasContactInfo: boolean;
  hasLinks: boolean;
  sanitizedText: string;
  rejectionReasons: string[];
  rejectionReasonsBn: string[];
}

export interface AbuseReportResult {
  newReportCount: number;
  shouldQuarantine: boolean;
  newStatus: ReviewStatus;
  messageEn: string;
  messageBn: string;
}

export interface ReviewBombingCheckResult {
  isBombingSuspicious: boolean;
  quarantineRecommended: boolean;
  spikeRatio: number;
  reasonEn?: string;
  reasonBn?: string;
}

/**
 * Checks text content for profanity or offensive terms in Bengali and English (Item 10)
 */
export function checkProfanity(text: string): ProfanityCheckResult {
  if (!text) return { hasProfanity: false, flaggedTerms: [] };

  const lower = text.toLowerCase();
  const flaggedTerms: string[] = [];

  for (const term of BANNED_TERMS) {
    if (lower.includes(term.toLowerCase())) {
      flaggedTerms.push(term);
    }
  }

  return {
    hasProfanity: flaggedTerms.length > 0,
    flaggedTerms,
  };
}

/**
 * Sanitizes and detects phone numbers, WhatsApp numbers, and external links (Item 28)
 */
export function sanitizeReviewContent(text: string): SanitizationResult {
  if (!text) {
    return {
      isClean: true,
      hasContactInfo: false,
      hasLinks: false,
      sanitizedText: '',
      rejectionReasons: [],
      rejectionReasonsBn: [],
    };
  }

  const hasPhone = PHONE_NUMBER_REGEX.test(text);
  const hasLinks = EXTERNAL_URL_REGEX.test(text);

  const rejectionReasons: string[] = [];
  const rejectionReasonsBn: string[] = [];

  if (hasPhone) {
    rejectionReasons.push('Review contains personal phone numbers or contact details.');
    rejectionReasonsBn.push('রিভিউতে ব্যক্তিগত ফোন নম্বর বা যোগাযোগের তথ্য প্রদান করা নিষিদ্ধ।');
  }

  if (hasLinks) {
    rejectionReasons.push('Review contains unauthorized external promotional links.');
    rejectionReasonsBn.push('রিভিউতে কোনো বহিরাগত প্রমোশনাল লিংক অনুমোদন করা হয় না।');
  }

  // Mask phone numbers if sanitizing
  let sanitizedText = text;
  if (hasPhone) {
    sanitizedText = sanitizedText.replace(PHONE_NUMBER_REGEX, '[PHONE PROTECTED]');
  }
  if (hasLinks) {
    sanitizedText = sanitizedText.replace(EXTERNAL_URL_REGEX, '[LINK REMOVED]');
  }

  return {
    isClean: !hasPhone && !hasLinks,
    hasContactInfo: hasPhone,
    hasLinks,
    sanitizedText,
    rejectionReasons,
    rejectionReasonsBn,
  };
}

/**
 * Determines review moderation status upon submission (Item 10)
 * Returns 'flagged_for_review' if profanity is detected, otherwise 'approved'.
 */
export function determineInitialReviewStatus(params: {
  headline: string;
  body: string;
}): {
  status: ReviewStatus;
  isFlagged: boolean;
  matchedProfanities: string[];
} {
  const checkHeadline = checkProfanity(params.headline);
  const checkBody = checkProfanity(params.body);

  const allFlagged = Array.from(new Set([...checkHeadline.flaggedTerms, ...checkBody.flaggedTerms]));

  if (allFlagged.length > 0) {
    return {
      status: 'flagged_for_review',
      isFlagged: true,
      matchedProfanities: allFlagged,
    };
  }

  return {
    status: 'approved',
    isFlagged: false,
    matchedProfanities: [],
  };
}

/**
 * Processes community abuse reports and auto-quarantines after 3+ reports (Item 18)
 */
export function processAbuseReport(
  currentReportCount: number,
  threshold: number = 3
): AbuseReportResult {
  const newCount = currentReportCount + 1;
  const shouldQuarantine = newCount >= threshold;

  return {
    newReportCount: newCount,
    shouldQuarantine,
    newStatus: shouldQuarantine ? 'flagged_for_review' : 'approved',
    messageEn: shouldQuarantine
      ? 'Review has reached the community reporting threshold and has been temporarily quarantined for moderator review.'
      : 'Thank you for reporting. This review will be investigated by our moderation team.',
    messageBn: shouldQuarantine
      ? 'রিভিউটি একাধিক ব্যবহারকারী দ্বারা রিপোর্ট করায় সাময়িকভাবে স্থগিত করা হয়েছে এবং মডারেশন কিউতে পাঠানো হয়েছে।'
      : 'রিপোর্ট করার জন্য ধন্যবাদ। আমাদের টিম এটি পর্যালোচনা করবে।',
  };
}

/**
 * Review Bombing Detection Algorithm (Item 41)
 * Flags abnormal spikes in negative (1-star) reviews within a rolling 24-hour window.
 */
export function detectReviewBombing(params: {
  negativeReviewsLast24h: number;
  historicalDailyAverage: number;
}): ReviewBombingCheckResult {
  const { negativeReviewsLast24h, historicalDailyAverage } = params;
  const safeAvg = Math.max(1, historicalDailyAverage);
  const spikeRatio = negativeReviewsLast24h / safeAvg;

  // If negative reviews in 24 hours exceed 3x normal velocity and count >= 5
  const isBombing = spikeRatio >= 3.0 && negativeReviewsLast24h >= 5;

  return {
    isBombingSuspicious: isBombing,
    quarantineRecommended: isBombing,
    spikeRatio: Number(spikeRatio.toFixed(2)),
    reasonEn: isBombing
      ? `Abnormal spike in negative reviews detected (${spikeRatio.toFixed(1)}x normal rate). Automated quarantine recommended.`
      : undefined,
    reasonBn: isBombing
      ? `অস্বাভাবিক নেতিবাচক রিভিউর বৃদ্ধি ধরা পড়েছে (স্বাভাবিকের চেয়ে ${spikeRatio.toFixed(1)} গুণ বেশি)। ম্যানুয়াল রিভিউ বাঞ্ছনীয়।`
      : undefined,
  };
}
