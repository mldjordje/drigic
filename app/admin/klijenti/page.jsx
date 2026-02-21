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

export default function AdminClientsPage() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(30);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasMore = useMemo(() => page * limit < total, [limit, page, total]);

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
          Pregled klijenata, dugovanja, istorija tretmana i detalji beauty pass-a.
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

      <div className="admin-card" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 980, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Klijent</th>
              <th style={thStyle}>Kontakt</th>
              <th style={thStyle}>Termini</th>
              <th style={thStyle}>Beauty Pass</th>
              <th style={thStyle}>Dug</th>
              <th style={thStyle}>Poslednji login</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td style={tdStyle}>
                  <strong>{client.profile?.fullName || "Bez imena"}</strong>
                  <div style={mutedTextStyle}>{client.id}</div>
                </td>
                <td style={tdStyle}>
                  <div>{client.email}</div>
                  <div style={mutedTextStyle}>{client.phone || "bez telefona"}</div>
                </td>
                <td style={tdStyle}>
                  <div>Ukupno: {client.stats?.totalBookings || 0}</div>
                  <div style={mutedTextStyle}>Sledeci: {client.stats?.upcomingBookings || 0}</div>
                </td>
                <td style={tdStyle}>{client.stats?.treatmentRecords || 0} zapisa</td>
                <td style={tdStyle}>{client.stats?.debtRsd || 0} RSD</td>
                <td style={tdStyle}>
                  {client.lastLoginAt
                    ? new Date(client.lastLoginAt).toLocaleString("sr-RS")
                    : "Nikad"}
                </td>
                <td style={tdStyle}>
                  <Link href={`/admin/klijenti/${client.id}`} className="admin-template-link-btn">
                    Otvori profil
                  </Link>
                </td>
              </tr>
            ))}
            {!clients.length && !loading ? (
              <tr>
                <td style={tdStyle} colSpan={7}>
                  Nema rezultata.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="admin-card" style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
    </section>
  );
}

const thStyle = {
  textAlign: "left",
  borderBottom: "1px solid rgba(217,232,248,0.2)",
  padding: "8px 6px",
};

const tdStyle = {
  borderBottom: "1px solid rgba(217,232,248,0.12)",
  padding: "8px 6px",
  verticalAlign: "top",
};

const mutedTextStyle = {
  color: "#a8bed8",
  fontSize: 12,
};
