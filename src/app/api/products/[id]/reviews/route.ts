import { NextRequest, NextResponse } from 'next/server';
import { submitReviewSchema } from '@/lib/validations/reviews';
import {
  calculateRatingDistribution,
  extractReviewKeywordHighlights,
  generateReviewSchemaJsonLd,
} from '@/lib/services/reviewAggregatorService';
import {
  sanitizeReviewContent,
  determineInitialReviewStatus,
} from '@/lib/services/reviewModerationService';
import { ProductReview, ReviewSortOption } from '@/types/reviews';

// In-memory mock store for demo & testing
const globalReviewsMap = new Map<string, ProductReview[]>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const { searchParams } = new URL(request.url);

    const sort = (searchParams.get('sort') || 'top_reviews') as ReviewSortOption;
    const starFilter = searchParams.get('star');
    const keywordFilter = searchParams.get('keyword');
    const verifiedOnly = searchParams.get('verified_only') === 'true';

    const allProductReviews = globalReviewsMap.get(productId) || [];

    // Filter approved reviews for public consumption
    let filtered = allProductReviews.filter((r) => r.status === 'approved');

    if (starFilter) {
      const star = parseInt(starFilter, 10);
      if (!isNaN(star)) {
        filtered = filtered.filter((r) => Math.round(r.rating) === star);
      }
    }

    if (verifiedOnly) {
      filtered = filtered.filter((r) => r.is_verified_purchase);
    }

    if (keywordFilter) {
      const kw = keywordFilter.toLowerCase();
      filtered = filtered.filter(
        (r) => r.headline.toLowerCase().includes(kw) || r.body.toLowerCase().includes(kw)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sort === 'top_reviews') return b.helpful_votes_count - a.helpful_votes_count;
      if (sort === 'most_recent') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === 'highest_rating') return b.rating - a.rating;
      if (sort === 'lowest_rating') return a.rating - b.rating;
      return 0;
    });

    const summary = calculateRatingDistribution(allProductReviews);
    const keywordHighlights = extractReviewKeywordHighlights(allProductReviews);
    const schemaJsonLd = generateReviewSchemaJsonLd(
      { id: productId, title: `Product ${productId}` },
      summary,
      filtered
    );

    return NextResponse.json({
      success: true,
      data: {
        summary,
        keyword_highlights: keywordHighlights,
        reviews: filtered,
        schema_org: schemaJsonLd,
        total: filtered.length,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch reviews';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const body = await request.json();

    // Item 10 & 28: Content Sanitization & Profanity Filtering
    const sanitizedHeadline = body.headline ? sanitizeReviewContent(body.headline).sanitizedText : '';
    const sanitizedBody = body.body ? sanitizeReviewContent(body.body).sanitizedText : '';

    const parsed = submitReviewSchema.safeParse({
      ...body,
      headline: sanitizedHeadline,
      body: sanitizedBody,
      product_id: productId,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error',
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const {
      rating,
      headline,
      body: reviewBody,
      aspect_ratings,
      photos,
      would_recommend,
      topper_badge,
      order_id,
    } = parsed.data;

    const initialStatus = determineInitialReviewStatus({
      headline: sanitizedHeadline,
      body: sanitizedBody,
    }).status;

    const isVerifiedPurchase = Boolean(order_id);

    const newReview: ProductReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      product_id: productId,
      user_id: body.user_id || 'guest-user',
      user_name: body.user_name || 'Anonymous Reader',
      user_location: body.user_location || 'Malda',
      rating,
      headline: sanitizedHeadline,
      body: sanitizedBody,
      aspect_ratings,
      photos: (photos || []).map((p, idx) =>
        typeof p === 'string'
          ? { id: `p-${idx}`, url: p, uploaded_at: new Date().toISOString() }
          : { ...p, id: p.id || `p-${idx}`, uploaded_at: p.uploaded_at || new Date().toISOString() }
      ),
      is_verified_purchase: isVerifiedPurchase,
      would_recommend: would_recommend ?? true,
      topper_badge,
      helpful_votes_count: 0,
      status: initialStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const currentList = globalReviewsMap.get(productId) || [];
    currentList.unshift(newReview);
    globalReviewsMap.set(productId, currentList);

    return NextResponse.json({
      success: true,
      data: newReview,
      message:
        initialStatus === 'approved'
          ? 'আপনার রিভিউ সফলভাবে প্রকাশিত হয়েছে।'
          : 'আপনার রিভিউটি পর্যালোচনার জন্য জমা রাখা হয়েছে।',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to submit review';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
