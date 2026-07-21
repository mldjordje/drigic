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
  default: () => <button type="button" data-testid="admin-notifications">Notifications</button>,
}));

vi.mock("@/components/common/LocaleSwitcher", () => ({
  default: () => <span>Locale utility</span>,
}));

function renderShell(locale = "en", primaryAction = null) {
  document.cookie = `drigic-locale=${locale}; path=/`;
  return render(
    <LocaleProvider initialLocale={locale}>
      <AdminShell primaryAction={primaryAction}>Content</AdminShell>
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
    renderShell();

    const mobileNavigation = document.querySelector(".admin-template-mobile-nav");
    expect(mobileNavigation).toHaveAccessibleName("Navigation");
    expect(within(mobileNavigation).getAllByRole("link")).toHaveLength(4);
    expect(within(mobileNavigation).getAllByRole("button")).toHaveLength(1);
    expect(within(mobileNavigation).getByRole("link", { name: "Today" })).toHaveAttribute("href", "/admin/dashboard");
    expect(within(mobileNavigation).getByRole("link", { name: "Calendar" })).toHaveAttribute("href", "/admin/kalendar");
    expect(within(mobileNavigation).getByRole("link", { name: "Clients" })).toHaveAttribute("href", "/admin/klijenti");
    expect(within(mobileNavigation).getByRole("link", { name: "Bookings" })).toHaveAttribute("href", "/admin/bookings");
    expect(within(mobileNavigation).getByRole("button", { name: "More" })).toBeInTheDocument();
  });

  it("localizes the More label", () => {
    renderShell("sr");
    expect(within(document.querySelector(".admin-template-mobile-nav")).getByRole("button", { name: "Više" })).toBeInTheDocument();
  });

  it("marks the current direct phone destination", () => {
    pathname = "/admin/kalendar";
    renderShell();

    const mobileNavigation = document.querySelector(".admin-template-mobile-nav");
    expect(mobileNavigation).toHaveAccessibleName("Navigation");
    expect(within(mobileNavigation).getByRole("link", { name: "Calendar" })).toHaveAttribute("aria-current", "page");
    expect(within(mobileNavigation).getByRole("link", { name: "Today" })).not.toHaveAttribute("aria-current");
    expect(within(mobileNavigation).getByRole("button", { name: "More" })).not.toHaveAttribute("aria-current");
  });

  it("marks More current for a secondary destination while retaining its localized visible label", () => {
    pathname = "/admin/services";
    renderShell();

    const mobileNavigation = document.querySelector(".admin-template-mobile-nav");
    const moreButton = within(mobileNavigation).getByRole("button", { name: "More: Services" });
    expect(moreButton).toHaveClass("is-active");
    expect(moreButton).toHaveAttribute("aria-current", "page");
    expect(moreButton).toHaveTextContent("More");
  });

  it("does not mark More current for an unknown pathname", () => {
    pathname = "/not-an-admin-route";
    renderShell();

    const moreButton = within(document.querySelector(".admin-template-mobile-nav")).getByRole("button", { name: "More" });
    expect(moreButton).not.toHaveClass("is-active");
    expect(moreButton).not.toHaveAttribute("aria-current");
  });

  it("marks a direct destination current for nested routes", () => {
    pathname = "/admin/kalendar/week/2026-07-21";
    renderShell();

    const mobileNavigation = document.querySelector(".admin-template-mobile-nav");
    expect(within(mobileNavigation).getByRole("link", { name: "Calendar" })).toHaveAttribute("aria-current", "page");
  });

  it("opens More as a named, grouped drawer", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole("button", { name: "More" }));

    const drawer = screen.getByRole("dialog", { name: "Navigation" });
    expect(drawer).toBeInTheDocument();
    expect(within(drawer).getAllByRole("navigation")).toHaveLength(9);
    expect(within(drawer).getByText("Locale utility")).toBeInTheDocument();
  });

  it("uses the localized menu-close label in the More drawer", async () => {
    const user = userEvent.setup();
    renderShell("sr");

    await user.click(screen.getByRole("button", { name: "Više" }));

    expect(screen.getByRole("dialog").querySelector("button[aria-label='Zatvori meni']")).toBeInTheDocument();
  });

  it("closes More on Escape and restores focus to its trigger", async () => {
    const user = userEvent.setup();
    renderShell();
    const trigger = screen.getByRole("button", { name: "More" });

    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog", { name: "Navigation" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes More when a drawer link is activated", async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(screen.getByRole("button", { name: "More" }));

    await user.click(within(screen.getByRole("dialog", { name: "Navigation" })).getByRole("link", { name: "Settings" }));

    expect(screen.queryByRole("dialog", { name: "Navigation" })).not.toBeInTheDocument();
  });

  it("closes an open drawer when the pathname changes", async () => {
    const user = userEvent.setup();
    const view = renderShell();
    await user.click(screen.getByRole("button", { name: "More" }));
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

  it("keeps notifications available in the topbar", () => {
    renderShell();
    expect(within(document.querySelector(".admin-template-topbar")).getByTestId("admin-notifications")).toBeInTheDocument();
  });

  it("renders an optional page primary action in the topbar", () => {
    renderShell("en", <button type="button">Add appointment</button>);
    expect(within(document.querySelector(".admin-template-topbar")).getByRole("button", { name: "Add appointment" })).toBeInTheDocument();
  });

  it("uses unique IDs for desktop and drawer group labels", async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(screen.getByRole("button", { name: "More" }));

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

  it("keeps legacy 960px shell declarations out of the tablet cascade", () => {
    const legacyBlock = stylesheet.match(/@media\s*\(max-width:\s*960px\)\s*\{([\s\S]*?)\/\* Responsive shell:/)?.[1] || "";

    expect(legacyBlock).not.toMatch(/\.admin-template-content\s*\{/);
    expect(legacyBlock).not.toMatch(/\.admin-template-topbar-actions\s*\{/);
  });

  it("guarantees 44px tablet and drawer navigation touch targets", () => {
    const tabletBlock = stylesheet.match(/@media\s*\(min-width:\s*768px\)\s*and\s*\(max-width:\s*1023px\)\s*\{([\s\S]*?)@media\s*\(max-width:\s*767px\)/)?.[1] || "";
    const drawerRule = stylesheet.match(/\.admin-template-drawer\s+\.admin-template-nav-item\s*\{([\s\S]*?)\}/)?.[1] || "";

    expect(tabletBlock).toMatch(/\.admin-template-menu-btn\s*\{[\s\S]*?min-width:\s*44px[\s\S]*?min-height:\s*44px/);
    expect(drawerRule).toMatch(/box-sizing:\s*border-box/);
    expect(drawerRule).toMatch(/min-height:\s*44px/);
    expect(drawerRule).toMatch(/align-items:\s*center/);
  });
});
