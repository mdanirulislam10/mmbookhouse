import { Badge } from "@/components/ui/Badge";
import type { OrderStatus, PaymentStatus } from "@/lib/types";
import type { DictKey } from "@/lib/i18n";

const orderTone: Record<OrderStatus, "neutral" | "green" | "amber" | "red" | "blue"> = {
  pending: "amber",
  confirmed: "blue",
  processing: "blue",
  ready: "blue",
  dispatched: "blue",
  delivered: "green",
  cancelled: "red",
  returned: "red",
};
const payTone: Record<PaymentStatus, "neutral" | "green" | "amber" | "red" | "blue"> = {
  unpaid: "amber",
  pending_verification: "blue",
  paid: "green",
  failed: "red",
  refunded: "neutral",
};

export function OrderStatusBadge({ status, t }: { status: OrderStatus; t: (k: DictKey) => string }) {
  return <Badge tone={orderTone[status]}>{t(`status.${status}` as DictKey)}</Badge>;
}

export function PaymentStatusBadge({ status, t }: { status: PaymentStatus; t: (k: DictKey) => string }) {
  return <Badge tone={payTone[status]}>{t(`pay.${status}` as DictKey)}</Badge>;
}
