"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { useT } from "@/lib/i18n/client";

const DISMISS_KEY = "mm_install_dismissed";
const DISMISS_DAYS = 14;

/** Registers the service worker in production builds only, so dev hot reload is never cached. */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, []);
  return null;
}

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    return at > 0 && Date.now() - at < DISMISS_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

/** Small "install the app" card for browsers that expose the install prompt (Chrome / Edge / Android). */
export function InstallPrompt() {
  const { t } = useT();
  const [event, setEvent] = useState<InstallEvent | null>(null);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches || recentlyDismissed()) return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
    };
    const onInstalled = () => setEvent(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!event) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setEvent(null);
  };
  const install = async () => {
    await event.prompt();
    await event.userChoice.catch(() => null);
    setEvent(null);
  };

  return (
    <div role="dialog" aria-label={t("pwa.install.title")} className="no-print fixed inset-x-3 bottom-20 z-40 mx-auto flex max-w-md items-center gap-3 rounded-xl border bg-white p-3 shadow-lg md:bottom-4 md:left-auto md:right-4 md:mx-0">
      <Download className="shrink-0 text-brand-amber" size={22} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{t("pwa.install.title")}</p>
        <p className="text-xs text-slate-500">{t("pwa.install.body")}</p>
      </div>
      <button onClick={install} className="rounded-md bg-brand-navy px-3 py-1.5 text-sm font-semibold text-white">
        {t("pwa.install.button")}
      </button>
      <button onClick={dismiss} aria-label={t("common.close")} className="rounded p-1 text-slate-400 hover:bg-slate-100">
        <X size={16} />
      </button>
    </div>
  );
}
