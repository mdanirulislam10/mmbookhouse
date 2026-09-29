"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { translate, type DictKey, type Lang } from "./index";

const Ctx = createContext<Lang>("bn");

export function I18nProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <Ctx.Provider value={lang}>{children}</Ctx.Provider>;
}

export function useLang(): Lang {
  return useContext(Ctx);
}

export function useT() {
  const lang = useLang();
  const t = useCallback((key: DictKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);
  return useMemo(() => ({ lang, t }), [lang, t]);
}
