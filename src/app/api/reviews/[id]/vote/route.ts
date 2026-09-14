import { NextRequest, NextResponse } from 'next/server';
import { voteReviewSchema } from '@/lib/validations/reviews';
import { validateHelpfulVoteEligibility } from '@/lib/services/reviewEligibilityService';
import { processAbuseReport } from '@/lib/services/reviewModerationService';

// In-memory vote & review tracker for API operations
const reviewVotesStore = new Map<string, Set<string>>();
const reviewStatsStore = new Map<string, { helpful_count: number; author_id: string; reports_count: number; status: string }>();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params;
    const body = await request.json();

    const parsed = voteReviewSchema.safeParse({
      ...body,
      review_id: reviewId,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation Error', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const userId = body.user_id || 'anonymous_user';
    const { vote_type } = parsed.data;

    let stat = reviewStatsStore.get(reviewId);
    if (!stat) {
      stat = {
        helpful_count: 0,
        author_id: body.review_author_id || 'other_user',
        reports_count: 0,
        status: 'approved',
      };
      reviewStatsStore.set(reviewId, stat);
    }

    if (vote_type === 'helpful') {
      const voters = reviewVotesStore.get(reviewId) || new Set<string>();
      const previousVotesList = Array.from(voters).map((voterId) => ({
        review_id: reviewId,
        user_id: voterId,
        vote_type: 'helpful' as const,
        created_at: new Date().toISOString(),
      }));

      // Item 15 & 16: Check self-vote lock & duplicate voting
      const eligibility = validateHelpfulVoteEligibility({
        review: { id: reviewId, user_id: stat.author_id } as any,
        votingUserId: userId,
        previousVotes: previousVotesList,
      });

      if (!eligibility.allowed) {
        return NextResponse.json(
          { success: false, error: eligibility.reason },
          { status: 403 }
        );
      }

      voters.add(userId);
      reviewVotesStore.set(reviewId, voters);
      stat.helpful_count += 1;

      return NextResponse.json({
        success: true,
        data: {
          helpful_votes_count: stat.helpful_count,
        },
        message: 'ভোট সফলভাবে নথিভুক্ত হয়েছে।',
      });
    }

    if (vote_type === 'report_abuse') {
      // Item 10 & 18: Process community abuse report & auto-quarantine threshold
      const abuseResult = processAbuseReport(stat.reports_count);

      stat.reports_count = abuseResult.newReportCount;
      stat.status = abuseResult.newStatus;

      return NextResponse.json({
        success: true,
        data: {
          ...abuseResult,
          is_auto_quarantined: abuseResult.shouldQuarantine,
        },
        message: abuseResult.shouldQuarantine
          ? 'একাধিক রিপোর্টের কারণে রিভিউটি সাময়িকভাবে সরিয়ে নেওয়া হয়েছে।'
          : 'আপনার রিপোর্ট সফলভাবে গৃহীত হয়েছে। অ্যাডমিন পর্যালোচনা করবেন।',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid vote type' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Vote processing failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
