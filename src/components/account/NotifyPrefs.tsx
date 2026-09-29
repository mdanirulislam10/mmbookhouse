"use client";

import { useState } from "react";
import { updateNotifyPrefs } from "@/app/actions/account";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toaster";
import { useT } from "@/lib/i18n/client";
import { errorMessage } from "@/lib/i18n/errors";
import { useTransition } from "react";

export function NotifyPrefs({ initial }: { initial: { email: boolean; sms: boolean; whatsapp: boolean } }) {
  const { t, lang } = useT();
  const toast = useToast();
  const [v, setV] = useState(initial);
  const [pending, start] = useTransition();
  const row = (k: keyof typeof v, label: string) => (
    <label key={k} className="flex items-center gap-3 text-sm">
      <input type="checkbox" checked={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.checked })} className="h-4 w-4 accent-amber-500" />
      {label}
    </label>
  );
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">{t("account.notifyText")}</p>
      {row("email", t("account.notify.email"))}
      {row("whatsapp", t("account.notify.whatsapp"))}
      {row("sms", t("account.notify.sms"))}
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await updateNotifyPrefs(v);
            if (res.ok) toast.success(t("account.profileSaved"));
            else toast.error(errorMessage(lang, res.error));
          })
        }
      >
        {t("account.saveProfile")}
      </Button>
    </div>
  );
}
