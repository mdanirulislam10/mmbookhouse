import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/data/session";
import { first, safeNext } from "@/lib/utils";
import { landingPath } from "@/lib/auth/landing";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const next = safeNext(first(sp.next), "/account");
  if (await getSessionUser()) redirect(await landingPath(next));
  return <LoginForm next={next} initialMode={first(sp.mode) === "signup" ? "signup" : "signin"} linkError={first(sp.error) === "link"} googleEnabled={process.env.NEXT_PUBLIC_GOOGLE_LOGIN === "true"} />;
}
