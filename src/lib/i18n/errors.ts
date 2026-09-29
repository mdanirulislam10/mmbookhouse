import { dictionaries, translate, type DictKey, type Lang } from "./index";

/** Turns an action error code (e.g. OUT_OF_STOCK) into a friendly, translated sentence. */
export function errorMessage(lang: Lang, code: string | undefined, detail?: string): string {
  const key = `err.${code}` as DictKey;
  if (code && key in dictionaries.en) return translate(lang, key, { detail: detail ?? "" });
  return translate(lang, "common.error");
}
