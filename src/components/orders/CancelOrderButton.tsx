"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelMyOrder } from "@/app/actions/orders";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toaster";
import { useT } from "@/lib/i18n/client";
import { errorMessage } from "@/lib/i18n/errors";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const { t, lang } = useT();
  const router = useRouter();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();

  if (!confirming) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setConfirming(true)}>
        {t("order.cancel")}
      </Button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-red-50 p-3 text-sm">
      <span className="font-medium text-red-800">{t("order.cancelConfirm")}</span>
      <Button
        variant="danger"
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await cancelMyOrder(orderId);
            if (!res.ok) return toast.error(errorMessage(lang, res.error, res.detail));
            toast.success(t("order.cancelled"));
            router.refresh();
          })
        }
      >
        {t("common.yes")}
      </Button>
      <Button variant="secondary" size="sm" onClick={() => setConfirming(false)}>
        {t("common.no")}
      </Button>
    </div>
  );
}
