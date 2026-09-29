"use client";

import { useEffect } from "react";
import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/Button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useT();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-bold">{t("error.title")}</h1>
      <p className="mt-2 max-w-md text-slate-600">{t("common.error")}</p>
      {error.digest ? <p className="mt-1 text-xs text-slate-400">ref: {error.digest}</p> : null}
      <Button className="mt-6" size="lg" onClick={reset}>
        {t("error.retry")}
      </Button>
    </main>
  );
}
