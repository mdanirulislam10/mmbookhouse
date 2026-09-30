"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { authorize, FORBIDDEN, writeAudit } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/supabase/admin";
import { CATALOG_TAG } from "@/lib/data/catalog";
import { dbError, fail, uuid, type ActionResult } from "@/lib/actions";
import { randomSuffix, slugify } from "@/lib/utils";

function invalidate() {
  revalidateTag(CATALOG_TAG);
  revalidatePath("/admin/catalog");
  revalidatePath("/", "layout");
}

const opt = (n: number) => z.string().trim().max(n).optional().transform((v) => v || null);

export async function saveCategory(input: {
  id?: string;
  name: string;
  name_bn?: string;
  parent_id?: string | null;
  sort_order?: number;
  show_on_home?: boolean;
  is_active?: boolean;
}): Promise<ActionResult> {
  const parsed = z
    .object({
      id: uuid.optional(),
      name: z.string().trim().min(2, "NAME_REQUIRED").max(80),
      name_bn: opt(80),
      parent_id: uuid.nullable().optional(),
      sort_order: z.number().int().min(0).max(9999).default(0),
      show_on_home: z.boolean().default(false),
      is_active: z.boolean().default(true),
    })
    .safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "INVALID_INPUT");
  const staff = await authorize("catalog");
  if (!staff) return FORBIDDEN;
  const v = parsed.data;
  if (v.id && v.parent_id === v.id) return fail("INVALID_INPUT");
  const service = createServiceClient();

  if (v.id) {
    const { error } = await service
      .from("categories")
      .update({ name: v.name, name_bn: v.name_bn, parent_id: v.parent_id ?? null, sort_order: v.sort_order, show_on_home: v.show_on_home, is_active: v.is_active })
      .eq("id", v.id);
    if (error) return dbError(error);
  } else {
    const base = slugify(v.name) || `category-${randomSuffix(4)}`;
    let slug = base;
    for (let i = 0; i < 5; i++) {
      const { data } = await service.from("categories").select("id").eq("slug", slug).maybeSingle();
      if (!data) break;
      slug = `${base}-${randomSuffix(3)}`;
    }
    const { error } = await service
      .from("categories")
      .insert({ slug, name: v.name, name_bn: v.name_bn, parent_id: v.parent_id ?? null, sort_order: v.sort_order, show_on_home: v.show_on_home, is_active: v.is_active });
    if (error) return dbError(error);
  }
  await writeAudit(staff, v.id ? "category.update" : "category.create", "category", v.id ?? null, { after: v.name });
  invalidate();
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return fail("INVALID_INPUT");
  const staff = await authorize("catalog");
  if (!staff) return FORBIDDEN;
  const service = createServiceClient();
  const { count } = await service.from("categories").select("id", { count: "exact", head: true }).eq("parent_id", id);
  if ((count ?? 0) > 0) return fail("HAS_CHILDREN");
  const { error } = await service.from("categories").delete().eq("id", id);
  if (error) return dbError(error);
  await writeAudit(staff, "category.delete", "category", id);
  invalidate();
  return { ok: true };
}

async function savePerson(table: "authors" | "publishers", input: { id: string; name: string; name_bn?: string }): Promise<ActionResult> {
  const parsed = z.object({ id: uuid, name: z.string().trim().min(1, "NAME_REQUIRED").max(120), name_bn: opt(120) }).safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "INVALID_INPUT");
  const staff = await authorize("catalog");
  if (!staff) return FORBIDDEN;
  const { error } = await createServiceClient().from(table).update({ name: parsed.data.name, name_bn: parsed.data.name_bn }).eq("id", parsed.data.id);
  if (error) return dbError(error);
  const service = createServiceClient();
  // Search text of the books that use this name.
  const link = table === "authors" ? await service.from("book_authors").select("book_id").eq("author_id", parsed.data.id) : await service.from("books").select("id").eq("publisher_id", parsed.data.id);
  for (const r of link.data ?? []) await service.rpc("refresh_book_search", { p_book: (r as { book_id?: string; id?: string }).book_id ?? (r as { id: string }).id });
  await writeAudit(staff, `${table}.update`, table, parsed.data.id, { after: parsed.data.name });
  invalidate();
  return { ok: true };
}
export const saveAuthor = async (input: { id: string; name: string; name_bn?: string }) => savePerson("authors", input);
export const savePublisher = async (input: { id: string; name: string; name_bn?: string }) => savePerson("publishers", input);

/** Adds an author or publisher by name. The same name (any letter case) is never added twice. */
async function createPerson(table: "authors" | "publishers", input: { name: string; name_bn?: string }): Promise<ActionResult<{ id: string; name: string }>> {
  const parsed = z.object({ name: z.string().trim().min(1, "NAME_REQUIRED").max(120), name_bn: opt(120) }).safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "INVALID_INPUT");
  const staff = await authorize("catalog");
  if (!staff) return FORBIDDEN;
  const service = createServiceClient();
  // Compare in code (case-insensitively) so LIKE wildcards in a name can never match other rows.
  const { data: all } = await service.from(table).select("name").limit(10000);
  if ((all ?? []).some((r) => String(r.name).toLowerCase() === parsed.data.name.toLowerCase())) return fail("NAME_EXISTS");
  const base = slugify(parsed.data.name) || `${table === "authors" ? "author" : "publisher"}-${randomSuffix(6)}`;
  let slug = base;
  for (let i = 0; i < 5; i++) {
    const { data } = await service.from(table).select("id").eq("slug", slug).maybeSingle();
    if (!data) break;
    slug = `${base}-${randomSuffix(3)}`;
  }
  const { data, error } = await service.from(table).insert({ slug, name: parsed.data.name, name_bn: parsed.data.name_bn }).select("id, name").single();
  if (error || !data) return dbError(error);
  await writeAudit(staff, `${table}.create`, table, data.id as string, { after: parsed.data.name });
  invalidate();
  return { ok: true, data: { id: data.id as string, name: data.name as string } };
}
export const createAuthor = async (input: { name: string; name_bn?: string }) => createPerson("authors", input);
export const createPublisher = async (input: { name: string; name_bn?: string }) => createPerson("publishers", input);

/** Removes an author or publisher that no book uses. */
async function deletePerson(table: "authors" | "publishers", id: string): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return fail("INVALID_INPUT");
  const staff = await authorize("catalog");
  if (!staff) return FORBIDDEN;
  const service = createServiceClient();
  const used =
    table === "authors"
      ? await service.from("book_authors").select("book_id", { count: "exact", head: true }).eq("author_id", id)
      : await service.from("books").select("id", { count: "exact", head: true }).eq("publisher_id", id);
  if ((used.count ?? 0) > 0) return fail("IN_USE");
  const { error } = await service.from(table).delete().eq("id", id);
  if (error) return dbError(error);
  await writeAudit(staff, `${table}.delete`, table, id);
  invalidate();
  return { ok: true };
}
export const deleteAuthor = async (id: string) => deletePerson("authors", id);
export const deletePublisher = async (id: string) => deletePerson("publishers", id);
