"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { authorize, FORBIDDEN, writeAudit } from "@/lib/admin/guard";
import { canSeeMoney } from "@/lib/admin/permissions";
import { createServiceClient } from "@/lib/supabase/admin";
import { CATALOG_TAG } from "@/lib/data/catalog";
import { dbError, fail, uuid, type ActionResult } from "@/lib/actions";
import { bookSchema, type BookInput } from "@/lib/validation/book";
import { randomSuffix, slugify } from "@/lib/utils";

type Service = ReturnType<typeof createServiceClient>;

async function uniqueBookSlug(service: Service, title: string, isbn?: string): Promise<string> {
  const base = slugify(title) || (isbn ? `isbn-${isbn}` : "book");
  let candidate = base;
  for (let i = 0; i < 6; i++) {
    const { data } = await service.from("books").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${randomSuffix(4)}`;
  }
  return `${base}-${randomSuffix(8)}`;
}

const personSlug = (name: string, prefix: string) => slugify(name) || `${prefix}-${randomSuffix(6)}`;

function invalidate(id?: string) {
  revalidateTag(CATALOG_TAG);
  revalidatePath("/admin/books");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  if (id) revalidatePath(`/admin/books/${id}`);
  revalidatePath("/", "layout");
}

/** Shared by the editor form and the CSV importer. */
async function persistBook(
  service: Service,
  staffId: string,
  role: Parameters<typeof canSeeMoney>[0],
  input: BookInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const parsed = bookSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "INVALID_INPUT", parsed.error.issues[0]?.path.join("."));
  const b = parsed.data;

  let existingSlug: string | undefined;
  if (b.id) {
    const { data } = await service.from("books").select("slug, title").eq("id", b.id).maybeSingle();
    if (!data) return fail("BOOK_NOT_FOUND");
    existingSlug = data.slug as string;
  }
  const slug = existingSlug ?? (await uniqueBookSlug(service, b.title, b.isbn));

  const payload = {
    id: b.id ?? null,
    slug,
    title: b.title,
    title_bn: b.title_bn ?? null,
    subtitle: b.subtitle ?? null,
    description: b.description ?? null,
    description_bn: b.description_bn ?? null,
    isbn: b.isbn ?? null,
    language: b.language,
    binding: b.binding,
    condition: b.condition,
    edition: b.edition ?? null,
    edition_year: b.edition_year ?? null,
    pages: b.pages ?? null,
    weight_g: b.weight_g ?? null,
    class_level: b.class_level ?? null,
    mrp: b.mrp,
    sale_price: b.sale_price,
    hsn_code: b.hsn_code ?? "4901",
    cover_url: b.cover_url ?? null,
    gallery: b.gallery,
    preview_pages: b.preview_pages,
    status: b.status,
    is_featured: b.is_featured,
    publisher: b.publisher ? { name: b.publisher, slug: personSlug(b.publisher, "publisher") } : null,
    authors: b.authors.map((name) => ({ name, slug: personSlug(name, "author") })),
    category_ids: b.category_ids,
    rack_location: b.rack_location ?? null,
    supplier_note: b.supplier_note ?? null,
    on_hand: b.on_hand ?? null,
    low_stock_threshold: b.low_stock_threshold ?? null,
    // Only the owner may see or change wholesale cost.
    ...(canSeeMoney(role) && b.cost_price !== undefined ? { cost_price: b.cost_price } : {}),
  };

  const { data, error } = await service.rpc("admin_save_book", { p: payload, p_actor: staffId });
  if (error) {
    if (error.message.includes("books_isbn_key")) return fail("ISBN_TAKEN");
    if (error.message.includes("books_slug_key")) return fail("SLUG_TAKEN");
    if (error.message.includes("books_check")) return fail("PRICE_ABOVE_MRP");
    return dbError(error);
  }
  return { ok: true, data: { id: data as string, slug } };
}

export async function saveBook(input: BookInput): Promise<ActionResult<{ id: string; slug: string }>> {
  const staff = await authorize("books");
  if (!staff) return FORBIDDEN;
  const service = createServiceClient();
  const res = await persistBook(service, staff.userId, staff.role, input);
  if (res.ok) {
    await writeAudit(staff, input.id ? "book.update" : "book.create", "book", res.data!.id, { after: { title: input.title, mrp: input.mrp, sale_price: input.sale_price, status: input.status } });
    invalidate(res.data!.id);
  }
  return res;
}

export async function setBookStatus(id: string, status: "draft" | "active" | "archived"): Promise<ActionResult> {
  const parsed = z.object({ id: uuid, status: z.enum(["draft", "active", "archived"]) }).safeParse({ id, status });
  if (!parsed.success) return fail("INVALID_INPUT");
  const staff = await authorize("books");
  if (!staff) return FORBIDDEN;
  const { error } = await createServiceClient().from("books").update({ status }).eq("id", id);
  if (error) return dbError(error);
  await writeAudit(staff, "book.status", "book", id, { after: status });
  invalidate(id);
  return { ok: true };
}

export async function setBookFeatured(id: string, featured: boolean): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return fail("INVALID_INPUT");
  const staff = await authorize("books");
  if (!staff) return FORBIDDEN;
  const { error } = await createServiceClient().from("books").update({ is_featured: featured }).eq("id", id);
  if (error) return dbError(error);
  await writeAudit(staff, "book.featured", "book", id, { after: featured });
  invalidate(id);
  return { ok: true };
}

export async function bulkPrice(input: { publisherId?: string; categoryId?: string; mode: "discount_pct" | "adjust_pct"; pct: number }): Promise<ActionResult<{ count: number }>> {
  const parsed = z
    .object({ publisherId: uuid.optional(), categoryId: uuid.optional(), mode: z.enum(["discount_pct", "adjust_pct"]), pct: z.number().min(-90).max(100) })
    .safeParse(input);
  if (!parsed.success) return fail("INVALID_INPUT");
  const staff = await authorize("books");
  if (!staff) return FORBIDDEN;
  const { data, error } = await createServiceClient().rpc("admin_bulk_price", {
    p_publisher: parsed.data.publisherId ?? null,
    p_category: parsed.data.categoryId ?? null,
    p_mode: parsed.data.mode,
    p_pct: parsed.data.pct,
    p_actor: staff.userId,
  });
  if (error) return dbError(error);
  await writeAudit(staff, "book.bulk_price", "book", null, { after: parsed.data });
  invalidate();
  return { ok: true, data: { count: data as number } };
}

export interface ImportRowResult {
  row: number;
  title: string;
  ok: boolean;
  error?: string;
}

/**
 * CSV import. Rows already validated on the client are validated again here.
 * Existing books are matched by ISBN and updated; the rest are created (as drafts unless status says otherwise).
 */
export async function importBooks(rows: Record<string, string>[], opts: { dryRun: boolean }): Promise<ActionResult<{ results: ImportRowResult[]; created: number; updated: number }>> {
  const staff = await authorize("books");
  if (!staff) return FORBIDDEN;
  if (rows.length === 0) return fail("EMPTY_FILE");
  if (rows.length > 1000) return fail("TOO_MANY_ROWS");

  const service = createServiceClient();
  const { data: cats } = await service.from("categories").select("id, slug, name");
  const catBySlugOrName = new Map<string, string>();
  for (const c of cats ?? []) {
    catBySlugOrName.set((c.slug as string).toLowerCase(), c.id as string);
    catBySlugOrName.set((c.name as string).toLowerCase(), c.id as string);
  }

  const results: ImportRowResult[] = [];
  let created = 0;
  let updated = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const title = (r.title ?? "").trim();
    const isbn = (r.isbn ?? "").replace(/[-\s]/g, "");
    try {
      let id: string | undefined;
      if (isbn) {
        const { data } = await service.from("books").select("id").eq("isbn", isbn).maybeSingle();
        id = (data?.id as string | undefined) ?? undefined;
      }
      const input: BookInput = {
        id,
        title,
        title_bn: r.title_bn,
        isbn: isbn || undefined,
        publisher: r.publisher,
        authors: (r.authors ?? "").split(/[;|]/).map((a) => a.trim()).filter(Boolean),
        category_ids: (r.categories ?? "").split(/[;|]/).map((c) => catBySlugOrName.get(c.trim().toLowerCase())).filter(Boolean) as string[],
        language: (r.language || "bn") as "bn",
        binding: (r.binding === "hardcover" ? "hardcover" : "paperback") as "paperback",
        edition: r.edition,
        pages: r.pages,
        mrp: r.mrp,
        sale_price: r.sale_price || r.mrp,
        cost_price: canSeeMoney(staff.role) && r.cost_price ? r.cost_price : undefined,
        on_hand: id ? undefined : r.stock,
        rack_location: r.rack,
        class_level: r.class_level,
        description: r.description,
        status: (["draft", "active", "archived"].includes(r.status) ? r.status : "draft") as "draft",
        gallery: [],
        preview_pages: [],
      };
      if (opts.dryRun) {
        const check = bookSchema.safeParse(input);
        results.push({ row: i + 1, title, ok: check.success, error: check.success ? undefined : check.error.issues[0]?.message });
        if (check.success) id ? updated++ : created++;
        continue;
      }
      const res = await persistBook(service, staff.userId, staff.role, input);
      results.push({ row: i + 1, title, ok: res.ok, error: res.ok ? undefined : res.error });
      if (res.ok) id ? updated++ : created++;
    } catch (e) {
      results.push({ row: i + 1, title, ok: false, error: e instanceof Error ? e.message : "ERROR" });
    }
  }
  if (!opts.dryRun) {
    await writeAudit(staff, "book.import", "book", null, { after: { created, updated, failed: results.filter((r) => !r.ok).length } });
    invalidate();
  }
  return { ok: true, data: { results, created, updated } };
}

/** Curated "frequently bought together" companions for a book. */
export async function setRelatedBooks(bookId: string, relatedIds: string[]): Promise<ActionResult> {
  const parsed = z.object({ bookId: uuid, relatedIds: z.array(uuid).max(3) }).safeParse({ bookId, relatedIds });
  if (!parsed.success) return fail("INVALID_INPUT");
  const staff = await authorize("marketing");
  if (!staff) return FORBIDDEN;
  const service = createServiceClient();
  const ids = parsed.data.relatedIds.filter((i) => i !== bookId);
  const del = await service.from("related_books").delete().eq("book_id", bookId).eq("kind", "fbt");
  if (del.error) return dbError(del.error);
  if (ids.length) {
    const { error } = await service.from("related_books").insert(ids.map((related_book_id, position) => ({ book_id: bookId, related_book_id, kind: "fbt", position })));
    if (error) return dbError(error);
  }
  await writeAudit(staff, "book.related", "book", bookId, { after: ids });
  invalidate(bookId);
  return { ok: true };
}
