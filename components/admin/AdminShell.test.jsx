import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LocaleProvider from "@/components/common/LocaleProvider";
import AdminShell from "./AdminShell";

vi.mock("next/link", () => ({
  default: ({ children, ...props }) => <a {...props}>{children}</a>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/dashboard",
}));

vi.mock("@/components/admin/AdminNotificationsBell", () => ({
  default: () => null,
}));

vi.mock("@/components/common/LocaleSwitcher", () => ({
  default: () => null,
}));

describe("AdminShell navigation landmarks", () => {
  it("labels every navigation landmark with its visible group heading", () => {
    render(
      <LocaleProvider initialLocale="en">
        <AdminShell>Content</AdminShell>
      </LocaleProvider>
    );

    const navigationLandmarks = screen.getAllByRole("navigation");

    expect(navigationLandmarks).toHaveLength(9);
    navigationLandmarks.forEach((landmark) => {
      const headingId = landmark.getAttribute("aria-labelledby");

      expect(headingId).toBeTruthy();
      expect(document.getElementById(headingId)).toBeTruthy();
    });
  });
});
