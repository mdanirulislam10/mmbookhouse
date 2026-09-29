import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { PublicSettings } from "@/lib/types";

export const SETTINGS_TAG = "settings";

export const DEFAULT_SETTINGS: PublicSettings = {
  store_profile: {
    name: "mmbookhouse",
    name_bn: "এম এম বুক হাউস",
    tagline: "Your trusted online bookstore",
    tagline_bn: "অনলাইনে আপনার বিশ্বস্ত বইয়ের দোকান",
    address: "Borokamdol, Sambalpur (Tal), Pukhuria, Malda, West Bengal",
    address_bn: "গ্রাম— বড়ো কামডোল, পোস্ট অফিস— সাম্বলপুর (টাল), থানা— পুখুরিয়া, জেলা— মালদা",
    pincode: "732101",
    phone: "9733196010",
    whatsapp: "",
    email: "",
    hours: "10:00 - 21:00",
  },
  notice_bar: { enabled: false, text: "", text_bn: "", href: "" },
  maintenance: { enabled: false, message: "", message_bn: "" },
  payment: { cod_enabled: true, cod_max_order: 3000, upi_enabled: true, upi_id: "", upi_payee_name: "mmbookhouse" },
  checkout: { pickup_enabled: true, pickup_address: "Borokamdol, Sambalpur (Tal), Pukhuria, Malda, West Bengal", max_qty_per_item: 10 },
};

async function loadSettings(): Promise<PublicSettings> {
  const { data, error } = await createPublicClient().from("site_settings").select("key, value").eq("is_public", true);
  if (error) {
    console.error("[settings] could not load site_settings:", error.message);
    return DEFAULT_SETTINGS;
  }
  const merged: PublicSettings = structuredClone(DEFAULT_SETTINGS);
  for (const row of data ?? []) {
    if (row.key in merged) {
      (merged as unknown as Record<string, unknown>)[row.key] = {
        ...(merged as unknown as Record<string, object>)[row.key],
        ...(row.value as object),
      };
    }
  }
  return merged;
}

/** Public store settings, cached for a minute and refreshed instantly when admin saves. */
export const getSettings = unstable_cache(loadSettings, ["public-settings"], { revalidate: 60, tags: [SETTINGS_TAG] });
