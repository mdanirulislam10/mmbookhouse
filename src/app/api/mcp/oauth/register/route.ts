import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { clientSecretFor, issueClientId, mcpEnabled, MCP_SCOPE, redirectAllowed } from "@/lib/mcp/oauth";

export const dynamic = "force-dynamic";

const body = z.object({
  redirect_uris: z.array(z.string()).min(1).max(10),
  client_name: z.string().optional(),
  token_endpoint_auth_method: z.string().optional(),
});

/** RFC 7591 dynamic client registration. Only known redirect targets (Gemini's relay, loopback) are kept. */
export async function POST(request: NextRequest) {
  if (!mcpEnabled()) return NextResponse.json({ error: "temporarily_unavailable" }, { status: 503 });
  const raw = await request.json().catch(() => null);
  const parsed = body.safeParse(raw);
  if (!parsed.success) {
    console.warn("[mcp] register rejected:", JSON.stringify(raw)?.slice(0, 500));
    return NextResponse.json({ error: "invalid_client_metadata" }, { status: 400 });
  }
  const redirectUris = parsed.data.redirect_uris.filter(redirectAllowed);
  if (!redirectUris.length) {
    console.warn("[mcp] register: no allowed redirect uri in", parsed.data.redirect_uris);
    return NextResponse.json({ error: "invalid_redirect_uri", error_description: "Redirect URI not allowed" }, { status: 400 });
  }

  console.info("[mcp] register:", JSON.stringify({ method: parsed.data.token_endpoint_auth_method, uris: parsed.data.redirect_uris, keys: Object.keys(raw ?? {}) }));
  const clientName = parsed.data.client_name?.slice(0, 120);
  const clientId = issueClientId({ redirect_uris: redirectUris, client_name: clientName });
  const method = parsed.data.token_endpoint_auth_method ?? "none";
  const confidential = method === "client_secret_basic" || method === "client_secret_post";
  return NextResponse.json(
    {
      client_id: clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      ...(confidential ? { client_secret: clientSecretFor(clientId), client_secret_expires_at: 0 } : {}),
      client_name: clientName,
      redirect_uris: redirectUris,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: confidential ? method : "none",
      scope: `${MCP_SCOPE} offline_access`,
    },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
