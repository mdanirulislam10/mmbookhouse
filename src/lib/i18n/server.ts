import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LANG, LANG_COOKIE, isLang, translate, type DictKey, type Lang } from "./index";

export async function getLang(): Promise<Lang> {
  const value = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(value) ? value : DEFAULT_LANG;
}

export async function getT() {
  const lang = await getLang();
  return { lang, t: (key: DictKey, vars?: Record<string, string | number>) => translate(lang, key, vars) };
}
