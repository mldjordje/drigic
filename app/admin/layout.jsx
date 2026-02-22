import AdminShell from "@/components/admin/AdminShell";
import "./admin-template.css";

export const metadata = {
  title: "Dr Igic Admin",
  manifest: "/admin.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Dr Igic Admin",
    statusBarStyle: "default",
  },
};

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
