'use client';

import { create } from 'zustand';
import { CategoryDrawerStore, CategoryItem, DrawerUserState } from '@/types/category-drawer';

const DEFAULT_USER: DrawerUserState = {
  isLoggedIn: false,
  name: undefined,
  email: undefined,
  avatarUrl: undefined,
};

export const useCategoryDrawer = create<CategoryDrawerStore>((set) => ({
  isOpen: false,
  activeSubmenu: null,
  user: DEFAULT_USER,
  openDrawer: () => {
    set({ isOpen: true, activeSubmenu: null });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('category-drawer-opened'));
    }
  },
  closeDrawer: () => {
    set({ isOpen: false, activeSubmenu: null });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('category-drawer-closed'));
    }
  },
  toggleDrawer: () => {
    set((state) => {
      const nextState = !state.isOpen;
      return { isOpen: nextState, activeSubmenu: null };
    });
  },
  setActiveSubmenu: (category: CategoryItem | null) => {
    set({ activeSubmenu: category });
  },
  setUser: (userData: Partial<DrawerUserState>) => {
    set((state) => ({
      user: { ...state.user, ...userData },
    }));
  },
}));

/**
 * Helper to dispatch open event from components that may not directly import zustand
 */
export function triggerOpenCategoryDrawer() {
  useCategoryDrawer.getState().openDrawer();
}

/**
 * Helper to dispatch close event
 */
export function triggerCloseCategoryDrawer() {
  useCategoryDrawer.getState().closeDrawer();
}
