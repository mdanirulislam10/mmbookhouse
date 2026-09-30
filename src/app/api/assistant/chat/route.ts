import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { assistantEnabled, runChat } from "@/lib/assistant/chat";
import { getSessionUser } from "@/lib/data/session";
import { createServiceClient } from "@/lib/supabase/admin";
import { publicEnv } from "@/lib/env";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const body = z.object({
  message: z.string().trim().max(1000),
  history: z
    .array(z.object({ role: z.enum(["user", "model"]), text: z.string().max(4000) }))
    .max(30)
    .default([]),
  image: z
    .object({ mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]), data: z.string().max(2_000_000).regex(/^[A-Za-z0-9+/=]+$/) })
    .optional(),
});

async function allowed(key: string): Promise<boolean> {
  const { data, error } = await createServiceClient().rpc("hit_rate_limit", { p_key: key, p_max: 30, p_window_seconds: 600, p_block_seconds: 0 });
  if (error) {
    console.error("[assistant] rate limit:", error.message);
    return true;
  }
  return data !== false;
}

export async function POST(request: NextRequest) {
  if (!assistantEnabled()) return NextResponse.json({ error: "AI_DISABLED" }, { status: 503 });
  const origin = request.headers.get("origin")?.replace(/\/$/, "");
  if (!origin || (origin !== publicEnv.siteUrl && origin !== request.nextUrl.origin)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (!parsed.data.message && !parsed.data.image)) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const user = await getSessionUser();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!(await allowed(`assistant:${user?.id ?? ip}`))) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });

  // Keep the history short: the latest turns, starting with a user turn.
  let history = parsed.data.history.slice(-16);
  while (history.length && history[0].role !== "user") history = history.slice(1);

  try {
    const { reply, effects } = await runChat(history, parsed.data.message, parsed.data.image);
    return NextResponse.json({ reply, ...effects }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[assistant] chat:", msg.slice(0, 500));
    const busy = /429|RESOURCE_EXHAUSTED|quota/i.test(msg);
    return NextResponse.json({ error: busy ? "AI_BUSY" : "AI_UNAVAILABLE" }, { status: busy ? 429 : 502 });
  }
}
