import type { StaffRole } from "@/lib/types";

export type Area =
  | "dashboard"
  | "orders"
  | "books"
  | "inventory"
  | "catalog"
  | "marketing"
  | "reviews"
  | "customers"
  | "reports"
  | "enquiries"
  | "partners"
  | "settings"
  | "staff"
  | "backups"
  | "audit";

const MATRIX: Record<StaffRole, Area[]> = {
  super_admin: ["dashboard", "orders", "books", "inventory", "catalog", "marketing", "reviews", "customers", "reports", "enquiries", "partners", "settings", "staff", "backups", "audit"],
  inventory_manager: ["dashboard", "books", "inventory", "catalog", "reviews"],
  dispatch_staff: ["dashboard", "orders"],
};

export function can(role: StaffRole, area: Area): boolean {
  return MATRIX[role].includes(area);
}

/** Roles allowed for an area (used by server actions). super_admin is always included. */
export function rolesFor(area: Area): StaffRole[] {
  return (Object.keys(MATRIX) as StaffRole[]).filter((r) => MATRIX[r].includes(area));
}

/** Wholesale cost, profit and customer exports are owner-only. */
export function canSeeMoney(role: StaffRole): boolean {
  return role === "super_admin";
}

export const ROLE_LABEL: Record<StaffRole, { en: string; bn: string }> = {
  super_admin: { en: "Super Admin", bn: "সুপার অ্যাডমিন" },
  inventory_manager: { en: "Inventory Manager", bn: "ইনভেন্টরি ম্যানেজার" },
  dispatch_staff: { en: "Dispatch Staff", bn: "ডিসপ্যাচ কর্মী" },
};
