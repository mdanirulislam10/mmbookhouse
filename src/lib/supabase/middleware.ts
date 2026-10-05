import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Refreshes the auth cookie on every request so Server Components see a live session. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list: { name: string; value: string; options: CookieOptions }[]) {
        // Empty values are cookie deletions. A refresh that fails only because another tab or request refreshed the
        // same session a moment earlier must not sign the visitor out, so the session cookie is only ever replaced
        // here, never removed. Signing out has its own route (/auth/signout).
        const updates = list.filter((c) => c.value !== "");
        for (const { name, value } of updates) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of updates) response.cookies.set(name, value, options);
      },
    },
  });
  // getSession() reads the cookie and only calls Supabase when the token must be refreshed, so ordinary page loads
  // (and link prefetches) skip a network round trip. It is only used for cheap redirects here: every protected
  // page and action verifies the user again with getUser().
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return { response, signedIn: Boolean(session) };
}
