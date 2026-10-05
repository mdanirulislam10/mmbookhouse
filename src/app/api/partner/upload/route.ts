import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_BYTES = 3 * 1024 * 1024; // the browser shrinks covers before upload
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Book-cover upload for approved partners, into the public `media` bucket under partners/. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  const { data: partner } = await supabase.from("partners").select("id, status").eq("user_id", auth.user.id).maybeSingle();
  if (partner?.status !== "approved") return NextResponse.json({ error: "PARTNER_NOT_APPROVED" }, { status: 403 });

  const service = createServiceClient();
  const { data: allowed } = await service.rpc("hit_rate_limit", { p_key: `partner-upload:${partner.id}`, p_max: 60, p_window_seconds: 86400, p_block_seconds: 0 });
  if (allowed === false) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "FILE_TYPE" }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 413 });

  const path = `partners/${partner.id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await service.storage.from("media").upload(path, new Uint8Array(await file.arrayBuffer()), { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) {
    console.error("[partner upload]", error.message);
    return NextResponse.json({ error: "UPLOAD_FAILED" }, { status: 500 });
  }
  return NextResponse.json({ url: service.storage.from("media").getPublicUrl(path).data.publicUrl });
}
