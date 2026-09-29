"use client";

import { useState, useTransition } from "react";
import { saveAddress } from "@/app/actions/account";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { useT } from "@/lib/i18n/client";
import { errorMessage } from "@/lib/i18n/errors";
import { INDIAN_STATES } from "@/lib/validation/address";
import type { Address } from "@/lib/types";

export function AddressForm({
  initial,
  defaultName = "",
  defaultPhone = "",
  onSaved,
  onCancel,
}: {
  initial?: Address;
  defaultName?: string;
  defaultPhone?: string;
  onSaved: (id: string) => void;
  onCancel?: () => void;
}) {
  const { t, lang } = useT();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({
    label: initial?.label ?? "Home",
    full_name: initial?.full_name ?? defaultName,
    phone: initial?.phone ?? defaultPhone,
    line1: initial?.line1 ?? "",
    line2: initial?.line2 ?? "",
    landmark: initial?.landmark ?? "",
    city: initial?.city ?? "",
    district: initial?.district ?? "",
    state: initial?.state ?? "West Bengal",
    pincode: initial?.pincode ?? "",
    is_default: initial?.is_default ?? false,
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((cur) => ({ ...cur, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await saveAddress({ ...f, id: initial?.id });
      if (res.ok) onSaved(res.data!.id);
      else setError(errorMessage(lang, res.error, res.detail));
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">
          {error}
        </p>
      ) : null}
      <Field label={t("account.addr.fullName")} htmlFor="a-name">
        <Input id="a-name" autoComplete="name" required value={f.full_name} onChange={set("full_name")} />
      </Field>
      <Field label={t("account.addr.phone")} htmlFor="a-phone">
        <Input id="a-phone" type="tel" inputMode="tel" autoComplete="tel" required value={f.phone} onChange={set("phone")} />
      </Field>
      <Field label={t("account.addr.pincode")} htmlFor="a-pin">
        <Input id="a-pin" inputMode="numeric" autoComplete="postal-code" maxLength={6} required value={f.pincode} onChange={(e) => setF({ ...f, pincode: e.target.value.replace(/\D/g, "") })} />
      </Field>
      <Field label={t("account.addr.label")} htmlFor="a-label">
        <Input id="a-label" value={f.label} maxLength={30} onChange={set("label")} />
      </Field>
      <Field label={t("account.addr.line1")} htmlFor="a-l1" className="sm:col-span-2">
        <Input id="a-l1" autoComplete="address-line1" required value={f.line1} onChange={set("line1")} />
      </Field>
      <Field label={t("account.addr.line2")} htmlFor="a-l2" className="sm:col-span-2">
        <Input id="a-l2" autoComplete="address-line2" value={f.line2} onChange={set("line2")} />
      </Field>
      <Field label={t("account.addr.landmark")} htmlFor="a-lm">
        <Input id="a-lm" value={f.landmark} onChange={set("landmark")} />
      </Field>
      <Field label={t("account.addr.city")} htmlFor="a-city">
        <Input id="a-city" autoComplete="address-level2" required value={f.city} onChange={set("city")} />
      </Field>
      <Field label={t("account.addr.district")} htmlFor="a-dist">
        <Input id="a-dist" value={f.district} onChange={set("district")} />
      </Field>
      <Field label={t("account.addr.state")} htmlFor="a-state">
        <Select id="a-state" value={f.state} onChange={set("state")}>
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" checked={f.is_default} onChange={set("is_default")} className="h-4 w-4 accent-amber-500" />
        {t("account.addr.makeDefault")}
      </label>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? t("common.loading") : t("common.save")}
        </Button>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
