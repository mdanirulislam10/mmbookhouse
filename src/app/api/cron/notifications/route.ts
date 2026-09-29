import { NextResponse, type NextRequest } from "next/server";
import { processQueue } from "@/lib/notify";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Retries queued notifications. Vercel Cron calls this with `Authorization: Bearer $CRON_SECRET`. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  return NextResponse.json(await processQueue(100));
}
