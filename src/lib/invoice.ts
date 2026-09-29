import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/lib/env";

/** Short HMAC so a printed QR code can prove an invoice is genuine without exposing order data publicly. */
export function invoiceSignature(orderNo: string): string {
  return createHmac("sha256", serverEnv.serviceRoleKey).update(`invoice:${orderNo}`).digest("hex").slice(0, 20);
}

export function verifyInvoiceSignature(orderNo: string, sig: string): boolean {
  const a = Buffer.from(invoiceSignature(orderNo));
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const invoiceNumber = (orderNo: string) => `INV-${orderNo}`;
