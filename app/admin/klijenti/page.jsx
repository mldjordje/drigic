"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/common/LocaleProvider";

function parseResponse(response) {
  return response
    .text()
    .then((text) => {
      if (!text) {
        return null;
      }
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    })
    .catch(() => null);
}

export default function AdminClientsPage() {
  const { t, intlLocale } = useLocale();
  const fmtDateTime = (value) => {
    if (!value) {
      return "-";
    }
    return new Date(value).toLocaleString(intlLocale);
  };
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(30);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [activeClientId, setActiveClientId] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailPayload, setDetailPayload] = useState(null);

  const hasMore = useMemo(() => page * limit < total, [limit, page, total]);
  const activeClientProfile = detailPayload?.client?.profile || null;
  const activeBeautyPass = detailPayload?.beautyPass || null;

  async function loadClients({ searchValue = search, pageValue = page } = {}) {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(pageValue),
        limit: String(limit),
      });
      if (searchValue.trim()) {
        params.set("search", searchValue.trim());
      }
      const response = await fetch(`/api/admin/clients?${params.toString()}`);
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || t("admin.cli.loadFailed"));
      }
      setClients(data.data || []);
      setTotal(Number(data.pagination?.total || 0));
    } catch (loadError) {
      setError(loadError.message || t("admin.cli.genericError"));
    } finally {
      setLoading(false);
    }
  }

  async function openClientDetails(clientId) {
    setActiveClientId(clientId);
    setDetailLoading(true);
    setDetailError("");
    setDetailPayload(null);

    try {
      const [clientRes, passRes] = await Promise.all([
        fetch(`/api/admin/clients/${clientId}`),
        fetch(`/api/admin/clients/${clientId}/beauty-pass`),
      ]);
      const [clientData, passData] = await Promise.all([
        parseResponse(clientRes),
        parseResponse(passRes),
      ]);

      if (!clientRes.ok || !clientData?.ok) {
        throw new Error(clientData?.message || t("admin.cli.loadFailed"));
      }
      if (!passRes.ok || !passData?.ok) {
        throw new Error(passData?.message || t("admin.cli.loadFailed"));
      }

      setDetailPayload({
        client: clientData.data || null,
        beautyPass: passData,
      });
    } catch (detailLoadError) {
      setDetailError(detailLoadError.message || t("admin.cli.genericError"));
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, [page]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }
    if (!activeClientId) {
      return undefined;
    }
    const html = document.documentElement;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [activeClientId]);

  function onSearchSubmit(event) {
    event.preventDefault();
    setPage(1);
    loadClients({ searchValue: search, pageValue: 1 });
  }

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <div className="admin-card">
        <h2 style={{ marginTop: 0 }}>{t("admin.cli.title")}</h2>
        <p style={{ color: "#bfd2e9" }}>
          {t("admin.cli.subtitle")}
        </p>

        <form onSubmit={onSearchSubmit} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            className="admin-inline-input"
            style={{ width: "min(460px, 100%)", marginTop: 0 }}
            placeholder={t("admin.cli.searchPlaceholder")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="submit" className="admin-template-link-btn" disabled={loading}>
            {t("admin.cli.search")}
          </button>
          <button
            type="button"
            className="admin-template-link-btn"
            onClick={() => {
              setSearch("");
              setPage(1);
              loadClients({ searchValue: "", pageValue: 1 });
            }}
            disabled={loading}
          >
            {t("admin.cli.reset")}
          </button>
        </form>
      </div>

      {error ? <p style={{ color: "#ffabab", margin: 0 }}>{error}</p> : null}

      <div className="admin-clients-grid">
        {clients.map((client) => (
          <article key={client.id} className="admin-card admin-client-card">
            <div className="admin-client-card-head">
              <div>
                <strong>{client.profile?.fullName || t("admin.cli.noName")}</strong>
                <div style={mutedTextStyle}>{client.role === "admin" ? t("admin.cli.adminAccount") : t("admin.cli.clientLabel")}</div>
              </div>
              <span className={`admin-client-role ${client.role === "admin" ? "is-admin" : ""}`}>
                {client.role}
              </span>
            </div>

            <div style={mutedTextStyle}>{client.email}</div>
            <div style={mutedTextStyle}>{client.phone || t("admin.cli.noPhone")}</div>

            <div className="admin-client-metrics">
              <span>{t("admin.cli.bookings")}: {client.stats?.totalBookings || 0}</span>
              <span>{t("admin.cli.upcoming")}: {client.stats?.upcomingBookings || 0}</span>
              <span>{t("admin.cli.beautyPass")}: {client.stats?.treatmentRecords || 0}</span>
              <span>{t("admin.cli.debt")}: {client.stats?.debtRsd || 0} RSD</span>
            </div>

            <div style={mutedTextStyle}>
              {t("admin.cli.lastLogin")}:{" "}
              {client.lastLoginAt ? new Date(client.lastLoginAt).toLocaleString(intlLocale) : t("admin.cli.never")}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                className="admin-template-link-btn"
                onClick={() => openClientDetails(client.id)}
              >
                {t("admin.cli.viewClient")}
              </button>
              <Link href={`/admin/klijenti/${client.id}`} className="admin-template-link-btn">
                {t("admin.cli.fullProfile")}
              </Link>
            </div>
          </article>
        ))}
      </div>

      {!clients.length && !loading ? (
        <div className="admin-card">
          <p style={{ margin: 0, color: "#d8e4f2" }}>{t("admin.cli.noResults")}</p>
        </div>
      ) : null}

      <div className="admin-card" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          className="admin-template-link-btn"
          disabled={page <= 1 || loading}
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
        >
          {t("admin.cli.prev")}
        </button>
        <span style={{ color: "#c2d4ea" }}>
          {t("admin.cli.page")} {page} / {Math.max(Math.ceil(total / limit), 1)}
        </span>
        <button
          type="button"
          className="admin-template-link-btn"
          disabled={!hasMore || loading}
          onClick={() => setPage((prev) => prev + 1)}
        >
          {t("admin.cli.next")}
        </button>
      </div>

      {activeClientId ? (
        <div className="admin-calendar-modal" role="dialog" aria-modal="true">
          <div
            className="admin-calendar-modal-backdrop"
            onClick={() => {
              setActiveClientId("");
              setDetailPayload(null);
              setDetailError("");
            }}
          />
          <div className="admin-card admin-calendar-modal-card">
            <div className="admin-calendar-modal-head">
              <h3 style={{ margin: 0 }}>{t("admin.cli.detailsTitle")}</h3>
              <button
                type="button"
                className="admin-template-link-btn"
                onClick={() => {
                  setActiveClientId("");
                  setDetailPayload(null);
                  setDetailError("");
                }}
              >
                {t("admin.cli.close")}
              </button>
            </div>

            {detailLoading ? <p style={{ marginTop: 10 }}>{t("admin.cli.loading")}</p> : null}
            {detailError ? <p style={{ marginTop: 10, color: "#ffabab" }}>{detailError}</p> : null}

            {!detailLoading && !detailError && detailPayload ? (
              <div className="admin-calendar-details" style={{ marginTop: 12 }}>
                <div>
                  <span>{t("admin.cli.name")}</span>
                  <strong>{activeClientProfile?.fullName || t("admin.cli.noName")}</strong>
                </div>
                <div>
                  <span>{t("admin.cli.emailPhone")}</span>
                  <strong>
                    {detailPayload.client?.email || "-"} / {detailPayload.client?.phone || "-"}
                  </strong>
                </div>
                <div>
                  <span>{t("admin.cli.upcomingAppts")}</span>
                  <strong>{activeBeautyPass?.upcomingBookings?.length || 0}</strong>
                </div>
                <div>
                  <span>{t("admin.cli.bpRecords")}</span>
                  <strong>{activeBeautyPass?.treatmentHistory?.length || 0}</strong>
                </div>

                <div>
                  <span>{t("admin.cli.scheduledAppts")}</span>
                  <div style={listWrapStyle}>
                    {(activeBeautyPass?.upcomingBookings || []).slice(0, 6).map((item) => (
                      <div key={item.id} style={listItemStyle}>
                        <strong>{fmtDateTime(item.startsAt)}</strong>
                        <span>{item.serviceSummary || "-"}</span>
                        <span>{t("admin.cli.statusLabel")}: {t(`admin.status.${item.status}`)}</span>
                      </div>
                    ))}
                    {!activeBeautyPass?.upcomingBookings?.length ? (
                      <span style={mutedTextStyle}>{t("admin.cli.noScheduled")}</span>
                    ) : null}
                  </div>
                </div>

                <div>
                  <span>{t("admin.cli.bpHistory")}</span>
                  <div style={listWrapStyle}>
                    {(activeBeautyPass?.treatmentHistory || []).slice(0, 8).map((item) => (
                      <div key={item.id} style={listItemStyle}>
                        <strong>{fmtDateTime(item.treatmentDate)}</strong>
                        <span>{item.notes || t("admin.cli.noNote")}</span>
                        {item.product?.name ? <span>{t("admin.cli.product")}: {item.product.name}</span> : null}
                      </div>
                    ))}
                    {!activeBeautyPass?.treatmentHistory?.length ? (
                      <span style={mutedTextStyle}>{t("admin.cli.noBpEntries")}</span>
                    ) : null}
                  </div>
                </div>

                <Link
                  href={`/admin/klijenti/${activeClientId}`}
                  className="admin-template-link-btn"
                  onClick={() => {
                    setActiveClientId("");
                    setDetailPayload(null);
                    setDetailError("");
                  }}
                >
                  {t("admin.cli.openFullProfile")}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

const mutedTextStyle = {
  color: "#a8bed8",
  fontSize: 12,
};

const listWrapStyle = {
  display: "grid",
  gap: 8,
  marginTop: 6,
};

const listItemStyle = {
  display: "grid",
  gap: 2,
  border: "1px solid rgba(217,232,248,0.2)",
  borderRadius: 10,
  padding: "8px 9px",
  background: "rgba(9,16,27,0.42)",
};
