/**
 * `icon` maps to a glyph in components/admin/ui/AdminIcon.jsx and `descriptionKey`
 * to a one-line "what does this screen do" string, shown in the sidebar tooltip,
 * the topbar subtitle and the dashboard module cards.
 */
export const ADMIN_NAVIGATION_GROUPS = [
  {
    labelKey: "admin.groups.today",
    icon: "today",
    items: [
      {
        href: "/admin/dashboard",
        labelKey: "admin.dashboard",
        icon: "dashboard",
        descriptionKey: "admin.desc.dashboard",
      },
    ],
  },
  {
    labelKey: "admin.groups.calendarAndBookings",
    icon: "calendar",
    items: [
      {
        href: "/admin/kalendar",
        labelKey: "admin.calendar",
        icon: "calendar",
        descriptionKey: "admin.desc.calendar",
      },
      {
        href: "/admin/bookings",
        labelKey: "admin.bookings",
        icon: "bookings",
        descriptionKey: "admin.desc.bookings",
      },
      {
        href: "/admin/prepodnevni-termini",
        labelKey: "admin.morningSlots",
        icon: "sunrise",
        descriptionKey: "admin.desc.morningSlots",
      },
      {
        href: "/admin/popodnevni-termini",
        labelKey: "admin.afternoonSlots",
        icon: "sun",
        descriptionKey: "admin.desc.afternoonSlots",
      },
      {
        href: "/admin/nedelja",
        labelKey: "admin.sunday",
        icon: "weekend",
        descriptionKey: "admin.desc.sunday",
      },
    ],
  },
  {
    labelKey: "admin.groups.clients",
    icon: "clients",
    items: [
      {
        href: "/admin/klijenti",
        labelKey: "admin.clients",
        icon: "clients",
        descriptionKey: "admin.desc.clients",
      },
      {
        href: "/admin/vip",
        labelKey: "admin.vip",
        icon: "vip",
        descriptionKey: "admin.desc.vip",
      },
    ],
  },
  {
    labelKey: "admin.groups.catalog",
    icon: "catalog",
    items: [
      {
        href: "/admin/services",
        labelKey: "admin.services",
        icon: "services",
        descriptionKey: "admin.desc.services",
      },
      {
        href: "/admin/packages",
        labelKey: "admin.packages",
        icon: "packages",
        descriptionKey: "admin.desc.packages",
      },
      {
        href: "/admin/preparati",
        labelKey: "admin.products",
        icon: "products",
        descriptionKey: "admin.desc.products",
      },
      {
        href: "/admin/promotions",
        labelKey: "admin.promotions",
        icon: "promotions",
        descriptionKey: "admin.desc.promotions",
      },
    ],
  },
  {
    labelKey: "admin.groups.content",
    icon: "content",
    items: [
      {
        href: "/admin/media",
        labelKey: "admin.media",
        icon: "media",
        descriptionKey: "admin.desc.media",
      },
      {
        href: "/admin/blog",
        labelKey: "admin.blog",
        icon: "blog",
        descriptionKey: "admin.desc.blog",
      },
      {
        href: "/admin/announcements",
        labelKey: "admin.announcements",
        icon: "announcements",
        descriptionKey: "admin.desc.announcements",
      },
      {
        href: "/admin/kampanje",
        labelKey: "admin.campaigns",
        icon: "campaigns",
        descriptionKey: "admin.desc.campaigns",
      },
    ],
  },
  {
    labelKey: "admin.groups.insights",
    icon: "analytics",
    items: [
      {
        href: "/admin/analitika",
        labelKey: "admin.analytics",
        icon: "analytics",
        descriptionKey: "admin.desc.analytics",
      },
    ],
  },
  {
    labelKey: "admin.groups.settings",
    icon: "settings",
    items: [
      {
        href: "/admin/podesavanja",
        labelKey: "admin.settings",
        icon: "settings",
        descriptionKey: "admin.desc.settings",
      },
    ],
  },
  {
    labelKey: "admin.groups.help",
    icon: "help",
    items: [
      {
        href: "/admin/tutorial",
        labelKey: "admin.tutorial",
        icon: "tutorial",
        descriptionKey: "admin.desc.tutorial",
      },
      {
        href: "/admin/spec",
        labelKey: "admin.spec",
        icon: "spec",
        descriptionKey: "admin.desc.spec",
      },
    ],
  },
];

export function flattenAdminNavigation(groups = ADMIN_NAVIGATION_GROUPS) {
  return groups.flatMap((group) => group.items);
}

export function resolveAdminNavigationItem(pathname, groups = ADMIN_NAVIGATION_GROUPS) {
  const normalizedPathname = pathname === "/admin" ? "/admin/dashboard" : pathname;

  return flattenAdminNavigation(groups)
    .filter(
      (item) =>
        normalizedPathname === item.href ||
        normalizedPathname.startsWith(`${item.href}/`)
    )
    .reduce(
      (mostSpecificItem, item) =>
        !mostSpecificItem || item.href.length > mostSpecificItem.href.length
          ? item
          : mostSpecificItem,
      null
    );
}
