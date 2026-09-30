import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { publicEnv } from "@/lib/env";

/**
 * Minimal, stateless OAuth 2.1 server for the store's MCP endpoint (used by the Gemini app's
 * "custom app" connector). Client ids, authorization codes and tokens are HMAC-signed blobs, so
 * no database tables are needed. Rotating MCP_OAUTH_SECRET revokes every client and token.
 */

export const MCP_SCOPE = "mcp";
export const ACCESS_TTL_S = 60 * 60; // 1 hour
export const REFRESH_TTL_S = 60 * 60 * 24 * 60; // 60 days
const CODE_TTL_S = 5 * 60;

type Kind = "client" | "code" | "access" | "refresh";

export function mcpEnabled(): boolean {
  return (process.env.MCP_OAUTH_SECRET ?? "").length >= 32;
}

function secret(): string {
  const s = process.env.MCP_OAUTH_SECRET ?? "";
  if (s.length < 32) throw new Error("MCP_OAUTH_SECRET must be at least 32 characters");
  return s;
}

const b64 = (buf: Buffer | string) => Buffer.from(buf).toString("base64url");

function sign(kind: Kind, payload: Record<string, unknown>, ttlSeconds?: number): string {
  const body = b64(JSON.stringify({ ...payload, k: kind, ...(ttlSeconds ? { exp: Math.floor(Date.now() / 1000) + ttlSeconds } : {}) }));
  const mac = createHmac("sha256", secret()).update(`${kind}.${body}`).digest("base64url");
  return `${body}.${mac}`;
}

function verify<T extends Record<string, unknown>>(kind: Kind, token: string | null | undefined): T | null {
  if (!token || token.length > 8192) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = createHmac("sha256", secret()).update(`${kind}.${body}`).digest();
  const given = Buffer.from(mac, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T & { k?: string; exp?: number };
    if (data.k !== kind) return null;
    if (data.exp && data.exp < Date.now() / 1000) return null;
    return data;
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------- urls */

export function baseUrl(requestOrigin: string): string {
  return process.env.NEXT_PUBLIC_SITE_URL ? publicEnv.siteUrl : requestOrigin.replace(/\/$/, "");
}

export function resourceUrl(base: string) {
  return `${base}/api/mcp`;
}

export function authServerMetadata(base: string) {
  return {
    issuer: base,
    authorization_endpoint: `${base}/oauth/authorize`,
    token_endpoint: `${base}/api/mcp/oauth/token`,
    registration_endpoint: `${base}/api/mcp/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_basic", "client_secret_post"],
    scopes_supported: [MCP_SCOPE, "offline_access"],
  };
}

export function protectedResourceMetadata(base: string) {
  return {
    resource: resourceUrl(base),
    authorization_servers: [base],
    scopes_supported: [MCP_SCOPE],
    bearer_methods_supported: ["header"],
    resource_name: "mmbookhouse store tools",
  };
}

/* ------------------------------------------------------------- clients */

/** Gemini's OAuth relay, plus loopback redirects for desktop clients such as Gemini CLI. */
export function redirectAllowed(uri: string): boolean {
  let u: URL;
  try {
    u = new URL(uri);
  } catch {
    return false;
  }
  if (u.protocol === "https:" && u.hostname === "oauth-redirect.googleusercontent.com" && u.pathname.startsWith("/r/user_bound_custom-mcp-")) return true;
  if (u.protocol === "http:" && (u.hostname === "localhost" || u.hostname === "127.0.0.1")) return true;
  const extra = (process.env.MCP_EXTRA_REDIRECT_PREFIXES ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return extra.some((p) => uri.startsWith(p));
}

export interface ClientInfo {
  redirect_uris: string[];
  client_name?: string;
}

export function issueClientId(info: ClientInfo): string {
  return sign("client", { r: info.redirect_uris, n: info.client_name ?? null });
}

export function readClientId(clientId: string | null | undefined): ClientInfo | null {
  const d = verify<{ r: string[]; n: string | null }>("client", clientId);
  return d ? { redirect_uris: d.r, client_name: d.n ?? undefined } : null;
}

/** Secret for clients that register as confidential (Gemini asks for client_secret_basic); derived, not stored. */
export function clientSecretFor(clientId: string): string {
  return createHmac("sha256", secret()).update(`client-secret.${clientId}`).digest("base64url");
}

export function clientSecretValid(clientId: string, given: string): boolean {
  const a = Buffer.from(clientSecretFor(clientId));
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

/* --------------------------------------------------------------- codes */

interface CodeData {
  uid: string;
  cid: string;
  ru: string;
  cc: string | null;
}

export function issueCode(data: { userId: string; clientId: string; redirectUri: string; codeChallenge: string | null }): string {
  return sign("code", { uid: data.userId, cid: data.clientId, ru: data.redirectUri, cc: data.codeChallenge }, CODE_TTL_S);
}

/** PKCE is checked when the code has a challenge; codes without one need an authenticated (secret) client. */
export function redeemCode(code: string, clientId: string, redirectUri: string | null, verifier: string | undefined, clientAuthenticated: boolean): string | null {
  const d = verify<CodeData & Record<string, unknown>>("code", code);
  if (!d || d.cid !== clientId) return null;
  if (redirectUri && redirectUri !== d.ru) return null;
  if (d.cc) {
    if (!verifier || createHash("sha256").update(verifier).digest("base64url") !== d.cc) return null;
  } else if (!clientAuthenticated) {
    return null;
  }
  return d.uid;
}

/* -------------------------------------------------------------- tokens */

export function issueTokens(userId: string, clientId: string) {
  return {
    access_token: sign("access", { uid: userId, cid: clientId }, ACCESS_TTL_S),
    refresh_token: sign("refresh", { uid: userId, cid: clientId }, REFRESH_TTL_S),
    token_type: "Bearer",
    expires_in: ACCESS_TTL_S,
    scope: MCP_SCOPE,
  };
}

export function readAccessToken(token: string | null | undefined): { userId: string } | null {
  const d = verify<{ uid: string }>("access", token);
  return d ? { userId: d.uid } : null;
}

export function readRefreshToken(token: string | null | undefined, clientId: string): string | null {
  const d = verify<{ uid: string; cid: string }>("refresh", token);
  return d && d.cid === clientId ? d.uid : null;
}
