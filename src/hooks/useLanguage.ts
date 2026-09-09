'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppLanguage } from '@/types/header';

interface LanguageStore {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      language: 'bn', // Default primary language is Bengali
      setLanguage: (language) => set({ language }),
      toggleLanguage: () =>
        set((state) => ({ language: state.language === 'bn' ? 'en' : 'bn' })),
    }),
    {
      name: 'mm-bookhouse-language',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function useLanguage() {
  const { language, setLanguage, toggleLanguage } = useLanguageStore();

  const isBengali = language === 'bn';
  const isEnglish = language === 'en';

  return {
    language,
    setLanguage,
    toggleLanguage,
    isBengali,
    isEnglish,
    label: isBengali ? 'বাংলা' : 'EN',
  };
}
