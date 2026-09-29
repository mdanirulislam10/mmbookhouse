"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Plus } from "lucide-react";
import { deleteAddress, setDefaultAddress } from "@/app/actions/account";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toaster";
import { useT } from "@/lib/i18n/client";
import { errorMessage } from "@/lib/i18n/errors";
import type { Address } from "@/lib/types";
import { AddressForm } from "./AddressForm";

export function AddressBook({ addresses, defaultName, defaultPhone }: { addresses: Address[]; defaultName: string; defaultPhone: string }) {
  const { t, lang } = useT();
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [pending, start] = useTransition();

  const act = (fn: () => Promise<{ ok: boolean; error?: string; detail?: string }>, message?: string) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) return toast.error(errorMessage(lang, res.error, res.detail));
      if (message) toast.success(message);
      router.refresh();
    });

  if (editing) {
    return (
      <div className="card p-5">
        <h2 className="mb-4 text-lg font-bold">{editing === "new" ? t("account.newAddress") : t("account.editAddress")}</h2>
        <AddressForm
          initial={editing === "new" ? undefined : editing}
          defaultName={defaultName}
          defaultPhone={defaultPhone}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            toast.success(t("account.addrSaved"));
            router.refresh();
          }}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <button
        type="button"
        onClick={() => setEditing("new")}
        className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-white text-slate-500 hover:border-brand-amber hover:text-brand-ink"
      >
        <Plus size={32} />
        <span className="font-medium">{t("account.addAddress")}</span>
      </button>
      {addresses.map((a) => (
        <div key={a.id} className="card flex flex-col p-4">
          <div className="mb-2 flex items-center gap-2">
            <MapPin size={16} className="text-slate-500" />
            <span className="font-semibold">{a.label}</span>
            {a.is_default ? <Badge tone="amber">{t("account.default")}</Badge> : null}
          </div>
          <address className="flex-1 text-sm not-italic leading-relaxed text-slate-700">
            <strong>{a.full_name}</strong>
            <br />
            {a.line1}
            {a.line2 ? `, ${a.line2}` : ""}
            <br />
            {a.landmark ? <>{a.landmark}<br /></> : null}
            {a.city}
            {a.district ? `, ${a.district}` : ""}, {a.state} {a.pincode}
            <br />
            {a.phone}
          </address>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <button className="link" onClick={() => setEditing(a)}>
              {t("common.edit")}
            </button>
            {!a.is_default ? (
              <button className="link" disabled={pending} onClick={() => act(() => setDefaultAddress(a.id))}>
                {t("account.makeDefault")}
              </button>
            ) : null}
            <button className="text-red-600 hover:underline" disabled={pending} onClick={() => act(() => deleteAddress(a.id), t("account.addrDeleted"))}>
              {t("account.deleteAddress")}
            </button>
          </div>
        </div>
      ))}
      {addresses.length === 0 ? <p className="text-sm text-slate-500 sm:col-span-2">{t("account.noAddresses")}</p> : null}
    </div>
  );
}
