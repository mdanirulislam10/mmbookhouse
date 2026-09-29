"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { errorMessage } from "@/lib/i18n/errors";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { createClient } from "@/lib/supabase/browser";
import { sendEmailCode, signInWithPassword, signUpWithPassword, verifyEmailCode } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";
type Tab = "password" | "code";

export function LoginForm({ next, initialMode, linkError, allowSignUp = true }: { next: string; initialMode: Mode; linkError: boolean; allowSignUp?: boolean }) {
  const { t, lang } = useT();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [tab, setTab] = useState<Tab>("password");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(linkError ? t("auth.linkError") : null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  const done = () => {
    router.replace(next);
    router.refresh();
  };
  const problem = (res: { error: string; detail?: string }) => setError(errorMessage(lang, res.error, res.detail));

  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      if (mode === "signin") {
        const res = await signInWithPassword({ email, password });
        return res.ok ? done() : problem(res);
      }
      const res = await signUpWithPassword({ email, password, fullName: name, next });
      if (!res.ok) return problem(res);
      if (res.data?.needsConfirmation) setConfirmSent(true);
      else done();
    });
  };

  const requestCode = () => {
    setError(null);
    start(async () => {
      const res = await sendEmailCode({ email, next });
      if (!res.ok) return problem(res);
      setCodeSent(true);
      setCooldown(45);
    });
  };

  const submitCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeSent) return requestCode();
    setError(null);
    start(async () => {
      const res = await verifyEmailCode({ email, code });
      return res.ok ? done() : problem(res);
    });
  };

  const google = async () => {
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (err) setError(t("common.error"));
  };

  if (confirmSent) {
    return (
      <div className="card p-6 text-center">
        <MailCheck className="mx-auto mb-3 text-emerald-600" size={44} />
        <h1 className="text-xl font-bold">{t("auth.checkEmail")}</h1>
        <p className="mt-2 text-sm text-slate-600">{t("auth.confirmSent", { email })}</p>
        <Button className="mt-5" variant="secondary" onClick={() => { setConfirmSent(false); setMode("signin"); }}>
          {t("auth.signInBtn")}
        </Button>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h1 className="mb-4 text-2xl font-bold">{mode === "signin" ? t("auth.signInTitle") : t("auth.signUpTitle")}</h1>

      <button
        type="button"
        onClick={google}
        className="flex h-11 w-full items-center justify-center gap-3 rounded-full border border-slate-300 bg-white text-sm font-medium shadow-sm hover:bg-slate-50"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
          <path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z" />
          <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
        </svg>
        {t("auth.google")}
      </button>

      <div className="my-4 flex items-center gap-3 text-xs uppercase text-slate-400">
        <span className="h-px flex-1 bg-slate-200" /> {t("auth.or")} <span className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="mb-4 grid grid-cols-2 rounded-full bg-slate-100 p-1 text-sm font-medium" role="tablist">
        {(["password", "code"] as const).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => { setTab(k); setError(null); }}
            className={cn("rounded-full py-1.5 transition", tab === k ? "bg-white shadow" : "text-slate-500")}
          >
            {k === "password" ? t("auth.tab.password") : t("auth.tab.code")}
          </button>
        ))}
      </div>

      {error ? (
        <p role="alert" className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {tab === "password" ? (
        <form onSubmit={submitPassword} className="space-y-3">
          {mode === "signup" ? (
            <Field label={t("auth.fullName")} htmlFor="name">
              <Input id="name" autoComplete="name" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
          ) : null}
          <Field label={t("auth.email")} htmlFor="email">
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label={t("auth.password")} hint={mode === "signup" ? t("auth.passwordHint") : undefined} htmlFor="password">
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={mode === "signup" ? 8 : 1}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          {mode === "signin" ? (
            <p className="text-right text-sm">
              <Link href="/forgot-password" className="link">
                {t("auth.forgot")}
              </Link>
            </p>
          ) : null}
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? t("common.loading") : mode === "signin" ? t("auth.signInBtn") : t("auth.signUpBtn")}
          </Button>
        </form>
      ) : (
        <form onSubmit={submitCode} className="space-y-3">
          <Field label={t("auth.email")} htmlFor="email2">
            <Input id="email2" type="email" autoComplete="email" required value={email} onChange={(e) => { setEmail(e.target.value); setCodeSent(false); }} />
          </Field>
          {codeSent ? (
            <>
              <p className="text-sm text-slate-600">{t("auth.codeSentTo", { email })}</p>
              <Field label={t("auth.code")} htmlFor="code">
                <Input id="code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6,8}" maxLength={8} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="text-center text-lg tracking-[0.4em]" />
              </Field>
            </>
          ) : null}
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? t("common.loading") : codeSent ? t("auth.verifyCode") : t("auth.sendCode")}
          </Button>
          {codeSent ? (
            <button type="button" className="link w-full text-center text-sm disabled:text-slate-400 disabled:no-underline" disabled={cooldown > 0 || pending} onClick={requestCode}>
              {cooldown > 0 ? t("auth.resendIn", { s: cooldown }) : t("auth.resend")}
            </button>
          ) : null}
        </form>
      )}

      {allowSignUp ? (
        <>
          <p className="mt-5 text-center text-sm text-slate-600">
            {mode === "signin" ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
            <button type="button" className="link font-medium" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setTab("password"); setError(null); }}>
              {mode === "signin" ? t("auth.createAccount") : t("auth.signInBtn")}
            </button>
          </p>
          <p className="mt-2 text-center text-xs text-slate-400">{t("auth.mobileSoon")}</p>
        </>
      ) : null}
    </div>
  );
}
