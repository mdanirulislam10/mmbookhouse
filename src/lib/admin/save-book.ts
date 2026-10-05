import "server-only";
import { createServiceClient } from "@/lib/supabase/admin";
import { canSeeMoney } from "@/lib/admin/permissions";
import { dbError, fail, type ActionResult } from "@/lib/actions";
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

/** Shared by the editor form and the CSV importer. */
export async function persistBook(
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

