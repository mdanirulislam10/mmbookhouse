import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({ title, actions, children, className, padded = true }: { title?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={cn("rounded-lg border border-slate-200 bg-white shadow-sm", className)}>
      {title ? (
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <h2 className="font-semibold">{title}</h2>
          {actions}
        </div>
      ) : null}
      <div className={padded ? "p-4" : ""}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, hint, tone = "default", href }: { label: string; value: string; hint?: string; tone?: "default" | "good" | "warn" | "bad"; href?: string }) {
  const body = (
    <div className={cn("rounded-lg border bg-white p-4 shadow-sm transition", href && "hover:shadow-md", tone === "warn" && "border-amber-300 bg-amber-50", tone === "bad" && "border-red-300 bg-red-50", tone === "default" && "border-slate-200", tone === "good" && "border-emerald-300 bg-emerald-50")}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}
export const Th = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <th className={cn("whitespace-nowrap border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500", className)}>{children}</th>
);
export const Td = ({ children, className, colSpan }: { children?: React.ReactNode; className?: string; colSpan?: number }) => (
  <td colSpan={colSpan} className={cn("border-b border-slate-100 px-3 py-2.5 align-middle", className)}>{children}</td>
);

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-10 text-center text-sm text-slate-500">{children}</p>;
}

/** Tiny dependency-free bar chart (server-rendered SVG). */
export function BarChart({ data, height = 160, format }: { data: { label: string; value: number }[]; height?: number; format: (n: number) => string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 100 / Math.max(data.length, 1);
  return (
    <div>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }} role="img" aria-label="Chart">
        {data.map((d, i) => {
          const h = (d.value / max) * (height - 8);
          return (
            <rect key={i} x={i * w + w * 0.15} y={height - h} width={w * 0.7} height={Math.max(h, d.value > 0 ? 1 : 0)} rx="0.6" className="fill-brand-amber">
              <title>{`${d.label}: ${format(d.value)}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{data.at(-1)?.label}</span>
      </div>
    </div>
  );
}

export function Pager({ basePath, params, page, pages, prev, next }: { basePath: string; params: Record<string, string | undefined>; page: number; pages: number; prev: string; next: string }) {
  if (pages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const b = "rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50";
  return (
    <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
      <span>
        {page} / {pages}
      </span>
      <div className="flex gap-2">
        {page > 1 ? <Link className={b} href={href(page - 1)}>{prev}</Link> : null}
        {page < pages ? <Link className={b} href={href(page + 1)}>{next}</Link> : null}
      </div>
    </div>
  );
}
