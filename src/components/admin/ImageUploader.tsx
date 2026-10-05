"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { useToast } from "@/components/ui/Toaster";
import { cn } from "@/lib/utils";

/** Downscale in the browser so uploads stay small and covers load fast. */
async function shrink(file: File, maxSide: number): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("FILE_TYPE");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("CANVAS");
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", 0.86));
  if (!blob) throw new Error("CANVAS");
  return blob;
}

async function upload(file: File, folder: string, endpoint: string): Promise<string> {
  const blob = await shrink(file, 1600);
  const form = new FormData();
  form.append("file", new File([blob], "image.webp", { type: "image/webp" }));
  form.append("folder", folder);
  const res = await fetch(endpoint, { method: "POST", body: form });
  const json = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !json.url) throw new Error(json.error ?? "UPLOAD_FAILED");
  return json.url;
}

export function ImageUploader({
  folder,
  value,
  onChange,
  max = 1,
  label,
  aspect = "aspect-[3/4]",
  endpoint = "/api/admin/upload",
}: {
  folder: "covers" | "gallery" | "previews" | "banners" | "categories";
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  label: string;
  aspect?: string;
  /** Upload route; partners use /api/partner/upload. */
  endpoint?: string;
}) {
  const { t } = useT();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const next = [...value];
      for (const f of Array.from(files).slice(0, max - value.length)) next.push(await upload(f, folder, endpoint));
      onChange(next);
    } catch (e) {
      toast.error(t("admin.upload.failed"));
      console.error(e);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div>
      <p className="mb-1 text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">
        {value.map((url, i) => (
          <div key={url} className={cn("group relative w-24 overflow-hidden rounded border bg-white", aspect)}>
            <Image src={url} alt="" fill sizes="96px" className="object-contain" />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
              aria-label={t("common.delete")}
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {value.length < max ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            className={cn("flex w-24 flex-col items-center justify-center gap-1 rounded border-2 border-dashed border-slate-300 text-xs text-slate-500 hover:border-brand-amber hover:text-brand-ink", aspect)}
          >
            {busy ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
            {t("admin.upload.add")}
          </button>
        ) : null}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple={max > 1} hidden onChange={(e) => pick(e.target.files)} />
    </div>
  );
}
