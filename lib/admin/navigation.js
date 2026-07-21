export const ADMIN_NAVIGATION_GROUPS = [
  {
    labelKey: "admin.groups.today",
    items: [{ href: "/admin/dashboard", labelKey: "admin.dashboard" }],
  },
  {
    labelKey: "admin.groups.calendarAndBookings",
    items: [
      { href: "/admin/kalendar", labelKey: "admin.calendar" },
      { href: "/admin/bookings", labelKey: "admin.bookings" },
      { href: "/admin/prepodnevni-termini", labelKey: "admin.morningSlots" },
      { href: "/admin/popodnevni-termini", labelKey: "admin.afternoonSlots" },
      { href: "/admin/nedelja", labelKey: "admin.sunday" },
    ],
  },
  {
    labelKey: "admin.groups.clients",
    items: [
      { href: "/admin/klijenti", labelKey: "admin.clients" },
      { href: "/admin/vip", labelKey: "admin.vip" },
    ],
  },
  {
    labelKey: "admin.groups.catalog",
    items: [
      { href: "/admin/services", labelKey: "admin.services" },
      { href: "/admin/packages", labelKey: "admin.packages" },
      { href: "/admin/preparati", labelKey: "admin.products" },
      { href: "/admin/promotions", labelKey: "admin.promotions" },
    ],
  },
  {
    labelKey: "admin.groups.content",
    items: [
      { href: "/admin/media", labelKey: "admin.media" },
      { href: "/admin/blog", labelKey: "admin.blog" },
      { href: "/admin/announcements", labelKey: "admin.announcements" },
    ],
  },
  {
    labelKey: "admin.groups.insights",
    items: [{ href: "/admin/analitika", labelKey: "admin.analytics" }],
  },
  {
    labelKey: "admin.groups.settings",
    items: [{ href: "/admin/podesavanja", labelKey: "admin.settings" }],
  },
  {
    labelKey: "admin.groups.help",
    items: [
      { href: "/admin/tutorial", labelKey: "admin.tutorial" },
      { href: "/admin/spec", labelKey: "admin.spec" },
    ],
  },
];

export function flattenAdminNavigation(groups = ADMIN_NAVIGATION_GROUPS) {
  return groups.flatMap((group) => group.items);
}

export function resolveAdminNavigationItem(pathname, groups = ADMIN_NAVIGATION_GROUPS) {
  const normalizedPathname = pathname === "/admin" ? "/admin/dashboard" : pathname;

  return (
    flattenAdminNavigation(groups).find(
      (item) =>
        normalizedPathname === item.href ||
        normalizedPathname.startsWith(`${item.href}/`)
    ) || null
  );
}
