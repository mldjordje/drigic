"use client";

import { useEffect, useMemo, useState } from "react";
import AdminIcon from "@/components/admin/ui/AdminIcon";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminSection from "@/components/admin/ui/AdminSection";
import AdminField from "@/components/admin/ui/AdminField";
import AdminEmptyState from "@/components/admin/ui/AdminEmptyState";
import AdminStatusMessage from "@/components/admin/ui/AdminStatusMessage";

const statusOptions = ["pending", "approved", "rejected"];

async function parseError(response, fallback) {
  try {
    const data = await response.json();
    return data?.message || fallback;
  } catch {
    return fallback;
  }
}

export default function AdminVipPage() {
  const [settings, setSettings] = useState({ basePriceRsd: 0, notes: "" });
  const [requests, setRequests] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadVipData() {
    const [settingsRes, requestsRes] = await Promise.all([
      fetch("/api/admin/vip-settings"),
      fetch("/api/admin/vip-requests"),
    ]);

    if (!settingsRes.ok) {
      throw new Error(await parseError(settingsRes, "Neuspešno učitavanje VIP settings."));
    }
    if (!requestsRes.ok) {
      throw new Error(await parseError(requestsRes, "Neuspešno učitavanje VIP zahteva."));
    }

    const settingsData = await settingsRes.json();
    const requestsData = await requestsRes.json();

    const nextSettings = settingsData?.data || { basePriceRsd: 0, notes: "" };
    const nextRequests = requestsData?.data || [];

    setSettings({
      basePriceRsd: Number(nextSettings.basePriceRsd || 0),
      notes: nextSettings.notes || "",
    });
    setRequests(nextRequests);

    const statusMap = {};
    nextRequests.forEach((item) => {
      statusMap[item.id] = item.status;
    });
    setSelectedStatus(statusMap);
  }

  useEffect(() => {
    loadVipData().catch((err) => setError(err.message));
  }, []);

  async function saveSettings(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/vip-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          basePriceRsd: Number(settings.basePriceRsd) || 0,
          notes: settings.notes,
        }),
      });

      if (!response.ok) {
        throw new Error(await parseError(response, "Neuspešno čuvanje VIP settings."));
      }

      setMessage("VIP settings su sačuvani.");
      await loadVipData();
    } catch (err) {
      setError(err.message || "Greška pri čuvanju settings.");
    } finally {
      setLoading(false);
    }
  }

  async function updateRequest(item) {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/vip-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          status: selectedStatus[item.id] || item.status,
          note: "Updated from admin VIP panel",
        }),
      });

      if (!response.ok) {
        throw new Error(await parseError(response, "Neuspešno ažuriranje VIP zahteva."));
      }

      setMessage("VIP zahtev je ažuriran.");
      await loadVipData();
    } catch (err) {
      setError(err.message || "Greška pri ažuriranju VIP zahteva.");
    } finally {
      setLoading(false);
    }
  }

  const counters = useMemo(() => {
    return {
      pending: requests.filter((item) => item.status === "pending").length,
      approved: requests.filter((item) => item.status === "approved").length,
      rejected: requests.filter((item) => item.status === "rejected").length,
    };
  }, [requests]);

  return (
    <section className="admin-page">
      <AdminPageHeader
        icon="vip"
        title="VIP tretmani"
        description="Podesi osnovnu VIP cenu i obradi zahteve koje klijenti pošalju sa VIP forme."
      />

      {message ? <AdminStatusMessage tone="success" toneLabel="Uspeh">{message}</AdminStatusMessage> : null}
      {error ? <AdminStatusMessage tone="error" toneLabel="Greška">{error}</AdminStatusMessage> : null}

      <div className="admin-stat-grid">
        <div className="admin-stat-card admin-stat-card--amber">
          <span className="admin-stat-card-icon" aria-hidden="true"><AdminIcon name="clock" size={18} /></span>
          <span className="admin-stat-card-label">Na čekanju</span>
          <strong className="admin-stat-card-value">{counters.pending}</strong>
        </div>
        <div className="admin-stat-card admin-stat-card--green">
          <span className="admin-stat-card-icon" aria-hidden="true"><AdminIcon name="check" size={18} /></span>
          <span className="admin-stat-card-label">Odobreno</span>
          <strong className="admin-stat-card-value">{counters.approved}</strong>
        </div>
        <div className="admin-stat-card admin-stat-card--rose">
          <span className="admin-stat-card-icon" aria-hidden="true"><AdminIcon name="close" size={18} /></span>
          <span className="admin-stat-card-label">Odbijeno</span>
          <strong className="admin-stat-card-value">{counters.rejected}</strong>
        </div>
      </div>

      <AdminSection
        icon="settings"
        title="VIP podešavanja"
        description="Cena i napomena koje klijent vidi na VIP formi na sajtu."
      >
        <form onSubmit={saveSettings} style={{ display: "grid", gap: 12 }}>
          <div className="admin-form-grid">
            <AdminField
              icon="money"
              label="Osnovna VIP cena (RSD)"
              hint="Polazna cena VIP termina. Konačnu cenu i dalje potvrđujete ručno po zahtevu."
              required
            >
              <input
                className="admin-inline-input"
                type="number"
                min={0}
                value={settings.basePriceRsd}
                onChange={(event) =>
                  setSettings((prev) => ({ ...prev, basePriceRsd: event.target.value }))
                }
              />
            </AdminField>
          </div>
          <AdminField
            icon="edit"
            label="Napomena"
            hint="Kratak tekst uz VIP ponudu — npr. šta je uključeno i koliko traje termin."
            optional
          >
            <textarea
              className="admin-inline-textarea"
              rows={4}
              value={settings.notes}
              onChange={(event) => setSettings((prev) => ({ ...prev, notes: event.target.value }))}
            />
          </AdminField>
          <div className="admin-btn-row">
            <button type="submit" className="admin-btn admin-btn--primary" disabled={loading}>
              <AdminIcon name="save" size={16} />
              Sačuvaj podešavanja
            </button>
          </div>
        </form>
      </AdminSection>

      <AdminSection
        icon="list"
        title="VIP zahtevi"
        description="Promeni status zahteva i sačuvaj — klijent dobija obaveštenje o ishodu."
      >
        {requests.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table" style={{ minWidth: 760 }}>
              <thead>
                <tr>
                  <th>Datum zahteva</th>
                  <th>Traženi datum</th>
                  <th>Korisnik</th>
                  <th>Poruka</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {requests.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.createdAt).toLocaleString("sr-RS")}</td>
                    <td>
                      {item.requestedDate
                        ? new Date(item.requestedDate).toLocaleString("sr-RS")
                        : "-"}
                    </td>
                    <td>{item.userId}</td>
                    <td>{item.message || "-"}</td>
                    <td>
                      <select
                        className="admin-inline-input"
                        aria-label="Status zahteva"
                        style={{ marginTop: 0, minWidth: 140 }}
                        value={selectedStatus[item.id] || item.status}
                        onChange={(event) =>
                          setSelectedStatus((prev) => ({ ...prev, [item.id]: event.target.value }))
                        }
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-btn admin-btn--sm"
                        disabled={loading}
                        onClick={() => updateRequest(item)}
                      >
                        <AdminIcon name="save" size={15} />
                        Sačuvaj
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminEmptyState
            icon="vip"
            title="Još nema VIP zahteva"
            description="Zahtevi poslati sa VIP forme na sajtu pojaviće se ovde."
          />
        )}
      </AdminSection>
    </section>
  );
}
