import AdminShell from "@/components/admin/AdminShell";
import "./admin-template.css";
import { ADMIN_SITE_NAME } from "@/lib/site";

export const metadata = {
  title: {
    default: ADMIN_SITE_NAME,
    template: `%s | ${ADMIN_SITE_NAME}`,
  },
  description: "Admin panel za upravljanje sadržajem i terminima klinike.",
  manifest: "/admin.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/icons/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    title: ADMIN_SITE_NAME,
    statusBarStyle: "default",
  },
};

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
