import { Check, X } from "lucide-react";
import type { DictKey } from "@/lib/i18n";
import type { OrderStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const DELIVERY_STEPS: OrderStatus[] = ["pending", "confirmed", "processing", "dispatched", "delivered"];
const PICKUP_STEPS: OrderStatus[] = ["pending", "confirmed", "processing", "ready", "delivered"];

/** Horizontal progress tracker (Amazon style) with the timestamped event log underneath. */
export function OrderTimeline({
  status,
  fulfillment,
  events,
  t,
  lang,
}: {
  status: OrderStatus;
  fulfillment: "delivery" | "pickup";
  events: { id: number; status: string; note: string | null; created_at: string }[];
  t: (k: DictKey) => string;
  lang: "bn" | "en";
}) {
  const steps = fulfillment === "pickup" ? PICKUP_STEPS : DELIVERY_STEPS;
  const terminal = status === "cancelled" || status === "returned";
  const currentIdx = terminal ? -1 : Math.max(steps.indexOf(status), 0);

  return (
    <div>
      {terminal ? (
        <p className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 font-medium text-red-700">
          <X size={18} /> {t(`status.${status}` as DictKey)}
        </p>
      ) : (
        <ol className="flex items-start" aria-label="Order progress">
          {steps.map((s, i) => {
            const done = i <= currentIdx;
            return (
              <li key={s} className="relative flex flex-1 flex-col items-center text-center">
                {i > 0 ? <span className={cn("absolute right-1/2 top-3.5 h-0.5 w-full", i <= currentIdx ? "bg-emerald-500" : "bg-slate-200")} aria-hidden /> : null}
                <span className={cn("relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs", done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white text-slate-400")}>
                  {done ? <Check size={14} /> : i + 1}
                </span>
                <span className={cn("mt-1.5 px-0.5 text-[11px] leading-tight sm:text-xs", done ? "font-semibold text-brand-ink" : "text-slate-500")}>{t(`status.${s}` as DictKey)}</span>
              </li>
            );
          })}
        </ol>
      )}

      {events.length ? (
        <ul className="mt-5 space-y-2 border-l-2 border-slate-200 pl-4 text-sm">
          {[...events].reverse().map((e) => (
            <li key={e.id} className="relative">
              <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-400" aria-hidden />
              <span className="font-medium">{t(`status.${e.status}` as DictKey)}</span>
              <span className="ml-2 text-xs text-slate-500">{formatDate(e.created_at, lang, true)}</span>
              {e.note && !e.note.startsWith("Order placed") ? <p className="text-slate-600">{e.note}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
