"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import { errorMessage } from "@/lib/i18n/errors";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { requestPasswordReset, resetPasswordWithCode } from "@/app/actions/auth";

/** Step 1: e-mail. Step 2 (when we can send our own code): the code and the new password, then the person is signed in. */
export function ForgotForm() {
  const { t, lang } = useT();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"email" | "code" | "link">("email");
  const [length, setLength] = useState(4);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const send = (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    start(async () => {
      const res = await requestPasswordReset({ email });
      if (!res.ok) return setError(errorMessage(lang, res.error, res.detail));
      const digits = res.data?.codeLength ?? 0;
      if (digits > 0) {
        setLength(digits);
        setStep("code");
      } else setStep("link");
    });
  };

  const reset = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await resetPasswordWithCode({ email, code, password });
      if (!res.ok) return setError(errorMessage(lang, res.error, res.detail));
      router.replace("/account");
      router.refresh();
    });
  };

  return (
    <div className="card p-6">
      <h1 className="mb-4 text-2xl font-bold">{t("auth.resetTitle")}</h1>
      {step === "link" ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{t("auth.resetSent", { email })}</p>
      ) : step === "code" ? (
        <form onSubmit={reset} className="space-y-3">
          <p className="text-sm text-slate-600">{t("auth.resetCodeSent", { email, n: length })}</p>
          {error ? <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <Field label={t("auth.code")} htmlFor="code">
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern={`\\d{${length}}`}
              maxLength={length}
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, length))}
              className="h-14 text-center font-mono text-3xl font-semibold tracking-[0.6em]"
            />
          </Field>
          <Field label={t("auth.newPassword")} hint={t("auth.passwordHint")} htmlFor="pw">
            <PasswordInput id="pw" name="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Button type="submit" size="lg" className="w-full" disabled={pending || code.length < length || password.length < 8}>
            {t("auth.updatePassword")}
          </Button>
          <div className="flex justify-between text-sm">
            <button type="button" className="link" disabled={pending} onClick={() => send()}>{t("auth.resend")}</button>
            <button type="button" className="link" onClick={() => { setStep("email"); setCode(""); setError(null); }}>{t("auth.useDifferentEmail")}</button>
          </div>
        </form>
      ) : (
        <form onSubmit={send} className="space-y-3">
          {error ? <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <Field label={t("auth.email")} htmlFor="email">
            <Input id="email" name="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {t("auth.sendCode")}
          </Button>
        </form>
      )}
      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="link">
          {t("auth.signInBtn")}
        </Link>
      </p>
    </div>
  );
}
