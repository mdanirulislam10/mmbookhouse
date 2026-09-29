import Image from "next/image";
import { cn } from "@/lib/utils";

const PALETTE = [
  ["#1e3a5f", "#3b6ea5"],
  ["#5b2333", "#a23e5c"],
  ["#1f4d3a", "#3f8f6a"],
  ["#4a3b1c", "#a37c2c"],
  ["#3b2a5a", "#7a5cc2"],
  ["#0f4c5c", "#2a9d8f"],
];

function hash(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Cover image, or a tidy generated cover when the book has none yet. */
export function BookCover({
  src,
  title,
  className,
  sizes = "(max-width: 640px) 45vw, 220px",
  priority = false,
}: {
  src?: string | null;
  title: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (src) {
    return (
      <div className={cn("relative aspect-[3/4] w-full overflow-hidden rounded bg-slate-100", className)}>
        <Image src={src} alt={title} fill sizes={sizes} priority={priority} className="object-contain" />
      </div>
    );
  }
  const [a, b] = PALETTE[hash(title) % PALETTE.length];
  return (
    <div
      className={cn("relative flex aspect-[3/4] w-full flex-col justify-between overflow-hidden rounded p-3 text-white", className)}
      style={{ background: `linear-gradient(145deg, ${a}, ${b})` }}
      role="img"
      aria-label={title}
    >
      <div className="h-1 w-8 rounded bg-white/70" />
      <p className="line-clamp-5 text-balance text-sm font-semibold leading-snug drop-shadow sm:text-base">{title}</p>
      <p className="text-[10px] uppercase tracking-widest opacity-80">mmbookhouse</p>
    </div>
  );
}
