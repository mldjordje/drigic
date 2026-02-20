import Link from "next/link";

export const metadata = {
  title: "Dr Igic Admin",
};

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/bookings", label: "Termini" },
  { href: "/admin/services", label: "Usluge" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/vip", label: "VIP" },
  { href: "/booking", label: "Booking" },
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
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 20 }}>Dr Igic Admin Panel</h1>
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
          <Link
            href="/prijava?next=/admin"
            style={{
              color: "#102844",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 14,
              background: "#d9e8f8",
              border: "1px solid rgba(217,232,248,0.8)",
              borderRadius: 8,
              padding: "6px 10px",
            }}
          >
            Prijava
          </Link>
        </nav>
      </header>
      <main style={{ padding: 24 }}>{children}</main>
    </div>
  );
}

