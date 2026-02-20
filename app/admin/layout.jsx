import AdminShell from "@/components/admin/AdminShell";
import "./admin-template.css";

export const metadata = {
  title: "Dr Igic Admin",
};

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}

