import { NextResponse, type NextRequest } from "next/server";
import { getStaff } from "@/lib/data/session";
import { createServiceClient } from "@/lib/supabase/admin";
import { rolesFor } from "@/lib/admin/permissions";

export const runtime = "nodejs";

const MAX_BYTES = 4 * 1024 * 1024; // Vercel functions accept ~4.5 MB bodies; the browser shrinks images first.
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const FOLDERS = new Set(["covers", "gallery", "previews", "banners", "categories"]);

/** Staff-only image upload into the public `media` bucket. Returns the public URL. */
export async function POST(request: NextRequest) {
  const staff = await getStaff();
  const allowed = staff && (rolesFor("books").includes(staff.role) || rolesFor("marketing").includes(staff.role));
  if (!allowed) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  const file = form.get("file");
  const folder = String(form.get("folder") ?? "covers");
  if (!(file instanceof File) || !FOLDERS.has(folder)) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "FILE_TYPE" }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 413 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const path = `${folder}/${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${ext}`;
  const service = createServiceClient();
  const { error } = await service.storage.from("media").upload(path, bytes, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) {
    console.error("[upload]", error.message);
    return NextResponse.json({ error: "UPLOAD_FAILED" }, { status: 500 });
  }
  const { data } = service.storage.from("media").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
