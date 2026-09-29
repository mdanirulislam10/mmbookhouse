import { describe, expect, it } from "vitest";
import { can, canSeeMoney, rolesFor, type Area } from "@/lib/admin/permissions";

const AREAS: Area[] = ["dashboard", "orders", "books", "inventory", "catalog", "marketing", "reviews", "customers", "reports", "enquiries", "settings", "staff", "backups", "audit"];

describe("staff role matrix", () => {
  it("super admin can open every area", () => {
    for (const a of AREAS) expect(can("super_admin", a)).toBe(true);
  });

  it("dispatch staff only see the dashboard and orders", () => {
    expect(AREAS.filter((a) => can("dispatch_staff", a))).toEqual(["dashboard", "orders"]);
  });

  it("inventory managers handle the catalogue and stock, never orders, money, settings or people", () => {
    expect(AREAS.filter((a) => can("inventory_manager", a))).toEqual(["dashboard", "books", "inventory", "catalog", "reviews"]);
    for (const a of ["orders", "customers", "reports", "settings", "staff", "backups", "audit", "marketing", "enquiries"] as Area[]) {
      expect(rolesFor(a)).not.toContain("inventory_manager");
    }
  });

  it("owner-only areas list only the super admin", () => {
    for (const a of ["customers", "reports", "enquiries", "settings", "staff", "backups", "audit", "marketing"] as Area[]) {
      expect(rolesFor(a)).toEqual(["super_admin"]);
    }
  });

  it("only the super admin sees cost and profit", () => {
    expect(canSeeMoney("super_admin")).toBe(true);
    expect(canSeeMoney("inventory_manager")).toBe(false);
    expect(canSeeMoney("dispatch_staff")).toBe(false);
  });
});
