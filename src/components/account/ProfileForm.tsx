"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/actions/account";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toaster";
import { useT } from "@/lib/i18n/client";
import { errorMessage } from "@/lib/i18n/errors";

export function ProfileForm({ fullName, phone, email }: { fullName: string; phone: string; email: string }) {
  const { t, lang } = useT();
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState(fullName);
  const [ph, setPh] = useState(phone);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await updateProfile({ full_name: name, phone: ph });
      if (!res.ok) return setError(errorMessage(lang, res.error, res.detail));
      toast.success(t("account.profileSaved"));
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      {error ? <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{error}</p> : null}
      <Field label={t("common.name")} htmlFor="p-name">
        <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} autoComplete="name" />
      </Field>
      <Field label={t("common.phone")} hint={t("account.phoneHint")} htmlFor="p-phone">
        <Input id="p-phone" type="tel" value={ph} onChange={(e) => setPh(e.target.value)} autoComplete="tel" />
      </Field>
      <Field label={t("common.email")} htmlFor="p-email" className="sm:col-span-2">
        <Input id="p-email" value={email} disabled readOnly />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {t("account.saveProfile")}
        </Button>
      </div>
    </form>
  );
}
