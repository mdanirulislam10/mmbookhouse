import { NextResponse, type NextRequest } from "next/server";
import { landingPath } from "@/lib/auth/landing";
import { safeNext } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** After a sign-in in the browser: sends partners to their panel, everyone else to `next`. */
export async function GET(request: NextRequest) {
  const next = safeNext(request.nextUrl.searchParams.get("next"), "/account");
  return NextResponse.redirect(new URL(await landingPath(next), request.nextUrl.origin));
}
