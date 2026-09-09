'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UserRole = 'customer' | 'merchant' | 'admin' | 'pos_staff' | 'seller' | 'pos_operator';
export type ActiveRoleView = 'customer_view' | 'seller_dashboard' | 'pos_counter';

interface UserRoleStore {
  userRole: UserRole;
  activeRole: ActiveRoleView;
  isLoggedIn: boolean;
  setUserRole: (role: UserRole) => void;
  setActiveRole: (view: ActiveRoleView) => void;
  signOut: () => void;
}

export const useUserRoleStore = create<UserRoleStore>()(
  persist(
    (set) => ({
      userRole: 'admin', // default demo permission for full access
      activeRole: 'customer_view',
      isLoggedIn: true,
      setUserRole: (userRole) => set({ userRole, isLoggedIn: true }),
      setActiveRole: (activeRole) => set({ activeRole }),
      signOut: () => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('mm-bookhouse-user-role');
          } catch {
            // ignore in SSR / restricted storage
          }
        }
        set({ userRole: 'customer', activeRole: 'customer_view', isLoggedIn: false });
      },
    }),
    {
      name: 'mm-bookhouse-user-role',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Unified hook with backwards-compatible signature for all components
export function useUserRole() {
  const { userRole, activeRole, isLoggedIn = true, setUserRole, setActiveRole, signOut } = useUserRoleStore();

  const isStaffOrAdmin =
    userRole === 'seller' ||
    userRole === 'merchant' ||
    userRole === 'admin' ||
    userRole === 'pos_operator' ||
    userRole === 'pos_staff';

  const canAccessSeller =
    userRole === 'seller' ||
    userRole === 'merchant' ||
    userRole === 'admin';

  const canAccessPos =
    userRole === 'pos_operator' ||
    userRole === 'pos_staff' ||
    userRole === 'admin';

  return {
    role: userRole,
    userRole,
    isLoggedIn,
    activeRole,
    activeView: activeRole,
    setRole: setUserRole,
    setUserRole,
    switchView: setActiveRole,
    setActiveRole,
    signOut,
    isSellerMode: activeRole === 'seller_dashboard',
    isPosMode: activeRole === 'pos_counter',
    isCustomerView: activeRole === 'customer_view',
    isStaffOrAdmin,
    canAccessSeller,
    canAccessPos,
  };
}
