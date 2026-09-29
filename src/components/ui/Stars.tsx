import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  const pct = Math.max(0, Math.min(5, value)) / 5;
  return (
    <span className={cn("relative inline-flex", className)} role="img" aria-label={`${value.toFixed(1)} / 5`}>
      <span className="flex text-slate-300">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={size} fill="currentColor" strokeWidth={0} />
        ))}
      </span>
      <span className="absolute inset-y-0 left-0 flex overflow-hidden text-amber-500" style={{ width: `${pct * 100}%` }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={size} fill="currentColor" strokeWidth={0} className="shrink-0" />
        ))}
      </span>
    </span>
  );
}
