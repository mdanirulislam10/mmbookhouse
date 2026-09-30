import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { issueClientId, mcpEnabled, MCP_SCOPE, redirectAllowed } from "@/lib/mcp/oauth";

export const dynamic = "force-dynamic";

const body = z.object({
  redirect_uris: z.array(z.string().url()).min(1).max(5),
  client_name: z.string().max(120).optional(),
});

/** RFC 7591 dynamic client registration. Only known redirect targets (Gemini's relay, loopback) are accepted. */
export async function POST(request: NextRequest) {
  if (!mcpEnabled()) return NextResponse.json({ error: "temporarily_unavailable" }, { status: 503 });
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_client_metadata" }, { status: 400 });
  const bad = parsed.data.redirect_uris.find((u) => !redirectAllowed(u));
  if (bad) return NextResponse.json({ error: "invalid_redirect_uri", error_description: `Redirect URI not allowed: ${bad}` }, { status: 400 });

  const clientId = issueClientId(parsed.data);
  return NextResponse.json(
    {
      client_id: clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_name: parsed.data.client_name,
      redirect_uris: parsed.data.redirect_uris,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      scope: MCP_SCOPE,
    },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
