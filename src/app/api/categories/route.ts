import { NextResponse } from 'next/server';
import { fetchCategoryTree } from '@/lib/supabase/categories';

export const revalidate = 3600; // 1 Hour ISR Cache

/**
 * Task 17: Next.js ISR & Tag-cached Category Tree API Endpoint
 * Provides high-speed, cached category hierarchy for the Mega Drawer.
 */
export async function GET() {
  try {
    const categories = await fetchCategoryTree();

    return NextResponse.json(
      {
        success: true,
        data: categories,
        cachedAt: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch categories',
      },
      { status: 500 }
    );
  }
}
