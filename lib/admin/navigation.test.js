import { describe, expect, it } from "vitest";
import {
  ADMIN_NAVIGATION_GROUPS,
  flattenAdminNavigation,
  resolveAdminNavigationItem,
} from "./navigation";

describe("admin navigation", () => {
  it("keeps the required groups and routes in their product order", () => {
    expect(ADMIN_NAVIGATION_GROUPS.map((group) => group.labelKey)).toEqual([
      "admin.groups.today",
      "admin.groups.calendarAndBookings",
      "admin.groups.clients",
      "admin.groups.catalog",
      "admin.groups.content",
      "admin.groups.insights",
      "admin.groups.settings",
      "admin.groups.help",
    ]);

    expect(flattenAdminNavigation().map((item) => item.href)).toEqual([
      "/admin/dashboard",
      "/admin/kalendar",
      "/admin/bookings",
      "/admin/prepodnevni-termini",
      "/admin/popodnevni-termini",
      "/admin/nedelja",
      "/admin/klijenti",
      "/admin/vip",
      "/admin/services",
      "/admin/packages",
      "/admin/preparati",
      "/admin/promotions",
      "/admin/media",
      "/admin/blog",
      "/admin/announcements",
      "/admin/analitika",
      "/admin/podesavanja",
      "/admin/tutorial",
      "/admin/spec",
    ]);
  });

  it("has a unique route for every navigation item", () => {
    const hrefs = flattenAdminNavigation().map((item) => item.href);

    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("resolves the admin root to the dashboard", () => {
    expect(resolveAdminNavigationItem("/admin")?.href).toBe("/admin/dashboard");
  });

  it("resolves exact item routes", () => {
    expect(resolveAdminNavigationItem("/admin/promotions")?.href).toBe(
      "/admin/promotions"
    );
  });

  it("resolves nested routes without matching a shared prefix", () => {
    expect(resolveAdminNavigationItem("/admin/klijenti/client-42")?.href).toBe(
      "/admin/klijenti"
    );
    expect(resolveAdminNavigationItem("/admin/klijenti-vip")).toBeNull();
  });
});
