import { NextResponse, type NextRequest } from "next/server";
import { authServerMetadata, baseUrl } from "@/lib/mcp/oauth";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  return NextResponse.json(authServerMetadata(baseUrl(request.nextUrl.origin)), { headers: { "Access-Control-Allow-Origin": "*" } });
}
