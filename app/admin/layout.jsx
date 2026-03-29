import AdminShell from "@/components/admin/AdminShell";
import "./admin-template.css";

export const metadata = {
  title: "Dr Igic Admin",
  manifest: "/admin.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/icons/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    title: "Dr Igic Admin",
    statusBarStyle: "default",
  },
};

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
