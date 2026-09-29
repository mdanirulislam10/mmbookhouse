"use client";

import { useEffect, useState } from "react";

function parts(ms: number) {
  const s = Math.max(Math.floor(ms / 1000), 0);
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}
const pad = (n: number) => String(n).padStart(2, "0");

/** Live countdown to an ISO timestamp. Renders nothing on the server to avoid hydration drift. */
export function Countdown({ to, className }: { to: string; className?: string }) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const end = new Date(to).getTime();
    const tick = () => setLeft(end - Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [to]);
  if (left === null) return <span className={className}>--:--:--</span>;
  if (left <= 0) return <span className={className}>00:00:00</span>;
  const { d, h, m, s } = parts(left);
  return (
    <span className={className} suppressHydrationWarning>
      {d > 0 ? `${d}d ` : ""}
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
}
