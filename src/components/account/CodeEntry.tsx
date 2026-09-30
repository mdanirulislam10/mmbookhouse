"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useT } from "@/lib/i18n/client";
import { errorMessage } from "@/lib/i18n/errors";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";

/**
 * Enter the code that was e-mailed. The digits are shown as typed (never masked) and the form submits itself
 * as soon as the last digit is in.
 */
export function CodeEntry({
  email,
  length,
  onVerify,
  onResend,
  onBack,
  cta,
  autoSubmit = true,
}: {
  email: string;
  length: number;
  onVerify: (code: string) => Promise<{ ok: boolean; error?: string; detail?: string }>;
  onResend?: () => Promise<{ ok: boolean; error?: string; detail?: string }>;
  onBack?: () => void;
  cta: string;
  autoSubmit?: boolean;
}) {
  const { t, lang } = useT();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(45);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => input.current?.focus(), []);
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  const verify = (value: string) => {
    if (pending || value.length < length) return;
    setError(null);
    start(async () => {
      const res = await onVerify(value);
      if (!res.ok) {
        setError(errorMessage(lang, res.error, res.detail));
        setCode("");
        input.current?.focus();
      }
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        verify(code);
      }}
      className="space-y-3"
    >
      <p className="text-sm text-slate-600">{t("auth.codeSentTo", { email, n: length })}</p>
      {error ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <Field label={t("auth.code")} htmlFor="otp-code">
        <Input
          id="otp-code"
          ref={input}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern={`\d{${length}}`}
          maxLength={length}
          required
          value={code}
          onChange={(e) => {
            const next = e.target.value.replace(/\D/g, "").slice(0, length);
            setCode(next);
            if (autoSubmit && next.length === length) verify(next);
          }}
          className="h-14 text-center font-mono text-3xl font-semibold tracking-[0.6em]"
        />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={pending || code.length < length}>
        {pending ? t("common.loading") : cta}
      </Button>
      <div className="flex items-center justify-between text-sm">
        {onResend ? (
          <button
            type="button"
            className="link disabled:text-slate-400 disabled:no-underline"
            disabled={cooldown > 0 || pending}
            onClick={() =>
              start(async () => {
                const res = await onResend();
                if (!res.ok) return setError(errorMessage(lang, res.error, res.detail));
                setError(null);
                setCooldown(45);
              })
            }
          >
            {cooldown > 0 ? t("auth.resendIn", { s: cooldown }) : t("auth.resend")}
          </button>
        ) : (
          <span />
        )}
        {onBack ? (
          <button type="button" className="link" onClick={onBack}>
            {t("auth.useDifferentEmail")}
          </button>
        ) : null}
      </div>
    </form>
  );
}
