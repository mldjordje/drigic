import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LocaleProvider from "@/components/common/LocaleProvider";
import AdminShell from "./AdminShell";

let pathname = "/admin/dashboard";

vi.mock("next/link", () => ({
  default: ({ children, ...props }) => <a {...props}>{children}</a>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

vi.mock("@/components/admin/AdminNotificationsBell", () => ({
  default: () => null,
}));

vi.mock("@/components/common/LocaleSwitcher", () => ({
  default: () => <span>Locale utility</span>,
}));

function renderShell(locale = "en") {
  document.cookie = `drigic-locale=${locale}; path=/`;
  return render(
    <LocaleProvider initialLocale={locale}>
      <AdminShell>Content</AdminShell>
    </LocaleProvider>
  );
}

beforeEach(() => {
  pathname = "/admin/dashboard";
});

afterEach(cleanup);

describe("AdminShell responsive navigation", () => {
  it("renders the grouped desktop navigation with labelled landmarks", () => {
    renderShell();

    const desktopSidebar = document.querySelector(".admin-template-sidebar--desktop");
    expect(desktopSidebar).toBeInTheDocument();
    expect(within(desktopSidebar).getAllByRole("navigation")).toHaveLength(9);
    within(desktopSidebar).getAllByRole("navigation").forEach((landmark) => {
      const headingId = landmark.getAttribute("aria-labelledby");
      expect(headingId).toBeTruthy();
      expect(document.getElementById(headingId)).toBeTruthy();
    });
  });

  it("provides exactly five labelled phone navigation destinations or actions", () => {
    renderShell("sr");

    const mobileNavigation = document.querySelector(".admin-template-mobile-nav");
    expect(mobileNavigation).toHaveAccessibleName("Navigacija");
    expect(within(mobileNavigation).getAllByRole("link")).toHaveLength(4);
    expect(within(mobileNavigation).getAllByRole("button")).toHaveLength(1);
    expect(within(mobileNavigation).getByRole("link", { name: "Danas" })).toHaveAttribute("href", "/admin/dashboard");
    expect(within(mobileNavigation).getByRole("link", { name: "Kalendar" })).toHaveAttribute("href", "/admin/kalendar");
    expect(within(mobileNavigation).getByRole("link", { name: "Klijenti" })).toHaveAttribute("href", "/admin/klijenti");
    expect(within(mobileNavigation).getByRole("link", { name: "Termini" })).toHaveAttribute("href", "/admin/bookings");
    expect(within(mobileNavigation).getByRole("button", { name: "Više" })).toBeInTheDocument();
  });

  it("marks the current direct phone destination", () => {
    pathname = "/admin/kalendar";
    renderShell();

    const mobileNavigation = document.querySelector(".admin-template-mobile-nav");
    expect(mobileNavigation).toHaveAccessibleName("Navigation");
    expect(within(mobileNavigation).getByRole("link", { name: "Calendar" })).toHaveAttribute("aria-current", "page");
    expect(within(mobileNavigation).getByRole("link", { name: "Today" })).not.toHaveAttribute("aria-current");
  });

  it("opens More as a named, grouped drawer", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole("button", { name: "Više" }));

    const drawer = screen.getByRole("dialog", { name: "Navigation" });
    expect(drawer).toBeInTheDocument();
    expect(within(drawer).getAllByRole("navigation")).toHaveLength(9);
    expect(within(drawer).getByText("Locale utility")).toBeInTheDocument();
  });

  it("closes More on Escape and restores focus to its trigger", async () => {
    const user = userEvent.setup();
    renderShell();
    const trigger = screen.getByRole("button", { name: "Više" });

    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog", { name: "Navigation" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes More when a drawer link is activated", async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(screen.getByRole("button", { name: "Više" }));

    await user.click(within(screen.getByRole("dialog", { name: "Navigation" })).getByRole("link", { name: "Settings" }));

    expect(screen.queryByRole("dialog", { name: "Navigation" })).not.toBeInTheDocument();
  });

  it("closes an open drawer when the pathname changes", async () => {
    const user = userEvent.setup();
    const view = renderShell();
    await user.click(screen.getByRole("button", { name: "Više" }));
    expect(screen.getByRole("dialog", { name: "Navigation" })).toBeInTheDocument();

    pathname = "/admin/kalendar";
    view.rerender(
      <LocaleProvider initialLocale="en">
        <AdminShell>Content</AdminShell>
      </LocaleProvider>
    );

    expect(screen.queryByRole("dialog", { name: "Navigation" })).not.toBeInTheDocument();
  });

  it("keeps Calendar and Clients out of the always-visible topbar", () => {
    renderShell();

    const topbar = document.querySelector(".admin-template-topbar");
    expect(within(topbar).queryByRole("link", { name: "Calendar" })).not.toBeInTheDocument();
    expect(within(topbar).queryByRole("link", { name: "Clients" })).not.toBeInTheDocument();
  });

  it("uses unique IDs for desktop and drawer group labels", async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(screen.getByRole("button", { name: "Više" }));

    const ids = Array.from(document.querySelectorAll("[id]"), (element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    document.querySelectorAll("nav[aria-labelledby]").forEach((landmark) => {
      expect(document.getElementById(landmark.getAttribute("aria-labelledby"))).toBeTruthy();
    });
  });
});

describe("AdminShell responsive stylesheet contracts", () => {
  const stylesheet = readFileSync(resolve(process.cwd(), "app/admin/admin-template.css"), "utf8");

  it("defines the phone, tablet, and desktop shell breakpoints with a safe-area bottom bar", () => {
    expect(stylesheet).toMatch(/@media\s*\(max-width:\s*767px\)/);
    expect(stylesheet).toMatch(/@media\s*\(min-width:\s*768px\)\s*and\s*\(max-width:\s*1023px\)/);
    expect(stylesheet).toMatch(/@media\s*\(min-width:\s*1024px\)/);
    expect(stylesheet).toMatch(/safe-area-inset-bottom/);
    expect(stylesheet).toMatch(/admin-template-content[\s\S]{0,500}padding-bottom/);
  });
});
