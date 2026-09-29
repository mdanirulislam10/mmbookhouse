import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const ADMIN_IDLE_MS = 2 * 60 * 60 * 1000; // sign staff out after 2 idle hours
const ADMIN_SEEN_COOKIE = "mm_admin_seen";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, user } = await updateSession(request);

  // Signed-in area guards (cheap redirect; pages re-check on the server).
  const needsLogin = ["/account", "/checkout", "/orders", "/wishlist"].some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (needsLogin && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    const seen = Number(request.cookies.get(ADMIN_SEEN_COOKIE)?.value ?? 0);
    if (seen && Date.now() - seen > ADMIN_IDLE_MS) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "?expired=1";
      const redirect = NextResponse.redirect(url);
      redirect.cookies.delete(ADMIN_SEEN_COOKIE);
      return redirect;
    }
    response.cookies.set(ADMIN_SEEN_COOKIE, String(Date.now()), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/admin", maxAge: 60 * 60 * 24 });
  }

  if (pathname.startsWith("/admin")) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest|sw.js|.*\.(?:png|jpg|jpeg|svg|webp|gif|ico)$).*)"],
};
