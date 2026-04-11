import { and, count, eq, gte } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";
import { getDb, schema } from "@/lib/db/client";

export const dynamic = "force-dynamic";

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
  if (pathname.startsWith("/tretmani/")) {
    return "Tretmani";
  }
  if (pathname.startsWith("/project")) {
    return "Rezultati / projekti";
  }
  return pathname;
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("sr-RS")} EUR`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("sr-RS");
}

function formatPercent(value) {
  return `${Number(value || 0).toLocaleString("sr-RS", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })}%`;
}

function formatRatio(value) {
  return Number(value || 0).toLocaleString("sr-RS", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
}

function diffDays(from, to) {
  return Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

function buildTrend(current, previous) {
  if (!previous && !current) {
    return { label: "Bez promene", tone: "neutral" };
  }

  if (!previous) {
    return { label: `+${formatPercent(100)}`, tone: "positive" };
  }

  const delta = ((current - previous) / previous) * 100;
  if (Math.abs(delta) < 0.1) {
    return { label: "Bez promene", tone: "neutral" };
  }

  return {
    label: `${delta > 0 ? "+" : ""}${formatPercent(delta)}`,
    tone: delta > 0 ? "positive" : "negative",
  };
}

function getWindowBounds(now, days) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

async function getAnalyticsData() {
  noStore();

  const db = getDb();
  const now = new Date();
  const currentMonthKey = monthKey(startOfMonth(now));
  const currentMonthStart = startOfMonth(now);
  const last7dStart = getWindowBounds(now, 7);
  const last30dStart = getWindowBounds(now, 30);
  const prev30dStart = getWindowBounds(now, 60);

  const [
    [clientsCount],
    [newClients30d],
    [totalBookings],
    [completedBookings],
    bookings,
    pageViews,
  ] =
    await Promise.all([
      db.select({ value: count() }).from(schema.users).where(eq(schema.users.role, "client")),
      db
        .select({ value: count() })
        .from(schema.users)
        .where(and(eq(schema.users.role, "client"), gte(schema.users.createdAt, last30dStart))),
      db.select({ value: count() }).from(schema.bookings),
      db
        .select({ value: count() })
        .from(schema.bookings)
        .where(eq(schema.bookings.status, "completed")),
      db
        .select({
          id: schema.bookings.id,
          startsAt: schema.bookings.startsAt,
          createdAt: schema.bookings.createdAt,
          status: schema.bookings.status,
          totalPriceRsd: schema.bookings.totalPriceRsd,
        })
        .from(schema.bookings),
      db
        .select({
          pathname: schema.sitePageViews.pathname,
          sessionId: schema.sitePageViews.sessionId,
          createdAt: schema.sitePageViews.createdAt,
        })
        .from(schema.sitePageViews),
    ]);

  const monthBuckets = new Map();
  const activityDates = [];
  const lastRelevantMonth = startOfMonth(now);
  let maxDataMonth = lastRelevantMonth;

  let plannedRevenue = 0;
  let plannedBookings = 0;
  let thisMonthRevenue = 0;
  let thisMonthPlannedRevenue = 0;
  let thisMonthCancelled = 0;
  let next7dRevenue = 0;
  let next7dBookings = 0;
  let noShowCount = 0;
  let completedRevenue = 0;
  let completedLast30dRevenue = 0;
  let completedPrev30dRevenue = 0;
  let completedLast30dBookings = 0;
  let completedPrev30dBookings = 0;
  let currentMonthBookings = 0;

  for (const booking of bookings) {
    const startsAt = new Date(booking.startsAt);
    const amount = Number(booking.totalPriceRsd || 0);
    const key = monthKey(startsAt);

    activityDates.push(startsAt);
    if (startOfMonth(startsAt) > maxDataMonth) {
      maxDataMonth = startOfMonth(startsAt);
    }

    if (!monthBuckets.has(key)) {
      monthBuckets.set(key, {
        key,
        label: monthLabel(startsAt),
        realizedRevenue: 0,
        realizedBookings: 0,
        plannedRevenue: 0,
        plannedBookings: 0,
        cancelledBookings: 0,
        noShows: 0,
      });
    }

    const bucket = monthBuckets.get(key);
    const isUpcoming = startsAt >= now;

    if (key === currentMonthKey) {
      currentMonthBookings += 1;
    }

    if (booking.status === "completed") {
      completedRevenue += amount;
      bucket.realizedRevenue += amount;
      bucket.realizedBookings += 1;

      if (key === currentMonthKey) {
        thisMonthRevenue += amount;
      }

      if (startsAt >= last30dStart) {
        completedLast30dRevenue += amount;
        completedLast30dBookings += 1;
      } else if (startsAt >= prev30dStart) {
        completedPrev30dRevenue += amount;
        completedPrev30dBookings += 1;
      }
    }

    if (booking.status === "cancelled") {
      bucket.cancelledBookings += 1;
      if (key === currentMonthKey) {
        thisMonthCancelled += 1;
      }
    }

    if (booking.status === "no_show") {
      noShowCount += 1;
      bucket.noShows += 1;
    }

    if (["pending", "confirmed"].includes(booking.status) && isUpcoming) {
      plannedRevenue += amount;
      plannedBookings += 1;
      bucket.plannedRevenue += amount;
      bucket.plannedBookings += 1;

      if (key === currentMonthKey) {
        thisMonthPlannedRevenue += amount;
      }

      if (diffDays(now, startsAt) <= 7) {
        next7dRevenue += amount;
        next7dBookings += 1;
      }
    }
  }

  const pageViews30d = pageViews.filter((view) => new Date(view.createdAt) >= last30dStart);
  const pageViews7d = pageViews.filter((view) => new Date(view.createdAt) >= last7dStart);
  const pageViewsPrev30d = pageViews.filter((view) => {
    const createdAt = new Date(view.createdAt);
    return createdAt >= prev30dStart && createdAt < last30dStart;
  });

  for (const view of pageViews) {
    const createdAt = new Date(view.createdAt);
    activityDates.push(createdAt);
    if (startOfMonth(createdAt) > maxDataMonth) {
      maxDataMonth = startOfMonth(createdAt);
    }
  }

  const earliestActivity = activityDates.length
    ? activityDates.reduce((min, date) => (date < min ? date : min), activityDates[0])
    : now;
  const firstMonth = startOfMonth(earliestActivity);
  const lastMonth = maxDataMonth > lastRelevantMonth ? maxDataMonth : lastRelevantMonth;

  const months = [];
  for (
    let cursor = new Date(firstMonth);
    cursor <= lastMonth;
    cursor = addMonths(cursor, 1)
  ) {
    const key = monthKey(cursor);
    const bucket = monthBuckets.get(key) || {
      key,
      label: monthLabel(cursor),
      realizedRevenue: 0,
      realizedBookings: 0,
      plannedRevenue: 0,
      plannedBookings: 0,
      cancelledBookings: 0,
      noShows: 0,
    };

    if (
      months.length ||
      bucket.realizedRevenue ||
      bucket.plannedRevenue ||
      bucket.cancelledBookings ||
      bucket.noShows ||
      key === currentMonthKey
    ) {
      months.push(bucket);
    }
  }

  const maxRevenue = Math.max(
    1,
    ...months.map((month) => month.realizedRevenue + month.plannedRevenue)
  );

  const topPagesMap = new Map();
  pageViews30d.forEach((view) => {
    const current = topPagesMap.get(view.pathname) || 0;
    topPagesMap.set(view.pathname, current + 1);
  });

  const topPages = Array.from(topPagesMap.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 8)
    .map(([pathname, views]) => ({
      pathname,
      label: routeLabel(pathname),
      views,
      share: pageViews30d.length ? (views / pageViews30d.length) * 100 : 0,
    }));

  const uniqueVisitors30d = new Set(pageViews30d.map((view) => view.sessionId)).size;
  const uniqueVisitors7d = new Set(pageViews7d.map((view) => view.sessionId)).size;
  const pagesPerSession30d = uniqueVisitors30d ? pageViews30d.length / uniqueVisitors30d : 0;
  const avgCompletedTicket = completedBookings?.value
    ? completedRevenue / Number(completedBookings.value)
    : 0;
  const avgCompletedTicket30d = completedLast30dBookings
    ? completedLast30dRevenue / completedLast30dBookings
    : 0;
  const cancellationRate =
    totalBookings?.value && Number(totalBookings.value) > 0
      ? ((bookings.filter((item) => item.status === "cancelled").length || 0) /
          Number(totalBookings.value)) *
        100
      : 0;
  const completionRate =
    totalBookings?.value && Number(totalBookings.value) > 0
      ? (Number(completedBookings?.value || 0) / Number(totalBookings.value)) * 100
      : 0;
  const realizedMonths = months.filter((month) => month.realizedRevenue > 0);
  const bestMonth = realizedMonths.reduce(
    (best, month) => (month.realizedRevenue > (best?.realizedRevenue || 0) ? month : best),
    null
  );
  const avgMonthlyRevenue = realizedMonths.length
    ? realizedMonths.reduce((sum, month) => sum + month.realizedRevenue, 0) / realizedMonths.length
    : 0;
  const activeMonthCount = months.filter(
    (month) =>
      month.realizedRevenue ||
      month.plannedRevenue ||
      month.cancelledBookings ||
      month.noShows
  ).length;

  return {
    generatedAt: now,
    activityStart: earliestActivity,
    months,
    maxRevenue,
    topPages,
    trends: {
      revenue30d: buildTrend(completedLast30dRevenue, completedPrev30dRevenue),
      bookings30d: buildTrend(completedLast30dBookings, completedPrev30dBookings),
      views30d: buildTrend(pageViews30d.length, pageViewsPrev30d.length),
    },
    totals: {
      clients: Number(clientsCount?.value || 0),
      newClients30d: Number(newClients30d?.value || 0),
      bookings: Number(totalBookings?.value || 0),
      completedBookings: Number(completedBookings?.value || 0),
      completedRevenue,
      completedLast30dBookings,
      avgCompletedTicket,
      avgCompletedTicket30d,
      plannedRevenue,
      plannedBookings,
      thisMonthRevenue,
      thisMonthPlannedRevenue,
      currentMonthBookings,
      thisMonthCancelled,
      next7dRevenue,
      next7dBookings,
      noShowCount,
      pageViews30d: pageViews30d.length,
      pageViews7d: pageViews7d.length,
      uniqueVisitors30d,
      uniqueVisitors7d,
      pagesPerSession30d,
      cancellationRate,
      completionRate,
      cancelledBookings: bookings.filter((item) => item.status === "cancelled").length,
      bestMonth,
      avgMonthlyRevenue,
      activeMonthCount,
    },
  };
}

function toneColor(tone) {
  if (tone === "positive") {
    return "#7be0a1";
  }
  if (tone === "negative") {
    return "#ff9b9b";
  }
  return "#a8bdd5";
}

function StatCard({ title, value, hint, trend }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statTopRow}>
        <span style={styles.statTitle}>{title}</span>
        {trend ? (
          <span
            style={{
              ...styles.trendBadge,
              color: toneColor(trend.tone),
              borderColor: `${toneColor(trend.tone)}33`,
              background: `${toneColor(trend.tone)}14`,
            }}
          >
            {trend.label}
          </span>
        ) : null}
      </div>
      <strong style={styles.statValue}>{value}</strong>
      {hint ? <span style={styles.statHint}>{hint}</span> : null}
    </div>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div style={styles.sectionCard}>
      <div style={styles.sectionHeader}>
        <div>
          <h3 style={styles.sectionTitle}>{title}</h3>
          {subtitle ? <p style={styles.sectionSubtitle}>{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

function MonthRow({ month, maxRevenue }) {
  const realizedWidth = `${Math.max(
    6,
    ((month.realizedRevenue || 0) / maxRevenue) * 100
  )}%`;
  const plannedWidth = `${Math.max(
    month.plannedRevenue ? 6 : 0,
    ((month.plannedRevenue || 0) / maxRevenue) * 100
  )}%`;

  return (
    <div style={styles.monthRow}>
      <div style={styles.monthMeta}>
        <strong style={styles.monthLabel}>{month.label}</strong>
        <span style={styles.monthNumbers}>
          {formatMoney(month.realizedRevenue)} realizovano
          {month.plannedRevenue ? ` | ${formatMoney(month.plannedRevenue)} planirano` : ""}
        </span>
      </div>
      <div style={styles.monthBarWrap}>
        {month.realizedRevenue ? (
          <div
            style={{ ...styles.monthBar, width: realizedWidth, background: styles.realizedBar }}
          />
        ) : null}
        {month.plannedRevenue ? (
          <div style={{ ...styles.monthBar, width: plannedWidth, background: styles.plannedBar }} />
        ) : null}
      </div>
      <div style={styles.monthFoot}>
        <span>{formatNumber(month.realizedBookings)} zavrsenih</span>
        <span>{formatNumber(month.plannedBookings)} planiranih</span>
        <span>{formatNumber(month.cancelledBookings)} otkazanih</span>
        <span>{formatNumber(month.noShows)} no-show</span>
      </div>
    </div>
  );
}

function InsightCard({ label, value, caption, tone = "default" }) {
  return (
    <div
      style={{
        ...styles.insightCard,
        ...(tone === "accent"
          ? styles.insightCardAccent
          : tone === "success"
            ? styles.insightCardSuccess
            : tone === "warning"
              ? styles.insightCardWarning
              : null),
      }}
    >
      <span style={styles.insightLabel}>{label}</span>
      <strong style={styles.insightValue}>{value}</strong>
      <span style={styles.insightCaption}>{caption}</span>
    </div>
  );
}

export default async function AdminAnalitikaPage() {
  const analytics = await getAnalyticsData();

  return (
    <section style={styles.page}>
      <div style={styles.heroCard}>
        <div style={styles.heroText}>
          <span style={styles.eyebrow}>LIVE ADMIN ANALITIKA</span>
          <h2 style={styles.heroTitle}>Tacan pregled poslovanja i sajta u ovom trenutku</h2>
          <p style={styles.heroSubtitle}>
            Podaci se citaju direktno iz baze pri svakom otvaranju strane. Meseci pre prvog
            stvarnog podatka nisu prikazani, tako da tabela i trendovi pocinju tek od realnog
            starta aplikacije.
          </p>
        </div>
        <div style={styles.heroMeta}>
          <div style={styles.heroMetaCard}>
            <span style={styles.heroMetaLabel}>Obuhvat podataka</span>
            <strong style={styles.heroMetaValue}>
              {analytics.activityStart.toLocaleDateString("sr-RS")} -{" "}
              {analytics.generatedAt.toLocaleDateString("sr-RS")}
            </strong>
          </div>
          <div style={styles.heroMetaCard}>
            <span style={styles.heroMetaLabel}>Osvezeno</span>
            <strong style={styles.heroMetaValue}>
              {analytics.generatedAt.toLocaleString("sr-RS", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </strong>
          </div>
        </div>
      </div>

      <div style={styles.insightsGrid}>
        <InsightCard
          label="Najjaci mesec"
          value={
            analytics.totals.bestMonth
              ? formatMoney(analytics.totals.bestMonth.realizedRevenue)
              : "Nema jos"
          }
          caption={
            analytics.totals.bestMonth
              ? analytics.totals.bestMonth.label
              : "Ceka se prvi realizovan prihod"
          }
          tone="accent"
        />
        <InsightCard
          label="Prosek po aktivnom mesecu"
          value={formatMoney(analytics.totals.avgMonthlyRevenue)}
          caption={`${formatNumber(analytics.totals.activeMonthCount)} meseci sa aktivnoscu`}
        />
        <InsightCard
          label="Prosecna vrednost zavrsenog termina"
          value={formatMoney(analytics.totals.avgCompletedTicket)}
          caption={`${formatMoney(analytics.totals.avgCompletedTicket30d)} u poslednjih 30 dana`}
          tone="success"
        />
        <InsightCard
          label="Rast baze klijenata"
          value={formatNumber(analytics.totals.newClients30d)}
          caption="novih klijenata u poslednjih 30 dana"
          tone="warning"
        />
      </div>

      <div style={styles.statsGrid}>
        <StatCard
          title="Ukupna realizovana zarada"
          value={formatMoney(analytics.totals.completedRevenue)}
          hint={`${formatNumber(analytics.totals.completedBookings)} zavrsenih termina ukupno`}
          trend={analytics.trends.revenue30d}
        />
        <StatCard
          title="Planirana buduca zarada"
          value={formatMoney(analytics.totals.plannedRevenue)}
          hint={`${formatNumber(analytics.totals.plannedBookings)} buducih pending/confirmed termina`}
        />
        <StatCard
          title="Ovaj mesec"
          value={formatMoney(analytics.totals.thisMonthRevenue)}
          hint={`${formatMoney(analytics.totals.thisMonthPlannedRevenue)} jos planirano ovog meseca`}
        />
        <StatCard
          title="Pregledi sajta 30d"
          value={formatNumber(analytics.totals.pageViews30d)}
          hint={`${formatNumber(analytics.totals.uniqueVisitors30d)} jedinstvenih sesija`}
          trend={analytics.trends.views30d}
        />
        <StatCard
          title="Termini u narednih 7 dana"
          value={formatNumber(analytics.totals.next7dBookings)}
          hint={`${formatMoney(analytics.totals.next7dRevenue)} planiranog prihoda`}
        />
        <StatCard
          title="Stopa otkazivanja"
          value={formatPercent(analytics.totals.cancellationRate)}
          hint={`${formatNumber(analytics.totals.cancelledBookings)} otkazanih, ${formatNumber(
            analytics.totals.noShowCount
          )} no-show`}
        />
        <StatCard
          title="Stopa realizacije"
          value={formatPercent(analytics.totals.completionRate)}
          hint={`${formatNumber(analytics.totals.completedBookings)} od ${formatNumber(
            analytics.totals.bookings
          )} termina je zavrseno`}
          trend={analytics.trends.bookings30d}
        />
      </div>

      <div style={styles.twoColumn}>
        <SectionCard
          title="Mesecni tok prihoda"
          subtitle="Realizovano i planirano po mesecima, bez praznih meseci pre nastanka aplikacije."
        >
          <div style={styles.legendRow}>
            <span style={styles.legendItem}>
              <span style={{ ...styles.legendDot, background: styles.realizedBar }} />
              Realizovano
            </span>
            <span style={styles.legendItem}>
              <span style={{ ...styles.legendDot, background: styles.plannedBar }} />
              Planirano
            </span>
          </div>
          <div style={styles.monthsWrap}>
            {analytics.months.map((month) => (
              <MonthRow key={month.key} month={month} maxRevenue={analytics.maxRevenue} />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Operativni pregled"
          subtitle="Kratak pregled prometa, aktivnosti klijenata i kvaliteta zakazivanja."
        >
          <div style={styles.metricStack}>
            <div style={styles.metricRow}>
              <span>Ukupno termina ovog meseca</span>
              <strong>{formatNumber(analytics.totals.currentMonthBookings)}</strong>
            </div>
            <div style={styles.metricRow}>
              <span>Ukupno klijenata</span>
              <strong>{formatNumber(analytics.totals.clients)}</strong>
            </div>
            <div style={styles.metricRow}>
              <span>Novi klijenti poslednjih 30 dana</span>
              <strong>{formatNumber(analytics.totals.newClients30d)}</strong>
            </div>
            <div style={styles.metricRow}>
              <span>Ukupno termina</span>
              <strong>{formatNumber(analytics.totals.bookings)}</strong>
            </div>
            <div style={styles.metricRow}>
              <span>Zavrseni termini u poslednjih 30 dana</span>
              <strong>{formatNumber(analytics.totals.completedLast30dBookings)}</strong>
            </div>
            <div style={styles.metricRow}>
              <span>Otkazani ovog meseca</span>
              <strong>{formatNumber(analytics.totals.thisMonthCancelled)}</strong>
            </div>
            <div style={styles.metricRow}>
              <span>Pregledi sajta 7d</span>
              <strong>
                {formatNumber(analytics.totals.pageViews7d)} / {formatNumber(analytics.totals.uniqueVisitors7d)} sesija
              </strong>
            </div>
            <div style={styles.metricRow}>
              <span>Prosecno stranica po sesiji 30d</span>
              <strong>{formatRatio(analytics.totals.pagesPerSession30d)}</strong>
            </div>
          </div>
        </SectionCard>
      </div>

      <div style={styles.twoColumn}>
        <SectionCard
          title="Najgledanije stranice u poslednjih 30 dana"
          subtitle="Samo interni tracking iz baze, bez procena i bez Vercel dashboard aproksimacija."
        >
          {analytics.topPages.length ? (
            <div style={styles.pageList}>
              {analytics.topPages.map((page) => (
                <div key={page.pathname} style={styles.pageRow}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <strong style={styles.pageLabel}>{page.label}</strong>
                    <div style={styles.pagePath}>{page.pathname}</div>
                    <div style={styles.pageBarTrack}>
                      <div
                        style={{
                          ...styles.pageBarFill,
                          width: `${Math.max(10, page.share)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div style={styles.pageViews}>
                    <strong>{formatNumber(page.views)}</strong>
                    <span>{formatPercent(page.share)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={styles.emptyState}>
              Jos nema dovoljno internih pageview podataka. Ovaj blok ce se sam popuniti kako
              sajt prima posete.
            </p>
          )}
        </SectionCard>

        <SectionCard
          title="Napomene o tacnosti"
          subtitle="Sta ova strana meri, a sta namerno ne procenjuje."
        >
          <div style={styles.notesList}>
            <p style={styles.noteItem}>
              Prihod se racuna iz vrednosti termina u bazi. Zavrseni termini ulaze u realizovano,
              a buduci `pending` i `confirmed` ulaze u plan.
            </p>
            <p style={styles.noteItem}>
              Meseci pre prvog stvarnog booking ili analytics zapisa nisu prikazani, pa nema
              laznih nula za period kada aplikacija nije bila aktivna.
            </p>
            <p style={styles.noteItem}>
              Interne metrike sajta dolaze iz `site_page_views` tabele. Vercel Analytics ostaje
              koristan za dodatnu spoljasnju verifikaciju, ali ova strana prikazuje samo ono sto
              je trenutno u bazi.
            </p>
          </div>
        </SectionCard>
      </div>
    </section>
  );
}

