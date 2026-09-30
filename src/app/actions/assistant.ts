"use server";

import { z } from "zod";
import { buildProposal } from "@/lib/assistant/tools";
import { placeOrder } from "@/app/actions/orders";
import { fail, uuid, type ActionResult } from "@/lib/actions";

const schema = z.object({ fulfillment: z.enum(["delivery", "pickup"]), addressId: uuid.nullable(), expectedTotal: z.number().min(0) });

/**
 * Places the cash-on-delivery order the assistant proposed, after the customer pressed the
 * confirm button. Re-checks the cart first so the customer never pays a total they did not see.
 */
export async function confirmAssistantOrder(input: z.input<typeof schema>): Promise<ActionResult<{ orderId: string; orderNo: string; total: number }>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return fail("INVALID_INPUT");
  const v = parsed.data;
  const proposal = await buildProposal(v.fulfillment, v.addressId);
  if ("error" in proposal) return fail(proposal.error);
  if (Math.abs(proposal.subtotal + (proposal.deliveryFee ?? 0) - v.expectedTotal) > 0.5) return fail("CART_CHANGED");

  const r = await placeOrder({ addressId: v.addressId, paymentMethod: "cod", fulfillment: v.fulfillment, notes: "[Chat assistant]" });
  if (!r.ok) return r;
  return { ok: true, data: { orderId: r.data!.orderId, orderNo: r.data!.orderNo, total: r.data!.total } };
}
