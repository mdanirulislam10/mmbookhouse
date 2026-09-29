import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { TrackForm } from "./TrackForm";

export const metadata: Metadata = { title: "Track your order" };

export default async function TrackPage() {
  const { t } = await getT();
  return (
    <div className="container-page max-w-2xl py-6">
      <h1 className="text-2xl font-bold">{t("track.title")}</h1>
      <p className="mt-1 text-slate-600">{t("track.text")}</p>
      <TrackForm />
    </div>
  );
}
