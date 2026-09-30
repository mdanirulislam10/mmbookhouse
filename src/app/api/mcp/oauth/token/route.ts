import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { clientSecretValid, issueTokens, mcpEnabled, readClientId, readRefreshToken, redeemCode } from "@/lib/mcp/oauth";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store", Pragma: "no-cache" };

function oauthError(error: string, description?: string, status = 400) {
  return NextResponse.json({ error, error_description: description }, { status, headers: noStore });
}

async function isActiveStaff(userId: string) {
  const { data } = await createServiceClient().from("staff_members").select("is_active").eq("user_id", userId).maybeSingle();
  return Boolean(data?.is_active);
}

/** Token endpoint: authorization_code (with PKCE) and refresh_token grants. */
export async function POST(request: NextRequest) {
  if (!mcpEnabled()) return oauthError("temporarily_unavailable", undefined, 503);

  const type = request.headers.get("content-type") ?? "";
  const raw = type.includes("application/json") ? await request.json().catch(() => ({})) : Object.fromEntries((await request.formData().catch(() => new FormData())).entries());
  const p = raw as Record<string, string | undefined>;

  // Client auth: client_secret_basic header, client_secret_post fields, or a public client (id only, PKCE).
  let clientId = p.client_id;
  let clientSecret = p.client_secret;
  const basic = request.headers.get("authorization")?.match(/^Basic\s+(.+)$/i)?.[1];
  if (basic) {
    const decoded = Buffer.from(basic, "base64").toString("utf8");
    const i = decoded.indexOf(":");
    clientId = decodeURIComponent(i >= 0 ? decoded.slice(0, i) : decoded);
    clientSecret = i >= 0 ? decodeURIComponent(decoded.slice(i + 1)) : undefined;
  }
  if (!clientId || !readClientId(clientId)) return oauthError("invalid_client", "Unknown client", 401);
  if (clientSecret && !clientSecretValid(clientId, clientSecret)) return oauthError("invalid_client", "Bad client secret", 401);

  let userId: string | null = null;
  if (p.grant_type === "authorization_code") {
    if (!p.code) return oauthError("invalid_request", "code is required");
    userId = redeemCode(p.code, clientId, p.redirect_uri ?? null, p.code_verifier, Boolean(clientSecret));
    if (!userId) return oauthError("invalid_grant", "Invalid or expired code");
  } else if (p.grant_type === "refresh_token") {
    userId = readRefreshToken(p.refresh_token, clientId);
    if (!userId) return oauthError("invalid_grant", "Invalid or expired refresh token");
  } else {
    return oauthError("unsupported_grant_type");
  }

  if (!(await isActiveStaff(userId))) return oauthError("invalid_grant", "This account is no longer active staff");
  return NextResponse.json(issueTokens(userId, clientId), { headers: noStore });
}
