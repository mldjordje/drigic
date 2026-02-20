import Link from "next/link";

export const metadata = {
  title: "Dr Igić Admin",
};

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/bookings", label: "Termini" },
  { href: "/admin/services", label: "Usluge" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/vip", label: "VIP" },
];

export default function AdminLayout({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0A0C00", color: "#f2f5fb" }}>
      <header
        style={{
          borderBottom: "1px solid rgba(217,232,248,0.25)",
          padding: "18px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 20 }}>Dr Igić Admin Panel</h1>
        <nav style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                color: "#d9e8f8",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main style={{ padding: 24 }}>{children}</main>
    </div>
  );
}

