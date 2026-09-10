import { NextRequest, NextResponse } from 'next/server';
import { getBookPdpMetrics } from '@/lib/services/pdpMetricsService';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/books/[slug]/metrics
 * Fetches genuine real-time DB metrics & sales social proof for a book.
 * Edge-cached with SWR to ensure high performance and zero server overload.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { slug } = await context.params;

    if (!slug) {
      return NextResponse.json(
        { error: 'Book slug or ID is required' },
        { status: 400 }
      );
    }

    const metrics = await getBookPdpMetrics(slug);

    return NextResponse.json(metrics, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Failed to retrieve PDP metrics:', error);
    return NextResponse.json(
      { error: 'Internal Server Error while computing metrics' },
      { status: 500 }
    );
  }
}
