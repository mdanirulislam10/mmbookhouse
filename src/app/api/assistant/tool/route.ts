import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { assistantEnabled } from "@/lib/assistant/chat";
import { runTool, type ToolEffects } from "@/lib/assistant/tools";
import { publicEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

const body = z.object({ name: z.string().max(64), args: z.record(z.string(), z.unknown()).optional() });

/** Runs one tool call from a Gemini Live voice session with the visitor's own session (RLS applies). */
export async function POST(request: NextRequest) {
  if (!assistantEnabled()) return NextResponse.json({ error: "AI_DISABLED" }, { status: 503 });
  const origin = request.headers.get("origin")?.replace(/\/$/, "");
  if (!origin || (origin !== publicEnv.siteUrl && origin !== request.nextUrl.origin)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const effects: ToolEffects = {};
  try {
    const result = await runTool(parsed.data.name, parsed.data.args ?? {}, effects);
    return NextResponse.json({ result, effects }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error(`[assistant] tool ${parsed.data.name}:`, err instanceof Error ? err.message : err);
    return NextResponse.json({ result: { error: "TOOL_FAILED" }, effects });
  }
}
