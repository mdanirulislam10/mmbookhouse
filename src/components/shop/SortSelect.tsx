"use client";

import { useRouter } from "next/navigation";

export function SortSelect({
  current,
  basePath,
  keep,
  options,
  label,
}: {
  current: string;
  basePath: string;
  keep: Record<string, string | undefined>;
  options: { value: string; label: string }[];
  label: string;
}) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden text-slate-600 sm:inline">{label}</span>
      <select
        value={current}
        onChange={(e) => {
          const sp = new URLSearchParams();
          for (const [k, v] of Object.entries(keep)) if (v && k !== "sort") sp.set(k, v);
          sp.set("sort", e.target.value);
          router.push(`${basePath}?${sp.toString()}`);
        }}
        className="h-9 rounded-md border border-slate-300 bg-slate-50 px-2 text-sm shadow-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