const styles = {
  page: {
    display: "grid",
    gap: 18,
  },
  heroCard: {
    display: "grid",
    gap: 16,
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    padding: 24,
    borderRadius: 28,
    background:
      "linear-gradient(135deg, rgba(15,24,38,0.98) 0%, rgba(20,42,70,0.96) 55%, rgba(14,28,44,0.96) 100%)",
    border: "1px solid rgba(143, 182, 224, 0.22)",
    boxShadow: "0 22px 50px rgba(4, 10, 18, 0.28)",
  },
  heroText: {
    display: "grid",
    gap: 10,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "#8bb8e7",
    fontWeight: 700,
  },
  heroTitle: {
    margin: 0,
    fontSize: 34,
    lineHeight: 1.08,
    color: "#f4f8ff",
  },
  heroSubtitle: {
    margin: 0,
    color: "#c0d2e8",
    maxWidth: 760,
    lineHeight: 1.7,
  },
  heroMeta: {
    display: "grid",
    gap: 12,
    alignContent: "start",
  },
  heroMetaCard: {
    display: "grid",
    gap: 6,
    padding: 16,
    borderRadius: 20,
    background: "rgba(8, 16, 28, 0.42)",
    border: "1px solid rgba(167, 198, 230, 0.16)",
  },
  heroMetaLabel: {
    fontSize: 12,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#8aa9c8",
  },
  heroMetaValue: {
    color: "#f5f8fd",
    fontSize: 16,
    lineHeight: 1.4,
  },
  statsGrid: {
    display: "grid",
    gap: 14,
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  },
  insightsGrid: {
    display: "grid",
    gap: 14,
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  },
  insightCard: {
    display: "grid",
    gap: 8,
    padding: 18,
    borderRadius: 22,
    background: "linear-gradient(180deg, rgba(15,25,39,0.96) 0%, rgba(11,19,30,0.96) 100%)",
    border: "1px solid rgba(143, 179, 214, 0.12)",
    boxShadow: "0 14px 28px rgba(4, 10, 18, 0.14)",
  },
  insightCardAccent: {
    background:
      "linear-gradient(180deg, rgba(29,48,76,0.96) 0%, rgba(18,31,50,0.96) 100%)",
  },
  insightCardSuccess: {
    background:
      "linear-gradient(180deg, rgba(18,47,47,0.96) 0%, rgba(12,31,32,0.96) 100%)",
  },
  insightCardWarning: {
    background:
      "linear-gradient(180deg, rgba(57,42,18,0.96) 0%, rgba(37,27,12,0.96) 100%)",
  },
  insightLabel: {
    fontSize: 12,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#9fb8d6",
  },
  insightValue: {
    fontSize: 28,
    lineHeight: 1.05,
    color: "#f5f9ff",
  },
  insightCaption: {
    color: "#c4d4e5",
    fontSize: 13,
    lineHeight: 1.6,
  },
  statCard: {
    display: "grid",
    gap: 10,
    padding: 18,
    borderRadius: 24,
    background:
      "linear-gradient(180deg, rgba(18,30,46,0.92) 0%, rgba(13,22,34,0.92) 100%)",
    border: "1px solid rgba(141, 177, 214, 0.16)",
    boxShadow: "0 14px 28px rgba(4, 10, 18, 0.16)",
  },
  statTopRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
  },
  statTitle: {
    color: "#9db8d6",
    fontSize: 13,
  },
  statValue: {
    fontSize: 30,
    lineHeight: 1.05,
    color: "#f3f8ff",
  },
  statHint: {
    color: "#c2d4e8",
    fontSize: 13,
    lineHeight: 1.6,
  },
  trendBadge: {
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    whiteSpace: "nowrap",
  },
  twoColumn: {
    display: "grid",
    gap: 16,
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  },
  sectionCard: {
    padding: 22,
    borderRadius: 26,
    background: "linear-gradient(180deg, rgba(14,21,33,0.96) 0%, rgba(11,18,28,0.96) 100%)",
    border: "1px solid rgba(142, 176, 212, 0.14)",
    boxShadow: "0 18px 34px rgba(4, 10, 18, 0.18)",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "start",
    marginBottom: 18,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 22,
    color: "#f4f8ff",
  },
  sectionSubtitle: {
    margin: "6px 0 0",
    color: "#aebfd4",
    lineHeight: 1.6,
  },
  legendRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 18,
  },
  legendItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "#b5c7dc",
    fontSize: 13,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  monthsWrap: {
    display: "grid",
    gap: 14,
  },
  monthRow: {
    display: "grid",
    gap: 8,
    padding: 14,
    borderRadius: 18,
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(146, 181, 214, 0.1)",
  },
  monthMeta: {
    display: "grid",
    gap: 4,
  },
  monthLabel: {
    color: "#f2f7ff",
    fontSize: 16,
  },
  monthNumbers: {
    color: "#b1c5dc",
    fontSize: 13,
  },
  monthBarWrap: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    minHeight: 10,
  },
  monthBar: {
    height: 10,
    borderRadius: 999,
  },
  realizedBar: "linear-gradient(90deg, #7eb8ff 0%, #4f82ff 100%)",
  plannedBar: "linear-gradient(90deg, #88e0b4 0%, #4dbb8c 100%)",
  monthFoot: {
    display: "flex",
    flexWrap: "wrap",
    gap: 14,
    color: "#8fa8c4",
    fontSize: 12,
  },
  metricStack: {
    display: "grid",
    gap: 12,
  },
  metricRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
    padding: "14px 16px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.025)",
    border: "1px solid rgba(143, 179, 214, 0.1)",
    color: "#d7e5f4",
  },
  pageList: {
    display: "grid",
    gap: 12,
  },
  pageRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
    padding: "14px 16px",
    borderRadius: 18,
    background: "rgba(255,255,255,0.025)",
    border: "1px solid rgba(143, 179, 214, 0.1)",
  },
  pageLabel: {
    display: "block",
    color: "#f3f8ff",
    marginBottom: 4,
  },
  pagePath: {
    color: "#8ea6c2",
    fontSize: 12,
    wordBreak: "break-all",
  },
  pageBarTrack: {
    height: 8,
    borderRadius: 999,
    background: "rgba(255,255,255,0.06)",
    marginTop: 10,
    overflow: "hidden",
  },
  pageBarFill: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, #84b7ff 0%, #6fe3d0 100%)",
  },
  pageViews: {
    display: "grid",
    justifyItems: "end",
    color: "#c4d6ea",
    fontSize: 12,
    whiteSpace: "nowrap",
  },
  notesList: {
    display: "grid",
    gap: 12,
  },
  noteItem: {
    margin: 0,
    padding: "14px 16px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.025)",
    border: "1px solid rgba(143, 179, 214, 0.1)",
    color: "#c7d7e8",
    lineHeight: 1.7,
  },
  emptyState: {
    margin: 0,
    color: "#b2c7de",
    lineHeight: 1.7,
  },
};
