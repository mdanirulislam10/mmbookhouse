import { cn } from "@/lib/utils";

type Tone = "neutral" | "green" | "amber" | "red" | "blue" | "slate";

const tones: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  slate: "bg-slate-800 text-white",
  green: "bg-emerald-100 text-emerald-800",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-700",
  blue: "bg-sky-100 text-sky-800",
};

export function Badge({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium", tones[tone], className)}>{children}</span>;
}
