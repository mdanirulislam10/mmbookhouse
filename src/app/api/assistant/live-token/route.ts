import { NextResponse, type NextRequest } from "next/server";
import { Behavior, GoogleGenAI, Modality, type LiveConnectConfig } from "@google/genai";
import { z } from "zod";
import { assistantEnabled, systemInstruction } from "@/lib/assistant/chat";
import { functionDeclarations } from "@/lib/assistant/tools";
import { getSessionUser } from "@/lib/data/session";
import { createServiceClient } from "@/lib/supabase/admin";
import { publicEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

const LIVE_MODEL = process.env.GEMINI_LIVE_MODEL || "gemini-3.8-live";
const body = z.object({ resumeHandle: z.string().max(4096).optional() });

/**
 * Mints a single-use, short-lived Gemini Live token for the browser, with the whole session
 * config (model, instructions, tools) locked in, so the API key never reaches the client.
 */
export async function POST(request: NextRequest) {
  if (!assistantEnabled()) return NextResponse.json({ error: "AI_DISABLED" }, { status: 503 });
  const origin = request.headers.get("origin")?.replace(/\/$/, "");
  if (!origin || (origin !== publicEnv.siteUrl && origin !== request.nextUrl.origin)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const parsed = body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const user = await getSessionUser();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const { data: ok } = await createServiceClient().rpc("hit_rate_limit", { p_key: `assistant-live:${user?.id ?? ip}`, p_max: 10, p_window_seconds: 1800, p_block_seconds: 0 });
  if (ok === false) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });

  const config: LiveConnectConfig = {
    responseModalities: [Modality.AUDIO],
    systemInstruction: { parts: [{ text: await systemInstruction("voice") }] },
    tools: [{ functionDeclarations: functionDeclarations.map((f) => ({ ...f, behavior: Behavior.NON_BLOCKING })) }],
    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: process.env.GEMINI_LIVE_VOICE || "Kore" } } },
    inputAudioTranscription: {},
    outputAudioTranscription: {},
    contextWindowCompression: { slidingWindow: {} }, // audio+video sessions otherwise stop after ~2 minutes
    sessionResumption: parsed.data.resumeHandle ? { handle: parsed.data.resumeHandle } : {},
  };

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY!, httpOptions: { apiVersion: "v1alpha" } });
    const now = Date.now();
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(now + 30 * 60 * 1000).toISOString(),
        newSessionExpireTime: new Date(now + 60 * 1000).toISOString(),
        liveConnectConstraints: { model: LIVE_MODEL, config },
        lockAdditionalFields: [],
      },
    });
    return NextResponse.json({ token: token.name, model: LIVE_MODEL, config }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[assistant] live token:", msg.slice(0, 400));
    return NextResponse.json({ error: /429|quota|RESOURCE_EXHAUSTED/i.test(msg) ? "AI_BUSY" : "AI_UNAVAILABLE" }, { status: 502 });
  }
}
