import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { baseUrl, mcpEnabled, readAccessToken } from "@/lib/mcp/oauth";
import { callTool, listTools, type StaffContext } from "@/lib/mcp/tools";
import type { StaffRole } from "@/lib/types";

/**
 * Stateless MCP server over Streamable HTTP (JSON responses, no SSE), for the Gemini app's
 * custom-app connector and other MCP clients. Auth: OAuth bearer token of an active staff member.
 */

export const dynamic = "force-dynamic";

const PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];
const SERVER_INFO = { name: "mmbookhouse", title: "M.M Book House", version: "1.0.0" };
const INSTRUCTIONS =
  "Tools of M.M Book House, a bookshop in Malda, West Bengal. Use search_books whenever a customer names or shows a book (read title/author/ISBN from the cover), then answer in the customer's language (usually Bengali) with price and stock. Never invent prices, stock or orders.";

type RpcRequest = { jsonrpc: "2.0"; id?: string | number | null; method: string; params?: any };

function unauthorized(request: NextRequest) {
  const base = baseUrl(request.nextUrl.origin);
  return new NextResponse(JSON.stringify({ error: "invalid_token" }), {
    status: 401,
    headers: {
      "Content-Type": "application/json",
      "WWW-Authenticate": `Bearer resource_metadata="${base}/.well-known/oauth-protected-resource/api/mcp", scope="mcp"`,
    },
  });
}

async function staffFor(userId: string): Promise<StaffContext | null> {
  const { data } = await createServiceClient().from("staff_members").select("role, display_name, is_active").eq("user_id", userId).maybeSingle();
  if (!data?.is_active) return null;
  return { userId, role: data.role as StaffRole, name: data.display_name };
}

const result = (id: RpcRequest["id"], value: unknown) => ({ jsonrpc: "2.0", id, result: value });
const rpcError = (id: RpcRequest["id"], code: number, message: string) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });

async function handle(msg: RpcRequest, staff: StaffContext) {
  switch (msg.method) {
    case "initialize": {
      const asked = msg.params?.protocolVersion;
      return result(msg.id, {
        protocolVersion: PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: INSTRUCTIONS,
      });
    }
    case "ping":
      return result(msg.id, {});
    case "tools/list":
      return result(msg.id, { tools: listTools(staff) });
    case "tools/call":
      return result(msg.id, await callTool(String(msg.params?.name ?? ""), msg.params?.arguments, staff));
    case "resources/list":
      return result(msg.id, { resources: [] });
    case "prompts/list":
      return result(msg.id, { prompts: [] });
    default:
      return rpcError(msg.id, -32601, `Method not found: ${msg.method}`);
  }
}

export async function POST(request: NextRequest) {
  if (!mcpEnabled()) return NextResponse.json({ error: "MCP disabled" }, { status: 503 });

  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  const auth = readAccessToken(token);
  if (!auth) return unauthorized(request);
  const staff = await staffFor(auth.userId);
  if (!staff) return unauthorized(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(rpcError(null, -32700, "Parse error"), { status: 400 });
  }

  const batch = Array.isArray(body) ? body : [body];
  const responses = [];
  for (const msg of batch as RpcRequest[]) {
    if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
      responses.push(rpcError((msg as RpcRequest)?.id, -32600, "Invalid request"));
      continue;
    }
    if (msg.id === undefined) continue; // notification (e.g. notifications/initialized)
    responses.push(await handle(msg, staff));
  }

  if (!responses.length) return new NextResponse(null, { status: 202 });
  return NextResponse.json(Array.isArray(body) ? responses : responses[0], { headers: { "Cache-Control": "no-store" } });
}

// No server-initiated stream and no sessions in this stateless server.
export function GET() {
  return new NextResponse(null, { status: 405, headers: { Allow: "POST" } });
}

export function DELETE() {
  return new NextResponse(null, { status: 405, headers: { Allow: "POST" } });
}
