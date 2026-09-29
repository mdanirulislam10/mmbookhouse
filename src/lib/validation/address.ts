import { z } from "zod";

export const INDIAN_STATES = [
  "West Bengal", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Chandigarh", "Puducherry", "Andaman and Nicobar Islands", "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep",
] as const;

/** Accepts "+91 98765-43210", "098765 43210" … and returns the 10 national digits, or "" if invalid. */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  const national = digits.length > 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(national) ? national : "";
}

export const addressSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().max(30).default("Home"),
  full_name: z.string().trim().min(2, "NAME_REQUIRED").max(80),
  phone: z
    .string()
    .transform((v) => normalizePhone(v))
    .refine((v) => v.length === 10, "PHONE_INVALID"),
  line1: z.string().trim().min(3, "LINE1_REQUIRED").max(160),
  line2: z.string().trim().max(160).optional().transform((v) => v || null),
  landmark: z.string().trim().max(120).optional().transform((v) => v || null),
  city: z.string().trim().min(2, "CITY_REQUIRED").max(80),
  district: z.string().trim().max(80).optional().transform((v) => v || null),
  state: z.string().trim().min(2).max(60).default("West Bengal"),
  pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, "PINCODE_INVALID"),
  is_default: z.boolean().default(false),
});

export type AddressInput = z.input<typeof addressSchema>;
