import { bn as commonBn, en as commonEn } from "./dict/common";
import { bn as shopBn, en as shopEn } from "./dict/shop";
import { bn as accountBn, en as accountEn } from "./dict/account";
import { bn as adminBn, en as adminEn } from "./dict/admin";
import { bn as admin2Bn, en as admin2En } from "./dict/admin2";

export const LANGS = ["bn", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "bn";
export const LANG_COOKIE = "mm_lang";

const en = { ...commonEn, ...shopEn, ...accountEn, ...adminEn, ...admin2En };
const bn = { ...commonBn, ...shopBn, ...accountBn, ...adminBn, ...admin2Bn };
export const dictionaries: { en: typeof en; bn: typeof bn } = { en, bn };

export type DictKey = keyof typeof en;

export function isLang(v: unknown): v is Lang {
  return v === "bn" || v === "en";
}

export function translate(lang: Lang, key: DictKey, vars?: Record<string, string | number>): string {
  const raw: string = dictionaries[lang][key] ?? dictionaries.en[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/** Pick the Bengali text when the UI is Bengali and it exists; else the English fallback. */
export function pick(lang: Lang, en: string | null | undefined, bn: string | null | undefined): string {
  if (lang === "bn" && bn && bn.trim()) return bn;
  return en ?? bn ?? "";
}
