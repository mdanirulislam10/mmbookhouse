import "server-only";
import { getMyPartner } from "@/lib/data/partner";

/**
 * Where to go right after signing in. An explicit destination always wins; the default
 * (the customer account page) becomes the partner panel for publishers, authors and suppliers.
 */
export async function landingPath(next: string): Promise<string> {
  if (next !== "/account") return next;
  return (await getMyPartner()) ? "/partner" : next;
}
