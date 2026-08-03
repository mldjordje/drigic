/**
 * Single source of truth for admin panel iconography.
 *
 * Every icon is a 24x24 stroked line glyph drawn with `currentColor`, so an icon
 * always matches the text colour of the control it sits in. Keep new glyphs on
 * the same 24x24 grid with a 1.7 stroke so the set stays visually consistent.
 */

const ICON_PATHS = {
  // ── Navigation / modules ──
  dashboard: (
    <>
      <rect x="3" y="3.75" width="7.5" height="7" rx="1.6" />
      <rect x="13.5" y="3.75" width="7.5" height="11" rx="1.6" />
      <rect x="3" y="14.25" width="7.5" height="6" rx="1.6" />
      <rect x="13.5" y="17.75" width="7.5" height="2.5" rx="1.25" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.25" y="5" width="17.5" height="15.5" rx="2.4" />
      <path d="M3.25 9.75h17.5M8 3v4M16 3v4" />
      <path d="M7.75 13.5h2M11.25 13.5h2M14.75 13.5h2M7.75 17h2M11.25 17h2" />
    </>
  ),
  bookings: (
    <>
      <rect x="3.25" y="5" width="17.5" height="15.5" rx="2.4" />
      <path d="M3.25 9.75h17.5M8 3v4M16 3v4" />
      <path d="M8.5 14.75l2.25 2.25 4.5-4.5" />
    </>
  ),
  sunrise: (
    <>
      <path d="M12 3.5v4M5.5 10 4 8.5M18.5 10 20 8.5M3 17h3M18 17h3" />
      <path d="M8 17a4 4 0 0 1 8 0" />
      <path d="M2.75 20.5h18.5" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.75v2.5M12 18.75v2.5M4.4 4.4l1.75 1.75M17.85 17.85l1.75 1.75M2.75 12h2.5M18.75 12h2.5M4.4 19.6l1.75-1.75M17.85 6.15l1.75-1.75" />
    </>
  ),
  weekend: (
    <>
      <rect x="3.25" y="5" width="17.5" height="15.5" rx="2.4" />
      <path d="M3.25 9.75h17.5M8 3v4M16 3v4" />
      <circle cx="16.25" cy="15.75" r="2.25" />
    </>
  ),
  clients: (
    <>
      <circle cx="9.25" cy="8.25" r="3.5" />
      <path d="M2.75 20c.6-3.6 3-5.5 6.5-5.5s5.9 1.9 6.5 5.5" />
      <path d="M16.75 5.25a3.25 3.25 0 0 1 0 6.25M18 14.9c2.1.55 3.15 2.15 3.45 4.35" />
    </>
  ),
  vip: (
    <>
      <path d="M3.5 8.25l3.75 3 4.75-6 4.75 6 3.75-3-1.75 10.5H5.25L3.5 8.25Z" />
      <path d="M5.25 18.75h13.5" />
    </>
  ),
  services: (
    <>
      <path d="M11 3.25 12.6 7.4 16.75 9 12.6 10.6 11 14.75 9.4 10.6 5.25 9 9.4 7.4 11 3.25Z" />
      <path d="M17.5 14.25l.85 2.15 2.15.85-2.15.85-.85 2.15-.85-2.15-2.15-.85 2.15-.85.85-2.15Z" />
    </>
  ),
  packages: (
    <>
      <path d="M12 2.75 20.5 7v10L12 21.25 3.5 17V7L12 2.75Z" />
      <path d="M3.5 7 12 11.4 20.5 7M12 11.4v9.85" />
    </>
  ),
  products: (
    <>
      <path d="M10 2.75h4v3h-4z" />
      <path d="M9.25 5.75h5.5l1.4 2.6c.23.42.35.9.35 1.38v8.52a2.5 2.5 0 0 1-2.5 2.5h-4a2.5 2.5 0 0 1-2.5-2.5V9.73c0-.48.12-.96.35-1.38l1.4-2.6Z" />
      <path d="M7.5 12.75h9" />
    </>
  ),
  promotions: (
    <>
      <path d="M12.6 2.9 21 11.3a1.75 1.75 0 0 1 0 2.48l-7.22 7.22a1.75 1.75 0 0 1-2.48 0L2.9 12.6V4.65A1.75 1.75 0 0 1 4.65 2.9h7.95Z" />
      <circle cx="7.75" cy="7.75" r="1.5" />
    </>
  ),
  media: (
    <>
      <rect x="2.75" y="4.75" width="18.5" height="14.5" rx="2.4" />
      <circle cx="8.5" cy="10" r="1.75" />
      <path d="M3.5 17.25 9 12.25l3.4 3.1 3.1-2.6 5 4.5" />
    </>
  ),
  blog: (
    <>
      <path d="M4.75 20.5h4l10.4-10.4a2.05 2.05 0 0 0 0-2.9l-1.1-1.1a2.05 2.05 0 0 0-2.9 0L4.75 16.5v4Z" />
      <path d="M14.25 6.5l3.25 3.25" />
    </>
  ),
  announcements: (
    <>
      <path d="M4 9.5h3.5L15 5v14l-7.5-4.5H4a1.25 1.25 0 0 1-1.25-1.25v-2.5A1.25 1.25 0 0 1 4 9.5Z" />
      <path d="M18.25 9.25a4 4 0 0 1 0 5.5M6.75 15v4.25h2.75V16.6" />
    </>
  ),
  campaigns: (
    <>
      <rect x="2.75" y="5" width="18.5" height="14" rx="2.4" />
      <path d="m3.5 7.25 8.5 6 8.5-6" />
    </>
  ),
  analytics: (
    <>
      <path d="M3.25 20.5h17.5" />
      <rect x="4.75" y="12" width="3.5" height="6" rx="1.2" />
      <rect x="10.25" y="8" width="3.5" height="10" rx="1.2" />
      <rect x="15.75" y="4.25" width="3.5" height="13.75" rx="1.2" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M19.4 14.4a1.5 1.5 0 0 0 .3 1.65l.06.06a1.85 1.85 0 1 1-2.62 2.62l-.06-.06a1.5 1.5 0 0 0-1.65-.3 1.5 1.5 0 0 0-.91 1.37v.16a1.85 1.85 0 1 1-3.7 0v-.09a1.5 1.5 0 0 0-.98-1.37 1.5 1.5 0 0 0-1.65.3l-.06.06a1.85 1.85 0 1 1-2.62-2.62l.06-.06a1.5 1.5 0 0 0 .3-1.65 1.5 1.5 0 0 0-1.37-.91h-.16a1.85 1.85 0 1 1 0-3.7h.09a1.5 1.5 0 0 0 1.37-.98 1.5 1.5 0 0 0-.3-1.65l-.06-.06a1.85 1.85 0 1 1 2.62-2.62l.06.06a1.5 1.5 0 0 0 1.65.3h.07a1.5 1.5 0 0 0 .91-1.37v-.16a1.85 1.85 0 1 1 3.7 0v.09a1.5 1.5 0 0 0 .91 1.37 1.5 1.5 0 0 0 1.65-.3l.06-.06a1.85 1.85 0 1 1 2.62 2.62l-.06.06a1.5 1.5 0 0 0-.3 1.65v.07a1.5 1.5 0 0 0 1.37.91h.16a1.85 1.85 0 1 1 0 3.7h-.09a1.5 1.5 0 0 0-1.37.91Z" />
    </>
  ),
  tutorial: (
    <>
      <path d="M3.25 5.5A1.75 1.75 0 0 1 5 3.75h5.5a2.5 2.5 0 0 1 2.5 2.5v13a2 2 0 0 0-2-2H5a1.75 1.75 0 0 1-1.75-1.75V5.5Z" />
      <path d="M20.75 5.5A1.75 1.75 0 0 0 19 3.75h-5.5A2.5 2.5 0 0 0 11 6.25v13a2 2 0 0 1 2-2h6a1.75 1.75 0 0 0 1.75-1.75V5.5Z" />
    </>
  ),
  spec: (
    <>
      <path d="M13.75 2.75H7a2.25 2.25 0 0 0-2.25 2.25v14A2.25 2.25 0 0 0 7 21.25h10A2.25 2.25 0 0 0 19.25 19V8.25l-5.5-5.5Z" />
      <path d="M13.5 2.9V8.5h5.5M8.25 13h7.5M8.25 16.5h5" />
    </>
  ),
  today: (
    <>
      <circle cx="12" cy="12" r="8.75" />
      <path d="M12 7v5.25l3.25 2" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="8.75" />
      <path d="M9.6 9.4a2.5 2.5 0 0 1 4.86.83c0 1.67-2.5 2.5-2.5 2.5" />
      <path d="M12 16.75h.01" strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  catalog: (
    <>
      <rect x="3" y="3.5" width="7.5" height="7.5" rx="1.8" />
      <rect x="13.5" y="3.5" width="7.5" height="7.5" rx="1.8" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.8" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.8" />
    </>
  ),
  content: (
    <>
      <rect x="3.25" y="4.25" width="17.5" height="15.5" rx="2.4" />
      <path d="M7.25 9h9.5M7.25 12.5h9.5M7.25 16h5.5" />
    </>
  ),

  // ── Actions ──
  plus: <path d="M12 5.25v13.5M5.25 12h13.5" strokeLinecap="round" />,
  minus: <path d="M5.25 12h13.5" strokeLinecap="round" />,
  search: (
    <>
      <circle cx="10.75" cy="10.75" r="6.5" />
      <path d="m15.5 15.5 5 5" strokeLinecap="round" />
    </>
  ),
  filter: <path d="M3.5 5.75h17l-6.75 7.6v5.4l-3.5 2v-7.4L3.5 5.75Z" />,
  edit: (
    <>
      <path d="M4.75 20.5h4L19.4 9.85a2.05 2.05 0 0 0 0-2.9l-1.1-1.1a2.05 2.05 0 0 0-2.9 0L4.75 16.5v4Z" />
      <path d="M14.25 6.5l3.25 3.25" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 6.75h15M9.75 6.75V4.9a1.4 1.4 0 0 1 1.4-1.4h1.7a1.4 1.4 0 0 1 1.4 1.4v1.85" />
      <path d="M6.5 6.75 7.4 19.1a1.9 1.9 0 0 0 1.9 1.75h5.4a1.9 1.9 0 0 0 1.9-1.75l.9-12.35" />
      <path d="M10.25 10.5v6M13.75 10.5v6" />
    </>
  ),
  save: (
    <>
      <path d="M5.25 3.75h11l4 4v12.5H5.25V3.75Z" />
      <path d="M8.25 3.75h7.5v5h-7.5zM8.25 13.25h7.5v7h-7.5z" />
    </>
  ),
  check: <path d="m5 12.75 4.5 4.5L19 6.75" strokeLinecap="round" strokeLinejoin="round" />,
  close: <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />,
  chevronDown: <path d="m6.5 9.5 5.5 5.5 5.5-5.5" strokeLinecap="round" strokeLinejoin="round" />,
  chevronRight: <path d="m9.5 5.5 6.5 6.5-6.5 6.5" strokeLinecap="round" strokeLinejoin="round" />,
  chevronLeft: <path d="M14.5 5.5 8 12l6.5 6.5" strokeLinecap="round" strokeLinejoin="round" />,
  external: (
    <>
      <path d="M13.75 4.25h6v6M19.25 4.75 11 13" strokeLinecap="round" />
      <path d="M18.5 14v4.5a2.25 2.25 0 0 1-2.25 2.25H5.5A2.25 2.25 0 0 1 3.25 18.5V7.75A2.25 2.25 0 0 1 5.5 5.5H10" />
    </>
  ),
  refresh: (
    <>
      <path d="M20.25 12a8.25 8.25 0 1 1-2.6-6" strokeLinecap="round" />
      <path d="M20.5 4.25v5h-5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  bell: (
    <>
      <path d="M6 10a6 6 0 0 1 12 0c0 3.6.9 5.1 1.6 6H4.4C5.1 15.1 6 13.6 6 10Z" />
      <path d="M10 19.25a2.15 2.15 0 0 0 4 0" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" strokeWidth="2" strokeLinecap="round" />,
  more: <path d="M6.5 12h.01M12 12h.01M17.5 12h.01" strokeWidth="3" strokeLinecap="round" />,
  user: (
    <>
      <circle cx="12" cy="8.25" r="3.75" />
      <path d="M4.75 20.25c.85-3.9 3.5-6 7.25-6s6.4 2.1 7.25 6" />
    </>
  ),
  phone: (
    <path d="M8.4 3.75 10.5 8l-2 2a12.5 12.5 0 0 0 5.5 5.5l2-2 4.25 2.1v3.15a1.5 1.5 0 0 1-1.65 1.5C10.3 19.7 4.3 13.7 3.5 5.4A1.5 1.5 0 0 1 5 3.75h3.4Z" />
  ),
  mail: (
    <>
      <rect x="2.75" y="5" width="18.5" height="14" rx="2.4" />
      <path d="m3.5 7.25 8.5 6 8.5-6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.75" />
      <path d="M12 6.75V12l3.5 2.1" strokeLinecap="round" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.75" />
      <path d="M12 11v5.5" strokeLinecap="round" />
      <path d="M12 7.75h.01" strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  warning: (
    <>
      <path d="M10.5 3.9 2.9 17.1a1.75 1.75 0 0 0 1.5 2.65h15.2a1.75 1.75 0 0 0 1.5-2.65L13.5 3.9a1.75 1.75 0 0 0-3 0Z" />
      <path d="M12 9.5V14" strokeLinecap="round" />
      <path d="M12 17h.01" strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16.25V4.5M7.75 8.5 12 4.25l4.25 4.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 15.25v3.5a1.75 1.75 0 0 0 1.75 1.75h12.5A1.75 1.75 0 0 0 20 18.75v-3.5" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4.75" width="18" height="14.5" rx="2.4" />
      <circle cx="8.5" cy="10" r="1.6" />
      <path d="m3.75 17.5 5-4.5 3.4 3 3.2-2.6 4.9 4.1" />
    </>
  ),
  lock: (
    <>
      <rect x="4.75" y="10" width="14.5" height="10.25" rx="2.3" />
      <path d="M8.25 10V7.5a3.75 3.75 0 0 1 7.5 0V10" />
    </>
  ),
  link: (
    <>
      <path d="M10.25 13.75a3.75 3.75 0 0 0 5.65.4l2.6-2.6a3.75 3.75 0 0 0-5.3-5.3l-1.5 1.5" />
      <path d="M13.75 10.25a3.75 3.75 0 0 0-5.65-.4l-2.6 2.6a3.75 3.75 0 0 0 5.3 5.3l1.5-1.5" />
    </>
  ),
  logout: (
    <>
      <path d="M9.75 20.25H5.5a1.75 1.75 0 0 1-1.75-1.75V5.5A1.75 1.75 0 0 1 5.5 3.75h4.25" />
      <path d="M15.5 8.25 19.25 12l-3.75 3.75M19 12H9.25" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  money: (
    <>
      <rect x="2.75" y="5.75" width="18.5" height="12.5" rx="2.4" />
      <circle cx="12" cy="12" r="2.75" />
      <path d="M6.25 9.75v4.5M17.75 9.75v4.5" strokeLinecap="round" />
    </>
  ),
  trendUp: (
    <>
      <path d="m3.75 16.25 5-5 3.5 3.5 7-7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.25 7.75h4.5v4.5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  star: (
    <path d="m12 3.75 2.62 5.32 5.88.86-4.25 4.14 1 5.85L12 17.15l-5.25 2.77 1-5.85L3.5 9.93l5.88-.86L12 3.75Z" />
  ),
  sparkle: (
    <>
      <path d="M11 3.25 12.6 7.4 16.75 9 12.6 10.6 11 14.75 9.4 10.6 5.25 9 9.4 7.4 11 3.25Z" />
      <path d="M17.5 14.25l.85 2.15 2.15.85-2.15.85-.85 2.15-.85-2.15-2.15-.85 2.15-.85.85-2.15Z" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.75" />
      <path d="M3.5 12h17M12 3.25c2.4 2.5 3.6 5.4 3.6 8.75S14.4 18.25 12 20.75c-2.4-2.5-3.6-5.4-3.6-8.75S9.6 5.75 12 3.25Z" />
    </>
  ),
  eye: (
    <>
      <path d="M2.75 12S6.5 5.75 12 5.75 21.25 12 21.25 12 17.5 18.25 12 18.25 2.75 12 2.75 12Z" />
      <circle cx="12" cy="12" r="2.9" />
    </>
  ),
  list: (
    <>
      <path d="M9 6.5h11.25M9 12h11.25M9 17.5h11.25" strokeLinecap="round" />
      <path d="M4.25 6.5h.01M4.25 12h.01M4.25 17.5h.01" strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  grid: (
    <>
      <rect x="3.25" y="3.25" width="7.5" height="7.5" rx="1.8" />
      <rect x="13.25" y="3.25" width="7.5" height="7.5" rx="1.8" />
      <rect x="3.25" y="13.25" width="7.5" height="7.5" rx="1.8" />
      <rect x="13.25" y="13.25" width="7.5" height="7.5" rx="1.8" />
    </>
  ),
};

export const ADMIN_ICON_NAMES = Object.keys(ICON_PATHS);

export function hasAdminIcon(name) {
  return Object.prototype.hasOwnProperty.call(ICON_PATHS, name);
}

export default function AdminIcon({ name, size = 20, className = "", title, strokeWidth = 1.7, ...rest }) {
  const glyph = ICON_PATHS[name];
  if (!glyph) return null;

  return (
    <svg
      className={`admin-icon ${className}`.trim()}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : "true"}
      aria-label={title || undefined}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {glyph}
    </svg>
  );
}
