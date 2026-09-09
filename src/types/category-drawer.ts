export type DrawerSectionId = 'digital' | 'departments' | 'trending' | 'help';

export interface CategoryItem {
  id: string;
  title: string;
  titleBn: string;
  slug: string;
  fullPath?: string;
  iconName?: string;
  badge?: 'NEW' | 'HOT' | 'SALE' | 'LIVE' | 'OFFER' | string;
  hasSubcategories?: boolean;
  subcategories?: CategoryItem[];
}

export interface DrawerSection {
  id: DrawerSectionId;
  title: string;
  titleBn: string;
  items: CategoryItem[];
}

export interface DrawerUserState {
  isLoggedIn: boolean;
  name?: string;
  email?: string;
  avatarUrl?: string;
}

export interface CategoryDrawerStore {
  isOpen: boolean;
  activeSubmenu: CategoryItem | null;
  user: DrawerUserState;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  setActiveSubmenu: (category: CategoryItem | null) => void;
  setUser: (user: Partial<DrawerUserState>) => void;
}
