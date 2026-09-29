import { z } from "zod";

const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

const optInt = (min: number, max: number) =>
  z
    .union([z.number(), z.string()])
    .optional()
    .transform((v) => (v === undefined || v === "" || v === null ? undefined : Number(v)))
    .refine((v) => v === undefined || (Number.isInteger(v) && v >= min && v <= max), "NUMBER_INVALID");

const money = z
  .union([z.number(), z.string()])
  .transform((v) => Number(v))
  .refine((v) => Number.isFinite(v) && v >= 0 && v <= 1_000_000, "PRICE_INVALID");

export const bookSchema = z
  .object({
    id: z.string().uuid().optional(),
    title: z.string().trim().min(1, "TITLE_REQUIRED").max(250),
    title_bn: optText(250),
    subtitle: optText(250),
    description: optText(6000),
    description_bn: optText(6000),
    isbn: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? v.replace(/[-\s]/g, "") : undefined))
      .refine((v) => v === undefined || /^\d{10}(\d{3})?$/.test(v), "ISBN_INVALID"),
    publisher: optText(120),
    authors: z.array(z.string().trim().min(1).max(120)).max(10).default([]),
    category_ids: z.array(z.string().uuid()).max(12).default([]),
    language: z.enum(["bn", "en", "hi", "ur", "sa", "other"]).default("bn"),
    binding: z.enum(["paperback", "hardcover"]).default("paperback"),
    condition: z.enum(["new", "used"]).default("new"),
    edition: optText(60),
    edition_year: optInt(1800, 2100),
    pages: optInt(1, 20000),
    weight_g: optInt(1, 100000),
    class_level: optText(60),
    mrp: money,
    sale_price: money,
    cost_price: money.optional(),
    rack_location: optText(40),
    supplier_note: optText(300),
    on_hand: optInt(0, 1_000_000),
    low_stock_threshold: optInt(0, 10_000),
    hsn_code: optText(10),
    cover_url: z.string().url().max(500).optional().or(z.literal("")).transform((v) => v || undefined),
    gallery: z.array(z.string().url().max(500)).max(8).default([]),
    preview_pages: z.array(z.string().url().max(500)).max(12).default([]),
    status: z.enum(["draft", "active", "archived"]).default("draft"),
    is_featured: z.boolean().default(false),
  })
  .refine((b) => b.sale_price <= b.mrp, { message: "PRICE_ABOVE_MRP", path: ["sale_price"] });

export type BookInput = z.input<typeof bookSchema>;
export type BookData = z.output<typeof bookSchema>;
