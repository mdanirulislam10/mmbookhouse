"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toaster";
import { useT } from "@/lib/i18n/client";
import { errorMessage } from "@/lib/i18n/errors";

type Result<T> = { ok: true; data?: T; message?: string } | { ok: false; error: string; detail?: string };

/** Runs a server action with pending state, toasts and a router refresh. */
export function useRun() {
  const { t, lang } = useT();
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();

  function run<T>(fn: () => Promise<Result<T>>, opts: { success?: string; refresh?: boolean; onOk?: (data: T | undefined) => void; onError?: (msg: string) => void } = {}) {
    start(async () => {
      const res = await fn();
      if (!res.ok) {
        const msg = errorMessage(lang, res.error, res.detail);
        toast.error(msg);
        opts.onError?.(msg);
        return;
      }
      toast.success(opts.success ?? t("common.saved"));
      opts.onOk?.(res.data);
      if (opts.refresh !== false) router.refresh();
    });
  }
  return { run, pending };
}
