'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type FestiveThemeMode = 'default' | 'durga_puja' | 'eid' | 'malda_book_fair';

export interface FestiveThemeConfig {
  id: FestiveThemeMode;
  name: string;
  nameBn: string;
  greetingBn: string;
  greetingEn: string;
  ribbonBn: string;
  ribbonEn: string;
  bgGradient: string;
  accentBorder: string;
  ribbonBg: string;
}

export const FESTIVE_THEMES: Record<FestiveThemeMode, FestiveThemeConfig> = {
  default: {
    id: 'default',
    name: 'Standard Amazon Dark',
    nameBn: 'স্ট্যান্ডার্ড অ্যামাজন ডার্ক',
    greetingBn: '',
    greetingEn: '',
    ribbonBn: '',
    ribbonEn: '',
    bgGradient: 'from-[#131921] to-[#131921]',
    accentBorder: 'border-[#febd69]',
    ribbonBg: 'bg-amber-500 text-gray-950',
  },
  durga_puja: {
    id: 'durga_puja',
    name: 'Durga Puja Festival',
    nameBn: 'শুভ শারদীয়া দুর্গোৎসব',
    greetingBn: '🌸 শুভ শারদীয়ার প্রীতি ও শুভেচ্ছা — সব বইয়ে অতিরিক্ত ২৫% ছাড়!',
    greetingEn: '🌸 Happy Durga Puja — Special 25% Off Across All Books!',
    ribbonBn: '🪔 শারদীয় অফার ২৫% ছাড়',
    ribbonEn: '🪔 Puja Offer 25% OFF',
    bgGradient: 'from-[#1a0f12] via-[#2a131a] to-[#131921]',
    accentBorder: 'border-red-400',
    ribbonBg: 'bg-gradient-to-r from-red-600 to-amber-500 text-white',
  },
  eid: {
    id: 'eid',
    name: 'Eid Mubarak Celebration',
    nameBn: 'পবিত্র ঈদ মুবারক',
    greetingBn: '🌙 ঈদ মুবারক! ইসলামি সাহিত্য ও সমস্ত একাডেমিক বইয়ে বিশেষ রিবেট!',
    greetingEn: '🌙 Eid Mubarak! Special Festive Savings Across All Books!',
    ribbonBn: '🌙 ঈদ স্পেশাল ছাড়',
    ribbonEn: '🌙 Eid Mubarak Special',
    bgGradient: 'from-[#0b1f17] via-[#132c21] to-[#131921]',
    accentBorder: 'border-emerald-400',
    ribbonBg: 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white',
  },
  malda_book_fair: {
    id: 'malda_book_fair',
    name: 'Malda District Book Fair',
    nameBn: 'মালদা জেলা বইমেলা ২০২৬',
    greetingBn: '📚 মালদা জেলা বইমেলা ২০২৬ উপলক্ষে আমাদের সমস্ত প্রকাশনীতে ফ্ল্যাট ছাড়!',
    greetingEn: '📚 Malda District Book Fair 2026 Special Publisher Discounts!',
    ribbonBn: '🎪 বইমেলা ২০২৬ স্পেশাল',
    ribbonEn: '🎪 Book Fair 2026 Deal',
    bgGradient: 'from-[#1a1226] via-[#241738] to-[#131921]',
    accentBorder: 'border-purple-400',
    ribbonBg: 'bg-gradient-to-r from-purple-600 to-amber-500 text-white',
  },
};

interface FestiveThemeStore {
  activeTheme: FestiveThemeMode;
  setFestiveTheme: (theme: FestiveThemeMode) => void;
  resetTheme: () => void;
}

const FESTIVE_STORAGE_KEY = 'mm-bookhouse-festive-theme';
const FESTIVE_CHANNEL_NAME = 'mm-bookhouse-festive-channel';

let festiveBroadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    festiveBroadcastChannel = new BroadcastChannel(FESTIVE_CHANNEL_NAME);
  } catch {
    festiveBroadcastChannel = null;
  }
}

function notifyTabsOfFestiveChange() {
  if (festiveBroadcastChannel) {
    try {
      festiveBroadcastChannel.postMessage({ type: 'FESTIVE_THEME_CHANGED', timestamp: Date.now() });
    } catch {
      // ignore
    }
  }
}

export const useFestiveThemeStore = create<FestiveThemeStore>()(
  persist(
    (set) => ({
      activeTheme: 'default',
      setFestiveTheme: (activeTheme) => {
        set({ activeTheme });
        notifyTabsOfFestiveChange();
      },
      resetTheme: () => {
        set({ activeTheme: 'default' });
        notifyTabsOfFestiveChange();
      },
    }),
    {
      name: FESTIVE_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Cross-tab sync
if (typeof window !== 'undefined') {
  if (festiveBroadcastChannel) {
    festiveBroadcastChannel.onmessage = (event) => {
      if (event.data?.type === 'FESTIVE_THEME_CHANGED') {
        useFestiveThemeStore.persist.rehydrate();
      }
    };
  }

  window.addEventListener('storage', (event) => {
    if (event.key === FESTIVE_STORAGE_KEY) {
      useFestiveThemeStore.persist.rehydrate();
    }
  });
}

export function useFestiveTheme() {
  const { activeTheme, setFestiveTheme, resetTheme } = useFestiveThemeStore();
  const currentConfig = FESTIVE_THEMES[activeTheme] || FESTIVE_THEMES.default;

  return {
    theme: activeTheme,
    activeTheme,
    themeConfig: currentConfig,
    currentConfig,
    isFestive: activeTheme !== 'default',
    setTheme: setFestiveTheme,
    setFestiveTheme,
    resetTheme,
  };
}
