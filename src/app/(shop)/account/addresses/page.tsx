import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { getProfile, requireUser } from "@/lib/data/session";
import { getAddresses } from "@/lib/data/account";
import { AccountShell } from "@/components/account/AccountShell";
import { AddressBook } from "@/components/account/AddressBook";

export const metadata: Metadata = { title: "Your addresses", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const user = await requireUser("/account/addresses");
  const { t } = await getT();
  const [addresses, profile] = await Promise.all([getAddresses(), getProfile()]);
  return (
    <AccountShell active="addresses" title={t("account.addresses")}>
      <AddressBook addresses={addresses} defaultName={profile?.full_name ?? user.fullName ?? ""} defaultPhone={profile?.phone ?? ""} />
    </AccountShell>
  );
}
