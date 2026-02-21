"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

function fmtDateTime(value) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString("sr-RS");
}

export default function AdminClientsPage() {
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
        throw new Error(data?.message || "Neuspesno ucitavanje klijenata.");
      }
      setClients(data.data || []);
      setTotal(Number(data.pagination?.total || 0));
    } catch (loadError) {
      setError(loadError.message || "Greska pri ucitavanju klijenata.");
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
        throw new Error(clientData?.message || "Neuspesno ucitavanje klijenta.");
      }
      if (!passRes.ok || !passData?.ok) {
        throw new Error(passData?.message || "Neuspesno ucitavanje beauty pass podataka.");
      }

      setDetailPayload({
        client: clientData.data || null,
        beautyPass: passData,
      });
    } catch (detailLoadError) {
      setDetailError(detailLoadError.message || "Greska pri ucitavanju detalja klijenta.");
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, [page]);

  function onSearchSubmit(event) {
    event.preventDefault();
    setPage(1);
    loadClients({ searchValue: search, pageValue: 1 });
  }

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <div className="admin-card">
        <h2 style={{ marginTop: 0 }}>Klijenti</h2>
        <p style={{ color: "#bfd2e9" }}>
          Mobile-first kartice klijenata i popup sa kompletnim detaljima + Beauty Pass istorijom.
        </p>

        <form onSubmit={onSearchSubmit} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            className="admin-inline-input"
            style={{ width: "min(460px, 100%)", marginTop: 0 }}
            placeholder="Pretraga: ime, email ili telefon"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="submit" className="admin-template-link-btn" disabled={loading}>
            Pretrazi
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
            Reset
          </button>
        </form>
      </div>

      {error ? <p style={{ color: "#ffabab", margin: 0 }}>{error}</p> : null}

      <div className="admin-clients-grid">
        {clients.map((client) => (
          <article key={client.id} className="admin-card admin-client-card">
            <div className="admin-client-card-head">
              <div>
                <strong>{client.profile?.fullName || "Bez imena"}</strong>
                <div style={mutedTextStyle}>{client.role === "admin" ? "admin nalog" : "klijent"}</div>
              </div>
              <span className={`admin-client-role ${client.role === "admin" ? "is-admin" : ""}`}>
                {client.role}
              </span>
            </div>

            <div style={mutedTextStyle}>{client.email}</div>
            <div style={mutedTextStyle}>{client.phone || "bez telefona"}</div>

            <div className="admin-client-metrics">
              <span>Termini: {client.stats?.totalBookings || 0}</span>
              <span>Sledeci: {client.stats?.upcomingBookings || 0}</span>
              <span>Beauty pass: {client.stats?.treatmentRecords || 0}</span>
              <span>Dug: {client.stats?.debtRsd || 0} RSD</span>
            </div>

            <div style={mutedTextStyle}>
              Poslednji login:{" "}
              {client.lastLoginAt ? new Date(client.lastLoginAt).toLocaleString("sr-RS") : "Nikad"}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                className="admin-template-link-btn"
                onClick={() => openClientDetails(client.id)}
              >
                Pregled klijenta
              </button>
              <Link href={`/admin/klijenti/${client.id}`} className="admin-template-link-btn">
                Puni profil
              </Link>
            </div>
          </article>
        ))}
      </div>

      {!clients.length && !loading ? (
        <div className="admin-card">
          <p style={{ margin: 0, color: "#d8e4f2" }}>Nema rezultata.</p>
        </div>
      ) : null}

      <div className="admin-card" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          className="admin-template-link-btn"
          disabled={page <= 1 || loading}
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
        >
          Prethodna
        </button>
        <span style={{ color: "#c2d4ea" }}>
          Strana {page} / {Math.max(Math.ceil(total / limit), 1)}
        </span>
        <button
          type="button"
          className="admin-template-link-btn"
          disabled={!hasMore || loading}
          onClick={() => setPage((prev) => prev + 1)}
        >
          Sledeca
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
              <h3 style={{ margin: 0 }}>Detalji klijenta</h3>
              <button
                type="button"
                className="admin-template-link-btn"
                onClick={() => {
                  setActiveClientId("");
                  setDetailPayload(null);
                  setDetailError("");
                }}
              >
                Zatvori
              </button>
            </div>

            {detailLoading ? <p style={{ marginTop: 10 }}>Ucitavanje...</p> : null}
            {detailError ? <p style={{ marginTop: 10, color: "#ffabab" }}>{detailError}</p> : null}

            {!detailLoading && !detailError && detailPayload ? (
              <div className="admin-calendar-details" style={{ marginTop: 12 }}>
                <div>
                  <span>Ime i prezime</span>
                  <strong>{activeClientProfile?.fullName || "Bez imena"}</strong>
                </div>
                <div>
                  <span>Email / telefon</span>
                  <strong>
                    {detailPayload.client?.email || "-"} / {detailPayload.client?.phone || "-"}
                  </strong>
                </div>
                <div>
                  <span>Sledeci termini</span>
                  <strong>{activeBeautyPass?.upcomingBookings?.length || 0}</strong>
                </div>
                <div>
                  <span>Beauty Pass zapisi</span>
                  <strong>{activeBeautyPass?.treatmentHistory?.length || 0}</strong>
                </div>

                <div>
                  <span>Zakazani termini</span>
                  <div style={listWrapStyle}>
                    {(activeBeautyPass?.upcomingBookings || []).slice(0, 6).map((item) => (
                      <div key={item.id} style={listItemStyle}>
                        <strong>{fmtDateTime(item.startsAt)}</strong>
                        <span>{item.serviceSummary || "-"}</span>
                        <span>Status: {item.status}</span>
                      </div>
                    ))}
                    {!activeBeautyPass?.upcomingBookings?.length ? (
                      <span style={mutedTextStyle}>Nema zakazanih termina.</span>
                    ) : null}
                  </div>
                </div>

                <div>
                  <span>Beauty Pass istorija</span>
                  <div style={listWrapStyle}>
                    {(activeBeautyPass?.treatmentHistory || []).slice(0, 8).map((item) => (
                      <div key={item.id} style={listItemStyle}>
                        <strong>{fmtDateTime(item.treatmentDate)}</strong>
                        <span>{item.notes || "Bez napomene"}</span>
                        {item.product?.name ? <span>Preparat: {item.product.name}</span> : null}
                      </div>
                    ))}
                    {!activeBeautyPass?.treatmentHistory?.length ? (
                      <span style={mutedTextStyle}>Nema unosa u Beauty Pass-u.</span>
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
                  Otvori puni profil
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
