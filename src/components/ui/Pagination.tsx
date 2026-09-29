import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function href(basePath: string, params: Record<string, string | undefined>, page: number) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function Pagination({
  basePath,
  params,
  page,
  pages,
  labels,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  page: number;
  pages: number;
  labels: { previous: string; next: string };
}) {
  if (pages <= 1) return null;
  const nums = new Set<number>([1, pages, page - 1, page, page + 1]);
  const list = [...nums].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const item = "flex h-9 min-w-9 items-center justify-center rounded border px-2 text-sm";
  return (
    <nav className="mt-6 flex flex-wrap items-center justify-center gap-1.5" aria-label="Pagination">
      {page > 1 ? (
        <Link className={cn(item, "border-slate-300 bg-white hover:bg-slate-50")} href={href(basePath, params, page - 1)} rel="prev">
          <ChevronLeft size={16} /> {labels.previous}
        </Link>
      ) : null}
      {list.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - list[i - 1] > 1 ? <span className="px-1 text-slate-400">…</span> : null}
          <Link
            href={href(basePath, params, n)}
            aria-current={n === page ? "page" : undefined}
            className={cn(item, n === page ? "border-brand-amber bg-amber-50 font-semibold" : "border-slate-300 bg-white hover:bg-slate-50")}
          >
            {n}
          </Link>
        </span>
      ))}
      {page < pages ? (
        <Link className={cn(item, "border-slate-300 bg-white hover:bg-slate-50")} href={href(basePath, params, page + 1)} rel="next">
          {labels.next} <ChevronRight size={16} />
        </Link>
      ) : null}
    </nav>
  );
}
