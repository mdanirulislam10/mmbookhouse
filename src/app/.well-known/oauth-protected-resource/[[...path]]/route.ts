import { NextResponse, type NextRequest } from "next/server";
import { baseUrl, protectedResourceMetadata } from "@/lib/mcp/oauth";

export const dynamic = "force-dynamic";

// Served at /.well-known/oauth-protected-resource and /.well-known/oauth-protected-resource/api/mcp.
export function GET(request: NextRequest) {
  return NextResponse.json(protectedResourceMetadata(baseUrl(request.nextUrl.origin)), { headers: { "Access-Control-Allow-Origin": "*" } });
}
