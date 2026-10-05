import { z } from "zod";

/** Bump when the partner terms change; applicants accept a specific version. */
export const PARTNER_TERMS_VERSION = "2026-10-05";

export const PARTNER_KINDS = ["publisher", "author", "supplier"] as const;
export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "BDT", "NPR", "AED"] as const;

const opt = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const partnerApplicationSchema = z.object({
  kind: z.enum(PARTNER_KINDS),
  name: z.string().trim().min(2, "NAME_REQUIRED").max(150),
  contact_person: z.string().trim().min(2, "NAME_REQUIRED").max(100),
  email: z.string().trim().email("EMAIL_INVALID").max(200),
  phone: z.string().trim().regex(/^\+?[0-9][0-9 ()-]{5,22}$/, "PHONE_INVALID"),
  country: z.string().trim().min(2).max(60),
  address: z.string().trim().min(5, "ADDRESS_REQUIRED").max(500),
  website: opt(300).refine((v) => !v || /^https?:\/\/\S+\.\S+/.test(v), "URL_INVALID"),
  tax_id: opt(40),
  catalogue: z.string().trim().min(10, "CATALOGUE_REQUIRED").max(2000),
  terms: z.literal(true, { message: "TERMS_REQUIRED" }),
});
export type PartnerApplicationInput = z.input<typeof partnerApplicationSchema>;

const num = (min: number, max: number, code: string) =>
  z
    .union([z.number(), z.string()])
    .transform((v) => Number(v))
    .refine((v) => Number.isFinite(v) && v >= min && v <= max, code);

const optInt = (min: number, max: number) =>
  z
    .union([z.number(), z.string()])
    .optional()
    .transform((v) => (v === undefined || v === "" ? undefined : Number(v)))
    .refine((v) => v === undefined || (Number.isInteger(v) && v >= min && v <= max), "NUMBER_INVALID");

export const partnerBookSchema = z.object({
  title: z.string().trim().min(1, "TITLE_REQUIRED").max(250),
  title_bn: opt(250),
  authors: z.string().trim().min(2, "AUTHOR_REQUIRED").max(500),
  publisher: opt(120),
  isbn: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v.replace(/[-\s]/g, "") : undefined))
    .refine((v) => v === undefined || /^\d{10}(\d{3})?$/.test(v), "ISBN_INVALID"),
  language: z.enum(["bn", "en", "hi", "ur", "sa", "other"]).default("bn"),
  binding: z.enum(["paperback", "hardcover"]).default("paperback"),
  edition: opt(60),
  pages: optInt(1, 20000),
  mrp: num(1, 1_000_000, "PRICE_INVALID"),
  supply_price: num(0, 1_000_000, "PRICE_INVALID"),
  currency: z.enum(CURRENCIES).default("INR"),
  quantity: optInt(0, 1_000_000),
  description: opt(4000),
  cover_url: z.string().url().max(500).optional().or(z.literal("")).transform((v) => v || undefined),
});
export type PartnerBookInput = z.input<typeof partnerBookSchema>;
