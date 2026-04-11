import { count, eq, gte } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";

const MONTHS_TO_SHOW = 6;

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, offset) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function monthKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function monthLabel(date) {
  return date.toLocaleDateString("sr-RS", {
    month: "long",
    year: "numeric",
  });
}

function routeLabel(pathname) {
  if (pathname === "/") {
    return "Pocetna";
  }
  return pathname;
}

async function getAnalyticsData() {
  const db = getDb();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const analyticsStart = addMonths(monthStart, -(MONTHS_TO_SHOW - 1));
  const viewsWindowStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    bookings,
    pageViews,
    [clientsCount],
    [totalBookings],
    [completedBookings],
  ] = await Promise.all([
    db
      .select({
        id: schema.bookings.id,
        startsAt: schema.bookings.startsAt,
        status: schema.bookings.status,
        totalPriceRsd: schema.bookings.totalPriceRsd,
      })
      .from(schema.bookings)
      .where(gte(schema.bookings.startsAt, analyticsStart)),
    db
      .select({
        pathname: schema.sitePageViews.pathname,
        sessionId: schema.sitePageViews.sessionId,
        createdAt: schema.sitePageViews.createdAt,
      })
      .from(schema.sitePageViews)
      .where(gte(schema.sitePageViews.createdAt, viewsWindowStart)),
    db.select({ value: count() }).from(schema.users).where(eq(schema.users.role, "client")),
    db.select({ value: count() }).from(schema.bookings),
    db
      .select({ value: count() })
      .from(schema.bookings)
      .where(eq(schema.bookings.status, "completed")),
  ]);

  const months = Array.from({ length: MONTHS_TO_SHOW }, (_, index) => {
    const date = addMonths(monthStart, index - (MONTHS_TO_SHOW - 1));
    return {
      key: monthKey(date),
      label: monthLabel(date),
      realizedRevenue: 0,
      realizedBookings: 0,
      plannedRevenue: 0,
      plannedBookings: 0,
      cancelledBookings: 0,
    };
  });

  const monthMap = new Map(months.map((item) => [item.key, item]));
  let plannedRevenue = 0;
  let plannedBookings = 0;
  let thisMonthRevenue = 0;
  let thisMonthCancelled = 0;

  bookings.forEach((booking) => {
    const date = new Date(booking.startsAt);
    const key = monthKey(date);
    const bucket = monthMap.get(key);
    const amount = Number(booking.totalPriceRsd || 0);
    const isUpcoming = date >= now;

    if (bucket && booking.status === "completed") {
      bucket.realizedRevenue += amount;
      bucket.realizedBookings += 1;
    }

    if (bucket && booking.status === "cancelled") {
      bucket.cancelledBookings += 1;
    }

    if (["pending", "confirmed"].includes(booking.status) && isUpcoming) {
      plannedRevenue += amount;
      plannedBookings += 1;
      if (bucket) {
        bucket.plannedRevenue += amount;
        bucket.plannedBookings += 1;
      }
    }

    if (key === monthKey(monthStart) && booking.status === "completed") {
      thisMonthRevenue += amount;
    }

    if (key === monthKey(monthStart) && booking.status === "cancelled") {
      thisMonthCancelled += 1;
    }
  });

  const uniqueSessions = new Set(pageViews.map((view) => view.sessionId)).size;
  const topPagesMap = new Map();
  pageViews.forEach((view) => {
    const current = topPagesMap.get(view.pathname) || 0;
    topPagesMap.set(view.pathname, current + 1);
  });

  const topPages = Array.from(topPagesMap.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([pathname, views]) => ({
      pathname,
      label: routeLabel(pathname),
      views,
    }));

  return {
    totals: {
      clients: clientsCount?.value || 0,
      bookings: totalBookings?.value || 0,
      completedBookings: completedBookings?.value || 0,
      plannedRevenue,
      plannedBookings,
      thisMonthRevenue,
      thisMonthCancelled,
      pageViews30d: pageViews.length,
      uniqueVisitors30d: uniqueSessions,
    },
    months,
    topPages,
  };
}

