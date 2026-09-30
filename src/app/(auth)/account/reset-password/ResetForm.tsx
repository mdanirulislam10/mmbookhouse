"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import { errorMessage } from "@/lib/i18n/errors";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { updatePassword } from "@/app/actions/auth";

export function ResetForm() {
  const { t, lang } = useT();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await updatePassword({ password });
      if (!res.ok) return setError(errorMessage(lang, res.error, res.detail));
      setDone(true);
      window.setTimeout(() => router.replace("/account"), 1200);
    });
  };

  return (
    <div className="card p-6">
      <h1 className="mb-4 text-2xl font-bold">{t("auth.newPassword")}</h1>
      {done ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{t("auth.passwordUpdated")}</p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          {error ? <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <Field label={t("auth.newPassword")} hint={t("auth.passwordHint")} htmlFor="pw">
            <PasswordInput id="pw" name="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {t("auth.updatePassword")}
          </Button>
        </form>
      )}
    </div>
  );
}
