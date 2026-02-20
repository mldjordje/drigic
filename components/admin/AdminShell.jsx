"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const approvedModules = [
  { href: "/admin", label: "Dashboard", icon: "[DB]" },
  { href: "/admin/bookings", label: "Termini", icon: "[BK]" },
  { href: "/admin/services", label: "Usluge", icon: "[SV]" },
  { href: "/admin/announcements", label: "Obavestenja", icon: "[AN]" },
  { href: "/admin/media", label: "Media", icon: "[MD]" },
  { href: "/admin/vip", label: "VIP", icon: "[VIP]" },
];

const lockedModules = [
  { label: "Zaposleni", reason: "Nije odobreno" },
  { label: "Finansije", reason: "Nije odobreno" },
  { label: "Skladiste preparata", reason: "Nije odobreno" },
  { label: "Napredna analitika", reason: "Nije odobreno" },
];

export default function AdminShell({ children }) {
  const pathname = usePathname();

  return (
    <div className="admin-template-root">
      <aside className="admin-template-sidebar">
        <div className="admin-template-brand">
          <h1>Dr Igic</h1>
          <p>Control Panel</p>
        </div>

        <div className="admin-template-group">
          <p className="admin-template-group-title">Odobrene funkcije</p>
          <nav className="admin-template-nav">
            {approvedModules.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`admin-template-nav-item ${active ? "is-active" : ""}`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="admin-template-group">
          <p className="admin-template-group-title">Zakljucano</p>
          <div className="admin-template-nav">
            {lockedModules.map((item) => (
              <button
                key={item.label}
                type="button"
                className="admin-template-nav-item is-locked"
                disabled
                title={`${item.label} - ${item.reason}`}
              >
                <span>[LOCK]</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="admin-template-main">
        <header className="admin-template-topbar">
          <div>
            <h2>Admin panel</h2>
            <p>Google auth aktivan, neodobrene funkcije su zakljucane.</p>
          </div>

          <div className="admin-template-topbar-actions">
            <Link href="/booking" className="admin-template-link-btn">
              Booking forma
            </Link>
            <Link href="/api/auth/google?next=/admin" className="admin-template-link-btn">
              Promeni nalog
            </Link>
          </div>
        </header>

        <main className="admin-template-content">{children}</main>
      </div>
    </div>
  );
}
