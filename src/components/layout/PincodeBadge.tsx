"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { useT } from "@/lib/i18n/client";

export const PIN_COOKIE = "mm_pin";

function readPin(): string {
  const m = document.cookie.match(new RegExp(`(?:^|; )${PIN_COOKIE}=(\\d{6})`));
  return m ? m[1] : "";
}

/** Remembers the customer's delivery pincode in a cookie (used for delivery estimates). */
export function PincodeBadge({ defaultPin }: { defaultPin: string }) {
  const { t } = useT();
  const [pin, setPin] = useState(defaultPin);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const saved = readPin();
    if (saved) setPin(saved);
  }, []);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[1-9][0-9]{5}$/.test(draft)) return;
    document.cookie = `${PIN_COOKIE}=${draft}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    setPin(draft);
    setEditing(false);
    window.dispatchEvent(new CustomEvent("mm:pincode", { detail: draft }));
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setDraft(pin);
          setEditing((v) => !v);
        }}
        className="flex items-center gap-1 rounded px-2 py-1 text-left leading-tight hover:outline hover:outline-1 hover:outline-white/70"
      >
        <MapPin size={18} className="mt-2 shrink-0" />
        <span className="hidden flex-col text-xs sm:flex">
          <span className="text-slate-300">{t("nav.deliverTo")}</span>
          <span className="font-semibold">{pin || t("nav.enterPincode")}</span>
        </span>
      </button>
      {editing ? (
        <form onSubmit={save} className="absolute left-0 top-12 z-50 w-64 rounded-lg bg-white p-3 text-brand-ink shadow-pop">
          <label htmlFor="pin-input" className="mb-1 block text-sm font-medium">
            {t("nav.enterPincode")}
          </label>
          <div className="flex gap-2">
            <input
              id="pin-input"
              inputMode="numeric"
              pattern="[1-9][0-9]{5}"
              maxLength={6}
              value={draft}
              onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
              className="h-9 min-w-0 flex-1 rounded border border-slate-300 px-2 text-sm"
              autoFocus
            />
            <button className="rounded-full bg-brand-gold px-3 text-sm font-medium">{t("nav.updatePincode")}</button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
