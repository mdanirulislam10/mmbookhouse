import type { Metadata } from "next";
import { requireUser } from "@/lib/data/session";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = { title: "New password", robots: { index: false } };

export default async function ResetPasswordPage() {
  await requireUser("/account/reset-password");
  return <ResetForm />;
}
