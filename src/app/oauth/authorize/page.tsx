import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getSessionUser, getStaff } from "@/lib/data/session";
import { issueCode, mcpEnabled, readClientId } from "@/lib/mcp/oauth";
import { first } from "@/lib/utils";

export const metadata: Metadata = { title: "Connect app", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

interface AuthRequest {
  clientId: string;
  clientName: string;
  redirectUri: string;
  state: string | null;
  codeChallenge: string | null;
}

/** Validates an authorization request. Errors that make the redirect URI untrustworthy are shown, never redirected. */
function parseRequest(sp: SP): { ok: true; req: AuthRequest } | { ok: false; message: string } {
  const clientId = first(sp.client_id);
  const client = readClientId(clientId);
  if (!clientId || !client) return { ok: false, message: "Unknown app (client_id)." };
  const redirectUri = first(sp.redirect_uri) ?? (client.redirect_uris.length === 1 ? client.redirect_uris[0] : undefined);
  if (!redirectUri || !client.redirect_uris.includes(redirectUri)) return { ok: false, message: "Redirect address does not match the registered app." };
  if (first(sp.response_type) !== "code") return { ok: false, message: "Unsupported response_type." };
  // PKCE is optional here; the token endpoint then requires the client secret instead.
  const codeChallenge = first(sp.code_challenge) || null;
  if (codeChallenge && (first(sp.code_challenge_method) ?? "plain") !== "S256") return { ok: false, message: "Only S256 PKCE is supported." };
  return { ok: true, req: { clientId, clientName: client.client_name || "Gemini", redirectUri, state: first(sp.state) || null, codeChallenge } };
}

function withParams(uri: string, params: Record<string, string | null>) {
  const u = new URL(uri);
  for (const [k, v] of Object.entries(params)) if (v !== null) u.searchParams.set(k, v);
  return u.toString();
}

async function decide(formData: FormData) {
  "use server";
  const sp = Object.fromEntries(formData.entries()) as Record<string, string>;
  const parsed = parseRequest(sp);
  if (!parsed.ok) throw new Error(parsed.message);
  const { req } = parsed;
  if (sp.decision !== "allow") redirect(withParams(req.redirectUri, { error: "access_denied", state: req.state }));
  const staff = await getStaff();
  if (!staff) redirect(withParams(req.redirectUri, { error: "access_denied", state: req.state }));
  const code = issueCode({ userId: staff.userId, clientId: req.clientId, redirectUri: req.redirectUri, codeChallenge: req.codeChallenge });
  redirect(withParams(req.redirectUri, { code, state: req.state }));
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">{children}</div>
    </main>
  );
}

export default async function AuthorizePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  if (!mcpEnabled()) return <Card>MCP is not configured on this server (MCP_OAUTH_SECRET).</Card>;

  const parsed = parseRequest(sp);
  if (!parsed.ok) {
    return (
      <Card>
        <h1 className="text-lg font-semibold">সংযোগ করা যাচ্ছে না</h1>
        <p className="mt-2 text-sm text-slate-600">{parsed.message}</p>
      </Card>
    );
  }

  if (!(await getSessionUser())) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string") qs.set(k, v);
    redirect(`/login?next=${encodeURIComponent(`/oauth/authorize?${qs.toString()}`)}`);
  }

  const staff = await getStaff();
  if (!staff) {
    return (
      <Card>
        <h1 className="text-lg font-semibold">শুধু দোকানের স্টাফদের জন্য</h1>
        <p className="mt-2 text-sm text-slate-600">এই অ্যাকাউন্টটি স্টাফ নয়। অ্যাডমিন অ্যাকাউন্ট দিয়ে লগইন করুন। (Only active staff accounts can connect.)</p>
      </Card>
    );
  }

  const { req } = parsed;
  const hidden = { client_id: req.clientId, redirect_uri: req.redirectUri, response_type: "code", code_challenge: req.codeChallenge ?? "", code_challenge_method: req.codeChallenge ? "S256" : "", state: req.state ?? "" };
  return (
    <Card>
      <div className="flex items-center gap-3">
        <ShieldCheck className="text-emerald-600" size={32} />
        <h1 className="text-lg font-semibold">{req.clientName} সংযোগের অনুমতি</h1>
      </div>
      <p className="mt-3 text-sm text-slate-700">
        <b>{req.clientName}</b> আপনার ({staff.name || staff.email}) হয়ে mmbookhouse-এর তথ্য দেখতে চাইছে: বই খোঁজা, দাম ও স্টক, অর্ডারের অবস্থা
        {staff.role === "super_admin" ? ", আজকের বিক্রি" : ""}। এটি কোনো কিছু পরিবর্তন করতে পারবে না।
      </p>
      <p className="mt-2 text-xs text-slate-500">
        {req.clientName} wants read-only access to the store as you. You can revoke it any time from the app&apos;s connected-apps settings.
      </p>
      <p className="mt-2 break-all text-[11px] text-slate-400">{new URL(req.redirectUri).host}</p>
      <form action={decide} className="mt-5 flex gap-3">
        {Object.entries(hidden).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <button name="decision" value="allow" className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white hover:bg-emerald-700">
          অনুমতি দিন
        </button>
        <button name="decision" value="deny" className="flex-1 rounded-lg border px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50">
          বাতিল
        </button>
      </form>
    </Card>
  );
}
