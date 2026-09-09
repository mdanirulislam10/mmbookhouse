import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Task 17: On-Demand Cache Invalidation Endpoint (ISR Webhook)
 * Triggers instant cache refresh when categories are added or updated in Supabase Admin.
 */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tag = searchParams.get('tag');
    const path = searchParams.get('path');
    const secret = searchParams.get('secret');

    // Secret check for security (reject missing or mismatched secret)
    const expectedSecret = process.env.REVALIDATION_SECRET || 'mm-book-house-revalidate-secret';
    if (!secret || secret !== expectedSecret) {
      return NextResponse.json({ message: 'Unauthorized / Invalid secret token' }, { status: 401 });
    }

    if (tag) {
      revalidateTag(tag);
      return NextResponse.json({ revalidated: true, tag, now: Date.now() });
    }

    if (path) {
      revalidatePath(path);
      return NextResponse.json({ revalidated: true, path, now: Date.now() });
    }

    // Default: revalidate categories
    revalidatePath('/api/categories');
    return NextResponse.json({ revalidated: true, path: '/api/categories', now: Date.now() });
  } catch (err) {
    return NextResponse.json(
      { message: 'Error revalidating', error: err instanceof Error ? err.message : 'Unknown' },
      { status: 500 }
    );
  }
}
