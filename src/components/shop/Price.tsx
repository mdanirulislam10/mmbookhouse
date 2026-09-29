import { formatINR, cn } from "@/lib/utils";

export function Price({
  price,
  mrp,
  discountPct,
  size = "md",
  showMrp = true,
  mrpLabel,
  offLabel,
}: {
  price: number;
  mrp: number;
  discountPct?: number;
  size?: "sm" | "md" | "lg";
  showMrp?: boolean;
  mrpLabel?: string;
  offLabel?: string;
}) {
  const hasDiscount = mrp > price;
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <span className={cn("font-semibold text-brand-ink", size === "lg" ? "text-3xl" : size === "md" ? "text-lg" : "text-base")}>{formatINR(price)}</span>
      {hasDiscount && showMrp ? (
        <>
          <span className="text-xs text-slate-500">
            {mrpLabel ? `${mrpLabel} ` : ""}
            <s>{formatINR(mrp)}</s>
          </span>
          {discountPct ? <span className="text-xs font-medium text-price">{offLabel ?? `${discountPct}% off`}</span> : null}
        </>
      ) : null}
    </div>
  );
}