function StatCard({ title, value, hint }) {
  return (
    <div className="admin-card" style={{ display: "grid", gap: 8 }}>
      <span style={{ color: "#9fb8d8", fontSize: 13 }}>{title}</span>
      <strong style={{ fontSize: 28, lineHeight: 1.1 }}>{value}</strong>
      {hint ? <span style={{ color: "#bcd0e5", fontSize: 13 }}>{hint}</span> : null}
    </div>
  );
}

export default async function AdminAnalitikaPage() {
  const analytics = await getAnalyticsData();

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <div className="admin-card">
        <h2 style={{ marginTop: 0 }}>Admin analitika</h2>
        <p style={{ color: "#c6d7ef", marginBottom: 0 }}>
          Poslovne brojke iz baze, pregledi sajta iz internog trackinga i aktivna Vercel
          observability integracija.
        </p>
      </div>

      <div className="admin-card-grid">
        <StatCard
          title="Planirana zarada"
          value={`${analytics.totals.plannedRevenue} EUR`}
          hint={`${analytics.totals.plannedBookings} buducih termina sa statusom pending/confirmed`}
        />
        <StatCard
          title="Prihod ovog meseca"
          value={`${analytics.totals.thisMonthRevenue} EUR`}
          hint="Realizovano kroz completed termine"
        />
        <StatCard
          title="Pregledi sajta 30d"
          value={analytics.totals.pageViews30d}
          hint={`${analytics.totals.uniqueVisitors30d} jedinstvenih sesija`}
        />
        <StatCard
          title="Ukupno klijenata"
          value={analytics.totals.clients}
          hint={`${analytics.totals.bookings} ukupnih termina u sistemu`}
        />
      </div>

      <div className="admin-card">
        <h3 style={{ marginTop: 0 }}>Mesecna zarada i plan</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Mesec</th>
                <th style={thStyle}>Realizovana zarada</th>
                <th style={thStyle}>Realizovani termini</th>
                <th style={thStyle}>Planirana zarada</th>
                <th style={thStyle}>Planirani termini</th>
                <th style={thStyle}>Otkazani</th>
              </tr>
            </thead>
            <tbody>
              {analytics.months.map((month) => (
                <tr key={month.key}>
                  <td style={tdStyle}>{month.label}</td>
                  <td style={tdStyle}>{month.realizedRevenue} EUR</td>
                  <td style={tdStyle}>{month.realizedBookings}</td>
                  <td style={tdStyle}>{month.plannedRevenue} EUR</td>
                  <td style={tdStyle}>{month.plannedBookings}</td>
                  <td style={tdStyle}>{month.cancelledBookings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-card-grid">
        <div className="admin-card">
          <h3 style={{ marginTop: 0 }}>Najgledanije stranice 30d</h3>
          {analytics.topPages.length ? (
            <div style={{ display: "grid", gap: 10 }}>
              {analytics.topPages.map((page) => (
                <div
                  key={page.pathname}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(217,232,248,0.12)",
                    background: "rgba(12,21,33,0.38)",
                  }}
                >
                  <span>{page.label}</span>
                  <strong>{page.views}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ marginBottom: 0, color: "#bcd0e5" }}>
              Jos nema zabelezenih pregleda. Podaci pocinju da se pune nakon deploy-a i
              prvih poseta sajtu.
            </p>
          )}
        </div>

        <div className="admin-card">
          <h3 style={{ marginTop: 0 }}>Vercel analytics</h3>
          <p style={{ color: "#c6d7ef" }}>
            Paketi <code>@vercel/analytics</code> i <code>@vercel/speed-insights</code> su
            ukljuceni u root layout, pa ce Vercel dashboard automatski prikupljati pageview i
            performance podatke nakon sledeceg production deploy-a.
          </p>
          <p style={{ color: "#9fb8d8", marginBottom: 0 }}>
            Ova admin strana prikazuje interne brojke iz baze, dok detaljan Vercel pregled
            ostaje dostupan u Vercel dashboardu.
          </p>
        </div>
      </div>
    </section>
  );
}

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 760,
};

const thStyle = {
  textAlign: "left",
  padding: "12px 10px",
  fontSize: 12,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "#9fb8d8",
  borderBottom: "1px solid rgba(217,232,248,0.14)",
};

const tdStyle = {
  padding: "12px 10px",
  color: "#eef4fb",
  borderBottom: "1px solid rgba(217,232,248,0.08)",
};
